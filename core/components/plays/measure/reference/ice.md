# measure — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** whose hub is ready, write its **measure lens** as the grounding doc
`measure.md` — the delivery-measurement focus, the metrics that prove it (each a baseline, a target,
and a proof; triangle-primary on speed/tokens/cognition), and what is deliberately out of scope —
then run the **lines-up gate** and, only when the slice lines up, **stamp it realized**. A slice's
hub is the union of its functionalities' grounding docs (`functionality.md`, which may span several
capabilities) plus the product profile, both read from the spine. /measure is the **deliver** lens —
the last of the three realize pipes. It grounds every metric in what the slice actually delivers, and
it is the play that flips a slice to `realized`: when all seven lens docs are present (quality, ux,
agentic, marketing, architecture, run, measure), it stamps the slice's `status` to `realized` on the
spine — the single marker /grill checks before cutting delivery work. One slice per run; one human
checkpoint approves the lens and the stamp before anything is COMMITTED.

Pipeline position: **both**. /measure is the DELIVER pipe — a single-play pipe that runs last (after
the functional and non-functional pipes have merged). It injects `start-change` (opens the deliver
issue, cuts a fresh branch off main, inits STM) and, after the lens is persisted, the stamp is made,
and both are verified, injects the close sequence `commit-change → propose-change → review-change →
merge-change`, merging the realized slice to main. (#437; 3-pipe realize 2026-06-26)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
(author-measure-lens) writes ONLY the per-node grounding doc (the slice's `lens/measure.md`) straight
to the live model; every shared-file mutation — the new decision records under the slice's
`decisions/`, and the ONE spine field the run may set (this slice's `status` → `realized`, gated by
lines-up) — is done by the deterministic keyed persist script (`persist_measure.py`), in place, keyed
to the slice so it cannot touch another slice, another field, another spine collection, or edit an
accepted decision. There is no `draft/` model copy and no apply/promote step: the model tree is
asserted clean at entry, the run writes the full delta to the live model — including the realized
stamp, so the change-shape and the human both see it — a post-write scoped guard confirms containment,
and the play commits its own `feat(model)` delta before the injected close sequence runs, so the
working-tree diff vs the branch base is exactly this run's delta. Review is the branch git diff and the
pipeline's end PR.

### Constraints

- C1 — Operates on ONE ready slice per run: the profile is `set` (from the spine), the slice resolves,
  and every `functionality_ref` resolves through the spine to its `functionality.md` grounding doc
  (the hub). If the slice is absent, a functionality does not resolve, or the profile is not firmed,
  halt — /measure measures a shaped, detailed slice; it never seeds or details one.
- C2 — Writes only this slice's `measure.md` (the re-derive) and any material decision; and, when the
  lines-up gate passes, the ONE spine field — this slice's `status` → `realized`. It never writes
  another lens, another slice, the profile, the hub, or any other field of the spine.
- C3 — `measure.md` conforms to the Measure lens template (Focus / Metrics / Out of scope) — no
  missing, extra, or empty section. The shape linter passes.
- C4 — Content quality: `measure.md` clears the content-quality eval — every item self-explaining,
  the doc passing the stranger test — not just the linter.
- C5 — Metrics are concrete and grounded: each carries a baseline, a target, and a proof (triangle-
  primary on speed/tokens/cognition where it applies), and ties to a functionality's acceptance or a
  profile outcome. No vague claim, no metric that cannot be proven.
- C6 — Coverage: every functionality the slice bundles is considered — measured by a metric or named
  in `out of scope` with a reason. Nothing the slice delivers is silently unmeasured.
- C7 — Hub-anchored: the metrics tie to the slice's functionalities and the profile, never to another
  realize lens.
- C8 — The lines-up gate: the slice is stamped `realized` ONLY when all seven lens docs exist for it
  (quality, ux, agentic, marketing, architecture, run, measure). A missing lens means a pipe has not
  run; the slice is left un-realized and the missing lens is reported.
- C9 — The realized stamp is surgical, enforced by the keyed persist script BY CONSTRUCTION:
  `persist_measure.py` is the ONLY writer of the shared files (the spine `_spine.yaml` and the slice's
  `decisions/` records), and when the lines-up gate passes it sets exactly this slice's `status` to
  `realized` in the spine `slices` index — changing no other slice, no other field of this slice's
  entry, and no other spine collection. This is the node-level containment the file-level scoped guard
  cannot provide.
- C10 — Non-destructive: a re-run re-derives only `measure.md`; an accepted decision is never edited
  in place; the only spine change the run may make is the realized stamp.
- C11 — Exactly one human checkpoint, presenting the measure lens and the realized stamp it made (or
  the missing lenses if it could not). The checkpoint is a **conditional gate** (#467;
  `gate-config.md` three kinds — /measure is one of the eleven conditional document plays); the agent
  never skips it on its own judgment. Resolution order: pinned (n/a here) → `gates.plays.measure`
  override → the learned policy (classify the working-tree change shape — the model tree's diff vs
  HEAD — with the bundled `classify_change.py` (`--product-base`/`--base-ref HEAD`); a shape in
  `gate-policy.yaml`'s `auto:` and not in `never_auto:`, with NO blocking finding — lint gap or
  content-eval fail — auto-passes with the skip and the diff summary recorded) → `gates.classes.standard`
  → `gates.default`. EVERY crossing appends one live-eval line via the bundled `gate_eval.py` (shape,
  predicted gate|auto, the human's real action approved_clean|approved_edited|rejected, or auto_pass).
  Write-then-review (ADR 026): the run writes the FULL delta to the live model FIRST — the lens doc by
  the authoring skill, then the decisions and the lines-up-gated realized stamp by the keyed persist —
  so the checkpoint presents the real model git diff over the full written delta and the change-shape
  is classified over it; nothing is COMMITTED before the gate resolves: a typed approval, a recorded
  config skip, OR a recorded policy auto-pass. On cancel the whole delta is reverted
  (`scoped_write_guard.py --restore` with an empty allow set), so nothing the run wrote becomes
  durable. At close the play refreshes the learned policy with the bundled `distill_gate_policy.py`
  (config `gates.conditional`: streak/ledger/policy paths).
- C12 — Measurement frames are KB-grounded: the metric frame choices (the triangle and any industry
  translation) trace to a KB learning or a recorded KB-node proposal — never invented.
- C13 — The play ends by proving its Done means at close (gated, #464): the keyed persist record
  (`persist-manifest.json`) exists with its MACHINE `applied` field true, the scoped-write guard report
  (`guard-report.json`) reads `ok: true` (the allowlist held), AND the realized-stamp question is
  explicitly resolved — the keyed persist always writes a stamp record (`stamp-record.json` —
  `{stamp_resolved: true, stamped: <bool>}`); stamped-on-lines-up and
  not-stamped-with-the-missing-lenses-recorded BOTH count as done. A close whose Done means does not
  hold reads HALTED, never COMPLETED.
- C14 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean at entry
  (pre-flight halts on a dirty model tree, so the injected `start-change` cuts a fresh branch off main
  against a clean base and the branch base is a correct reference for the guard and the diff). After
  the approved checkpoint the play commits its own model delta on the branch (`feat(model): … (#<issue>)`),
  scoped to the product-os paths it wrote, BEFORE the injected close sequence runs — the subsequent
  `commit-change` then handles only what remains uncommitted (STM evidence, ADRs), not the model delta
  this play already committed. On cancel the tree was already reverted (C11), so nothing is committed.

### Failure conditions

- F1 — The slice is absent, a functionality does not resolve, or the profile is not firmed when
  /measure runs.
- F2 — A write touched something beyond this slice's `measure.md`, a decision, or the one realized
  status field on the spine.
- F3 — `measure.md` fails the template/shape (a missing, extra, or empty section).
- F4 — `measure.md` fails the content-quality eval.
- F5 — A metric lacks a baseline, a target, or a proof, or grounds in nothing the slice delivers.
- F6 — A functionality the slice bundles is neither measured nor named out of scope.
- F7 — The measure assessment read or grounded on another realize lens.
- F8 — The slice was stamped `realized` when a lens doc was missing (the lines-up gate did not pass).
- F9 — The keyed persist changed more than this slice's `status` field on the spine (another slice,
  another field of this slice's entry, or another spine collection was mutated in a shared file).
- F10 — A model path outside the run's declared write scope changed (the scoped-write guard reports a
  violation), or an accepted decision file was modified rather than added.
- F11 — A model delta was COMMITTED before the checkpoint gate resolved — no typed approval, no
  recorded config skip, and no recorded policy auto-pass.
- F12 — A measurement frame choice with no KB learning and no recorded proposal.
- F13 — The run closed COMPLETED without the Done means held — a missing persist record, a persist
  whose machine `applied` field is not true, a scoped-write guard report that is not captured or does
  not read `ok`, or the realized-stamp question left unresolved (no stamp record naming either outcome).
- F14 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired for a shape
  the policy does not list as auto (or that carried a blocking finding).
- F15 — The play ran against a dirty product-os tree (uncommitted model edits present at entry), so
  the branch base could not be trusted to reflect only this run's delta.

## Expectation

### Success scenarios

- S1 — (delivery analyst, first run) Given a ready slice, when /measure runs and the checkpoint is
  approved, then `measure.md` is a valid Measure lens doc (Focus / Metrics / Out of scope) clearing
  the linter and the content eval, grounded in the hub. Measure: the lens exists and passes both
  guards; every metric has a baseline, target, and proof.
- S2 — (delivery owner, the realized stamp) Given the slice already carries the other six lens docs,
  when /measure persists its lens and the lines-up gate passes, then the slice is stamped `realized`
  on the spine. Measure: the spine slice's `status` is `realized`, and that is the only spine change.
- S3 — (reviewer, not-yet-lined-up) Given a lens doc is missing, when /measure runs, then it writes
  its `measure.md` but does NOT stamp the slice — it reports the missing lens and leaves the status
  unchanged. Measure: the spine is byte-identical except for nothing (no stamp); the missing lens is
  named.
- S4 — (architect, hub-only) Given the lens is authored, when its grounding is inspected, then every
  metric ties to a functionality or a profile outcome and to no other lens. Measure: the manifest
  grounds carry only functionality/profile sources.
- S5 — (delivery owner, re-run) Given the slice is already realized, when /measure runs again, then it
  re-derives only `measure.md` and re-affirms the stamp; everything else is byte-identical and no
  accepted decision is edited in place.
- S6 — (reviewer, the checkpoint) Given the lens and the stamp are written in place, when the
  checkpoint is presented, then it shows the lens inline and the realized stamp it made (or the missing
  lenses), rendered over the real model git diff, and no product-model file is COMMITTED before
  approval — on cancel the working tree returns byte-clean to the branch base
  (`scoped_write_guard.py --restore`) — or, on the auto-pass path, the change's shape is policy-listed
  and the recorded auto-pass, the ledger line, and the diff summary stand in for the wait (nothing
  COMMITTED before the gate resolved).

### Done means

Paths are relative to the run's working root (`{stm_base}_realize/measure/`). These are STM,
non-model artifacts (ADR 008/017) — the model itself is written IN PLACE under
`<product_base>product-os/`, never into the working root. `persist-manifest.json` is the record the
keyed persist script (`persist_measure.py`) writes after the approved checkpoint — its `applied`
field is the machine proof the approved lens's shared-file deltas (the decisions and the lines-up-gated
realized stamp) were applied to the live model. `guard-report.json` is the captured
`scoped_write_guard.py` output — its `ok` field is the mechanical proof that no model path changed
outside the run's declared write scope (the allowlist held). `stamp-record.json` is written by the
keyed persist EVERY run: `{stamp_resolved: true, stamped: true}` when the lines-up gate passed and the
slice was stamped realized, or `{stamp_resolved: true, stamped: false, missing: [...]}` when a lens
doc was missing and the stamp was explicitly skipped with the reason recorded — both outcomes count
as done.

- D1 — says: "the keyed persist record exists"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the approved lens deltas were applied — machine-recorded"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the run's write scope"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }
- D4 — says: "the realized-stamp question was resolved — stamped, or explicitly not-stamped with the missing lenses recorded"
  check: { type: field_equals, file: "stamp-record.json", field: "stamp_resolved", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality does not resolve, or the profile is not
  firmed. direction: halt and route to /shape or /understand before /measure runs. handoff: human.
- REC2 (F2) — trigger: a write touched something out of scope. direction: revert it; /measure writes
  only this slice's measure.md, a decision, and the one realized status field. handoff: autonomous.
- REC3 (F3) — trigger: measure.md fails the template/shape. direction: re-emit to the Measure lens
  template (Focus / Metrics / Out of scope only). handoff: autonomous.
- REC4 (F4) — trigger: measure.md fails the content eval. direction: rewrite the failing section to
  the judge's cited fixes and re-judge until the gate passes. handoff: autonomous.
- REC5 (F5) — trigger: a metric lacks a baseline/target/proof or grounds in nothing the slice
  delivers. direction: re-draft the metric as a concrete baseline + target + proof tied to the hub.
  handoff: autonomous.
- REC6 (F6) — trigger: a functionality is neither measured nor out-of-scoped. direction: add a metric
  for it or name it in out-of-scope with the reason. handoff: autonomous.
- REC7 (F7) — trigger: the assessment read or grounded on another lens. direction: remove the
  dependency; derive only from the slice's hub. handoff: autonomous.
- REC8 (F8) — trigger: the slice was stamped while a lens doc was missing. direction: revert the
  stamp, report the missing lens, and route to the pipe that owns it. handoff: human.
- REC9 (F9) — trigger: the keyed persist changed more than this slice's status field on the spine.
  direction: restore the spine and re-run `persist_measure.py` so only the single status flip on this
  slice is applied. handoff: human.
- REC10 (F10) — trigger: the scoped-write guard reports an out-of-scope path, or an accepted decision
  file was modified rather than added. direction: the guard's `--restore` already reverted the
  offending paths; re-run writing only the allowlisted scope (this slice's measure.md, its decisions,
  the realized stamp), after a human confirms the restore. handoff: human.
- REC11 (F11) — trigger: a model delta was COMMITTED before the checkpoint gate resolved.
  direction: revert the premature commit and the working-tree writes (guard `--restore`, empty allow
  set) and re-present the checkpoint; commit only after the gate resolves (a typed approval, a recorded
  config skip, or a recorded policy auto-pass). handoff: human.
- REC12 (F12) — trigger: a measurement frame with no KB learning and no recorded proposal. direction:
  search the KB via kb-search and ground the frame, or raise a KB-learning-gap proposal. handoff:
  autonomous.
- REC13 (F13) — trigger: the run is about to close COMPLETED with the Done means unmet. direction:
  close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses named; fix the state —
  re-run `persist_measure.py` over the approved manifest so the persist record carries the machine
  `applied` field and the stamp record names one of the two outcomes, and re-capture the
  `scoped_write_guard.py` report — and re-evaluate; the close stays HALTED until the verdict reads
  held. handoff: autonomous.
- REC14 (F14) — trigger: a conditional-gate crossing left no live-eval ledger line, or an auto-pass
  fired for a shape the policy does not list as auto (or that carried a blocking finding). direction:
  re-append the missing ledger line from the recorded crossing; when the auto-pass was unearned,
  re-run the gate as a live wait (render the prompt, take the typed verdict) and append the corrected
  line. handoff: autonomous.
- REC15 (F15) — trigger: the product-os tree is dirty at entry (uncommitted model edits present).
  direction: halt at pre-flight and ask for a clean model tree — commit or revert the pending model
  edits — before /measure proceeds. handoff: human.
