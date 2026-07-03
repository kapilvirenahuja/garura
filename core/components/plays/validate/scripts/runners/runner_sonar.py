#!/usr/bin/env python3
"""runner_sonar.py — sonar tool class (sonar-scanner against a configured local/
project SonarQube). Quality-gate status read from the scanner's task output.
Same contract as every runner."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    hit = re.search(r"QUALITY GATE STATUS:\s*(\w+)", log, re.IGNORECASE)
    if hit:
        m["sonar_gate"] = 1 if hit.group(1).upper() in ("PASSED", "OK") else 0
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if "QUALITY GATE" in line.upper() or "EXECUTION" in line.upper():
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
