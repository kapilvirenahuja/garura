#!/usr/bin/env python3
"""runner_dotnet.py — .net tool class (dotnet build, dotnet test, coverlet).
Same contract as every runner: --check-json in, normalized result out."""

import argparse
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    hit = re.search(r"Passed!?\s*-?\s*Failed:\s*(\d+),?\s*Passed:\s*(\d+),?\s*"
                    r"Skipped:\s*\d+,?\s*Total:\s*(\d+)", log)
    if hit:
        m["tests_passed"], m["tests_total"] = int(hit.group(2)), int(hit.group(3))
    hit = re.search(r"Total\s*\|\s*([\d.]+)%", log)  # coverlet table
    if hit:
        m["coverage_pct"] = float(hit.group(1))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if any(k in line for k in ("Passed!", "Failed!", "Build succeeded", "error")):
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
