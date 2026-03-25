# Evolutionary Scaling Architecture

Opinionated reference for end-to-end application architecture covering frontend, backend-for-frontend, and service layers. Optimized for startups and small-scale projects (< 10 developers, < 50K MAU). Not a mandate — a decision framework with explicit selection criteria.

---

## Search Patterns

Use these indicators to determine when this reference applies. If **3+ indicators** match the project context, this architecture is a strong candidate.

| Indicator | Pattern | Match Weight |
|-----------|---------|-------------|
| Team size | < 10 developers | High |
| Scale target | < 50,000 MAU initial | High |
| Product stage | Pre-PMF or early-growth | High |
| Stack preference | TypeScript full-stack | Medium |
| Deployment model | Serverless / edge-first | Medium |
| Client count | Starting with web, mobile planned | Medium |
| Org structure | Single team, shared codebase | High |
| Iteration speed | Weekly releases or faster | High |
| Budget constraint | Minimize infrastructure cost | Medium |
| Enterprise pressure | Team has enterprise background proposing microservices | High |

### Anti-Match Indicators (this reference does NOT apply)

| Indicator | Why |
|-----------|-----|
| Team > 20 developers with independent deploy cadences | Conway's law demands service boundaries |
| Regulatory requirement for physical service isolation | Compliance overrides architectural preference |
| Multi-language polyglot requirement from day one | Monolith assumes single-language stack |
| Existing distributed system being extended | Start from where you are, not from Phase 1 |

---

## The Evolutionary Model

Three phases connected by business triggers. Not a timeline — a trigger-driven progression. Most applications will spend their entire life in Phase 1 or Phase 2.

```
Phase 1                    Phase 2                     Phase 3
Modular Monolith    ──→    API-First / Headless   ──→  Strangler Fig +
+ Vertical Slices          Transition                  Service Extraction

0-10K MAU                  Multi-client trigger         Scaling bottleneck
Single team                Mobile / partners needed     Feature needs own stack
PMF search                 Same deployment              Selective extraction
```

### Phase 1: Modular Monolith with Vertical Slices

**Scale:** 0 – 10,000 MAU | **Team:** Single team | **Goal:** Ship fast, find PMF

**What it is:**
- Single codebase, single deployment unit
- Organized into loosely coupled modules (feature folders)
- Each feature is a vertical slice: UI + server logic + data access
- Route Handlers act as BFF from day one (establishes URL contract early)
- Modules interact through well-defined interfaces only

**Key constraints:**
- No cross-module database access
- No shared internal state between modules
- Each module owns its data schema and business logic
- BFF layer never bypassed — frontend never talks directly to downstream services

**Reference implementation (Next.js Feature-Sliced Design):**
```
app/
  (auth)/
    login/
      page.tsx          # React UI (Server Component)
      route.ts          # API endpoint (serverless function)
      actions.ts        # Server Actions (form handling)
      db.ts             # Data access for this feature
  (commerce)/
    checkout/
      page.tsx          # Checkout UI
      route.ts          # Checkout API
      actions.ts        # Server Actions
      db.ts             # Data access for checkout
  shared/
    middleware.ts       # Auth guards, logging
    db-client.ts        # Shared database connection
```

**Technology stack:**
- Next.js 15+ (App Router)
- React Server Components + Route Handlers + Server Actions
- TypeScript (single language, full stack)
- Vercel (serverless, Fluid Compute)

### Phase 2: API-First / Headless Transition

**Trigger events:**
- Mobile app required
- Partner / third-party integrations needed
- Multiple frontend clients consuming same data

**What changes:**
- Route Handlers refactored to return JSON instead of server-rendered HTML
- Frontend becomes pure API consumer
- Same deployment, same URLs, same infrastructure
- Contract between frontend and backend becomes explicit (OpenAPI)

**What does NOT change:**
- Codebase structure
- Deployment model
- URL paths
- Infrastructure cost

**Strategic value:** Once backend returns JSON through defined endpoints, any client can consume it — web, mobile, third-party. Multi-client architecture without infrastructure changes. Transition happens feature-by-feature.

### Phase 3: Strangler Fig + Service Extraction

**Trigger events (ALL must apply — extract only when warranted):**

| Trigger | Example |
|---------|---------|
| Feature needs independent scaling | Checkout at 50K MAU needs different compute/memory |
| Feature needs different tech stack | ML pipeline in Python, rest in TypeScript |
| Separate team owns the feature | Independent deploy cadence required |
| Deployment bottleneck | Monolith too slow to deploy and roll back |

**How extraction works:**
1. BFF already acts as proxy (established in Phase 1)
2. Extract hot-path service into independent container (Docker/K8s)
3. Update Route Handler to proxy to new service
4. Frontend code unchanged — API contract identical, URLs identical

**Critical principle:** Extraction must be atomic — extract logic AND data AND redirect all consumers. Extracting logic but sharing database keeps you coupled at the data tier.

**Domain-Driven Design alignment:** Each Bounded Context maps to a potential service boundary. Discover boundaries through monolith operation before extracting.

---

## Frontend Architecture Layers

Four-layer architecture for the frontend application. Strict directional dependency — each layer may only invoke the layer below it.

```
┌──────────────────────────────────────────────────────────┐
│                   Application Layer                       │
│  Router, global state, page-level routing, error handling │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                    Cards Layer                             │
│  Presentation components, domain-agnostic, self-contained │
│  Structure: HTML | Styling: CSS | Behavior: JS            │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│               Orchestration Layer                         │
│  Service coordination, business rules, data transformation│
│  Contexts, Providers, Hooks, Services                     │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Infrastructure Layer                         │
│  API clients, caching, authentication, 3rd-party services │
└──────────────────────────────────────────────────────────┘
```

**Layer rules:**
- Cards are domain-agnostic and self-sustainable — they never know about other layers
- Cards communicate via events (invoke events, listen for data changes)
- Infrastructure never exposes itself directly to Cards
- Data flows through Orchestration layer

### Frontend directory structure

```
apps/{app}/src/
├── app/                    # Application layer (Next.js App Router)
├── cards/                  # Card components (organisms)
├── orchestration/          # Business logic coordination
│   ├── contexts/          # React contexts
│   ├── providers/         # Context providers
│   ├── services/          # Business services
│   └── hooks/             # Custom React hooks
├── infrastructure/        # External integrations
│   ├── api/              # API client
│   ├── auth/             # Authentication
│   ├── cache/            # Caching strategies
│   └── external/         # 3rd-party integrations
├── design-system/         # Generated tokens from Figma
│   ├── tokens/           # Color, spacing, typography, effects
│   ├── theme/            # CSS custom properties
│   └── tailwind/         # Tailwind integration (ds- prefix)
└── lib/                   # Shared utilities
```

---

## Component Architecture: Atomic Design

Three-tier component hierarchy. Primitives and Blocks live in shared packages; Cards live in app-specific directories.

| Level | Name | Location | Description | Detection |
|-------|------|----------|-------------|-----------|
| Atom | Primitive | `packages/ui/primitives/` | Single HTML element, single purpose, no child components | < 3 props, one HTML element |
| Molecule | Block | `packages/ui/blocks/` | 2-5 primitives, single cohesive function | Contains 2-5 primitives, one specific function |
| Organism | Card | `apps/{app}/cards/` | Multiple blocks or 6+ primitives, interface sections | 6+ primitives, multiple functional areas |

**Naming conventions:**
- Primitives: Singular nouns (`Button`, `Input`, `Icon`)
- Blocks: Descriptive compounds (`SearchBar`, `FormField`, `NavItem`)
- Cards: Section names (`Header`, `ProductCard`, `LoginForm`)

**Composition rules:**
- Primitives are pure and stateless when possible
- Blocks combine primitives for specific functions (not general-purpose wrappers)
- Cards orchestrate blocks into complete interface sections
- Cards never reference other cards

---

## Monorepo Structure

Turborepo + pnpm workspace. Apps consume packages; packages are shared.

```
project-root/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   └── ui/               # Shared component library (@repo/ui)
│       └── src/
│           ├── primitives/
│           ├── blocks/
│           ├── cards/
│           └── theme/
├── turbo.json            # Task orchestration
├── pnpm-workspace.yaml   # Workspace definition
└── package.json          # Root scripts (dev, build, lint)
```

**Path aliases:**
- `@/*` → `./src/*` (app-internal)
- `@repo/ui` → `../../packages/ui/src` (shared UI)

---

## Design System Integration

Figma → generated tokens → CSS custom properties → Tailwind.

| Token Category | CSS Variable Pattern | Tailwind Prefix |
|---------------|---------------------|-----------------|
| Colors | `--color-{family}-{scale}` | `ds-color-{family}-{scale}` |
| Spacing | `--spacing-{value}` | `ds-spacing-{value}` |
| Typography | `--font-{property}` | `ds-font-{property}` |
| Effects | `--shadow-{name}`, `--radius-{name}` | `ds-shadow-{name}`, `ds-radius-{name}` |

---

## Design Principles for Evolution

These principles MUST be followed from Phase 1 to preserve the evolution path:

1. **Enforce module boundaries now** — Each feature folder has a clear public API. No cross-module database access.
2. **Use Route Handlers as BFF from day one** — Even if calling local functions initially, the URL contract is established.
3. **Keep data schemas per module** — Even in a shared database, use schema prefixes or separate models per feature.
4. **Version internal APIs** — TypeScript interfaces define contracts between modules. When extracting a service, interfaces become the API specification.

---

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Pixie Dust | Assuming microservices magically solve problems | Most common; wastes months on infra |
| Dirty Adoption | Microservices before CI/CD, monitoring, testing exist | Compounds operational gaps |
| Architecture Cosplay | Copying Netflix architecture at 1K MAU with 3 engineers | 2-4x infrastructure overhead for zero benefit |
| Premature Extraction | Extracting services before discovering boundaries through monolith operation | Wrong boundaries are expensive to fix |
| Shared Database Extraction | Extracting service logic but keeping shared database | Coupling at data tier defeats purpose |

---

## Cost & Velocity Impact

| Approach | Infra Overhead | Feature Velocity | Team Size Fit |
|----------|---------------|------------------|---------------|
| Modular Monolith (Phase 1) | Low | Fastest | 1-10 developers |
| API-First (Phase 2) | Same as Phase 1 | Slightly slower (contract maintenance) | 1-10 developers |
| Selective Extraction (Phase 3) | Medium (per extracted service) | Slower for cross-service features | 10+ developers |
| Full Microservices (NOT recommended at startup) | 2-4x monolith | Slowest at small scale | 10+ developers |

**Industry data (2025-2026):**
- 60% of teams regret premature microservices for small-to-medium applications
- 42% of organizations consolidated services back after microservices adoption
- Modular monoliths reduce costs by 25% vs microservices for teams under 10

---

## Industry Precedent

| Company | Architecture | Migration Trigger | Scale at Migration |
|---------|-------------|-------------------|-------------------|
| Netflix | Monolith → Microservices (2008) | Database corruption, multi-day outage | Millions of subscribers |
| Amazon | Monolith → Services (early 2000s) | Teams couldn't deploy independently | Massive retail traffic |
| Shopify | Gradual extraction | Performance hotspots | $200B+ merchant sales |
| Basecamp | Still monolith (since 2003) | Never — monolith handles scale | Millions of users |
| GitHub | Selective extraction only | Specific features needed independent scaling | 100M+ developers |

---

## Foundational References

**Architectural patterns:**
- Martin Fowler — MonolithFirst, Strangler Fig Application (2004)
- Sam Newman — Monolith to Microservices: Evolutionary Patterns (O'Reilly, 2019)
- Simon Brown — Modular Monolith (C4 model creator)
- DHH — The Majestic Monolith, The Citadel pattern
- Eric Evans — Domain-Driven Design
- Milan Jovanovic — Vertical Slice Architecture

**Implementation-specific:**
- Next.js — Backend for Frontend Guide, Building APIs
- Vercel — Fluid Compute: Serverless Servers
- Feature-Sliced Design — Next.js Integration

**Source blog:** [Evolutionary Scaling Patterns for Startup Architecture](https://blog.howtoarchitect.io/posts/startup-architecture-evolutionary-patterns/)

---

| Key | Value |
|-----|-------|
| Version | 1.0.0 |
| Last Updated | 2026-02-23 |
| Status | Active |
| Category | Reference / Architecture |
| Applicability | Startups, small-scale projects, < 10 devs, < 50K MAU |
