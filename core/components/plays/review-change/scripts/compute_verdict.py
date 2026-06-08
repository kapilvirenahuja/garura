#!/usr/bin/env python3
"""compute_verdict.py — deterministic approve/reject verdict over classified findings.

PURE: reads an already-classified findings file (produced by quality-check-scoped, which
owns severity classification via the no-LLM pr.md taxonomy) and applies the fixed verdict
rule. No git/gh, no re-classification, no LLM judgment.

Verdict rule:
    reject  if any finding is severity P1  OR  confidence < threshold
    approve otherwise

On reject, the cited blocking findings are every P1 finding (the sub-threshold-confidence
case is a reject with an empty blocker list but a recorded reason).

findings file format (YAML or JSON) — a mapping with a `findings` list; each finding has
at least `id` (or `standard_id`) and `severity` (P1..P4). An optional top-level
`confidence` (0..1) may be present.

Usage:
    python3 compute_verdict.py --findings <path> [--threshold 0.5]

Emits JSON {verdict, reason, blocking, counts}. Exit 0 always when the file parses
(the verdict itself is the output, not the exit code); 2 on unreadable/unparseable input.
"""
import argparse
import json
import sys


def _load(path):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    try:  # try JSON first (a strict subset of YAML)
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    try:
        import yaml  # type: ignore
    except ImportError:
        raise SystemExit("findings file is not JSON and PyYAML is unavailable to parse YAML")
    return yaml.safe_load(text)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--findings", required=True, help="path to classified findings (yaml/json)")
    ap.add_argument("--threshold", type=float, default=0.5, help="min confidence to approve")
    args = ap.parse_args()

    try:
        data = _load(args.findings) or {}
    except (OSError, SystemExit) as exc:
        print(f"cannot read findings: {exc}", file=sys.stderr)
        return 2

    findings = data.get("findings", []) if isinstance(data, dict) else []
    confidence = data.get("confidence") if isinstance(data, dict) else None

    def sev(f):
        return str(f.get("severity", "")).upper().strip()

    def fid(f):
        return f.get("id") or f.get("standard_id") or "?"

    p1 = [f for f in findings if sev(f) == "P1"]
    counts = {}
    for f in findings:
        counts[sev(f) or "?"] = counts.get(sev(f) or "?", 0) + 1

    below_threshold = confidence is not None and float(confidence) < args.threshold

    if p1:
        verdict, reason = "reject", f"{len(p1)} P1 (blocker) finding(s)"
    elif below_threshold:
        verdict, reason = "reject", f"confidence {confidence} below threshold {args.threshold}"
    else:
        verdict, reason = "approve", "no P1 findings; confidence acceptable"

    out = {
        "verdict": verdict,
        "reason": reason,
        "blocking": [fid(f) for f in p1],
        "counts": counts,
        "confidence": confidence,
        "threshold": args.threshold,
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
