#!/usr/bin/env python3
"""
apply_measure.py — persist /measure's measure lens, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. It writes exactly ONE kind of thing
and NOTHING else: the measure lens — `lens/measure.yaml` for the slice, written from the
draft. This is the re-derive, so it overwrites a prior measure lens (a re-run re-derives).

/measure records no decisions and never stamps the slice (the `realized` stamp is /run's
duty), so anything in the draft that is not the measure lens is REFUSED and reported —
the script physically cannot touch the slice record, the ICE, the profile, another lens,
or node structure (C1/F9).

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_measure.py --draft <draft_dir> --product-base <product_base> \
            --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import shutil
import sys


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /measure on a fixed allowlist.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    src_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(src_root):
        sys.stderr.write(f"apply_measure.py: no draft tree at {src_root}\n")
        sys.exit(2)
    dst_root = os.path.join(args.product_base, "product-os")

    written, refused = [], []

    for dirpath, _dirs, files in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, src_root)
        for fn in files:
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            parts = rel.split(os.sep)
            is_measure_lens = (len(parts) >= 2 and parts[-2] == "lens"
                               and parts[-1] == "measure.yaml")
            if not is_measure_lens:
                refused.append(rel)            # defensive: draft should hold only the lens
                continue
            dst = os.path.join(dst_root, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(dirpath, fn), dst)
            written.append(rel)

    out = {"written": sorted(written), "skipped": [], "refused": sorted(refused)}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
