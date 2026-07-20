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
confidence batched, low-confidence surfaced one by one — before anything is COMMITTED. /learn
writes ONLY meaning and never the skeleton: it never renames or re-parents a domain, capability,
or functionality, never rewrites a slice or epic entry, and never edits an accepted decision in
place.

Pipeline position: **both**. The product model is the source of truth on main, so a model update
rides the change pipeline like any other. The D2 rule prepends `start-change` (opens the learn
issue, cuts a fresh branch off main, inits STM) and, after the updates are persisted and
verified, appends the close sequence `commit-change → propose-change → review-change →
merge-change`, merging the refreshed model to main. (#434 ProductOS command model)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill
(author-learnings) writes ONLY the per-node grounding docs (`capability.md`, `functionality.md`,
and the slice `lens/measure|run|quality.md`) straight to the live model; every shared-file
mutation (the spine `_spine.yaml` meaning fields, the `profile` nfr levels inside it, and the
new decision records under `decisions/`) is done by the deterministic keyed persist script
(`persist_learn.py`), in place, keyed to the manifest-named nodes and the meaning-field
whitelist so it cannot touch a node the manifest does not name, the tree skeleton, a slice or
epic entry, or an accepted decision. There is no `draft/` model copy and no apply/promote step:
the model tree is asserted clean at entry, the run writes the full delta to the live model, a
post-write scoped guard confirms containment, and the play commits its own `feat(model)` delta
before the injected close sequence runs — so the working-tree diff vs the branch base is exactly
this run's delta. Review is the branch git diff and the pipeline's end PR.

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
- C9 — The shared-file write is surgical, enforced by the keyed persist script BY CONSTRUCTION:
  `persist_learn.py` is the ONLY writer of the shared files (the spine `_spine.yaml`, the
  `profile` block inside it, and the `decisions/` records), and it mutates only the allowlisted
  meaning fields (`one_line`, `nfr_needs` level, earned `status`, appended `decisions` refs) on
  the nodes the approved manifest names — every other node, field, and collection stays
  byte-identical. This is the node-level containment the file-level scoped guard cannot provide.
- C10 — Non-destructive: a re-run re-derives only the proposed updates; no accepted decision is
  edited in place and nothing is removed.
- C11 — Exactly one human checkpoint, presenting every proposed update (spine meaning fields,
  doc-section rewrites, new decisions) with its outcome citation — high-confidence batched,
  low-confidence surfaced one by one. The checkpoint is a **default-on config gate**
  (`standards/rules/gate-config.md`, #466), declared `(class: standard)`, not pinned: when it
  resolves on (the default), it waits for typed approval; when config resolves it off, the skip
  is recorded in evidence (`gate skipped by config`) and the play proceeds. Write-then-review
  (ADR 026): the run writes the FULL delta to the live model FIRST — the grounding docs by the
  authoring skill, then the shared files (spine meaning fields, profile, decisions) by the keyed
  persist — so the checkpoint presents the real model git diff over the full written delta;
  nothing is COMMITTED before the gate resolves. On cancel the whole delta is reverted
  (`scoped_write_guard.py --restore` with an empty allow set), so nothing the run wrote becomes
  durable. This checkpoint is not a #467 conditional learned gate, so there is no change-shape
  classification step.
- C12 — Learnings are outcome-grounded, not invented: the link from outcome to model change is
  explicit and traceable; a proposed change with no outcome citation is rejected.
- C13 — The play ends by proving its Done means at close (gated, #464): the keyed persist record
  (`persist-manifest.json`) exists with its MACHINE `applied` field true — the persist recorded
  as machine fields, never as prose — and the scoped-write guard report (`guard-report.json`)
  reads `ok: true` (the allowlist held). A close whose Done means does not hold reads HALTED,
  never COMPLETED.
- C14 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean at
  entry (pre-flight halts on a dirty model tree, so the injected `start-change` cuts a fresh
  branch off main against a clean base and the branch base is a correct reference for the guard
  and the diff). After the approved checkpoint the play commits its own model delta on the branch
  (`feat(model): … (#<issue>)`), scoped to the product-os paths it wrote, BEFORE the injected
  close sequence runs — the subsequent `commit-change` then handles only what remains uncommitted
  (STM evidence, ADRs), not the model delta this play already committed. On cancel the tree was
  already reverted (C11), so nothing is committed.

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
- F9 — The keyed persist changed more than the allowlisted meaning fields on the manifest-named
  nodes (a non-meaning field, or a node the manifest does not name, was mutated in a shared file).
- F10 — A model path outside the run's declared write scope changed (the scoped-write guard
  reports a violation), or an accepted decision file was modified rather than added.
- F11 — A model delta was COMMITTED before the checkpoint completed — before the human approved
  it, or (when the gate resolved off by config) before the skip was recorded in evidence.
- F12 — A learning with no traceable link to an outcome.
- F13 — The run closed COMPLETED without the Done means held — a missing persist record, a
  persist whose machine `applied` field is not true, or a scoped-write guard report that is not
  captured or does not read `ok`.
- F14 — The play ran against a dirty product-os tree (uncommitted model edits present at entry),
  so the branch base could not be trusted to reflect only this run's delta.

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
  then it shows every proposed change with its citation, tiered by confidence, over the full
  written delta, and nothing is COMMITTED before approval. Measure: the full delta (docs + spine
  meaning fields + decisions) is written in place and shows as the branch diff, no product-model
  change is COMMITTED before the approval, and on cancel the working tree returns byte-clean to
  the branch base (`scoped_write_guard.py --restore`).

### Done means

Paths are relative to the run's STM root (`{stm_base}{issue}/`); `<working>` is its `context/`
dir. `persist-manifest.json` is the record the keyed persist script (`persist_learn.py`) writes
after the approved checkpoint — its `applied` field is the machine proof the approved updates were
applied to the live model. `guard-report.json` is the captured `scoped_write_guard.py` output —
its `ok` field is the mechanical proof that no model path changed outside the run's declared
write scope (the allowlist held).

- D1 — says: "the applied model-update record exists"
  check: { type: artifact_exists, path: "context/persist-manifest.json" }
- D2 — says: "the approved updates were applied — machine-recorded"
  check: { type: field_equals, file: "context/persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the run's write scope"
  check: { type: field_equals, file: "context/guard-report.json", field: "ok", equals: true }

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
- REC9 (F9) — trigger: the keyed persist changed more than the allowlisted meaning fields on the
  manifest-named nodes. direction: restore the spine and re-run `persist_learn.py` so only the
  allowlisted mutations on the manifest-named nodes are applied. handoff: human.
- REC10 (F10) — trigger: the scoped-write guard reports an out-of-scope path, or a decision file
  was modified rather than added. direction: the guard's `--restore` already reverted the
  offending paths; re-run writing only the allowlisted scope, after a human confirms the restore.
  handoff: human.
- REC11 (F11) — trigger: a model delta was committed before the checkpoint completed (no approval,
  and no recorded config skip). direction: revert the premature commit and re-present the
  checkpoint; commit only after the gate completes. handoff: human.
- REC12 (F12) — trigger: a learning with no traceable outcome link. direction: trace it to an
  outcome signal or drop it. handoff: autonomous.
- REC13 (F13) — trigger: the run is about to close COMPLETED with the Done means unmet (a missing
  persist record, `applied` not true, or the guard report absent or not ok). direction: produce
  the missing artifact — re-run `persist_learn.py` over the approved manifest so the persist record
  carries the machine `applied` field, and re-capture the `scoped_write_guard.py` report — then
  re-evaluate the stop condition; the close stays HALTED until the verdict reads held. handoff:
  autonomous.
- REC14 (F14) — trigger: the product-os tree is dirty at entry (uncommitted model edits present).
  direction: halt at pre-flight and ask for a clean model tree — commit or revert the pending
  model edits — before /learn proceeds. handoff: human.
