#!/usr/bin/env python3
"""
check_scenario_coverage.py — both-direction coverage gate for /launch (C3/F4).

Over the authored scenario set and the epic record:
  forward  — every acceptance criterion (by index) is covered by >= 1 scenario's
             `covers` list, and the user_check is covered by >= 1 scenario.
  backward — every scenario's `covers` entries resolve to a real acceptance
             index or the literal "user_check"; a scenario covering nothing is
             invented scope.
  shape    — every scenario carries id, run[] (the concrete steps), and
             check (what the human should see).

    python3 check_scenario_coverage.py --scenarios <scenarios.yaml>
        --product-base <pb> --epic <epic-id>

The epic's acceptance criteria are read from its epic.md grounding doc (one
criterion per top-level bullet under "## Acceptance criteria" — the stable
enumeration the `covers` indices resolve against).

Prints {ok, scenarios, criteria, errors[]}. Exit 0 covered, 1 gaps, 2 usage.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_scenario_coverage.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def md_section_bullets(md_path, heading):
    """Top-level '- '/'* ' bullets under a '## heading', each joined across wrapped
    continuation lines — the stable acceptance enumeration."""
    try:
        text = open(md_path, encoding="utf-8").read()
    except OSError:
        return []
    items, capturing, cur = [], False, None
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("## "):
            if capturing:
                break
            capturing = s[3:].strip().lower() == heading.strip().lower()
            continue
        if not capturing:
            continue
        if s.startswith("- ") or s.startswith("* "):
            if cur is not None:
                items.append(cur.strip())
            cur = s[2:].strip()
        elif s and cur is not None:
            cur += " " + s
    if cur is not None:
        items.append(cur.strip())
    return [i for i in items if i]


def main():
    ap = argparse.ArgumentParser(description="/launch scenario coverage gate.")
    ap.add_argument("--scenarios", required=True)
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--epic", required=True, help="epic id")
    args = ap.parse_args()

    errors = []
    spine = load(os.path.join(args.product_base, "product-os", "_spine.yaml"))
    epic = next((e for e in (spine.get("epics") or [])
                 if isinstance(e, dict) and e.get("id") == args.epic.split("/")[-1]), None) or {}
    acceptance = md_section_bullets(
        os.path.join(args.product_base, "product-os", epic.get("doc") or ""),
        "Acceptance criteria")
    scenarios = (load(args.scenarios).get("scenarios") or [])

    if not scenarios:
        errors.append("no scenarios authored (C3/F4)")

    covered = set()
    user_check_covered = False
    seen_ids = set()
    for sc in scenarios:
        sid = (sc.get("id") or "").strip()
        if not sid:
            errors.append(f"scenario without id: {json.dumps(sc)[:80]} (C3)")
            continue
        if sid in seen_ids:
            errors.append(f"duplicate scenario id '{sid}' (C3)")
        seen_ids.add(sid)
        if not (sc.get("run") or []):
            errors.append(f"{sid}: no run steps — the human must know what to run (C3)")
        if not (sc.get("check") or "").strip():
            errors.append(f"{sid}: no check — the human must know what to test (C3)")
        covers = sc.get("covers") or []
        if not covers:
            errors.append(f"{sid}: covers nothing in the epic — invented scope (C3/F4)")
        for c in covers:
            if str(c).strip().lower() == "user_check":
                user_check_covered = True
            else:
                try:
                    idx = int(c)
                except (TypeError, ValueError):
                    errors.append(f"{sid}: covers '{c}' — not an acceptance index or "
                                  f"'user_check' (C3/F4)")
                    continue
                if not (0 <= idx < len(acceptance)):
                    errors.append(f"{sid}: covers acceptance[{idx}] which does not exist "
                                  f"(epic has {len(acceptance)}) (C3/F4)")
                else:
                    covered.add(idx)

    for idx in range(len(acceptance)):
        if idx not in covered:
            errors.append(f"acceptance[{idx}] '{str(acceptance[idx])[:60]}' has no "
                          f"scenario (C3/F4)")
    if scenarios and not user_check_covered:
        errors.append("the epic's user_check has no scenario (C3/F4)")

    out = {"ok": not errors, "scenarios": len(scenarios),
           "criteria": len(acceptance), "errors": errors}
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
