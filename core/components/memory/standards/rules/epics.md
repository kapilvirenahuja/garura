# Epic Rules

Canonical rules governing how intent epics are structured, scoped, and delivered. Every skill that creates, refines, or validates epics loads this file and enforces these rules against its output.

Consumers: `generate-intent-epics`, `validate-intent-epics`, `prepare-epic`, `feature-steward`, `tech-designer`.

## Rule 1: Vertical Slice Delivery

**Every epic must deliver end-to-end testable user value.**

An epic is not a horizontal layer (e.g., "set up the database" or "build the API"). It is a vertical slice through the stack that a user can interact with and a reviewer can verify. When the epic is complete, a user should be able to perform a meaningful action and see a meaningful result.

Mocks are acceptable for phased delivery — an epic can mock external dependencies or downstream services — but the user-facing flow must be complete. A mock payment gateway is fine if the checkout flow works end to end. A database schema with no UI is not a vertical slice.

**Correct:** "User can register, log in, and see their profile dashboard"
**Incorrect:** "Set up user database schema and API endpoints"

### The actor test

The `intent` field's grammatical subject must be a human — a persona from `personas.md` or a canonical role (user, admin, developer, operator). If the subject is a subsystem, agent, or internal component, the epic is horizontal and must either be rewritten or merged into a parent vertical.

**Correct actors:** prosumer user, admin, developer, operator, reviewer, team lead, compliance officer, stakeholder
**Incorrect actors (never valid subjects of an epic `intent`):**
- `analyst`, `improver`, `judge`, `scorer`, `orchestrator`, `dispatcher`, `worker`
- `pipeline`, `parser`, `validator`, `resolver`, `matcher`, `compiler`, `transformer`
- `agent` (when used as "the {adjective} agent")
- `skill`, `plugin`, `adapter`
- `catalog`, `store`, `vault`, `ledger`, `index`, `registry`, `database`, `schema`
- `system`, `service`, `module`, `handler`, `endpoint`, `queue`, `cache`, `worker pool`
- `backend`, `frontend`, `infrastructure`

### The outcome test

The `then` clause of the primary success scenario must describe an **observable** change in the user's state — something a reviewer can point at and say "this happened." Internal data outputs (JSON schemas, parsed tuples, normalized scores) are NOT observable outcomes. They are implementation details that should roll up into a parent epic whose outcome IS user-observable.

**Correct outcomes:**
- "user sees their profile dashboard within 2 seconds"
- "Stripe webhook payment.succeeded is received within 5s of checkout submit"
- "admin sees the newly-added vital in the next hypothesis creation form"
- "user wakes up to a Crypt view showing 18 completed cycles with accepted / rejected / skipped statuses"

**Incorrect outcomes (silent implementation):**
- "the analyst produces a structured problem list" → internal data, not observable
- "the plugin returns normalized scores" → internal data, not observable
- "the trace row is written with the chained hash" → implementation detail
- "the verdict is computed and persisted" → implementation detail

### Enforcement

`validate-intent-epics` runs TWO checks on every epic:

1. **Subsystem actor detection.** Grep the `intent` field for any of the words in the component disallow-list above as the grammatical subject. Any match is a `subsystem_actor` violation.

2. **Observable outcome detection.** Grep the primary success_scenarios[0].then clause against a human-state disallow-list: `produce`, `return`, `emit`, `write`, `persist`, `compute`, `normalize`, `parse`, `validate` (as the terminal verb — these describe system behavior, not user-observable change). Allow them only when the scenario ALSO names a user action that observes the outcome. Any violation is `non_observable_outcome`.

Both checks are blocking. An epic that fails either is NOT an epic; it is a horizontal layer that must be merged into a parent vertical (via `configure-capabilities`'s vertical-vs-component classification) or dropped from the top-level list.

## Rule 2: Single Module Scope

**Each epic is owned by exactly one domain module.**

An epic sits within User Management OR Payments OR Commerce — never across multiple modules. Cross-module dependencies are expressed via `depends_on` in the epic schema, not by expanding the epic's scope.

This aligns with the module boundaries defined in `knowledge/domain-taxonomy/`. If the domain taxonomy defines User Management and Payments as separate modules, an epic cannot span both. It can depend on features from another module, but the epic's scope, ownership, and success criteria belong to one module.

**Correct:** "Payments epic depends on User Management epic for authenticated sessions"
**Incorrect:** "Epic covers user registration AND payment processing"

**Enforcement:** `validate-intent-epics` rejects epics whose `domain` spans more than one value or whose `in_scope` items reference features from multiple domains.

### Exception: Explicitly Scoped Cross-Cutting Capabilities

When the product scope explicitly names a cross-cutting capability (e.g., "Platform Configuration" covering pricing bands, category management, and feature flags across multiple modules), the scoping agent MAY create a horizontal epic with a `cross_cutting_justification` field explaining:
1. Which product scope item this epic owns
2. Why single-module-scope does not apply (the capability is explicitly cross-cutting in the product vision)
3. Which module boundaries it crosses and how ownership is delineated

This exception applies ONLY when the cross-cutting capability is an explicit, named item in the product scope — not when the agent infers cross-cutting needs. The product vision is the authority; the rule is the default.

## Rule 3: Mocks as Phased Delivery

**Every mock introduced must be replaced in a subsequent epic.**

When an epic uses mocks (mock payment gateway, stub notification service, hardcoded data), the roadmap must include a de-mocking epic that replaces mocks with real integrations. Mocks are a delivery strategy, not a permanent state.

The roadmap should make de-mocking visible — a reviewer looking at the roadmap should be able to trace every mock to the epic that replaces it. If a mock has no planned replacement, either the mock is actually the final implementation (rename it) or the roadmap has a gap.

**Correct:** "Epic F2 mocks payment gateway → Epic F5 integrates Stripe"
**Incorrect:** "Epic uses mock data" (with no follow-up epic to replace it)

## Rule 4: Scope Boundaries

**Every epic must define `in_scope`, `anti_goals` (out of scope), and `must_not_break`.**

These three fields from the epic schema are not optional. They prevent scope creep, make review decisions tractable, and protect existing functionality.

- **in_scope** — what this epic explicitly delivers. Be specific about capabilities, interactions, and outputs.
- **anti_goals** — what is explicitly excluded. Name the natural scope creep risks. If reviewers will ask "does this include X?", put X in anti_goals.
- **must_not_break** — existing capabilities this epic cannot regress. For foundational epics with no predecessors: "None at this stage — foundational epic."

Common scope creep patterns to guard against:
- "While we're touching auth, let's also add..." — if it's not in_scope, it's a separate epic
- "We need this for the demo" — if the demo is a separate epic, the feature belongs there
- "It's just a small change" — small changes that cross module boundaries are still cross-module

**Enforcement:** `validate-intent-epics` rejects epics with empty / missing `must_not_break`, and epics whose `anti_goals` section reads as an afterthought (fewer than 1 concrete entry).

## Rule 5: Success Verifiability

**Success scenarios must be binary testable by a reviewer.**

The `success_scenarios` field uses given/when/then format. Each scenario must be something a reviewer can execute and get a definitive pass or fail. No ambiguity.

**Correct:** "Given a registered user, when they enter valid credentials, then they see their profile dashboard within 2 seconds"
**Incorrect:** "The login experience should be smooth and intuitive"

The word "should" is a red flag. Success scenarios use "then [observable outcome]" — something you can point to and say "this happened" or "this did not happen."

**Enforcement:** `validate-intent-epics` greps each `success_scenarios[].then` for the words `should`, `smooth`, `intuitive`, `seamless`, `better` — these produce `should_language` violations.

## Rule 6: Dependency Discipline

**`depends_on` uses epic IDs only. No circular dependencies.**

Epic dependencies are explicit — they reference other epic IDs from the same roadmap. Circular dependencies (E1 depends on E2, E2 depends on E1) are scoping failures, not dependency chains. If two epics are mutually dependent, they should be merged or re-scoped.

No implicit ordering. If Epic E3 assumes Epic E1 is complete but doesn't declare `depends_on: [E1]`, the dependency is invisible and the execution order is fragile.

**Correct:** `depends_on: [EPIC-user-login-001, EPIC-user-registration-001]` — explicit, traceable, acyclic
**Incorrect:** "This should be done after the auth epic" (implicit, not in schema)

**Enforcement:** `validate-intent-epics` runs a cycle check across the epics directory. Any cycle is a `dependency_cycle` violation and fails the batch.

## Rule 7: Foundation Investments

**Foundation epics must be marked `foundation_investment: true`, placed in the earliest bucket, and given P1 priority.**

A foundation epic is shared infrastructure that enables multiple other epics — authentication, database setup, CI/CD pipeline, design system. It doesn't deliver direct user value but is a prerequisite for epics that do.

Marking criteria for `foundation_investment: true`:
- The epic enables 2+ other epics (has ≥2 incoming `depends_on` references)
- Without it, those downstream epics cannot begin
- It delivers infrastructure, not user-facing features

Foundation epics go in the earliest bucket with `P1` priority because nothing else can start until they're done. Delaying foundation work creates a bottleneck that delays the entire roadmap.

**Enforcement:** `validate-intent-epics` flags any epic with ≥2 incoming depends_on references that lacks `foundation_investment: true` as a `missing_foundation_flag` violation.

## Relationship to Domain Taxonomy

Rule 2 (Single Module Scope) aligns with the module boundaries defined in `knowledge/domain-taxonomy/`. The taxonomy defines which modules exist (user-management, payments, commerce, search, personalization, plus STM-research-sourced domains when the pipeline extends the catalog). Epics respect these boundaries — one epic per module.

## Relationship to Project Profiling

- PP-6 (Delivery Ambition) influences phasing and how aggressively mocks are used (Rule 3). A POC (PP-6 = 1) will mock heavily; a market-ready product (PP-6 >= 3) should minimize mocks.
- PP-3 (Persona Complexity) influences epic decomposition — a multi-persona product may need persona-specific features within an epic, but the epic still stays within one module (Rule 2).
- NFR dimensions influence which features appear in epics via agent reasoning over the domain taxonomy, but do not change epic structure rules.

## Schema Fields Required by These Rules

The `intent-epic-schema.yaml` must carry these fields to support enforcement:

| Rule | Field | Notes |
|------|-------|-------|
| 1 | `intent` | Must describe user-observable outcome |
| 2 | `domain` | Exactly one domain value |
| 2 (exception) | `cross_cutting_justification` | Optional; required when domain spans boundaries |
| 3 | `uses_mocks` + `demock_epic_ref` | Optional; required when mocks are used |
| 4 | `in_scope`, `anti_goals`, `must_not_break` | All three required, all non-empty |
| 5 | `success_scenarios[].then` | Binary-testable language |
| 6 | `depends_on` | List of epic IDs; must be acyclic across the epics directory |
| 7 | `foundation_investment` | Boolean; required true when ≥2 incoming depends_on |
