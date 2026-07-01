#!/usr/bin/env python3
"""
check_model_untouched.py — assert the refactor changed NO product-model file (C1 / F1).

A refactor improves code only; the product model (the product-os tree — spine, lenses, ICE,
decisions, slice/epic records) must be byte-identical before and after. This is a mechanical
tree diff over two snapshots already captured to disk — it does NOT shell out to git or touch
anything live.

  --before   a snapshot of the product-os tree taken BEFORE the refactor (e.g. `cp -R`).
  --after    the product-os tree as it stands now (the live path).

Any file that was added, removed, or whose bytes changed between the two is a product-model
write (F1) and fails the check.

Usage:  python3 check_model_untouched.py --before <dir> --after <dir>
Exit:   0 = model untouched, 1 = a product-model file changed, 2 = could not read inputs.
"""

import argparse
import filecmp
import os
import sys


def _rel_files(root):
    out = set()
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            out.add(os.path.relpath(os.path.join(dirpath, fn), root))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assert the product model is byte-unchanged.")
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", required=True)
    args = ap.parse_args(argv)

    if not os.path.isdir(args.before):
        sys.stderr.write(f"check_model_untouched: no before snapshot at {args.before}\n")
        return 2
    if not os.path.isdir(args.after):
        # the whole product-os tree vanished — that is itself a change
        sys.stderr.write(f"check_model_untouched: no after tree at {args.after}\n")
        return 1

    before, after = _rel_files(args.before), _rel_files(args.after)
    added = sorted(after - before)
    removed = sorted(before - after)
    changed = sorted(
        rel for rel in (before & after)
        if not filecmp.cmp(os.path.join(args.before, rel),
                           os.path.join(args.after, rel), shallow=False)
    )

    if added or removed or changed:
        print("MODEL CHECK: FAIL — the product model was modified by the refactor")
        for rel in added:
            print(f"  added:   {rel}")
        for rel in removed:
            print(f"  removed: {rel}")
        for rel in changed:
            print(f"  changed: {rel}")
        return 1

    print("MODEL CHECK: PASS (product model byte-identical before and after)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
