#!/usr/bin/env python3
"""
compute_plan.py — turn a plan draft into a coherent /roadmap build plan over slices.

The judgment — effort per slice, resolving each slice's dependency_notes into concrete
`depends_on` slice ids, and a value preference — is the skill's job and arrives as
`plan-draft.yaml`. The mechanical part happens here, so the LLM never re-reasons it:

  - C3/F3  topological order: a slice never precedes one it depends_on; the value
           preference breaks ties among ready slices.
  - C5/F5  global: one order across ALL slices from every shaped domain; a dependency
           cycle is reported (ok=false), never emitted as an order.
  - C4/F4  coherent: distinct integer order 1..N, lower = sooner; every slice carries
           an effort (carried through from the draft).

Layer rule: pure compute over the snapshot + plan draft; no git/gh/network.

    python3 compute_plan.py --snapshot <snapshot.json> --plan-draft <plan-draft.yaml> \
            --out <plan.json>

Prints {ok, errors[], summary} JSON. Exit 0 coherent, 1 on incoherence (cycle /
missing draft entry), 2 usage error.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("compute_plan.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def _topo(ids, deps, value_rank):
    """Kahn; value_rank (lower=preferred) breaks ties. Returns (ordered, cycle)."""
    indeg = {i: 0 for i in ids}
    adj = {i: [] for i in ids}
    for a, b in deps:                  # a depends_on b -> b precedes a
        if a in indeg and b in indeg:
            adj[b].append(a)
            indeg[a] += 1
    ready = sorted([i for i in ids if indeg[i] == 0], key=lambda i: value_rank.get(i, 1 << 30))
    ordered = []
    while ready:
        nxt = ready.pop(0)
        ordered.append(nxt)
        for m in adj[nxt]:
            indeg[m] -= 1
            if indeg[m] == 0:
                ready.append(m)
        ready.sort(key=lambda i: value_rank.get(i, 1 << 30))
    cycle = [i for i in ids if i not in ordered]
    return ordered, cycle


def main(argv=None):
    ap = argparse.ArgumentParser(description="Compute the /roadmap plan over slices.")
    ap.add_argument("--snapshot", required=True)
    ap.add_argument("--plan-draft", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    try:
        snap = json.load(open(args.snapshot, encoding="utf-8"))
        draft = (yaml.safe_load(open(args.plan_draft, encoding="utf-8")) or {})
    except (OSError, ValueError, yaml.YAMLError) as exc:
        sys.stderr.write(f"compute_plan.py: cannot read inputs: {exc}\n")
        sys.exit(2)

    slice_ids = [s["id"] for s in snap.get("slices", []) if s.get("id")]
    errors = []

    droot = draft.get("plan") or draft
    entries = {}
    for e in (droot.get("slices") or []):
        if isinstance(e, dict) and e.get("id"):
            entries[e["id"]] = e

    value_rank = {}
    deps = []
    effort = {}
    for idx, sid in enumerate(droot.get("value_order") or []):
        value_rank[sid] = idx
    for sid in slice_ids:
        e = entries.get(sid)
        if not e:
            errors.append(f"slice '{sid}' missing from the plan draft — no effort/deps (C4/F4)")
            continue
        if not e.get("effort"):
            errors.append(f"slice '{sid}' has no effort in the draft (C4/F4)")
        effort[sid] = e.get("effort")
        for dep in (e.get("depends_on") or []):
            if dep in slice_ids:
                deps.append((sid, dep))
            else:
                errors.append(f"slice '{sid}' depends_on '{dep}' which is not a known slice (F3)")
        if sid not in value_rank:
            value_rank[sid] = len(value_rank)

    ordered, cycle = _topo(slice_ids, deps, value_rank)
    if cycle:
        errors.append(f"dependency cycle among slices: {sorted(cycle)} (C5/F5)")

    plan = []
    for pos, sid in enumerate(ordered, start=1):
        plan.append({"id": sid, "order": pos, "effort": effort.get(sid),
                     "depends_on": sorted({b for a, b in deps if a == sid})})

    out = {"plan": plan, "anomalies": {"cycles": sorted(cycle)},
           "order": [p["id"] for p in plan]}
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)

    summary = {"slices": len(plan), "with_deps": sum(1 for p in plan if p["depends_on"]),
               "cycles": len(cycle)}
    print(json.dumps({"ok": not errors, "errors": errors, "summary": summary}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
