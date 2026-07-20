#!/usr/bin/env python3
"""
persist_agentic.py — /agentic's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old draft-copy apply (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-agentic-lens) already wrote the per-node lens doc `agentic.md`
straight to the live model. This script owns the one SHARED-file concern — the slice's
`decisions/` — and writes it in place from the manifest's structured data, KEYED to the
target slice:

  - decisions: one `decisions/<id>.yaml` per autonomy decision the manifest carries, under
    the TARGET slice's decisions folder, written skip-if-exists (an accepted decision is
    never edited in place; a re-run adds only new ones). It REFUSES to write any decision
    outside the target slice's decisions folder — this is the node-level containment the
    file-level scoped guard cannot provide. A non-agent slice carries no decisions, so this
    step writes nothing.

It also confirms the live lens landed: the per-node `agentic.md` the authoring skill wrote
must exist at the manifest's `lens_rel` under the live model. It reads the manifest (STM,
non-model); it does NOT read a draft tree and does NOT copy the lens. Layer rule: pure file
writes from disk inputs; no git/gh/network.

    python3 persist_agentic.py --manifest <agentic-manifest.yaml> \
            --product-base <product_base> --out-manifest <persist-manifest.json>

Exit 0 on success, 2 on usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_agentic.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /agentic (ADR 026).")
    ap.add_argument("--manifest", required=True,
                    help="agentic-manifest.yaml written by author-agentic-lens (carries lens_rel + any decisions)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.manifest):
        sys.stderr.write(f"persist_agentic.py: missing manifest {args.manifest}\n")
        return 2

    man = (load(args.manifest).get("agentic") or {})
    lens_rel = man.get("lens_rel")
    if not lens_rel:
        sys.stderr.write("persist_agentic.py: manifest carries no lens_rel — cannot locate the slice\n")
        return 2

    live_root = args.product_base
    # The slice folder is two levels above the lens doc:
    #   product-os/<domain>/slices/<slice>/lens/agentic.md
    lens_abs = os.path.join(live_root, lens_rel)
    slice_dir = os.path.dirname(os.path.dirname(lens_rel))          # product-os/<domain>/slices/<slice>
    decisions_dir = os.path.join(slice_dir, "decisions")           # the ONLY path this script may write
    decisions_abs = os.path.normpath(os.path.join(live_root, decisions_dir))

    written, skipped, refused = [], [], []

    # --- decisions: keyed to the target slice, skip-if-exists, refuse out-of-scope ---
    for dec in (man.get("decisions") or []):
        did = (dec.get("id") if isinstance(dec, dict) else None)
        if not did:
            refused.append("decision-without-id")
            continue
        rel = os.path.join(decisions_dir, f"{did}.yaml")
        dst = os.path.normpath(os.path.join(live_root, rel))
        # containment: the decision MUST land inside the target slice's decisions folder
        if os.path.commonpath([dst, decisions_abs]) != decisions_abs:
            refused.append(rel)                                    # never write outside the target slice
            continue
        if os.path.exists(dst):
            skipped.append(rel)                                    # never edit an accepted decision in place
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "w", encoding="utf-8") as fh:
            yaml.safe_dump({"decision": dec}, fh, sort_keys=False, allow_unicode=True)
        written.append(rel)

    # --- confirm the live lens landed (the authoring skill wrote it directly) ---
    lens_applied = os.path.isfile(lens_abs)

    out = {"applied": True,
           "written": sorted(written),
           "skipped": sorted(skipped),
           "refused": sorted(refused),
           # machine applied field — read by the close's stop-condition gate (#464)
           "lens_applied": lens_applied}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0 if not refused else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
