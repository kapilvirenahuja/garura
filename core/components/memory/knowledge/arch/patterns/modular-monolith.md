# Modular Monolith

Single deployment unit with enforced module boundaries, shared infrastructure, and independent business logic per domain. The recommended starting point for startups — not a compromise, but an evolutionary path: **build the monolith, earn the microservices.**

**Search patterns:** monolith, modular, single deployment, small team, startup, module boundaries, vertical slices, domain modules, strangler fig, evolutionary architecture, headless, API-first, bounded contexts

## When to Choose

The modular monolith is the right starting point for most new projects. It gives you the organizational benefits of service boundaries without the operational overhead of distributed systems. Choose it when the team is small (< 15 developers), the product is pre-PMF or early growth, and the priority is shipping fast. It works especially well when the team shares a single language (TypeScript, Java, C#) and deploys as one unit. PP-6 (Delivery Ambition) 1-3 strongly favors monolith — you're optimizing for speed, not scale. NFR-6 (Scalability) 1-3 is well within monolith territory. Even at NFR-6 = 4, a well-structured monolith with read replicas and caching handles hundreds of thousands of users.

**Modules as bounded contexts.** Treat each module as a DDD bounded context, not a technical grouping — a business capability with its own ubiquitous language, entities, and invariants. This is what makes the modular monolith an "extraction-ready monolith": when the scale eventually justifies a service boundary, the module already maps cleanly to what a microservice would own. Technical modules (utility layers, shared helpers) are not modules — they live in `shared/`. Every module must satisfy three requirements: (1) independent and interchangeable, (2) contains everything it needs to deliver its capability, (3) exposes a defined public API. Cross-module work happens through those APIs or through the in-process event bus — never through shared state or direct table access.

> "Almost all successful microservice stories have started with a monolith that got too big and was broken up, while almost all cases where a system was built as microservices from scratch have ended up in serious trouble." — **Martin Fowler**

> "If you can't build a well-structured monolith, microservices won't save you." — **Simon Brown** (C4 model creator)

## Why Microservices Are Wrong at Start

Microservices don't kill startups through technical failure — they kill them through **slowed velocity**. At 1,000-10,000 MAU a startup is searching for product-market fit; every hour on service-mesh config is an hour not spent on user feedback. The real costs you pay from day one:

- Separate CI/CD pipelines per service — when you need speed, not infrastructure
- Distributed system debugging — network failures, partial outages, cross-service tracing
- Service discovery, load balancing, health checking infrastructure
- Data consistency challenges — eventual consistency, saga patterns
- **2-4× more infrastructure engineering overhead**
- Slower feature velocity — every cross-service feature requires coordination

A microservices equivalent with 4-5 services needs independent pipelines, adding **10-15 minutes of orchestration overhead per deploy**.

### Industry Data

| Metric | Data Point |
|--------|-----------|
| Teams regretting premature microservices | **60%** (small-to-medium apps) |
| Organizations that consolidated back | **42%** |
| Cost savings with modular monoliths | **25%** (teams under 10 devs) |
| Microservices benefits threshold | Teams **larger than 10 developers** |
| Ops overhead — monolith | 1-2 ops engineers |
| Ops overhead — microservices | 2-4 platform engineers |

### Industry Anti-Patterns

- **Pixie Dust Anti-Pattern** — assuming microservices magically solve development problems.
- **Dirty Adoption Anti-Pattern** — adopting microservices before CI/CD, monitoring, and testing are mature.
- **Architecture Cosplay** — a startup with a handful of engineers copying Netflix without understanding *why* Netflix needed it.

## When to Avoid

Avoid when the team has independent deploy cadences (separate teams releasing on different schedules), when regulatory requirements mandate physical service isolation (certain BFSI, healthcare), when features need fundamentally different tech stacks (ML pipeline in Python alongside a TypeScript web app), or when you're extending an existing distributed system. Don't force a monolith on a team that's already distributed. Also avoid if the organization has already proven they need microservices — going backward is wasteful.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-10 developers | 10-20 | > 20 with independent cadences |
| MAU | 0-50K | 50K-500K | > 500K (depends on workload) |
| Data volume | < 100GB | 100GB-1TB | > 1TB (sharding needed) |
| Deploy frequency | Multiple daily | Daily | < weekly (too much coordination) |

## The Three-Phase Evolutionary Path

The modular monolith is not a single pattern — it is the first of three evolutionary phases that require **zero architectural rework** between them. Each phase builds on the previous one; you transition feature-by-feature, not all at once.

### Phase 1: Modular Monolith with Vertical Slices (0-10K MAU)

Single codebase organised into loosely coupled modules, each owning a specific business capability. Each feature is a complete vertical unit — UI + server logic + data access. High cohesion within each slice, low coupling between them. Modules interact through well-defined interfaces only — **no cross-module database access, no shared internal state.**

**Implementation shape:**
- Co-located route handlers + server logic + React Server Components (in the Next.js/App Router idiom, each file exports HTTP method handlers that run server-side only)
- Route handlers act as the Backend-for-Frontend (BFF) layer — even when they call local functions, they establish URL contracts early
- Single deployment, single database with schema isolation per module
- **Scale trigger:** single team, fast iteration

### Phase 2: API-First / Headless Transition (10K-100K MAU)

The natural evolution when you need mobile apps, partner integrations, or multi-client support. The transition is surprisingly simple:

1. **Starting state:** Route handlers serve server-rendered pages. Tightly coupled, fast to build — ideal for early-stage.
2. **Transition:** Refactor Route Handlers to return pure JSON. Same file, same URL, same deployment.
3. **Result:** Frontend becomes a pure client. Backend is a headless API. Any client can consume it — web, mobile, third-party.

Deployment cost is identical — the hosting layer doesn't care whether a handler returns HTML or JSON. You transition feature-by-feature. The logic is identical; only the file moves to `/api/v1/`, imports shift to a shared module, and the response includes a self-link for API discovery. **The transition is a refactor, not a rewrite.**

**Scale trigger:** mobile, partner integrations, multi-client needs.

### Phase 3: Strangler Fig + Service Extraction (100K+ MAU)

Named after the strangler fig tree that grows around a host tree and eventually replaces it (pattern coined by Martin Fowler, 2004). The BFF layer acts as a **Strangler proxy**:

1. Route handlers transparently route to either co-located logic OR an external service. The frontend never knows the difference.
2. Extract one service at a time. Checkout bottleneck at 50K MAU? Deploy checkout as an independent container. Update the route handler to proxy. Login stays co-located.
3. The frontend is completely insulated. API contract unchanged. URLs unchanged. Frontend code unchanged. **Only backend routing changes.**

**Scale trigger:** independent scaling, different tech stacks, off-process layer.

**Watch out:** don't extract logic and share the database — this keeps you coupled at the data tier. Extract logic, AND data, AND redirect all consumers. Use DDD **Bounded Contexts** to identify natural service boundaries.

## Three Design Principles (Skip the Textbook)

In practice, only three things matter:

1. **Vertical slices, not horizontal layers.** Don't build a `services/` folder and a `controllers/` folder. Build a `billing/` folder that owns its routes, logic, and queries. When it's time to extract, you grab the folder — not 40 files scattered across the tree.

2. **No cross-module database joins.** The moment `orders` does a raw JOIN on `users.accounts`, you've welded two modules together. Use an internal API call instead. Yes, it's slower today. **It saves you six months of untangling later.**

3. **Every module talks through explicit contracts.** TypeScript interfaces, Zod schemas, whatever — but never pass raw objects between modules. The day you extract a service, that interface becomes your API contract with zero rewriting.

That's it. Follow these three rules and your monolith stays a set of services that happen to deploy together — ready to split the moment you actually need to.

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Module organization | Feature folders, domain modules, vertical slices | Feature folders for small apps; domain modules for complex domains |
| Internal API | TypeScript interfaces, module contracts, dependency injection | Interfaces define module boundaries; DI for loose coupling |
| Database strategy | Shared database with schema isolation, separate schemas per module | Schema isolation preserves extraction path; shared DB for simplicity |
| BFF layer | Route handlers, API routes, controller layer | Establish URL contracts early even if calling local functions |

## Reference Architecture

```
src/
├── modules/
│   ├── auth/
│   │   ├── api/                # Route handlers / controllers
│   │   ├── domain/             # Business logic, entities
│   │   ├── data/               # Database access, repositories
│   │   ├── events/             # Events this module publishes
│   │   └── index.ts            # Public API — only exported interface
│   ├── payments/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── data/
│   │   ├── events/
│   │   └── index.ts
│   └── commerce/
│       └── ...
├── shared/
│   ├── middleware/             # Cross-cutting: auth, logging, errors
│   ├── database/              # Connection management
│   └── events/                # Event bus (in-process)
└── app.ts                     # Composition root
```

**Module rules:**
- Modules only import from other modules via their `index.ts` (public API)
- No cross-module database access — each module owns its tables
- Shared infrastructure (database connection, middleware) lives in `shared/`
- In-process event bus for cross-module communication (no direct calls for async flows)

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| — | Modular Monolith (Phase 1) | Greenfield project | Start here; vertical slices from day one |
| Modular Monolith | API-First / Headless (Phase 2) | Mobile / partner clients needed (~10K+ MAU) | Refactor route handlers to return JSON; same deployment |
| API-First | Strangler Fig Extraction (Phase 3) | Hot-path bottleneck, independent scaling need, or different tech stack (~100K+ MAU) | BFF proxies to extracted service; contract unchanged |
| Spaghetti Monolith | Modular Monolith | Code organization needed | Refactor into modules; establish boundaries gradually |

### When to Extract (Migration Triggers)

Agree on concrete criteria **before** anyone proposes microservices:

- A specific service needs to scale independently (compute, memory, latency)
- A feature needs a different technology stack (e.g., a Python ML service alongside a TypeScript web app)
- A separate team will own and deploy the service independently
- Deployment bottlenecks: the monolith takes too long to deploy and roll back

If none of these are true, you haven't earned the microservice yet.

### Real-World Migration Evidence

None of the canonical examples started with microservices. All of them earned the right to decompose through scale pressure:

| Company | Migration Started | Scale at Migration | Trigger |
|---------|-------------------|---------------------|---------|
| Netflix | 2009 (after 2008 outage) | ~10M subscribers | DB corruption, 3-day outage |
| Amazon | 2002 mandate → 2005 build | Massive retail traffic | Monolith bottleneck (Obidos) |
| Shopify | 2017 (gradual, ongoing) | 2.8M lines Ruby, 1K devs | Developer productivity decline |
| Basecamp | Never (still monolith) | 3.3M users, 252K paying | N/A — monolith handles scale |
| GitHub | Selective extraction | 100M+ developers | Auth service needed independent scaling |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Velocity | Fastest for small teams — no network calls, no deploy coordination | Slows as team grows and deploy conflicts increase |
| Simplicity | Single deployment, single database, single language | Entire app redeploys for any change |
| Debugging | Single process — stack traces span the entire request | Harder to isolate performance issues per module |
| Testing | Integration tests run in-process, fast | Test suite grows large, slower CI |
| Cost | Minimal infrastructure — one server/container | Vertical scaling has limits |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Big Ball of Mud | No module boundaries, everything depends on everything | Unmaintainable within months |
| Module boundary violations | Direct database access across modules, shared internal state | Prevents future extraction, creates hidden coupling |
| Cross-module DB joins | `orders` raw-joining on `users.accounts` | Welds two modules together at the data tier; six months of untangling to unwind |
| Horizontal folders | `services/`, `controllers/`, `repositories/` as top-level layers | Extraction becomes "find 40 files across the tree" instead of "grab one folder" |
| Passing raw objects between modules | No explicit contract between modules | No API contract exists on the day you extract — forces rewriting |
| Premature extraction | Extracting services before understanding domain boundaries | Wrong boundaries are expensive to fix; **premature extraction costs more than technical debt ever will** |
| God module | One module accumulates all business logic | Defeats the purpose of modularization |
| Shared mutable state | Global singletons, shared caches without clear ownership | Race conditions, unpredictable behavior |
| Pixie Dust | Believing microservices magically fix development problems | You inherit distributed-system complexity on top of the original problems |
| Dirty Adoption | Going to microservices before CI/CD, monitoring, testing are mature | You can't operate what you just deployed |
| Architecture Cosplay | Copying Netflix / Shopify patterns without their scale problem | Pays the cost, gets none of the benefit |

## The Bottom Line

The best architecture is the one that lets your team ship this week. Not the one that handles 10 million users you don't have. Not the one that looks impressive on a system-design whiteboard. The one that gets features in front of real users, fast.

Start with a modular monolith. Instrument it. Watch the metrics. When — and **only** when — a specific module becomes the bottleneck, extract that one module into a service.

> **Build the monolith. Earn the microservices.**
