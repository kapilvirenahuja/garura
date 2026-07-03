#!/usr/bin/env python3
"""
check_ready_unit.py — resolve the delivered unit /learn will learn from, and confirm at
least one outcome signal exists (C1/F1).

/learn learns from what SHIPPED. The "unit" is the issue and the slice(s) it delivered. This
resolves them from the spine and gathers the outcome evidence the pipeline already produced:

  - measure lens  — each delivered slice's lens/measure.md (baseline -> target -> realized)
  - validate      — {stm_base}{issue}/evidence/validate/*  (verdicts + fix reports)
  - run lens      — each delivered slice's lens/run.md (production actuals)
  - delivered     — spine epics with issue_ref == issue and status validated|delivered,
                    and their slices' status (realized|delivered)

If the unit does not resolve, or NO outcome signal exists (nothing has delivered yet), this
is a hard halt (C1/REC1). Layer rule: reads files on disk only; no git/gh/network.

    python3 check_ready_unit.py --product-base <pb> --issue <issue> --stm-base <stm_base>

Prints {ok, unit{...}, outcomes{...}, errors[]} JSON. Exit 0 ready, 1 not ready, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_unit.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Resolve /learn's delivered unit + outcomes.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--issue", required=True)
    ap.add_argument("--stm-base", required=True)
    args = ap.parse_args(argv)

    issue = str(args.issue)
    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    errors = []
    if not os.path.isfile(spine_path):
        errors.append(f"spine not found at {spine_path}")
        print(json.dumps({"ok": False, "errors": errors}, indent=2))
        return 1
    spine = load(spine_path)

    # --- the unit: epics delivered under this issue, and their slices --------------
    epics = [e for e in (spine.get("epics") or [])
             if isinstance(e, dict) and str(e.get("issue_ref") or "").endswith(issue)]
    slice_refs = sorted({e.get("slice_ref") for e in epics if e.get("slice_ref")})
    slices = {s.get("id"): s for s in (spine.get("slices") or [])
              if isinstance(s, dict) and s.get("id") in slice_refs}

    # --- outcome signals -----------------------------------------------------------
    outcomes = {"measure_lenses": [], "run_lenses": [], "validate": [],
                "delivered_epics": [], "delivered_slices": []}

    def lens_doc(slice_entry, kind):
        # resolve a slice's lens/<kind>.md from the spine doc ref or the conventional path
        doc = slice_entry.get("doc") or ""
        base = os.path.dirname(os.path.join(args.product_base, "product-os", doc)) if doc else None
        cands = []
        if base:
            cands.append(os.path.join(base, "lens", f"{kind}.md"))
        cands += glob.glob(os.path.join(args.product_base, "product-os", "*", "slices",
                                         slice_entry.get("id", ""), "lens", f"{kind}.md"))
        return next((c for c in cands if os.path.isfile(c)), None)

    for sid, s in slices.items():
        m = lens_doc(s, "measure")
        if m:
            outcomes["measure_lenses"].append(m)
        r = lens_doc(s, "run")
        if r:
            outcomes["run_lenses"].append(r)
        if (s.get("status") or "") in ("realized", "delivered"):
            outcomes["delivered_slices"].append(sid)

    for e in epics:
        if (e.get("status") or "") in ("validated", "delivered"):
            outcomes["delivered_epics"].append(e.get("id"))

    vdir = os.path.join(args.stm_base, issue, "evidence", "validate")
    if os.path.isdir(vdir):
        outcomes["validate"] = sorted(
            glob.glob(os.path.join(vdir, "*.yaml")) + glob.glob(os.path.join(vdir, "*.json")))

    signal_count = sum(len(v) if isinstance(v, list) else 0 for v in outcomes.values())
    if not slice_refs and not epics:
        errors.append(f"no epic in the spine carries issue_ref '{issue}' — the unit does not "
                      "resolve; /learn learns from a delivered unit")
    if signal_count == 0:
        errors.append("no outcome signal found (no measure/run lens, validate verdict, or "
                      "delivered epic/slice) — nothing has delivered to learn from (C1/F1)")

    ok = not errors
    out = {"ok": ok,
           "unit": {"issue": issue, "epics": [e.get("id") for e in epics],
                    "slices": slice_refs},
           "outcomes": outcomes, "errors": errors}
    print(json.dumps(out, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
