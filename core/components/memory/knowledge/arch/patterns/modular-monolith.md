# Modular Monolith

Single deployment unit with enforced module boundaries, shared infrastructure, and independent business logic per domain.

**Search patterns:** monolith, modular, single deployment, small team, startup, module boundaries, vertical slices, domain modules

## When to Choose

The modular monolith is the right starting point for most new projects. It gives you the organizational benefits of service boundaries without the operational overhead of distributed systems. Choose it when the team is small (< 15 developers), the product is pre-PMF or early growth, and the priority is shipping fast. It works especially well when the team shares a single language (TypeScript, Java, C#) and deploys as one unit. PP-6 (Delivery Ambition) 1-3 strongly favors monolith — you're optimizing for speed, not scale. NFR-6 (Scalability) 1-3 is well within monolith territory. Even at NFR-6 = 4, a well-structured monolith with read replicas and caching handles hundreds of thousands of users.

## When to Avoid

Avoid when the team has independent deploy cadences (separate teams releasing on different schedules), when regulatory requirements mandate physical service isolation (certain BFSI, healthcare), when features need fundamentally different tech stacks (ML pipeline in Python alongside a TypeScript web app), or when you're extending an existing distributed system. Don't force a monolith on a team that's already distributed. Also avoid if the organization has already proven they need microservices — going backward is wasteful.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-10 developers | 10-20 | > 20 with independent cadences |
| MAU | 0-50K | 50K-500K | > 500K (depends on workload) |
| Data volume | < 100GB | 100GB-1TB | > 1TB (sharding needed) |
| Deploy frequency | Multiple daily | Daily | < weekly (too much coordination) |

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
| — | Modular Monolith | Greenfield project | Start here |
| Modular Monolith | API-First | Mobile/partner clients needed | Refactor route handlers to return JSON; same deployment |
| Modular Monolith | Selective Extraction | Hot-path bottleneck OR team split | Strangler fig: extract module behind existing API contract |
| Spaghetti Monolith | Modular Monolith | Code organization needed | Refactor into modules; establish boundaries gradually |

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
| Premature extraction | Extracting services before understanding domain boundaries | Wrong boundaries are expensive to fix |
| God module | One module accumulates all business logic | Defeats the purpose of modularization |
| Shared mutable state | Global singletons, shared caches without clear ownership | Race conditions, unpredictable behavior |
