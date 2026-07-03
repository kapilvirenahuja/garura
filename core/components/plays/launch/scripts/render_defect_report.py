#!/usr/bin/env python3
"""
render_defect_report.py — launch defect report renderer (C6/F6).

Rejected scenarios → the defect report, in the SAME machine shape as
/validate's fix report so /implement's fix mode consumes it identically:
findings[] with kind/id/citation/location. The citation is the HUMAN's own
words plus what they were shown; the location is the scenario's run context.
Mechanical — the model never hand-authors the body, and a report with zero
rejections is refused (nothing to fix is not a defect report).

    python3 render_defect_report.py --signoff <signoff.yaml>
        --scenarios <scenarios.yaml> --epic-id <id> --round <n>
        --out-yaml <report.yaml> --out-md <report.md>

Exit 0 rendered, 1 refused, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("render_defect_report.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main():
    ap = argparse.ArgumentParser(description="/launch defect report renderer.")
    ap.add_argument("--signoff", required=True)
    ap.add_argument("--scenarios", required=True)
    ap.add_argument("--epic-id", required=True)
    ap.add_argument("--round", type=int, default=1)
    ap.add_argument("--out-yaml", required=True)
    ap.add_argument("--out-md", required=True)
    args = ap.parse_args()

    scenarios = {s.get("id"): s for s in (load(args.scenarios).get("scenarios") or [])}
    entries = (load(args.signoff).get("signoff") or {}).get("scenarios") or []
    findings = []
    for e in entries:
        if (e.get("result") or "").strip().lower() != "rejected":
            continue
        sid = e.get("id")
        sc = scenarios.get(sid) or {}
        resp = (e.get("human_response") or "").strip()
        if not resp:
            print(json.dumps({"ok": False,
                              "errors": [f"{sid}: rejected without the human's words — "
                                         "forged/empty evidence, refuse (F3)"]}, indent=2))
            sys.exit(1)
        findings.append({
            "kind": "launch-rejected",
            "id": sid,
            "citation": f"human: \"{resp}\" — shown: {e.get('shown_to_human', '')}".strip(),
            "location": "; ".join(sc.get("run") or []) or sid,
        })

    if not findings:
        print(json.dumps({"ok": False,
                          "errors": ["zero rejections — there is no defect report to "
                                     "render (C6)"]}, indent=2))
        sys.exit(1)

    machine = {"epic_id": args.epic_id, "round": args.round,
               "verdict": "fix_required", "source": "launch-hitl",
               "findings": findings}
    with open(args.out_yaml, "w", encoding="utf-8") as fh:
        yaml.safe_dump(machine, fh, sort_keys=False, allow_unicode=True)

    lines = [f"## launch — HITL round {args.round} — FIX REQUIRED", "",
             f"Epic: `{args.epic_id}` · rejected scenarios: {len(findings)}", "",
             "### Fix exactly these — nothing more", ""]
    for i, f in enumerate(findings, 1):
        lines.append(f"**{i}. [{f['kind']}] {f['id']}**")
        lines.append(f"- what the human said: {f['citation']}")
        lines.append(f"- where: `{f['location']}`")
        lines.append("")
    with open(args.out_md, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(json.dumps({"ok": True, "findings": len(findings),
                      "out_yaml": args.out_yaml, "out_md": args.out_md}, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
