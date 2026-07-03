#!/usr/bin/env python3
"""
Validate a routing_result (the route-work skill's output shape).
Usage: python3 validate_route.py <file.json>   |   cat x.json | python3 validate_route.py
Exit 0 if valid, 1 if not. Prints the problems.
"""

import sys
import json

CONF = {"high", "medium", "low"}


def errors(obj):
    errs = []
    # accept either {routing_result: {...}} or the bare object
    rr = obj.get("routing_result", obj) if isinstance(obj, dict) else None
    if not isinstance(rr, dict):
        return ["top level is not an object"]

    if not isinstance(rr.get("work"), str) or not rr.get("work"):
        errs.append("work: missing or not a non-empty string")
    if not isinstance(rr.get("unmatched"), bool):
        errs.append("unmatched: missing or not a bool")
    if not isinstance(rr.get("spans_multiple_domains"), bool):
        errs.append("spans_multiple_domains: missing or not a bool")

    placements = rr.get("placements")
    if not isinstance(placements, list):
        errs.append("placements: missing or not a list")
        return errs

    if rr.get("unmatched") is False and not placements:
        errs.append("placements: empty but unmatched is false")

    for i, p in enumerate(placements):
        tag = f"placements[{i}]"
        if not isinstance(p, dict):
            errs.append(f"{tag}: not an object")
            continue
        if not isinstance(p.get("domain"), str) or not p.get("domain"):
            errs.append(f"{tag}.domain: missing/empty")
        if not isinstance(p.get("capability"), str) or not p.get("capability"):
            errs.append(f"{tag}.capability: missing/empty")
        if not isinstance(p.get("functionality"), list):
            errs.append(f"{tag}.functionality: not a list")
        if p.get("confidence") not in CONF:
            errs.append(f"{tag}.confidence: not one of {sorted(CONF)}")
        if not isinstance(p.get("why"), str) or not p.get("why"):
            errs.append(f"{tag}.why: missing/empty")
        if "conditions" in p and not isinstance(p["conditions"], list):
            errs.append(f"{tag}.conditions: present but not a list")
    return errs


def main():
    raw = open(sys.argv[1]).read() if len(sys.argv) > 1 else sys.stdin.read()
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"INVALID — not JSON: {e}")
        return 1
    errs = errors(obj)
    if errs:
        print("INVALID:")
        for e in errs:
            print(f"  - {e}")
        return 1
    print("VALID")
    return 0


if __name__ == "__main__":
    sys.exit(main())
