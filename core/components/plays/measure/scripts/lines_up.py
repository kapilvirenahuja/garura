#!/usr/bin/env python3
"""
lines_up.py — the "lines-up" gate: does this slice have ALL SEVEN lens docs?

/measure is the last lens (the deliver pipe). After it persists its own measure.md, it
checks that the slice now carries every realize lens — quality, ux, agentic, marketing,
architecture, run, measure — as a grounding doc under {domain}/slices/{slice}/lens/. ONLY
when all seven are present (the slice "lines up") may /measure stamp the slice realized
(stamp_slice.py). A missing lens means a pipe has not run yet; the slice is not realized.

Layer rule: reads files on disk only; no git/gh/network.

    python3 lines_up.py --product-base <product_base> --slice <slice-id | domain/slice-id>

Prints {ok, slice_id, lens_dir, present[], missing[]} JSON. Exit 0 when all seven are
present (lines up), 1 when any is missing, 2 on usage error.
"""

import argparse
import glob
import json
import os
import sys

LENSES = ["quality.md", "ux.md", "agentic.md", "marketing.md",
          "architecture.md", "run.md", "measure.md"]


def resolve_lens_dir(product_base, slice_arg):
    po = os.path.join(product_base, "product-os")
    if "/" in slice_arg:
        domain, sid = slice_arg.split("/", 1)
        cand = os.path.join(po, domain, "slices", sid, "lens")
        return cand if os.path.isdir(os.path.dirname(cand)) or os.path.isdir(cand) else cand
    hits = glob.glob(os.path.join(po, "*", "slices", slice_arg, "lens"))
    if hits:
        return hits[0]
    # slice folder may exist without a lens dir yet
    hits = glob.glob(os.path.join(po, "*", "slices", slice_arg))
    return os.path.join(hits[0], "lens") if hits else os.path.join(po, "?", "slices", slice_arg, "lens")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Lines-up gate: all seven lens docs present.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice", required=True)
    args = ap.parse_args(argv)

    lens_dir = resolve_lens_dir(args.product_base, args.slice)
    present, missing = [], []
    for lens in LENSES:
        (present if os.path.isfile(os.path.join(lens_dir, lens)) else missing).append(lens)

    ok = not missing
    result = {"ok": ok, "slice_id": args.slice,
              "lens_dir": os.path.relpath(lens_dir, args.product_base) if os.path.isabs(lens_dir) else lens_dir,
              "present": present, "missing": missing}
    print(json.dumps(result, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
