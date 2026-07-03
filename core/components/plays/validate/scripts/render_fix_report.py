#!/usr/bin/env python3
"""
render_fix_report.py — fix-report renderer for /validate (C9, F7).

Renders the verdict's findings into the two report forms, mechanically — the
model never hand-authors the body:

  report.yaml — machine form: round, verdict, findings (each with kind, id,
                citation, location), checks summary. This is what the NEXT
                round's scope resolver reads, and what /implement's fix-mode
                consumes as its work list.
  report.md   — the issue post: one section per finding — what failed (the
                check/gate/benchmark), the citation, the location, the raw log
                path — plus the checks table. Precise enough that implement
                fixes exactly what's named, nothing more.

Refuses a verdict whose findings lack citation/location (F7 — that's
compute_verdict's contract; this renderer never papers over it).

    python3 render_fix_report.py --verdict <verdict.json> --round <n>
        --out-yaml <report.yaml> --out-md <report.md>

Exit 0 rendered, 1 refused, 2 usage.
"""

import argparse
import json
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("render_fix_report.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="/validate fix-report renderer.")
    ap.add_argument("--verdict", required=True)
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--out-yaml", required=True)
    ap.add_argument("--out-md", required=True)
    args = ap.parse_args()

    with open(args.verdict, "r", encoding="utf-8") as fh:
        verdict = json.load(fh)
    findings = verdict.get("findings") or []
    errors = []
    if not verdict.get("ok"):
        errors.append("verdict file is not ok — fix compute_verdict inputs first")
    for f in findings:
        if not (f.get("citation") or "").strip() or not (f.get("location") or "").strip():
            errors.append(f"uncited finding refused: {json.dumps(f)[:160]} (F7)")
    if errors:
        print(json.dumps({"ok": False, "errors": errors}, indent=2))
        sys.exit(1)

    machine = {
        "epic_id": verdict.get("epic_id"),
        "round": args.round,
        "verdict": verdict.get("verdict"),
        "checks": verdict.get("checks"),
        "findings": findings,
    }
    with open(args.out_yaml, "w", encoding="utf-8") as fh:
        yaml.safe_dump(machine, fh, sort_keys=False, allow_unicode=True)

    checks = verdict.get("checks") or {}
    lines = [
        f"## validate — round {args.round} — "
        f"{'VALIDATED' if verdict.get('verdict') == 'validated' else 'FIX REQUIRED'}",
        "",
        f"Epic: `{verdict.get('epic_id')}` · checks: {checks.get('passed', 0)}/"
        f"{checks.get('total', 0)} passed, {checks.get('failed', 0)} failed, "
        f"{checks.get('errored', 0)} errored · findings: {len(findings)}",
        "",
    ]
    if findings:
        lines.append("### Fix exactly these — nothing more")
        lines.append("")
        for i, f in enumerate(findings, 1):
            lines.append(f"**{i}. [{f.get('kind')}] {f.get('id')}**")
            lines.append(f"- what: {f.get('citation')}")
            lines.append(f"- where: `{f.get('location')}`")
            if f.get("raw_log_path"):
                lines.append(f"- log: `{f.get('raw_log_path')}`")
            lines.append("")
    else:
        lines.append("No findings. The epic is stamped `validated`; /launch is next.")
        lines.append("")
    with open(args.out_md, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(json.dumps({"ok": True, "findings": len(findings),
                      "out_yaml": args.out_yaml, "out_md": args.out_md}, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
