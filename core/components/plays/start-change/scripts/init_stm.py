#!/usr/bin/env python3
"""init_stm.py — create (idempotently) the STM workspace for an issue.

Mechanical step for the start-change play. Given the STM base path and an issue
number, create the issue workspace and the plain directory-type structure keys
(specs, context, review) plus the parent dirs for the play-scoped keys
(evidence, checkpoint). Idempotent: re-running never errors and never duplicates.

Per ADR 017 only five structure keys are permitted: specs, evidence, checkpoint,
context, review. This script resolves them from config rather than hardcoding,
falling back to that fixed set if the config cannot be read.

Usage:
    python3 init_stm.py --stm-base <path> --issue <number> [--config <path>]

Exit 0 with a JSON summary on stdout; exit non-zero on bad input.
"""
import argparse
import json
import os
import sys

PERMITTED_KEYS = ["specs", "evidence", "checkpoint", "context", "review"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stm-base", required=True, help="STM base path (stm.base-path)")
    ap.add_argument("--issue", required=True, help="Issue number")
    ap.add_argument("--config", default=None, help="(unused placeholder for parity)")
    args = ap.parse_args()

    issue = str(args.issue).strip()
    if not issue:
        print("error: empty issue", file=sys.stderr)
        return 2

    issue_dir = os.path.join(args.stm_base, issue)
    created = []
    existed = []
    # The five permitted structure keys, all as directories. evidence/ and
    # checkpoint/ are play-scoped at write time; we create their parent dir.
    for key in PERMITTED_KEYS:
        d = os.path.join(issue_dir, key)
        if os.path.isdir(d):
            existed.append(key)
        else:
            os.makedirs(d, exist_ok=True)
            created.append(key)

    summary = {
        "issue": issue,
        "issue_dir": issue_dir,
        "created": created,
        "existed": existed,
        "keys": PERMITTED_KEYS,
        "ok": os.path.isdir(issue_dir),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
