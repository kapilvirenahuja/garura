# Builder Isolation

The canonical rule for the three-element Intent model and compartmentation contract.
Consumed by any agent or skill that authors, resolves, or validates an intent.

## The three-element Intent model

Intent is exactly three things:

- **goal** — one sentence. Must pass the two-implementations test: if you described two
  completely different implementations, would the goal still be satisfied by both? Yes →
  the goal is implementation-agnostic and correctly formed. No → it contains method, not
  intent; rewrite it.
- **constraints** — qualities of the outcome. Written in business language, NFR-shaped
  (non-functional requirement shaped): boundaries, limits, and rules on what acceptable
  output looks like. Never implementation patterns, never agent or skill names, never
  steps.
- **failure_conditions** — binary, observable, post-output checks. Each one is a state
  in the finished artifact that, if found by a validator, constitutes failure. Not events,
  not process steps.

Nothing else lives in Intent. Success scenarios belong to the Expectation artifact.
Recovery entries belong to the Expectation artifact. Intent is the triple and only the triple.
Connections is conceptually part of Intent but lives on a different surface; its design is the subject of a future issue (TBD).

## The compartmentation contract

Who receives what:

| Audience         | Receives                                       | Source                                      |
|------------------|------------------------------------------------|---------------------------------------------|
| Builder agent    | goal + constraints + Context bundle            | `intent.yaml` + assembled Context           |
| Validator agent  | failure_conditions + vetted `success_scenarios` | `intent.yaml` + approved `expectation.yaml` |

The builder never receives success_scenarios under any circumstance. The rule is: **the builder cannot teach to a test it cannot see.**

Routing this way keeps the builder focused on making the goal true within the constraints,
and keeps the validator focused on checking the objective exit criteria. When a builder
sees the scenarios it is supposed to satisfy, it optimizes toward the test rather than
toward the goal. The compartmentation contract prevents that.

## HITL configuration governs Expectation vetting

Per-play `hitl` configuration in `.garura/core/config.yaml` decides whether a human
approves the generated Expectation or the system auto-approves and records it. There is
no global "human must approve" rule — the decision is per-play.

The two current concrete instances are `craft-ice.hitl` and `create-play.hitl`. Each
play sets its own policy. When `hitl` is on, the generated Expectation lands in a
`pending` state and nothing downstream consumes it until a human sets it to `approved`.
When `hitl` is off, the play auto-approves per its configured policy and records the
decision. Nothing downstream consumes a `pending` expectation in either mode.

## Constraint-vs-failure-condition decision rule

Apply this test to any candidate item: *"Would knowing this change how the builder writes code?"*

- **Yes** → it is a **constraint**. Embed it in the Context bundle the builder receives.
- **No** → it is a **failure condition**. Route it to the Expectation artifact; the validator
  catches it post-output.

**Worked example — "Unit test coverage must stay above 90%"**

Would the builder write different code if it knew this rule? Possibly — but only by
gaming coverage metrics (adding meaningless tests, avoiding complex branches). It would
not write better code. The builder's job is to implement the feature correctly within
the architectural boundaries. Coverage is a quality gate applied to the finished output,
not a signal that changes how the builder structures implementation. Therefore: coverage
threshold is a **failure condition**, not a constraint. The validator checks it after the
output exists. The builder never sees the number.

**Second example — "The output must not use deprecated API endpoints"**

Would the builder write different code if it knew this? Yes — it would choose non-deprecated
endpoints when selecting from the available options. This knowledge directly shapes
implementation decisions. Therefore: this is a **constraint**, and it belongs in the Context
bundle the builder receives.

The dividing line is whether the item shapes choices during construction (constraint) or
checks results after construction is complete (failure condition).

## Provenance

- Source article: `~/cto/StormCaller/Content/articles/standalone/an-intent-is-three-things-the-goal.md`
- Originating issue: #388
