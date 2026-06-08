#!/usr/bin/env python3
"""
rollup_box.py — roll a capability's NFR needs into the product profile box.

The deterministic core of /understand's governance. The enrich skill made the
judgment call (what level each concrete need implies); this script does the pure
threshold math the orchestrator must never re-reason:

  - Monotonic-up: each dimension's committed level becomes max(current box, need).
    A dimension is NEVER lowered (C6/F6) — structurally guaranteed by max().
  - Establish vs move (the box-state distinction):
      * state == directional -> ESTABLISH the box from the rolled-up levels and firm
        it to `set`. No box-moves, no decisions (the directional box was never a
        committed ceiling).
      * state == set -> any dimension whose need exceeds the committed level, or any
        new compliance regime, is an OUT-OF-BOX move -> emit it as a box_move needing
        a product-level decision, and flag out_of_box (the play halts for approval).
  - Never writes `locked` (that is /shape's gate).

Layer rule: reads the current profile + the enrich manifest from disk; writes a
proposed profile + a roll-up report. No git/gh/network.

    python3 rollup_box.py --profile <profile.yaml> --enrich-manifest <enrich-manifest.yaml> \
                          --out-profile <proposed-profile.yaml> --out-report <rollup.json>

Exit 0 on success, 2 on usage/parse error. A non-zero exit never means "out of box"
— out_of_box is reported in the JSON; halting is the play's policy, not the script's.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("rollup_box.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

SCALE = ["none", "low", "medium", "high", "xhigh"]


def rank(level):
    """Index on the none<low<medium<high<xhigh scale; unknown -> none (0)."""
    try:
        return SCALE.index((level or "none").strip().lower())
    except ValueError:
        return 0


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Roll NFR needs into the profile box.")
    ap.add_argument("--profile", required=True, help="current profile.yaml")
    ap.add_argument("--enrich-manifest", required=True, help="enrich-manifest.yaml")
    ap.add_argument("--out-profile", required=True, help="where to write the proposed profile")
    ap.add_argument("--out-report", required=True, help="where to write the roll-up report JSON")
    args = ap.parse_args(argv)

    try:
        prof_doc = load(args.profile)
        man_doc = load(args.enrich_manifest)
    except (OSError, yaml.YAMLError) as exc:
        sys.stderr.write(f"rollup_box.py: cannot read input: {exc}\n")
        sys.exit(2)

    profile = prof_doc.get("profile", prof_doc) if isinstance(prof_doc, dict) else {}
    enrich = man_doc.get("enrich", man_doc) if isinstance(man_doc, dict) else {}

    state_before = (profile.get("state") or "directional").strip().lower()
    establishing = state_before == "directional"
    nfr = dict(profile.get("nfr") or {})
    compliance = list(profile.get("compliance") or [])

    implied = enrich.get("implied_levels") or {}
    need_compliance = enrich.get("compliance") or []

    box_moves = []
    compliance_added = []

    # --- monotonic-up per dimension -----------------------------------------
    for dim, spec in implied.items():
        if isinstance(spec, dict):
            need_level, need_gate = spec.get("level"), spec.get("gate")
        else:                       # tolerate a bare level string
            need_level, need_gate = spec, None
        cur = nfr.get(dim) or {}
        cur_level = cur.get("level")
        if rank(need_level) > rank(cur_level):
            # raising this dimension
            if not establishing:    # on a SET box this is an out-of-box move
                box_moves.append({"dimension": dim,
                                  "from": cur_level or "none",
                                  "to": need_level})
            nfr[dim] = {"level": need_level, "gate": need_gate or cur.get("gate") or ""}
        else:
            # need is within the box — keep the (higher-or-equal) current level
            nfr[dim] = {"level": cur_level, "gate": cur.get("gate") or need_gate or ""}

    # --- compliance union ----------------------------------------------------
    for regime in need_compliance:
        if regime not in compliance:
            compliance.append(regime)
            compliance_added.append(regime)
            if not establishing:
                box_moves.append({"dimension": f"compliance:{regime}",
                                  "from": "absent", "to": "required"})

    state_after = "set"             # /understand always firms to set, never locked
    out_of_box = (not establishing) and bool(box_moves)

    proposed = dict(profile)
    proposed["state"] = state_after
    proposed["nfr"] = nfr
    proposed["compliance"] = compliance

    with open(args.out_profile, "w", encoding="utf-8") as fh:
        yaml.safe_dump({"profile": proposed}, fh, sort_keys=False)

    report = {
        "state_before": state_before,
        "state_after": state_after,
        "establishing": establishing,
        "out_of_box": out_of_box,
        "box_moves": box_moves,
        "compliance_added": compliance_added,
    }
    with open(args.out_report, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
