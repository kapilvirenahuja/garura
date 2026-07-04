#!/usr/bin/env python3
"""
stamp_slice.py — stamp a slice `realized` on the spine. The ONE place a lens play writes
the spine.

Run by /measure ONLY after lines_up.py passes (all seven lens docs present). It flips the
slice's `status` to `realized` in the spine's `slices` index — the single marker /grill
checks before it cuts delivery work. It changes NOTHING else: no other slice, no other
field of this slice's entry, no other spine collection.

Stamp record (#466 Batch C): with `--lines-up <lines-up.json>` the gate moves inside the
stamper — it stamps only when that capture reads ok, and skips (exit 0) when it does not.
With `--record <path>` it ALWAYS writes the resolved outcome the stop condition checks:
`{stamp_resolved: true, stamped: true, ...}` on a stamp, or `{stamp_resolved: true,
stamped: false, missing: [...], reason: ...}` on an explicit skip — both outcomes are
done; an error (slice not found, parse failure) writes no record, leaving the stop
condition unmet.

Layer rule: reads/writes the spine file on disk only; no git/gh/network.

    python3 stamp_slice.py --product-base <product_base> --slice <slice-id | domain/slice-id> \
            [--lines-up <lines-up.json>] [--record <stamp-record.json>]

Prints {ok, slice_id, from_status, to_status, spine_path} JSON (or the skip record). Exit 0
on a clean stamp or an explicit lines-up skip, 1 if the slice is not found in the spine, 2
on usage/parse error.
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


def write_record(path, record):
    if not path:
        return
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Stamp a slice realized on the spine.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True)
    ap.add_argument("--lines-up", help="lines_up.py captured JSON; when given, stamp only if it reads ok")
    ap.add_argument("--record", help="always write the resolved stamp outcome ({stamp_resolved, stamped}) here")
    args = ap.parse_args(argv)

    if args.lines_up:
        try:
            with open(args.lines_up, encoding="utf-8") as fh:
                lines_up = json.load(fh)
        except (OSError, ValueError) as exc:
            sys.stderr.write(f"stamp_slice.py: cannot read --lines-up {args.lines_up}: {exc}\n")
            return 2
        if not lines_up.get("ok"):
            record = {"stamp_resolved": True, "stamped": False,
                      "slice_id": args.slice,
                      "missing": lines_up.get("missing", []),
                      "reason": "lens docs missing — lines-up gate did not pass; slice left un-realized"}
            write_record(args.record, record)
            print(json.dumps(record, indent=2))
            return 0

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
    write_record(args.record, {"stamp_resolved": True, "stamped": True,
                               "slice_id": result["slice_id"],
                               "from_status": from_status, "to_status": REALIZED})
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
