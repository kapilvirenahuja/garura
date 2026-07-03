#!/usr/bin/env python3
"""
grounding_gate.py — the deterministic gate over a grounding-eval judge verdict.

The judge (an LLM, in any of the configured modes) only SCORES and evidences; it does
NOT decide pass/fail. This gate decides — so a judge cannot wave a doc through with a
self-declared overall. Rule: the doc passes iff every one of the five criteria is
`pass` or `na`. Any `fail` rejects; a verdict missing a criterion fails CLOSED (a
judge that drops a criterion is not trusted).

See standards/rules/grounding-eval.md for the rubric, prompt, and verdict shape.

Usage:
    python3 grounding_gate.py --verdict verdict.json
    cat verdict.json | python3 grounding_gate.py

Prints one JSON object {ok, overall, doc, failures[], missing[]} and a human summary
to stderr. Exit 0 when the doc passes, 1 on any fail/missing, 2 on a usage/parse error.
"""

import argparse
import json
import sys

REQUIRED_CRITERIA = [
    "completeness",
    "self_explanation",
    "discreteness_form",
    "depth_gradient",
    "stranger_test",
]
PASS_VERDICTS = {"pass", "na"}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Gate a grounding-eval judge verdict.")
    ap.add_argument("--verdict", help="verdict JSON file (default: stdin)")
    args = ap.parse_args(argv)

    try:
        raw = open(args.verdict, encoding="utf-8").read() if args.verdict else sys.stdin.read()
        verdict = json.loads(raw)
    except (OSError, ValueError) as exc:
        sys.stderr.write(f"grounding_gate.py: cannot read/parse verdict: {exc}\n")
        return 2

    doc = verdict.get("doc", "<unknown>")
    by_id = {c.get("id"): c for c in (verdict.get("criteria") or []) if isinstance(c, dict)}

    missing = [cid for cid in REQUIRED_CRITERIA if cid not in by_id]
    failures = []
    for cid in REQUIRED_CRITERIA:
        c = by_id.get(cid)
        if c is None:
            continue  # reported as missing
        if c.get("verdict") not in PASS_VERDICTS:
            failures.append({
                "id": cid,
                "verdict": c.get("verdict"),
                "evidence": c.get("evidence", ""),
                "fix": c.get("fix", ""),
            })

    ok = not missing and not failures
    result = {
        "ok": ok,
        "overall": "pass" if ok else "fail",
        "doc": doc,
        "failures": failures,
        "missing": missing,
    }
    print(json.dumps(result, indent=2))

    # human summary to stderr (does not pollute the JSON on stdout)
    if ok:
        sys.stderr.write(f"PASS — {doc} cleared all five criteria.\n")
    else:
        sys.stderr.write(f"FAIL — {doc}\n")
        for cid in missing:
            sys.stderr.write(f"  missing criterion: {cid} (verdict failed closed)\n")
        for f in failures:
            sys.stderr.write(f"  {f['id']} = {f['verdict']}\n")
            if f["evidence"]:
                sys.stderr.write(f"    evidence: {f['evidence']}\n")
            if f["fix"]:
                sys.stderr.write(f"    fix:      {f['fix']}\n")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
