#!/usr/bin/env python3
"""
validate_ice.py — assert an enriched capability ICE is rich, concrete, and schema-true.

Mechanical enforcement of /understand's ICE-side constraints, run over the draft
before the checkpoint:

  - C3/F4  completeness: intent.goals + intent.constraints + intent.failures,
           context.persona + context.systems + context.scope, expectations.outcomes,
           and nfr_needs are ALL non-empty.
  - C4/F5  concrete needs: every nfr_needs.<dimension> is a measurable target with a
           gate — not a vague adjective and not empty.
  - F2     schema: the file parses and carries the ice shape.

A "gate" is detected structurally: the need text must carry a measurable signal — a
digit, a comparator (< > =), a percentage, or an explicit unit/standard token — OR be
a mapping with a non-empty `gate`. A bare adjective ("fast", "secure") fails.

Layer rule: reads the ICE file on disk only; no git/gh/network.

    python3 validate_ice.py --ice <enriched ice.yaml>

Prints {ok, errors[]} JSON. Exit 0 when rich + concrete, 1 otherwise, 2 on usage error.
"""

import argparse
import json
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_ice.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

VAGUE = {"fast", "secure", "reliable", "scalable", "accessible", "private",
         "performant", "robust", "good", "high", "quick", "safe"}
# a concrete gate shows a number, comparator, %, ms/s, a standard token, or uptime
CONCRETE = re.compile(
    r"\d|[<>=]|%|\bms\b|\bsec(?:onds)?\b|\bp\d{2,3}\b|\bWCAG\b|\bASVS\b|\bSLA\b|"
    r"\bnine?s?\b|uptime|\bL\d\b|encrypt", re.IGNORECASE)


def _empty(v):
    if v is None:
        return True
    if isinstance(v, (list, dict, str)):
        return len(v) == 0
    return False


def is_concrete(need):
    """A need is concrete if it's a mapping with a gate, or a string with a measurable signal."""
    if isinstance(need, dict):
        gate = need.get("gate")
        target = need.get("target") or need.get("value") or ""
        text = f"{gate or ''} {target}".strip()
        if _empty(gate) and _empty(target):
            return False
        return bool(CONCRETE.search(text))
    if isinstance(need, str):
        t = need.strip().lower()
        if not t or t in VAGUE:
            return False
        return bool(CONCRETE.search(need))
    return False


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate an enriched capability ICE.")
    ap.add_argument("--ice", required=True, help="enriched ice.yaml to validate")
    args = ap.parse_args(argv)

    try:
        with open(args.ice, encoding="utf-8") as fh:
            doc = yaml.safe_load(fh) or {}
    except OSError as exc:
        sys.stderr.write(f"validate_ice.py: cannot read ICE: {exc}\n")
        sys.exit(2)
    except yaml.YAMLError as exc:
        print(json.dumps({"ok": False, "errors": [f"YAML parse error: {exc}"]}, indent=2))
        return 1

    ice = doc.get("ice", doc) if isinstance(doc, dict) else {}
    errors = []

    intent = ice.get("intent") or {}
    for sect in ("goals", "constraints", "failures"):
        if _empty(intent.get(sect)):
            errors.append(f"intent.{sect} is empty — enriched ICE must be complete (C3/F4)")

    context = ice.get("context") or {}
    for sect in ("persona", "systems", "scope"):
        if _empty(context.get(sect)):
            errors.append(f"context.{sect} is empty — enriched ICE must be complete (C3/F4)")

    if _empty((ice.get("expectations") or {}).get("outcomes")):
        errors.append("expectations.outcomes is empty — enriched ICE must be complete (C3/F4)")

    nfr = ice.get("nfr_needs") or {}
    if _empty(nfr):
        errors.append("nfr_needs is empty — /understand must set the capability's NFR needs (C3/F4)")
    else:
        for dim, need in nfr.items():
            if _empty(need):
                errors.append(f"nfr_needs.{dim} is empty (C3/F4)")
            elif not is_concrete(need):
                errors.append(f"nfr_needs.{dim} is not concrete — needs a measurable "
                              f"target + gate, not a vague adjective (C4/F5)")

    result = {"ok": not errors, "errors": errors}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
