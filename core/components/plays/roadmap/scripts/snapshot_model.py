#!/usr/bin/env python3
"""
snapshot_model.py — capture the ProductOS model state for /roadmap.

Two jobs, by mode:

  1. Readiness probe (`--probe`, pre-flight): count the rankable features
     (functionality nodes with status `active` or `proposed`) and write NOTHING.
     Zero ⇒ nothing to rank — the play exits gracefully and tells the human to run
     /shape first. Safe to re-run on every invocation (resume included) because it
     never touches the snapshot file.

  2. Capture (`--out`, the play's first real step): the "before" picture for
     ranking + the non-destructive check. This is taken once, as a gated DAG step,
     so a resume that re-enters pre-flight can never clobber the pre-apply
     before-picture. The capture holds:
       - `nodes`: every node (domain/capability/functionality) with the fields
         /roadmap reasons over — id, type, status, depends_on, ice_ref, current
         priority, whether its ICE record exists (`ice_present`), the node file's
         path + content hash, and the FULL parsed node (`node`) so the verify step
         can prove every field except `priority` is unchanged (C7/F7).
       - `files`: a path→sha256 map of EVERY file under product-os, so the verify
         step can prove nothing outside the priority fields changed (C7/F7).

Layer rule: reads files on disk only; no git/gh/network.

    python3 snapshot_model.py --product-base <product_base> --probe        # count only, no write
    python3 snapshot_model.py --product-base <product_base> --out <snapshot.json>

Prints {ok, rankable_count, errors[], counts} JSON. Exit 0 when the model is
readable (even with 0 rankable — the play decides), 2 on usage/IO error.
"""

import argparse
import glob
import hashlib
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("snapshot_model.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description="Capture the ProductOS model for /roadmap.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out", default=None, help="snapshot path (capture mode)")
    ap.add_argument("--probe", action="store_true",
                    help="readiness count only — write nothing (pre-flight)")
    args = ap.parse_args(argv)
    if not args.probe and not args.out:
        sys.stderr.write("snapshot_model.py: --out is required unless --probe.\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    if not os.path.isdir(root):
        sys.stderr.write(f"snapshot_model.py: no product model at {root}\n")
        sys.exit(2)

    errors = []
    nodes = []
    counts = {"domain": 0, "capability": 0, "functionality": 0}

    for node_path in sorted(glob.glob(os.path.join(root, "**", "node.yaml"), recursive=True)):
        try:
            n = (load(node_path).get("node") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"{node_path}: unreadable node ({exc})")
            continue
        ntype = n.get("type")
        if ntype in counts:
            counts[ntype] += 1
        ice_path = os.path.join(os.path.dirname(node_path), "ice.yaml")
        nodes.append({
            "id": n.get("id"),
            "type": ntype,
            "status": n.get("status"),
            "depends_on": list(n.get("depends_on") or []),
            "ice_ref": n.get("ice_ref"),
            "ice_present": os.path.isfile(ice_path),
            "priority": n.get("priority"),
            "rel": os.path.relpath(node_path, root),
            "hash": sha256(node_path),
            "node": n,
        })

    rankable = [n for n in nodes
                if n["type"] == "functionality" and n["status"] in ("active", "proposed")]

    if not args.probe:
        # full file census for the non-destructive check (capture mode only)
        files = {}
        for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
            if os.path.isfile(fp):
                files[os.path.relpath(fp, root)] = sha256(fp)
        snapshot = {"product_base": args.product_base, "nodes": nodes, "files": files}
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(snapshot, fh, indent=2)

    result = {"ok": not errors, "rankable_count": len(rankable),
              "errors": errors, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
