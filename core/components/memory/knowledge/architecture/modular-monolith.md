---
id: architecture/modular-monolith
title: "Modular monolith: one deployment, enforced module boundaries — the default start"
conditions:
  stage: early            # prototype | early | growth | scale
  team-size: under-15     # under-15 | 15-20 | over-20
  scale: under-500k-mau   # under-50k | under-500k | over-500k MAU
  deploy-cadence: single  # single team/cadence | multiple independent cadences
  scalability: low-to-mid
evolve_when:
  - architecture/microservices
provenance: "documented (recovered from the prior KB into the v1 KB under #434)"
---

# Modular monolith: one deployment, enforced module boundaries — the default start

## Topic
The backend/product architecture to start with: a single deployment unit with
**enforced module boundaries**, shared infrastructure, and independent business
logic per domain. Not a compromise on the way to microservices but an
evolutionary path — **build the monolith, earn the microservices.**

## Conditions

### When to choose
The right starting point for most new products. It gives the organizational
benefit of service boundaries without the operational overhead of a distributed
system. Choose it when the team is small (< 15 developers), the product is
pre-PMF or early growth, and the priority is shipping fast. It fits especially
well when the team shares one language (TypeScript, Java, C#) and deploys as one
unit. Low delivery-ambition and low-to-mid scalability needs strongly favor it —
you are optimizing for speed, not scale. Even at mid scalability a well-structured
monolith with read replicas and caching handles hundreds of thousands of users.

> "Almost all successful microservice stories have started with a monolith that
> got too big and was broken up." — Martin Fowler
>
> "If you can't build a well-structured monolith, microservices won't save you."
> — Simon Brown (C4 model)

### When to avoid
Independent deploy cadences (separate teams releasing on different schedules);
regulatory rules mandating physical service isolation (some BFSI, healthcare);
features needing fundamentally different stacks (a Python ML pipeline beside a
TypeScript web app); extending an already-distributed system; or a team that has
genuinely already outgrown a monolith — going backward is wasteful.

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Team size | 1–10 devs | 10–20 | > 20 with independent cadences |
| MAU | 0–50K | 50K–500K | > 500K (workload-dependent) |
| Data volume | < 100GB | 100GB–1TB | > 1TB (sharding) |
| Deploy frequency | Multiple daily | Daily | < weekly (too much coordination) |

## Recommendation

### Modules as bounded contexts
Treat each module as a DDD **bounded context** — a business capability with its
own language, entities, and invariants — not a technical grouping. That is what
makes this an *extraction-ready* monolith: when scale eventually justifies a
service boundary, the module already maps cleanly to what a microservice would
own. Technical groupings (utility layers, shared helpers) are **not** modules —
they live in `shared/`. Every module must be (1) independent and interchangeable,
(2) self-contained for its capability, (3) exposed only through a defined public
API. Cross-module work goes through those APIs or an in-process event bus — never
shared state or direct table access.

### Three principles (skip the textbook)
1. **Vertical slices, not horizontal layers.** Build a `billing/` folder that
   owns its routes, logic, and queries — not a `services/` + `controllers/`
   split. When it is time to extract, you grab the folder, not 40 scattered files.
2. **No cross-module database joins.** The moment `orders` raw-JOINs
   `users.accounts`, the two modules are welded. Use an internal API call —
   slower today, saves six months of untangling later.
3. **Every module talks through explicit contracts.** TypeScript interfaces, Zod
   schemas — never pass raw objects across a boundary. On the day you extract a
   service, that interface becomes the API contract with zero rewriting.

### Reference structure
```
src/
├── modules/
│   ├── auth/    api/ domain/ data/ events/ index.ts   # index.ts = the only public surface
│   ├── payments/ ...
│   └── commerce/ ...
├── shared/      middleware/ database/ events/         # cross-cutting + in-process event bus
└── app.ts                                             # composition root
```
Modules import each other only via `index.ts`; each owns its tables; the
in-process event bus carries async cross-module flows.

### The three-phase evolutionary path (zero rework between phases)
1. **Modular monolith, vertical slices (0–10K MAU).** One codebase, loosely
   coupled modules, single DB with schema-per-module. Route handlers double as
   the BFF layer — establish URL contracts early even when calling local code.
2. **API-first / headless (10K–100K MAU).** Refactor route handlers to return
   JSON instead of HTML — same file, same URL, same deployment. The frontend
   becomes a pure client; any client (web, mobile, partner) can consume it. A
   refactor, not a rewrite.
3. **Strangler fig extraction (100K+ MAU).** The BFF proxies transparently to
   either co-located logic or an extracted service. Pull out one hot module at a
   time (e.g. checkout); the frontend never knows. Extract logic **and** data and
   redirect all consumers — never extract logic while sharing the database.

## Rationale
Microservices rarely kill startups through technical failure — they kill through
**slowed velocity**. Before PMF, every hour on service-mesh config is an hour not
spent on user feedback. From day one premature microservices cost separate CI/CD
per service, distributed-system debugging, service discovery, eventual-consistency
handling, and 2–4× the infra-engineering overhead.

| Evidence | Data point |
|----------|-----------|
| Teams regretting premature microservices | ~60% (small-to-medium apps) |
| Orgs that consolidated back to a monolith | ~42% |
| Cost savings with a modular monolith (< 10 devs) | ~25% |
| Microservices benefit threshold | teams > 10 developers |

None of the canonical microservices stories *started* distributed — each earned
decomposition under scale pressure: Netflix (~10M subs, after a 3-day outage),
Amazon (retail-scale monolith bottleneck), Shopify (2.8M LOC, ~1K devs), GitHub
(selective auth extraction). Basecamp still runs a monolith at millions of users.

Tradeoffs worth naming: a monolith is fastest for a small team (no network calls,
no deploy coordination) but slows as the team grows and deploy conflicts rise;
single process means stack traces span the whole request but per-module perf is
harder to isolate; minimal infra (one container) but vertical scaling has limits.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| — | Modular monolith (Phase 1) | Greenfield — start here, vertical slices from day one |
| Spaghetti monolith | Modular monolith | Boundaries needed — refactor into modules gradually |
| Modular monolith | API-first / headless (Phase 2) | Mobile / partner clients (~10K+ MAU) |
| API-first | [Microservices](./microservices.md) via strangler fig (Phase 3) | A specific module must scale independently, needs a different stack, or a separate team will own and deploy it (~100K+ MAU) |

Agree the extraction criteria **before** anyone proposes microservices: a module
needs independent scaling, a different tech stack, separate-team ownership, or the
monolith's deploy/rollback has become a bottleneck. If none hold, the microservice
isn't earned yet.

## Anti-patterns
- **Big ball of mud** — no boundaries; unmaintainable within months.
- **Cross-module DB joins / shared internal state** — welds modules, kills the
  extraction path.
- **Horizontal top-level folders** (`services/`, `controllers/`) — extraction
  becomes a file hunt instead of grabbing one folder.
- **Passing raw objects across boundaries** — no contract exists on extraction day.
- **Premature extraction** — wrong boundaries cost more than the debt ever would.
- **Architecture cosplay** — copying Netflix's pattern without Netflix's problem.

## Provenance
documented — the user's modular-monolith architecture learning, recovered from the
prior KB (`arch/patterns/modular-monolith.md`) and reshaped into the v1 template
under #434. Old profile codes (PP-6 delivery ambition, NFR-6 scalability) were
translated to plain conditions.
