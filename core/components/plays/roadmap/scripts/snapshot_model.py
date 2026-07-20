#!/usr/bin/env python3
"""
snapshot_model.py — read the current spine slices /roadmap must plan.

The plan (order/effort/depends_on/status) lives on the SPINE slices index — the only
thing /roadmap writes. This reads the current slices across every shaped domain so the
authoring skill and `compute_plan.py` have the authoritative list of what to plan and
each slice's `dependency_notes` (read from its record — composition, never touched — for
the planner's dependency judgment).

Under direct-model-write (ADR 026) this is NOT a before/after picture: the play enters on
a clean product-os tree, so HEAD is the guard's base and the post-write
`scoped_write_guard.py` (not a file census here) proves non-destructiveness. This script
only READS current state as planning input.

Two modes:
  --probe : count the spine slices, write NOTHING (pre-flight readiness; zero => run
            /shape first). Safe to re-run on every invocation (resume included).
  --out   : write the current slices (id, domain_ref, functionality_refs,
            dependency_notes, current plan fields) as planning input.

Layer rule: reads files on disk only; no git/gh/network.

    python3 snapshot_model.py --product-base <product_base> --probe
    python3 snapshot_model.py --product-base <product_base> --out <snapshot.json>

Prints {ok, slice_count, errors[]} JSON. Exit 0 readable, 2 on usage/IO error.
"""

import argparse
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


def main(argv=None):
    ap = argparse.ArgumentParser(description="Read current spine slices for /roadmap.")
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
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump({"product_base": args.product_base, "spine_rel": SPINE,
                       "slices": slices}, fh, indent=2)

    print(json.dumps({"ok": not errors, "slice_count": len(slices), "errors": errors}, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
