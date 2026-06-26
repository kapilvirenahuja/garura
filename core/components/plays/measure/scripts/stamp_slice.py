#!/usr/bin/env python3
"""
stamp_slice.py — stamp a slice `realized` on the spine. The ONE place a lens play writes
the spine.

Run by /measure ONLY after lines_up.py passes (all seven lens docs present). It flips the
slice's `status` to `realized` in the spine's `slices` index — the single marker /grill
checks before it cuts delivery work. It changes NOTHING else: no other slice, no other
field of this slice's entry, no other spine collection.

Layer rule: reads/writes the spine file on disk only; no git/gh/network.

    python3 stamp_slice.py --product-base <product_base> --slice <slice-id | domain/slice-id>

Prints {ok, slice_id, from_status, to_status, spine_path} JSON. Exit 0 on a clean stamp, 1
if the slice is not found in the spine, 2 on usage/parse error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("stamp_slice.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

REALIZED = "realized"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Stamp a slice realized on the spine.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True)
    args = ap.parse_args(argv)

    sid = args.slice.split("/", 1)[1] if "/" in args.slice else args.slice
    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    if not os.path.isfile(spine_path):
        sys.stderr.write(f"stamp_slice.py: no spine at {spine_path}\n")
        return 2
    try:
        spine = yaml.safe_load(open(spine_path, encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        sys.stderr.write(f"stamp_slice.py: spine parse error: {exc}\n")
        return 2

    entry = next((s for s in (spine.get("slices") or [])
                  if isinstance(s, dict) and (s.get("id") == sid or s.get("slug") == sid)), None)
    if entry is None:
        sys.stderr.write(f"stamp_slice.py: slice '{sid}' not in the spine slices index\n")
        return 1

    from_status = entry.get("status")
    entry["status"] = REALIZED
    with open(spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)

    result = {"ok": True, "slice_id": entry.get("id", sid), "from_status": from_status,
              "to_status": REALIZED, "spine_path": "product-os/_spine.yaml"}
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
