#!/usr/bin/env python3
"""
snapshot_model.py — capture the SLICES across all shaped domains for /roadmap.

Two jobs, by mode:

  1. Readiness probe (`--probe`, pre-flight): count the slices to plan and write
     NOTHING. Zero ⇒ nothing to plan — the play exits gracefully (run /shape first).
     Safe to re-run on every invocation (resume included).

  2. Capture (`--out`, the play's first real step): the "before" picture for planning
     + the non-destructive check. Holds:
       - `slices`: every slice (across every domain) with the fields /roadmap reasons
         over — id, domain_ref, the functionality_refs it bundles, dependency_notes,
         current order/effort/depends_on/status, the file's path + hash, and the FULL
         parsed slice (so the verify step can prove only plan fields changed).
       - `files`: a path→sha256 map of EVERY file under product-os (non-destructive).

The `_deferred.yaml` buckets are NOT slices and are skipped.

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

PLAN_FIELDS = ("order", "effort", "depends_on", "status")


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
    ap = argparse.ArgumentParser(description="Capture slices for /roadmap.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--probe", action="store_true", help="count only — write nothing")
    args = ap.parse_args(argv)
    if not args.probe and not args.out:
        sys.stderr.write("snapshot_model.py: --out is required unless --probe.\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    if not os.path.isdir(root):
        sys.stderr.write(f"snapshot_model.py: no product model at {root}\n")
        sys.exit(2)

    errors, slices = [], []
    for sp in sorted(glob.glob(os.path.join(root, "**", "slices", "*.yaml"), recursive=True)):
        if os.path.basename(sp) == "_deferred.yaml":
            continue
        try:
            sl = (load(sp).get("slice") or {})
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"{sp}: unreadable slice ({exc})")
            continue
        slices.append({
            "id": sl.get("id"),
            "domain_ref": sl.get("domain_ref"),
            "functionality_refs": [f.get("functionality_ref")
                                   for f in (sl.get("functionalities") or [])
                                   if isinstance(f, dict)],
            "dependency_notes": sl.get("dependency_notes"),
            "order": sl.get("order"),
            "effort": sl.get("effort"),
            "depends_on": list(sl.get("depends_on") or []),
            "status": sl.get("status"),
            "rel": os.path.relpath(sp, root),
            "hash": sha256(sp),
            "slice": sl,
        })

    if not args.probe:
        files = {}
        for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
            if os.path.isfile(fp):
                files[os.path.relpath(fp, root)] = sha256(fp)
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump({"product_base": args.product_base, "slices": slices, "files": files},
                      fh, indent=2)

    print(json.dumps({"ok": not errors, "slice_count": len(slices), "errors": errors}, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
