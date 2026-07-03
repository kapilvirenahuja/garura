#!/usr/bin/env python3
"""
apply_seed.py — persist the /vision draft into the live product model, additively.

The play's apply step, run only AFTER the human approves the checkpoint. It writes the
approved draft into the live model under one ironclad rule: NEVER OVERWRITE EXISTING
CONTENT. /vision's non-destructive guarantee is structural, not checked-after, and the
run is idempotent (re-running fills only the gaps). Two kinds of artifact, two additive
rules:

  - GROUNDING DOCS (*.md) and any other per-node files — SKIP IF THE PATH EXISTS. A
    doc either is or isn't there; an existing one is left untouched.
  - THE SPINE (_spine.yaml) — a SINGLE shared file, so it is MERGED, not copied: add
    only entries (domains/capabilities/functionalities/slices/epics) whose id is absent,
    add the profile only if the live spine has none, and never modify an existing entry.
    (Copy-skip would wrongly skip the whole spine on any re-run over an existing domain.)

Layer rule: pure file transform — reads the draft, writes the model. No git/gh/network.

    python3 apply_seed.py --draft <draft_dir> --product-base <product_base>

Prints {written[], skipped[]} JSON (entries tagged `doc:<rel>`,
`spine:<kind>:<id>` for kind in domain|capability|functionality|slice|epic, and
`spine:profile`) so the play has its non-destructive-re-run evidence. Exit 0 on success,
2 on usage/parse error.
"""

import argparse
import json
import os
import shutil
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_seed.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SPINE_NAME = "_spine.yaml"
# id-keyed collections merged additively, with their singular tag for the manifest.
ID_LISTS = {
    "domains": "domain",
    "capabilities": "capability",
    "functionalities": "functionality",
    "slices": "slice",
    "epics": "epic",
}


def _load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def merge_spine(draft_spine, live_path, written, skipped):
    """Merge draft spine entries into the live spine additively. Returns the merged dict."""
    live = _load(live_path)
    for key, singular in ID_LISTS.items():
        draft_entries = draft_spine.get(key) or []
        if not draft_entries:
            continue
        live_list = live.setdefault(key, [])
        have = {e.get("id") for e in live_list if isinstance(e, dict)}
        for e in draft_entries:
            eid = e.get("id")
            tag = f"spine:{singular}:{eid}"   # e.g. spine:capability:cap-collect
            if eid in have:
                skipped.append(tag)            # never modify an existing entry
            else:
                live_list.append(e)
                have.add(eid)
                written.append(tag)
    # profile — add only if the live spine has none
    if draft_spine.get("profile"):
        if live.get("profile"):
            skipped.append("spine:profile")
        else:
            live["profile"] = draft_spine["profile"]
            written.append("spine:profile")
    return live


def main(argv=None):
    ap = argparse.ArgumentParser(description="Additively persist a /vision seed.")
    ap.add_argument("--draft", required=True, help="draft_dir written by author-vision-seed")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    args = ap.parse_args(argv)

    src_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(src_root):
        sys.stderr.write(f"apply_seed.py: no draft tree at {src_root}\n")
        return 2
    dst_root = os.path.join(args.product_base, "product-os")

    written, skipped = [], []

    # 1. grounding docs + any other per-node files — skip-if-exists copy
    draft_spine_path = None
    for dirpath, _dirs, files in os.walk(src_root):
        rel_dir = os.path.relpath(dirpath, src_root)
        for fn in files:
            src = os.path.join(dirpath, fn)
            rel = os.path.normpath(os.path.join(rel_dir, fn))
            if fn == SPINE_NAME and rel_dir == ".":
                draft_spine_path = src           # handled by merge, not copy
                continue
            dst = os.path.join(dst_root, rel)
            if os.path.exists(dst):
                skipped.append(f"doc:{rel}")     # never overwrite
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            written.append(f"doc:{rel}")

    # 2. the spine — merge by entry id (additive)
    if draft_spine_path:
        live_spine_path = os.path.join(dst_root, SPINE_NAME)
        try:
            draft_spine = _load(draft_spine_path)
        except yaml.YAMLError as exc:
            sys.stderr.write(f"apply_seed.py: draft spine parse error: {exc}\n")
            return 2
        merged = merge_spine(draft_spine, live_spine_path, written, skipped)
        os.makedirs(dst_root, exist_ok=True)
        with open(live_spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(merged, fh, sort_keys=False, allow_unicode=True)

    print(json.dumps({"written": sorted(written), "skipped": sorted(skipped)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
