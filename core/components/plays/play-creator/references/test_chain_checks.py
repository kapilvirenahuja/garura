#!/usr/bin/env python3
"""
test_chain_checks.py — fixture tests for the #467 Batch C replacement checks
(validate_issue.py, check_self_review.py). Plain asserts, tempdirs.

    python3 test_chain_checks.py
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable or "python3"


def run(script, *args, expect=0):
    r = subprocess.run(
        [PY, os.path.join(HERE, script), *args], capture_output=True, text=True
    )
    if r.returncode != expect:
        raise AssertionError(
            f"{script} exit {r.returncode} (wanted {expect}):\n{r.stdout}\n{r.stderr}"
        )
    return json.loads(r.stdout)


def write(path, text):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def test_validate_issue():
    t = tempfile.mkdtemp(prefix="cc-")
    ij = os.path.join(t, "issue.json")
    desc = os.path.join(t, "work-description.txt")

    # 1. good: tagged title + real description
    write(ij, json.dumps({"title": "[ENH] add a scope option to the installer"}))
    write(
        desc,
        "The installer always deploys everything; add a scope option so a "
        "target receives only the subset it needs.",
    )
    r = run("validate_issue.py", "--issue-json", ij, "--description", desc)
    assert r["valid"], r

    # 2. missing tag
    write(ij, json.dumps({"title": "add a scope option to the installer"}))
    r = run("validate_issue.py", "--issue-json", ij, "--description", desc, expect=1)
    assert any(p.startswith("T2") for p in r["problems"]), r

    # 3. short title
    write(ij, json.dumps({"title": "[BUG] fix"}))
    r = run("validate_issue.py", "--issue-json", ij, "--description", desc, expect=1)
    assert any(p.startswith("T1") for p in r["problems"]), r

    # 4. empty description
    write(ij, json.dumps({"title": "[ENH] add a scope option to the installer"}))
    write(desc, "tbd")
    r = run("validate_issue.py", "--issue-json", ij, "--description", desc, expect=1)
    assert any(p.startswith("D1") for p in r["problems"]), r

    # 5. conventional prefix accepted; description from issue body fallback
    write(
        ij,
        json.dumps(
            {"title": "feat(installer): add a component scope option", "body": "A" * 60}
        ),
    )
    r = run("validate_issue.py", "--issue-json", ij)
    assert r["valid"], r

    shutil.rmtree(t)
    print("validate_issue: 5/5 pass")


def test_check_self_review():
    t = tempfile.mkdtemp(prefix="cc-")
    sr = os.path.join(t, "self-review.md")

    # 1. clean review with negations only
    write(
        sr,
        "# Self-review\n- Scope: PASS\n- Secrets: none found\n"
        "- No blocking issues found.\n- Blockers: 0\nVerdict: ready to raise.\n",
    )
    r = run("check_self_review.py", "--self-review", sr)
    assert r["clean"] and r["count"] == 0, r

    # 2. a real blocker marker fails
    write(sr, "# Self-review\n- Scope: PASS\n- Tests: [FAIL] suite is red\n")
    r = run("check_self_review.py", "--self-review", sr, expect=1)
    assert r["count"] == 1, r

    # 3. P1 classification fails
    write(sr, "# Self-review\n- Finding: P1 secret committed in config\n")
    r = run("check_self_review.py", "--self-review", sr, expect=1)
    assert not r["clean"], r

    # 4. BLOCKING word without negation fails
    write(sr, "- One BLOCKING item: the tree is dirty\n")
    r = run("check_self_review.py", "--self-review", sr, expect=1)
    assert r["count"] == 1, r

    # 5. "zero blocking" phrasing stays clean
    write(sr, "- Result: zero blocking findings; 2 notes for awareness\n")
    r = run("check_self_review.py", "--self-review", sr)
    assert r["clean"], r

    shutil.rmtree(t)
    print("check_self_review: 5/5 pass")


if __name__ == "__main__":
    test_validate_issue()
    test_check_self_review()
    print("ALL PASS")
