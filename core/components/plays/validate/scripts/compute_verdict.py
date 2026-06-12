#!/usr/bin/env python3
"""
compute_verdict.py — mechanical verdict assembler for /validate (C8, F2/F3).

The model never hand-stamps. The verdict is computed over the captured
artifacts: the check summary, the gates/benchmark map, and the judge's
findings file. Rules:

  validated     — every check passed, zero gate/benchmark findings, zero
                  judge findings.
  fix_required  — anything failed, errored, unmeasured, or found.

Citation discipline (C3/F2, F7): every finding — the gate map's and the
judge's — must carry a non-empty `citation` AND `location`. An uncited finding
is an ERROR (exit 2-style refusal via ok=false), not a silent pass-through:
rebuild the finding from captured results (REC2), don't weaken the verdict.

    python3 compute_verdict.py --summary <summary.json> --gates-map <gates-map.json>
        --findings <findings.yaml> --round <n> --epic-id <id> --out <verdict.json>

Prints the verdict JSON. Exit 0 verdict computed (either way), 1 inputs broken.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("compute_verdict.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="/validate verdict assembler.")
    ap.add_argument("--summary", required=True)
    ap.add_argument("--gates-map", required=True)
    ap.add_argument("--findings", required=True)
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--epic-id", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    errors = []
    try:
        with open(args.summary, "r", encoding="utf-8") as fh:
            summary = json.load(fh)
    except Exception as exc:
        errors.append(f"summary unreadable: {exc}")
        summary = {}
    try:
        with open(args.gates_map, "r", encoding="utf-8") as fh:
            gates_map = json.load(fh)
    except Exception as exc:
        errors.append(f"gates map unreadable: {exc}")
        gates_map = {}
    try:
        with open(args.findings, "r", encoding="utf-8") as fh:
            judge = yaml.safe_load(fh) or {}
    except Exception as exc:
        errors.append(f"judge findings unreadable: {exc}")
        judge = {}

    findings = list(gates_map.get("findings") or []) + \
               list(judge.get("findings") or [])
    for f in findings:
        if not (f.get("citation") or "").strip() or not (f.get("location") or "").strip():
            errors.append(f"uncited finding: {json.dumps(f)[:160]} — every finding "
                          "carries its mechanical citation and location (C3/F2, F7)")

    checks_clean = (summary.get("total", 0) > 0
                    and summary.get("failed", 1) == 0
                    and summary.get("errored", 1) == 0)
    if summary.get("total", 0) == 0:
        errors.append("zero checks ran — an empty run cannot be validated (C2)")

    verdict = "validated" if (checks_clean and not findings and not errors) \
              else "fix_required"
    out = {
        "ok": not errors,
        "epic_id": args.epic_id,
        "round": args.round,
        "verdict": verdict if not errors else None,
        "checks": {"total": summary.get("total", 0),
                   "passed": summary.get("passed", 0),
                   "failed": summary.get("failed", 0),
                   "errored": summary.get("errored", 0)},
        "findings": findings,
        "errors": errors,
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps({k: v for k, v in out.items() if k != "findings"}, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
