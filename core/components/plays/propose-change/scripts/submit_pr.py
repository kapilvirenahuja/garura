#!/usr/bin/env python3
"""
submit_pr.py — propose-change Step 3 as a script (#484).

Pushes the branch and opens (or updates) the PR carrying a pre-rendered body,
then writes pr.json. Replaces the repo-orchestrator → submit-pr dispatch. The PR
body is assembled by the caller (self-review + summary — Step 1's output) and
handed in as --body-file; this script does the fixed git/gh mechanics, zero
judgment.

    python3 submit_pr.py --config .garura/core/config.yaml \
        --title "<title>" --base main --body-file <body.md> \
        [--draft] --out <pr.json>

Idempotent: if an open PR already exists for the branch, it is updated (C5) — not
duplicated. Writes pr.json: { number, url, state, base }.

Exit 0 on success, 1 on a push/create failure.
"""

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import platform_adapter as pa  # noqa: E402


def _git(*args):
    proc = subprocess.run(["git", *args], capture_output=True, text=True)
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _open_pr_number(config):
    """Return the open PR number for the current branch, or '' if none."""
    res = pa.dispatch("view-pr", {"pr_number": ""}, config_path=config)
    if res["exit_code"] == 0 and res["stdout"].strip():
        try:
            data = json.loads(res["stdout"])
            if data.get("state") == "OPEN":
                return str(data["number"])
        except (ValueError, KeyError):
            pass
    return ""


def _pr_record(config, pr_number, base):
    res = pa.dispatch("view-pr", {"pr_number": pr_number}, config_path=config)
    rec = {"number": pr_number, "url": None, "state": None, "base": base}
    if res["exit_code"] == 0 and res["stdout"].strip():
        data = json.loads(res["stdout"])
        rec.update({"number": data.get("number", pr_number), "url": data.get("url"),
                    "state": data.get("state"), "base": data.get("baseRefName", base)})
    return rec


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--title", required=True)
    ap.add_argument("--base", default="main")
    ap.add_argument("--body-file", required=True)
    ap.add_argument("--draft", action="store_true")
    ap.add_argument("--out", required=True)
    ns = ap.parse_args(argv)

    with open(ns.body_file, encoding="utf-8") as fh:
        body = fh.read()

    # Push: set upstream if not already tracking.
    rc, _, _ = _git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
    if rc != 0:
        prc, _, perr = _git("push", "-u", "origin", "HEAD")
        if prc != 0:
            sys.stderr.write(f"submit_pr.py: push failed: {perr}\n")
            sys.exit(1)
    else:
        _git("push", "origin", "HEAD")

    existing = _open_pr_number(ns.config)
    if existing:
        # Update the existing PR's body/title rather than opening a second one (C5).
        subprocess.run(["gh", "pr", "edit", existing, "--title", ns.title,
                        "--body", body], capture_output=True, text=True)
        rec = _pr_record(ns.config, existing, ns.base)
    else:
        args = {"title": ns.title, "body": body, "base": ns.base}
        if ns.draft:
            args["draft"] = "true"
        res = pa.dispatch("create-pr", args, config_path=ns.config)
        if res["exit_code"] != 0:
            sys.stderr.write(f"submit_pr.py: create-pr failed: {res['stderr']}\n")
            sys.exit(1)
        # create-pr prints the PR URL; view-pr with no number resolves the record.
        num = _open_pr_number(ns.config)
        rec = _pr_record(ns.config, num, ns.base) if num else {
            "number": None, "url": res["stdout"].strip(), "state": "OPEN",
            "base": ns.base}

    with open(ns.out, "w", encoding="utf-8") as fh:
        json.dump(rec, fh, indent=2)
    print(json.dumps(rec, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
