#!/usr/bin/env python3
"""
apply_roadmap.py — persist /roadmap's plan onto the SPINE slices, plan fields only.

Run only AFTER the human approves the checkpoint. It read-modify-writes the live
`_spine.yaml`: for each planned slice it sets ONLY the plan fields — `order`, `effort`,
`depends_on`, and `status` (-> `planned`) — on that slice's spine index entry, preserving
every other part of the spine (domains/capabilities/functionalities/profile/epics and the
slice's own id/slug/domain_ref/functionality_refs/record). The slice RECORDS and grounding
docs are never opened, so composition is structurally unreachable from here (C2/F2, C6/F6).

Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 apply_roadmap.py --plan <plan.json> --snapshot <snapshot.json> \
            --product-base <product_base> --out-manifest <apply-manifest.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("apply_roadmap.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SPINE = "_spine.yaml"
PLAN_FIELDS = ("order", "effort", "depends_on", "status")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /roadmap plan onto the spine slices.")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--snapshot", required=True)   # kept for interface parity; not required to write
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    try:
        plan = json.load(open(args.plan, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"apply_roadmap.py: cannot read plan: {exc}\n")
        sys.exit(2)

    spine_path = os.path.join(args.product_base, "product-os", SPINE)
    if not os.path.isfile(spine_path):
        sys.stderr.write(f"apply_roadmap.py: no spine at {spine_path}\n")
        sys.exit(2)
    with open(spine_path, encoding="utf-8") as fh:
        spine = yaml.safe_load(fh) or {}
    by_id = {s.get("id"): s for s in (spine.get("slices") or []) if isinstance(s, dict)}

    changes, changed = [], False
    for entry in plan.get("plan", []):
        sid = entry["id"]
        sl = by_id.get(sid)
        if sl is None:
            sys.stderr.write(f"apply_roadmap.py: spine has no slice '{sid}'\n")
            continue
        before = {k: sl.get(k) for k in PLAN_FIELDS}
        sl["order"] = entry["order"]
        sl["effort"] = entry["effort"]
        sl["depends_on"] = entry.get("depends_on") or []
        sl["status"] = "planned"
        after = {k: sl.get(k) for k in PLAN_FIELDS}
        if before != after:
            changed = True
        changes.append({"id": sid, "from": before, "to": after})

    if changed:
        with open(spine_path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(spine, fh, sort_keys=False, allow_unicode=True)

    out = {"written": [SPINE] if changed else [], "changes": changes}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
