# roadmap — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given the functionalities (features) that /shape has created under the product's
capabilities, decide the order to build them: rank the `active` and `proposed`
features into a build sequence where every active feature is sequenced ahead of
every proposed one, ordered within each tier by value (from the feature's ICE
goals and outcomes) and by dependencies, and write that rank as the `priority`
field on each feature node. /roadmap reads the model — ICE goals and outcomes,
node dependencies, the profile — to judge order, but writes only `priority`:
never ICE, never structure, never status, never the profile or lenses, never a
decision. Priority is comparative, so one run ranks the whole comparable set. One
human checkpoint approves the proposed ranking before anything persists.
Convention: a lower priority number means sooner — active features therefore take
the smaller numbers.

Pipeline position: **none**. /roadmap is a strategic, model-building play in the
shaping pipeline. It opens no delivery issue and cuts no branch, so the D2 rule
injects neither a `start-change` head nor a close sequence. It writes the
persistent product model directly. It runs after /shape, since features must
exist before they can be ranked.

### Constraints

- C1 — Ranks only functionality nodes (features) whose status is `active` or
  `proposed`. Capabilities and domains are never ranked; `deprecated` features are
  never ranked.
- C2 — Two-tier rule: every `active` feature is sequenced ahead of every
  `proposed` one — a proposed feature's priority can never beat an active one's.
  Within each tier, order by value (ICE goals and outcomes) and by dependencies.
- C3 — Writes only the `priority` field on feature nodes. Never creates, renames,
  reparents, or deletes a node; never changes status; never touches ICE, the
  product profile, lenses, personas, journeys, or decisions.
- C4 — Respects declared dependencies within the ordering: if A depends_on B, B is
  sequenced no later than A. A cross-tier active→proposed dependency is surfaced at
  the checkpoint as a model anomaly, never resolved by breaking the tier boundary.
- C5 — Every ranked feature has an ICE record to judge value from; a feature with
  no ICE is reported as un-rankable, never given a guessed priority.
- C6 — The result is a coherent ordering: every ranked feature gets an integer
  priority, internally consistent with the tier rule and the dependency rule.
- C7 — Additive and non-destructive: the run changes only the `priority` integer
  on ranked feature nodes; every other field and every other product-model file is
  byte-unchanged. Re-running re-ranks against the current model and rewrites only
  priorities that changed.
- C8 — Schema conformance: every node written still validates against product-os
  v1.
- C9 — Exactly one human checkpoint, presenting the proposed ranking — the two
  tiers, each ordered, with value and dependency reasoning, and any anomalies —
  before any priority is written. Nothing persists before approval.

### Failure conditions

- F1 — /roadmap wrote something other than `priority` on a feature node (created,
  renamed, reparented, or deleted a node, changed a status, or touched
  ICE/profile/lens/persona/journey/decision).
- F2 — A proposed feature was given a priority that beats an active one's.
- F3 — The ranking contradicts dependencies within a tier — a feature sequenced
  ahead of something it depends_on.
- F4 — A feature with no ICE was assigned a priority instead of being reported
  un-rankable.
- F5 — A capability, a domain, or a `deprecated` feature was assigned a priority.
- F6 — The priority assignment is invalid: a ranked feature has no integer
  priority, or the values aren't a coherent ordering.
- F7 — A node field other than `priority` changed, or a non-node product-model file
  changed during the run.
- F8 — A written node violates product-os v1 schema.
- F9 — A priority was persisted before the human approved the checkpoint.

## Expectation

### Success scenarios

- S1 — (product strategist, first ranking) Given the product has shaped features
  with ICE and no priorities yet, when /roadmap runs and the checkpoint is
  approved, then every active and proposed feature gets an integer priority and
  nothing else does. Measure: every functionality node with status `active` or
  `proposed` has a non-null integer `priority`; every domain node, capability node,
  and `deprecated` functionality node has `priority: null`; every written node
  validates against product-os v1.
- S2 — (product owner, tiers hold) Given a mix of active and proposed features,
  when /roadmap ranks them, then every active feature sits ahead of every proposed
  one. Measure: the largest priority number among active features is smaller than
  the smallest priority number among proposed features.
- S3 — (architect, dependencies) Given features with depends_on links, when
  /roadmap ranks, then within each tier no feature is placed ahead of one it
  depends_on, and any active→proposed dependency is flagged. Measure: for every
  pair where A depends_on B and both share a tier, priority(B) ≤ priority(A); for
  every active A that depends_on a proposed B, the checkpoint anomaly list names
  that pair.
- S4 — (QA engineer, un-rankable) Given a feature node with no ICE record, when
  /roadmap runs, then it is reported un-rankable and gets no priority. Measure: the
  feature with a null `ice_ref` appears in the run's un-rankable report and its
  `priority` is still null after the run.
- S5 — (product owner, re-run non-destructive) Given /roadmap already ran, when it
  runs again, then on an unchanged model nothing changes, and on a changed model
  only affected priority numbers change. Measure: on an unchanged model every
  product-model file is byte-identical before and after; on a changed model the
  only field that differs in any node file is `priority`, and no non-node
  product-model file changed.
- S6 — (reviewer, the checkpoint) Given the ranking is ready, when the checkpoint
  is presented, then it shows both tiers in order with reasoning and anomalies,
  before any write. Measure: the checkpoint lists the active tier ordered, the
  proposed tier ordered, each item's value/dependency reasoning, and the anomaly
  list; no node's `priority` changed before approval.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a write touched something other than a feature node's
  `priority`. direction: revert the out-of-scope write; /roadmap writes only the
  priority field on feature nodes. handoff: autonomous.
- REC2 (F2) — trigger: a proposed feature's priority beats an active one's.
  direction: recompute the ranking with the tier rule enforced — all active before
  all proposed — before persisting. handoff: autonomous.
- REC3 (F3) — trigger: within a tier, a feature is ranked ahead of a feature it
  depends_on. direction: re-sort that tier so dependencies precede dependents; a
  cross-tier active→proposed conflict is surfaced at the checkpoint, never resolved
  across the boundary. handoff: autonomous.
- REC4 (F4) — trigger: a feature with no ICE was given a priority. direction: drop
  the guessed priority and move the feature to the un-rankable report. handoff:
  autonomous.
- REC5 (F5) — trigger: a capability, domain, or deprecated feature received a
  priority. direction: clear that priority back to null; only active/proposed
  features are ranked. handoff: autonomous.
- REC6 (F6) — trigger: the ordering is invalid (a ranked feature has no integer
  priority, or the values are incoherent). direction: recompute a complete,
  coherent integer ranking over the ranked set before persisting. handoff:
  autonomous.
- REC7 (F7) — trigger: a node field other than `priority` changed, or a non-node
  product-model file changed. direction: restore the changed content and re-apply
  only the priority updates, after a human confirms the restore. handoff: human.
- REC8 (F8) — trigger: a written node fails product-os v1 schema validation.
  direction: re-emit the failing node to conform to its schema before the play
  completes. handoff: autonomous.
- REC9 (F9) — trigger: a priority was persisted before the checkpoint was approved.
  direction: revert the premature write and re-present the checkpoint; persist only
  after the human approves. handoff: human.
