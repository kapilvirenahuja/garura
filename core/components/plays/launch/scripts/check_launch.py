#!/usr/bin/env python3
"""
check_launch.py — final self-check for /launch (F2/F5/F7, S1/S2/S5).

Proves the run's own discipline over the captured artifacts before close:

  gate-vs-close  — close-chain evidence exists ONLY when the gate decision is
                   `release` (F2); on `fix_required`, zero end evidence and the
                   defect report + stamp exist (S2).
  environment    — the deploy record's environment matches the eligibility gate's
                   resolved LOCAL environment, and no cloud environment target
                   appears (F5/S5). Cloud tiers belong to /deploy + CD, not launch.
  epic end-state — release path: the epic's spine entry is KEPT, stamped delivered,
                   and the delivery record reads delivered (F7; ADR 019 — epics are
                   never deleted); defect path: the entry remains, stamped
                   fix_required. The epic is the spine `epics` entry (read by id).

    python3 check_launch.py --gate <gate.json> --facts <ready-facts.json>
        --deploy-record <deploy.json> --product-base <pb> --epic <epic-id>
        --delivery-record <delivery.json> --report-yaml <report.yaml>
        --end-evidence-dir <end dir>

Prints {ok, errors[]}. Exit 0 clean, 1 violation, 2 usage.
"""

import argparse
import glob
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_launch.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

# /launch stands up ONLY the local environment; any cloud tier is beyond its scope.
BEYOND_TIERS = ("dev", "qa", "test", "preview", "uat", "staging", "stage",
                "prod", "production", "live")


def jload(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def main():
    ap = argparse.ArgumentParser(description="/launch final self-check.")
    ap.add_argument("--gate", required=True)
    ap.add_argument("--facts", required=True)
    ap.add_argument("--deploy-record", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    ap.add_argument("--delivery-record", required=True)
    ap.add_argument("--report-yaml", required=True)
    ap.add_argument("--end-evidence-dir", required=True)
    args = ap.parse_args()

    errors = []
    gate = jload(args.gate)
    facts = jload(args.facts)
    decision = gate.get("decision")
    end_evidence = glob.glob(os.path.join(args.end_evidence_dir, "*.json"))

    # --- gate vs close (F2) ------------------------------------------------------
    if decision == "release":
        if not end_evidence:
            errors.append("decision was release but no end-sequence evidence exists — "
                          "the close chain never ran (S1)")
    else:
        if end_evidence:
            errors.append(f"decision was '{decision}' but end-sequence evidence exists "
                          f"— the close chain ran without a full accepted sign-off (F2)")

    # --- environment (F5) ----------------------------------------------------------
    try:
        deploy = jload(args.deploy_record)
        env = (deploy.get("environment") or deploy.get("tier") or "").strip().lower()
        want = (facts.get("environment") or "").strip().lower()
        if env != want:
            errors.append(f"deploy environment '{env}' is not the gate-resolved local "
                          f"environment '{want}' (F5)")
        blob = json.dumps(deploy).lower()
        hit = next((t for t in BEYOND_TIERS if f'"{t}"' in blob), None)
        if hit:
            errors.append(f"deploy record names a cloud-tier target '{hit}' — /launch "
                          f"stands up only the local environment (F5)")
    except Exception as exc:
        errors.append(f"deploy record unreadable: {exc} (F5)")

    # --- epic end-state (F7) ---------------------------------------------------------
    spine_path = os.path.join(args.product_base, "product-os", "_spine.yaml")
    epic = None
    if os.path.isfile(spine_path):
        with open(spine_path, "r", encoding="utf-8") as fh:
            spine = yaml.safe_load(fh) or {}
        epic = next((e for e in (spine.get("epics") or [])
                     if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None)
    if decision == "release":
        if epic is None:
            errors.append("release path but the epic's spine entry is gone — epics are "
                          "kept as the as-delivered record and must never be deleted (F7)")
        elif (epic.get("status") or "") != "delivered":
            errors.append(f"release path but epic status is "
                          f"'{epic.get('status')}', not delivered (F7)")
        if not os.path.isfile(args.delivery_record):
            errors.append("release path but no delivery record (F7)")
        elif (jload(args.delivery_record).get("status") != "delivered"):
            errors.append("delivery record does not read delivered (F7)")
    elif decision == "fix_required":
        if epic is None:
            errors.append("defect path but the epic's spine entry is gone — removed "
                          "without a merge (F7)")
        elif (epic.get("status") or "") != "fix_required":
            errors.append(f"defect path but epic status is "
                          f"'{epic.get('status')}', not fix_required (F6)")
        if not os.path.isfile(args.report_yaml):
            errors.append("defect path but no defect report rendered (F6)")

    out = {"ok": not errors, "errors": errors}
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
