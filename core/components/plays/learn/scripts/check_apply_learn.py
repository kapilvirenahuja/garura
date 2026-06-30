#!/usr/bin/env python3
"""
check_apply_learn.py — assert /learn's persisted result obeys its guarantees.

Post-apply verification: diff the spine before/after and prove /learn touched ONLY meaning.

  - skeleton untouched (C2/F2): every domain byte-identical; no capability or functionality
    added or removed; for each, id / slug / parent (a capability's `domain`, a functionality's
    `capability`) and `doc` ref unchanged.
  - meaning-only (C2/C9, F9): the only capability/functionality keys that may differ are
    `one_line`, `nfr_needs`, `status`, `decisions`; any other changed key is a violation.
  - slices + epics frozen (C2/F2): both collections byte-identical (no slice/epic rewrite).
  - nfr monotonic-up (C6/F6): no nfr level fell, on any capability or on the profile.
  - decisions append-only (C7/C10, F7/F10): every node's `decisions` list after is a prefix-
    extension of before (nothing removed or reordered).
  - changed nodes are the manifest's named nodes (allowlist).

Layer rule: reads files on disk only; no git/gh/network.

    python3 check_apply_learn.py --manifest <apply-manifest.json> \
        --spine-before <saved before _spine.yaml> --spine-after <live _spine.yaml> \
        [--docs-before <dir>]

Prints {ok, errors[]} JSON. Exit 0 clean, 1 on any violation, 2 on usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_apply_learn.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]
MEANING = {"one_line", "nfr_needs", "status", "decisions"}
PARENT = {"capabilities": "domain", "functionalities": "capability"}


def rank(level):
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def by_id(spine, key):
    return {e.get("id"): e for e in (spine.get(key) or []) if isinstance(e, dict)}


def is_prefix(before_list, after_list):
    bl = before_list or []
    al = after_list or []
    return al[:len(bl)] == bl


def nfr_levels(node, key="nfr_needs"):
    out = {}
    for dim, spec in (node.get(key) or {}).items():
        out[dim] = (spec or {}).get("level") if isinstance(spec, dict) else spec
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify /learn's persisted result.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--spine-before", required=True)
    ap.add_argument("--spine-after", required=True)
    ap.add_argument("--docs-before", default=None)
    args = ap.parse_args(argv)

    try:
        manifest = json.load(open(args.manifest, encoding="utf-8"))
        before = load(args.spine_before)
        after = load(args.spine_after)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"check_apply_learn.py: cannot read input: {exc}\n")
        return 2

    errors = []
    named = set(manifest.get("nodes_named") or [])
    changed_nodes = set()

    # --- domains untouched --------------------------------------------------------
    db, da = by_id(before, "domains"), by_id(after, "domains")
    for did in set(db) | set(da):
        if db.get(did) != da.get(did):
            errors.append(f"domain '{did}' changed — /learn changes no domain (C2)")

    # --- capabilities + functionalities: meaning-only, no add/remove, parent fixed -
    for coll in ("capabilities", "functionalities"):
        nb, na = by_id(before, coll), by_id(after, coll)
        if set(nb) != set(na):
            added = set(na) - set(nb)
            removed = set(nb) - set(na)
            if added:
                errors.append(f"{coll} added {sorted(added)} — /learn adds no node (C2)")
            if removed:
                errors.append(f"{coll} removed {sorted(removed)} — /learn removes no node (C2)")
        parent_key = PARENT[coll]
        for nid in set(nb) & set(na):
            b, a = nb[nid], na[nid]
            if b == a:
                continue
            changed_nodes.add(nid)
            # skeleton fields frozen
            for sk in ("id", "slug", parent_key, "doc"):
                if b.get(sk) != a.get(sk):
                    errors.append(f"{coll[:-3]} '{nid}': skeleton field '{sk}' changed (C2/F2)")
            # only meaning keys may differ
            diff_keys = {k for k in set(b) | set(a) if b.get(k) != a.get(k)}
            stray = diff_keys - MEANING
            if stray:
                errors.append(f"{coll[:-3]} '{nid}': non-meaning field(s) changed {sorted(stray)} "
                              "(C2/C9)")
            # nfr monotonic-up
            lb, la = nfr_levels(b), nfr_levels(a)
            for dim in lb:
                if rank(la.get(dim)) < rank(lb.get(dim)):
                    errors.append(f"{coll[:-3]} '{nid}': nfr '{dim}' fell (C6/F6)")
            # decisions append-only
            if not is_prefix(b.get("decisions"), a.get("decisions")):
                errors.append(f"{coll[:-3]} '{nid}': decisions not append-only (C7/F7)")

    # --- slices + epics frozen ----------------------------------------------------
    for coll in ("slices", "epics"):
        if (before.get(coll) or []) != (after.get(coll) or []):
            errors.append(f"{coll} changed — /learn rewrites no {coll[:-1]} (C2/F2)")

    # --- profile: only nfr levels may move, monotonic-up --------------------------
    pb, pa = before.get("profile") or {}, after.get("profile") or {}
    lb, la = nfr_levels(pb, "nfr"), nfr_levels(pa, "nfr")
    for dim in lb:
        if rank(la.get(dim)) < rank(lb.get(dim)):
            errors.append(f"profile nfr '{dim}' fell (C6/F6)")
    pb_rest = {k: v for k, v in pb.items() if k not in ("nfr", "decisions")}
    pa_rest = {k: v for k, v in pa.items() if k not in ("nfr", "decisions")}
    if pb_rest != pa_rest:
        errors.append("profile changed beyond nfr levels / decisions (C2/C9)")

    # --- changed nodes are within the manifest's named set ------------------------
    stray_nodes = changed_nodes - named
    if named and stray_nodes:
        errors.append(f"nodes changed but not named in the manifest: {sorted(stray_nodes)} "
                      "(allowlist, C9)")

    out = {"ok": not errors, "errors": errors,
           "changed_nodes": sorted(changed_nodes)}
    print(json.dumps(out, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
