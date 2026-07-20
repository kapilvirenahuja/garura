#!/usr/bin/env python3
"""
persist_arch.py — /arch's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_arch.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft tree and NO doc copy: the LLM
authoring skill (author-architecture-lens) already wrote the one per-node lens doc
(architecture.md) straight to the live model, re-deriving this slice's lens in place. This
script owns the SHARED files — the material-choice `decisions/` — and writes each decision
the manifest names to the live model IN PLACE, keyed to its declared path:

  - decisions (`<domain>/slices/<slice>/decisions/<id>.yaml`, skip-if-exists): a decision
    is written only when it is absent; an accepted decision already on disk is left
    byte-untouched (recorded as skipped) — /arch never edits an accepted decision in place
    (it supersedes with a new record). This is the node-level containment the file-level
    scoped guard cannot see.

It REFUSES any manifest entry whose target path is not a decision (`*decisions/*.yaml`) —
the authoring skill writes the lens doc itself; this script owns nothing else. It reads the
arch manifest (STM, non-model) for the decisions; it does NOT read a draft tree, does NOT
copy the lens doc, and NEVER writes the spine, the profile, the slice record, or another
lens. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_arch.py --manifest <arch-manifest.yaml> \
        --product-base <product_base> --out-manifest <persist-manifest.json>

Prints {applied, written[], skipped[], refused[]} JSON (`applied: true` is the
stop-condition gate's persist record, D1/D2). A run whose manifest carries no material
decision still stamps `applied: true` with an empty `written` (the lens doc was the only
delta, written live by the skill). Exit 0 on success, 2 on usage/parse/containment error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_arch.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def is_decision_rel(rel):
    """A manifest target is in scope iff it is a decision yaml under a decisions/ dir."""
    parts = os.path.normpath(rel).split(os.sep)
    return "decisions" in parts and rel.endswith(".yaml")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place decision persist for /arch (ADR 026).")
    ap.add_argument("--manifest", required=True,
                    help="arch-manifest.yaml written by author-architecture-lens (carries the decisions)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.manifest):
        sys.stderr.write(f"persist_arch.py: missing arch manifest {args.manifest}\n")
        return 2

    man = load(args.manifest)
    arch = man.get("arch", man) if isinstance(man, dict) else {}
    decisions = arch.get("decisions") or []
    if not isinstance(decisions, list):
        sys.stderr.write("persist_arch.py: manifest 'decisions' must be a list\n")
        return 2

    product_root = os.path.join(args.product_base, "product-os")

    written, skipped, refused = [], [], []
    for dec in decisions:
        if not isinstance(dec, dict):
            refused.append(str(dec))
            continue
        rel = dec.get("rel")
        record = dec.get("decision") or dec.get("record")
        did = dec.get("id") or ((record or {}).get("decision") or {}).get("id") \
            or (record or {}).get("id")
        if not rel or not is_decision_rel(rel):
            refused.append(rel or f"<id:{did}>")   # not a decision path — /arch owns nothing else
            continue
        # rel is product-os-relative (e.g. product-os/<domain>/slices/<slice>/decisions/<id>.yaml)
        rel_norm = rel[len("product-os/"):] if rel.startswith("product-os/") else rel
        dst = os.path.join(product_root, rel_norm)
        tag = f"decision:{did}" if did else f"decision:{rel}"
        if os.path.exists(dst):
            skipped.append(tag)                     # never edit an accepted decision in place
            continue
        if record is None:
            refused.append(rel)                     # nothing to write
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        # write the decision record verbatim (the skill composed it); normalize to a
        # top-level `decision:` block if the manifest handed the fields raw.
        body = record if (isinstance(record, dict) and "decision" in record) else {"decision": record}
        with open(dst, "w", encoding="utf-8") as fh:
            yaml.safe_dump(body, fh, sort_keys=False, allow_unicode=True)
        written.append(tag)

    if refused:
        sys.stderr.write(f"persist_arch.py: refused out-of-scope entries: {refused}\n")
        return 2

    manifest = {"applied": True,
                "written": sorted(written),
                "skipped": sorted(skipped),
                "refused": sorted(refused)}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
