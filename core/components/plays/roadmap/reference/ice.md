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
order is comparative. One human checkpoint approves the plan before anything persists.
Convention: a lower `order` number means sooner.

Pipeline position: **end**. /roadmap CLOSES the strategy pipeline: after the ordering is persisted and verified, the D2 rule injects the close sequence `commit-change → propose-change → review-change → merge-change`, so the strategy change is committed, raised, reviewed, and merged. No `start-change` head — /vision opened the pipeline. It runs after /shape, since slices must exist before they can be planned. (#437)

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
- C4 — The plan is coherent: every planned slice gets an integer `order` and a non-empty
  `effort`; the orders are distinct and form 1..N across all planned slices.
- C5 — Global across domains: one run plans every shaped domain's slices together in a
  single order. A dependency cycle is surfaced at the checkpoint as a model anomaly — it is
  never silently broken or persisted as an incoherent order.
- C6 — Additive and non-destructive: the run changes only the plan fields on the spine
  slices; every other part of the spine (domains, capabilities, functionalities, profile,
  epics, and each slice's non-plan fields) and every other product-model file is
  byte-unchanged. Re-running replans against the current slices and rewrites only the plan
  fields that changed.
- C7 — Schema conformance: every slice spine entry the play writes conforms to the spine
  schema (an integer `order`, `status: planned`, `depends_on` resolving to real slices).
- C8 — Exactly one human checkpoint, presenting the plan — the ordered slices with their
  effort and resolved dependencies, plus any cycle anomalies — before any plan is written.
  Nothing persists before approval.

### Failure conditions

- F1 — /roadmap wrote a plan onto something that is not a /shape slice.
- F2 — A write touched a slice's composition (its record) or another part of the model — a
  slice's non-plan spine fields, the grounding docs, the node tree, the profile, a lens, a
  decision, or the `_deferred` bucket — rather than only the slice's plan fields on the spine.
- F3 — The order contradicts dependencies — a slice is sequenced ahead of one it depends_on.
- F4 — A planned slice has no integer `order`, or no `effort`; or the orders are not a
  coherent 1..N (a duplicate or a gap).
- F5 — A dependency cycle was persisted as an order instead of being surfaced as an
  anomaly; or slices from a shaped domain were left out of the single global plan.
- F6 — A non-plan part of the model changed during the run: a slice's non-plan field, or
  any product-model file other than the spine.
- F7 — A written slice spine entry violates the spine schema.
- F8 — A plan was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (planner, first plan) Given shaped slices with no plan yet, when /roadmap runs and
  the checkpoint is approved, then every slice gets an order and an effort and nothing else
  changes. Measure: every non-deferred slice's spine entry has an integer `order` and a
  non-empty `effort`; the orders are distinct and form 1..N; every other part of the spine
  and every other product-model file is byte-identical before and after.
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
  change. Measure: on an unchanged model every product-model file is byte-identical; on a
  changed model the only fields that differ on any slice are `order`, `effort`,
  `depends_on`, `status` (on the spine), and no other file changed.
- S6 — (reviewer, the checkpoint) Given the plan is ready, when the checkpoint is presented,
  then it shows the ordered slices with effort and dependencies and any anomalies, before
  any write. Measure: the checkpoint lists the ordered slices, each with effort and resolved
  dependencies, plus the anomaly list; no slice's plan fields changed before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a plan was written onto a non-slice artifact. direction: revert it;
  /roadmap plans only /shape slices. handoff: autonomous.
- REC2 (F2) — trigger: a write touched a slice's composition or another part of the model.
  direction: revert the out-of-scope write; /roadmap writes only order/effort/depends_on/
  status on the spine slices. handoff: autonomous.
- REC3 (F3) — trigger: a slice is ordered ahead of one it depends_on. direction: re-sort so
  dependencies precede dependents before persisting. handoff: autonomous.
- REC4 (F4) — trigger: a planned slice lacks order or effort, or the orders aren't a coherent
  1..N. direction: recompute a complete, coherent plan — an integer order and an effort for
  every planned slice. handoff: autonomous.
- REC5 (F5) — trigger: a dependency cycle, or a domain's slices left unplanned. direction:
  surface the cycle at the checkpoint for a human to break, and include every shaped domain's
  slices in the single plan. handoff: human.
- REC6 (F6) — trigger: a non-plan slice field changed, or a non-spine file changed.
  direction: restore the changed content and re-apply only the plan fields, after a human
  confirms the restore. handoff: human.
- REC7 (F7) — trigger: a written slice spine entry fails the spine schema. direction:
  re-emit the failing entry to conform before the play completes. handoff: autonomous.
- REC8 (F8) — trigger: a plan was persisted before the checkpoint was approved. direction:
  revert the premature write and re-present the checkpoint; persist only after the human
  approves. handoff: human.
