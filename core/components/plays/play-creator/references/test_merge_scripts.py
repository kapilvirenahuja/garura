#!/usr/bin/env python3
"""
test_merge_scripts.py — fixture tests for read_merge_state.py + merge_pr.py (#484).

Unit-level: the approval parse (read_merge_state) and the already-merged no-op
finalization (merge_pr). The live merge in merge_pr is destructive and not
exercised here; the no-op path (which does no merge) is.

    python3 test_merge_scripts.py
"""

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable or "python3"
sys.path.insert(0, HERE)
import read_merge_state as rms  # noqa: E402

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


def _tmp(text):
    fd, path = tempfile.mkstemp()
    os.write(fd, text.encode())
    os.close(fd)
    return path


def test_read_approved():
    print("test_read_approved")
    ap = _tmp("decision: approve\n")
    ap2 = _tmp('{"verdict": "approved"}\n')
    rej = _tmp("decision: reject\n")
    check("approve → True", rms._read_approved(ap) is True)
    check("approved (json) → True", rms._read_approved(ap2) is True)
    check("reject → False", rms._read_approved(rej) is False)
    check("missing file → False", rms._read_approved("/no/such") is False)
    check("empty path → False", rms._read_approved("") is False)
    for p in (ap, ap2, rej):
        os.unlink(p)


def test_merge_pr_noop():
    print("test_merge_pr_noop")
    # already_merged gate → clean no-op: no merge attempted, Done-means finalized.
    with tempfile.TemporaryDirectory() as d:
        gate_path = os.path.join(d, "merge-gate.json")
        with open(gate_path, "w") as fh:
            json.dump({"approved": True, "mergeable": False, "already_merged": True,
                       "checks_pass": True, "pr_number": "489",
                       "pr_merged": False, "branch_deleted": False}, fh)
        proc = subprocess.run(
            [PY, os.path.join(HERE, "merge_pr.py"),
             "--branch", "no-such-branch-xyz-123", "--base", "main",
             "--gate", gate_path],
            capture_output=True, text=True)
        with open(gate_path) as fh:
            gate = json.load(fh)
        check("no-op exits 0", proc.returncode == 0)
        check("no-op sets pr_merged true", gate["pr_merged"] is True)
        check("no-op marks a vanished branch deleted", gate["branch_deleted"] is True)
        check("no-op status recorded", gate.get("status") == "already_merged")


def main():
    test_read_approved()
    test_merge_pr_noop()
    print(f"\n{PASSED} passed, {FAILED} failed")
    sys.exit(1 if FAILED else 0)


if __name__ == "__main__":
    main()
