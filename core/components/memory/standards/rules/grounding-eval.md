# Grounding Content-Quality Eval — v1

The linter (`lint_grounding.py`) proves a grounding doc has the right *shape*. This
eval proves the *content is actually understandable* — the judgment a script cannot
make. It is an **LLM-as-judge**: a second model reads the doc and scores it against
the bar in `standards/schemas/product-os/grounding/_content-standard.md`. The play
runs it after the linter passes; a fail sends the doc back to be rewritten against the
cited fixes, then re-judged.

This file is the single source for the rubric, the judge prompt, the verdict shape,
and the gate. Plays reference it; they do not restate it.

## What the judge scores (5 criteria)

Link integrity is NOT here — it is mechanical and the linter already does it; the
judge would only be a worse version. The judge scores meaning:

1. **completeness** — every required section is substantive, not a placeholder.
2. **self_explanation** — each item carries the *why* or the implication, not just
   the *what*. "Local fixtures only" fails; the version that says *why* passes.
3. **discreteness_form** — discrete points, not flowing story-prose; Agile forms
   where required (acceptance as Given/When/Then; a functionality states the
   function's behavior, never "as a user I want…").
4. **depth_gradient** — detail INCREASES from parent to child. Judged only when the
   parent doc is supplied (capability vs its domain, functionality vs its capability);
   `na` otherwise (a domain has no parent; an epic is a delivery overlay).
5. **stranger_test** — the overall gate: a cold reader with no prior context can
   explain the node's *what*, *why*, and *edges* from this doc alone.

## What the judge is given

Three things, and only these: the doc under test, its parent doc when depth_gradient
applies, and **the kind's per-section guidance** (the `## Per-section guidance` block
from that kind's template under `standards/schemas/product-os/grounding/`). The
guidance tells the judge what each section is *meant* to hold — so it judges a section
against its intended depth, not an invented one. Critically, the judge is NOT given the
template's gold example: handing it the answer turns judgment into pattern-matching.

Calibration finding (v1): without the section guidance, a skeptical judge over-penalizes
intentionally-brief sections — e.g. it demands a "why" on every functionality line when a
capability's Functionalities section is by design a brief linked index (detail lives in
the child docs), or it asks a functionality to be written as a user story when our rules
say a functionality is a function, not a story. The guidance closes that gap.

## The judge prompt (used verbatim by every mode)

> You are a skeptical reviewer grading ONE product-model grounding doc for whether a
> stranger could understand it. You see the doc (and its parent doc if provided) and the
> per-section guidance for this doc kind, which tells you what each section is meant to
> hold — judge each section against THAT, not against an expectation you invent. You do
> NOT see the brief that produced it or any author reasoning — if you find yourself
> filling in understanding the doc does not state, that is the doc failing, not you.
> Default every criterion to **fail** unless the doc clearly earns a pass.
>
> Score each criterion below for the doc. For each, return: the verdict
> (pass | fail | na), the exact text you judged (quote it), and — if not a pass — the
> concrete change that would make it pass. Be specific; "improve wording" is not a fix.
>
> Criteria (definitions above): completeness, self_explanation, discreteness_form,
> depth_gradient (na unless a parent doc is given), stranger_test.
>
> Return ONLY a JSON object in the verdict shape. No prose outside the JSON.

## Verdict shape (the judge MUST return exactly this)

```json
{
  "doc": "<path>",
  "kind": "domain|capability|functionality|epic",
  "criteria": [
    {"id": "completeness",      "verdict": "pass|fail|na", "evidence": "<quote>", "fix": "<concrete fix or empty>"},
    {"id": "self_explanation",  "verdict": "pass|fail|na", "evidence": "<quote>", "fix": ""},
    {"id": "discreteness_form", "verdict": "pass|fail|na", "evidence": "<quote>", "fix": ""},
    {"id": "depth_gradient",    "verdict": "pass|fail|na", "evidence": "<quote>", "fix": ""},
    {"id": "stranger_test",     "verdict": "pass|fail|na", "evidence": "<quote>", "fix": ""}
  ]
}
```

The judge does NOT decide overall pass/fail — it only scores and evidences. The
**gate** decides, deterministically, so the judge cannot wave a doc through with a
self-declared "overall: pass". (`grounding_gate.py`.)

## The gate rule

`grounding_gate.py` reads the verdict and applies **all-pass**: the doc passes iff
every one of the five criteria is `pass` or `na`. Any `fail` rejects the doc, and the
gate prints each failing criterion with its evidence and fix for the rewrite loop. A
verdict missing any of the five criteria fails closed (a judge that drops a criterion
is not trusted).

## The two judge modes (config: `grounding-eval.judge.mode`)

The rubric, prompt, verdict, and gate are identical across modes — only WHO runs the
judge changes. Stronger isolation = less chance of context bleed or reward hacking.

- **`subagent`** — an in-harness sub-agent spawned with a CLEAN context: it receives
  only the judge prompt + the doc (+ parent), never the play's context, the brief, or
  the author's reasoning. The orchestrator spawns it; it returns the verdict JSON.
- **`external`** — a different model or harness entirely:
  - `external.kind: model` — a sub-agent forced onto a DIFFERENT model (e.g. Claude
    Haiku via the sub-agent's model override). Different weights judging the output.
  - `external.kind: codex` — the codex-cli grader, run in its approved dir
    (`external.codex.dir`) via `run_codex_judge.py`. A separate process and model —
    the strongest isolation.

In every mode the judge is handed the same prompt and doc, and returns the same
verdict JSON, which the same gate scores. The mode is purely a dial on isolation.

## Calibration (how we trust the eval itself)

An untested judge lies. Before the eval gates any real play, it must separate known
answers: run it on the gold grounding docs (must pass) and the deliberately thin docs
(must fail). If it passes a thin doc, the prompt is too lenient — tighten and re-run.
This is the same known-good-passes / known-bad-fails loop the linter was proven with.
