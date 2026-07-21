#!/usr/bin/env python3
"""
persist_roadmap.py — /roadmap's deterministic keyed persist, in place on the live model.

Direct-model-write remnant of the old apply_roadmap.py (ADR 026,
standards/rules/direct-model-write.md). There is NO draft model tree and NO doc copy:
/roadmap's LLM authoring skill (author-roadmap) writes NO model file at all — it only
drafts plan data to STM, which `compute_plan.py` turns into the coherent `plan.json`.
This script owns the one SHARED file /roadmap touches — the spine `_spine.yaml` — and
writes the plan onto the spine slices index IN PLACE, KEYED by slice id:

  - for each slice in the computed plan, it sets ONLY the four PLAN FIELDS on that
    slice's spine index entry — `order`, `effort`, resolved `depends_on`, and the
    `status` flip to `planned` — preserving every other part of that entry
    (id/slug/domain_ref/functionality_refs/record) and every other spine collection
    (domains/capabilities/functionalities/profile/epics) byte-untouched.
  - it REFUSES a plan that names a slice id absent from the live spine (exit non-zero),
    and it never opens a slice RECORD, a grounding doc, or any collection other than the
    spine slices index. This is the node-level containment the file-level scoped guard
    cannot see inside the shared spine — /roadmap NEVER writes a plan onto a non-slice,
    and NEVER touches a slice's composition.

It reads the computed `plan.json` (STM, non-model) for what to apply; it does NOT read a
draft tree, does NOT copy docs, and runs NO before/after census (the post-write
`scoped_write_guard.py` is now the non-destructive containment proof). Layer rule: pure
file writes from disk inputs; no git/gh/network.

    python3 persist_roadmap.py --plan <plan.json> \
        --product-base <product_base> --out-manifest <persist-manifest.json>

Prints {applied, written[], skipped[], changed{}} JSON (`applied: true` is the
stop-condition gate's persist record, D1/D2; entries tagged `spine:slice:<id>`) so the
play has its non-destructive-re-run evidence. Exit 0 on success, 2 on usage/parse/
containment error (a plan slice id absent from the live spine).
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_roadmap.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SPINE = "_spine.yaml"
PLAN_FIELDS = ("order", "effort", "depends_on", "status")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place plan persist for /roadmap (ADR 026).")
    ap.add_argument("--plan", required=True, help="the computed plan.json (from compute_plan.py)")
    ap.add_argument("--product-base", required=True, help="product.base-path from config")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    try:
        plan = json.load(open(args.plan, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"persist_roadmap.py: cannot read plan: {exc}\n")
        return 2

    spine_path = os.path.join(args.product_base, "product-os", SPINE)
    if not os.path.isfile(spine_path):
        sys.stderr.write(f"persist_roadmap.py: no spine at {spine_path}\n")
        return 2
    with open(spine_path, encoding="utf-8") as fh:
        spine = yaml.safe_load(fh) or {}
    by_id = {s.get("id"): s for s in (spine.get("slices") or []) if isinstance(s, dict)}

    # Containment: refuse a plan that names a slice the live spine does not hold — /roadmap
    # plans only /shape slices, and it never writes a plan onto a non-slice.
    missing = [e["id"] for e in plan.get("plan", []) if e.get("id") not in by_id]
    if missing:
        sys.stderr.write(
            f"persist_roadmap.py: plan names slice(s) absent from the live spine: {missing} "
            f"(containment refusal — /roadmap plans only /shape slices)\n"
        )
        return 2

    written, skipped, changed = [], [], []
    for entry in plan.get("plan", []):
        sid = entry["id"]
        sl = by_id[sid]
        tag = f"spine:slice:{sid}"
        before = {k: sl.get(k) for k in PLAN_FIELDS}
        sl["order"] = entry["order"]
        sl["effort"] = entry["effort"]
        sl["depends_on"] = entry.get("depends_on") or []
        sl["status"] = "planned"
        after = {k: sl.get(k) for k in PLAN_FIELDS}
        if before != after:
            written.append(tag)
            changed.append(sid)
        else:
            skipped.append(tag)

    with open(spine_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)

    manifest = {"applied": True,
                "written": sorted(written),
                "skipped": sorted(skipped),
                "changed": sorted(changed)}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
