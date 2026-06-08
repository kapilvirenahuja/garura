# shape — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one domain whose capabilities /understand has enriched and whose product
profile is firmed (`set`), select what to build: confirm the capabilities that stay
(and prune the ones that don't), choose the functionalities to build under each kept
capability, and author each functionality's build-unit ICE, the personas it serves,
and the journeys those personas travel. /shape selects **against** the firmed box —
it reads the profile to judge fit but never writes it. A selection that would need
more than the box halts for the human to run /understand. One domain per run; one
human checkpoint approves the whole selection bundle before anything persists.

Pipeline position: **none**. /shape is a strategic, model-building play in the
shaping pipeline. It opens no delivery issue and cuts no branch, so the D2 rule
injects neither a `start-change` head nor a close sequence. It writes the persistent
product model directly.

### Constraints

- C1 — Operates on ONE domain per run, on a firmed model: the product profile is
  `set` (firmed by /understand) and the domain's target capabilities have rich ICE.
  If the profile is `directional`, or a target capability lacks rich ICE, halt —
  /shape selects against a firmed model, it does not firm one.
- C2 — /shape is the selector. For the domain it confirms capabilities
  (`proposed → active`) or prunes them (`→ deprecated`), selects which
  functionalities to build, and creates functionality nodes, each functionality's
  build-unit ICE, the persona records, and the journey records.
- C3 — Selection is grounded in the profile fit and the KB shelves: every kept
  capability and every selected functionality traces to a KB shelf, or to a recorded
  KB-node proposal. No invented functionality.
- C4 — Schema conformance: functionality nodes conform to product-os v1, functionality
  ICE to ice v1, personas and journeys to product-os v1, and decisions to decision v1.
- C5 — Tree integrity: every created functionality's parent is a confirmed (`active`)
  capability; every functionality ICE `context.persona` reference resolves to a
  persona record that exists; every journey references existing personas and an
  existing node.
- C6 — /shape never writes the product profile — not a level, not a gate, not the
  state. It selects within the box. A selection that needs more than the box halts
  for the human to run /understand; /shape cannot redraw the box.
- C7 — Structural scope: /shape may create functionality nodes and flip a capability's
  `status` (`proposed → active` / `→ deprecated`). It never reparents or renames an
  existing node, never creates or deletes a capability or a domain, and never edits a
  capability node beyond its `status` field.
- C8 — Re-entrant, idempotent, non-destructive: re-running re-selects against the
  current box. Functionalities, personas, and journeys carry stable ids (derived from
  name/slug) and are written skip-if-exists, so a re-run never duplicates them.
  Pruning marks a node `deprecated` (never hard-deletes); an existing ICE or decision
  is superseded by a new record, never overwritten in place.
- C9 — There is exactly one human checkpoint, presenting the domain's selection bundle
  — kept and pruned capabilities, selected functionalities, personas, and journeys.
  Nothing is persisted before the checkpoint is approved.
- C10 — Decisions: every prune and every material selection choice is recorded as a
  decision (ADR) at the right level (capability or functionality).

### Failure conditions

- F1 — The product profile is `directional` (not firmed), or a target capability
  lacks rich ICE, when /shape runs.
- F2 — A written functionality, ICE, persona, journey, or decision violates its v1
  schema.
- F3 — A selected functionality, or a kept capability, has no grounding in the KB
  shelves and no recorded proposal — it was invented.
- F4 — A created functionality is orphaned (its parent is not an `active` capability),
  a functionality ICE persona reference points to a non-existent persona, or a journey
  references a missing persona or node.
- F5 — /shape wrote any field of the product profile — a level, a gate, or the state.
- F6 — /shape mutated structure beyond its scope — it reparented or renamed a node,
  created or deleted a capability or domain, or edited a capability node beyond its
  `status` flip.
- F7 — A prune hard-deleted a node, ICE, or decision; an existing ICE or decision was
  overwritten in place instead of superseded; or a re-run duplicated a persona,
  journey, or functionality.
- F8 — The selection was persisted without the human approving the checkpoint.
- F9 — A prune or a material selection was made with no decision recorded.

## Expectation

### Success scenarios

- S1 — (product strategist, first selection) Given a domain with enriched
  capabilities and a `set` profile, when /shape runs and the checkpoint is approved,
  then the kept capabilities are `active`, the selected functionalities exist with
  build-unit ICE, and the personas and journeys are created — all schema-valid.
  Measure: each kept capability node is `status: active`; each selected functionality
  node is `type: functionality` with `parent` an active capability and an `ice_ref` to
  a functionality ICE whose `intent.goals` is non-empty; persona and journey records
  exist and validate; every artifact validates against its v1 schema.
- S2 — (architect, grounding) Given the selection is drafted, when functionalities are
  inspected, then each kept capability and selected functionality traces to a KB shelf
  or a recorded proposal. Measure: the shape manifest names, for every kept capability
  and selected functionality, a KB shelf or a proposal file; none is ungrounded.
- S3 — (product owner, prune is soft) Given a capability is pruned, when /shape
  persists, then the capability is marked `deprecated` with a recorded decision and is
  not deleted. Measure: the pruned capability node still exists with `status:
  deprecated`; a decision record names the prune; no node file was removed.
- S4 — (reviewer, profile untouched) Given /shape runs, when the model is compared
  before and after, then no field of the product profile changed. Measure: the
  `profile.yaml` content is byte-identical before and after the run, and the apply
  manifest's written set contains no profile path.
- S5 — (product owner, re-run) Given /shape already ran on the domain, when it runs
  again, then no persona, journey, or functionality is duplicated. Measure: every
  persona/journey/functionality id present after the second run was already present
  after the first; the second run's written set holds only genuinely new selections.
- S6 — (QA engineer, the checkpoint) Given the selection bundle is ready, when the
  checkpoint is presented, then it shows the kept and pruned capabilities, the selected
  functionalities, the personas, and the journeys, inline, before any write. Measure:
  each of those sections is present in the checkpoint; no product-model file was
  written before the approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the profile is `directional`, or a target capability lacks rich
  ICE, at start. direction: halt and route to /understand to firm the profile and
  enrich the capabilities before /shape runs. handoff: human.
- REC2 (F2) — trigger: a written functionality, ICE, persona, journey, or decision
  fails v1 schema validation. direction: re-emit the failing artifact to conform to
  its schema before the play completes. handoff: autonomous.
- REC3 (F3) — trigger: a selected functionality or kept capability has neither a KB
  shelf match nor a proposal. direction: ground it against the KB, or record a
  propose-kb-node proposal; never keep an invented selection. handoff: autonomous.
- REC4 (F4) — trigger: an orphaned functionality, a dangling persona reference, or a
  journey referencing a missing persona/node. direction: repair the references —
  reparent the functionality under an active capability, create the missing persona,
  or fix the journey — before persisting. handoff: autonomous.
- REC5 (F5) — trigger: a write touched the product profile. direction: revert the
  profile change; an out-of-box need routes to /understand, never to a /shape profile
  write. handoff: human.
- REC6 (F6) — trigger: a structural mutation beyond scope (reparent, rename,
  create/delete a capability/domain, or a non-status capability edit). direction:
  revert the out-of-scope mutation; /shape creates functionalities and flips
  capability status only. handoff: autonomous.
- REC7 (F7) — trigger: a hard delete, an in-place overwrite of an ICE/decision, or a
  duplicated persona/journey/functionality. direction: restore the deleted/overwritten
  record, switch the prune to `deprecated`, and de-duplicate by stable id, after a
  human confirms the restore. handoff: human.
- REC8 (F8) — trigger: the selection persisted with no checkpoint approval.
  direction: revert the premature write and re-present the checkpoint; persist only
  after the human approves. handoff: human.
- REC9 (F9) — trigger: a prune or material selection with no decision record.
  direction: write the decision (ADR) for each prune and material selection before
  persisting. handoff: autonomous.
