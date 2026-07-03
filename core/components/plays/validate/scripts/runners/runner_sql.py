#!/usr/bin/env python3
"""runner_sql.py — sql tool class (sqlfluff lint, migration dry-runs against a
LOCAL database only — C5: never a remote system). Same contract as every runner."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    hit = re.search(r"(\d+)\s+violation", log)  # sqlfluff
    if hit:
        m["sql_violations"] = int(hit.group(1))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if any(k in line.lower() for k in ("violation", "pass", "fail", "error")):
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
