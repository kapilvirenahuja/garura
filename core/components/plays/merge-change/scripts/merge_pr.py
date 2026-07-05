#!/usr/bin/env python3
"""
merge_pr.py — merge-change Step 3 as a script (#484).

Merges the PR, switches to main and pulls, deletes the feature branch (local +
remote), finalizes merge-gate.json's two Done-means booleans — and then COMMITS
the run records on main itself (#491): the play's C6 always required that
commit, but as prose it got skipped and left merge-gate.json littering the tree.
The script that writes the record commits it, on BOTH paths (fresh merge and the
already-merged no-op). Never pushes — the push of the records commit stays owed
to the human (ADR 012). Zero judgment — a fixed sequence gated on the mergeable
read.

    python3 merge_pr.py --config .garura/core/config.yaml \
        --branch <feature-branch> --base main \
        --gate <merge-gate.json> \
        [--issue N --records-dir <review/>]   # enables the records self-commit

The records self-commit runs only when BOTH --issue and --records-dir are given
(the compiled play always passes them; tests may omit). The printed result
carries `records_committed: true|false|null` (null = self-commit not requested)
so a leftover is a visible failure, never silent litter.

Idempotent: if the PR is already merged (gate.already_merged), it is a clean
no-op — no second merge is attempted; the records commit still runs.

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


def _commit_records(gate_path, records_dir, issue):
    """Stage the gate file + the records dir and commit (#491). No push. Returns
    True when the records are committed (including 'nothing to commit' — already
    clean counts as committed), False when the commit failed."""
    _git("add", gate_path)
    if records_dir and os.path.isdir(records_dir):
        _git("add", records_dir)
    rc, out, err = _git("diff", "--cached", "--quiet")
    if rc == 0:
        return True  # nothing staged — records already committed, tree clean
    rc, _, err = _git("commit", "-m",
                      f"chore(stm): record merge-change run records (#{issue})")
    if rc != 0:
        sys.stderr.write(f"merge_pr.py: records commit failed: {err}\n")
        return False
    return True


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--branch", required=True)
    ap.add_argument("--base", default="main")
    ap.add_argument("--gate", required=True)
    ap.add_argument("--issue", default=None)
    ap.add_argument("--records-dir", default=None)
    ns = ap.parse_args(argv)

    with open(ns.gate, encoding="utf-8") as fh:
        gate = json.load(fh)
    pr_number = str(gate.get("pr_number") or "")
    want_records = bool(ns.issue and ns.records_dir)

    def finalize(pr_merged, branch_deleted, extra=None):
        """Write the final gate file, run the records self-commit (#491) when
        requested, and print the result with records_committed."""
        gate["pr_merged"] = pr_merged
        gate["branch_deleted"] = branch_deleted
        if extra:
            gate.update(extra)
        with open(ns.gate, "w", encoding="utf-8") as fh:
            json.dump(gate, fh, indent=2)
        committed = (_commit_records(ns.gate, ns.records_dir, ns.issue)
                     if want_records else None)
        print(json.dumps({**gate, "records_committed": committed}, indent=2))
        return committed

    # Clean no-op: already merged (C5/F5). Confirm the branch is gone; don't
    # re-merge. The records self-commit still runs — the no-op path is exactly
    # where leftovers were observed (#491).
    if gate.get("already_merged"):
        committed = finalize(True, _branch_gone(ns.branch),
                             {"status": "already_merged"})
        sys.exit(0 if committed in (True, None) else 1)

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
    committed = finalize(True, branch_deleted,
                         {"status": "merged", "on_base": on_base,
                          "merge_sha": None})
    ok = branch_deleted and on_base and committed in (True, None)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
