# roadmap — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given the vertical slices /shape produced across all shaped domains, plan them: order
them into a build sequence that respects their dependencies, and add an effort estimate
to each. /roadmap reads the slices — their bundled functionalities, those functionalities'
grounding and spine `depends_on`, and each slice's `dependency_notes` — to judge order and
effort, and writes only the **plan** onto each slice's **spine index entry**: `order`,
`effort`, resolved `depends_on`, and the `status` flip `proposed → planned`. The plan lives
on the spine slices index, never on the slice record, so a slice's composition (its record:
name, outcome, functionalities, acceptance_intent, surface, dependency_notes) is
structurally unreachable from here — as are the grounding docs, the node tree, the profile,
the lenses, and decisions. One run plans the whole set across every shaped domain, because
order is comparative. One human checkpoint approves the plan before anything is committed.
Convention: a lower `order` number means sooner.

Pipeline position: **end**. /roadmap CLOSES the strategy pipeline: after the ordering is
persisted and verified, the D2 rule injects the close sequence
`commit-change → propose-change → review-change → merge-change`, so the strategy change is
committed, raised, reviewed, and merged. No `start-change` head — /vision opened the
pipeline and every earlier strategy play (/understand, /shape) committed its own model
delta on this branch, so /roadmap enters on an already-started branch with a clean model
tree. It runs after /shape, since slices must exist before they can be planned. It writes
the persistent product model **directly, in place** on that branch — there is no draft copy
and no apply/promote step; review is the branch git diff and the pipeline's end PR. (#437,
#500, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): /roadmap writes no
per-node grounding doc at all — its LLM authoring skill (`author-roadmap`) writes NO model
file; it only drafts plan data (effort, resolved dependencies, a value preference) to STM,
which `compute_plan.py` turns into the coherent `plan.json`. Every mutation of the one
shared file /roadmap touches — the spine `_spine.yaml` slices index — is done by the
deterministic keyed persist script (`persist_roadmap.py`), in place, keyed to each planned
slice id: it writes ONLY the four plan fields (`order`, `effort`, `depends_on`, `status`) on
that slice's entry and refuses a plan that names a slice absent from the live spine (the
node-level containment the file-level scoped guard cannot see inside the shared spine).
Because the LLM never writes any model file, containment is a post-write scoped guard over
the full delta (`scoped_write_guard.py`), not a draft. Clean tree in, committed delta out:
the product-os tree is asserted clean at entry (the earlier strategy plays committed their
deltas), and after the approved checkpoint the play commits its own `feat(model)` delta on
the branch — BEFORE the injected close sequence — so the working-tree diff vs HEAD is
exactly this run's delta and the subsequent `commit-change` handles only what remains
uncommitted (STM evidence, ADRs).

### Constraints

- C1 — Plans only the slices /shape produced (the spine `slices` index). It never writes a
  plan onto anything that is not a slice. If no slices exist yet, the play exits — there is
  nothing to plan; run /shape first.
- C2 — Writes only the plan fields on a slice's spine index entry: `order`, `effort`,
  resolved `depends_on`, and `status` (`proposed → planned`). It never edits a slice's
  composition (its record — name, outcome, functionalities, acceptance_intent, surface,
  dependency_notes), the slice entry's other spine fields (id, slug, domain_ref,
  functionality_refs, record), or the grounding docs, the node tree, the profile, the
  lenses, decisions, or the `_deferred` bucket.
- C3 — The order respects dependencies: /roadmap resolves each slice's dependencies (from
  its `dependency_notes`, its shared functionalities, and those functionalities' spine
  `depends_on`) into concrete `depends_on` slice ids, and orders so a slice is never
  sequenced before one it depends on.
- C4 — The plan is coherent, and coherence is a HARD gate BEFORE any persist: every planned
  slice gets an integer `order` and a non-empty `effort`; the orders are distinct and form
  1..N across all planned slices; `compute_plan.py` proves this (exit 0, machine field
  `orders_coherent: true`) and an incoherent plan (a cycle, a missing effort, a gap in the
  order) is NEVER persisted — the play re-derives a coherent plan before the keyed persist
  runs.
- C5 — Global across domains: one run plans every shaped domain's slices together in a
  single order. A dependency cycle is surfaced at the checkpoint as a model anomaly — it is
  never silently broken or persisted as an incoherent order.
- C6 — Additive and non-destructive, enforced by the containment split and the post-write
  scoped guard: the LLM authoring skill writes no model file (only the STM plan draft); the
  keyed persist script (`persist_roadmap.py`) is the ONLY writer of the shared spine, and it
  writes only the four plan fields on each planned slice's entry, refusing a plan that names
  a slice absent from the live spine — this is the node-level containment inside the shared
  spine that the file-level guard cannot provide. After ALL writes and before the checkpoint,
  the bundled `scoped_write_guard.py` diffs the model tree against HEAD and FAILS the run
  (reverting the offending paths) if any model path changed outside the run's write scope —
  the spine `_spine.yaml` is `--allow` (the keyed persist modifies it in place) and every
  other product-model file is out of scope. Re-running replans against the current slices
  and rewrites only the plan fields that changed.
- C7 — Schema conformance, by construction: every slice spine entry the keyed persist writes
  conforms to the spine schema — an integer `order` (carried from `compute_plan.py`'s
  coherent 1..N), `status: planned`, a non-empty `effort`, and `depends_on` resolving to
  real slices — because the persist writes exactly the fields of an already-coherent plan.
- C8 — Exactly one human checkpoint, presenting the plan — the ordered slices with their
  effort and resolved dependencies, plus any cycle anomalies — over the real model git diff.
  The checkpoint is a **conditional gate** (#467; `gate-config.md` three gate kinds —
  /roadmap is one of the eleven conditional document plays). Resolution order: pinned
  (n/a here) → the `gates.plays` override → the learned policy (classify the working-tree
  change shape — the model tree's diff vs HEAD — with the bundled `classify_change.py`
  (`--product-base`/`--base-ref HEAD`); a shape in `gate-policy.yaml`'s `auto:` and not in
  `never_auto:`, with NO blocking finding — a `compute_plan.py` non-zero exit or a cycle
  anomaly, /roadmap's lint-equivalent — auto-passes with the skip and the diff summary
  recorded) → `gates.classes.standard` → `gates.default`. EVERY crossing appends one
  live-eval line via the bundled `gate_eval.py` (shape, predicted gate|auto, the human's
  real action `approved_clean|approved_edited|rejected`, or `auto_pass`). Write-then-review
  (ADR 026): the run writes the FULL delta to the live model FIRST (the keyed persist writes
  the spine slices' plan fields), so the checkpoint presents the real model git diff and the
  change-shape is classified over the full delta; nothing is COMMITTED before the gate
  resolves — a typed approval, a recorded config skip, OR a recorded policy auto-pass. On
  cancel the whole model delta is reverted (`scoped_write_guard.py --restore` with an empty
  allow set — `git restore` the modified spine back to HEAD), and the play halts. At close
  the play refreshes the learned policy with the bundled `distill_gate_policy.py` (config
  `gates.conditional`: streak/ledger/policy paths).
- C9 — The play ends by proving its Done means at close (gated, #464): the keyed persist
  record (`persist-manifest.json`) exists and stamps the write applied, and the scoped-write
  guard report (`guard-report.json`) reads `ok: true` (the allowlist held) — recorded as
  MACHINE fields, never as prose. A close whose Done means does not hold reads HALTED, never
  COMPLETED. This per-play Standard Play Close (evidence + delivery report) precedes the
  pipeline end sequence.
- C10 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean
  at entry (a dirty model tree halts, so HEAD is a correct base for the scoped guard and the
  change-shape). After the approved checkpoint the play commits its own model delta on the
  branch (`feat(model): … (#<issue>)`), scoped to the product-os paths it wrote, BEFORE the
  injected close sequence runs — the subsequent `commit-change` then handles only what
  remains uncommitted (STM evidence, ADRs), not the model delta this play already committed.
  On cancel the tree was already reverted (C8), so nothing is committed.

### Failure conditions

- F1 — /roadmap wrote a plan onto something that is not a /shape slice.
- F2 — A write touched a slice's composition (its record) or another part of the model — a
  slice's non-plan spine fields, the grounding docs, the node tree, the profile, a lens, a
  decision, or the `_deferred` bucket — rather than only the slice's plan fields on the spine.
- F3 — The order contradicts dependencies — a slice is sequenced ahead of one it depends_on.
- F4 — An incoherent plan was persisted: a planned slice with no integer `order` or no
  `effort`, or orders that are not a coherent 1..N (a duplicate or a gap) — persisted instead
  of being re-derived to coherent before the keyed persist ran.
- F5 — A dependency cycle was persisted as an order instead of being surfaced as an
  anomaly; or slices from a shaped domain were left out of the single global plan.
- F6 — A model path outside the run's declared write scope changed — any product-model file
  other than the spine `_spine.yaml`, or a non-plan field inside the spine — and the
  scoped-write guard's report is not ok.
- F7 — A written slice spine entry violates the spine schema.
- F8 — The model delta was COMMITTED before the checkpoint gate resolved — no typed approval,
  no recorded config skip, and no recorded policy auto-pass — or a cancelled checkpoint left
  model writes on the working tree instead of reverting them.
- F9 — The run closed COMPLETED without the Done means held — no persist record, the persist
  not stamped applied, or the scoped-write guard report not captured or not ok.
- F10 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired
  for a shape the policy does not list as auto (or that carried a blocking finding).
- F11 — The play ran against a dirty product-os tree (uncommitted model edits present at
  entry), so the change-shape and the scoped guard could not be trusted to reflect only this
  run's delta.

## Expectation

### Success scenarios

- S1 — (planner, first plan) Given shaped slices with no plan yet, when /roadmap runs and
  the checkpoint is approved, then every slice gets an order and an effort and nothing else
  changes. Measure: every non-deferred slice's spine entry has an integer `order` and a
  non-empty `effort`; the orders are distinct and form 1..N; the scoped-write guard report
  reads `ok: true` (only the spine changed, only the plan fields); the stop-condition verdict
  reads held.
- S2 — (architect, dependencies) Given slices with dependencies, when /roadmap plans, then
  no slice is ordered ahead of one it depends_on, and any cycle is flagged. Measure: for
  every resolved `A depends_on B`, `order(B) < order(A)`; any dependency cycle appears in
  the checkpoint's anomaly list and no order is persisted for it.
- S3 — (delivery lead, effort) Given the plan, when slices are inspected, then each planned
  slice carries an effort estimate. Measure: no planned slice has an empty `effort`.
- S4 — (product manager, cross-domain) Given slices from more than one shaped domain, when
  /roadmap runs, then it plans them together in one global order. Measure: the `order`
  values form a single 1..N sequence spanning slices from every shaped domain, not a
  separate sequence per domain.
- S5 — (product owner, re-run non-destructive) Given /roadmap already ran, when it runs
  again, then on an unchanged model nothing changes, and on a changed model only plan fields
  change. Measure: on an unchanged model the persist manifest's `written` list is empty and
  the guard report reads `ok`; on a changed model the only fields that differ on any slice
  are `order`, `effort`, `depends_on`, `status` (on the spine), and the guard confirms no
  other model file changed.
- S6 — (reviewer, the checkpoint) Given the plan is written to the live spine, when the
  checkpoint is presented, then it shows the ordered slices with effort and dependencies and
  any anomalies, over the real model git diff, before any commit. Measure: the checkpoint
  lists the ordered slices, each with effort and resolved dependencies, plus the anomaly
  list; no product-model change is COMMITTED before approval, and on cancel the working tree
  returns byte-clean to HEAD — or, on the auto-pass path (a policy-listed shape), the gate
  resolves with no wait and the recorded auto-pass, the appended ledger line, and the diff
  summary stand in the approval's place.

### Done means

Paths are relative to the run's STM working root (`{stm_base}_shaping/roadmap/`).
`persist-manifest.json` is the record the keyed persist script (`persist_roadmap.py`) writes
after the approved checkpoint — its `applied` field is the machine proof the plan was written
in place onto the live spine slices. `guard-report.json` is the captured
`scoped_write_guard.py` output — its `ok` field is the mechanical proof that no model path
changed outside the run's declared write scope (the allowlist held).

- D1 — says: "the persist record exists — the plan was written in place onto the live spine slices"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the plan was persisted — the persist record stamps the write applied"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the run's write scope (the allowlist held)"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a plan was written onto a non-slice artifact. direction: the keyed
  persist refuses a plan naming a non-slice by construction; revert and re-run the persist
  over the coherent plan only. handoff: autonomous.
- REC2 (F2) — trigger: a write touched a slice's composition or another part of the model.
  direction: the guard's `--restore` reverted the out-of-scope write; re-run the keyed
  persist writing only order/effort/depends_on/status on the spine slices, after a human
  confirms the restore. handoff: human.
- REC3 (F3) — trigger: a slice is ordered ahead of one it depends_on. direction: re-run
  `compute_plan.py` so dependencies precede dependents before persisting. handoff: autonomous.
- REC4 (F4) — trigger: an incoherent plan (a planned slice lacks order or effort, or the
  orders aren't a coherent 1..N). direction: recompute a complete, coherent plan — an integer
  order and an effort for every planned slice — before the keyed persist runs; the persist is
  gated on `compute_plan.py` exit 0. handoff: autonomous.
- REC5 (F5) — trigger: a dependency cycle, or a domain's slices left unplanned. direction:
  surface the cycle at the checkpoint for a human to break, and include every shaped domain's
  slices in the single plan. handoff: human.
- REC6 (F6) — trigger: the scoped-write guard reports an out-of-scope path (a non-spine model
  file, or a non-plan field inside the spine). direction: the guard's `--restore` already
  reverted the offending paths; re-run the keyed persist writing only the plan fields on the
  spine slices, after a human confirms the restore. handoff: human.
- REC7 (F7) — trigger: a written slice spine entry fails the spine schema. direction:
  re-derive a coherent plan and re-run the keyed persist so the entry conforms before the
  play completes. handoff: autonomous.
- REC8 (F8) — trigger: the model delta was committed before the checkpoint gate resolved, or
  a cancelled checkpoint left writes on the working tree. direction: revert the premature
  commit and the working-tree writes (`scoped_write_guard.py --restore`, empty allow set) and
  re-present the checkpoint; commit only after the gate resolves. handoff: human.
- REC9 (F9) — trigger: the run is about to close COMPLETED with the Done means unmet (a
  missing persist record, `applied` not true, or the guard report absent or not ok).
  direction: produce the missing artifact — re-run `persist_roadmap.py` over the coherent
  plan so the persist record carries the machine `applied` field, re-capture the guard report
  — then re-evaluate the stop condition; the close stays HALTED until the verdict reads held.
  handoff: autonomous.
- REC10 (F10) — trigger: a crossing left no live-eval ledger line, or an auto-pass fired
  for a shape not listed `auto:` in the policy (or one carrying a blocking finding).
  direction: re-append the missing ledger line for the recorded crossing; when the
  auto-pass was unearned, re-run the gate as a live wait — render the approval prompt
  and wait for the typed response — before proceeding. handoff: autonomous.
- REC11 (F11) — trigger: the product-os tree is dirty at entry (uncommitted model edits
  present). direction: halt at pre-flight and ask for a clean model tree — commit or revert
  the pending model edits (the earlier strategy plays should have committed their deltas) —
  before /roadmap plans. handoff: human.
