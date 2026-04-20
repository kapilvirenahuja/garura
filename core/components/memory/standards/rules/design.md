# Design Rules

Canonical rules governing design output — personas, screen inventory, user flows, wireframes, and the design spec. Every skill in the `/design` pipeline loads this file.

Consumers: `synthesize-personas`, `generate-screen-inventory`, `validate-screen-coverage`, `map-user-flows`, `generate-wireframes`, `compile-design-spec`, `designer` agent.

## Rule 1: Personas Use Jobs-to-be-Done Format

**Every persona entry uses JTBD format, not demographics.**

The persona document describes users by the job they hire the product to do, not by age / income / title. At least one job story per persona in the form: `When [situation], I want to [motivation], so I can [outcome]`. Demographic personas ("Sarah, 32, mid-level marketer") are rejected.

**Enforcement:** `validate-personas` (or the generate-exp validator pass) rejects personas without a job story. SE-2 on design SKILL.md enforces this.

## Rule 2: Every Capability Maps to at Least One Persona

**The `Capability → Persona Map` table must cover every entry in `scope.selected_capabilities`.**

A capability with no persona is invisible — no one will test it, no one will describe the context in which it's used. The map is mandatory.

**Enforcement:** `validate-personas` (or equivalent). SE-3 on design SKILL.md enforces this.

## Rule 3: Screen Inventory Captures States, Not Just Names

**Each screen MD file documents every interaction state (default, loading, empty, error, success) with data fields and actions per state.**

A screen list with just names is insufficient. The inventory must answer: what does a developer need to build, what does a designer need to mock, what does a tester need to cover? The minimum state set is 5 (default, loading, empty, error, success) — fewer states is a validation failure unless the screen is a static informational page.

**Enforcement:** `validate-screen-coverage` check category `state_count_below_min`. SE-6 on design SKILL.md enforces this.

## Rule 4: Every Capability Has at Least One Screen

**The screen inventory must cover every entry in `scope.selected_capabilities` with at least one screen.**

A capability without a screen is a hole in the UX. The validator cross-references scope.yaml and the screens directory and fails on any uncovered capability.

**Enforcement:** `validate-screen-coverage` check `capabilities_covered == capabilities_total`. SE-5 on design SKILL.md enforces this.

## Rule 5: Flows Trace to Intent Epic Scenarios

**Every flow file's frontmatter declares a `source_scenario` referencing an intent epic scenario.**

Flows do not exist in isolation. They execute the success and failure scenarios authored at product-planning time. A flow without a `source_scenario` is orphaned and fails validation.

Every success_scenario and failure_scenario across all intent epics must be covered by at least one flow file.

**Enforcement:** `map-user-flows` validator pass — `success_scenarios_with_flow == success_scenarios_total` and `failure_scenarios_with_recovery == failure_scenarios_total`. SE-9 and SE-10 on design SKILL.md enforce this.

## Rule 6: Wireframes Are Explicit, Not Generic

**Every screen MD file has a `## Wireframe` section with explicit layout pattern, named components, data fields, and actions per state.**

Blacklisted generic descriptors (automatic fail):
- `"a form"`
- `"a page"`
- `"generic layout"`
- `"standard UI"`

A wireframe that says "a form with fields and a button" is not a wireframe — it's a placeholder. The validator greps for these blacklisted phrases and fails any match.

**Enforcement:** `generate-wireframes` + `validate-wireframes` grep blacklist. SE-11 and SE-12 on design SKILL.md enforce this.

## Rule 7: No Visual-Design Language in the Design Spec

**The `design-spec.md` does NOT contain visual-design values — color hex codes, `rgb(...)`, `px` spacing values, font family names, or brand asset references.**

Visual design is downstream of the design spec and handled by a dedicated visual-design pass. The design spec covers interaction patterns, accessibility posture, layout structure, and handoff notes — it does NOT prescribe colors, typography, or brand assets.

**Enforcement:** `compile-design-spec` validator greps for hex codes, `rgb(`, `px` spacing, font-family declarations. SE-16 on design SKILL.md enforces this.

## Rule 8: Every Interactive Screen Declares a WCAG Level

**Any screen with non-empty actions in its default state must have a `## Accessibility` section that names a WCAG level matching or exceeding the product's quality-profile target.**

A screen without an accessibility section is assumed inaccessible. The validator fails any interactive screen missing this section and any screen whose declared WCAG level is weaker than `quality-profile.interaction_capability`.

**Enforcement:** `validate-screen-coverage` or `compile-design-spec`. SE-13 and SCE-5 on design SKILL.md enforce this.

## Rule 9: Interaction Patterns Have One Decision Per Pattern

**The `design-spec.md` "Interaction Patterns" section records exactly one decision per pattern — form validation, loading indicators, error placement, empty states, transitions.**

A pattern with multiple conflicting decisions across screens produces inconsistent UX. The design spec is the product-wide arbiter. A developer reading it should be able to implement the pattern consistently without cross-referencing individual screens.

**Enforcement:** `compile-design-spec` pattern-table check. SCE-6 on design SKILL.md enforces this.

## Related Rules

- `features.md` — intent epic content (flows trace to these scenarios)
- `scenarios.md` — scenario format (flows depend on scenario quality)
