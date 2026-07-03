#!/usr/bin/env python3
"""runner_java.py — java tool class (maven/gradle build, test, jacoco).
Same contract as every runner: --check-json in, normalized result out."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    hit = re.search(r"Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+)", log)
    if hit:
        m["tests_total"] = int(hit.group(1))
        m["tests_passed"] = int(hit.group(1)) - int(hit.group(2)) - int(hit.group(3))
    hit = re.search(r"Total.*?(\d+)\s*%", log)  # jacoco summary
    if hit:
        m["coverage_pct"] = float(hit.group(1))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if "BUILD SUCCESS" in line or "BUILD FAILURE" in line or "Tests run" in line:
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
