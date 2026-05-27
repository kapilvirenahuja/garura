# Epic Rules

Seven rules for intent epics. Every skill that creates, refines, or validates epics loads this file and enforces these rules against its output.

Consumers: `generate-intent-epics`, `validate-intent-epics`, `prepare`, `feature-steward`, `tech-designer`.

The schema these rules apply to is `core/components/memory/standards/schemas/intent-epic.yaml`. Field names in this file refer to that schema.

## Tenet (non-negotiable): Epics are written for humans to read

This is a tenet, not a guideline. It is non-negotiable. It overrides every rule below when they conflict. An epic that violates this tenet is rejected — no exceptions, no warnings, no "we'll clean it up later."

Every epic is read by a human first — a product owner, a reviewer, an engineer picking it up. If a human cannot open the file and understand what is being built, for whom, and why, the epic has failed before any tool touches it. This is the bar. Nothing else matters until this bar is cleared.

Binding consequences:

- Every sentence in `intent.goal`, `intent.constraints`, `intent.failure_scenario`, every `expectations.success_scenario`, every `expectations.recovery`, and every `provenance.business_rules` entry is written in plain language a non-technical reader can follow. No field-name soup, no schema jargon, no acronym walls without expansion.
- Lead with the user and the outcome — what changes for them, what they see, what they can now do. File paths, component names, framework identifiers, and schema field names never appear in the lead of any sentence inside the epic.
- An epic that requires a glossary to read is wrong. Rewrite it before approval. Do not approve and "explain in review" — that is a violation.
- When the same idea can be said simply or technically, say it simply. Always.
- A reviewer who approves an epic that violates this tenet has themselves violated the tenet. The approval does not stand.

The validator catches what it can mechanically — taste words, jargon density, acronym usage. The rest is the reviewer's hard gate. This tenet is not subject to "judgement calls in edge cases." Edge cases default to rewrite, not accept.

## Rule 1: Every epic must deliver end-to-end testable user value

An epic is a vertical slice a user can interact with and a reviewer can verify end to end. It is never a horizontal layer like "set up the database" or "build the API."

The subject of `intent.goal` must be a person — a named persona or a canonical role (user, admin, developer, operator). Not a subsystem, agent, service, pipeline, validator, or store.

The `then` of every `expectations.success_scenario[]` entry must describe something a reviewer can observe — a screen, a state change the user sees, an event the user triggers. Internal data outputs (a JSON written, a row persisted, a score computed) are not observable outcomes.

**Correct:** "Engineering leader sees their five-pillar leader view within 2 seconds of opening it."
**Incorrect:** "The analyzer produces a structured scorecard."

## Rule 2: Each epic is owned by exactly one domain module

An epic sits inside one domain — User Management OR Payments OR Commerce — never across two. Cross-module needs are expressed by linking to another epic via `connections.before_chain.intents[]`, not by expanding the epic's scope.

`domain` carries exactly one value. The epic's goal, constraints, and success scenarios all belong to that one domain.

**Exception.** When the product scope explicitly names a cross-cutting capability (e.g., "Platform Configuration" spanning pricing, categories, and flags), the epic may cross domain boundaries. In that case the epic must say so in `provenance.source.quote` by naming the cross-cutting scope item. Inferred cross-cutting is not allowed — only an explicit product-scope item counts.

## Rule 3: Every epic ships in two implementation parts — mocks first, then real integration

Every epic forces two delivery parts. Part one ships the full user-facing flow with mocks for external dependencies — mock payment gateway, stub notification service, hardcoded data. Part two replaces every mock with the real integration.

This is mandatory, not optional. An epic that says "no mocks needed" is either wrong about its dependencies or is being scoped as part two only. An epic that ships mocks with no part two is incomplete.

Both parts must be visible on the roadmap:

- The mock-first epic sets `provenance.uses_mocks: true` and `provenance.demock_epic_ref: <id of the integration epic>`.
- The integration epic is a separate epic in the same roadmap, and the mock-first epic's `connections.after.intents[]` lists it.

A reviewer scanning the roadmap should be able to trace every mock to the epic that retires it. A mock without a retirement epic is a roadmap gap.

## Rule 4: Strictly follow the schema

Every epic file must match `intent-epic-schema.yaml` exactly. The four sections appear in this order:

1. `intent` (`goal`, `constraints`, `failure_scenario`)
2. `expectations` (`vetted`, `success_scenario`, `recovery`)
3. `connections` (`before_chain`, `after`, `peers`, `dependency_check`)
4. `provenance` (last section — `source`, `appetite`, `business_rules`, `kb_source`, `uses_mocks`, `demock_epic_ref`, `foundation_investment`)

Identity (`id`, `domain`, `capability`) sits above the four sections at the top of the file.

No top-level keys may exist outside this shape. Specifically banned (legacy): `problem_statement`, `hypothesis`, `assumptions_requiring_validation`, `in_scope`, `anti_goals`, `must_not_break`, `cross_cutting_justification`, top-level `constraints`, top-level `failure_conditions`, top-level `intents`, top-level `expectation`, top-level `dependencies`, top-level `depends_on`, top-level `appetite`.

`expectations.recovery` carries exactly one entry per `intent.failure_scenario` entry — no more, no fewer.

`expectations.vetted.status` must equal `approved` for the epic to pass validation. `pending` or `not_generated` is rejected.

## Rule 5: Success scenarios must be testable as true or false

Every `expectations.success_scenario[].then` and every `expectations.success_scenario[].measure` is binary — a reviewer can execute it and get pass or fail, with no judgement call in the middle.

Banned words in `then` and `measure`: `should`, `smooth`, `intuitive`, `seamless`, `better`, `user-friendly`, `feels`. These describe taste, not state.

Required shape in `measure`: a number, a percentage, a count, a duration, a presence/absence check, or a named event observed. "p95 under 500ms," "100% of loads render the five-pillar layout," "the Stripe webhook payment.succeeded is received within 5s of submit" — all valid. "The view is smooth" — not valid.

**Correct:** "Given a registered user, when they enter valid credentials, then they see the profile dashboard within 2 seconds." Measure: "Profile dashboard renders within 2 seconds on p95 of authenticated loads."
**Incorrect:** "The login experience should be intuitive." Measure: "Users find it easy."

## Rule 6: Every epic must declare how its dependencies are checked

Dependencies are declared via `connections.before_chain.intents[]` — a list of epic ids that must be delivered before this epic can start.

Two things are mandatory:

- **Explicit listing.** Every epic this one depends on appears in `before_chain.intents[]`. No implicit ordering. If E3 assumes E1 is done but does not list E1, the dependency is invisible.
- **Dependency check.** `connections.dependency_check` is a non-empty string stating how a reviewer or the pipeline verifies the listed dependencies are satisfied before this epic begins. Examples: "All `before_chain` epics carry `expectations.vetted.status: approved` and `post_implementation.status: delivered`." Or: "The leader-role rendering from EPIC-XP-F002-002 must respond under 1 second on either deployment shape."

No circular dependencies. If E1 depends on E2 and E2 depends on E1, the validator rejects both — they should be merged or re-scoped, not chained.

## Rule 7: Foundation epics are marked, sequenced first, prioritised P1

A foundation epic is shared infrastructure that two or more other epics depend on — auth, database setup, CI/CD pipeline, design system. It does not deliver direct user value on its own but unblocks epics that do.

An epic is a foundation epic when it has two or more incoming `before_chain` references from other epics. Foundation epics set `provenance.foundation_investment: true`, land in the earliest delivery bucket, and carry P1 priority. Without that, downstream epics cannot begin and the whole roadmap stalls.

The validator flags any epic with two or more incoming `before_chain.intents[]` references that does not carry `provenance.foundation_investment: true`.

## Schema fields these rules depend on

| Rule | Field | Notes |
|------|-------|-------|
| 1 | `intent.goal` | Subject is a persona or canonical role; expectations.success_scenario[].then is observable |
| 2 | `domain` | Exactly one value; cross-cutting requires explicit product-scope quote in provenance.source.quote |
| 3 | `provenance.uses_mocks`, `provenance.demock_epic_ref`, `connections.after.intents[]` | Mock-first epics name their integration epic; integration epic appears in `after` |
| 4 | (whole schema) | Four-section order; no legacy keys; recovery 1:1 with failure_scenario; vetted.status == approved |
| 5 | `expectations.success_scenario[].then`, `expectations.success_scenario[].measure` | Binary language, no taste words, measure carries a number/event/presence check |
| 6 | `connections.before_chain.intents[]`, `connections.dependency_check` | Explicit listing; non-empty check string; acyclic across the epics directory |
| 7 | `provenance.foundation_investment` | Required `true` when incoming `before_chain` count ≥ 2 |

## Relationship to project profiling

- PP-6 (Delivery Ambition) drives how aggressively Rule 3 is applied. A POC mocks heavily and may defer integration epics; a market-ready product must ship the integration epic alongside the mock epic.
- PP-3 (Persona Complexity) influences epic decomposition — a multi-persona product may split a capability into per-persona epics, each still owned by one domain (Rule 2).
- NFR dimensions shape the contents of `intent.constraints` but do not change the rules above.
