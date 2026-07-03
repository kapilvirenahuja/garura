#!/usr/bin/env python3
"""resolve_standard.py — resolve a named standards file by precedence (most-specific wins).

PURE: filesystem only. Given the ordered standards base directories (resolved by the
caller from `standards_order` in config) and a filename, return the path of the
most-specific copy that exists, plus whether it was an override or the base.

Per the layer-boundary rule this script does NO git/gh/network work — it only checks
which of the given directories contains the file. The caller resolves the base dirs
from config and passes them in order from most-specific to least-specific.

Usage:
    python3 resolve_standard.py --file self-review.md \
        --dir <most-specific-base> --dir <next> ... --dir <least-specific-base>

Most-specific is the FIRST --dir. Emits JSON {resolved, path, source, is_override}.
Exit 0 if resolved, 1 if the file exists in none of the dirs, 2 on bad input.
"""
import argparse
import json
import os
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, help="standards filename, e.g. self-review.md")
    ap.add_argument("--dir", action="append", default=[], dest="dirs",
                    help="standards base dir; pass most-specific first, base last")
    args = ap.parse_args()

    if not args.dirs:
        print("error: at least one --dir is required", file=sys.stderr)
        return 2

    for i, d in enumerate(args.dirs):
        candidate = os.path.join(d, args.file)
        if os.path.isfile(candidate):
            result = {
                "resolved": True,
                "path": candidate,
                "source": d,
                # the LAST dir is the base; anything earlier is a more-specific override
                "is_override": i < (len(args.dirs) - 1),
            }
            print(json.dumps(result, indent=2))
            return 0

    print(json.dumps({"resolved": False, "path": None, "file": args.file,
                      "searched": args.dirs}, indent=2))
    return 1


if __name__ == "__main__":
    sys.exit(main())
