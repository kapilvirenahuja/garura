#!/usr/bin/env python3
"""kb-search v1 engine — manifest + fetch over the markdown KB.

This is the V1 grep-backed reader. It only serves STRUCTURE; the MODEL does the
matching by reasoning over each learning's Conditions. Swappable later for a
`kb` CLI over a server (same commands, same output shape) — see
core/components/memory/knowledge/_DESIGN.md.

Commands:
  index            Emit the manifest as JSON: one entry per learning with id,
                   title, conditions facets, evolve_when, provenance, path.
  get <id>         Emit the full markdown of one learning.
  grep <terms...>  Emit ids of learnings whose text contains ALL terms
                   (coarse pre-filter only — NOT the matcher).

KB root resolution order: --kb-root, then $KB_ROOT, then a path next to this
script's deployment, then the repo source path.
"""
import argparse
import glob
import json
import os
import sys


def parse_frontmatter(text):
    """Minimal YAML-frontmatter parser for our controlled format.

    Handles: top-level scalars, one nested map (conditions), one nested list
    (evolve_when). Avoids a yaml dependency on purpose.
    """
    if not text.startswith("---"):
        return {}, text
    lines = text.split("\n")
    close = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            close = i
            break
    if close is None:
        return {}, text
    fm_lines = lines[1:close]
    body = "\n".join(lines[close + 1:])
    data = {}
    cur = None  # current top-level key whose nested block we're reading
    for raw in fm_lines:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip())
        line = raw.strip()
        if indent == 0:
            if line.endswith(":"):
                cur = line[:-1].strip()
                data[cur] = {}  # tentative; becomes list if items are "- "
            else:
                key, _, val = line.partition(":")
                data[key.strip()] = val.strip().strip('"')
                cur = None
        else:
            if cur is None:
                continue
            if line.startswith("- "):
                if not isinstance(data[cur], list):
                    data[cur] = []
                data[cur].append(line[2:].strip().strip('"'))
            else:
                if not isinstance(data[cur], dict):
                    data[cur] = {}
                key, _, val = line.partition(":")
                data[cur][key.strip()] = val.strip().strip('"')
    return data, body


def resolve_kb_root(arg):
    if arg:
        return arg
    if os.environ.get("KB_ROOT"):
        return os.environ["KB_ROOT"]
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        # deployed: skills/kb-search/scripts/ -> ../../../memory/knowledge
        os.path.normpath(os.path.join(here, "..", "..", "..", "memory", "knowledge")),
        # repo source, run from root
        "core/components/memory/knowledge",
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    return "core/components/memory/knowledge"


def iter_learnings(root):
    for path in sorted(glob.glob(os.path.join(root, "**", "*.md"), recursive=True)):
        if os.path.basename(path).startswith("_"):
            continue  # skip _index, _TEMPLATE, _DESIGN
        with open(path, encoding="utf-8") as f:
            text = f.read()
        fm, body = parse_frontmatter(text)
        yield path, fm, body


def _id_of(root, path, fm):
    rel = os.path.relpath(path, root)
    return fm.get("id") or rel[:-3]


def _norm_list(v):
    if isinstance(v, list):
        return v
    return []  # an empty tentative dict means "no items"


def cmd_index(root):
    manifest = []
    for path, fm, _body in iter_learnings(root):
        manifest.append({
            "id": _id_of(root, path, fm),
            "title": fm.get("title", ""),
            "conditions": fm.get("conditions", {}) if isinstance(fm.get("conditions"), dict) else {},
            "evolve_when": _norm_list(fm.get("evolve_when")),
            "provenance": fm.get("provenance", ""),
            "path": os.path.relpath(path, root),
        })
    print(json.dumps(manifest, indent=2))


def cmd_get(root, target):
    for path, fm, _body in iter_learnings(root):
        rel = os.path.relpath(path, root)
        if target in (_id_of(root, path, fm), rel, rel[:-3]):
            with open(path, encoding="utf-8") as f:
                sys.stdout.write(f.read())
            return
    sys.exit("kb-search: not found: %s" % target)


def cmd_grep(root, terms):
    terms = [t.lower() for t in terms]
    hits = []
    for path, fm, _body in iter_learnings(root):
        with open(path, encoding="utf-8") as f:
            text = f.read().lower()
        if all(t in text for t in terms):
            hits.append(_id_of(root, path, fm))
    print("\n".join(hits))


def main():
    p = argparse.ArgumentParser(description="kb-search v1 engine")
    p.add_argument("--kb-root", default=None)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("index")
    g = sub.add_parser("get")
    g.add_argument("id")
    gr = sub.add_parser("grep")
    gr.add_argument("terms", nargs="+")
    args = p.parse_args()
    root = resolve_kb_root(args.kb_root)
    if args.cmd == "index":
        cmd_index(root)
    elif args.cmd == "get":
        cmd_get(root, args.id)
    elif args.cmd == "grep":
        cmd_grep(root, args.terms)


if __name__ == "__main__":
    main()
