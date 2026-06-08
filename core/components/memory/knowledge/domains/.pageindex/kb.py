#!/usr/bin/env python3
"""
KB interface — the stable seam garura's play -> agent -> skill chain calls.

It wraps the reused pageindex backend and exposes three verbs as JSON:
  search "<keywords>"   -> candidate shelf sections (the entry hint)
  read <node_id>        -> a section's full text (for the skill to reason over)
  rebuild               -> regenerate the index from the shelves

Transport-agnostic by design: the ONLY transport-aware part is the small backend
block below (it reads the local pageindex index file and the shelf sources). When
the KB later moves behind a server, replace that block with HTTP calls — the verbs
and the JSON shapes do NOT change, so no play/agent/skill upstream is touched.

Today's backend = the local pageindex index produced by pageindex.py in this folder.
"""

import os
import re
import sys
import json
import glob
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
PAGEINDEX = os.path.join(HERE, "pageindex.py")


# --------------------------------------------------------------------------
# Backend (the only transport-aware part). Today: local pageindex index file.
# --------------------------------------------------------------------------

def _index_path():
    matches = sorted(glob.glob(os.path.join(HERE, "*.json")))
    return matches[0] if matches else None


def _load_index():
    path = _index_path()
    if not path or not os.path.exists(path):
        raise SystemExit(json.dumps(
            {"error": "index missing — run: python3 kb.py rebuild"}))
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _flatten(doc):
    """Flatten a document's node tree into (node, path) in source order."""
    out = []

    def walk(nodes, path):
        for n in nodes:
            p = f"{path} > {n['title']}" if path else n["title"]
            out.append((n, p))
            walk(n.get("nodes", []), p)

    walk(doc.get("structure", []), "")
    return out


def _domain_of(doc_name):
    return os.path.basename(doc_name).replace(".md", "")


# --------------------------------------------------------------------------
# Verbs (stable contract — JSON in, JSON out)
# --------------------------------------------------------------------------

def rebuild():
    """Regenerate the index by reusing pageindex's builder."""
    proc = subprocess.run(
        [sys.executable, PAGEINDEX],
        capture_output=True, text=True, cwd=HERE,
    )
    idx = _load_index() if _index_path() else {}
    return {
        "ok": proc.returncode == 0,
        "files": idx.get("file_count"),
        "built_at": idx.get("indexed_at"),
    }


def _frontmatter(path):
    """The YAML frontmatter block (between the first pair of --- lines)."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except OSError:
        return ""
    if not lines or lines[0].strip() != "---":
        return ""
    body = []
    for ln in lines[1:]:
        if ln.strip() == "---":
            break
        body.append(ln)
    return "".join(body)


def _trigger_of(front):
    m = re.search(r'trigger:\s*"?(.*?)"?\s*$', front, re.M)
    return m.group(1).strip() if m else ""


def domains():
    """List all domains with their frontmatter trigger — the PRIMARY routing entry.

    With only ~10 domains, routing does NOT narrow by keyword; the reasoner sees the
    whole small set and reasons which domain a piece of work belongs to, then read()s
    that domain's Capabilities to drill to capability/functionality. This is the
    reasoning-first (tree-nav) path — keyword search() is only a secondary hint.
    """
    index = _load_index()
    out = []
    for doc in index.get("documents", []):
        src = os.path.join(index["root"], doc["doc_name"])
        struct = doc.get("structure", [])
        out.append({
            "domain": _domain_of(doc["doc_name"]),
            "title": struct[0]["title"] if struct else _domain_of(doc["doc_name"]),
            "trigger": _trigger_of(_frontmatter(src)),
            "root_node_id": struct[0]["node_id"] if struct else None,
        })
    return {"domains": out, "count": len(out)}


def search(query, top=8):
    """Keyword entry hint (SECONDARY): candidate shelf sections by term hits in the
    section preview. Coarse on purpose — the cross-linked shelves make keyword
    matching noisy, which is why domains()+reasoning is the primary path. Use this
    only as a hint, never as the decision.
    """
    index = _load_index()
    terms = [t for t in re.findall(r"\w+", query.lower()) if len(t) >= 2]
    if not terms:
        terms = [query.lower().strip()]

    results = []
    for doc in index.get("documents", []):
        for node, path in _flatten(doc):
            hay = (path + " " + node.get("preview", "")).lower()
            hits = sum(hay.count(t) for t in terms)
            if hits:
                results.append({
                    "node_id": node["node_id"],
                    "domain": _domain_of(doc["doc_name"]),
                    "path": path,
                    "preview": node.get("preview", "")[:200].replace("\n", " "),
                    "hits": hits,
                })

    results.sort(key=lambda r: -r["hits"])
    return {"query": query, "candidates": results[:top], "unmatched": not results}


def read(node_id):
    """Full text of a section, read from the shelf source on demand."""
    index = _load_index()
    for doc in index.get("documents", []):
        flat = _flatten(doc)
        for i, (node, path) in enumerate(flat):
            if node["node_id"] == node_id:
                start = node["line_num"]
                end = flat[i + 1][0]["line_num"] if i + 1 < len(flat) else None
                src = os.path.join(index["root"], doc["doc_name"])
                with open(src, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                text = "".join(lines[start - 1:(end - 1) if end else None]).strip()
                return {
                    "node_id": node_id,
                    "domain": _domain_of(doc["doc_name"]),
                    "title": node["title"],
                    "path": path,
                    "text": text,
                }
    return {"error": f"node {node_id} not found"}


def shelf(name):
    """Full markdown of one domain shelf — the input for the skill's second
    reasoning step (reason over Capabilities to pick capability + functionality).
    Shelves are small, so reasoning over the whole shelf is reliable.
    """
    index = _load_index()
    for doc in index.get("documents", []):
        if _domain_of(doc["doc_name"]) == name:
            src = os.path.join(index["root"], doc["doc_name"])
            with open(src, "r", encoding="utf-8") as f:
                return {"domain": name, "text": f.read()}
    return {"error": f"domain {name} not found"}


VERBS = {"domains": domains, "shelf": shelf, "search": search,
         "read": read, "rebuild": rebuild}


def main(argv):
    if not argv or argv[0] not in VERBS:
        print(json.dumps({"error": "usage: kb.py {domains|shelf <domain>|search <q>|read <node_id>|rebuild}"}))
        return 2
    verb, rest = argv[0], argv[1:]
    if verb == "rebuild":
        result = rebuild()
    elif verb == "domains":
        result = domains()
    elif verb == "shelf":
        if not rest:
            print(json.dumps({"error": "shelf needs a domain name"}))
            return 2
        result = shelf(rest[0])
    elif verb == "search":
        if not rest:
            print(json.dumps({"error": "search needs a query"}))
            return 2
        result = search(" ".join(rest))
    elif verb == "read":
        if not rest:
            print(json.dumps({"error": "read needs a node_id"}))
            return 2
        result = read(rest[0])
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
