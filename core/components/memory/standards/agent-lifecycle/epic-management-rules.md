# Epic Management Rules

Rules governing how epics are structured, scoped, and delivered. These are agent lifecycle best practices that apply whenever epics are created, refined, or validated.

## Rule 1: Vertical Slice Delivery

**Every epic must deliver end-to-end testable user value.**

An epic is not a horizontal layer (e.g., "set up the database" or "build the API"). It is a vertical slice through the stack that a user can interact with and a reviewer can verify. When the epic is complete, a user should be able to perform a meaningful action and see a meaningful result.

Mocks are acceptable for phased delivery — an epic can mock external dependencies or downstream services — but the user-facing flow must be complete. A mock payment gateway is fine if the checkout flow works end to end. A database schema with no UI is not a vertical slice.

**Correct:** "User can register, log in, and see their profile dashboard"
**Incorrect:** "Set up user database schema and API endpoints"

## Rule 2: Single Module Scope

**Each epic is owned by exactly one domain module.**

An epic sits within User Management OR Payments OR Commerce — never across multiple modules. Cross-module dependencies are expressed via `depends_on` in the epic schema, not by expanding the epic's scope.

This aligns with the module boundaries defined in `knowledge/domain-taxonomy/`. If the domain taxonomy defines User Management and Payments as separate modules, an epic cannot span both. It can depend on features from another module, but the epic's scope, ownership, and success criteria belong to one module.

**Correct:** "Payments epic depends on User Management epic for authenticated sessions"
**Incorrect:** "Epic covers user registration AND payment processing"

### Exception: Explicitly Scoped Cross-Cutting Capabilities

When product.yaml `scope.in_scope` explicitly names a cross-cutting capability (e.g., "Platform Configuration" covering pricing bands, category management, and feature flags across multiple modules), the scoping agent MAY create a horizontal epic with a `cross_cutting_justification` field explaining:
1. Which product.yaml in_scope item this epic owns
2. Why single-module-scope does not apply (the capability is explicitly cross-cutting in the product vision)
3. Which module boundaries it crosses and how ownership is delineated

This exception applies ONLY when the cross-cutting capability is an explicit, named item in product.yaml scope — not when the agent infers cross-cutting needs. The product vision is the authority; the rule is the default.

## Rule 3: Mocks as Phased Delivery

**Every mock introduced must be replaced in a subsequent epic.**

When an epic uses mocks (mock payment gateway, stub notification service, hardcoded data), the roadmap must include a de-mocking epic that replaces mocks with real integrations. Mocks are a delivery strategy, not a permanent state.

The roadmap should make de-mocking visible — a reviewer looking at the roadmap should be able to trace every mock to the epic that replaces it. If a mock has no planned replacement, either the mock is actually the final implementation (rename it) or the roadmap has a gap.

**Correct:** "Epic F2 mocks payment gateway → Epic F5 integrates Stripe"
**Incorrect:** "Epic uses mock data" (with no follow-up epic to replace it)

## Rule 4: Scope Boundaries

**Every epic must define `in_scope`, `out_of_scope`, and `must_not_break`.**

These three fields from the epic schema are not optional. They prevent scope creep, make review decisions tractable, and protect existing functionality.

- **in_scope** — what this epic explicitly delivers. Be specific about capabilities, interactions, and outputs.
- **out_of_scope** — what is explicitly excluded. Name the natural scope creep risks. If reviewers will ask "does this include X?", put X in out_of_scope.
- **must_not_break** — existing capabilities this epic cannot regress. For foundational epics with no predecessors: "None at this stage — foundational epic."

Common scope creep patterns to guard against:
- "While we're touching auth, let's also add..." — if it's not in_scope, it's a separate epic
- "We need this for the demo" — if the demo is a separate epic, the feature belongs there
- "It's just a small change" — small changes that cross module boundaries are still cross-module

## Rule 5: Success Verifiability

**Success scenarios must be binary testable by a reviewer.**

The `success_scenarios` field in the epic schema uses given/when/then format. Each scenario must be something a reviewer can execute and get a definitive pass or fail. No ambiguity.

**Correct:** "Given a registered user, when they enter valid credentials, then they see their profile dashboard within 2 seconds"
**Incorrect:** "The login experience should be smooth and intuitive"

The word "should" is a red flag. Success scenarios use "then [observable outcome]" — something you can point to and say "this happened" or "this did not happen."

## Rule 6: Dependency Discipline

**`depends_on` uses feature IDs (F-IDs) only. No circular dependencies.**

Epic dependencies are explicit — they reference other epic IDs from the same roadmap. Circular dependencies (F1 depends on F2, F2 depends on F1) are scoping failures, not dependency chains. If two epics are mutually dependent, they should be merged or re-scoped.

No implicit ordering. If Epic F3 assumes Epic F1 is complete but doesn't declare `depends_on: [F1]`, the dependency is invisible and the execution order is fragile.

**Correct:** `depends_on: [F1, F2]` — explicit, traceable, acyclic
**Incorrect:** "This should be done after the auth epic" (implicit, not in schema)

## Rule 7: Foundation Investments

**Foundation epics must be marked `foundation_investment: true`, placed in the earliest bucket, and given P1 priority.**

A foundation epic is shared infrastructure that enables multiple other epics — authentication, database setup, CI/CD pipeline, design system. It doesn't deliver direct user value but is a prerequisite for epics that do.

Marking criteria for `foundation_investment: true`:
- The epic enables 2+ other epics
- Without it, those downstream epics cannot begin
- It delivers infrastructure, not user-facing features

Foundation epics go in the `near` bucket with `P1` priority because nothing else can start until they're done. Delaying foundation work creates a bottleneck that delays the entire roadmap.

## Consumers

These rules apply to any agent or skill that defines, scopes, or validates epics and features. The product-planning pipeline (`/specify-product` → `/design-exp` → `/build-arch`) and the implementation pipeline (`prepare-implementation`, `implement-epic`) read this file during their context-loading step and enforce the rules against their outputs.

## Relationship to Domain Taxonomy

Rule 2 (Single Module Scope) aligns with the module boundaries defined in `knowledge/domain-taxonomy/`. The taxonomy defines which modules exist (user-management, payments, commerce, search, personalization). Epics respect these boundaries — one epic per module.

## Relationship to Project Profiling

- PP-6 (Delivery Ambition) influences phasing and how aggressively mocks are used (Rule 3). A POC (PP-6 = 1) will mock heavily; a market-ready product (PP-6 >= 3) should minimize mocks.
- PP-3 (Persona Complexity) influences epic decomposition — a multi-persona product may need persona-specific features within an epic, but the epic still stays within one module (Rule 2).
- NFR dimensions influence which features appear in epics via agent reasoning over the domain taxonomy, but do not change epic structure rules.
