#!/usr/bin/env python3
"""
apply_roadmap.py — persist /roadmap's ranking, priority field only.

Run only AFTER the human approves the checkpoint. It writes exactly ONE field on
exactly one kind of node and nothing else:

  - sets `node.priority` to the computed integer on each ranked feature, and
  - resets `node.priority` to null on each feature in the `clear` list (a feature
    that had a priority but is now un-rankable or no longer active/proposed),

each via a read-modify-write that changes only the `priority` key, preserving every
other field (C3/F1, C7/F7). It is handed only the ranking — it has no way to touch a
capability, a domain, ICE, the profile, lenses, personas, journeys, or decisions.

The node folder is located from the snapshot's `rel` path for that id, so the writer
never guesses a path.

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_roadmap.py --ranking <ranking.json> --snapshot <snapshot.json> \
            --product-base <product_base> --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_roadmap.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def set_priority(node_file, value):
    with open(node_file, encoding="utf-8") as fh:
        doc = yaml.safe_load(fh) or {}
    node = doc.get("node", doc)
    old = node.get("priority")
    node["priority"] = value                       # ONLY this field changes
    with open(node_file, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, sort_keys=False)
    return old


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /roadmap priorities (priority field only).")
    ap.add_argument("--ranking", required=True)
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    try:
        ranking = json.load(open(args.ranking, encoding="utf-8"))
        snap = json.load(open(args.snapshot, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"apply_roadmap.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    rel_of = {n["id"]: n["rel"] for n in snap.get("nodes", []) if n.get("id")}

    written, changes = [], []

    def apply_one(fid, value):
        rel = rel_of.get(fid)
        if not rel:
            sys.stderr.write(f"apply_roadmap.py: no path for feature '{fid}' in snapshot\n")
            return
        node_file = os.path.join(root, rel)
        if not os.path.isfile(node_file):
            sys.stderr.write(f"apply_roadmap.py: node not found at {node_file}\n")
            return
        old = set_priority(node_file, value)
        if old != value:
            written.append(rel)
        changes.append({"id": fid, "from": old, "to": value, "rel": rel})

    for entry in ranking.get("ranking", []):
        apply_one(entry["id"], entry["priority"])
    for fid in ranking.get("clear", []):
        apply_one(fid, None)

    out = {"written": sorted(set(written)), "changes": changes}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
