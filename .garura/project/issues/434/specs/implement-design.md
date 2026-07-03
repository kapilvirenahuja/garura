# /implement (E9) — design locked pre-build (#434)

Locked in conversation with Kapil, 2026-06-11. Source inputs:
`context/ProductOS_Command_Model.md`, `realignment-plan.md` (decisions 9, 10,
11, 12), `schemas-v1/epic.yaml` (v2), old plays `garura:implement` /
`garura:prepare` (deprecated, Phase E reference), `fix-bug` (consumer-play
template).

## Pipeline position — START only, no close

- `position: start` — start-change injected at the head: one issue per epic
  (decision 12), branch, STM workspace, epic status → in_delivery.
- The end sequence (commit → propose → review → merge) does NOT belong to
  /implement. /validate (E10) must accept the work first; an epic is deleted
  on merge (epic.yaml fill rules), and deletion before validation would make
  "delivered" mean "unvalidated".
- /implement "done" = all specs passing. FULL done (close + merge + epic
  deletion) happens only after /validate accepts.
- SUPERSEDED same day: the epic pipeline grew a third play. It is now
  implement (start) → validate (MIDDLE — deep agent-side gate, absorbs
  audit concerns) → /launch (END — HITL: UAT deploy, manual tests from
  user_check + acceptance, evidenced human sign-off, then the close
  chain). The epic still only merges — and is deleted — after acceptance;
  the acceptance is now the human's, on the live system.

## The box model

- /grill draws the RULES of the box: the epic carries everything /implement
  may know and touch — outcome, user_check, functionality_refs, context,
  acceptance, order. The epic is the TIGHTEST box implement works within.
- /implement draws the ACTUAL box — the build — and never crosses the epic's
  boundaries. No scope outside the epic, ever.
- Grounding = product model + shape (ICE via functionality_refs, the slice's
  five lenses, the repository). It does not cross that boundary either: no KB
  invention, no fresh requirements.

## STM breakdown (absorbs /groom and old /prepare)

- /implement builds the STM workspace itself: stories, tests, implementation
  targets — test-first (decision 10). All STM-only (decision 9): produced for
  the run, regenerated on demand, never hoarded in product-os.

## What carries over from old garura:implement

- KEEP: the spec-separation principle. Test-writer and code-builder both work
  from the spec; neither sees the other's output; the builder NEVER sees
  tests. (Pairs with the standing scenario-compartmentalization rule.)
- DROP: eval encryption-at-rest. Isolation is by SUB-AGENT instead — evals
  are authored and run in a sub-agent the builder never talks to.
- DROP: the milestone/gate node taxonomy, the DAG walk, the multi-mode judge.

## Execution core (replaces the old prescribed loop)

1. Set up STM.
2. Set up evals (in an isolated sub-agent).
3. Build–test–judge ORDERING is left to the model/agent — the play does not
   prescribe when to test; it prescribes what must be true at the end.

## Plan tracking through project-orchestrator (added at intent review)

- ALL work management flows through project-orchestrator. The epic breakdown
  (stories/tests/targets) is published to the epic's tracked issue as soon as
  it exists, and every piece's state (planned / in progress / done) is kept
  current there for the life of the run — the plan must survive a lost
  session, never live only in conversation.
- Config-governed, like the evidence rule (on by default). (Kapil confirmed
  this reading.)
- The published plan is the WORKING SPINE, not just a record: stories → tasks
  → tests with their dependencies (a DAG). The executing agent re-anchors to
  the tracked plan during the build so execution cannot drift from it;
  deviations become plan updates through project-orchestrator, never silent
  forks.

## Hard scripting pass (Kapil, at the piece-map checkpoint)

- "Inference is for planning and reasoning and orchestrating. The act part —
  if it can be scripts, please script it."
- Test runs, lint, build, gate execution = scripts that capture results to
  files. The verifier agent judges captured results (steelman); it does not
  run the mechanics.
- Issue ops are already CLI-backed (manage-issue → platform-adapter → gh);
  project-orchestrator remains the dispatcher per the plan-tracking directive,
  but composes nothing — a script renders the plan text.
- Decisions taken (presented, unobjected, both reversible): (1) implement
  flips the epic to in_delivery + writes issue_ref via surgical script right
  after the injected start step (epic schema assigns this to /start;
  start-change predates epics — can move later); (2) evidence-only self-commits
  stay allowed under evidence config; the WORK is never committed by this play.

## Done bar + anti-reward-hacking

- Done when ALL specs pass.
- The model must not be able to reward-hack its way there: evals, validations,
  and the judge are STEELMAN — adversarial, trying to refute "it works", in
  the same spirit as /grill's steelman grilling. Eval authorship and judging
  stay compartmentalized from the builder.

## Retirements when this lands

- `garura:implement` — direct successor.
- `garura:prepare` — its breakdown work is absorbed; only remaining consumer
  is old validate, which dies at E10. Retire now.
- `start-feature-planning` — superseded by start-change + the STM breakdown
  phase. Retire in the same sweep.
- NOT this play's kill: old `validate` (E10), old `design`/`define`/`enhance`
  (shaping group, already superseded).
