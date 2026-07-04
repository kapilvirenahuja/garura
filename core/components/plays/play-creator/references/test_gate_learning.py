#!/usr/bin/env python3
"""
test_gate_learning.py — fixture tests for the #467 gate-learning spine.

Covers classify_change.py (shape axes from real file diffs), gate_eval.py (append/tail,
validation), and distill_gate_policy.py (earn, reset, auto_pass extension, correction
refutation, never_auto preservation). Plain asserts, tempdirs, no test framework.

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
    r = subprocess.run([PY, os.path.join(HERE, script), *args],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise AssertionError(f"{script} {' '.join(args)} failed:\n{r.stderr}")
    return r.stdout


def write(root, rel, text):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(text)


def classify(draft, live, play="ux"):
    out = run("classify_change.py", "--play", play, "--draft", draft, "--live", live)
    return json.loads(out)


def test_classifier():
    t = tempfile.mkdtemp(prefix="gl-")
    live, draft = os.path.join(t, "live"), os.path.join(t, "draft")

    # 1. prose-only edit -> prose_edits only
    write(live, "ux.md", "## Screens\nThe list screen shows items.\n")
    write(draft, "ux.md", "## Screens\nThe list screen shows items, newest first.\n")
    r = classify(draft, live)
    assert r["shape_key"] == "ux:prose_edits", r
    assert r["axes"]["sections_rewritten"] == 0, r

    # 2. status flip -> status_changes counted
    shutil.rmtree(t); os.makedirs(t)
    write(live, "spine.yaml", "- id: slice-1\n  status: shaped\n")
    write(draft, "spine.yaml", "- id: slice-1\n  status: realized\n")
    r = classify(draft, live, play="measure")
    assert r["axes"]["status_changes"] == 1, r
    assert "status_changes" in r["shape_key"], r

    # 3. new node file -> nodes_added
    shutil.rmtree(t); os.makedirs(t)
    write(live, "spine.yaml", "- id: cap-1\n")
    write(draft, "spine.yaml", "- id: cap-1\n- id: cap-2\n")
    write(draft, "cap-2/capability.md", "# Cap 2\n\n## Boundary\nDoes X.\n")
    r = classify(draft, live, play="understand")
    assert r["axes"]["nodes_added"] >= 1, r

    # 4. profile bar move
    shutil.rmtree(t); os.makedirs(t)
    write(live, "profile.yaml", "nfr_security: L2\nnfr_perf: L1\n")
    write(draft, "profile.yaml", "nfr_security: L3\nnfr_perf: L1\n")
    r = classify(draft, live, play="understand")
    assert r["axes"]["profile_bars_changed"] == 1, r

    # 5. decision appended
    shutil.rmtree(t); os.makedirs(t)
    write(live, "decisions/log.yaml", "- id: d1\n  decision: use X\n")
    write(draft, "decisions/log.yaml", "- id: d1\n  decision: use X\n- id: d2\n  decision: use Y\n")
    r = classify(draft, live, play="arch")
    assert r["axes"]["decisions_added"] >= 1, r

    # 6. section rewrite (>=5 changed lines under one heading)
    shutil.rmtree(t); os.makedirs(t)
    write(live, "ux.md", "## Screens\n" + "\n".join(f"old line {i}" for i in range(8)) + "\n")
    write(draft, "ux.md", "## Screens\n" + "\n".join(f"new line {i}" for i in range(8)) + "\n")
    r = classify(draft, live)
    assert r["axes"]["sections_rewritten"] == 1, r

    # 7. identical -> none; live file absent from draft is NOT a removal
    shutil.rmtree(t); os.makedirs(t)
    write(live, "a.md", "same\n")
    write(live, "b.md", "untouched\n")
    write(draft, "a.md", "same\n")
    r = classify(draft, live)
    assert r["shape_key"] == "ux:none", r

    shutil.rmtree(t)
    print("classifier: 7/7 pass")


def ledger_line(ledger, play, shape, human, ts, predicted="gate", refutes=None):
    args = ["append", "--ledger", ledger, "--play", play, "--issue", "478",
            "--shape", shape, "--predicted", predicted, "--human", human, "--ts", ts]
    if refutes:
        args += ["--refutes", str(refutes)]
    run("gate_eval.py", *args)


def distill(ledger, policy, streak="3"):
    out = run("distill_gate_policy.py", "--ledger", ledger, "--policy", policy,
              "--streak", streak, "--project", "testproj")
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
