# Frontend Component Architecture
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing frontend component design, structure, and design system adoption
**When this does NOT apply:** Backend services with no UI layer; raw HTML pages without a component model
**Search patterns:** component architecture, prop drilling, context, design system, Storybook, component size, reusability, component structure, separation of concerns
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers component boundaries, structural conventions, design system adherence, and documentation practices for component libraries. Universal check — not QP-indexed.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| FE-11 | Component files follow a consistent structure (imports, types, component, exports) | L2 | Spot check 5 components for structural consistency | Manual review, ESLint |
| FE-12 | No prop drilling beyond 2 levels — context, store, or composition used instead | L3 | Trace prop chains in component tree; grep for props passed through 3+ layers | React DevTools, manual review |
| FE-13 | Components are single-responsibility — one primary concern per component | L3 | Component exceeding 200 lines or handling 3+ concerns is a signal | Manual review |
| FE-14 | Reusable components extracted to shared library or `components/` folder; not duplicated | L3 | grep for copy-paste component patterns; count similar component files | Manual review, Grep |
| FE-15 | Design system tokens used for color, spacing, and typography (no hardcoded hex/px values) | L3 | grep `#[0-9a-fA-F]{3,6}`, grep `px` in style props; check token usage | ESLint plugin, grep |
| FE-16 | Design system components used where available instead of custom re-implementations | L3 | Check button, input, modal implementations against design system | Manual review |
| FE-17 | Components have usage documentation (Storybook stories, JSDoc, or README) | L4 | Count components with no associated story or doc | Storybook, TypeDoc |
| FE-18 | Container/presentational split maintained — data fetching not mixed into display components | L3 | Review components for direct API calls or store selects mixed with JSX | Manual review |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| God components | Single component handling routing, data fetching, business logic, and rendering | Untestable, hard to reuse, merge conflicts |
| Inline style objects at render time | `style={{ color: 'red', margin: 16 }}` repeated across components | No design system consistency, performance (new object each render) |
| One component per screen with no extraction | Page components that are 500+ lines with no sub-components | Impossible to test in isolation |
| Re-implementing design system primitives | Custom `<Button>` when design system provides one | Inconsistent UX, doubled maintenance |
| Prop interfaces as catch-all bags | Components with 15+ props, half optional | Unclear contract, hard to use correctly |

## Why It Matters

Component boundaries define how fast teams can move in parallel. Poorly bounded components cause merge conflicts, break reusability, and make testing expensive. Design system adoption prevents UI drift across features.

## Applicability Boundaries

**In scope:** Component-based frontend frameworks (React, Vue, Angular, Svelte)
**Out of scope:** Server-rendered templates (Jinja, Handlebars, ERB) where component model doesn't apply

## Rationale

These checks catch structural debt before it compounds. A component architecture that is clear at 10 components stays clear at 100 — one that isn't, collapses.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
