# quality — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you
actually deliver — write its quality lens: the list of gates the slice must pass. The slice
is the unit of realization: you pick a slice and run quality → ux → agentic → arch → run on
it, then ship it. A slice has no ICE of its own — its hub is the union of its
functionalities' ICE (which may span several capabilities) plus the product profile. Every
gate is drawn from a profile target that applies to this slice, or from one of the slice's
functionalities' own ICE constraints/failures made checkable — never invented. /quality is
the **first** lens in the realize sequence (quality → ux → agentic → arch → run); it reads
only the slice's hub, never the other lenses, and sets the quality bar the later lenses size
their depth against. It writes only the quality lens (and a slice-level decision for any
material choice) — never the slice record, the functionalities' ICE, the profile, another
lens, structure, status, personas, or journeys. One slice per run; one human checkpoint
before anything persists.

Pipeline position: **start**. /quality OPENS the slice pipeline (quality → ux → agentic → arch → run → grill) and selects the slice: the D2 rule prepends `start-change` — resolve or create the slice-realization issue, cut the branch off fresh main, optional worktree, init STM — so the later lenses and /grill run on this already-started branch. No close sequence here; the slice change closes at /grill. It runs after /shape, since a slice must be shaped before it is realized. It writes the persistent product model directly, on the started branch. (#437)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves to a rich ICE, and the product profile is firmed (`set`).
  If not, halt — /quality realizes a shaped slice; it does not shape one.
- C2 — Writes only this slice's quality lens (and any decision), in the slice's lens folder.
  Never the slice record, the functionalities' ICE, the profile, another lens
  (ux/agentic/architecture/run), node structure or status, personas, or journeys.
- C3 — Gates only, per the quality lens schema: `content.gates` is a list of pass/fail
  checks. No how-to-test, no coverage, no environments — that is the builder's and
  /validate's job, not this lens.
- C4 — Every gate is grounded — it traces to a profile target that applies to this slice, or
  to one of the slice's functionalities' ICE constraints/failures made checkable. No invented
  gate.
- C5 — Every gate is concrete and checkable: a clear pass/fail, with a value or threshold
  where the dimension has one (e.g. "p99 < 150ms"), not a vague adjective.
- C6 — First in the sequence: /quality derives only from the slice's hub (its functionalities'
  ICE + the profile), never from the other four lenses. It sets the bar they read.
- C7 — A material gate choice not mechanically fixed by the box (e.g. picking a specific
  security level the box left as a range) is recorded as a slice-level decision (ADR).
- C8 — Additive and non-destructive: the run changes only the quality lens (and any new
  decision); every other product-model file — the slice record, the ICE, the profile, the
  other lenses — is byte-unchanged. Re-running re-derives the quality lens against the current
  hub; accepted decisions are superseded by new records, never edited in place.
- C9 — Schema conformance: the quality lens and any decision validate against their v1 schemas
  (lens v1, decision v1).
- C10 — Exactly one human checkpoint, presenting the proposed gates and any decisions, before
  anything is written. Nothing persists before approval.

### Failure conditions

- F1 — /quality ran on an unready slice — the slice is absent, a functionality's ICE does not
  resolve or is not rich, or the profile is not firmed.
- F2 — A write touched something other than this slice's quality lens or a decision (the slice
  record, a functionality's ICE, the profile, another lens, structure, status, a persona, or a
  journey).
- F3 — The quality lens carries more than gates (how-to-test, coverage, environments), or is
  not the gates-only shape the schema requires.
- F4 — A gate is invented — it traces to neither a profile target nor a functionality's ICE
  constraint/failure.
- F5 — A gate is vague or uncheckable — no clear pass/fail, or no value where the dimension
  needs one.
- F6 — /quality read or depended on another lens (ux/agentic/architecture/run).
- F7 — A material gate choice was made with no decision recorded.
- F8 — A product-model file other than the quality lens or a new decision changed, or an
  accepted decision was edited in place rather than superseded.
- F9 — The quality lens or a decision violates its v1 schema.
- F10 — Gates were persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (quality lead, first run) Given a shaped slice whose functionalities have rich ICE and
  a firmed profile, when /quality runs and the checkpoint is approved, then the quality lens
  is written as a grounded, checkable list of gates and nothing else changes. Measure:
  `slices/{slice}/lens/quality.yaml` exists with `type: quality`, a `slice_ref`, and a
  non-empty `content.gates` list; every other product-model file is byte-identical before and
  after; the lens validates against lens v1.
- S2 — (security engineer, grounded) Given the gates are drafted, when inspected, then each
  one traces back to a profile target or a functionality's ICE rule. Measure: the run's
  grounding map names, for every gate, either the profile target or the ICE constraint/failure
  it came from; no gate is left ungrounded.
- S3 — (QA engineer, checkable) Given the gates, when read, then each is a clear pass/fail with
  a value where the target has one. Measure: no gate is a bare adjective; each gate states a
  checkable condition, with a threshold where applicable.
- S4 — (architect, it's first) Given /quality runs, when the model is checked, then it read no
  other lens and wrote none. Measure: no ux/agentic/architecture/run lens of the slice is
  touched; only this slice's `quality.yaml` (and any decision) is in the written set; no gate's
  grounding source is another lens.
- S5 — (product owner, re-run) Given /quality already ran on the slice, when it runs again,
  then it re-derives the quality lens and changes nothing else; existing decisions are
  superseded, not edited. Measure: only the slice's `quality.yaml` (and possibly a new
  decision) differ; the slice record, the other lenses, the ICE, and the profile are
  byte-identical; no accepted decision file is edited in place.
- S6 — (reviewer, the checkpoint) Given the gates are ready, when the checkpoint is shown, then
  it lists the proposed gates and any decisions, before any write. Measure: the checkpoint
  shows the gates and decisions inline; no product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality's ICE does not resolve or is not
  rich, or the profile is not firmed. direction: halt and route to /shape (to shape the slice)
  or /understand (to enrich + firm) before /quality runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's quality lens or a
  decision. direction: revert the out-of-scope write; /quality writes only the slice's quality
  lens (and decisions). handoff: autonomous.
- REC3 (F3) — trigger: the lens carries non-gate content or the wrong shape. direction: strip
  it back to the gates-only shape the schema requires. handoff: autonomous.
- REC4 (F4) — trigger: an invented/ungrounded gate. direction: drop it, or re-tie it to a
  profile target or a functionality's ICE constraint/failure; never keep an invented gate.
  handoff: autonomous.
- REC5 (F5) — trigger: a vague or uncheckable gate. direction: rewrite it as a concrete
  pass/fail with a value where the dimension needs one. handoff: autonomous.
- REC6 (F6) — trigger: /quality read or depended on another lens. direction: remove the
  dependency; /quality derives only from the slice's hub (it is first). handoff: autonomous.
- REC7 (F7) — trigger: a material gate choice with no decision recorded. direction: record the
  slice-level decision for the choice before persisting. handoff: autonomous.
- REC8 (F8) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited
  in place. direction: restore it and re-apply only the quality lens (and the new decision),
  after a human confirms the restore. handoff: human.
- REC9 (F9) — trigger: the lens or a decision fails v1 schema validation. direction: re-emit
  the failing artifact to conform before the play completes. handoff: autonomous.
- REC10 (F10) — trigger: gates were persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after the human
  approves. handoff: human.
