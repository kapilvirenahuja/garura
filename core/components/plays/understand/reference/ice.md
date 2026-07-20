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

Pipeline position: **none**. /understand is a MIDDLE play of the strategy pipeline (vision → understand → shape → roadmap): it expects to run on the branch /vision already started, injects no `start-change` head and no close sequence, stops when its work is done, and leaves the branch as-is for the next play to pick up. The close belongs to /roadmap. It writes the persistent product model directly, on the already-started branch — there is no draft copy and no apply/promote step; review is the branch git diff and the pipeline's end PR. (#437, #498, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM enrichment skill writes ONLY the per-node docs (`capability.md`, `functionality.md`) straight to the live model; every shared-file mutation (the spine `_spine.yaml`, `profile.yaml`, the box-move decisions) is done by the deterministic keyed persist script, in place, keyed to the target capability so it cannot touch a sibling node inside a shared file. The model tree is asserted clean at entry and the play commits its own model delta at close, so the working-tree diff vs HEAD is exactly this run's delta.

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
  as its own line item (dimension, from→to, the decision it creates). The checkpoint is a
  **conditional gate** (#467; `gate-config.md` three gate kinds — /understand is one of
  the eleven conditional document plays). Resolution order: pinned (n/a here) → the
  `gates.plays` override → the learned policy (classify the working-tree change shape —
  the model tree's diff vs HEAD — with the bundled `classify_change.py`
  (`--product-base`/`--base-ref HEAD`); a shape in `gate-policy.yaml`'s `auto:` and not
  in `never_auto:`, with NO blocking finding — a lint gap or a content-eval fail —
  auto-passes with the skip and the diff summary recorded) → `gates.classes.standard` →
  `gates.default`. EVERY crossing appends one live-eval line via the bundled
  `gate_eval.py` (shape, predicted gate|auto, the human's real action
  `approved_clean|approved_edited|rejected`, or `auto_pass`). Nothing is persisted before
  the gate resolves: a typed approval, a recorded config skip, OR a recorded policy
  auto-pass — box-move approvals ride this same gate, so the recorded skip or auto-pass
  stands in evidence for them too. At close the play refreshes the learned policy with
  the bundled `distill_gate_policy.py` (config `gates.conditional`: streak/ledger/policy
  paths).
- C10 — Non-destructive to the rest of the model, enforced by the post-write scoped guard:
  the run writes only the target capability (its doc + spine entry), its new functionalities
  (docs + entries), the firmed profile, and the box-move decisions. After the writes and
  before the checkpoint, the bundled `scoped_write_guard.py` diffs the model tree against
  HEAD and FAILS the run (reverting the offending paths) if any model path outside that
  scope changed. No other capability, functionality, or domain is changed; the monotonic-up
  roll-up guarantees no other capability's need is undercut. Node-level containment inside
  the shared spine/profile is kept by the keyed persist script (only it writes those files),
  not the guard.
- C11 — The play ends by proving its Done means at close (gated, #464): the keyed persist
  record exists (the detailed capability grounding, its functionality docs, and the profile
  roll-up were written in place on the live model), the persist record stamps the roll-up as
  written, and the scoped-write guard report reads ok (the allowlist held). The play then
  commits its own model delta on the branch. The close never reads COMPLETED with the
  stop-condition verdict unmet.
- C12 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean
  at entry (pre-flight halts on a dirty model tree), and after the approved checkpoint the
  play commits its model delta on the branch (`feat(model): … (#<issue>)`), so HEAD is a
  correct base for the guard and the change-shape and the next pipeline play enters clean.
  This model-delta commit is a lightweight persist step ONLY — /understand remains a middle
  play that injects no `start-change` head and no Standard Play Close; the commit persists
  the model, it does not add a close sequence.

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
- F7 — Against a `set` box, an out-of-box need was persisted without the checkpoint gate
  resolving for it — no typed approval, no recorded config skip, and no recorded policy
  auto-pass.
- F8 — A box-move was persisted without its own decision record, or a decision omits the
  dimension or the from→to it represents.
- F9 — Allowlist breach: a capability, functionality, or domain other than the target (and
  its new functionalities) was changed during the run.
- F10 — Over-reach into prioritization: a slice or an epic was written, or the target
  capability's status was flipped to active — that is /shape's job.
- F11 — The run closed COMPLETED without the Done means held (no persist record, the
  profile roll-up not stamped as written, the scoped-write guard report not captured or not
  ok, or the model delta not committed).
- F12 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired
  for a shape the policy does not list as auto (or that carried a blocking finding).
- F13 — The play ran against a dirty product-os tree (uncommitted model edits present at
  entry), so the change-shape and the scoped guard could not be trusted to reflect only
  this run's delta.

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
  file is written before the approval — or, on the auto-pass path (a policy-listed
  shape), the gate resolves with no wait and the recorded auto-pass, the appended ledger
  line, and the diff summary stand in the approval's place.

### Done means

Paths are relative to the run's working root (`{stm_base}_shaping/understand/<capability>/`).
`persist-manifest.json` is the record the keyed persist script writes after the approved
checkpoint (its contract: `written`, `capability_ref`, `changed.{capability,
functionalities_added, profile, decisions}`, `box_moves`) — the detailed capability
grounding, its functionality docs, and the profile roll-up, all written in place on the
live model; `guard-report.json` is the captured `scoped_write_guard.py` output — the play
always writes it, and its `ok` field is the mechanical proof that no model path changed
outside the target's scope (the allowlist held). Node-level promotion, concrete needs,
monotonic-up box to `set`, and each box-move's accepted decision are stamped in the persist
record.

- D1 — says: "the persist record exists — the detailed capability grounding, its
  functionality docs, and the roll-up were written in place on the live model"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the profile roll-up was persisted — the persist record stamps the firmed box"
  check: { type: field_equals, file: "persist-manifest.json", field: "changed.profile", equals: true }
- D3 — says: "the scoped-write guard held — no model path changed outside the target's scope"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

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
  named; fix the state — re-run the keyed persist, re-capture the scoped-write guard report,
  or make the model-delta commit — and re-evaluate; the close stays HALTED until the verdict
  reads held. handoff: autonomous.
- REC12 (F12) — trigger: a crossing left no live-eval ledger line, or an auto-pass fired
  for a shape not listed `auto:` in the policy (or one carrying a blocking finding).
  direction: re-append the missing ledger line for the recorded crossing; when the
  auto-pass was unearned, re-run the gate as a live wait — render the approval prompt
  and wait for the typed response — before proceeding. handoff: autonomous.
- REC13 (F13) — trigger: the product-os tree is dirty at entry (uncommitted model edits
  present). direction: halt at pre-flight and ask for a clean model tree — commit or revert
  the pending model edits (or run the prior pipeline play to its close) — before /understand
  proceeds. handoff: human.
