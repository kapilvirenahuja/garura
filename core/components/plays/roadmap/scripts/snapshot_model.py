#!/usr/bin/env python3
"""
snapshot_model.py — capture the spine slices + a tree census for /roadmap.

The plan (order/effort/depends_on/status) lives on the SPINE slices index — the only
thing /roadmap writes — so this snapshots the spine and a path->hash census of every file
under product-os EXCEPT `_spine.yaml`. Each slice's `dependency_notes` is read from its
record (composition, never touched) for the planner's dependency judgment.

Two modes:
  --probe : count the spine slices, write NOTHING (pre-flight readiness; zero => run
            /shape first). Safe to re-run on every invocation (resume included).
  --out   : the "before" picture for planning + the non-destructive check. Holds
            `spine_before` (the full spine, so verify proves only the slices' plan fields
            changed), `slices` (id, domain_ref, functionality_refs, dependency_notes,
            current plan fields), and `files` (path->sha256 of every file but the spine).

Layer rule: reads files on disk only; no git/gh/network.

    python3 snapshot_model.py --product-base <product_base> --probe
    python3 snapshot_model.py --product-base <product_base> --out <snapshot.json>

Prints {ok, slice_count, errors[]} JSON. Exit 0 readable, 2 on usage/IO error.
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

SPINE = "_spine.yaml"


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
    ap = argparse.ArgumentParser(description="Capture spine slices for /roadmap.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--probe", action="store_true", help="count only — write nothing")
    args = ap.parse_args(argv)
    if not args.probe and not args.out:
        sys.stderr.write("snapshot_model.py: --out is required unless --probe.\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    spine_path = os.path.join(root, SPINE)
    if not os.path.isfile(spine_path):
        sys.stderr.write(f"snapshot_model.py: no spine at {spine_path}\n")
        sys.exit(2)
    spine = load(spine_path)

    errors, slices = [], []
    for sl in (spine.get("slices") or []):
        if not isinstance(sl, dict):
            continue
        notes, rec = None, sl.get("record")
        if rec:
            rp = os.path.join(root, rec)
            if os.path.isfile(rp):
                try:
                    notes = (load(rp).get("slice") or {}).get("dependency_notes")
                except yaml.YAMLError as exc:
                    errors.append(f"{rec}: unreadable slice record ({exc})")
            else:
                errors.append(f"slice '{sl.get('id')}': record not found at {rec}")
        slices.append({
            "id": sl.get("id"),
            "domain_ref": sl.get("domain_ref"),
            "functionality_refs": list(sl.get("functionality_refs") or []),
            "dependency_notes": notes,
            "order": sl.get("order"),
            "effort": sl.get("effort"),
            "depends_on": list(sl.get("depends_on") or []),
            "status": sl.get("status"),
        })

    if not args.probe:
        files = {}
        for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
            if os.path.isfile(fp) and os.path.basename(fp) != SPINE:
                files[os.path.relpath(fp, root)] = sha256(fp)
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump({"product_base": args.product_base, "spine_rel": SPINE,
                       "spine_before": spine, "slices": slices, "files": files},
                      fh, indent=2)

    print(json.dumps({"ok": not errors, "slice_count": len(slices), "errors": errors}, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
