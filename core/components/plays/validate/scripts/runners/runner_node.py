#!/usr/bin/env python3
"""runner_node.py — node/js tool class (npm/yarn/pnpm test, build, vitest, jest).
Same contract as every runner: --check-json in, normalized result out."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    # istanbul/vitest/jest coverage summary lines: "All files ... | 82.35 |"
    hit = re.search(r"All files[^|]*\|\s*([\d.]+)", log)
    if hit:
        m["coverage_pct"] = float(hit.group(1))
    hit = re.search(r"Tests:\s+.*?(\d+)\s+passed.*?(\d+)\s+total", log)
    if hit:
        m["tests_passed"], m["tests_total"] = int(hit.group(1)), int(hit.group(2))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if any(k in line for k in ("Tests:", "passing", "failing", "error")):
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
