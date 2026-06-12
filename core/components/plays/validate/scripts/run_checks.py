#!/usr/bin/env python3
"""
run_checks.py — check orchestrator for /validate (C4, C5).

Reads the check manifest (checks.yaml — authored by plan-validation-checks,
KB-grounded) and dispatches every check to its per-tool runner under runners/.
It knows WHICH runners to call, never HOW any tool works (the platform-adapter
pattern). Each runner emits one normalized result record; this script collects
them into a summary. A runner that cannot run its tool yields status=error —
recorded, never silently skipped.

Manifest shape (per check):
    - check_id: tests-node
      runner: node                # runners/runner_<name>.py must exist
      tool: npm
      tool_bins: [npm]
      command: "npm test -- --coverage"
      class: tests                # tests|coverage|lint|scan|build|audit|gate
      install: ""                 # optional ensure command
      timeout: 1800               # optional

    python3 run_checks.py --manifest <checks.yaml> --results-dir <dir>
        [--runners-dir <dir>] [--only <comma check_ids>]

Prints {ok, total, passed, failed, errored, results[]} and writes summary.json
into --results-dir. Exit 0 all pass, 1 any fail/error, 2 usage.
"""

import argparse
import json
import os
import subprocess
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("run_checks.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description="/validate check orchestrator.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--results-dir", required=True)
    ap.add_argument("--runners-dir",
                    default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "runners"))
    ap.add_argument("--only", default=None,
                    help="comma-separated check_ids (scoped re-runs)")
    args = ap.parse_args()

    with open(args.manifest, "r", encoding="utf-8") as fh:
        manifest = yaml.safe_load(fh) or {}
    checks = manifest.get("checks") or []
    only = set(args.only.split(",")) if args.only else None

    # runners execute with cwd=runners-dir (so _runner_common imports);
    # every path handed to them must therefore be absolute.
    args.results_dir = os.path.abspath(args.results_dir)
    os.makedirs(args.results_dir, exist_ok=True)
    results = []
    errors = []
    for check in checks:
        cid = check.get("check_id")
        if not cid:
            errors.append("manifest check without check_id")
            continue
        if only and cid not in only:
            continue
        runner = os.path.join(args.runners_dir,
                              f"runner_{check.get('runner', '')}.py")
        result_path = os.path.join(args.results_dir, f"{cid}.json")
        if not os.path.isfile(runner):
            rec = {"check_id": cid, "tool": check.get("tool", "unknown"),
                   "command": check.get("command", ""), "exit": None,
                   "status": "error",
                   "summary": f"no runner for class '{check.get('runner')}' — "
                              "a check that didn't run is not a check that passed",
                   "measures": {}, "raw_log_path": None}
            with open(result_path, "w", encoding="utf-8") as fh:
                json.dump(rec, fh, indent=2)
            results.append(rec)
            continue
        spec_path = os.path.join(args.results_dir, f"{cid}.check.json")
        with open(spec_path, "w", encoding="utf-8") as fh:
            json.dump(check, fh, indent=2)
        subprocess.run([sys.executable, runner, "--check-json", spec_path,
                        "--out", result_path],
                       cwd=os.path.dirname(runner), capture_output=True)
        try:
            with open(result_path, "r", encoding="utf-8") as fh:
                results.append(json.load(fh))
        except Exception as exc:
            results.append({"check_id": cid, "status": "error",
                            "summary": f"runner emitted no result: {exc}",
                            "measures": {}, "raw_log_path": None})

    summary = {
        "ok": bool(results) and all(r["status"] == "pass" for r in results)
              and not errors,
        "total": len(results),
        "passed": sum(1 for r in results if r["status"] == "pass"),
        "failed": sum(1 for r in results if r["status"] == "fail"),
        "errored": sum(1 for r in results if r["status"] == "error"),
        "errors": errors,
        "results": results,
    }
    with open(os.path.join(args.results_dir, "summary.json"), "w",
              encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2)
    print(json.dumps({k: v for k, v in summary.items() if k != "results"},
                     indent=2))
    sys.exit(0 if summary["ok"] else 1)


if __name__ == "__main__":
    main()
