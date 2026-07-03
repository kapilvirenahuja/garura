#!/usr/bin/env python3
"""
apply_agentic.py — persist /agentic's agentic lens, on a fixed allowlist.

Run only AFTER the human approves the checkpoint. It writes exactly two kinds of thing
and NOTHING else:

  1. The agentic lens — `lens/agentic.md` (a grounding doc) for the slice, written from
     the draft. This is the re-derive, so it overwrites a prior agentic lens.
  2. Decisions — `decisions/*.yaml`, copied skip-if-exists, so an accepted decision is
     never edited in place; a re-run adds only new ones.

The script is handed only the draft, which holds only the agentic lens + decisions, so it
physically cannot touch the hub (functionality grounding), the spine, another lens, the
slice record, or the profile.

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_agentic.py --draft <draft_dir> --product-base <product_base> \
            --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import shutil
import sys


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /agentic on a fixed allowlist.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    src_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(src_root):
        sys.stderr.write(f"apply_agentic.py: no draft tree at {src_root}\n")
        sys.exit(2)
    dst_root = os.path.join(args.product_base, "product-os")

    written, skipped, refused = [], [], []

    for dirpath, _dirs, files in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, src_root)
        for fn in files:
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            parts = rel.split(os.sep)
            is_lens = (len(parts) >= 2 and parts[-2] == "lens" and parts[-1] == "agentic.md")
            is_decision = ("decisions" in parts and fn.endswith(".yaml"))
            if not (is_lens or is_decision):
                refused.append(rel)            # defensive: draft should hold only these
                continue
            dst = os.path.join(dst_root, rel)
            if is_decision and os.path.exists(dst):
                skipped.append(rel)            # never edit an accepted decision in place
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(dirpath, fn), dst)
            written.append(rel)

    out = {"written": sorted(written), "skipped": sorted(skipped), "refused": sorted(refused)}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
