#!/usr/bin/env python3
"""
_runner_common.py — shared executor for /validate's per-tool runners.

Every runner has the SAME contract (the platform-adapter pattern: stable
interface, per-tool dispatch underneath):

    python3 runner_<tool>.py --check-json <check.json> --out <result.json>

The check spec (one entry from checks.yaml, serialized by run_checks.py) says
WHAT to run; the runner knows its tool class — how to ensure the tool is
present (install if the spec says how), run it, and normalize the outcome.
Output is one NORMALIZED result record:

    {check_id, tool, command, exit, status: pass|fail|error,
     summary, measures: {metric: value}, raw_log_path}

`measures` carries benchmark-comparable numbers a tool reports (e.g.
coverage_pct) when the runner knows how to read them; check_gates.py compares
them against the product profile's floors. A tool that cannot be ensured is
status=error — a check that didn't run is NEVER a check that passed.

Runners run LOCAL build/test/scan tools only (the run_gates.py sanction);
they never touch git/gh or remote systems (C5: code-level only).
"""

import json
import shutil
import subprocess
import sys


def load_check(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def ensure_tool(check, errors):
    """The first binary in `tool_bins` that resolves wins. If none resolves and
    the spec carries an `install` command, run it once and re-probe."""
    bins = check.get("tool_bins") or []
    for b in bins:
        if shutil.which(b):
            return b
    install = check.get("install")
    if install:
        try:
            subprocess.run(install, shell=True, capture_output=True, timeout=600)
        except Exception as exc:
            errors.append(f"install failed: {exc}")
        for b in bins:
            if shutil.which(b):
                return b
    errors.append(f"tool not available: {bins} (install "
                  f"{'attempted' if install else 'not specified'}) — "
                  "a check that didn't run is not a check that passed")
    return None


def run_and_capture(check, log_path):
    cmd = check["command"]
    try:
        proc = subprocess.run(cmd, shell=True, capture_output=True,
                              timeout=check.get("timeout", 1800), text=True)
        with open(log_path, "w", encoding="utf-8") as fh:
            fh.write(proc.stdout or "")
            fh.write(proc.stderr or "")
        return proc.returncode
    except subprocess.TimeoutExpired:
        with open(log_path, "w", encoding="utf-8") as fh:
            fh.write(f"TIMEOUT after {check.get('timeout', 1800)}s: {cmd}\n")
        return -1


def emit(out_path, record):
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2)
    print(json.dumps(record, indent=2))
    sys.exit(0 if record["status"] == "pass" else 1)


def execute(args, parse_measures=None, summarize=None):
    """The whole runner lifecycle. `parse_measures(log_text) -> dict` and
    `summarize(log_text, exit_code) -> str` are the per-tool hooks."""
    check = load_check(args.check_json)
    errors = []
    log_path = args.out.replace(".json", ".log")
    record = {"check_id": check["check_id"], "tool": check.get("tool", "unknown"),
              "command": check.get("command", ""), "exit": None,
              "status": "error", "summary": "", "measures": {},
              "raw_log_path": log_path, "errors": errors}

    binary = ensure_tool(check, errors)
    if binary is None:
        record["summary"] = "; ".join(errors)
        emit(args.out, record)

    code = run_and_capture(check, log_path)
    record["exit"] = code
    try:
        with open(log_path, "r", encoding="utf-8") as fh:
            log_text = fh.read()
    except Exception:
        log_text = ""
    if parse_measures:
        try:
            record["measures"] = parse_measures(log_text) or {}
        except Exception as exc:
            errors.append(f"measure parse failed: {exc}")
    record["status"] = "pass" if code == 0 and not errors else \
                       ("fail" if code != 0 else "error")
    record["summary"] = (summarize(log_text, code) if summarize else
                         f"exit {code}") or f"exit {code}"
    emit(args.out, record)
