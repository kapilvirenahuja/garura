#!/usr/bin/env python3
"""
check_close_gate.py — the release decision for /launch (C5/F2).

Computed mechanically over the VALIDATED sign-off record (run
validate_signoff.py first — this script re-asserts it):

  release      — every scenario accepted → the close chain may run.
  fix_required — any rejection → the defect path (report + stamp); no close.
  blocked      — record invalid/incomplete → neither; fix the record.

The model never decides the release; this script does.

    python3 check_close_gate.py --signoff <signoff.yaml> --scenarios <scenarios.yaml>
        --out <gate.json>

Prints {ok, decision, accepted, rejected, errors[]}.
Exit 0 release, 1 fix_required, 2 blocked/usage.
"""

import argparse
import json
import subprocess
import sys
import os


def main():
    ap = argparse.ArgumentParser(description="/launch close-gate decision.")
    ap.add_argument("--signoff", required=True)
    ap.add_argument("--scenarios", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))
    proc = subprocess.run(
        [sys.executable, os.path.join(here, "validate_signoff.py"),
         "--signoff", args.signoff, "--scenarios", args.scenarios],
        capture_output=True, text=True)
    try:
        record = json.loads(proc.stdout)
    except ValueError:
        record = {"ok": False, "errors": ["validate_signoff produced no JSON"],
                  "accepted": 0, "rejected": 0}

    if not record.get("ok"):
        decision = "blocked"
    elif record.get("rejected", 0) > 0:
        decision = "fix_required"
    else:
        decision = "release"

    out = {"ok": record.get("ok", False), "decision": decision,
           "accepted": record.get("accepted", 0),
           "rejected": record.get("rejected", 0),
           "errors": record.get("errors", [])}
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    sys.exit({"release": 0, "fix_required": 1, "blocked": 2}[decision])


if __name__ == "__main__":
    main()
