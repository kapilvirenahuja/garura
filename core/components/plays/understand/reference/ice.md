# understand — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one existing capability that /vision seeded, deepen its ICE from a goals-only
seed into a rich record: full intent (goals, constraints, failures), context
(persona, systems, scope), expectations (outcomes), and the capability's concrete
NFR + compliance needs — grounded in the capability's KB shelf. Then roll those
needs into the product profile. On a still-directional box, the roll-up establishes
the box and firms it to `set`. On an already-set box, a need that exceeds the
committed ceiling is an out-of-box event: it halts for a human decision that moves
the box and records why. One capability per run; one human checkpoint approves the
enriched ICE and any box-moves before anything persists.

Pipeline position: **none**. /understand is a MIDDLE play of the strategy pipeline (vision → understand → shape → roadmap): it expects to run on the branch /vision already started, injects no `start-change` head and no close sequence, stops when its work is done, and leaves the branch as-is for the next play to pick up. The close belongs to /roadmap. It writes the persistent product model directly, on the already-started branch. (#437)

### Constraints

- C1 — Operates on exactly ONE existing capability and its seed ICE per run. If the
  target capability node or its ICE is absent, halt — /understand enriches an
  existing capability; it never creates structure.
- C2 — Enriches the ICE only. It never changes structure — no node created, renamed,
  or reparented, no functionality added, no capability status flipped. Structure is
  /vision's and /shape's job.
- C3 — The enriched ICE is complete: full intent (goals, constraints, failures),
  context (persona, systems, scope), expectations (outcomes), and the capability's
  `nfr_needs` + `compliance_needs` — none of those sections left empty.
- C4 — Every NFR need is a concrete, measurable target with a gate (a value and how
  it is checked), not a vague adjective.
- C5 — Enrichment is grounded in the capability's KB shelf (personas, systems, NFR
  hints, scope) — it does not invent context or needs from scratch where the shelf
  already covers them.
- C6 — Profile roll-up is monotonic-up: each dimension's committed level becomes the
  greater of the current box and this capability's required level; no dimension is
  ever lowered. When the box is still `directional`, the roll-up establishes it and
  firms it to `set`, with no per-dimension decision. /understand never writes state
  `locked`.
- C7 — Against an already-`set` box, a need (an NFR level or a compliance regime)
  that exceeds the committed ceiling is an out-of-box event: it halts for human
  approval; each approved box-move is recorded as its own decision (ADR, level
  `product`). A need inside the box never halts.
- C8 — There is exactly one human checkpoint, presenting the enriched ICE and the
  profile changes. Every box-move appears as its own explicit line item — the
  dimension, the from→to levels, and the decision it creates — distinct from the ICE
  approval. Nothing is persisted before the checkpoint is approved.
- C9 — Non-destructive to the rest of the model: the run writes only the target
  capability's ICE (never another capability's), the firmed profile, and the
  box-move decisions. The monotonic-up roll-up guarantees no other capability's
  recorded need is ever undercut.

### Failure conditions

- F1 — The target capability node or its ICE does not exist when /understand runs.
- F2 — A written ICE, profile, or decision violates its v1 schema.
- F3 — Structure changed during the run — a node was created, renamed, or
  reparented, a functionality was added, or a capability's status was flipped.
- F4 — The enriched ICE left a required section empty (intent constraints or
  failures, context persona/systems/scope, expectations outcomes, or `nfr_needs`).
- F5 — An NFR need is non-concrete: it carries no measurable value, or no gate.
- F6 — A profile dimension was lowered, or the box was firmed to a state other than
  `set` (left `directional`, or written as `locked`).
- F7 — Against a `set` box, an out-of-box need was persisted without a human-approved
  decision at the checkpoint.
- F8 — A box-move was persisted without its own decision record, or a recorded
  decision omits the dimension or the from→to levels it represents.
- F9 — Another capability's ICE was overwritten during the run.

## Expectation

### Success scenarios

- S1 — (product strategist, first firm-up) Given a capability with a goals-only seed
  ICE and a `directional` profile, when /understand runs and the checkpoint is
  approved, then the ICE is enriched complete and the profile is established and
  firmed to `set` with no per-dimension ADR. Measure: the target `ice.yaml` has
  non-empty intent (goals, constraints, failures), context (persona, systems, scope),
  expectations.outcomes, and `nfr_needs`; the profile `state` is `set`; no decision
  record was written this run.
- S2 — (architect, out-of-box move) Given an already-`set` box and a capability whose
  need exceeds it on a dimension, when /understand runs, then it halts at the
  checkpoint surfacing that box-move as its own line item, and on approval the box is
  raised and a product-level decision records the move. Measure: a decision record
  exists with level `product`, a from→to on the named dimension, and status
  `accepted`; the profile's level on that dimension equals the new (higher) value.
- S3 — (product owner, inside the box) Given an already-`set` box and a capability
  whose needs all sit within it, when /understand runs, then no box-move and no
  decision are produced and the enriched ICE persists after one approval. Measure:
  the run wrote zero decision records; every profile dimension level is unchanged;
  the target ICE is enriched complete.
- S4 — (reviewer, non-destructive) Given several capabilities already enriched, when
  /understand runs on one more, then only that capability's ICE is written and no
  dimension of the box is lowered. Measure: among ICE files, only the target's
  content changed; every profile dimension level is greater than or equal to its
  pre-run value.
- S5 — (QA engineer, the checkpoint) Given the enriched ICE and profile changes are
  ready, when the checkpoint is presented, then it shows the rich ICE and, for each
  box-move, an explicit line naming the dimension, the from→to levels, and the ADR it
  will create — rendered inline, before any write. Measure: each box-move in the run
  appears as its own line item in the checkpoint; no product-model file is written
  before the approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the target capability node or its ICE is absent at start.
  direction: halt and ask for a valid existing capability (run /vision first to seed
  it) before /understand proceeds. handoff: human.
- REC2 (F2) — trigger: a written ICE, profile, or decision fails v1 schema
  validation. direction: re-emit the failing artifact to conform to its schema before
  the play completes. handoff: autonomous.
- REC3 (F3) — trigger: a node was created, renamed, reparented, a functionality
  added, or a status flipped during the run. direction: revert the structural change
  — /understand touches only ICE, profile, and decisions; structure work belongs to
  /vision or /shape. handoff: autonomous.
- REC4 (F4) — trigger: a required ICE section is empty after enrichment. direction:
  re-run enrichment to fill the missing section from the capability's shelf and the
  seed goals before the checkpoint. handoff: autonomous.
- REC5 (F5) — trigger: an NFR need has no measurable value or no gate. direction:
  re-draft that need as a concrete target with how it is checked. handoff:
  autonomous.
- REC6 (F6) — trigger: a profile dimension was lowered, or the box was firmed to a
  state other than `set`. direction: recompute the roll-up monotonic-up (max per
  dimension) and firm to `set`; never lower a dimension. handoff: autonomous.
- REC7 (F7) — trigger: an out-of-box need against a `set` box was persisted with no
  approved decision. direction: revert the box change, surface the move at the
  checkpoint, and persist only after a human approves it. handoff: human.
- REC8 (F8) — trigger: a box-move lacks its decision record, or a decision omits the
  dimension or from→to it represents. direction: write (or complete) the
  product-level decision for each move with its dimension and from→to before
  persisting. handoff: autonomous.
- REC9 (F9) — trigger: an ICE file other than the target capability's was written.
  direction: restore the other capability's ICE and re-run writing only the target's
  ICE, after a human confirms the restore. handoff: human.
