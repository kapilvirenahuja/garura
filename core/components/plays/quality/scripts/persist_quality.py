#!/usr/bin/env python3
"""
persist_quality.py — /quality's deterministic keyed persist, in place on the live model (ADR 026).

Direct-model-write successor of the old apply_quality.py (standards/rules/direct-model-write.md).
There is NO draft tree and NO doc copy: the LLM author-quality-lens skill already wrote the slice's
`lens/quality.md` grounding doc AND its machine sibling `lens/quality-gates.yaml` straight to the
live model. This script owns the SHARED files — the slice's decision records — and writes them in
place, keyed to --slice-ref:

  1. Decisions — one `decisions/<id>.yaml` per material choice the manifest carries, written
     skip-if-exists so an accepted decision is never edited in place; a re-run adds only new ones.
     Each choice is REFUSED when its slice_ref is not the target slice — the node-level containment
     the file-level scoped guard cannot provide.
  2. It stamps the MACHINE applied fields the close's stop-condition gate reads (#464/#466 Batch C)
     by checking the LIVE lens the author wrote is present under the slice: `lens_applied`
     (`lens/quality.md` on disk) and `gates_machine_applied` (`lens/quality-gates.yaml` on disk). If
     the author did not land the lens, these read false and the close halts (never writes the docs
     itself — the LLM owns the per-node docs, this script owns only the shared decisions + the stamp).

It reads the manifest (STM, non-model); it does NOT read a draft tree and does NOT copy the lens
docs. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_quality.py --manifest <quality-manifest.yaml> \
        --product-base <product_base> --slice-ref <domain>/<slice-id> \
        --lens-rel product-os/<domain>/slices/<slice>/lens/quality.md \
        --decided-by /quality --date <YYYY-MM-DD> --out-manifest <persist-manifest.json>

The manifest carries `quality.choices` — the material decisions as structured entries (each with
id, title, reason, level; optional node_ref/slice_ref, alternatives). Manifest JSON:
{ok, written[], skipped[], refused[], changed{decisions[]}, lens_applied, gates_machine_applied}.
Exit 0 applied, 1 refused (containment), 2 usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_quality.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist for /quality (ADR 026).")
    ap.add_argument("--manifest", required=True,
                    help="quality-manifest.yaml (STM, non-model) — carries grounds + material choices")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-ref", required=True,
                    help="the ONLY slice this run may write decisions for (<domain>/<slice-id>)")
    ap.add_argument("--lens-rel", required=True,
                    help="product-os-relative path of the slice's quality.md (author already wrote it)")
    ap.add_argument("--decided-by", default="/quality")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    if not os.path.isdir(live_root):
        sys.stderr.write(f"persist_quality.py: no live model tree at {live_root}\n")
        return 2

    man = (load(args.manifest).get("quality") or {})
    choices = man.get("choices") or []

    # The slice's lens/decisions folders sit under the slice directory of the lens path.
    # lens_rel = product-os/<domain>/slices/<slice>/lens/quality.md
    lens_abs = os.path.join(args.product_base, args.lens_rel)
    lens_dir = os.path.dirname(lens_abs)                       # .../lens
    slice_dir = os.path.dirname(lens_dir)                      # .../slices/<slice>
    gates_abs = os.path.join(lens_dir, "quality-gates.yaml")
    dec_dir = os.path.join(slice_dir, "decisions")

    written, skipped, refused, changed = [], [], [], []

    # --- 1. plan: containment — every material choice must be the target slice's -------------
    for ch in choices:
        if not isinstance(ch, dict):
            refused.append(f"choice is not a mapping: {ch!r}")
            continue
        sref = str(ch.get("slice_ref") or args.slice_ref)
        if args.slice_ref not in sref:
            refused.append(f"decision '{ch.get('id')}' slice_ref '{sref}' is not the target slice "
                           f"'{args.slice_ref}' — refusing (containment)")

    if refused:
        manifest = {"ok": False, "written": [], "skipped": [], "refused": refused,
                    "changed": {"decisions": []}, "lens_applied": False,
                    "gates_machine_applied": False}
        os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
        json.dump(manifest, open(args.out_manifest, "w"), indent=2)
        print(json.dumps(manifest, indent=2))
        return 1

    # --- 2. apply (plan clean): write each decision skip-if-exists, in place -----------------
    for ch in choices:
        did = ch.get("id")
        if not did:
            continue
        dpath = os.path.join(dec_dir, f"{did}.yaml")
        if os.path.exists(dpath):
            skipped.append(f"decision:{did} (exists — never edited in place)")
            continue
        decision = {"decision": {
            "id": did,
            "node_ref": ch.get("node_ref") or args.slice_ref,
            "slice_ref": ch.get("slice_ref") or args.slice_ref,
            "level": ch.get("level") or "product",
            "title": ch.get("title") or did,
            "reason": ch.get("reason") or "",
            "alternatives": ch.get("alternatives") or [],
            "status": "accepted", "superseded_by": None,
            "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
        }}
        os.makedirs(dec_dir, exist_ok=True)
        with open(dpath, "w", encoding="utf-8") as fh:
            yaml.safe_dump(decision, fh, sort_keys=False, allow_unicode=True)
        written.append(f"decision:{did}")
        changed.append(did)

    # --- 3. stamp the machine applied fields from the LIVE lens the author wrote -------------
    lens_applied = os.path.isfile(lens_abs)
    gates_machine_applied = os.path.isfile(gates_abs)

    manifest = {"ok": True, "written": written, "skipped": skipped, "refused": [],
                "slice_ref": args.slice_ref, "changed": {"decisions": changed},
                "lens_applied": lens_applied, "gates_machine_applied": gates_machine_applied}
    os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
    json.dump(manifest, open(args.out_manifest, "w"), indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
