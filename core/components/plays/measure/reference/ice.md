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
checkpoint approves the lens and the stamp before anything persists.

Pipeline position: **both**. /measure is the DELIVER pipe — a single-play pipe that runs last (after
the functional and non-functional pipes have merged). It injects `start-change` (opens the deliver
issue, cuts a fresh branch off main, inits STM) and, after the lens is persisted, the stamp is made,
and both are verified, injects the close sequence `commit-change → propose-change → review-change →
merge-change`, merging the realized slice to main. (#437; 3-pipe realize 2026-06-26)

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
- C9 — The realized stamp is surgical: it sets exactly this slice's `status` to `realized` in the
  spine `slices` index and changes no other slice, no other field of this slice's entry, and no other
  spine collection.
- C10 — Non-destructive: a re-run re-derives only `measure.md`; an accepted decision is never edited
  in place; the only spine change the run may make is the realized stamp.
- C11 — Exactly one human checkpoint, presenting the measure lens and the realized stamp it will make
  (or the missing lenses if it cannot). Nothing is persisted or stamped before approval.
- C12 — Measurement frames are KB-grounded: the metric frame choices (the triangle and any industry
  translation) trace to a KB learning or a recorded KB-node proposal — never invented.

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
- F9 — The realized stamp changed more than this slice's `status` field on the spine.
- F10 — A non-lens/non-decision file changed, or an accepted decision was edited in place.
- F11 — The lens or the stamp was persisted before the checkpoint was approved.
- F12 — A measurement frame choice with no KB learning and no recorded proposal.

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
- S6 — (reviewer, the checkpoint) Given the lens and the stamp are ready, when the checkpoint is
  presented, then it shows the lens inline and the realized stamp it will make (or the missing lenses),
  and no product-model file is written before approval.

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
- REC9 (F9) — trigger: the stamp changed more than this slice's status. direction: restore the spine
  and re-apply only the single status flip. handoff: human.
- REC10 (F10) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited in
  place. direction: restore it and re-apply only measure.md and the new decision, after a human
  confirms the restore. handoff: human.
- REC11 (F11) — trigger: the lens or stamp was persisted before approval. direction: revert the
  premature write and re-present the checkpoint; persist only after approval. handoff: human.
- REC12 (F12) — trigger: a measurement frame with no KB learning and no recorded proposal. direction:
  search the KB via kb-search and ground the frame, or raise a KB-learning-gap proposal. handoff:
  autonomous.
