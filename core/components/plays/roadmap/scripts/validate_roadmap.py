#!/usr/bin/env python3
"""
validate_roadmap.py — assert /roadmap's persisted result obeys every guarantee.

Post-apply verification, comparing the live model against the pre-run snapshot and
the computed ranking. Enforces:

  - C7/F7  non-destructive: every file under product-os is byte-identical to the
           snapshot EXCEPT feature node files whose only changed field is `priority`.
           No non-node file changed; no node field other than `priority` changed.
  - C1/F5  no capability, domain, or deprecated feature carries a non-null priority.
  - C5/F4  every un-rankable feature (no ICE) has a null priority; the un-rankable
           set is exactly the active|proposed features with no ICE.
  - C2/F2  two-tier rule: max priority among active features < min among proposed.
  - C4/F3  within a tier, priority(dep) <= priority(dependent) for every intra-tier
           depends_on edge.
  - C6/F6  coherent order: ranked features carry distinct integer priorities forming
           1..N with no gaps; no dependency cycle was reported.
  - C8/F8  schema: every feature node still validates against product-os v1
           (priority is an int or null; required node fields present).

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_roadmap.py --snapshot <snapshot.json> --ranking <ranking.json> \
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


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


REQUIRED_NODE_FIELDS = ("id", "type", "name", "status")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /roadmap's persisted result.")
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--ranking", required=True)
    ap.add_argument("--apply-manifest", required=True)
    ap.add_argument("--product-base", required=True)
    args = ap.parse_args(argv)

    try:
        snap = json.load(open(args.snapshot, encoding="utf-8"))
        ranking = json.load(open(args.ranking, encoding="utf-8"))
        json.load(open(args.apply_manifest, encoding="utf-8"))
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"validate_roadmap.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    root = os.path.join(args.product_base, "product-os")
    errors = []
    snap_files = snap.get("files", {})
    snap_nodes = {n["rel"]: n for n in snap.get("nodes", [])}
    node_rels = set(snap_nodes)

    # --- C7/F7 non-destructive: file census ---------------------------------
    now_files = {}
    for fp in glob.glob(os.path.join(root, "**", "*"), recursive=True):
        if os.path.isfile(fp):
            now_files[os.path.relpath(fp, root)] = sha256(fp)
    # no file added or removed
    added = set(now_files) - set(snap_files)
    removed = set(snap_files) - set(now_files)
    if added:
        errors.append(f"files appeared during the run: {sorted(added)} (F7)")
    if removed:
        errors.append(f"files removed during the run: {sorted(removed)} (F7)")
    # every changed file must be a feature node, changed in `priority` only
    for rel, h in now_files.items():
        if rel in snap_files and h == snap_files[rel]:
            continue
        if rel not in node_rels:
            errors.append(f"non-node file changed: {rel} (F7)")
            continue
        before = snap_nodes[rel]
        if before["type"] != "functionality":
            errors.append(f"non-feature node changed: {rel} (type {before['type']}) (F7)")
            continue
        after = (load(os.path.join(root, rel)).get("node") or {})
        # compare the FULL node minus priority — every other field must be unchanged
        before_node = dict(before.get("node") or {})
        after_node = dict(after)
        before_node.pop("priority", None)
        after_node.pop("priority", None)
        changed = sorted(k for k in set(before_node) | set(after_node)
                         if before_node.get(k) != after_node.get(k))
        if changed:
            errors.append(f"{rel}: fields other than priority changed: {changed} (F7)")

    # --- build after-state priority map for feature nodes -------------------
    feat_after = {}        # id -> (status, priority, type)
    for rel, before in snap_nodes.items():
        after = (load(os.path.join(root, rel)).get("node") or {})
        feat_after[after.get("id", before["id"])] = {
            "type": after.get("type"), "status": after.get("status"),
            "priority": after.get("priority"), "ice_present": before["ice_present"],
            "depends_on": list(after.get("depends_on") or []), "rel": rel,
        }

    # --- C8/F8 schema -------------------------------------------------------
    for rel, before in snap_nodes.items():
        if before["type"] != "functionality":
            continue
        node = (load(os.path.join(root, rel)).get("node") or {})
        for f in REQUIRED_NODE_FIELDS:
            if node.get(f) in (None, "", []):
                errors.append(f"{rel}: required node field '{f}' missing (F8)")
        pri = node.get("priority")
        if pri is not None and not isinstance(pri, int):
            errors.append(f"{rel}: priority '{pri}' is not an integer or null (F8)")

    # --- C1/F5 only active|proposed features carry a priority ---------------
    for fid, info in feat_after.items():
        is_rankable_feat = info["type"] == "functionality" and info["status"] in ("active", "proposed")
        if not is_rankable_feat and info["priority"] is not None:
            errors.append(f"{fid}: {info['type']}/{info['status']} carries priority "
                          f"{info['priority']} — only active|proposed features may (F5)")

    # --- C5/F4 un-rankable have null priority -------------------------------
    declared_unrankable = set(ranking.get("unrankable", []))
    for fid, info in feat_after.items():
        if info["type"] != "functionality" or info["status"] not in ("active", "proposed"):
            continue
        if not info["ice_present"]:
            if fid not in declared_unrankable:
                errors.append(f"{fid}: no ICE but absent from the un-rankable report (F4)")
            if info["priority"] is not None:
                errors.append(f"{fid}: no ICE but carries priority {info['priority']} (F4)")

    # --- C2/F2 tier rule + C6/F6 coherent + C4/F3 deps ----------------------
    ranked = {e["id"]: e for e in ranking.get("ranking", [])}
    active_pri = [feat_after[i]["priority"] for i in ranked
                  if feat_after.get(i, {}).get("status") == "active"]
    proposed_pri = [feat_after[i]["priority"] for i in ranked
                    if feat_after.get(i, {}).get("status") == "proposed"]
    if active_pri and proposed_pri and max(active_pri) >= min(proposed_pri):
        errors.append("a proposed feature out-ranks an active one — tier rule broken (F2)")

    pris = [feat_after[i]["priority"] for i in ranked if feat_after.get(i, {}).get("priority") is not None]
    if len(pris) != len(ranked):
        errors.append("a ranked feature has no integer priority (F6)")
    if sorted(pris) != list(range(1, len(ranked) + 1)):
        errors.append(f"priorities are not a coherent 1..N sequence: {sorted(pris)} (F6)")
    if ranking.get("anomalies", {}).get("cycles"):
        errors.append(f"dependency cycle reported: {ranking['anomalies']['cycles']} (F6)")

    tier_of = {i: feat_after[i]["status"] for i in ranked if i in feat_after}
    for fid in ranked:
        for dep in feat_after.get(fid, {}).get("depends_on", []):
            if dep in ranked and tier_of.get(dep) == tier_of.get(fid):
                if feat_after[dep]["priority"] > feat_after[fid]["priority"]:
                    errors.append(f"{fid} depends_on {dep} but is ranked ahead of it (F3)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
