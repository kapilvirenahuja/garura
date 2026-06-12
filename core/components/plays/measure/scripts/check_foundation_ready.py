#!/usr/bin/env python3
"""
check_foundation_ready.py — /measure's foundation-order gate (C9/F8).

Asserts the slice already carries the four lens files /measure's position requires:
the lens trinity (quality, ux, agentic — /measure READS these) and the architecture
lens (foundation order is arch → measure → run; /measure runs after /arch even though
it never reads arch's content).

Layer rule: pure filesystem presence checks; no git/gh/network; reads no lens CONTENT
(presence only — the trinity content is read by the Draft step's skill, never here).

    python3 check_foundation_ready.py --product-base <product_base> --lens-dir <lens_dir>

`lens_dir` is the slice's lens folder relative to product-base (from check_ready_slice.py),
e.g. product-os/<domain>/slices/<slice-id>/lens.

Prints {ready, missing[], present[]} JSON. Exit 0 ready, 1 missing, 2 usage error.
"""

import argparse
import json
import os
import sys

REQUIRED = ("quality.yaml", "ux.yaml", "agentic.yaml", "architecture.yaml")


def main(argv=None):
    ap = argparse.ArgumentParser(description="/measure foundation-order gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--lens-dir", required=True,
                    help="slice lens folder relative to product-base")
    args = ap.parse_args(argv)

    lens_dir = os.path.join(args.product_base, args.lens_dir)
    if not os.path.isdir(os.path.dirname(lens_dir.rstrip(os.sep))):
        sys.stderr.write(f"check_foundation_ready.py: no slice folder at {lens_dir}\n")
        return 2

    missing, present = [], []
    for fn in REQUIRED:
        (present if os.path.isfile(os.path.join(lens_dir, fn)) else missing).append(fn)

    result = {"ready": not missing, "missing": missing, "present": present}
    print(json.dumps(result, indent=2))
    return 0 if not missing else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
