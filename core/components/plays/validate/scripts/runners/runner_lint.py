#!/usr/bin/env python3
"""runner_lint.py — generic linter/static-analysis tool class (eslint, ruff,
pylint, checkstyle, dotnet format, semgrep, dependency audits like npm audit /
pip-audit). Same contract as every runner."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    hit = re.search(r"(\d+)\s+problems?\s*\((\d+)\s+errors?,\s*(\d+)\s+warnings?\)", log)
    if hit:  # eslint
        m["lint_errors"], m["lint_warnings"] = int(hit.group(2)), int(hit.group(3))
    hit = re.search(r"found\s+(\d+)\s+vulnerabilit", log, re.IGNORECASE)  # audits
    if hit:
        m["vulnerabilities"] = int(hit.group(1))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if any(k in line.lower() for k in ("problem", "vulnerab", "error", "warning",
                                           "passed", "clean")):
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
