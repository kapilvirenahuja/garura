#!/usr/bin/env python3
"""
persist_seed.py — /vision's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_seed.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-vision-seed) already wrote the per-node grounding docs
(domain.md, capability.md) straight to the live model, skip-if-exists. This script owns
the one SHARED file — the spine `_spine.yaml`, including its `profile` block — and merges
the manifest's structured spine-delta into the live spine IN PLACE, ADDITIVELY:

  - id-keyed collections (domains / capabilities / functionalities / slices / epics):
    add ONLY entries whose id is absent from the live spine; an id already present is
    left byte-untouched (recorded as skipped). This is the node-level containment the
    file-level scoped guard cannot see inside the shared spine — /vision NEVER overwrites
    or redraws an existing entry.
  - the profile block: added ONLY if the live spine has none; an existing profile is left
    untouched (skipped).

It reads the seed manifest (STM, non-model) for the spine-delta; it does NOT read a draft
tree and does NOT copy docs. Layer rule: pure file writes from disk inputs; no
git/gh/network.

    python3 persist_seed.py --seed-manifest <seed-manifest.yaml> \
        --product-base <product_base> --out-manifest <persist-manifest.json>

Prints {applied, written[], skipped[], changed{}} JSON (`applied: true` is the
stop-condition gate's persist record, D1/D2; entries tagged `spine:<kind>:<id>` for kind
in domain|capability|functionality|slice|epic, and `spine:profile`) so the play has its
non-destructive-re-run evidence (S3). Exit 0 on success, 2 on usage/parse/containment
error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_seed.py: PyYAML is required (pip install pyyaml).\n")
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


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def merge_spine(delta, live, written, skipped, changed):
    """Merge the manifest's spine-delta into the live spine additively, in place."""
    for key, singular in ID_LISTS.items():
        delta_entries = delta.get(key) or []
        if not delta_entries:
            continue
        live_list = live.setdefault(key, [])
        have = {e.get("id") for e in live_list if isinstance(e, dict)}
        for e in delta_entries:
            eid = e.get("id")
            tag = f"spine:{singular}:{eid}"       # e.g. spine:capability:cap-checkout
            if eid in have:
                skipped.append(tag)                # never modify an existing entry
            else:
                live_list.append(e)
                have.add(eid)
                written.append(tag)
                changed.setdefault(key, []).append(eid)
    # profile — add only if the live spine has none
    if delta.get("profile"):
        if live.get("profile"):
            skipped.append("spine:profile")
        else:
            live["profile"] = delta["profile"]
            written.append("spine:profile")
            changed["profile"] = True
    return live


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place additive persist for /vision (ADR 026).")
    ap.add_argument("--seed-manifest", required=True,
                    help="seed-manifest.yaml written by author-vision-seed (carries the spine-delta)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.seed_manifest):
        sys.stderr.write(f"persist_seed.py: missing seed manifest {args.seed_manifest}\n")
        return 2

    man = load(args.seed_manifest)
    seed = man.get("seed", man) if isinstance(man, dict) else {}
    delta = seed.get("spine_delta") or seed.get("spine") or {}
    if not isinstance(delta, dict) or not any(delta.get(k) for k in ID_LISTS) \
            and not delta.get("profile"):
        sys.stderr.write("persist_seed.py: seed manifest carries no spine_delta to persist\n")
        return 2

    live_root = os.path.join(args.product_base, "product-os")
    live_spine_path = os.path.join(live_root, SPINE_NAME)
    live = load(live_spine_path)

    written, skipped, changed = [], [], {}
    merge_spine(delta, live, written, skipped, changed)

    os.makedirs(live_root, exist_ok=True)
    with open(live_spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(live, fh, sort_keys=False, allow_unicode=True)

    manifest = {"applied": True,
                "written": sorted(written),
                "skipped": sorted(skipped),
                "changed": changed}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
