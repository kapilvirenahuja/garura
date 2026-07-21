#!/usr/bin/env python3
"""
Regression tests for validate_epics.py's round-report CLOSED SCHEMA (C13/F14)
and the write-gate verdict (--out, #466 Batch C).

Covers the /grill write-gate hole where round evidence written under a non-canonical
top-level key (e.g. legacy `questions:`) was silently ignored — the gate reported a
clean pass with zero decision questions while real human grilling evidence existed.

Each case builds a minimal VALID spine slice + draft cut (so the only signal comes
from the round files), runs the gate with --rounds-dir, and asserts on its JSON result.

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

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "validate_epics", os.path.join(HERE, "validate_epics.py"))
ve = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ve)


def _write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(textwrap.dedent(text))


def run(round_files, out_name=None):
    """Minimal valid spine slice + one valid epic + the given round files; run the gate.

    Returns (result, out_path): the stdout JSON verdict, and the --out file path
    (None unless out_name given).
    """
    d = tempfile.mkdtemp()
    pb = os.path.join(d, "pb")
    _write(os.path.join(pb, "product-os", "_spine.yaml"), """
        slices:
          - id: slice-x
            functionality_refs:
              - func-a
    """)
    # Direct-model-write (ADR 026): the epics-index delta lives in the STM manifest,
    # not a draft _spine.yaml. The epic.md doc is written to the live model by author-epics.
    manifest = os.path.join(d, "epics-manifest.yaml")
    _write(manifest, """
        epics:
          - id: e-1
            slice_ref: dom/slice-x
            title: Title
            outcome: Outcome
            user_check: A user opens the page and sees the value
            surface:
              type: web_dashboard
              human_run_target: open the page
            functionality_refs:
              - func-a
            status: ready
            order: 1
        deferrals: []
    """)
    rounds = os.path.join(d, "rounds")
    os.makedirs(rounds, exist_ok=True)
    for name, text in round_files.items():
        _write(os.path.join(rounds, name), text)
    argv = ["--manifest", manifest, "--product-base", pb, "--slice-ref", "slice-x",
            "--rounds-dir", rounds]
    out_path = None
    if out_name:
        out_path = os.path.join(d, out_name)
        argv += ["--out", out_path]
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        ve.main(argv)
    return json.loads(buf.getvalue()), out_path


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("canonical decision_questions: clean round passes, counted")
def _():
    r, _p = run({"R1-tensions.yaml": """
        decision_questions:
          - question_id: R1-Q1
            epic_id: e-1
            cites: {source: s, quote: q}
            question: which ingestion method?
            human_response: {text: provider API}
    """})
    assert r["ok"] is True, r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]
    assert r["counts"]["decision_questions_open"] == 0, r["counts"]


@case("legacy questions: is aliased — counted and validated (the bug)")
def _():
    # Before the fix this reported decision_questions: 0 and ok: true.
    r, _p = run({"R2-ingestion-method.yaml": """
        questions:
          - question_id: R2-Q1
            epic_id: e-1
            cites: {source: s, quote: q}
            question: should Epic 1 post JSON to the server API?
            human_response: {text: yes}
    """})
    assert r["ok"] is True, r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]


@case("legacy questions: entry with no human_response fails as unanswered")
def _():
    r, _p = run({"R3.yaml": """
        questions:
          - question_id: R3-Q1
            cites: {source: s, quote: q}
            question: which method?
    """})
    assert r["ok"] is False
    assert any("R3-Q1" in e and "unanswered" in e for e in r["errors"]), r["errors"]
    assert r["counts"]["decision_questions"] == 1, r["counts"]
    assert r["counts"]["decision_questions_open"] == 1, r["counts"]


@case("live tension fails the gate and is counted")
def _():
    r, _p = run({"R4.yaml": """
        tensions:
          - tension_id: R4-T1
            cites: {source: s, quote: q}
            status: live
    """})
    assert r["ok"] is False
    assert any("R4-T1" in e and "live tension" in e for e in r["errors"]), r["errors"]
    assert r["counts"]["live_tensions"] == 1, r["counts"]


@case("off-schema key fails the gate (forged-clean prevention)")
def _():
    r, _p = run({"R5.yaml": """
        grill_questions:
          - question_id: R5-Q1
            cites: {source: s, quote: q}
            question: which method?
            human_response: {text: yes}
    """})
    assert r["ok"] is False
    assert any("off-schema" in e and "grill_questions" in e for e in r["errors"]), r["errors"]


@case("--out writes the write-gate verdict YAML matching stdout (#466 Batch C)")
def _():
    r, out_path = run({"R6.yaml": """
        decision_questions:
          - question_id: R6-Q1
            cites: {source: s, quote: q}
            question: which method?
    """}, out_name="write-gate.yaml")
    assert os.path.isfile(out_path), "--out file was not written"
    with open(out_path, encoding="utf-8") as fh:
        gate = yaml.safe_load(fh)
    assert gate == r, (gate, r)
    assert gate["ok"] is False
    assert gate["counts"]["decision_questions_open"] == 1, gate["counts"]


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
