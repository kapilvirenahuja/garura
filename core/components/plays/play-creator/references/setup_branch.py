#!/usr/bin/env python3
"""
setup_branch.py — start-change Step 4 as a script (#484).

Cuts the feature branch off latest main (or switches to it on resume), sets up a
git worktree when config calls for it, pushes, and writes branch.json. Replaces
the repo-orchestrator → setup-branch dispatch. Pure git — a fixed sequence, zero
judgment.

    python3 setup_branch.py --issue N --branch-name feature/N-slug \
        [--base main] [--worktree] [--no-push] --out <branch.json>

Idempotent: if the branch already exists (local or remote), it is a resume —
switch to it, do not re-cut. Writes branch.json:
  { branch_name, base_sha, on_default_branch, worktree_path }

Exit 0 on success, 1 on a git failure.
"""

import argparse
import json
import os
import subprocess
import sys


def _git(*args):
    proc = subprocess.run(["git", *args], capture_output=True, text=True)
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _branch_exists(branch):
    _, out_l, _ = _git("branch", "--list", branch)
    if out_l.strip():
        return True
    _, out_r, _ = _git("ls-remote", "--heads", "origin", branch)
    return bool(out_r.strip())


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--issue", required=True)
    ap.add_argument("--branch-name", required=True)
    ap.add_argument("--base", default="main")
    ap.add_argument("--worktree", action="store_true")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--out", required=True)
    ns = ap.parse_args(argv)
    branch = ns.branch_name

    # Bring base to its latest origin tip so the cut is off up-to-date main.
    rc, _, err = _git("checkout", ns.base)
    if rc != 0:
        sys.stderr.write(f"setup_branch.py: checkout {ns.base} failed: {err}\n")
        sys.exit(1)
    _git("pull", "--ff-only", "origin", ns.base)
    _, base_sha, _ = _git("rev-parse", f"origin/{ns.base}")

    worktree_path = None
    if _branch_exists(branch):
        # Resume: switch to the existing branch, do not re-cut or duplicate.
        rc, _, err = _git("checkout", branch)
        if rc != 0:
            sys.stderr.write(f"setup_branch.py: resume checkout failed: {err}\n")
            sys.exit(1)
    elif ns.worktree:
        # Sibling worktree dir: ../{repo}-{branch-slug}
        repo = os.path.basename(os.path.abspath("."))
        slug = branch.replace("/", "-")
        worktree_path = os.path.abspath(os.path.join("..", f"{repo}-{slug}"))
        rc, _, err = _git("worktree", "add", worktree_path, "-b", branch)
        if rc != 0:
            sys.stderr.write(f"setup_branch.py: worktree add failed: {err}\n")
            sys.exit(1)
    else:
        rc, _, err = _git("checkout", "-b", branch)
        if rc != 0:
            sys.stderr.write(f"setup_branch.py: checkout -b failed: {err}\n")
            sys.exit(1)

    if not ns.no_push:
        _git("push", "-u", "origin", branch)

    record = {"branch_name": branch, "base_sha": base_sha,
              "on_default_branch": False, "worktree_path": worktree_path}
    with open(ns.out, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2)
    print(json.dumps(record, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
