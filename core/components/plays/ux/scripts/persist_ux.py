#!/usr/bin/env python3
"""
persist_ux.py — /ux's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_ux.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-ux-lens) already wrote the per-node grounding doc `ux.md` straight
to the live model. This script owns the one SHARED file — the slice's visual-core
`decisions/*.yaml` — and writes it IN PLACE, keyed to the target slice:

  - the visual-core decision: written `skip-if-exists`, so an accepted decision is never
    edited in place (C9/F9); a re-run adds only a genuinely new decision. This is the
    node-level containment the file-level scoped guard cannot see — the script REFUSES to
    write a decision path outside the target slice's `decisions/` folder.

It reads the ux manifest (STM, non-model) for the decision delta; it does NOT read a draft
tree and does NOT copy the lens (the LLM wrote it in place). It confirms the live `ux.md`
is present (the LLM's write landed) and stamps that as `lens_applied`. Layer rule: pure
file writes from disk inputs; no git/gh/network.

    python3 persist_ux.py --ux-manifest <ux-manifest.yaml> \
        --product-base <product_base> --slice-ref <domain>/<slice> \
        --lens-rel product-os/<domain>/slices/<slice>/lens/ux.md \
        --out-manifest <persist-manifest.json>

Prints {applied, lens_applied, written[], skipped[], changed{}} JSON (`applied: true` is
the stop-condition gate's persist record, D1/D2). Exit 0 on success, 2 on
usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_ux.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load_yaml(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /ux (ADR 026).")
    ap.add_argument("--ux-manifest", required=True,
                    help="ux-manifest.yaml written by author-ux-lens (carries the decision delta)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--slice-ref", required=True, help="<domain>/<slice> — the run's target slice key")
    ap.add_argument("--lens-rel", required=True,
                    help="product-os/<domain>/slices/<slice>/lens/ux.md — the live lens path to confirm")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.ux_manifest):
        sys.stderr.write(f"persist_ux.py: missing ux manifest {args.ux_manifest}\n")
        return 2

    man = load_yaml(args.ux_manifest)
    ux = man.get("ux", man) if isinstance(man, dict) else {}

    live_root = os.path.join(args.product_base, "product-os")

    # The target slice's decisions folder is the ONLY place this script may write —
    # node-level containment keyed to --slice-ref.
    slice_key = args.slice_ref.strip("/")
    domain, _, slice_id = slice_key.partition("/")
    if not domain or not slice_id:
        sys.stderr.write(f"persist_ux.py: --slice-ref must be <domain>/<slice>, got {args.slice_ref!r}\n")
        return 2
    allowed_decisions_rel = os.path.join("product-os", domain, "slices", slice_id, "decisions")

    written, skipped, changed = [], [], {}

    # The visual-core decision delta (may be absent when a prior decision is reused).
    delta = ux.get("decision_delta") or ux.get("decision") or {}
    if isinstance(delta, dict) and delta:
        deltas = [delta]
    elif isinstance(delta, list):
        deltas = [d for d in delta if isinstance(d, dict) and d]
    else:
        deltas = []

    for d in deltas:
        rel = d.get("rel")
        record = d.get("record")
        did = d.get("id")
        if not rel or record is None:
            sys.stderr.write(f"persist_ux.py: decision delta missing rel/record: {d!r}\n")
            return 2
        norm = os.path.normpath(rel)
        # Containment: refuse any decision path outside the target slice's decisions folder.
        if os.path.commonpath([norm, allowed_decisions_rel]) != allowed_decisions_rel \
                or os.path.basename(os.path.dirname(norm)) != "decisions":
            sys.stderr.write(
                f"persist_ux.py: REFUSED out-of-scope decision path {rel!r} "
                f"(only {allowed_decisions_rel}/* allowed)\n")
            return 2
        dst = os.path.join(args.product_base, norm)
        tag = f"decision:{did or os.path.basename(norm)}"
        if os.path.exists(dst):
            skipped.append(tag)                # never edit an accepted decision in place
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "w", encoding="utf-8") as fh:
            yaml.safe_dump(record, fh, sort_keys=False, allow_unicode=True)
        written.append(tag)
        changed.setdefault("decisions", []).append(did or os.path.basename(norm))

    # Confirm the live lens landed (the LLM wrote it in place, Step 1).
    live_lens = os.path.join(args.product_base, os.path.normpath(args.lens_rel))
    lens_applied = os.path.isfile(live_lens)

    manifest = {"applied": lens_applied,
                "lens_applied": lens_applied,
                "written": sorted(written),
                "skipped": sorted(skipped),
                "changed": changed}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
