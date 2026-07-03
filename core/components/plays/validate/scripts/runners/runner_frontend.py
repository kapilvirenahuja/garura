#!/usr/bin/env python3
"""runner_frontend.py — frontend audit tool class (lighthouse, pa11y, axe).
Code-level + local-page audits only (C5). Same contract as every runner."""

import argparse
import json
import re

import _runner_common as rc


def parse_measures(log):
    m = {}
    # lighthouse JSON output (when piped) or CLI summary scores
    try:
        data = json.loads(log)
        cats = (data.get("categories") or {})
        for key, cat in cats.items():
            if isinstance(cat, dict) and "score" in cat and cat["score"] is not None:
                m[f"{key.replace('-', '_')}_score"] = round(cat["score"] * 100)
        return m
    except (ValueError, TypeError):
        pass
    hit = re.search(r"(\d+)\s+Errors", log, re.IGNORECASE)  # pa11y
    if hit:
        m["a11y_errors"] = int(hit.group(1))
    return m


def summarize(log, code):
    for line in reversed(log.splitlines()):
        if any(k in line.lower() for k in ("error", "score", "audit")):
            return line.strip()[:200]
    return f"exit {code}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-json", required=True)
    ap.add_argument("--out", required=True)
    rc.execute(ap.parse_args(), parse_measures, summarize)
