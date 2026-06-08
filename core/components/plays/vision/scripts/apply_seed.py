#!/usr/bin/env python3
"""
apply_seed.py — persist the /vision draft into the live product model, additively.

The play's apply step, run only AFTER the human approves the checkpoint (C7/F5).
It copies the approved draft tree into the live product model with one ironclad
rule: SKIP ANY PATH THAT ALREADY EXISTS. A pre-existing node, ICE, or profile is
never overwritten — which makes /vision's non-destructive guarantee (C6/F4)
structural, not checked-after. The run is idempotent: re-running after a partial
write simply fills the gaps.

Layer rule: pure file transform — reads the draft, writes the model. No git/gh,
no network.

    python3 apply_seed.py --draft <draft_dir> --product-base <product_base>

Reads the draft subtree at <draft_dir>/product-os/ and writes the mirrored paths
under <product_base>/product-os/. Prints {written[], skipped[]} JSON so the play
has its S3 (non-destructive re-run) evidence. Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import shutil
import sys


def main(argv=None):
    ap = argparse.ArgumentParser(description="Additively persist a /vision seed.")
    ap.add_argument("--draft", required=True, help="draft_dir written by author-vision-seed")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    args = ap.parse_args(argv)

    src_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(src_root):
        sys.stderr.write(f"apply_seed.py: no draft tree at {src_root}\n")
        sys.exit(2)
    dst_root = os.path.join(args.product_base, "product-os")

    written, skipped = [], []
    for dirpath, _dirs, files in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, src_root)
        for fn in files:
            src = os.path.join(dirpath, fn)
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            dst = os.path.join(dst_root, rel)
            if os.path.exists(dst):
                skipped.append(rel)            # never overwrite (C6/F4)
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            written.append(rel)

    print(json.dumps({"written": sorted(written), "skipped": sorted(skipped)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
