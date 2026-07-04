#!/usr/bin/env python3
"""
test_concurrent_fanout.py — fixture tests for the #468 Stage 5 concurrent
read-only fan-out (epic #460). Two subjects:

  1. lint_play.py check_fanout_declaration — the convergence-lint that a play
     citing concurrent-fanout.md must declare its join + read-only safety.
  2. validate/scripts/run_checks.py — the script-internal fan-out: proves the
     concurrent run is byte-identical to the serial run (order-stable join),
     that every check's result is present (nothing dropped at the barrier), and
     that a duplicate check_id is guarded, not raced.

Plain asserts, tempdirs, no wall-clock in the assertions.

    python3 test_concurrent_fanout.py
"""

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable or "python3"
SCRIPTS = os.path.join(HERE, "..", "scripts")
RUN_CHECKS = os.path.normpath(
    os.path.join(HERE, "..", "..", "validate", "scripts", "run_checks.py"))

sys.path.insert(0, os.path.abspath(SCRIPTS))
import lint_play  # noqa: E402

PASSED = 0
FAILED = 0


def check(name, cond):
    global PASSED, FAILED
    if cond:
        PASSED += 1
        print(f"  [PASS] {name}")
    else:
        FAILED += 1
        print(f"  [FAIL] {name}")


# ---------------------------------------------------------------------------
# 1. lint check_fanout_declaration
# ---------------------------------------------------------------------------
def _lint(text):
    """Run just the fan-out check over a play body; return (ok, detail) or None."""
    res = lint_play.check_fanout_declaration({"text": text})
    if not res:
        return None
    ok, _label, detail = res[0]
    return ok, detail


def test_lint_declaration():
    print("test_lint_declaration")
    # Silent when the play never fans out.
    check("no fan-out → check is silent",
          _lint("A plain serial play. No concurrency here.") is None)
    # Passes when the play cites the rule AND declares join + read-only.
    good = ("dispatch a concurrent read-only fan-out "
            "(standards/rules/concurrent-fanout.md): each judge is read-only, "
            "join before gating.")
    r = _lint(good)
    check("cites rule + join + read-only → PASS", r is not None and r[0] is True)
    # Fails when it cites the rule but omits the join barrier.
    no_join = ("see concurrent-fanout.md — each sub-agent is read-only over its "
               "own doc.")
    r = _lint(no_join)
    check("cites rule, no join → FAIL", r is not None and r[0] is False
          and "join" in r[1])
    # Fails when it cites the rule but omits the read-only condition.
    no_ro = "see concurrent-fanout.md — dispatch the batch, then join."
    r = _lint(no_ro)
    check("cites rule, no read-only → FAIL", r is not None and r[0] is False
          and "read-only" in r[1])


# ---------------------------------------------------------------------------
# 2. run_checks.py — serial vs concurrent equality + join completeness
# ---------------------------------------------------------------------------
FAKE_RUNNER = '''\
import argparse, json
ap = argparse.ArgumentParser()
ap.add_argument("--check-json", required=True)
ap.add_argument("--out", required=True)
a = ap.parse_args()
with open(a.check_json) as fh:
    spec = json.load(fh)
rec = {"check_id": spec["check_id"], "tool": spec.get("tool", "fake"),
       "command": spec.get("command", ""), "exit": 0, "status": "pass",
       "summary": "ok", "measures": {}, "raw_log_path": None}
with open(a.out, "w") as fh:
    json.dump(rec, fh, indent=2)
'''


def _write(path, text):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def _manifest(cids):
    lines = ["checks:"]
    for cid in cids:
        lines += [f"  - check_id: {cid}", "    runner: fake", "    tool: fake",
                  f'    command: "echo {cid}"', "    class: tests"]
    return "\n".join(lines) + "\n"


def _run(manifest_path, runners_dir, results_dir, max_parallel):
    os.makedirs(results_dir, exist_ok=True)
    proc = subprocess.run(
        [PY, RUN_CHECKS, "--manifest", manifest_path, "--results-dir", results_dir,
         "--runners-dir", runners_dir, "--max-parallel", str(max_parallel)],
        capture_output=True, text=True)
    with open(os.path.join(results_dir, "summary.json"), encoding="utf-8") as fh:
        return json.load(fh), proc.returncode


def test_serial_equals_concurrent():
    print("test_serial_equals_concurrent")
    cids = [f"chk-{i:02d}" for i in range(12)]  # 12 independent checks
    with tempfile.TemporaryDirectory() as d:
        runners = os.path.join(d, "runners")
        os.makedirs(runners)
        _write(os.path.join(runners, "runner_fake.py"), FAKE_RUNNER)
        manifest = os.path.join(d, "checks.yaml")
        _write(manifest, _manifest(cids))

        serial, rc_s = _run(manifest, runners, os.path.join(d, "r_serial"), 1)
        conc, rc_c = _run(manifest, runners, os.path.join(d, "r_conc"), 8)

        # Join completeness: every check produced a result, nothing dropped.
        check("serial: all 12 results present", serial["total"] == 12)
        check("concurrent: all 12 results present", conc["total"] == 12)
        # Order-stable: results come back in manifest order regardless of pool.
        s_ids = [r["check_id"] for r in serial["results"]]
        c_ids = [r["check_id"] for r in conc["results"]]
        check("concurrent result order == manifest order", c_ids == cids)
        check("serial result order == manifest order", s_ids == cids)
        # The whole summary is identical — concurrency changed only timing.
        check("concurrent summary == serial summary", conc == serial)
        check("both exit 0 (all pass)", rc_s == 0 and rc_c == 0)


def test_duplicate_cid_guarded():
    print("test_duplicate_cid_guarded")
    with tempfile.TemporaryDirectory() as d:
        runners = os.path.join(d, "runners")
        os.makedirs(runners)
        _write(os.path.join(runners, "runner_fake.py"), FAKE_RUNNER)
        manifest = os.path.join(d, "checks.yaml")
        _write(manifest, _manifest(["dup", "dup", "unique"]))
        summary, rc = _run(manifest, runners, os.path.join(d, "r"), 8)
        # The duplicate is recorded as an error, not raced; the unique one runs.
        check("duplicate check_id recorded as error",
              any("duplicate check_id" in e for e in summary["errors"]))
        check("only the two distinct ids ran", summary["total"] == 2)
        check("run not ok (errors present)", summary["ok"] is False and rc == 1)


def main():
    test_lint_declaration()
    test_serial_equals_concurrent()
    test_duplicate_cid_guarded()
    print(f"\n{PASSED} passed, {FAILED} failed")
    sys.exit(1 if FAILED else 0)


if __name__ == "__main__":
    main()
