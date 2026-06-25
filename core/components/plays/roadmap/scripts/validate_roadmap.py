#!/usr/bin/env python3
"""
validate_roadmap.py — assert /roadmap wrote ONLY the plan onto the spine slices.

Post-apply verification, comparing the live model to the pre-run snapshot + the computed
plan. Enforces:

  - C6/F6  non-destructive (files): every file under product-os EXCEPT `_spine.yaml` is
           byte-identical to the snapshot — the slice records, grounding docs, nodes, and
           everything else are untouched; nothing added or removed.
  - C2/F2  non-destructive (spine): the spine's domains, capabilities, functionalities,
           profile, and epics are identical to before; each slice changed ONLY in its plan
           fields (order/effort/depends_on/status) — id/slug/domain_ref/functionality_refs/
           record preserved; the set of slices is unchanged.
  - C4/F4  coherent: every planned slice has an integer order and a non-empty effort, and
           the orders form a distinct 1..N sequence.
  - C3/F3  dependencies: for every A depends_on B (both planned), order(B) < order(A).
  - C5/F5  no cycle persisted: the plan's anomaly cycle list is empty.

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

SPINE = "_spine.yaml"
STRUCT = ("domains", "capabilities", "functionalities", "profile", "epics")
SLICE_FIXED = ("id", "slug", "domain_ref", "functionality_refs", "record")


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

    # --- C6/F6 file census: everything except the spine is byte-identical ---
    snap_files = snap.get("files", {})
    now = {}
    for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
        if os.path.isfile(fp) and os.path.basename(fp) != SPINE:
            now[os.path.relpath(fp, root)] = sha256(fp)
    added = set(now) - set(snap_files)
    removed = set(snap_files) - set(now)
    if added:
        errors.append(f"files appeared during the run: {sorted(added)} (F6)")
    if removed:
        errors.append(f"files removed during the run: {sorted(removed)} (F6)")
    for rel, h in now.items():
        if rel in snap_files and h != snap_files[rel]:
            errors.append(f"non-spine file changed: {rel} (F6)")

    # --- C2/F2 spine structural diff: only the slices' plan fields may change ---
    before = snap.get("spine_before", {})
    after = load(os.path.join(root, SPINE))
    for k in STRUCT:
        if before.get(k) != after.get(k):
            errors.append(f"spine '{k}' changed — /roadmap writes only the slices' plan (F2)")
    sb = {s.get("id"): s for s in (before.get("slices") or []) if isinstance(s, dict)}
    sa = {s.get("id"): s for s in (after.get("slices") or []) if isinstance(s, dict)}
    if set(sb) != set(sa):
        errors.append("the set of slices changed during /roadmap (F2)")
    for sid in set(sb) & set(sa):
        for f in SLICE_FIXED:
            if sb[sid].get(f) != sa[sid].get(f):
                errors.append(f"slice '{sid}': non-plan field '{f}' changed (F2)")

    # --- C4/F4 coherent order + effort over planned slices ---
    planned = {p["id"]: p for p in plan.get("plan", [])}
    for sid in planned:
        sl = sa.get(sid) or {}
        if not isinstance(sl.get("order"), int):
            errors.append(f"slice '{sid}': order is not an integer (F4)")
        if not sl.get("effort"):
            errors.append(f"slice '{sid}': planned but has no effort (F4)")
        if sl.get("status") != "planned":
            errors.append(f"slice '{sid}': status is '{sl.get('status')}', must be 'planned' (F4)")
    orders = [sa[s]["order"] for s in planned if isinstance(sa.get(s, {}).get("order"), int)]
    if sorted(orders) != list(range(1, len(planned) + 1)):
        errors.append(f"orders are not a coherent 1..N sequence: {sorted(orders)} (F4)")

    # --- C5/F5 no cycle persisted ---
    if plan.get("anomalies", {}).get("cycles"):
        errors.append(f"dependency cycle present in plan: {plan['anomalies']['cycles']} (F5)")

    # --- C3/F3 dependencies respected ---
    for sid, p in planned.items():
        for dep in p.get("depends_on", []):
            if dep in planned and sa[dep].get("order", 1 << 30) >= sa[sid].get("order", -1):
                errors.append(f"slice '{sid}' depends_on '{dep}' but is ordered ahead of it (F3)")

    print(json.dumps({"ok": not errors, "errors": errors}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
