# arch — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **architecture lens** as a grounding doc (`architecture.md`): the shape of
the software that delivers it. The slice is the unit of realization; a slice has no ICE of its
own — its **hub** is the union of its functionalities' grounding docs (`functionality.md`, which
may span several capabilities) plus the product profile (read from the spine). The lens is the
components the slice threads (each in its layer, with its contract), the stack (tech + versions)
behind them, and the vertical build that runs the slice end-to-end through them. Every component
is SELECTED, not invented — a system one of the slice's functionalities talks to, or a surface
the profile exposes; every stack pick is sized by the profile box and grounded in a KB learning
or a recorded proposal; every functionality threads through at least one component, because the
build is one vertical, end-to-end. It writes only this slice's `architecture.md` (and any
material-choice decision) — never the spine, the slice record, the profile, another lens, or
another slice. One slice per run; one human checkpoint before anything persists. The lens is
gated by the structural linter (shape) and the content-quality eval (a judge).

Pipeline position: **start**. /arch is the START of the NON-FUNCTIONAL realize pipe (arch →
quality → run): the D2 rule prepends `start-change` — resolve or create the slice-realize issue,
cut the branch off fresh main, optional worktree, init STM — so /quality and /run run on this
already-started branch. No close sequence is injected here; the non-functional pipe closes at
/run. It writes the persistent product model (the slice's architecture lens) on the started
branch. It reads the hub (the slice's functionalities' grounding + the profile) and MAY read the
already-merged functional lens docs (ux/agentic/marketing), never the measure or run lens. (#437,
decision 24; 3-pipe realize 2026-06-26)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, and
  the product profile is firmed (`set`). If not, halt — /arch realizes a shaped slice; it does
  not shape one.
- C2 — Writes only this slice's `architecture.md` (and any decision), in the slice's lens folder.
  Never the spine, the slice record, the profile, another lens, the node tree, personas,
  journeys, or other slices.
- C3 — Shape: `architecture.md` conforms to the Architecture lens template — the sections Intent,
  Components (each in its layer, with its contract), Stack (component / technology / version), and
  Vertical build — and the structural linter passes. No screens, gates, metrics, or environments.
- C4 — Content quality: `architecture.md` clears the content-quality eval, not just the linter —
  each section is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every component traces to a system one of the slice's
  functionalities talks to or a surface the profile exposes; the stack traces to a KB learning or
  a decision. (Tracked in the grounding manifest.)
- C6 — Coverage: every functionality the slice bundles threads through at least one component, so
  the build is one vertical end-to-end. Nothing shaped is left unbuilt.
- C7 — Reads the hub (+ optionally the functional lens trinity): /arch derives from the slice's
  functionalities' grounding docs and the profile box, and MAY read the ux/agentic/marketing
  lenses — never the measure or run lens.
- C8 — The stack is a material choice recorded as a slice-level decision the whole product
  references; it is sized by the profile box, not invented per slice.
- C9 — Additive and non-destructive: the run changes only this slice's `architecture.md` (and any
  new decision); the spine, the slice record, the profile, the other lenses, and the other slices
  are byte-unchanged. Re-running re-derives the lens; accepted decisions are superseded, never
  edited in place.
- C10 — Architecture choices are KB-grounded: the stack and the system-level shape trace to a
  best-fit learning on the KB's architecture/technology shelf (matched via kb-search) or to a
  recorded KB-learning-gap proposal — never the model's taste.
- C11 — Exactly one human checkpoint, presenting the proposed components (with contracts), the
  stack, and the vertical build, plus any decision, before anything is written. Nothing persists
  before approval.

### Failure conditions

- F1 — /arch ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, or the profile is not firmed.
- F2 — A write touched something other than this slice's `architecture.md` or a decision (the
  spine, the slice record, the profile, another lens, structure, a persona, a journey, or another
  slice).
- F3 — `architecture.md` fails its template/shape (a missing or extra section, an empty or
  telegraphic section), or carries content outside components/stack/vertical build.
- F4 — `architecture.md` fails the content-quality eval.
- F5 — A component or stack pick is invented — a component that is no functionality's system and
  no profile surface, or a stack with no recorded decision.
- F6 — A functionality of the slice threads through no component — the vertical is not end-to-end.
- F7 — /arch read or depended on the measure or run lens.
- F8 — The stack was set with no decision recorded.
- F9 — A product-model file other than this slice's `architecture.md` or a new decision changed,
  or an accepted decision was edited in place rather than superseded.
- F10 — An architecture choice rests on neither a matched KB learning nor a recorded proposal.
- F11 — The lens was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (architect, first run) Given a shaped slice whose functionalities resolve and a firmed
  profile, when /arch runs and the checkpoint is approved, then `architecture.md` is written as
  components, stack, and the vertical build — passing the linter and the content eval — and
  nothing else changes. Measure: `slices/{slice}/lens/architecture.md` exists and is a valid
  Architecture Lens doc; the content-eval gate passes; the spine, slice record, profile, and
  other lenses are byte-identical.
- S2 — (build lead, end-to-end) Given the components are drafted, every functionality of the slice
  threads through at least one component. Measure: every functionality the slice bundles maps to
  ≥1 component in the manifest; none unbuilt.
- S3 — (architect, grounded) Given the lens is drafted, each component traces to a functionality's
  system or a profile surface, and the stack to a recorded decision. Measure: the manifest names a
  real source for every component; the stack names a decision that resolves.
- S4 — (reviewer, foundation discipline) Given /arch runs, it read no measure or run lens and
  wrote none. Measure: the measure and run lenses of the slice are untouched; no component grounds
  on them.
- S5 — (architect, re-run) Given /arch already ran, when it runs again, it re-derives
  `architecture.md` and changes nothing else; the stack decision is reused, any new decision
  supersedes. Measure: only the slice's `architecture.md` (and possibly a new decision) differ;
  the spine, slice record, other lenses, and profile are byte-identical; no accepted decision
  edited in place.
- S6 — (reviewer, the checkpoint) Given the components are ready, the checkpoint presents the
  components (with contracts), the stack, and the vertical build, plus the decision, before any
  write. Measure: the checkpoint shows the lens inline; no product-model file is written before
  approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is
  not firmed. direction: halt and route to /shape (shape the slice) or /understand (detail + firm)
  before /arch runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `architecture.md` or a
  decision. direction: revert the out-of-scope write; /arch writes only the slice's
  `architecture.md` (and the stack decision). handoff: autonomous.
- REC3 (F3) — trigger: `architecture.md` fails the template/shape or carries out-of-scope content.
  direction: re-emit the doc to the Architecture lens template — Intent/Components/Stack/Vertical
  build only. handoff: autonomous.
- REC4 (F4) — trigger: `architecture.md` fails the content-quality eval. direction: rewrite the
  failing section to the judge's cited fixes and re-judge until the gate passes. handoff:
  autonomous.
- REC5 (F5) — trigger: an invented/ungrounded component or stack pick. direction: drop it, or
  re-tie the component to a functionality's system or a profile surface, and tie the stack to a
  decision. handoff: autonomous.
- REC6 (F6) — trigger: a functionality threads through no component. direction: add the
  component(s) that build the missing functionality, so the vertical is end-to-end. handoff:
  autonomous.
- REC7 (F7) — trigger: /arch read or depended on the measure or run lens. direction: remove the
  dependency; /arch derives from the hub and may read only the functional lenses. handoff:
  autonomous.
- REC8 (F8) — trigger: the stack was set with no decision. direction: record the slice-level stack
  decision before persisting; reuse the product decision if one exists. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `architecture.md` (and the new decision),
  after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: an architecture choice with no KB learning and no recorded proposal.
  direction: search the KB via kb-search for the best-fit learning and ground the choice, or raise
  a KB-learning-gap proposal; never keep a taste-only choice. handoff: autonomous.
- REC11 (F11) — trigger: the lens was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after approval. handoff:
  human.
