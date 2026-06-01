---
id: technology/frontend-component-orchestration
title: "Frontend apps: Primitive → Block → Card component architecture"
conditions:
  surface: web-app
  stack: react-nextjs-app-router
  team-size: under-20-frontend
  stage: greenfield-or-early
  scalability: low-to-mid
evolve_when: []
provenance: "documented (recovered into the v1 KB under #434)"
---

# Frontend apps: Primitive → Block → Card component architecture

## Topic
How to build frontend applications. A three-layer component hierarchy
(Primitive → Block → Card) with event-driven orchestration, an "extend before
create" composition discipline, and an explicit client-boundary rule for React
Server Components. An opinionated alternative to 5-layer atomic design
(atoms/molecules/organisms/templates/pages) that collapses the hierarchy to what
startup teams actually use.

## Conditions

### When to choose
A small-to-mid startup team (< 20 frontend engineers) needs a component system
that stays coherent as the product grows but can't afford 5-layer atomic-design
ceremony. The right default when the team ships a React + Next.js App Router
product with Server Components as the default rendering mode, the product is
pre-PMF or early growth with daily/weekly releases, and TypeScript spans UI and
API. Pairs naturally with a modular-monolith backend — the same "push the
boundary deep, extend before create, own the seam" discipline applies. Best when
delivery ambition and scalability needs are low-to-mid; tuned for shipping
features, not running a platform.

### When to avoid
Multiple independent frontend teams needing physical isolation of their
component libraries (federated micro-frontends). Non-React runtimes (Vue,
Svelte, Angular) — the layering translates but the Server Components specifics
don't. A team already on a mature atomic-design system with its own tooling
(migrating sideways for philosophy has no payback). A single-screen internal
tool with no meaningful reusable UI (over-served by any layered system).

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Frontend team size | 1–10 engineers | 10–20 | > 20 with independent component ownership |
| Component count | 50–300 | 300–800 | > 800 (library fracture, federation needed) |
| Route count | 5–50 | 50–200 | > 200 (route-group discipline breaks) |
| Release cadence | Multiple daily | Daily | < weekly (the discipline doesn't pay back) |
| Design-system maturity | Greenfield or early | Mid-maturity | Mature atomic design already in place |

## Recommendation

### The three layers
| Layer | Role | Children | Props | Naming | Examples |
|-------|------|----------|-------|--------|----------|
| **Primitive** | Single HTML element, single purpose | 0–1 | < 3 | Singular noun | `Button`, `Input`, `Label`, `Icon`, `Text` |
| **Block** | 2–5 primitives composed into one cohesive function | 2–5 primitives | Block's own contract | Descriptive compound | `SearchBar`, `FormField`, `MenuItem`, `Breadcrumb` |
| **Card** | Interface section — multiple blocks or 6+ primitives | Multiple blocks | Section-level | Section name | `Header`, `UserProfile`, `LoginForm`, `ProductGrid` |

**Hard rules:**
- A Primitive that grows past 1 child or 3 props has become a Block — promote it.
- A Block that needs more than 5 primitives has become a Card — promote it.
- Any component past 300 lines is a refactor target; past 500 is critical.
- Props count > 15 is critical. Component nesting > 6 is critical.

### Extend before create
Before authoring a new component at any layer, search the existing library for
overlap. Create new only when overlap is below threshold:

| Layer | Overlap threshold | Rationale |
|-------|-------------------|-----------|
| Primitive | ≥ 90% overlap → extend | Most-reused; duplication is catastrophic |
| Block | ≥ 70% overlap → extend | Serve a function; most variation is prop-level |
| Card | ≥ 50% overlap → extend (or factor a shared Block) | Most local; variation is expected |

### Orchestration rules
- **Cards never know about other Cards.** They communicate by invoking and
  listening to events. No direct imports between Card files.
- **State lives as close to use as possible.** Component-local for visibility,
  focus, hover, async; lift only when a sibling legitimately needs it. Error
  boundaries at the Card level.
- **Server Components by default.** `'use client'` is pushed as deep as
  possible — ideally the Primitive/Block leaf that needs interactivity, not the
  Card or page.
- **Public API discipline.** Cards and shared Blocks are exported from
  `@repo/ui` only. Consumers import from the package name, never deep paths.

### Composition patterns
| Pattern | When | Structure |
|---------|------|-----------|
| **A: Co-located** | Sub-component used only by one parent | Lives inside parent file, not exported |
| **B: Sibling** | Shared across a small cluster | Sibling files under same dir, re-exported from dir index |
| **C: Compound** | Part of parent's contract (`Menu.Item`, `Tabs.Panel`) | Parent re-exports children as properties |

### Reference architecture
```
packages/ui/
├── src/
│   ├── primitives/   Button/ Input/ Text/   (Component.tsx, .types.ts, .test.tsx, index.ts)
│   ├── blocks/       SearchBar/ FormField/ MenuItem/
│   ├── cards/        Header/ (Header.tsx = RSC, HeaderClient.tsx = client boundary), LoginForm/ UserProfile/
│   ├── tokens/       design tokens
│   └── index.ts      Public API — the only exported surface
├── package.json      "name": "@repo/ui"
└── tsconfig.json

apps/web/
├── app/              Next.js App Router
│   ├── (marketing)/  RSC by default
│   ├── (app)/        route group behind auth
│   └── layout.tsx
└── middleware.ts     route protection
```

- **File order inside every component file:** doc comment → imports → types →
  constants → helpers → co-located sub-components → main component → exports.
- **Import discipline:** app code imports Primitives/Blocks/Cards from `@repo/ui`
  only, never deep paths. Inside `@repo/ui`, imports flow one direction:
  Cards → Blocks → Primitives. Never upward, never sideways at the Card layer.
- **CSS architecture:** three files only — `globals.css` + `themes/light.css` +
  `themes/dark.css`. Token-driven; no ad-hoc per-component stylesheets.
- **Accessibility floor:** WCAG 2.1 AA across the library; 44px min touch
  targets; AAA contrast on hero content.
- **Responsive floor:** breakpoints 320px+, 768px+, 1200px+; typography −20–30%
  on mobile, spacing −40–60% on mobile.

## Rationale
Five-layer atomic design adds an organisms/templates/pages distinction that
small teams pay for in classification ceremony without getting value back. Three
layers — Primitive, Block, Card — are enough to keep a library coherent while
staying fast to classify. Event-driven Cards stay independently testable and
relocatable; RSC-by-default keeps client bundles small; extend-before-create
keeps the library from sprawling. The costs are real and worth naming:

| Aspect | Gain | Cost |
|--------|------|------|
| 3 layers not 5 | Less ceremony, faster classification | Loses the organism/template distinction some like |
| Event-driven Cards | Independently testable/relocatable | Direct Card-to-Card imports silently break the model |
| RSC default | Smaller bundles, faster TTI, better SEO | Team must understand the client boundary |
| Extend-before-create | Library stays small and coherent | Searching before authoring is slower at first |
| Single `@repo/ui` surface | Safe internal refactors | Any public-API change is a coordinated release |
| Token-driven CSS | Trivial theming | No escape hatch for one-off styles |

## Evolve when
| From | To | Trigger |
|------|----|---------|
| — | Primitive/Block/Card | Greenfield React+Next.js product (start here, no atomic ceremony) |
| Unstructured component folder | Primitive/Block/Card | ~50 components, duplication rising — classify by layer, enforce thresholds |
| Atomic design (5 layers) | Primitive/Block/Card | Organisms/templates/pages add ceremony without value — collapse: atoms→Primitives, molecules→Blocks, organisms+templates+pages→Cards |
| Primitive/Block/Card | Federated micro-frontends | > 20 engineers, > 800 components, independent teams — extract `@repo/ui`, each team owns a Card subtree |
| Pages Router (client-heavy) | App Router + this pattern | Need RSC/streaming/edge — route-group refactor, push `'use client'` to leaves |

## Anti-patterns
- **Card-to-Card imports** — couples Cards; breaks orchestration. Use events.
- **God Card** — one Card accumulates several sections' logic; unmaintainable.
- **Client boundary at page level** — `'use client'` on a page/layout ships the
  whole subtree to the client; RSC benefit lost.
- **Props drilling past 3 levels** — lift state or use a compound component.
- **Premature primitive extraction** — three similar lines beats the wrong
  primitive.
- **Deep-path imports** — importing `@repo/ui/src/.../Button.tsx` breaks the
  public-API contract.
- **Ad-hoc stylesheets** — a component shipping its own CSS breaks token-driven
  theming.
- **Classification drift** — a Primitive past 3 props still labeled "Primitive"
  makes the thresholds meaningless.
- **Component file > 300 lines** — refactor target; past 500 is critical.

## Provenance
documented (the user's frontend-component-orchestration design, recovered from
the prior KB into the v1 KB under #434). Companion learnings referenced in the
original (modular-monolith backend, the React+Next.js stack choice, and the
component-architecture audit checklist) were also in the prior KB and are not yet
rebuilt here.
