# learn — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given ONE delivered unit of work — an issue (and the slice it shipped) that has passed
through delivery — read what **actually happened** and update the LIVING product model to
match reality. /learn reads the outcome signals the pipeline already produced: the **measure
lens** (each metric's baseline → target → realized value and its proof), the **validate
verdicts and fix reports** (which gates the work truly cleared; a `fix_required` round is a
signal the model was wrong, not a defect to bury), the **run lens** (what production actually
needed versus what was planned), and the **delivered epic and slice status** (what shipped and
held). From those outcomes it proposes precise updates to the model — and only the model's
**meaning**: it refines a capability's or functionality's `one_line` where delivery revealed
hidden complexity, raises a capability's `nfr_needs` level where production proved the level
too low, promotes a `status` that proved out, refreshes the grounding-doc sections the learning
changed (a capability's benefit hypothesis confirmed or refuted and its boundaries, a
functionality's acceptance and rules, the measure / run / quality lens docs with the real
results), and records every material learning as an append-only **decision** (title, reason,
the alternative it rejected and why, status). It REPLACES the old five-play learning loop
(capture / codify / distill / enrich / reap), which staged proposals into a separate knowledge
base and wrote a retired YAML shape; /learn writes the new spine + grounding model directly.
One delivered unit per run; one human checkpoint approves every proposed update — high-
confidence batched, low-confidence surfaced one by one — before anything persists. /learn
writes ONLY meaning and never the skeleton: it never renames or re-parents a domain, capability,
or functionality, never rewrites a slice or epic entry, and never edits an accepted decision in
place.

Pipeline position: **both**. The product model is the source of truth on main, so a model update
rides the change pipeline like any other. The D2 rule prepends `start-change` (opens the learn
issue, cuts a fresh branch off main, inits STM) and, after the updates are persisted and
verified, appends the close sequence `commit-change → propose-change → review-change →
merge-change`, merging the refreshed model to main. (#434 ProductOS command model)

### Constraints

- C1 — Operates on ONE delivered unit per run: the unit (its issue and the slice it shipped)
  resolves from the spine, and its outcome evidence exists — at least one of the measure lens,
  a validate verdict, the run lens, or a delivered epic/slice status. If the unit is absent or
  nothing has delivered yet, halt — /learn learns from what shipped; it never invents an outcome.
- C2 — Writes only the model's MEANING: capability/functionality `one_line`, a capability's
  `nfr_needs` level, a `status` promotion, appended decision refs, refreshed grounding-doc
  sections, and new decision records. It never changes the tree skeleton (any domain, capability,
  or functionality id, slug, or parent), never rewrites a slice or epic entry, and never edits an
  accepted decision in place.
- C3 — Every grounding doc it rewrites still conforms to its template — no missing, extra, or
  empty section. The shape linter passes.
- C4 — Content quality: every rewritten grounding doc clears the content-quality eval — every
  item self-explaining, the doc passing the stranger test — not just the linter.
- C5 — Outcome-grounded: every proposed change cites the outcome that justifies it (a measure
  result, a validate finding, a run actual, or a delivered status). No change without evidence.
- C6 — nfr level changes are monotonic-up and gated: a capability's `nfr_needs` level may only
  rise, never silently fall, and a profile box-move it forces is recorded as a decision.
- C7 — Decisions are append-only and immutable: each material learning is a NEW decision record
  (status accepted); a learning that overturns a prior decision writes a new record naming what
  it supersedes — it never edits the old one.
- C8 — Status changes are earned: a functionality or epic `status` advances only on evidence it
  proved out (validated / delivered); a `fix_required` is read as a model-gap signal and refines
  the grounding, never silently advanced.
- C9 — The spine write is surgical: it mutates only the allowlisted fields on the nodes the
  approved manifest names; every other node, field, and collection stays byte-identical.
- C10 — Non-destructive: a re-run re-derives only the proposed updates; no accepted decision is
  edited in place and nothing is removed.
- C11 — Exactly one human checkpoint, presenting every proposed update (spine meaning fields,
  doc-section rewrites, new decisions) with its outcome citation — high-confidence batched,
  low-confidence surfaced one by one. Nothing is persisted before approval.
- C12 — Learnings are outcome-grounded, not invented: the link from outcome to model change is
  explicit and traceable; a proposed change with no outcome citation is rejected.

### Failure conditions

- F1 — The unit is absent, or no outcome evidence exists (nothing delivered), when /learn runs.
- F2 — A write touched the tree skeleton (a rename or re-parent), a slice or epic entry, or
  edited an accepted decision in place.
- F3 — A rewritten grounding doc fails the template/shape (a missing, extra, or empty section).
- F4 — A rewritten grounding doc fails the content-quality eval.
- F5 — A proposed change cites no outcome.
- F6 — A capability `nfr_needs` level was lowered, or a box-move was made without a decision.
- F7 — An accepted decision was edited in place, or a superseding learning did not name what it
  supersedes.
- F8 — A status was advanced without proving evidence, or a `fix_required` was silently advanced.
- F9 — The spine write changed more than the allowlisted fields on the manifest-named nodes.
- F10 — A non-allowlisted file changed, or an accepted decision was edited in place.
- F11 — A model update was persisted before the checkpoint was approved.
- F12 — A learning with no traceable link to an outcome.

## Expectation

### Success scenarios

- S1 — (learning analyst, first run) Given a delivered unit with outcome evidence, when /learn
  runs and the checkpoint is approved, then the proposed updates land: every rewritten grounding
  doc clears the linter and the content eval, the spine meaning fields update, and each material
  learning is recorded as a decision. Measure: the docs pass both guards and every change carries
  an outcome citation.
- S2 — (product owner, an nfr box-move) Given production proved a capability needs a higher
  reliability level, when /learn runs, then the capability's `nfr_needs` rises (monotonic-up),
  the profile box-move is recorded as a decision, and that is the only structural change.
  Measure: the level only rose, and a decision names the dimension and from→to.
- S3 — (reviewer, a fix-required signal) Given a validate `fix_required` round, when /learn runs,
  then it reads the gap and proposes the boundary or rule refinement to the functionality
  grounding — not a silent status advance — and records the decision. Measure: the functionality
  status is unchanged and the refinement cites the fix report.
- S4 — (architect, outcome-grounded) Given the updates are authored, when inspected, then every
  proposed change cites the outcome that justified it and none stands without evidence. Measure:
  the manifest carries an outcome citation per change.
- S5 — (product owner, re-run) Given the unit already learned, when /learn runs again, then it
  re-derives only the proposed updates; everything else is byte-identical and no accepted decision
  is edited in place. Measure: the spine diff is confined to the re-derived fields; no decision
  rewritten.
- S6 — (reviewer, the checkpoint) Given the updates are ready, when the checkpoint is presented,
  then it shows every proposed change with its citation, tiered by confidence, and nothing is
  written before approval. Measure: no product-model file changed before the approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the unit is absent or nothing has delivered. direction: halt and route to
  the delivery plays (/implement → /validate → /measure) before /learn runs. handoff: human.
- REC2 (F2) — trigger: a write touched the skeleton, a slice/epic entry, or an accepted decision.
  direction: revert it; /learn writes only meaning fields, grounding sections, and new decisions.
  handoff: human.
- REC3 (F3) — trigger: a rewritten grounding doc fails the template/shape. direction: re-emit the
  doc to its template (no missing/extra/empty section). handoff: autonomous.
- REC4 (F4) — trigger: a rewritten grounding doc fails the content eval. direction: rewrite the
  failing section to the judge's cited fixes and re-judge until the gate passes. handoff:
  autonomous.
- REC5 (F5) — trigger: a proposed change cites no outcome. direction: attach the outcome that
  justifies it or drop the change. handoff: autonomous.
- REC6 (F6) — trigger: an nfr level was lowered, or a box-move lacks a decision. direction: restore
  the level (monotonic-up only) and record the box-move decision. handoff: autonomous.
- REC7 (F7) — trigger: an accepted decision was edited, or a supersede did not name its target.
  direction: restore the decision and write a NEW record naming what it supersedes. handoff:
  human.
- REC8 (F8) — trigger: a status advanced without evidence, or a fix_required was silently advanced.
  direction: revert the status and refine the grounding from the gap instead. handoff: autonomous.
- REC9 (F9) — trigger: the spine write changed more than the allowlisted fields. direction: restore
  the spine and re-apply only the allowlisted mutations on the manifest-named nodes. handoff:
  human.
- REC10 (F10) — trigger: a non-allowlisted file changed, or a decision edited in place. direction:
  restore it and re-apply only the allowlisted writes, after a human confirms the restore.
  handoff: human.
- REC11 (F11) — trigger: a model update persisted before approval. direction: revert the premature
  write and re-present the checkpoint; persist only after approval. handoff: human.
- REC12 (F12) — trigger: a learning with no traceable outcome link. direction: trace it to an
  outcome signal or drop it. handoff: autonomous.
