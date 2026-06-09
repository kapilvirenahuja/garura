#!/usr/bin/env python3
"""
apply_roadmap.py — persist /roadmap's plan onto slices, plan fields only.

Run only AFTER the human approves the checkpoint. For each planned slice it does a
read-modify-write that changes ONLY the plan fields — `order`, `effort`, `depends_on`,
and `status` (-> `planned`) — preserving every other field (C2/F2, C6/F6). It is handed
only the plan + the snapshot (for each slice's file path), so it cannot reach a slice's
composition, ICE, structure, the profile, the lenses, or decisions.

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

PLAN_FIELDS = ("order", "effort", "depends_on", "status")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Persist /roadmap plan (plan fields only).")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    try:
        plan = json.load(open(args.plan, encoding="utf-8"))
        snap = json.load(open(args.snapshot, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"apply_roadmap.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    rel_of = {s["id"]: s["rel"] for s in snap.get("slices", []) if s.get("id")}

    written, changes = [], []
    for entry in plan.get("plan", []):
        sid = entry["id"]
        rel = rel_of.get(sid)
        if not rel:
            sys.stderr.write(f"apply_roadmap.py: no path for slice '{sid}' in snapshot\n")
            continue
        sf = os.path.join(root, rel)
        if not os.path.isfile(sf):
            sys.stderr.write(f"apply_roadmap.py: slice not found at {sf}\n")
            continue
        with open(sf, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
        sl = doc.get("slice", doc)
        before = {k: sl.get(k) for k in PLAN_FIELDS}
        sl["order"] = entry["order"]
        sl["effort"] = entry["effort"]
        sl["depends_on"] = entry.get("depends_on") or []
        sl["status"] = "planned"
        after = {k: sl.get(k) for k in PLAN_FIELDS}
        with open(sf, "w", encoding="utf-8") as fh:
            yaml.safe_dump(doc, fh, sort_keys=False)
        if before != after:
            written.append(rel)
        changes.append({"id": sid, "rel": rel, "from": before, "to": after})

    out = {"written": sorted(set(written)), "changes": changes}
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
