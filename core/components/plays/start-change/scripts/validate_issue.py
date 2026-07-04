#!/usr/bin/env python3
"""
validate_issue.py — machine replacement for start-change's confirm-new-issue gate (#467).

The human at that gate was checking two things by eye: the proposed title reads like a
real, tagged issue title, and the description actually says what the work is. Both are
mechanical. This script checks them; the duplicate-issue guard is separate (the resolve
step + SE-5 already own it).

    python3 validate_issue.py --issue-json <issue.json> \
        [--description <work-description.txt>] [--min-desc-chars 40]

Checks:
  T1  title present and >= 15 characters
  T2  title carries a type tag: [ENH] [BUG] [FEAT] [DOCS] [TASK] (or a
      conventional-commit-style `type:` prefix)
  D1  a work description exists and is >= --min-desc-chars characters of real text
      (read from --description when given, else from issue.json's "description"/"body")

Output: one JSON verdict {valid, problems: [...]}. Exit 0 valid, 1 invalid, 2 bad input.
Deterministic; no network, no git.
"""

import argparse
import json
import os
import re
import sys

TAG = re.compile(r"^\[(ENH|BUG|FEAT|DOCS|TASK)\]\s+\S", re.IGNORECASE)
CONVENTIONAL = re.compile(r"^(feat|fix|docs|chore|refactor|test)(\([^)]+\))?:\s+\S")
MIN_TITLE = 15


def fail(msg):
    sys.stderr.write(f"validate_issue.py: {msg}\n")
    sys.exit(2)


def read_description(args, issue):
    if args.description and os.path.isfile(args.description):
        with open(args.description, encoding="utf-8") as fh:
            return fh.read()
    return str(issue.get("description") or issue.get("body") or "")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--issue-json", required=True)
    ap.add_argument(
        "--description", help="work-description file (fallback: issue body)"
    )
    ap.add_argument("--min-desc-chars", type=int, default=40)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.issue_json):
        fail(f"missing issue json: {args.issue_json}")
    try:
        with open(args.issue_json, encoding="utf-8") as fh:
            issue = json.load(fh)
    except ValueError as e:
        fail(f"unreadable issue json: {e}")

    problems = []
    title = str(issue.get("title") or "").strip()

    if len(title) < MIN_TITLE:
        problems.append(f"T1: title missing or under {MIN_TITLE} chars: {title!r}")
    if title and not (TAG.match(title) or CONVENTIONAL.match(title)):
        problems.append(
            "T2: title carries no type tag ([ENH]/[BUG]/[FEAT]/[DOCS]/[TASK] "
            "or conventional prefix)"
        )

    desc = re.sub(r"\s+", " ", read_description(args, issue)).strip()
    if len(desc) < args.min_desc_chars:
        problems.append(
            f"D1: description under {args.min_desc_chars} chars ({len(desc)}) — "
            "the issue does not say what the work is"
        )

    verdict = {"valid": not problems, "problems": problems, "title": title}
    print(json.dumps(verdict, indent=2))
    sys.exit(0 if verdict["valid"] else 1)


if __name__ == "__main__":
    main()
