#!/usr/bin/env python3
"""
validate_roadmap.py — assert /roadmap's persisted plan obeys every guarantee.

Post-apply verification, comparing the live model against the pre-run snapshot and the
computed plan. Enforces:

  - C6/F6  non-destructive: every file under product-os is byte-identical to the
           snapshot EXCEPT slice files whose only changed fields are the plan fields
           (order/effort/depends_on/status). No non-slice file changed; nothing added
           or removed.
  - C2/F2  plan-only: on a changed slice, no field outside the plan fields differs.
  - C1/F1  only slices carry a plan — no non-slice artifact gained order/effort.
  - C4/F4  coherent: every planned slice has an integer order and a non-empty effort;
           orders are distinct and form 1..N.
  - C3/F3  dependencies: for every resolved A depends_on B (both planned),
           order(B) < order(A).
  - C5/F5  no cycle persisted: the plan's anomaly list of cycles is empty.
  - C7/F7  schema: every slice still validates against slice v1 (required fields,
           order int, effort non-empty when planned).

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_roadmap.py --snapshot <snapshot.json> --plan <plan.json> \
            --apply-manifest <apply-manifest.json> --product-base <product_base>

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on violation, 2 usage error.
"""

import argparse
import glob
import hashlib
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_roadmap.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

PLAN_FIELDS = ("order", "effort", "depends_on", "status")
REQUIRED = ("id", "domain_ref", "name", "outcome", "acceptance_intent", "functionalities")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /roadmap's persisted plan.")
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--plan", required=True)
    ap.add_argument("--apply-manifest", required=True)
    ap.add_argument("--product-base", required=True)
    args = ap.parse_args(argv)

    try:
        snap = json.load(open(args.snapshot, encoding="utf-8"))
        plan = json.load(open(args.plan, encoding="utf-8"))
        json.load(open(args.apply_manifest, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"validate_roadmap.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    errors = []
    snap_files = snap.get("files", {})
    snap_slices = {s["rel"]: s for s in snap.get("slices", [])}
    slice_rels = set(snap_slices)

    # --- C6/F6 file census ---------------------------------------------------
    now_files = {}
    for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
        if os.path.isfile(fp):
            now_files[os.path.relpath(fp, root)] = sha256(fp)
    added = set(now_files) - set(snap_files)
    removed = set(snap_files) - set(now_files)
    if added:
        errors.append(f"files appeared during the run: {sorted(added)} (F6)")
    if removed:
        errors.append(f"files removed during the run: {sorted(removed)} (F6)")
    for rel, h in now_files.items():
        if rel in snap_files and h == snap_files[rel]:
            continue
        if rel not in slice_rels:
            errors.append(f"non-slice file changed: {rel} (F6)")
            continue
        before = dict(snap_slices[rel].get("slice") or {})
        after = (load(os.path.join(root, rel)).get("slice") or {})
        b = {k: v for k, v in before.items() if k not in PLAN_FIELDS}
        a = {k: v for k, v in after.items() if k not in PLAN_FIELDS}
        diff = sorted(k for k in set(b) | set(a) if b.get(k) != a.get(k))
        if diff:
            errors.append(f"{rel}: non-plan fields changed: {diff} (F2)")

    # --- after-state planned slices -----------------------------------------
    planned = {p["id"]: p for p in plan.get("plan", [])}
    after_by_id = {}
    for rel in snap_slices:
        sl = (load(os.path.join(root, rel)).get("slice") or {})
        if sl.get("id"):
            after_by_id[sl["id"]] = sl

    # --- C7/F7 schema + C4/F4 each planned slice has order+effort ------------
    for sid, sl in after_by_id.items():
        for f in REQUIRED:
            if sl.get(f) in (None, "", []):
                errors.append(f"slice '{sid}': required field '{f}' missing (F7)")
        if sid in planned:
            if not isinstance(sl.get("order"), int):
                errors.append(f"slice '{sid}': order is not an integer (F4)")
            if not sl.get("effort"):
                errors.append(f"slice '{sid}': planned but has no effort (F4)")

    # --- C4/F4 coherent 1..N over planned slices ----------------------------
    orders = [after_by_id[s]["order"] for s in planned if isinstance(after_by_id.get(s, {}).get("order"), int)]
    if len(orders) != len(planned):
        errors.append("a planned slice has no integer order (F4)")
    if sorted(orders) != list(range(1, len(planned) + 1)):
        errors.append(f"orders are not a coherent 1..N sequence: {sorted(orders)} (F4)")

    # --- C5/F5 no cycle persisted -------------------------------------------
    if plan.get("anomalies", {}).get("cycles"):
        errors.append(f"dependency cycle present in plan: {plan['anomalies']['cycles']} (F5)")

    # --- C3/F3 dependencies respected ---------------------------------------
    for sid, p in planned.items():
        for dep in p.get("depends_on", []):
            if dep in planned:
                if after_by_id[dep]["order"] >= after_by_id[sid]["order"]:
                    errors.append(f"slice '{sid}' depends_on '{dep}' but is ordered ahead of it (F3)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
