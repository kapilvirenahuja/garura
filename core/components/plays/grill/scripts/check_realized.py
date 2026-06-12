#!/usr/bin/env python3
"""
check_realized.py — the realized-stamp gate for /grill (C1/F2).

/grill cuts delivery epics from ONE slice, and only a slice whose design is solved:
/run stamps the slice record `status: realized` only after the lines-up check (all
six lens files present + every cross-reference resolves). This gate asserts that
marker before any grilling starts:

  - the slice record's `status` is `realized`;
  - all six lens files (quality, ux, agentic, architecture, measure, run) exist.

Inputs are the `slice_file` and `lens_dir` already resolved by check_ready_slice.py
(paths relative to --product-base), so resolution is never re-derived here.

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_realized.py --product-base <pb> --slice-file <rel> --lens-dir <rel>

Prints {ok, errors[], status, lenses} JSON. Exit 0 realized, 1 not, 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_realized.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

LENSES = ["quality", "ux", "agentic", "architecture", "measure", "run"]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Realized-stamp gate for /grill.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-file", required=True, help="slice record, relative to product-base")
    ap.add_argument("--lens-dir", required=True, help="slice lens dir, relative to product-base")
    args = ap.parse_args(argv)

    errors = []
    out = {"ok": False, "errors": errors, "status": None, "lenses": {}}

    slice_path = os.path.join(args.product_base, args.slice_file)
    try:
        with open(slice_path, encoding="utf-8") as fh:
            sl = (yaml.safe_load(fh) or {}).get("slice") or {}
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"slice record unreadable: {slice_path} ({exc})")
        sl = {}

    status = (sl.get("status") or "").strip().lower()
    out["status"] = status
    if sl and status != "realized":
        errors.append(f"slice status is '{status}', must be 'realized' — run the realize "
                      f"lenses (quality -> ux -> agentic -> arch -> run) to completion; "
                      f"/run stamps the slice when everything lines up (C1/F2)")

    lens_base = os.path.join(args.product_base, args.lens_dir)
    for lens in LENSES:
        present = os.path.isfile(os.path.join(lens_base, lens + ".yaml"))
        out["lenses"][lens] = present
        if not present:
            errors.append(f"lens file missing: {os.path.join(args.lens_dir, lens + '.yaml')} "
                          f"— run /{'arch' if lens == 'architecture' else lens} first (C1/F2)")

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
