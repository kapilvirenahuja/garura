# shape — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given one domain whose capabilities /understand has detailed (each `detail: detailed`
with its functionalities created) and whose product profile is firmed (`set`), **select
what to build and compose it into deliverable verticals**. /shape is the **product
owner**: it confirms the capabilities that stay (and prunes the ones that don't), selects
which of the functionalities /understand already created to build now, creates the
personas served and the **user journeys** they travel, and bundles those functionalities
into the domain's **vertical slices** — usable increments that may cross capabilities,
each exposing at least one user-facing surface a named persona can open and check.

/shape does NOT create functionalities or author ICE — /understand did that; /shape
selects among the functionalities that already exist and references them by their spine
id. It selects **against** the firmed box — it reads the profile to judge fit but never
writes it (the box is /understand's). And it stops at slice composition: it never orders
the slices, sizes them, or resolves cross-slice dependencies (that plan is /roadmap's),
and it never cuts the slices into epics (that is /grill's).

**Always scaffold the UI.** A slice is a vertical only when a user can OPEN a surface and
CHECK its outcome, so every slice names at least one surface — and that surface is a thin
**scaffold**, this slice's own piece of the screen, not the whole product UI. The dashboard
accretes slice by slice; a backend-only slice, a one-per-capability horizontal layer, or a
"deliver the whole UI at once" slice is invalid. /shape **names** the surface (its name, the
persona who opens it, what they do on it); it never **designs** it — wireframes, components,
and layout are /realize's UX lens.

One domain per run; one human checkpoint approves the whole selection bundle before
the model delta is committed.

Pipeline position: **none**. /shape is a MIDDLE play of the strategy pipeline (vision → understand → shape → roadmap): it expects to run on the branch /vision already started, injects no `start-change` head and no close sequence, stops when its work is done, and leaves the branch as-is for the next play to pick up. The close belongs to /roadmap. It writes the persistent product model **directly, in place** on the already-started branch — there is no draft copy and no apply/promote step; review is the branch git diff and the pipeline's end PR. (#437, #499, ADR 026)

Write discipline (ADR 026, `standards/rules/direct-model-write.md`): the LLM authoring skill writes ONLY the per-node record files — each slice, persona, journey, and decision record, and the `_deferred` bucket — straight to the live model; the one shared-file mutation (the spine `_spine.yaml` — the capability `status` flips, the persona/journey/decision refs, and the `slices` index) is done by the deterministic keyed persist script, in place, keyed to the domain so it cannot touch a capability outside it inside the spine. /shape never writes the profile. The model tree is asserted clean at entry and the play commits its own model delta at close, so the working-tree diff vs HEAD is exactly this run's delta. Containment is a post-write scoped guard (`scoped_write_guard.py`), not a draft.

### Constraints

- C1 — Operates on ONE domain per run, on a firmed model: the product profile is `set`
  (firmed by /understand) and every target capability is `detail: detailed` with its
  functionalities created. If the profile is `directional`, or a target capability is not
  detailed, halt — /shape selects against a detailed, firmed model; it never details or
  firms one.
- C2 — /shape SELECTS and COMPOSES only. It never creates a functionality or authors ICE
  (/understand did that), and it never writes the product profile (the box is
  /understand's). A selection that would need more than the box halts for the human to run
  /understand; /shape cannot redraw the box.
- C3 — Grounded: every kept capability and every selected functionality traces to a KB
  shelf or to a recorded KB-node proposal. No invented selection.
- C4 — Capability scope: /shape confirms a capability (`proposed → active`) or prunes it
  (`→ deprecated`) by a `status` flip ONLY. It never reparents or renames a node, never
  creates or deletes a capability or domain, and never edits a capability beyond its
  `status`. A prune marks the capability `deprecated` (soft), never a hard delete.
- C5 — Schema + integrity: the persona, journey, decision, and slice records conform to
  their schemas; every slice `functionality_ref` resolves to a real functionality in the
  spine; every journey's persona and surface references resolve.
- C6 — Placement: every selected functionality lands in at least one slice OR in the
  explicit `_deferred` bucket — nothing selected is left unplaced. A functionality MAY
  appear in more than one slice.
- C7 — Every slice is a user-facing vertical with a scaffolded surface: it names at least
  one surface a named persona opens and checks, and that surface is a thin UI scaffold —
  this slice's piece of the screen, not the whole UI. No backend-only slice, no
  one-per-capability horizontal layer, no "whole UI at once" slice. The product surface
  accretes slice by slice.
- C8 — Surfaces are NAMED, not designed: a slice records the surface's name, the persona
  who opens it, and the user action on it. It writes no wireframe, component breakdown,
  layout, or visual-design content — that is /realize's UX lens.
- C9 — Journeys are user journeys through surfaces: each journey's ordered steps are what a
  persona does ON a named surface (`surface_refs` non-empty), never a backend pipeline; and
  every surface a slice names is reached by at least one persona's journey.
- C10 — Slices reference by spine id and carry no plan: a slice points at each functionality
  by its spine `functionality_ref` (never copies its content), and carries no `order`,
  `effort`, or resolved `depends_on` — that plan is /roadmap's. Free-text `dependency_notes`
  are allowed.
- C11 — Decisions: every prune and every material selection choice is recorded as a decision
  (ADR) at the right level.
- C12 — There is exactly one human checkpoint, presenting the domain's selection bundle —
  kept and pruned capabilities, selected functionalities, personas, journeys, and the
  vertical slices (each with its surface and bundled functionalities) plus the `_deferred`
  bucket. The checkpoint is a **conditional gate** (#467; `gate-config.md` three gate
  kinds — /shape is one of the eleven conditional document plays). Resolution order:
  pinned (n/a here) → the `gates.plays` override → the learned policy (classify the
  working-tree change shape — the model tree's diff vs HEAD — with the bundled
  `classify_change.py` (`--product-base`/`--base-ref HEAD`); a shape in
  `gate-policy.yaml`'s `auto:` and not in `never_auto:`, with NO blocking finding — a
  `validate_shape.py` gap or a guard violation — auto-passes with the skip and the diff
  summary recorded) → `gates.classes.standard` → `gates.default`. EVERY crossing appends one
  live-eval line via the bundled `gate_eval.py` (shape, predicted gate|auto, the human's
  real action `approved_clean|approved_edited|rejected`, or `auto_pass`). Write-then-review
  (ADR 026): the run writes the full delta to the live model FIRST (the records by the skill,
  the spine by the keyed persist), so the checkpoint presents the real model git diff and the
  change-shape is classified over the full delta; nothing is COMMITTED before the gate
  resolves — a typed approval, a recorded config skip, OR a recorded policy auto-pass. On
  cancel the whole delta is reverted (`git restore` + `git clean`). At close the play refreshes
  the learned policy with the bundled `distill_gate_policy.py` (config `gates.conditional`:
  streak/ledger/policy paths).
- C13 — Non-destructive to the rest of the model, enforced by the post-write scoped guard:
  the run writes only capability `status` flips, the new slices, personas, journeys, and
  decisions, and their refs onto the capabilities. After the writes and before the checkpoint,
  the bundled `scoped_write_guard.py` diffs the model tree against HEAD and FAILS the run
  (reverting the offending paths) if any model path outside that scope changed. It never
  changes a functionality, a domain, or the profile. Node-level containment inside the shared
  spine (only the named capabilities flip, only their status field moves) is kept by the keyed
  persist script — only it writes the spine — not the guard. Stable ids (from name/slug)
  mean a re-run never duplicates.
- C14 — The play ends by proving its Done means at close (gated, #464): the keyed persist
  record exists (the spine merge — the capability status flips, the slice index, and the
  persona/journey/decision refs — was written in place on the live model, and the record files
  are on disk), the persist record stamps `applied: true`, and the post-write scoped-guard
  report reads ok (the allowlist held). The play then commits its own model delta on the
  branch. The close never reads COMPLETED with the stop-condition verdict unmet.
- C15 — Clean tree in, committed delta out (ADR 026): the product-os tree is asserted clean
  at entry (pre-flight halts on a dirty model tree), and after the approved checkpoint the
  play commits its model delta on the branch (`feat(model): … (#<issue>)`), so HEAD is a
  correct base for the guard and the change-shape and the next pipeline play enters clean.
  This model-delta commit is a lightweight persist step, distinct from the per-play Standard
  Play Close (evidence + delivery report) that /shape still runs like every play. What /shape
  omits as a middle play is the pipeline start/end sequence — no `start-change` head and no end
  PR (those belong to the pipeline, the close to /roadmap); the model-delta commit persists
  this run's model change, it does not add that pipeline sequence.

### Failure conditions

- F1 — The product profile is `directional` (not firmed), or a target capability is not
  `detail: detailed` (or has no functionalities), when /shape runs.
- F2 — /shape created a functionality, authored ICE, or wrote any field of the product
  profile — over-reaching into /understand's scope.
- F3 — A selected functionality or kept capability has no KB-shelf grounding and no recorded
  proposal — it was invented.
- F4 — A capability was edited beyond its `status` flip; or a node was reparented or renamed;
  or a capability or domain was created or deleted; or a prune hard-deleted instead of
  marking `deprecated`.
- F5 — A persona, journey, decision, or slice violates its schema; or a slice
  `functionality_ref` or a journey reference does not resolve.
- F6 — A selected functionality is in neither a slice nor the `_deferred` bucket — it fell
  through unplaced.
- F7 — A slice exposes no user-testable surface (a backend-only or horizontal-layer slice),
  or a slice tries to deliver the whole product surface at once instead of a thin scaffold.
- F8 — /shape designed a surface instead of naming it — it wrote wireframe, component,
  layout, or visual-design content that belongs to /realize's UX lens.
- F9 — A journey is not a user journey through a surface — its steps are a backend pipeline
  or it traverses no surface — or a slice names a surface that no journey reaches.
- F10 — A slice copied a functionality's content instead of referencing it by spine id, or a
  slice carries `order`, `effort`, or resolved `depends_on`.
- F11 — A prune or a material selection was made with no decision recorded.
- F12 — The selection delta was COMMITTED before the checkpoint gate resolved — no typed
  approval, no recorded config skip, and no recorded policy auto-pass.
- F13 — Allowlist breach (scoped-guard violation): a functionality, a domain, or the profile
  changed during the run; or a model path outside /shape's scope (the spine + the new
  slice/persona/journey/decision records) changed; or a re-run duplicated a persona, journey,
  or slice.
- F14 — The run closed COMPLETED without the Done means held (no persist record, the record
  not stamped `applied: true`, the post-write scoped-guard report not captured or not ok, or
  the model delta not committed).
- F15 — A conditional-gate crossing left no live-eval ledger line, or an auto-pass fired
  for a shape the policy does not list as auto (or that carried a blocking finding).
- F16 — The play ran against a dirty product-os tree (uncommitted model edits present at
  entry), so the change-shape and the scoped guard could not be trusted to reflect only this
  run's delta.

## Expectation

### Success scenarios

- S1 — (product owner, select + compose) Given a domain with detailed capabilities and a
  `set` profile, when /shape runs and the checkpoint is approved, then the kept capabilities
  are `active`, the selected (already-existing) functionalities are placed into slices, and
  the personas and journeys are created — all schema-valid, and no functionality is created
  or changed. Measure: each kept capability is `status: active`; each selected functionality
  already existed in the spine and is referenced by a slice; persona and journey records
  exist and validate; no functionality entry or doc changed; the stop-condition verdict
  reads held.
- S2 — (architect, grounding) Given the selection is drafted, when it is inspected, then each
  kept capability and selected functionality traces to a KB shelf or a recorded proposal.
  Measure: the shape manifest names, for every kept capability and selected functionality, a
  KB shelf or a proposal; none is ungrounded.
- S3 — (product owner, prune is soft) Given a capability is pruned, when /shape persists, then
  it is marked `deprecated` with a recorded decision and is not deleted. Measure: the pruned
  capability still exists with `status: deprecated`; a decision names the prune; nothing was
  removed.
- S4 — (reviewer, box and functionalities untouched) Given /shape runs, when the model is
  compared before and after, then no field of the profile changed and no functionality
  changed. Measure: the profile is byte-identical before and after; the before/after spine
  diff shows no change to any functionality or domain.
- S5 — (delivery lead, slices reference by id) Given the slices are drafted, when they are
  inspected, then each bundles functionalities by spine id and carries no plan. Measure: each
  slice has a name, an outcome, an acceptance_intent, and a non-empty `functionalities` list
  whose every `functionality_ref` resolves to a real spine functionality; no slice embeds
  content; no slice carries `order`, `effort`, or resolved `depends_on`.
- S6 — (planner, full coverage) Given the slices and the deferred bucket, when the selected
  functionalities are checked, then every one is placed. Measure: the union of all slices'
  `functionality_ref`s and the `_deferred` bucket equals the set of selected functionalities;
  none is missing from both.
- S7 — (product owner, every slice is a user-facing scaffold) Given the slices are drafted,
  when they are inspected, then each names at least one surface a persona can open and check,
  and that surface is a thin scaffold, named not designed. Measure: every slice carries a
  non-empty surface (name, persona, user_action) with no design content; `validate_shape.py`
  reports zero surface-less slices and no one-per-capability horizontal slice; every named
  surface is reached by a journey.
- S8 — (reviewer, the checkpoint + re-run) Given the bundle is ready, when the checkpoint is
  presented, then it shows the kept/pruned capabilities, selected functionalities, personas,
  journeys, and slices (with the deferred bucket) inline before any write; and a re-run adds
  no duplicates. Measure: each section is present in the checkpoint and no product-model file
  was written before approval — or, on the auto-pass path (a policy-listed shape), the gate
  resolves with no wait and the recorded auto-pass, the appended ledger line, and the diff
  summary stand in the approval's place; on a re-run, every persona/journey/slice id already
  existed.

### Done means

Paths are relative to the run's working root (`{stm_base}_shaping/shape/<domain>/`).
`persist-manifest.json` is the record the keyed persist script (`persist_shape.py`) writes
after applying the manifest's spine-delta in place on the live model (its contract:
`applied: true`, `written`, `skipped`, `status_flips`) — the spine merge: the capability
status flips, the slice index, and the persona/journey/decision refs; `guard-report.json` is
the captured `scoped_write_guard.py` output — the play always writes it, and its `ok` field is
the mechanical proof that no model path changed outside /shape's scope (the spine plus the new
slice/persona/journey/decision records), so the profile is untouched and no functionality or
domain moved.

- D1 — says: "the persist record exists — the spine merge (status flips, slice index,
  persona/journey/decision refs) was written in place on the live model through the keyed
  persist"
  check: { type: artifact_exists, path: "persist-manifest.json" }
- D2 — says: "the keyed persist stamped its applied-record field — the spine merge landed"
  check: { type: field_equals, file: "persist-manifest.json", field: "applied", equals: true }
- D3 — says: "the post-write scoped guard held — no model path changed outside /shape's scope"
  check: { type: field_equals, file: "guard-report.json", field: "ok", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the profile is `directional`, or a target capability is not detailed,
  at start. direction: halt and route to /understand to firm the profile and detail the
  capabilities before /shape runs. handoff: human.
- REC2 (F2) — trigger: /shape created a functionality, authored ICE, or wrote the profile.
  direction: strip the over-reach — remove the created functionality/ICE, revert the profile
  write; detailing and the box belong to /understand. handoff: autonomous.
- REC3 (F3) — trigger: a selected functionality or kept capability has neither a KB-shelf
  match nor a proposal. direction: ground it against the KB, or record a propose-kb-node
  proposal; never keep an invented selection. handoff: autonomous.
- REC4 (F4) — trigger: a capability edited beyond status, a reparent/rename, a
  create/delete, or a hard-deleted prune. direction: revert the out-of-scope mutation;
  /shape flips capability status only and prunes soft (`deprecated`). handoff: autonomous.
- REC5 (F5) — trigger: a persona/journey/decision/slice fails its schema, or a slice/journey
  reference does not resolve. direction: re-emit the failing record to conform, and fix the
  reference to point at a real spine functionality/persona/surface. handoff: autonomous.
- REC6 (F6) — trigger: a selected functionality is in neither a slice nor `_deferred`.
  direction: place it — add it to an appropriate slice or record it in `_deferred` with a
  reason — before persisting. handoff: autonomous.
- REC7 (F7) — trigger: a surface-less/horizontal slice, or a "whole UI at once" slice.
  direction: re-cut the slice vertically toward one surface a persona opens and checks, as a
  thin scaffold; fold or defer functionalities that serve no surface. handoff: autonomous.
- REC8 (F8) — trigger: /shape wrote surface design (wireframe, component, layout, visual).
  direction: strip the design to the surface's name, persona, and user action; design is
  /realize's UX lens. handoff: autonomous.
- REC9 (F9) — trigger: a journey is not a user journey on a surface, or a named surface no
  journey reaches. direction: rewrite the journey as the persona's steps on a named surface,
  and ensure every slice's surface is reached by at least one journey. handoff: autonomous.
- REC10 (F10) — trigger: a slice copied content, or carries `order`/`effort`/`depends_on`.
  direction: replace copied content with a spine `functionality_ref`, and strip the plan
  fields — /shape composes, /roadmap plans. handoff: autonomous.
- REC11 (F11) — trigger: a prune or material selection with no decision. direction: write the
  decision (ADR) for each before persisting. handoff: autonomous.
- REC12 (F12) — trigger: the selection delta was COMMITTED before the checkpoint gate
  resolved. direction: revert the working tree (`scoped_write_guard.py --restore`, empty
  allow set) and re-present the checkpoint; commit only after a human approves. handoff:
  human.
- REC13 (F13) — trigger: a scoped-guard violation — a functionality/domain/profile changed,
  a model path outside /shape's scope changed, or a re-run duplicated a record. direction: the
  guard's `--restore` already reverted the offending paths; re-run writing only /shape's scope
  (the spine status flips/slice index/refs, and the new slice/persona/journey/decision
  records), de-duplicating by stable id, after a human confirms the restore. handoff: human.
- REC14 (F14) — trigger: the run is about to close COMPLETED with the Done means unmet.
  direction: close HALTED with `exit_reason: stop_condition_unmet` and the unmet clauses
  named; fix the state — re-run the keyed persist, re-capture the scoped-guard report, or make
  the model-delta commit — and re-evaluate; the close stays HALTED until the verdict reads
  held. handoff: autonomous.
- REC15 (F15) — trigger: a crossing left no live-eval ledger line, or an auto-pass fired
  for a shape not listed `auto:` in the policy (or one carrying a blocking finding).
  direction: re-append the missing ledger line for the recorded crossing; when the
  auto-pass was unearned, re-run the gate as a live wait — render the approval prompt
  and wait for the typed response — before proceeding. handoff: autonomous.
- REC16 (F16) — trigger: the product-os tree is dirty at entry (uncommitted model edits
  present). direction: halt at pre-flight and ask for a clean model tree — commit or revert
  the pending model edits (or run the prior pipeline play to its close) — before /shape
  proceeds. handoff: human.
