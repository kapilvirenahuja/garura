#!/usr/bin/env python3
"""
validate_signoff.py — the #436 evidence validator for /launch (C4/F3, C5/F2).

The sign-off record proves a HUMAN walked the scenarios. Per scenario entry:
  shown_to_human  — what the play presented (run steps + check), non-empty;
  human_response  — the human's typed answer, VERBATIM, non-empty;
  result          — accepted | rejected, and it must be consistent with the
                    response being present (a result without the human's own
                    text is forged evidence).
Completeness: every scenario in the scenario set appears exactly once; nothing
unanswered. The validator never decides acceptance — it proves the record.

    python3 validate_signoff.py --signoff <signoff.yaml> --scenarios <scenarios.yaml>

Prints {ok, total, accepted, rejected, errors[]}. Exit 0 valid, 1 not, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_signoff.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

AGENT_TELLS = ("as an ai", "i have verified", "auto-accepted", "agent:",
               "on behalf of the human")


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/launch sign-off record validator.")
    ap.add_argument("--signoff", required=True)
    ap.add_argument("--scenarios", required=True)
    args = ap.parse_args()

    errors = []
    expected = [s.get("id") for s in (load(args.scenarios).get("scenarios") or [])]
    entries = (load(args.signoff).get("signoff") or {}).get("scenarios") or []

    seen = {}
    accepted = rejected = 0
    for e in entries:
        sid = (e.get("id") or "").strip()
        if sid in seen:
            errors.append(f"{sid}: appears twice in the record (C4)")
        seen[sid] = e
        shown = (e.get("shown_to_human") or "").strip()
        resp = (e.get("human_response") or "").strip()
        result = (e.get("result") or "").strip().lower()
        if not shown:
            errors.append(f"{sid}: shown_to_human is empty — the record must prove "
                          f"what the human saw (C4/F3)")
        if not resp:
            errors.append(f"{sid}: human_response is empty — a result without the "
                          f"human's own typed words is forged evidence (C4/F3)")
        elif any(t in resp.lower() for t in AGENT_TELLS):
            errors.append(f"{sid}: human_response reads agent-authored "
                          f"('{resp[:50]}') — only the human's typed words (C4/F3)")
        if result not in ("accepted", "rejected"):
            errors.append(f"{sid}: result is '{result}', must be accepted|rejected — "
                          f"unanswered scenarios block the close (C4/C5/F2)")
        elif result == "accepted":
            accepted += 1
        else:
            rejected += 1

    for sid in expected:
        if sid not in seen:
            errors.append(f"scenario '{sid}' has no sign-off entry — nothing "
                          f"unanswered may pass (C4/C5/F2)")
    for sid in seen:
        if sid not in expected:
            errors.append(f"sign-off entry '{sid}' matches no authored scenario (C4)")

    out = {"ok": not errors, "total": len(entries),
           "accepted": accepted, "rejected": rejected, "errors": errors}
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["ok"] else 1)


if __name__ == "__main__":
    main()
