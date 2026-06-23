# next — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Recommend what to do next on the product — read the product model's current state, derive
every action that is runnable or blocked, and present one next-best-action plus a ranked
list, fitted to the person running.

The product model is the single source of "what could be done": slice status
(proposed → planned → realized), lens presence (the six realize lenses per slice), epic
status (ready → in_delivery → validated / fix_required → delivered) with epic
dependencies, the product profile state (directional → set → locked), and the roadmap's
order and slice dependencies. There is no separate backlog, sprint plan, or work queue
anywhere — and this play must not invent one.

The person running is identified from their version-control identity, and their work
fit is computed from their actual work history — the kind of files their commits touch
(product model, lens/design, code by stack, tests, operations) — classified by lexical
matching against rules held in the knowledge base's work-intelligence shelf, never by
model inference. The shelf is the intelligence that grows: mapping rules, fit rules, and
judgment notes accumulate there over time.

The output is advice, never action: one next-best-action and a ranked list of
alternatives (parallel lanes included, so several people or agents can each pick a
different entry), every entry carrying the exact command and a plain-language
explanation of why it is recommended and what it unblocks.

### Constraints

- C1 — Recommendations derive solely from the product model (slices, lenses, epics,
  profile, roadmap order and dependencies). No separate backlog or project store is
  consulted, and none is created.
- C2 — Recommend only: the play never modifies the model, never creates work items, and
  never launches another play. Multiple people and parallel agents may act on its output
  independently.
- C3 — Every entry names the exact command to run and explains, in plain language, why
  it is recommended and what it unblocks.
- C4 — Output is one next-best-action plus a ranked list — at most 11 entries total,
  including the next-best-action.
- C5 — A model inconsistency that blocks downstream work (e.g. a slice stamped realized
  with a lens missing) is a repair action, and repair takes the next-best-action slot
  when present.
- C6 — Cross-slice look-ahead is permitted, gated only by the roadmap: slice order and
  declared dependencies decide which future-slice actions may appear as parallel lanes.
- C7 — Operator fit derives from the person's identity and their actual work history,
  applied through rules held in the knowledge base. When history is too thin to trust,
  fit weighting is skipped and the output says so.
- C8 — Candidate derivation is deterministic: the same model state always yields the
  same candidate set. Judgment applies only to ranking and explanation.
- C9 — Coverage spans the full loop: strategy (vision, understand, shape, roadmap),
  realization (the six lenses), grilling, execution (implement, validate, launch),
  learning (enrich), and strategy refresh once everything is delivered.
- C10 — The play leaves no working artifacts behind. Its only durable product is the
  recommendation presented to the user (plus, when evidence recording is on, the
  evidence record). All transient working files written during the run are deleted
  once the recommendation has been verified and presented. The evidence record is
  never deleted.

### Failure conditions

- F1 — A recommended action's preconditions don't actually hold — the operator runs it
  and it halts at its own gate.
- F2 — A blocking inconsistency exists in the model but isn't detected and reported;
  downstream work stays silently stuck.
- F3 — The play mutates state or launches a play.
- F4 — A work-fit profile is asserted from insufficient history instead of being skipped
  with a notice.
- F5 — The output is a dump: over the cap, or entries without plain-language
  explanation.
- F6 — A genuinely runnable lane is missed — the candidate set disagrees with what the
  readiness gates over the model actually permit.
- F7 — Working files survive the run, lingering on disk as a stale recommendation after
  the model moves on.

## Expectation

### Success scenarios

- S1 — (builder, product mid-delivery) Given a slice stamped realized but missing one
  lens, with ready epics queued behind it, then the repair (the missing lens play) takes
  the next-best-action slot and every blocked epic appears in the list with the missing
  lens named as its blocker. Measure: the NBA is the repair action AND each blocked
  entry names its blocker — checkable from the output alone.
- S2 — (implementer, rich work history) Given two runnable epics — one matching the
  operator's dominant work type, one not — and enough history to classify the operator,
  then the matching epic ranks above the non-matching one and its explanation states the
  fit reason. Measure: ranking order reflects fit, and the fit reason is present in the
  entry's explanation.
- S3 — (new contributor, thin history) Given the running person's history is below the
  trust threshold, then the output states fit weighting was skipped and ranks on model
  state alone. Measure: the skip notice is present, and two runs on the same model state
  produce the identical list.
- S4 — (founder, fresh start) Given no product model exists yet, then the
  next-best-action is /vision, explained as a cold start. Measure: the NBA equals
  /vision.
- S5 — (product owner, everything delivered) Given all slices realized and all epics
  delivered, then the play recommends the close of the loop — learning if pending, then
  strategy refresh (re-shaping from deferred functionality, re-planning the roadmap).
  Measure: the list contains a learning or strategy-refresh action with a plain-language
  explanation, not "nothing to do".
- S6 — (team running parallel agents) Given slice 1 mid-execution and slice 2 planned
  with its roadmap dependencies satisfied, then the list includes starting slice 2's
  lens work as a parallel lane alongside slice 1's next step. Measure: a slice-2 action
  appears, and its explanation cites the roadmap ordering that permits it.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a recommended command would halt at its own gate when re-checked.
  direction: re-derive candidates from current model state and regenerate the output; if
  the play's rules disagree with the target play's gate, surface the divergent rule.
  handoff: autonomous.
- REC2 (F2) — trigger: downstream work halts on an inconsistency the run reported
  nothing about. direction: record the missed inconsistency class, extend the
  consistency scan, re-issue recommendations. handoff: human.
- REC3 (F3) — trigger: anything in the model changed, or a play was launched, during the
  run. direction: halt immediately and surface exactly what changed — nothing is
  auto-reverted. handoff: human.
- REC4 (F4) — trigger: fit reasoning appears in the output while history is below the
  trust threshold. direction: strip fit weighting, regenerate ranking on model state
  alone, add the skip notice. handoff: autonomous.
- REC5 (F5) — trigger: more than 11 entries, or an entry with no explanation. direction:
  re-rank, cut to the cap, write the missing explanations. handoff: autonomous.
- REC6 (F6) — trigger: the readiness gates admit an action the candidate set lacks.
  direction: re-run derivation; if the action is still missing, the derivation rules are
  incomplete — record the gap. handoff: autonomous.
- REC7 (F7) — trigger: working files remain after the run completes. direction: delete
  the working folder; the already-presented recommendation is the only product. handoff:
  autonomous.
