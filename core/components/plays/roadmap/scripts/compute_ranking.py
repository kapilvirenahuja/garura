#!/usr/bin/env python3
"""
compute_ranking.py — turn a value ordering into a coherent /roadmap ranking.

This is the deterministic heart of /roadmap. The value judgment (which feature is
worth more, read from ICE goals/outcomes) is the skill's job and arrives as
`value-order.yaml`. Everything mechanical happens here, so the LLM never
re-reasons it:

  - C1/F5  rank only functionality nodes with status active|proposed; never a
           capability, domain, or deprecated feature.
  - C5/F4  a feature with no ICE (`ice_present: false`) is un-rankable — it goes to
           the un-rankable report, never gets a guessed priority.
  - C2/F2  two-tier rule: the whole active block is sequenced before the whole
           proposed block.
  - C4/F3  within each tier, a feature never precedes one it depends_on (topological
           order); the skill's value order breaks ties.
  - C4     a cross-tier active→proposed dependency is recorded as an anomaly, never
           resolved by reordering across the tier boundary.
  - C6/F6  the result is a coherent total order — distinct integer priorities,
           1..N, lower = sooner; a dependency cycle within a tier makes it
           incoherent and is reported (ok=false).

Layer rule: pure compute over the snapshot + value order; no git/gh/network.

    python3 compute_ranking.py --snapshot <snapshot.json> \
            --value-order <value-order.yaml> --out <ranking.json>

Prints {ok, errors[], summary} JSON. Exit 0 coherent, 1 on incoherence
(cycle / missing value order), 2 usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("compute_ranking.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def _topo(tier_ids, deps_within, value_rank):
    """Kahn's algorithm; value_rank (lower=preferred) breaks ties among ready nodes.
    Returns (ordered_ids, cycle_ids)."""
    indeg = {i: 0 for i in tier_ids}
    adj = {i: [] for i in tier_ids}
    for a, b in deps_within:           # a depends_on b  ->  b must precede a
        adj[b].append(a)
        indeg[a] += 1
    ready = sorted([i for i in tier_ids if indeg[i] == 0], key=lambda i: value_rank[i])
    ordered = []
    while ready:
        nxt = ready.pop(0)
        ordered.append(nxt)
        for m in adj[nxt]:
            indeg[m] -= 1
            if indeg[m] == 0:
                ready.append(m)
        ready.sort(key=lambda i: value_rank[i])
    cycle = [i for i in tier_ids if i not in ordered]
    return ordered, cycle


def main(argv=None):
    ap = argparse.ArgumentParser(description="Compute the /roadmap ranking.")
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--value-order", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    try:
        snap = json.load(open(args.snapshot, encoding="utf-8"))
        vo = (yaml.safe_load(open(args.value_order, encoding="utf-8")) or {})
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"compute_ranking.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    nodes = {n["id"]: n for n in snap.get("nodes", []) if n.get("id")}
    errors = []

    # --- partition (C1/C5) ---------------------------------------------------
    feats = [n for n in nodes.values() if n["type"] == "functionality"]
    unrankable = sorted(n["id"] for n in feats
                        if n["status"] in ("active", "proposed") and not n["ice_present"])
    unrankable_set = set(unrankable)
    active = [n["id"] for n in feats
             if n["status"] == "active" and n["ice_present"]]
    proposed = [n["id"] for n in feats
               if n["status"] == "proposed" and n["ice_present"]]
    rankable = set(active) | set(proposed)

    # --- value order from the skill, per tier --------------------------------
    vo_root = vo.get("value_order") or vo
    vo_active = list(vo_root.get("active") or [])
    vo_proposed = list(vo_root.get("proposed") or [])

    def value_rank(tier_ids, vo_list, tier):
        rank = {}
        for idx, fid in enumerate(vo_list):
            rank[fid] = idx
        for fid in tier_ids:
            if fid not in rank:
                errors.append(f"{tier} feature '{fid}' missing from value order — "
                              f"cannot break ties (C6/F6)")
                rank[fid] = len(vo_list)        # deterministic fallback
        return rank

    ra = value_rank(set(active), vo_active, "active")
    rp = value_rank(set(proposed), vo_proposed, "proposed")

    # --- dependency edges among rankable features ----------------------------
    cross_tier = []                                # active depends_on proposed (anomaly)
    deps_active, deps_proposed = [], []
    tier_of = {**{i: "active" for i in active}, **{i: "proposed" for i in proposed}}
    for fid in rankable:
        for dep in nodes[fid]["depends_on"]:
            if dep not in rankable:
                continue                            # dep on non-rankable node: ignore for ordering
            if tier_of[fid] == tier_of[dep]:
                (deps_active if tier_of[fid] == "active" else deps_proposed).append((fid, dep))
            elif tier_of[fid] == "active" and tier_of[dep] == "proposed":
                cross_tier.append({"dependent": fid, "depends_on": dep})
            # proposed depends_on active: satisfied by the tier rule, no action

    # --- topological order within each tier (C4), value tie-break ------------
    ord_active, cyc_active = _topo(set(active), deps_active, ra)
    ord_proposed, cyc_proposed = _topo(set(proposed), deps_proposed, rp)
    if cyc_active:
        errors.append(f"dependency cycle among active features: {sorted(cyc_active)} (C6/F6)")
    if cyc_proposed:
        errors.append(f"dependency cycle among proposed features: {sorted(cyc_proposed)} (C6/F6)")

    # --- assign integer priorities: active block, then proposed block (C2) ---
    ranking = []
    seq = 1
    for fid in ord_active:
        ranking.append({"id": fid, "tier": "active", "priority": seq, "reason": None})
        seq += 1
    for fid in ord_proposed:
        ranking.append({"id": fid, "tier": "proposed", "priority": seq, "reason": None})
        seq += 1

    # carry the skill's one-line reasons through, by id
    reasons = {}
    for entry in (vo_root.get("reasons") or []):
        if isinstance(entry, dict) and entry.get("id"):
            reasons[entry["id"]] = entry.get("reason")
    for r in ranking:
        r["reason"] = reasons.get(r["id"])

    # features whose existing priority must be cleared (now excluded) (C7) -----
    clear = sorted(n["id"] for n in feats
                   if n["priority"] is not None
                   and (n["id"] in unrankable_set or n["id"] not in rankable))

    out = {
        "ranking": ranking,
        "unrankable": unrankable,
        "clear": clear,
        "anomalies": {"cross_tier_deps": cross_tier,
                      "cycles": sorted(cyc_active + cyc_proposed)},
        "tiers": {"active": ord_active, "proposed": ord_proposed},
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)

    summary = {"active": len(ord_active), "proposed": len(ord_proposed),
               "unrankable": len(unrankable), "cross_tier_deps": len(cross_tier),
               "cleared": len(clear)}
    print(json.dumps({"ok": not errors, "errors": errors, "summary": summary}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
