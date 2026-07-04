# understand — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one capability that /vision seeded — named, directional, no functionalities —
**detail it**. /understand is the **product-manager** step, the last detailing step:
promote the capability's `capability.md` from the directional stage to the detailed stage
(benefit hypothesis, boundary, guiding rules, functionalities), **create its
functionalities** (a spine entry plus a detailed `functionality.md` for each), and set the
capability's own concrete NFR + compliance needs. Then roll those per-capability needs up
into the product profile box: on a still-directional box the roll-up establishes the box
and firms it to `set`; on an already-set box, a need that exceeds the committed ceiling is
an out-of-box event that halts for a human decision moving the box and recording why. One
capability per run; one human checkpoint approves the detailed grounding and any box-moves
before anything persists. The grounding docs are gated by the structural linter (shape)
and the content-quality eval (a judge).

Pipeline position: **none**. /understand is a MIDDLE play of the strategy pipeline (vision → understand → shape → roadmap): it expects to run on the branch /vision already started, injects no `start-change` head and no close sequence, stops when its work is done, and leaves the branch as-is for the next play to pick up. The close belongs to /roadmap. It writes the persistent product model directly, on the already-started branch. (#437)

### Constraints

- C1 — Operates on exactly ONE existing capability per run. The target capability must
  already exist in the spine as a directional seed (`detail: directional`); if it is
  absent or not seeded, halt — /understand details a seeded capability, it never seeds.
- C2 — It promotes the target capability `directional → detailed` and CREATES its
  functionalities (each a spine `functionalities` entry plus a detailed `functionality.md`).
  This is the structure /understand owns — the last detailing step. It never touches
  another capability or a domain, and never prioritizes (no slices, no epics, no capability
  status flip — that is /shape).
- C3 — The detailed `capability.md` is complete to its template (benefit hypothesis,
  boundary In/Out/Never, guiding rules, and a Functionalities index whose entries link to
  real functionality ids), and every `functionality.md` is complete to its template (what
  it does, inputs/outputs, rules & behavior, acceptance criteria, out of scope). No
  required section is empty, and the spine and docs stay consistent (the linter passes).
- C4 — Content quality: every grounding doc (the detailed capability and each
  functionality) clears the content-quality eval, not just the linter — each section is
  self-explaining at product-manager altitude and the doc passes the stranger test.
- C5 — The capability's NFR needs are per-capability and concrete: each dimension it
  constrains carries a `level` (none<low<medium<high<xhigh), a measurable `target`, and a
  `gate` (how it is checked); `compliance_needs` are listed. No vague adjective.
- C6 — Detail is grounded in the capability's KB shelf (personas, systems, NFR hints,
  scope, functionality baseline) — it does not invent what the shelf already covers.
- C7 — Profile roll-up is monotonic-up: each dimension's committed level becomes the
  greater of the current box and this capability's required level; no dimension is ever
  lowered. On a still-directional box the roll-up establishes it and firms it to `set`.
  /understand never writes `locked`.
- C8 — Against an already-`set` box, a need (an NFR level or a compliance regime) that
  exceeds the committed ceiling is an out-of-box event: it halts for human approval; each
  approved box-move is recorded as its own product-level decision (ADR). A need inside the
  box never halts.
- C9 — Exactly one human checkpoint, presenting the detailed capability, its
  functionalities, the per-capability NFR needs, and the profile changes — every box-move
  as its own line item (dimension, from→to, the decision it creates). Nothing is persisted
  before the checkpoint resolves. The checkpoint is a **default-on config gate** per
  `gate-config.md`, declared `(class: standard)` and NOT pinned (#466 — the Stage 4
  lever): when config resolves it off, the play does not wait — it records the skip as a
  Checkpoint Decisions row in the evidence and proceeds; box-move approvals ride this same
  gate. It defaults on, so behaviour is unchanged until evidence retires it.
- C10 — Non-destructive to the rest of the model (allowlist): the run writes only the
  target capability (its doc + spine entry), its new functionalities (docs + entries), the
  firmed profile, and the box-move decisions. No other capability, functionality, or domain
  is changed; the monotonic-up roll-up guarantees no other capability's need is undercut.
- C11 — The play ends by proving its Done means at close (gated, #464): the allowlisted
  applied record exists (the detailed capability grounding, its functionality docs, and the
  profile roll-up were persisted), the applied record stamps the roll-up as written, and
  the captured post-apply verification reads ok. The close never reads COMPLETED with the
  stop-condition verdict unmet.

### Failure conditions

- F1 — The target capability is absent from the spine, or is not a directional seed, when
  /understand runs.
- F2 — A grounding doc fails its template/shape, or a spine entry fails the spine schema or
  the spine↔doc consistency check.
- F3 — A grounding doc fails the content-quality eval.
- F4 — The capability was not promoted (its entry left `detail: directional`), or a
  functionality was created without both a spine entry and a detailed `functionality.md`.
- F5 — An NFR need is non-concrete (no level, no measurable target, or no gate), or NFR
  needs were written globally instead of on the capability.
- F6 — A profile dimension was lowered, or the box was firmed to a state other than `set`
  (left `directional`, or written `locked`).
- F7 — Against a `set` box, an out-of-box need was persisted without a human-approved
  decision at the checkpoint.
- F8 — A box-move was persisted without its own decision record, or a decision omits the
  dimension or the from→to it represents.
- F9 — Allowlist breach: a capability, functionality, or domain other than the target (and
  its new functionalities) was changed during the run.
- F10 — Over-reach into prioritization: a slice or an epic was written, or the target
  capability's status was flipped to active — that is /shape's job.
- F11 — The run closed COMPLETED without the Done means held (no applied record, the
  profile roll-up not stamped as persisted, or the post-apply verification not captured or
  not ok).

## Expectation

### Success scenarios

- S1 — (product manager, detail + functionalities) Given a directional capability, when
  /understand runs and the checkpoint is approved, then the capability is detailed (its
  `capability.md` promoted, its spine entry `detail: detailed`) and its functionalities are
  created (each a spine entry plus a detailed `functionality.md`), all conforming to their
  templates and clearing the content-quality eval. Measure: the capability entry is
  `detail: detailed` and carries `nfr_needs`; at least one functionality entry exists with
  `capability` set to the target and its doc present; the linter is clean; the content eval
  gate passes for every grounding doc; the stop-condition verdict reads held.
- S2 — (product strategist, first firm-up) Given a still-directional profile, when
  /understand runs and is approved, then the roll-up establishes the box and firms it to
  `set` with no per-dimension ADR. Measure: the profile `state` is `set`; no decision
  record was written this run.
- S3 — (architect, out-of-box move) Given an already-`set` box and a capability whose need
  exceeds it on a dimension, when /understand runs, then it halts at the checkpoint
  surfacing that box-move as its own line item, and on approval the box is raised and a
  product-level decision records the move. Measure: a decision exists with level `product`,
  a from→to on the named dimension, and status `accepted`; the profile's level on that
  dimension equals the new (higher) value.
- S4 — (product owner, non-destructive) Given several capabilities already detailed, when
  /understand runs on one more, then only the target (its doc + entry), its new
  functionalities, the profile, and the box-move decisions change — and no dimension of the
  box is lowered. Measure: a before/after diff of the spine shows changes only to the target
  capability, its new functionalities, the profile, and decisions; every profile dimension
  level is greater than or equal to its pre-run value.
- S5 — (reviewer, the checkpoint) Given the detailed grounding and the profile changes are
  ready, when the checkpoint is presented, then it shows the detailed capability, its
  functionalities, the per-capability NFR needs, and, for each box-move, an explicit line
  naming the dimension, the from→to levels, and the ADR it will create — rendered inline,
  before any write. Measure: each box-move appears as its own line item; no product-model
  file is written before the approval.

### Done means

Paths are relative to the run's working root (`{stm_base}_shaping/understand/<capability>/`).
`apply-manifest.json` is the applied record `apply_understand.py` writes after the approved
checkpoint (its contract: `written`, `capability_ref`, `changed.{capability,
functionalities_added, profile, decisions}`, `box_moves`) — the persisted detailed
capability grounding, its functionality docs, and the profile roll-up; `apply-checks.json`
is the verify step's captured `check_apply.py` output — the play always writes it, and its
`ok` field is the mechanical proof that the allowlist held, the target was promoted with
concrete needs, the box moved monotonic-up to `set`, and every box-move carries its
accepted decision.

- D1 — says: "the applied record exists — the detailed capability grounding, its
  functionality docs, and the roll-up were persisted through the allowlisted apply"
  check: { type: artifact_exists, path: "apply-manifest.json" }
- D2 — says: "the profile roll-up was persisted — the applied record stamps the firmed box"
  check: { type: field_equals, file: "apply-manifest.json", field: "changed.profile", equals: true }
- D3 — says: "the post-apply verification held — allowlist, promotion, monotonic box,
  box-move decisions all ok"
  check: { type: field_equals, file: "apply-checks.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the target capability is absent or not a directional seed. direction:
  halt and ask for a valid seeded capability (run /vision first) before /understand
  proceeds. handoff: human.
- REC2 (F2) — trigger: a grounding doc fails shape, or a spine entry fails the schema or
  spine↔doc consistency. direction: re-emit the failing doc or spine entry to conform and
  restore consistency before the checkpoint. handoff: autonomous.
- REC3 (F3) — trigger: a grounding doc fails the content-quality eval. direction: rewrite
  the failing doc to the judge's cited fixes — raise each flagged section to a
  self-explaining, product-manager-altitude statement — and re-judge until the gate passes.
  handoff: autonomous.
- REC4 (F4) — trigger: the capability stayed directional, or a functionality lacks its entry
  or its doc. direction: complete the promotion (flip the entry to `detail: detailed`) and
  emit the missing functionality entry or doc before the checkpoint. handoff: autonomous.
- REC5 (F5) — trigger: an NFR need has no level/target/gate, or needs were written off the
  capability. direction: re-draft each need on the capability as a concrete level + target +
  gate. handoff: autonomous.
- REC6 (F6) — trigger: a dimension was lowered, or the box was firmed to a non-`set` state.
  direction: recompute the roll-up monotonic-up (max per dimension) and firm to `set`; never
  lower a dimension. handoff: autonomous.
- REC7 (F7) — trigger: an out-of-box need against a `set` box was persisted with no approved
  decision. direction: revert the box change, surface the move at the checkpoint, and persist
  only after a human approves it. handoff: human.
- REC8 (F8) — trigger: a box-move lacks its decision record, or a decision omits the
  dimension or from→to. direction: write (or complete) the product-level decision for each
  move with its dimension and from→to before persisting. handoff: autonomous.
- REC9 (F9) — trigger: a capability, functionality, or domain other than the target was
  changed. direction: restore the other artifact and re-run writing only the target
  capability and its functionalities, after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: a slice, an epic, or a capability status flip was written.
  direction: strip the prioritization over-reach — remove the slice/epic, reset the status —
  leaving only /understand's detailing scope. handoff: autonomous.
- REC11 (F11) — trigger: the run is about to close COMPLETED with the Done means unmet.
  direction: close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses
  named; fix the state — re-run the allowlisted persist or re-capture the post-apply
  verification — and re-evaluate; the close stays HALTED until the verdict reads held.
  handoff: autonomous.
