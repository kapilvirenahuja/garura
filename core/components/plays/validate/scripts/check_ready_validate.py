#!/usr/bin/env python3
"""
check_ready_validate.py — epic eligibility gate for /validate (C1/F1, C10/F10).

/validate runs only on an epic /implement completed: the epic is `in_delivery`
with an issue_ref, and implement's done verdict holds — every plan piece done,
gates passing, steelman verdict PASS authored by the independent verifier
(quality-auditor). Hard halt otherwise. Also resolves the ROUND this run is:
prior validate verdicts in the status dir count the rounds already burned; at
--max-rounds rejections the gate refuses to start another round and demands
human escalation (C10/F10 — the loop cap is enforced before work, not after).

Layer rule: asserts over files already on disk; never shells out.

    python3 check_ready_validate.py --product-base <pb> --epic <epic-id> --plan <plan.yaml>
        --gates <gates-results.yaml> --verdict <verdict.yaml>
        --status-dir <stm validate status dir> [--max-rounds 3]

The epic is read from the spine `epics` index (product-os/_spine.yaml); the plan,
gates, and verdict are /implement's STM build artifacts, unchanged.

Prints JSON facts: {ok, epic_id, slice_ref, issue_ref, round, prior_report,
escalate, errors[]}. Exit 0 eligible, 1 not, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_ready_validate.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/validate eligibility gate.")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--plan", required=True)
    ap.add_argument("--gates", required=True)
    ap.add_argument("--verdict", required=True)
    ap.add_argument("--status-dir", required=True)
    ap.add_argument("--max-rounds", type=int, default=3)
    args = ap.parse_args()

    errors = []
    out = {"ok": False, "epic_id": None, "slice_ref": None, "issue_ref": None,
           "round": None, "prior_report": None, "escalate": False, "errors": errors}

    # --- epic entry from the spine (C1) ---------------------------------------
    epic = {}
    try:
        spine = load(os.path.join(args.product_base, "product-os", "_spine.yaml"))
        epic = next((e for e in (spine.get("epics") or [])
                     if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
        if epic is None:
            errors.append(f"epic '{args.epic}' not in the spine epics index (C1/F1)")
            epic = {}
    except Exception as exc:
        errors.append(f"spine unreadable: {exc} (C1/F1)")
    out["epic_id"] = epic.get("id")
    out["slice_ref"] = epic.get("slice_ref")
    out["issue_ref"] = epic.get("issue_ref")
    status = (epic.get("status") or "").strip().lower()
    if not errors:
        if status != "in_delivery":
            errors.append(f"epic status is '{status}', must be 'in_delivery' — "
                          "/implement owns the pick-up and the fix-round re-entry (C1/F1)")
        if not epic.get("issue_ref"):
            errors.append("epic carries no issue_ref — /implement's start was never run (C1/F1)")

    # --- implement's done verdict (C1) ----------------------------------------
    try:
        pieces = ((load(args.plan).get("plan") or {}).get("pieces") or [])
        if not pieces:
            errors.append("plan has no pieces — nothing was built (C1/F1)")
        not_done = [p.get("id") for p in pieces
                    if (p.get("status") or "").strip().lower() != "done"]
        if not_done:
            errors.append(f"plan pieces not done: {not_done} (C1/F1)")
    except Exception as exc:
        errors.append(f"plan unreadable: {exc} (C1/F1)")
    try:
        gates = load(args.gates)
        if gates.get("pass") is not True:
            errors.append("implement's gates-results.yaml is not passing (C1/F1)")
    except Exception as exc:
        errors.append(f"gates-results unreadable: {exc} (C1/F1)")
    try:
        verdict = load(args.verdict)
        if (verdict.get("authored_by") or "") != "quality-auditor":
            errors.append("implement's steelman verdict not authored by quality-auditor (C1/F1)")
        if (verdict.get("verdict") or "").strip().lower() != "pass":
            errors.append("implement's steelman verdict is not PASS (C1/F1)")
    except Exception as exc:
        errors.append(f"implement verdict unreadable: {exc} (C1/F1)")

    # --- round resolution + loop cap (C10/F10) ---------------------------------
    prior = sorted(glob.glob(os.path.join(args.status_dir, "verdict-round-*.json")))
    rejections = 0
    last_report = None
    for path in prior:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                rec = json.load(fh)
        except Exception as exc:
            errors.append(f"prior verdict record unreadable: {path}: {exc}")
            continue
        if (rec.get("verdict") or "") == "fix_required":
            rejections += 1
            last_report = rec.get("report") or last_report
        elif (rec.get("verdict") or "") == "validated":
            errors.append(f"epic already validated in {os.path.basename(path)} — "
                          "nothing to do; /launch is next (C1)")
    out["round"] = rejections + 1
    out["prior_report"] = last_report
    if rejections >= args.max_rounds:
        out["escalate"] = True
        errors.append(f"loop cap reached: {rejections} rejections >= max {args.max_rounds} — "
                      "halt to a human with the round history (C10/F10)")

    out["ok"] = not errors
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
