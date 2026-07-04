# Stage 4 Design — Gates that learn (#467)

## The idea in one paragraph

Human gates stop being a fixed on/off config and become a **learned, per-project memory**.
Every time a conditional gate fires, the harness records one line: what shape the change
was, what it predicted the human would do, and what the human actually did. That stream is
a set of **live evals** — the human's real decisions grading the harness's predictions. A
deterministic learner distills them into a per-project **gate policy**: change shapes the
human has repeatedly waved through become auto; any rejection or edit re-teaches instantly.
The policy lives in garura's memory tree — this is the memory architecture doing the thing
it was built for: the project's trust surface, learned from evidence, readable as a file.

## Gate taxonomy (ruled 2026-07-04, session with Kapil)

| Kind | Gates | Behavior |
|---|---|---|
| **Pinned HITL** | grill (epic cut), launch (acceptance walk), learn (model updates) | Always human. Never learnable, never config-off. A wrong epic cut, an unsigned acceptance, or a wrong model learning poisons everything downstream. |
| **Conditional (learnable)** | vision, understand, shape, roadmap, ux, agentic, marketing, arch, quality, run, measure | Start fully gated. Auto-pass earned per change-shape per project via the live-eval loop. |
| **Off — machine checks carry it** | start-change, commit-change, propose-change, review-change, merge-change, validate, fix-bug, implement (spec approval), refactor | Gate removed; each play's loop gains the deterministic checks that made the human redundant (per play, below). |
| **Unruled** | deploy | Held as-is (one-way-door, on) until ruled. |

Hard blocks are not gates and never move: commit-change's sensitive-file block, every
stop-condition C0 bind, the loop iteration caps.

## Part 1 — The learning mechanism (the spine)

### 1.1 Change-shape classification (deterministic)

A shared script `classify_change.py` (bundled with each conditional play, canonical copy in
play-creator/references) reads the play's draft-vs-live-model diff and emits a **shape
vector** — counts on fixed axes, no inference:

- `nodes_added` / `nodes_removed` — spine entries created or deleted
- `status_changes` — any status field transition
- `profile_bars_changed` — NFR/compliance levels moved
- `decisions_added` — decision records appended
- `sections_rewritten` — grounding-doc sections with structural rewrites
- `prose_edits` — wording-only changes (diff hunks touching no structure)

The **shape key** is the tuple of axes that are non-zero (e.g. `prose_edits`,
`prose_edits+sections_rewritten`, `nodes_added+decisions_added`). Play id is part of the
key: `ux:prose_edits` learns separately from `vision:nodes_added`.

### 1.2 The live-eval ledger (memory, write path)

One JSONL line per conditional-gate crossing, appended to
`.garura/core/gate-evals.jsonl` (committed; append-only; ~200 bytes/line — no play
slowdown, no prose evidence files):

```json
{"ts":"...","play":"ux","issue":478,"shape":"prose_edits","predicted":"gate",
 "human":"approved_clean","policy_version":3}
```

`human` ∈ `approved_clean` (typed approval, no changes asked) · `approved_edited`
(approved after asking for changes) · `rejected`. When the gate auto-passes,
`predicted:"auto"` and `human:"auto_pass"` — and if the human later reverts/corrects that
artifact (detected at the next run on the same node, or reported via rejection on the
follow-up), a correction line is appended pointing at the auto_pass line it refutes.

### 1.3 The learner (deterministic, between runs)

`distill_gate_policy.py` runs at each conditional play's close (cheap: read JSONL, write
YAML). Rule, no inference:

- A shape key becomes **auto** when its last **N consecutive** entries are
  `approved_clean` (N configurable, default 3) AND it has no unresolved correction.
- Any `rejected`, `approved_edited`, or correction **resets that shape to gated** and its
  counter to zero.
- Output: `.garura/core/gate-policy.yaml` — human-readable, versioned, with provenance
  (which ledger lines earned each auto):

```yaml
version: 4
project: garura
auto:
  ux:prose_edits:        {earned_by: [12,15,18], since: 2026-07-10}
  quality:prose_edits:   {earned_by: [9,11,14],  since: 2026-07-12}
never_auto: []   # human-pinned shapes — the human can force any shape here permanently
```

`never_auto` is the human override lever: edit the file, shape stays gated forever.

### 1.4 Runtime application (in-loop, deterministic)

The conditional play's checkpoint step becomes three mechanical moves:
1. `classify_change.py` → shape key.
2. Policy lookup: shape in `auto` and not in `never_auto` → **auto-pass**: record the skip
   + the diff summary in the run record, append the ledger line, continue.
3. Otherwise → present the document to the human exactly as today; record their action to
   the ledger.

Safety rail: a draft carrying ANY blocking finding (lint gap, grounding-eval fail,
stop-condition risk) always gates, regardless of policy.

### 1.5 Where it lives (memory placement)

- Ledger + policy: `.garura/core/` (project-scoped memory, beside config.yaml — travels
  with the project, committed, per-project learning as required).
- The folder-structure whitelist (standards) gains these two files as permitted core/
  entries — one-line standards edit, recorded as a decision.
- KB (machine-global) gets nothing in Stage 4; cross-project distillation is a later idea,
  explicitly out of scope here.

## Part 2 — The gates that go: replacement checks per play

Each is an intent change (ICE edit + play-editor recompile). The gate is removed only in
the same change that adds its replacement checks to the loop/stop-condition.

| Play | Replacement machine checks promoted into the loop |
|---|---|
| start-change | duplicate-issue guard as a stop-condition clause; title-convention + description-completeness check in the issue path |
| commit-change | conditional checkpoint dropped; warnings surface in the delivery report instead; sensitive block unchanged (hard halt) |
| propose-change | self-review must parse to zero blocking items (script check, pre-raise); tree-clean + issue-ref checks promoted from evals to pre-raise checker |
| review-change | compute_verdict's recommendation becomes the verdict; posts as harness verdict citing every finding; P1 → reject stands as the outcome and blocks merge (review-pr.bypass unchanged) |
| merge-change | auto-merge when: review verdict approve + mergeable + no failing checks; one-way-door confirm removed |
| validate | plan-approval checkpoint removed — the check manifest is fully derived (stack detection + KB grounding); an ungroundable choice already halts as KB-gap, which stays |
| fix-bug | design checkpoint removed; RCA + design + regression-test-red are the machine preconditions (all exist as artifacts); TDD red-before-green stays the hard invariant |
| implement | spec approval unpinned and removed; build starts when the plan lints clean, every piece grounds into the box, and steelman evals exist; open_questions in the plan still halt (a question IS a human need) |
| refactor | plan checkpoint removed; behavior-pin (characterization tests green before AND after, no test weakened) is the machine precondition — already the play's core invariant |

Escape hatch on every one: the play halts to a human on any blocking state exactly as
today — removing the approval never removes the halt paths.

## Part 3 — Rollout (all on #467 through the change chain)

- **Batch A** — the spine: classify_change.py + ledger + distill_gate_policy.py +
  gate-config.md rule update (three gate kinds) + whitelist/standards edit + config schema
  (`gates.conditional`, N).
- **Batch B** — conditional wiring into the 11 document plays (one ICE edit each: the
  checkpoint step gains the classify→policy→auto/gate logic).
- **Batch C** — gates-off, pipeline chain: start-change, commit-change, propose-change,
  review-change, merge-change (+ their replacement checks).
- **Batch D** — gates-off, execute side: validate, fix-bug, implement, refactor.
- deploy untouched pending ruling. grill/launch/learn untouched by design.

Acceptance against #467 (reframed to the ruled direction):
- Gate-off decisions carried by in-loop deterministic checks (Batch C/D shipped)
- Conditional gates learning from live evals per project (Batches A/B shipped, ledger
  accumulating)
- Gates per slice measurably reduced (count before/after from the ledger itself)
- Zero missed-defect regressions traced to a removed gate (correction lines in the ledger
  are the tracer)
