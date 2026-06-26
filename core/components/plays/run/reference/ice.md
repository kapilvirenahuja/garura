# run — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **run lens** as a grounding doc (`run.md`): how the slice ships and operates.
The slice is the unit of realization; a slice has no ICE of its own — its **hub** is the union of
its functionalities' grounding docs (`functionality.md`, which may span several capabilities) plus
the product profile (read from the spine). The run lens is five things and only five:
**environments** (where it runs and what each needs), **rollout** (how it goes live and rolls back),
**migrations** (data/schema moves, or "none" with the reason), **config & secrets** (what it needs
and how secrets are handled, or "none — no credentials" with the reason), and **CI/CD** (how it is
built, tested, shipped, and what the build gates on). The run plan flows from what the slice does
(the hub) and how it is built — so /run also reads the slice's **architecture lens** (its components
and stack), and only the architecture lens among the realize lenses. Every operational choice is
grounded, never invented; any material choice is recorded as a decision. It writes only this slice's
`run.md` (and any decision) — never the spine, the slice record, the profile, another lens, or
another slice. Critically, /run does NOT stamp the slice `realized` — that belongs to /measure (the
deliver pipe, which runs last). One slice per run; one human checkpoint before anything persists. The
lens is gated by the structural linter (shape) and the content-quality eval (a judge).

Pipeline position: **end**. /run is the END of the NON-FUNCTIONAL realize pipe (architecture →
quality → run): it expects to run on the branch /arch already started, injects no `start-change`
head, and injects the close sequence (commit-change → propose-change → review-change → merge-change)
that commits the non-functional pipe's lenses, opens the PR, takes the verdict, and merges to main.
It writes the persistent product model directly (the slice's run lens), on the already-started
branch, and reads the hub + the architecture lens — never another lens, and it never stamps the slice
realized. (#437; 3-pipe realize 2026-06-25)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves through the spine to a `functionality.md` grounding doc, the
  product profile is firmed (`set`), and the slice's `architecture.md` lens exists. If not, halt —
  /run realizes a shaped, architected slice; it does not shape or architect one.
- C2 — Writes only this slice's `run.md` (and any decision), in the slice's lens folder. Never the
  spine, the slice record, the profile, another lens, the node tree, personas, journeys, or other
  slices.
- C3 — Shape: `run.md` conforms to the Run lens template — the sections Environments / Rollout /
  Migrations / Config & secrets / CI/CD — and the structural linter passes. No content outside those
  five sections.
- C4 — Content quality: `run.md` clears the content-quality eval, not just the linter — each section
  is self-explaining and the doc passes the stranger test.
- C5 — Grounded, not invented: every operational choice traces to the hub (a functionality), the
  profile, or the architecture lens; any material choice is recorded as a decision. (Tracked in the
  manifest.)
- C6 — Coverage: every functionality the slice bundles is considered by the run plan — nothing shaped
  is left unaccounted for in how the slice ships.
- C7 — Reads the hub + the architecture lens only: /run derives from the slice's functionalities'
  grounding docs, the profile, and `architecture.md` — never from another realize lens
  (ux/agentic/quality/measure/marketing).
- C8 — Never stamps realized: /run authors its run lens and closes the non-functional pipe; it never
  writes the slice's `status: realized` — that is /measure's job (the deliver pipe, last).
- C9 — Additive and non-destructive: the run changes only this slice's `run.md` (and any new
  decision); the spine, the slice record, the profile, the other lenses, and the other slices are
  byte-unchanged. Re-running re-derives the lens; accepted decisions are superseded, never edited in
  place.
- C10 — Exactly one human checkpoint, presenting the five run sections plus any decision, before
  anything is written. Nothing persists before approval.

### Failure conditions

- F1 — /run ran on an unready slice — the slice is absent, a functionality does not resolve to a
  grounding doc, the profile is not firmed, or the architecture lens is missing.
- F2 — A write touched something other than this slice's `run.md` or a decision (the spine, the slice
  record, the profile, another lens, structure, a persona, a journey, or another slice).
- F3 — `run.md` fails its template/shape (a missing or extra section, an empty or telegraphic
  section), or carries content outside the five run sections.
- F4 — `run.md` fails the content-quality eval.
- F5 — An operational choice is invented — with no hub, profile, or architecture source behind it —
  or a material choice with no recorded decision.
- F6 — A functionality of the slice is left unaccounted for in the run plan.
- F7 — /run read or depended on a realize lens other than architecture.
- F8 — /run stamped the slice `realized` (or otherwise wrote the slice's status) — that belongs to
  /measure.
- F9 — A product-model file other than this slice's `run.md` or a new decision changed, or an accepted
  decision was edited in place rather than superseded.
- F10 — The lens was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (devops engineer, first run) Given a shaped, architected slice whose functionalities resolve
  and a firmed profile, when /run runs and the checkpoint is approved, then `run.md` is written as the
  five run sections — passing the linter and the content eval — and nothing else changes. Measure:
  `slices/{slice}/lens/run.md` exists and is a valid Run Lens doc; the content-eval gate passes; the
  spine, slice record, profile, and other lenses are byte-identical.
- S2 — (architect, grounded run) Given the lens is drafted, every operational choice traces to the
  hub, the profile, or the architecture lens, and any material choice to a recorded decision. Measure:
  the manifest names a real source for every choice; material choices name a decision that resolves.
- S3 — (reviewer, architecture-driven) Given /run runs, it read the architecture lens and no other
  realize lens, and the run plan flows from the architecture's stack and components. Measure: the run
  grounds include the architecture lens; no other lens is read or grounded on.
- S4 — (release manager, no premature realize) Given /run completes, the slice's `status` is unchanged
  — /run never stamps `realized`. Measure: the slice record's `status` (and the spine slice entry's
  status) is byte-identical before and after /run.
- S5 — (product owner, re-run) Given /run already ran, when it runs again, it re-derives `run.md` and
  changes nothing else; any new decision supersedes, none edited in place. Measure: only the slice's
  `run.md` (and possibly a new decision) differ; the spine, slice record, other lenses, and profile
  are byte-identical.
- S6 — (reviewer, the checkpoint) Given the lens is ready, the checkpoint presents the five run
  sections, plus any decision, before any write. Measure: the checkpoint shows the lens inline; no
  product-model file is written before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, the profile is not
  firmed, or the architecture lens is missing. direction: halt and route to /shape, /understand, or
  /arch before /run runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's `run.md` or a decision. direction:
  revert the out-of-scope write; /run writes only the slice's `run.md` (and any decision). handoff:
  autonomous.
- REC3 (F3) — trigger: `run.md` fails the template/shape or carries out-of-scope content. direction:
  re-emit the doc to the Run lens template — the five run sections only. handoff: autonomous.
- REC4 (F4) — trigger: `run.md` fails the content-quality eval. direction: rewrite the failing section
  to the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: an invented operational choice, or a material choice with no decision. direction:
  re-tie each choice to the hub, the profile, or the architecture, and record the material decision.
  handoff: autonomous.
- REC6 (F6) — trigger: a functionality was left unaccounted for. direction: extend the run plan to
  account for the missing functionality. handoff: autonomous.
- REC7 (F7) — trigger: /run read or depended on a lens other than architecture. direction: remove the
  dependency; /run reads only the hub + the architecture lens. handoff: autonomous.
- REC8 (F8) — trigger: /run stamped the slice realized or wrote its status. direction: revert the
  status write; the `realized` stamp belongs to /measure. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only the `run.md` (and the new decision), after a human
  confirms the restore. handoff: human.
- REC10 (F10) — trigger: the lens was persisted before the checkpoint was approved. direction: revert
  the premature write and re-present the checkpoint; persist only after approval. handoff: human.
