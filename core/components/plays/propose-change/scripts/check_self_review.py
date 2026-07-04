#!/usr/bin/env python3
"""
check_self_review.py — machine replacement for propose-change's confirm-raise gate (#467).

The human at that gate was scanning the self-review for anything blocking before
letting the push happen. That scan is mechanical: the self-review checklist marks its
findings, and a raise is safe when zero of them are blocking. Tree-clean and the issue
reference are already machine walls (pre-flight + SE-4); this closes the last gap.

    python3 check_self_review.py --self-review <self-review.md>

A line is a BLOCKER when it carries a blocking marker:
  - the words BLOCKER / BLOCKING / "P1" as a classification
  - a failed checklist mark: [FAIL] / FAIL: / ❌
...and is NOT a negation ("no blocking", "0 blockers", "none blocking", "not blocking",
"zero blocking") or a heading/label line that merely names the concept
("**Blocking**: none").

Output: JSON {clean, blockers: [line texts], count}. Exit 0 clean, 1 blockers found,
2 bad input. Deterministic.
"""

import argparse
import json
import os
import re
import sys

MARKER = re.compile(r"\b(BLOCKER|BLOCKING|P1)\b|\[FAIL\]|(?<![A-Za-z])FAIL:|❌")
NEGATION = re.compile(
    r"\b(no|none|zero|0|not|without)\b[^.]{0,40}\b(block\w*|P1)\b"
    r"|\b(block\w*|P1)\b[^.]{0,40}\b(no|none|zero|0|not)\b",
    re.IGNORECASE,
)


def fail(msg):
    sys.stderr.write(f"check_self_review.py: {msg}\n")
    sys.exit(2)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--self-review", required=True)
    args = ap.parse_args(argv)

    if not os.path.isfile(args.self_review):
        fail(f"missing self-review: {args.self_review}")
    with open(args.self_review, encoding="utf-8") as fh:
        lines = fh.read().splitlines()

    blockers = []
    for line in lines:
        if not MARKER.search(line):
            continue
        if NEGATION.search(line):
            continue
        blockers.append(line.strip())

    verdict = {"clean": not blockers, "count": len(blockers), "blockers": blockers}
    print(json.dumps(verdict, indent=2))
    sys.exit(0 if verdict["clean"] else 1)


if __name__ == "__main__":
    main()
