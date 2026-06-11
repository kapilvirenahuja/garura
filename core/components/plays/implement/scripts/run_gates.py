#!/usr/bin/env python3
"""
run_gates.py — mechanical gate runner for /implement (C10/F7).

"The act part — if it can be scripts, script it" (#434). This script RUNS the
project's verification mechanics and captures results to a file; no agent burns
inference executing test commands. The steelman verifier (quality-auditor) then
JUDGES the captured results — it never re-runs the mechanics.

Inputs:
  --harness   harness.yaml captured in the box-context step (detect-test-harness):
                harness:
                  commands:            # any subset; each value a shell command
                    test: "npm test"
                    lint: "npm run lint"
                    typecheck: "..."
                    build: "..."
                    coverage: "..."
  --quality-lens  the slice's lens/quality.yaml (gates: [string]) — each gate is
              listed in the output, mapped `runnable` when a harness command
              family covers it, else `needs-judgment` for the verifier.
  --output    gates-results.yaml

Local process execution only (the project's own commands, cwd = repo root);
no git/gh/network of its own. Overall pass = every harness command exits 0.

    python3 run_gates.py --harness <harness.yaml> --quality-lens <quality.yaml>
                         --output <gates-results.yaml> [--cwd <repo-root>]
                         [--timeout <secs-per-command>]

Prints {ok, pass, commands{name: exit}, output} JSON.
Exit 0 = ran + all pass, 1 = ran + something failed, 2 = usage/setup error.
"""

import argparse
import json
import subprocess
import sys
import time

try:
    import yaml
except ImportError:
    sys.stderr.write("run_gates.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

TAIL = 4000  # chars of output kept per command


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Run harness gate commands, capture results.")
    ap.add_argument("--harness", required=True)
    ap.add_argument("--quality-lens", default=None)
    ap.add_argument("--output", required=True)
    ap.add_argument("--cwd", default=".")
    ap.add_argument("--timeout", type=int, default=1800)
    args = ap.parse_args(argv)

    try:
        commands = ((load(args.harness).get("harness") or {}).get("commands") or {})
    except (OSError, yaml.YAMLError) as exc:
        sys.stderr.write(f"run_gates.py: harness unreadable: {exc}\n")
        return 2
    if not commands:
        sys.stderr.write("run_gates.py: harness.commands is empty — nothing runnable; "
                         "capture the harness in the box-context step first.\n")
        return 2

    results = []
    for name, cmd in commands.items():
        if not (cmd or "").strip():
            continue
        started = time.time()
        try:
            proc = subprocess.run(cmd, shell=True, cwd=args.cwd,
                                  capture_output=True, text=True,
                                  timeout=args.timeout)
            exit_code, tail = proc.returncode, (proc.stdout + proc.stderr)[-TAIL:]
        except subprocess.TimeoutExpired:
            exit_code, tail = 124, f"timed out after {args.timeout}s"
        results.append({"name": name, "command": cmd, "exit_code": exit_code,
                        "pass": exit_code == 0,
                        "duration_secs": round(time.time() - started, 1),
                        "output_tail": tail})

    gates = []
    if args.quality_lens:
        try:
            lens_gates = ((load(args.quality_lens).get("content") or {}).get("gates") or [])
        except (OSError, yaml.YAMLError):
            lens_gates = []
        families = {r["name"] for r in results}
        for g in lens_gates:
            low = (g or "").lower()
            runnable = [f for f in families
                        if f in low or (f == "test" and ("test" in low or "coverage" in low))]
            gates.append({"gate": g,
                          "mapping": "runnable" if runnable else "needs-judgment",
                          "commands": runnable})

    overall = all(r["pass"] for r in results)
    doc = {"gates_results": {"pass": overall, "ran_at": int(time.time()),
                             "commands": results, "lens_gates": gates}}
    with open(args.output, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, sort_keys=False, allow_unicode=True)

    print(json.dumps({"ok": True, "pass": overall,
                      "commands": {r["name"]: r["exit_code"] for r in results},
                      "output": args.output}, indent=2))
    return 0 if overall else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
