#!/usr/bin/env python3
"""
test_gate_learning.py — fixture tests for the #467 gate-learning spine.

Covers classify_change.py in GIT MODE (ADR 026 — shape axes from the working-tree git diff
of <product_base>product-os/ vs HEAD, over a temp git-repo fixture, no draft dir),
gate_eval.py (append/tail, validation), and distill_gate_policy.py (earn, reset, auto_pass
extension, correction refutation, never_auto preservation). Plain asserts, tempdirs, no test
framework.

    python3 test_gate_learning.py
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable or "python3"


def run(script, *args):
    r = subprocess.run(
        [PY, os.path.join(HERE, script), *args], capture_output=True, text=True
    )
    if r.returncode != 0:
        raise AssertionError(f"{script} {' '.join(args)} failed:\n{r.stderr}")
    return r.stdout


def write(root, rel, text):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(text)


def git(root, *args):
    r = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise AssertionError(f"git {' '.join(args)} failed:\n{r.stderr}")
    return r.stdout


def classify_git(base_files, new_files, play="ux", deletions=()):
    """
    Drive classify_change.py in git mode (ADR 026): commit `base_files` under
    <product_base>product-os/ as HEAD, then apply `new_files`/`deletions` to the working
    tree, then classify the working-tree diff vs HEAD. Mirrors how a direct-model-write play
    invokes the classifier — no draft dir.
    """
    t = tempfile.mkdtemp(prefix="gl-")
    pb = os.path.join(t, "product") + os.sep       # product_base, trailing sep
    os_dir = os.path.join(pb, "product-os")
    for rel, text in base_files.items():
        write(os_dir, rel, text)
    git(t, "init", "-q")
    git(t, "config", "user.email", "t@t.t")
    git(t, "config", "user.name", "t")
    git(t, "add", "-A")
    git(t, "commit", "-qm", "base")
    # apply the working-tree change (the play's writes)
    for rel, text in new_files.items():
        write(os_dir, rel, text)
    for rel in deletions:
        os.remove(os.path.join(os_dir, rel))
    out = run("classify_change.py", "--play", play, "--product-base", pb, "--base-ref", "HEAD")
    shutil.rmtree(t)
    return json.loads(out)


def test_classifier():
    # 1. prose-only edit -> prose_edits only
    r = classify_git(
        {"ux.md": "## Screens\nThe list screen shows items.\n"},
        {"ux.md": "## Screens\nThe list screen shows items, newest first.\n"},
    )
    assert r["shape_key"] == "ux:prose_edits", r
    assert r["axes"]["sections_rewritten"] == 0, r

    # 2. status flip -> status_changes counted
    r = classify_git(
        {"_spine.yaml": "- id: slice-1\n  status: shaped\n"},
        {"_spine.yaml": "- id: slice-1\n  status: realized\n"},
        play="measure",
    )
    assert r["axes"]["status_changes"] == 1, r
    assert "status_changes" in r["shape_key"], r

    # 3. new node: a spine entry added + a new capability doc file -> nodes_added
    r = classify_git(
        {"_spine.yaml": "- id: cap-1\n"},
        {
            "_spine.yaml": "- id: cap-1\n- id: cap-2\n",
            "cap-2/capability.md": "# Cap 2\n\n## Boundary\nDoes X.\n",
        },
        play="understand",
    )
    assert r["axes"]["nodes_added"] >= 1, r

    # 4. profile bar move
    r = classify_git(
        {"profile.yaml": "nfr_security: L2\nnfr_perf: L1\n"},
        {"profile.yaml": "nfr_security: L3\nnfr_perf: L1\n"},
        play="understand",
    )
    assert r["axes"]["profile_bars_changed"] == 1, r

    # 5. decision appended
    r = classify_git(
        {"decisions/log.yaml": "- id: d1\n  decision: use X\n"},
        {"decisions/log.yaml": "- id: d1\n  decision: use X\n- id: d2\n  decision: use Y\n"},
        play="arch",
    )
    assert r["axes"]["decisions_added"] >= 1, r

    # 6. section rewrite (>=5 changed lines under one heading)
    r = classify_git(
        {"ux.md": "## Screens\n" + "\n".join(f"old line {i}" for i in range(8)) + "\n"},
        {"ux.md": "## Screens\n" + "\n".join(f"new line {i}" for i in range(8)) + "\n"},
    )
    assert r["axes"]["sections_rewritten"] == 1, r

    # 7. no change -> none; an untouched sibling never counts (git diff is empty)
    r = classify_git(
        {"a.md": "same\n", "b.md": "untouched\n"},
        {},  # working tree matches HEAD
    )
    assert r["shape_key"] == "ux:none", r

    # 8. brand-new decision file (untracked) is still counted -> decisions_added
    #    (regression guard: untracked adds are invisible to `git diff` alone)
    r = classify_git(
        {"_spine.yaml": "- id: cap-1\n"},
        {"decisions/dec-new.yaml": "decision:\n  id: dec-new\n"},
        play="understand",
    )
    assert r["axes"]["decisions_added"] >= 1, r

    print("classifier: 8/8 pass")


def ledger_line(ledger, play, shape, human, ts, predicted="gate", refutes=None):
    args = [
        "append",
        "--ledger",
        ledger,
        "--play",
        play,
        "--issue",
        "478",
        "--shape",
        shape,
        "--predicted",
        predicted,
        "--human",
        human,
        "--ts",
        ts,
    ]
    if refutes:
        args += ["--refutes", str(refutes)]
    run("gate_eval.py", *args)


def distill(ledger, policy, streak="3"):
    out = run(
        "distill_gate_policy.py",
        "--ledger",
        ledger,
        "--policy",
        policy,
        "--streak",
        streak,
        "--project",
        "testproj",
    )
    return json.loads(out)


def test_learner():
    t = tempfile.mkdtemp(prefix="gl-")
    ledger = os.path.join(t, "gate-evals.jsonl")
    policy = os.path.join(t, "gate-policy.yaml")
    S = "ux:prose_edits"

    # 1. two cleans: not earned
    ledger_line(ledger, "ux", S, "approved_clean", "t1")
    ledger_line(ledger, "ux", S, "approved_clean", "t2")
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [], r

    # 2. third clean earns auto
    ledger_line(ledger, "ux", S, "approved_clean", "t3")
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [S], r
    assert r["version"] == 2, r  # version bumps on every distill

    # 3. auto_pass extends; still auto
    ledger_line(ledger, "ux", S, "auto_pass", "t4", predicted="auto")
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [S], r

    # 4. a rejection resets the shape to gated
    ledger_line(ledger, "ux", S, "rejected", "t5")
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [], r

    # 5. three fresh cleans re-earn
    for ts in ("t6", "t7", "t8"):
        ledger_line(ledger, "ux", S, "approved_clean", ts)
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [S], r

    # 6. a correction refuting an earning line resets
    #    (line 8 = the t8 clean; a correction pointing at it breaks the streak)
    ledger_line(ledger, "ux", S, "rejected", "t9", refutes=8)
    r = distill(ledger, policy)
    assert r["auto_shapes"] == [], r

    # 7. never_auto survives distills and blocks earning
    with open(policy, encoding="utf-8") as fh:
        text = fh.read()
    text = text.replace("never_auto: []", "never_auto:\n  - quality:prose_edits")
    with open(policy, "w", encoding="utf-8") as fh:
        fh.write(text)
    for ts in ("t10", "t11", "t12"):
        ledger_line(ledger, "quality", "quality:prose_edits", "approved_clean", ts)
    r = distill(ledger, policy)
    assert "quality:prose_edits" not in r["auto_shapes"], r
    assert r["never_auto"] == ["quality:prose_edits"], r

    # 8. approved_edited also resets (friction = not clean)
    S2 = "arch:prose_edits"
    for ts in ("u1", "u2"):
        ledger_line(ledger, "arch", S2, "approved_clean", ts)
    ledger_line(ledger, "arch", S2, "approved_edited", "u3")
    ledger_line(ledger, "arch", S2, "approved_clean", "u4")
    r = distill(ledger, policy)
    assert S2 not in r["auto_shapes"], r

    shutil.rmtree(t)
    print("learner: 8/8 pass")


if __name__ == "__main__":
    test_classifier()
    test_learner()
    print("ALL PASS")
