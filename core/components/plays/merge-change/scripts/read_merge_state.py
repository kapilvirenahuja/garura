#!/usr/bin/env python3
"""
read_merge_state.py — merge-change Step 1 as a script (#484).

Reads the three merge preconditions from host state + the review verdict — zero
judgment — and writes merge-gate.json. Replaces the repo-orchestrator dispatch
that used to "fetch the PR state and the review-change verdict."

    python3 read_merge_state.py --config .garura/core/config.yaml \
        --branch <branch> [--pr-number N] --verdict <decision.yaml|posted.json> \
        --out <merge-gate.json>

Writes merge-gate.json:
  { approved, mergeable, already_merged, checks_pass, pr_number,
    pr_merged, branch_deleted }
The record always ends with the two Done-means booleans (C6); on this read step
they are placeholders (pr_merged/branch_deleted false, or true on the
already-merged no-op path) — merge_pr.py finalizes them after cleanup.

Exit 0 always (this is a read; the play applies the halt policy over the fields).
"""

import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import platform_adapter as pa  # noqa: E402


def _resolve_pr_number(config, branch, given):
    if given:
        return str(given)
    # gh pr view with no number auto-detects the current branch's PR.
    res = pa.dispatch("view-pr", {"pr_number": ""}, config_path=config)
    if res["exit_code"] == 0 and res["stdout"].strip():
        try:
            return str(json.loads(res["stdout"])["number"])
        except (ValueError, KeyError):
            pass
    return ""


def _read_approved(verdict_path):
    """Approved iff the review verdict decision reads approve. Tolerant of yaml/json."""
    if not verdict_path or not os.path.isfile(verdict_path):
        return False
    with open(verdict_path, encoding="utf-8") as fh:
        text = fh.read()
    # decision/verdict field says approve. Tolerant of yaml (decision: approve)
    # and json ("verdict": "approved") key forms.
    m = re.search(r"(?im)[\"']?(?:decision|verdict)[\"']?\s*[:=]\s*[\"']?(\w+)", text)
    if m:
        return m.group(1).lower().startswith("approv")
    return False


def _checks_pass(pr_number):
    """gh pr checks: exit 0 = all required checks pass or none exist; non-zero =
    failing/pending. A repo with no checks configured returns 'no checks' → treat
    as pass (nothing failing)."""
    proc = subprocess.run(["gh", "pr", "checks", str(pr_number)],
                          capture_output=True, text=True)
    if proc.returncode == 0:
        return True
    if "no checks" in (proc.stdout + proc.stderr).lower():
        return True
    return False


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--branch", default="")
    ap.add_argument("--pr-number", default="")
    ap.add_argument("--verdict", default="")
    ap.add_argument("--out", required=True)
    ns = ap.parse_args(argv)

    pr_number = _resolve_pr_number(ns.config, ns.branch, ns.pr_number)
    gate = {"approved": _read_approved(ns.verdict), "mergeable": False,
            "already_merged": False, "checks_pass": False, "pr_number": pr_number,
            "pr_merged": False, "branch_deleted": False}

    if pr_number:
        res = pa.dispatch("view-pr", {"pr_number": pr_number}, config_path=ns.config)
        if res["exit_code"] == 0 and res["stdout"].strip():
            data = json.loads(res["stdout"])
            gate["mergeable"] = data.get("mergeable") == "MERGEABLE"
            gate["already_merged"] = data.get("state") == "MERGED"
        gate["checks_pass"] = _checks_pass(pr_number)

    # No-op path: an already-merged PR finalizes both Done-means here.
    if gate["already_merged"]:
        gate["pr_merged"] = True
        gate["branch_deleted"] = True

    with open(ns.out, "w", encoding="utf-8") as fh:
        json.dump(gate, fh, indent=2)
    print(json.dumps(gate, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
