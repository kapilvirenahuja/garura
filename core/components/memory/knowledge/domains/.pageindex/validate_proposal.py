#!/usr/bin/env python3
"""
Validate a kb_proposal (the propose-kb-node skill's output shape).
Usage: python3 validate_proposal.py <file.json>  |  cat x.json | python3 validate_proposal.py
Exit 0 if valid, 1 if not.
"""

import sys
import json

LEVELS = {"new-domain", "new-capability", "new-functionality"}


def errors(obj):
    errs = []
    p = obj.get("kb_proposal", obj) if isinstance(obj, dict) else None
    if not isinstance(p, dict):
        return ["top level is not an object"]

    if not isinstance(p.get("work"), str) or not p.get("work"):
        errs.append("work: missing/empty")
    if not isinstance(p.get("gap"), str) or not p.get("gap"):
        errs.append("gap: missing/empty (must state why nothing fit)")

    level = p.get("level")
    if level not in LEVELS:
        errs.append(f"level: not one of {sorted(LEVELS)}")

    # parent rule: null for new-domain, required otherwise
    parent = p.get("parent", None)
    if level == "new-domain":
        if parent not in (None, "", "null"):
            errs.append("parent: must be null for new-domain")
    elif level in ("new-capability", "new-functionality"):
        if not isinstance(parent, str) or not parent:
            errs.append(f"parent: required (the existing node) for {level}")

    proposed = p.get("proposed")
    if not isinstance(proposed, dict):
        errs.append("proposed: missing or not an object")
    else:
        for k in ("name", "draft"):
            if not isinstance(proposed.get(k), str) or not proposed.get(k):
                errs.append(f"proposed.{k}: missing/empty")
        # a new domain must carry a trigger (its routing signal)
        if level == "new-domain" and not proposed.get("trigger"):
            errs.append("proposed.trigger: required for a new domain")

    if not isinstance(p.get("sources"), list) or not p["sources"]:
        errs.append("sources: missing or empty (research must be cited)")

    status = p.get("status", "")
    if "PROPOSED" not in str(status):
        errs.append("status: must mark the node PROPOSED (not written to KB)")
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
