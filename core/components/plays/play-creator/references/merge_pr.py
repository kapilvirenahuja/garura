#!/usr/bin/env python3
"""
merge_pr.py — merge-change Step 3 as a script (#484).

Merges the PR, switches to main and pulls, deletes the feature branch (local +
remote), and finalizes merge-gate.json's two Done-means booleans. Replaces the
repo-orchestrator → merge-pr dispatch. Zero judgment — a fixed sequence gated on
the mergeable read.

    python3 merge_pr.py --config .garura/core/config.yaml \
        --branch <feature-branch> --base main \
        --gate <merge-gate.json>   # read pr_number + already_merged; finalize in place

Idempotent: if the PR is already merged (gate.already_merged), it is a clean
no-op — no second merge is attempted, and the Done-means are already true.

Exit 0 merged or clean no-op; 1 on a merge/verify failure.
"""

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import platform_adapter as pa  # noqa: E402


def _git(*args, check=False):
    proc = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and proc.returncode != 0:
        sys.stderr.write(f"merge_pr.py: git {' '.join(args)} failed: {proc.stderr}\n")
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _branch_gone(branch):
    rc_l, out_l, _ = _git("branch", "--list", branch)
    local_gone = not out_l.strip()
    rc_r, out_r, _ = _git("ls-remote", "--heads", "origin", branch)
    remote_gone = not out_r.strip()
    return local_gone and remote_gone


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--branch", required=True)
    ap.add_argument("--base", default="main")
    ap.add_argument("--gate", required=True)
    ns = ap.parse_args(argv)

    with open(ns.gate, encoding="utf-8") as fh:
        gate = json.load(fh)
    pr_number = str(gate.get("pr_number") or "")

    def finalize(pr_merged, branch_deleted, extra=None):
        gate["pr_merged"] = pr_merged
        gate["branch_deleted"] = branch_deleted
        if extra:
            gate.update(extra)
        with open(ns.gate, "w", encoding="utf-8") as fh:
            json.dump(gate, fh, indent=2)
        print(json.dumps(gate, indent=2))

    # Clean no-op: already merged (C5/F5). Confirm the branch is gone; don't re-merge.
    if gate.get("already_merged"):
        finalize(True, _branch_gone(ns.branch), {"status": "already_merged"})
        sys.exit(0)

    if not pr_number:
        sys.stderr.write("merge_pr.py: no pr_number in gate — cannot merge\n")
        sys.exit(1)

    # Merge via the adapter (repository default strategy).
    res = pa.dispatch("merge-pr", {"pr_number": pr_number}, config_path=ns.config)
    if res["exit_code"] != 0:
        finalize(False, False, {"status": "merge_failed", "error": res["stderr"]})
        sys.exit(1)

    # Switch to base + pull latest.
    _git("checkout", ns.base, check=True)
    _git("pull", "--ff-only", "origin", ns.base)

    # Delete the feature branch — local (safe delete) then remote (best-effort).
    _git("branch", "-D", ns.branch)
    _git("push", "origin", "--delete", ns.branch)  # some hosts auto-delete → no-op

    branch_deleted = _branch_gone(ns.branch)
    # Verify we landed on updated base.
    _, cur, _ = _git("branch", "--show-current")
    on_base = cur == ns.base
    finalize(True, branch_deleted,
             {"status": "merged", "on_base": on_base,
              "merge_sha": None})
    sys.exit(0 if (branch_deleted and on_base) else 1)


if __name__ == "__main__":
    main()
