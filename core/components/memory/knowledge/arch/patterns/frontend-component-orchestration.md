# Frontend Component Orchestration

Three-layer component hierarchy (Primitive → Block → Card) with event-driven orchestration, "Extend Before Create" composition discipline, and an explicit client-boundary rule for React Server Components. An opinionated alternative to traditional atomic design (atoms/molecules/organisms/templates/pages) that collapses the hierarchy to what startup teams actually use.

**Search patterns:** frontend, component hierarchy, atomic design, primitives, blocks, cards, orchestration, RSC, server components, client boundary, monorepo, extend before create, component library, design system, composition

## When to Choose

Choose this pattern when a small-to-mid startup team (< 20 frontend engineers) needs a component system that stays coherent as the product grows, but cannot afford the ceremony of 5-layer atomic design. It is the right default when the team ships a React + Next.js App Router product with Server Components as the default rendering mode, when the product is pre-PMF or early growth with weekly/daily release cadence, and when TypeScript is the lingua franca across UI and API. It pairs naturally with a modular-monolith backend — the same "push the boundary as deep as possible, extend before create, own the seam" discipline applies on both sides. Works well when PP-6 (Delivery Ambition) is 1-3 and NFR-6 (Scalability) is 1-3; the component library is tuned for shipping features, not running a platform.

## When to Avoid

Avoid when the organization has multiple independent frontend teams that need physical isolation of their component libraries (federated micro-frontends territory). Avoid when the product must render on non-React runtimes (Vue, Svelte, Angular) — the layering concepts translate but the concrete patterns around Server Components do not. Avoid when the team is already committed to a mature atomic-design system with its own tooling — migrating sideways for philosophy has no payback. Avoid when the product has no meaningful composition of reusable UI (a single-screen internal tool is over-served by any layered system).

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Frontend team size | 1-10 engineers | 10-20 | > 20 with independent component ownership |
| Component count | 50-300 | 300-800 | > 800 (library fracture, federation needed) |
| Route count | 5-50 | 50-200 | > 200 (route-group discipline breaks) |
| Release cadence | Multiple daily | Daily | < weekly (the discipline doesn't pay back) |
| Design-system maturity | Greenfield or early | Mid-maturity | Mature atomic design already in place |

## Key Components

### The Three Layers

| Layer | Role | Children | Props | Naming | Examples |
|-------|------|----------|-------|--------|----------|
| **Primitive** | Single HTML element, single purpose | 0-1 | < 3 | Singular noun | `Button`, `Input`, `Label`, `Icon`, `Text` |
| **Block** | 2-5 primitives composed into one cohesive function | 2-5 primitives | Block's own contract | Descriptive compound | `SearchBar`, `FormField`, `MenuItem`, `Breadcrumb` |
| **Card** | Interface section — multiple blocks or 6+ primitives | Multiple blocks | Section-level | Section name | `Header`, `UserProfile`, `LoginForm`, `ProductGrid` |

**Hard rules:**
- A Primitive that grows past 1 child or 3 props has become a Block — promote it.
- A Block that needs more than 5 primitives has become a Card — promote it.
- Any component past 300 lines is a refactor target. Past 500 is a critical refactor.
- Props count > 15 is critical. Component nesting > 6 is critical.

### Extend Before Create

Before authoring a new component at any layer, search existing library for overlap. Create new only when overlap is below threshold:

| Layer | Overlap threshold | Rationale |
|-------|-------------------|-----------|
| Primitive | ≥ 90% overlap → extend | Primitives are the most-reused — duplication is catastrophic |
| Block | ≥ 70% overlap → extend | Blocks serve a function; most variations are prop-level |
| Card | ≥ 50% overlap → extend (or factor a shared Block) | Cards are the most local; variation is expected |

### Orchestration Rules

- **Cards never know about other Cards.** Cards communicate by invoking events and listening to events. No direct imports between Card files.
- **State lives as close to use as possible.** Component-local state for visibility, focus, hover, async handling. Lift only when a sibling legitimately needs it. Error boundaries at Card level.
- **Server Components by default.** `'use client'` is pushed as deep as possible — ideally at the Primitive or Block leaf that actually needs interactivity, not at the Card or page level.
- **Public API discipline.** Cards and shared Blocks are exported from `@repo/ui` only. Consumers import from the package name, never from deep paths.

### Composition Patterns

| Pattern | When | Structure |
|---------|------|-----------|
| **A: Co-located** | Sub-component used only by one parent | Sub-component lives inside parent file, not exported |
| **B: Sibling** | Sub-component shared across a small cluster | Sibling files under same directory, re-exported from directory index |
| **C: Compound** | Sub-component is part of parent's contract (`Menu.Item`, `Tabs.Panel`) | Parent re-exports children as properties |

## Reference Architecture

```
packages/ui/
├── src/
│   ├── primitives/
│   │   ├── Button/
│   │   │   ├── Button.tsx          # Main component
│   │   │   ├── Button.types.ts     # Public types
│   │   │   ├── Button.test.tsx     # Colocated tests
│   │   │   └── index.ts            # Public re-export
│   │   ├── Input/
│   │   └── Text/
│   ├── blocks/
│   │   ├── SearchBar/
│   │   ├── FormField/
│   │   └── MenuItem/
│   ├── cards/
│   │   ├── Header/
│   │   │   ├── Header.tsx          # Server Component by default
│   │   │   ├── HeaderClient.tsx    # Client boundary, pushed deep
│   │   │   └── index.ts
│   │   ├── LoginForm/
│   │   └── UserProfile/
│   ├── tokens/                     # Design tokens
│   └── index.ts                    # Public API — only exported surface
├── package.json                    # "name": "@repo/ui"
└── tsconfig.json

apps/web/
├── app/                            # Next.js App Router
│   ├── (marketing)/                # Route group
│   │   ├── page.tsx                # RSC by default
│   │   └── layout.tsx
│   ├── (app)/                      # Route group behind auth
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   └── layout.tsx                  # Root layout
└── middleware.ts                   # Route protection
```

**File structure order inside every component file:**
1. Documentation comment
2. Imports
3. Types
4. Constants
5. Helpers
6. Sub-components (Pattern A co-located)
7. Main component
8. Exports

**Import discipline:**
- App code imports Primitives, Blocks, and Cards from `@repo/ui` only — never from deep paths inside the package.
- `@repo/ui` internally imports across layers in one direction: Cards → Blocks → Primitives. Never upward. Never sideways at the Card layer.

**CSS architecture:**
- Three files only: `globals.css` + `themes/light.css` + `themes/dark.css`. Token-driven; no ad-hoc per-component stylesheets outside the package.

**Accessibility floor:**
- WCAG 2.1 AA across the library. 44px minimum touch targets. AAA contrast on hero content.

**Responsive floor:**
- Base 320px+, md 768px+, xl 1200px+ as the three breakpoints. Typography 20-30% reduction on mobile; spacing 40-60% reduction on mobile.

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| — | Primitive/Block/Card | Greenfield React+Next.js product | Start here; no atomic design ceremony |
| Unstructured component folder | Primitive/Block/Card | Library reaches ~50 components, duplication rising | Classify each component by layer; enforce Extend-Before-Create thresholds on new work |
| Atomic design (5 layers) | Primitive/Block/Card | Team finds organisms/templates/pages layers add ceremony without value | Collapse: atoms → Primitives, molecules → Blocks, organisms+templates+pages → Cards |
| Primitive/Block/Card | Federated micro-frontends | Multiple independent frontend teams, > 20 engineers, > 800 components | Extract `@repo/ui` into shared package; each team owns a Card subtree |
| Pages Router (client-heavy) | Primitive/Block/Card on App Router | Product needs RSC / streaming / edge | Route-group refactor; push `'use client'` to leaf components |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Layer count | 3 layers instead of 5 — less ceremony, faster classification | Loses the "organism vs template" distinction some teams find useful |
| Event-driven Cards | Cards are independently testable and relocatable | Requires discipline — direct Card-to-Card imports silently break the model |
| RSC default | Smaller client bundles, faster TTI, better SEO | Team must understand the client boundary; easy to accidentally balloon it |
| Extend-Before-Create | Library stays small and coherent | Requires searching before authoring; slower for first few months |
| Single `@repo/ui` surface | Refactoring internals is safe — consumers only see the public API | Any public-API change is a coordinated release |
| Token-driven CSS | Theming is trivial; design system changes ripple cleanly | No escape hatches for one-off styles — pressure on tokens |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Card-to-Card imports | Card A directly imports Card B instead of communicating via events | Breaks orchestration model; Cards become coupled |
| God Card | One Card accumulates logic for several sections | Defeats the layer; unmaintainable |
| Client boundary at page level | `'use client'` at the top of a page or layout | Entire subtree ships to the client; RSC benefit lost |
| Props drilling past 3 levels | Passing props through Card → Block → Primitive chains | Signals missing composition pattern — lift state or use a compound component |
| Premature primitive extraction | Factoring a primitive out of a single use site | Wrong abstraction; three similar lines beats the wrong primitive |
| Deep-path imports | App code imports from `@repo/ui/src/primitives/Button/Button.tsx` | Breaks the public-API contract; refactors become breaking changes |
| Ad-hoc stylesheets | Component ships its own CSS file outside the three-file architecture | Theming breaks; design tokens no longer authoritative |
| Classification drift | Primitive grows past 3 props and stays labeled "Primitive" | Extend-Before-Create thresholds become meaningless |
| Component file > 300 lines | Single file carries multiple concerns | Refactor target; past 500 lines is critical |

## Related Patterns

- `arch/patterns/modular-monolith.md` — the same "own the seams, extend before create" discipline applies to backend module boundaries.
- `arch/stacks/frontend-react-nextjs.md` — concrete stack choice that this orchestration pattern assumes.
- `quality/frontend/component-architecture.md` — assessment checklist (FE-11..18) used to audit an existing library against this pattern.
