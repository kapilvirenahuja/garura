#!/usr/bin/env python3
"""
Regression tests for validate_epics.py's round-report CLOSED SCHEMA (C13/F14).

Covers the /grill write-gate hole where round evidence written under a non-canonical
top-level key (e.g. legacy `questions:`) was silently ignored — the gate reported a
clean pass with zero decision questions while real human grilling evidence existed.

Each case builds a minimal VALID slice + draft (so the only signal comes from the
round files), runs the gate with --rounds-dir, and asserts on its JSON result.

Run:  python3 test_validate_epics.py   (exit 0 = all pass, 1 = a case failed)
No pytest dependency — plain asserts, deterministic, no network/git.
"""

import contextlib
import importlib.util
import io
import json
import os
import tempfile
import textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "validate_epics", os.path.join(HERE, "validate_epics.py"))
ve = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ve)


def _write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(textwrap.dedent(text))


def run(round_files):
    """Minimal valid slice + one valid epic + the given round files; run the gate."""
    d = tempfile.mkdtemp()
    pb = os.path.join(d, "pb")
    slice_file = "product-os/dom/slices/slice-x.yaml"
    _write(os.path.join(pb, slice_file), """
        slice:
          functionalities:
            - functionality_ref: func-a
    """)
    draft = os.path.join(d, "draft")
    _write(os.path.join(draft, "epics", "e-1.yaml"), """
        epic:
          id: e-1
          slice_ref: dom/slice-x
          title: Title
          outcome: Outcome
          user_check: A user opens the page and sees the value
          acceptance:
            - the value is shown on screen
          context:
            persona: operator
            systems: web
            scope: one screen
          functionality_refs:
            - func-a
          status: ready
          order: 1
    """)
    rounds = os.path.join(d, "rounds")
    os.makedirs(rounds, exist_ok=True)
    for name, text in round_files.items():
        _write(os.path.join(rounds, name), text)
    argv = ["--draft", draft, "--product-base", pb, "--slice-file", slice_file,
            "--rounds-dir", rounds]
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        ve.main(argv)
    return json.loads(buf.getvalue())


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("canonical decision_questions: clean round passes, counted")
def _():
    r = run({"R1-tensions.yaml": """
        round_id: R1
        cut_dir: x
        decision_questions:
          - question_id: R1-Q1
            epic_id: e-1
            cites: {source: s, quote: q}
            question: which ingestion method?
            human_response: {text: provider API}
    """})
    assert r["ok"] is True, r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]


@case("legacy questions: is aliased — counted and validated (the bug)")
def _():
    # Before the fix this reported decision_questions: 0 and ok: true.
    r = run({"R2-ingestion-method.yaml": """
        round_id: R2
        cut_dir: x
        questions:
          - question_id: R2-Q1
            epic_id: e-1
            cites: {source: s, quote: q}
            question: should Epic 1 post JSON to the server API?
            human_response: {text: yes}
            status: resolved
            resolution_directive: cut Epic 1 around the local-script-to-API path
    """})
    assert r["ok"] is True, r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]


@case("legacy questions: resolved with no human_response fails")
def _():
    r = run({"R3.yaml": """
        round_id: R3
        cut_dir: x
        questions:
          - question_id: R3-Q1
            cites: {source: s, quote: q}
            question: which method?
            status: resolved
            resolution_directive: do X
    """})
    assert r["ok"] is False
    assert any("R3-Q1" in e and "unanswered" in e for e in r["errors"]), r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]


@case("legacy questions: resolved with no resolution_directive fails")
def _():
    r = run({"R4.yaml": """
        round_id: R4
        cut_dir: x
        questions:
          - question_id: R4-Q1
            cites: {source: s, quote: q}
            question: which method?
            human_response: {text: yes}
            status: resolved
    """})
    assert r["ok"] is False
    assert any("R4-Q1" in e and "resolution_directive" in e for e in r["errors"]), r["errors"]


@case("legacy questions: missing citation fails")
def _():
    r = run({"R5.yaml": """
        round_id: R5
        cut_dir: x
        questions:
          - question_id: R5-Q1
            question: which method?
            human_response: {text: yes}
    """})
    assert r["ok"] is False
    assert any("R5-Q1" in e and "citation" in e for e in r["errors"]), r["errors"]


@case("off-schema key fails the gate (forged-clean prevention)")
def _():
    r = run({"R6.yaml": """
        round_id: R6
        cut_dir: x
        grill_questions:
          - question_id: R6-Q1
            cites: {source: s, quote: q}
            question: which method?
            human_response: {text: yes}
    """})
    assert r["ok"] is False
    assert any("off-schema" in e and "grill_questions" in e for e in r["errors"]), r["errors"]


def main():
    failed = 0
    for name, fn in CASES:
        try:
            fn()
            print(f"  [PASS] {name}")
        except AssertionError as exc:
            failed += 1
            print(f"  [FAIL] {name}: {exc}")
    print(f"VERDICT: {'PASS' if not failed else 'FAIL'} "
          f"({len(CASES) - failed}/{len(CASES)} passed)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
