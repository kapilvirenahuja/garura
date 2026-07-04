#!/usr/bin/env python3
"""
check_behavior_preserved.py — assert behavior was proven preserved and no test was weakened
(C2 / C3 / F2 / F3).

Mechanical assertion over test artifacts already captured to disk — it does NOT run tests
(that is the quality-auditor / test-runner layer); it only reads the verdicts and manifests
they wrote:

  --baseline    baseline test verdict YAML captured BEFORE the refactor (the target's tests,
                or characterization tests where coverage was thin). Must show all green.
  --post        the post-refactor test verdict YAML (the SAME suite, re-run by the independent
                verifier). Must show all green.
  --tests-before  a manifest of the test files + per-file assertion counts BEFORE the refactor.
  --tests-after   the same manifest AFTER. No test file may be removed and no file's assertion
                  count may drop (a weakened/skipped/deleted test — F3).

A verdict YAML is "green" when its `status`/`result` is pass AND `failed`/`errors` are 0 (or
absent) AND `passed`/`total` is > 0. A missing baseline or a non-green either side fails.

Usage:
  python3 check_behavior_preserved.py --baseline <yaml> --post <yaml> \
          --tests-before <yaml> --tests-after <yaml> [--out <preservation.yaml>]
Exit:  0 = behavior proven preserved, 1 = not preserved / a test was weakened, 2 = unreadable.

With --out, the verdict is also written as MACHINE fields (#464 / C7) — the play's
preservation record consumed by the stop-condition gate:
  { behavior_preserved: bool, baseline_green: bool, post_green: bool, failures: [str] }
"""

import argparse
import os
import sys

try:
    import yaml
except ImportError:  # pragma: no cover - environment guard
    print("check_behavior_preserved: PyYAML is required", file=sys.stderr)
    sys.exit(2)


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _is_green(v):
    status = str(v.get("status", v.get("result", ""))).strip().lower()
    failed = int(v.get("failed", v.get("failures", v.get("errors", 0))) or 0)
    passed = int(v.get("passed", v.get("total", 0)) or 0)
    return status in ("pass", "passed", "green", "ok") and failed == 0 and passed > 0


def _assertion_counts(manifest):
    """manifest: { test_files: [ {path, assertions} ] } -> { path: assertions }."""
    out = {}
    for entry in manifest.get("test_files", []):
        if isinstance(entry, dict):
            p = entry.get("path") or entry.get("file")
            if p:
                out[p] = int(entry.get("assertions", entry.get("tests", 0)) or 0)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assert behavior preserved, no test weakened.")
    ap.add_argument("--baseline", required=True)
    ap.add_argument("--post", required=True)
    ap.add_argument("--tests-before", required=True)
    ap.add_argument("--tests-after", required=True)
    ap.add_argument("--out", help="write the machine preservation record (YAML) here (#464/C7)")
    args = ap.parse_args(argv)

    try:
        baseline = _load(args.baseline)
        post = _load(args.post)
        before = _assertion_counts(_load(args.tests_before))
        after = _assertion_counts(_load(args.tests_after))
    except OSError as exc:
        print(f"check_behavior_preserved: cannot read input: {exc}", file=sys.stderr)
        return 2

    baseline_green = _is_green(baseline)
    post_green = _is_green(post)

    failures = []
    if not baseline_green:
        failures.append("baseline test verdict is not green (behavior was never pinned before "
                        "the refactor)")
    if not post_green:
        failures.append("post-refactor test verdict is not green (behavior changed or is "
                         "unproven)")

    for path, count in before.items():
        if path not in after:
            failures.append(f"test removed: {path}")
        elif after[path] < count:
            failures.append(f"test weakened: {path} ({count} -> {after[path]} assertions)")

    if args.out:
        record = {
            "behavior_preserved": not failures,
            "baseline_green": baseline_green,
            "post_green": post_green,
            "failures": failures,
        }
        out_dir = os.path.dirname(os.path.abspath(args.out))
        os.makedirs(out_dir, exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as fh:
            yaml.safe_dump(record, fh, sort_keys=False)

    if failures:
        print("BEHAVIOR CHECK: FAIL")
        for f in failures:
            print(f"  {f}")
        return 1

    print("BEHAVIOR CHECK: PASS (green before and after; no test removed or weakened)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
