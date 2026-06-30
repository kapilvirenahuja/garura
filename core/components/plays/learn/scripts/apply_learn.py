#!/usr/bin/env python3
"""
apply_learn.py — persist /learn's approved updates, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. /learn updates only the model's MEANING. This
writes exactly, and nothing else:

  1. spine meaning fields on the nodes the manifest names:
       - capability/functionality `one_line`  (refined descriptor)
       - capability `nfr_needs[<dim>].level`  (monotonic-up) OR profile `nfr[<dim>].level`
       - capability/functionality `status`    (earned promotion)
       - the node's `decisions` list           (append new ids; never remove/reorder)
  2. rewritten grounding docs the manifest names (allowlisted relative paths; overwrite-in-kind)
  3. new decision records (`decisions/<id>.yaml`, skip-if-exists — an accepted decision is never
     edited in place)

It refuses any node the manifest does not name, any skeleton change (id/slug/parent), any slice or
epic rewrite, and any nfr level that would fall. check_apply_learn.py (Step 5) verifies the
allowlist held. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_learn.py --draft <draft_dir> --manifest <learn-manifest.yaml> \
        --product-base <product_base> --decided-by /learn --date <YYYY-MM-DD> \
        --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage/parse error.
"""

import argparse
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_learn.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]
MEANING_FIELDS = {"one_line", "nfr_needs", "status"}


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def find(entries, eid):
    for e in entries:
        if isinstance(e, dict) and e.get("id") == eid:
            return e
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /learn on a fixed allowlist.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--decided-by", default="/learn")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    draft_root = os.path.join(args.draft, "product-os")
    spine_path = os.path.join(live_root, "_spine.yaml")
    for p in (spine_path, args.manifest):
        if not os.path.isfile(p):
            sys.stderr.write(f"apply_learn.py: missing input {p}\n")
            return 2

    live = load(spine_path)
    manifest = load(args.manifest)
    caps = live.setdefault("capabilities", [])
    funcs = live.setdefault("functionalities", [])
    profile = live.setdefault("profile", {})

    written, changed = [], {"nodes": [], "decisions": [], "docs": []}

    # --- 1. spine meaning-field mutations on manifest-named nodes -----------------
    for c in manifest.get("changes") or []:
        ref, kind, field = c.get("node_ref"), c.get("node_kind"), c.get("field")
        if field not in MEANING_FIELDS:
            sys.stderr.write(f"apply_learn.py: field '{field}' is not a meaning field — refusing\n")
            return 2
        if kind == "capability":
            node = find(caps, ref)
        elif kind == "functionality":
            node = find(funcs, ref)
        elif kind == "profile":
            node = profile
        else:
            sys.stderr.write(f"apply_learn.py: node_kind '{kind}' not allowed (allowlist)\n")
            return 2
        if node is None:
            sys.stderr.write(f"apply_learn.py: node '{ref}' ({kind}) not found in spine\n")
            return 2

        if field == "one_line":
            node["one_line"] = c.get("to")
        elif field == "status":
            node["status"] = c.get("to")
        elif field == "nfr_needs":
            dim = c.get("dimension")
            if not dim:
                sys.stderr.write("apply_learn.py: nfr_needs change needs a 'dimension'\n")
                return 2
            target = node.setdefault("nfr_needs" if kind == "capability" else "nfr", {})
            slot = target.setdefault(dim, {})
            if rank(c.get("to")) < rank(slot.get("level")):
                sys.stderr.write(f"apply_learn.py: nfr '{dim}' on '{ref}' would fall — refusing\n")
                return 2
            slot["level"] = c.get("to")
        changed["nodes"].append({"ref": ref, "kind": kind, "field": field})

    # --- 2. rewritten grounding docs (allowlisted relative paths) ----------------
    for d in manifest.get("docs") or []:
        rel = d.get("rel")
        if not rel:
            continue
        src = os.path.join(args.draft, rel) if os.path.isfile(os.path.join(args.draft, rel)) \
            else os.path.join(draft_root, os.path.relpath(rel, "product-os")) \
            if rel.startswith("product-os") else os.path.join(draft_root, rel)
        if not os.path.isfile(src):
            sys.stderr.write(f"apply_learn.py: draft doc missing: {rel}\n")
            return 2
        dst = os.path.join(args.product_base, rel) if rel.startswith("product-os") \
            else os.path.join(live_root, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        written.append(f"doc:{rel}")
        changed["docs"].append(rel)

    # --- 3. new decision records (skip-if-exists) + link onto the node -----------
    dec_dir = os.path.join(live_root, "decisions")
    for dec in manifest.get("decisions") or []:
        did = dec.get("id")
        if not did:
            continue
        os.makedirs(dec_dir, exist_ok=True)
        dpath = os.path.join(dec_dir, f"{did}.yaml")
        if not os.path.exists(dpath):
            record = {"decision": {
                "id": did, "node_ref": dec.get("node_ref"),
                "level": dec.get("level", "product"),
                "title": dec.get("title"), "reason": dec.get("reason"),
                "alternatives": dec.get("alternatives", []),
                "status": "accepted", "superseded_by": None,
                "supersedes": dec.get("supersedes"),
                "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
            }}
            with open(dpath, "w", encoding="utf-8") as fh:
                yaml.safe_dump(record, fh, sort_keys=False, allow_unicode=True)
            written.append(f"decision:{did}")
            changed["decisions"].append(did)
        # link the decision id onto its node (append-only)
        ref = dec.get("node_ref")
        node = find(caps, ref) or find(funcs, ref)
        if node is not None:
            dlist = node.setdefault("decisions", [])
            if did not in dlist:
                dlist.append(did)

    # --- write the mutated spine back --------------------------------------------
    with open(spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)
    written.append("spine:_spine.yaml")

    out = {"written": written, "changed": changed,
           "nodes_named": sorted({c["ref"] for c in changed["nodes"]} |
                                 {d.get("node_ref") for d in (manifest.get("decisions") or [])
                                  if d.get("node_ref")})}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
