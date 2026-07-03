#!/usr/bin/env python3
"""
execute_commits.py — execute the decided commit plan for commit-change (C8).

The mechanical hand of Step 4. The grouping was decided in Step 1 (script or
agent); this script just executes it: for each change group, git add its
files and git commit with its conventional message. It contains NO push path
of any kind (C7) and refuses to run on a default branch (C1, defense in
depth — pre-flight already halted).

Tool-first rule (Kapil, #434): committing is decided work — a direct git
tool call, never a model turn. This script IS allowed to shell to git; what
it never does is reason, regroup, or push.

    python3 execute_commits.py --analysis <analysis.yaml> --issue <n>
                               --out <commits.yaml>

Reads analysis.yaml (script- or agent-emitted; PyYAML when available, else a
schema-bound fallback parser). Prints a JSON summary to stdout.
Exit 0 ok; 2 unreadable input; 3 on a default branch; 4 a commit failed.
No third-party packages required.
"""

import argparse
import json
import os
import re
import subprocess
import sys

DEFAULT_BRANCHES = {"main", "master"}


def run_git(args_list, check=True):
    res = subprocess.run(["git"] + args_list, capture_output=True, text=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"git {' '.join(args_list)}: {res.stderr.strip()}")
    return res.stdout.strip()


def load_analysis(path):
    text = open(path, encoding="utf-8").read()
    try:
        import yaml  # type: ignore
        return yaml.safe_load(text) or {}
    except ImportError:
        return fallback_parse(text)


def fallback_parse(text):
    """Schema-bound parser for the analysis.yaml the play's contract defines:
    change_groups (id/issue/commit_type/scope/subject/files) + exclusions."""
    groups, exclusions = [], []
    cur, in_files, section = None, False, None
    for raw in text.splitlines():
        line = raw.rstrip()
        if re.match(r"^change_groups:", line):
            section = "groups"; continue
        if re.match(r"^exclusions:", line):
            section = "exclusions"; cur = None; continue
        if re.match(r"^[a-zA-Z_]+:", line):  # any other top-level key
            section = None; cur = None; continue
        if section == "groups":
            m = re.match(r"^  - id:\s*(\S+)", line)
            if m:
                cur = {"id": m.group(1), "files": []}
                groups.append(cur); in_files = False; continue
            if cur is not None:
                m = re.match(r"^    (commit_type|scope|subject|issue):\s*(.+)$", line)
                if m:
                    cur[m.group(1)] = m.group(2).strip().strip('"'); continue
                if re.match(r"^    files:", line):
                    in_files = True; continue
                m = re.match(r"^      - (.+)$", line)
                if m and in_files:
                    cur["files"].append(m.group(1).strip().strip('"')); continue
        if section == "exclusions":
            m = re.match(r"^  - path:\s*(.+)$", line)
            if m:
                exclusions.append(m.group(1).strip().strip('"'))
    return {"change_groups": groups,
            "exclusions": [{"path": p} for p in exclusions]}


def normalize_group(g):
    """Defensive alias mapping (the schema contract is analysis-output.md; this
    absorbs drift instead of failing the run): `name` -> `id`, `type` ->
    `commit_type`, and an `old -> new` rename string splits into both paths."""
    if "id" not in g and g.get("name"):
        g["id"] = g["name"]
    if "commit_type" not in g and g.get("type"):
        g["commit_type"] = g["type"]
    files = []
    for f in g.get("files") or []:
        if isinstance(f, str) and " -> " in f:
            old, new = f.split(" -> ", 1)
            files += [old.strip().strip('"'), new.strip().strip('"')]
        else:
            files.append(f)
    g["files"] = files
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--analysis", required=True)
    ap.add_argument("--issue", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    branch = run_git(["branch", "--show-current"])
    if branch in DEFAULT_BRANCHES:
        print(json.dumps({"error": f"on default branch '{branch}' — refuse (C1)"}))
        return 3

    try:
        analysis = load_analysis(args.analysis)
    except OSError as e:
        print(json.dumps({"error": str(e)}))
        return 2

    groups = analysis.get("change_groups") or []
    if isinstance(groups, str):
        groups = []
    groups = [normalize_group(g) for g in groups if isinstance(g, dict)]
    excl = analysis.get("exclusions") or []
    excl_paths = [e.get("path", "") for e in excl if isinstance(e, dict)]
    excl_reasons = {e.get("path", ""): e.get("reason", "recorded in analysis.yaml")
                    for e in excl if isinstance(e, dict)}

    commits = []
    for g in groups:
        files = g.get("files") or []
        if not files:
            continue
        scope = g.get("scope") or "core"
        subject = (g.get("subject") or "").strip()
        issue = g.get("issue") or args.issue
        msg = f"{g.get('commit_type', 'chore')}({scope}): {subject} (#{issue})"
        try:
            # Pathspec-limited commit (C2/F1): the index may already hold OTHER
            # groups' staged work (git rm / git mv done before the play ran) — a
            # bare `git commit` would sweep it all into this group's commit. Add
            # only paths that still exist (a deleted/renamed-away path has no
            # worktree or index entry and would fail `git add`), then commit
            # exactly this group's paths, leaving the rest staged for its group.
            present = [f for f in files if os.path.lexists(f)]
            if present:
                run_git(["add", "--"] + present)
            run_git(["commit", "-m", msg, "--"] + files)
        except RuntimeError as e:
            print(json.dumps({"error": str(e), "group": g.get("id")}))
            return 4
        commits.append({"sha": run_git(["rev-parse", "--short", "HEAD"]),
                        "message": msg, "files": files})

    porcelain = run_git(["status", "--porcelain"], check=False)
    leftovers = [l[3:].strip().strip('"') for l in porcelain.splitlines() if l.strip()]
    uncovered = [p for p in leftovers
                 if not any(p.startswith(e.rstrip("/")) for e in excl_paths)]

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("commits:\n")
        for c in commits:
            fh.write(f"  - sha: {c['sha']}\n")
            fh.write(f"    message: \"{c['message']}\"\n")
            fh.write("    files:\n")
            for f in c["files"]:
                fh.write(f"      - {f}\n")
            fh.write(f"    branch: {branch}\n")
        fh.write("excluded_files:\n")
        if excl_paths:
            for p in excl_paths:
                fh.write(f"  - path: \"{p}\"\n")
                fh.write(f"    reason: \"{excl_reasons.get(p, '')}\"\n")
        else:
            fh.write("  []\n")
        fh.write(f"clean_after: {str(not uncovered).lower()}\n")
        fh.write("push: false\n")

    print(json.dumps({
        "commits": [{"sha": c["sha"], "message": c["message"]} for c in commits],
        "branch": branch,
        "leftover_uncovered": uncovered,  # play policy: F3 if non-empty
        "out": args.out,
        "pushed": False,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
