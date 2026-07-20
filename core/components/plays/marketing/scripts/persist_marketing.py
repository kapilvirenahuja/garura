#!/usr/bin/env python3
"""
persist_marketing.py — /marketing's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_marketing.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-marketing-lens) already wrote the slice's marketing lens
(`lens/marketing.md`) straight to the live model. This script owns the one SHARED-file kind
this play can touch — the slice's `decisions/` — and writes the manifest's material marketing
decisions IN PLACE, keyed to the target slice:

  - each decision is written to `<slice-dir>/decisions/<id>.yaml`, ADD-ONLY: a decision id
    already present on disk is left byte-untouched (recorded as skipped), so an accepted
    decision is superseded by a NEW record, never edited in place.
  - it REFUSES any decision whose `node_ref` (or `slice`) names a slice other than the
    target `--slice-ref` — the node-level containment the file-level scoped guard cannot see
    across slices.

It reads the marketing manifest (STM, non-model) for the decisions; it does NOT read a draft
tree, does NOT copy the lens doc (the LLM wrote it in place), and does NOT touch the spine,
the profile, the slice record, or another lens. Layer rule: pure file writes from disk
inputs; no git/gh/network.

    python3 persist_marketing.py --marketing-manifest <marketing-manifest.yaml> \
        --product-base <product_base> --slice-ref <domain/slice-id> \
        --decisions-rel product-os/<domain>/slices/<slice>/decisions \
        --out-manifest <persist-manifest.json>

Prints {applied, written[], skipped[], refused[], changed{}} JSON (`applied: true` on a
successful run is the stop-condition gate's persist record, D1/D2 — stamped even when the
manifest carries no decision, mirroring the other direct-model-write plays). Exit 0 on
success, 2 on usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_marketing.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def decision_id(rec):
    """The id of a decision record, tolerating a {decision: {...}} wrapper or a flat dict."""
    inner = rec.get("decision") if isinstance(rec, dict) and "decision" in rec else rec
    return (inner or {}).get("id"), inner


def decision_node(rec):
    """The slice/node a decision names, tolerating the wrapper — for containment."""
    _id, inner = decision_id(rec)
    return (inner or {}).get("node_ref") or (inner or {}).get("slice")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place decision persist for /marketing (ADR 026).")
    ap.add_argument("--marketing-manifest", required=True,
                    help="marketing-manifest.yaml written by author-marketing-lens (carries any decision)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--slice-ref", required=True, help="the ONLY slice this run may write a decision for")
    ap.add_argument("--decisions-rel", required=True,
                    help="the slice's decisions dir relative to product-base "
                         "(e.g. product-os/<domain>/slices/<slice>/decisions)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.marketing_manifest):
        sys.stderr.write(f"persist_marketing.py: missing marketing manifest {args.marketing_manifest}\n")
        return 2

    man = load(args.marketing_manifest)
    mk = man.get("marketing", man) if isinstance(man, dict) else {}

    # --- containment: the manifest must be about the target slice ----------------------
    man_ref = mk.get("slice_ref")
    if man_ref and man_ref != args.slice_ref:
        sys.stderr.write(f"persist_marketing.py: manifest slice_ref '{man_ref}' != "
                         f"--slice-ref '{args.slice_ref}' — refusing (containment)\n")
        return 2

    decisions = mk.get("decisions") or []
    dec_dir = os.path.join(args.product_base, args.decisions_rel)

    written, skipped, refused, changed = [], [], [], {"decisions": []}

    for rec in decisions:
        did, inner = decision_id(rec)
        if not did:
            refused.append("(no id)")            # defensive: a decision must carry an id
            continue
        node = decision_node(rec)
        if node and node != args.slice_ref:
            sys.stderr.write(f"persist_marketing.py: decision '{did}' node_ref '{node}' is not "
                             f"'{args.slice_ref}' — refusing (containment)\n")
            return 2
        dpath = os.path.join(dec_dir, f"{did}.yaml")
        if os.path.exists(dpath):
            skipped.append(did)                  # never edit an accepted decision in place
            continue
        os.makedirs(dec_dir, exist_ok=True)
        with open(dpath, "w", encoding="utf-8") as fh:
            yaml.safe_dump(rec, fh, sort_keys=False, allow_unicode=True)
        written.append(did)
        changed["decisions"].append(did)

    manifest = {"applied": True,               # stamped on a completed run, even with no decision
                "slice_ref": args.slice_ref,
                "written": sorted(written),
                "skipped": sorted(skipped),
                "refused": sorted(refused),
                "changed": changed}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
