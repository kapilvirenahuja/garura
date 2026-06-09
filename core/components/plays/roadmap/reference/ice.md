# roadmap — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given the vertical slices /shape produced across all shaped domains, plan them: order
them into a build sequence that respects their dependencies, and add an effort estimate
to each. /roadmap reads the slices — their bundled functionalities, the ICE those
reference, and each slice's dependency_notes — to judge order and effort, and writes
only the **plan** onto each slice: `order`, `effort`, resolved `depends_on`, and the
`status` flip `proposed → planned`. It never touches a slice's composition (name,
outcome, functionalities, acceptance_intent), never ICE, structure, the profile, the
lenses, or decisions. One run plans the whole set across every shaped domain, because
order is comparative. One human checkpoint approves the plan before anything persists.
Convention: a lower `order` number means sooner.

Pipeline position: **none**. /roadmap is a strategic, planning play in the shaping
pipeline. It opens no delivery issue and cuts no branch, so the D2 rule injects neither a
`start-change` head nor a close sequence. It writes the persistent product model
directly. It runs after /shape, since slices must exist before they can be planned.

### Constraints

- C1 — Plans only the slices /shape produced (slice v1). It never writes a plan onto
  anything that is not a slice. If no slices exist yet, the play exits — there is
  nothing to plan; run /shape first.
- C2 — Writes only the plan fields on a slice: `order`, `effort`, resolved `depends_on`,
  and `status` (`proposed → planned`). It never edits a slice's composition (name,
  outcome, functionalities, acceptance_intent, dependency_notes), and never touches ICE,
  node structure, the profile, the lenses, decisions, or the `_deferred` bucket.
- C3 — The order respects dependencies: /roadmap resolves each slice's dependencies
  (from its dependency_notes, its shared functionalities, and those functionalities' ICE
  `depends_on`) into concrete `depends_on` slice ids, and orders so a slice is never
  sequenced before one it depends on.
- C4 — The plan is coherent: every planned slice gets an integer `order` and a non-empty
  `effort`; the orders are distinct and form 1..N across all planned slices.
- C5 — Global across domains: one run plans every shaped domain's slices together in a
  single order. A dependency cycle is surfaced at the checkpoint as a model anomaly — it
  is never silently broken or persisted as an incoherent order.
- C6 — Additive and non-destructive: the run changes only the plan fields on slices;
  every other field and every other product-model file is byte-unchanged. Re-running
  replans against the current slices and rewrites only plan fields that changed.
- C7 — Schema conformance: every slice the play writes still validates against slice v1.
- C8 — Exactly one human checkpoint, presenting the plan — the ordered slices with their
  effort and resolved dependencies, plus any cycle anomalies — before any plan is
  written. Nothing persists before approval.

### Failure conditions

- F1 — /roadmap wrote a plan onto something that is not a /shape slice.
- F2 — A write touched a slice field other than the plan fields (`order`, `effort`,
  `depends_on`, `status`), or touched ICE, structure, the profile, a lens, a decision,
  or the `_deferred` bucket.
- F3 — The order contradicts dependencies — a slice is sequenced ahead of one it
  depends_on.
- F4 — A planned slice has no integer `order`, or no `effort`; or the orders are not a
  coherent 1..N (a duplicate or a gap).
- F5 — A dependency cycle was persisted as an order instead of being surfaced as an
  anomaly; or slices from a shaped domain were left out of the single global plan.
- F6 — A slice field other than the plan fields changed, or a non-slice product-model
  file changed during the run.
- F7 — A written slice violates slice v1 schema.
- F8 — A plan was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (planner, first plan) Given shaped slices with no plan yet, when /roadmap runs
  and the checkpoint is approved, then every slice gets an order and an effort and
  nothing else changes. Measure: every non-deferred slice has an integer `order` and a
  non-empty `effort`; the orders are distinct and form 1..N; every other field and file
  is byte-identical before and after; every slice validates slice v1.
- S2 — (architect, dependencies) Given slices with dependencies, when /roadmap plans,
  then no slice is ordered ahead of one it depends_on, and any cycle is flagged. Measure:
  for every resolved `A depends_on B`, `order(B) < order(A)`; any dependency cycle
  appears in the checkpoint's anomaly list and no order is persisted for it.
- S3 — (delivery lead, effort) Given the plan, when slices are inspected, then each
  planned slice carries an effort estimate. Measure: no planned slice has an empty
  `effort`.
- S4 — (product manager, cross-domain) Given slices from more than one shaped domain,
  when /roadmap runs, then it plans them together in one global order. Measure: the
  `order` values form a single 1..N sequence spanning slices from every shaped domain,
  not a separate sequence per domain.
- S5 — (product owner, re-run non-destructive) Given /roadmap already ran, when it runs
  again, then on an unchanged model nothing changes, and on a changed model only plan
  fields change. Measure: on an unchanged model every product-model file is byte-
  identical; on a changed model the only fields that differ on any slice are `order`,
  `effort`, `depends_on`, `status`, and no non-slice file changed.
- S6 — (reviewer, the checkpoint) Given the plan is ready, when the checkpoint is
  presented, then it shows the ordered slices with effort and dependencies and any
  anomalies, before any write. Measure: the checkpoint lists the ordered slices, each
  with effort and resolved dependencies, plus the anomaly list; no slice's plan fields
  changed before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a plan was written onto a non-slice artifact. direction: revert
  it; /roadmap plans only /shape slices. handoff: autonomous.
- REC2 (F2) — trigger: a write touched a slice's composition or another artifact.
  direction: revert the out-of-scope write; /roadmap writes only order/effort/depends_on/
  status on slices. handoff: autonomous.
- REC3 (F3) — trigger: a slice is ordered ahead of one it depends_on. direction:
  re-sort so dependencies precede dependents before persisting. handoff: autonomous.
- REC4 (F4) — trigger: a planned slice lacks order or effort, or the orders aren't a
  coherent 1..N. direction: recompute a complete, coherent plan — an integer order and an
  effort for every planned slice. handoff: autonomous.
- REC5 (F5) — trigger: a dependency cycle, or a domain's slices left unplanned.
  direction: surface the cycle at the checkpoint for a human to break, and include every
  shaped domain's slices in the single plan. handoff: human.
- REC6 (F6) — trigger: a non-plan slice field changed, or a non-slice file changed.
  direction: restore the changed content and re-apply only the plan fields, after a human
  confirms the restore. handoff: human.
- REC7 (F7) — trigger: a written slice fails slice v1 schema validation. direction:
  re-emit the failing slice to conform before the play completes. handoff: autonomous.
- REC8 (F8) — trigger: a plan was persisted before the checkpoint was approved.
  direction: revert the premature write and re-present the checkpoint; persist only after
  the human approves. handoff: human.
