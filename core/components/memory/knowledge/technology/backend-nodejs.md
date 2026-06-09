---
id: technology/backend-nodejs
title: "Node.js backend: full-stack TypeScript for I/O-bound work"
conditions:
  surface: backend-api
  stack: node-typescript
  workload: io-bound
  team-size: 1-30
  stage: early-or-growth
evolve_when: []
provenance: "documented (recovered from the prior KB into the v1 KB under #434)"
---

# Node.js backend: full-stack TypeScript for I/O-bound work

## Topic
The backend runtime choice: a JavaScript/TypeScript server — event-driven,
non-blocking I/O, vast npm ecosystem. Strongest when it shares a language with the
frontend.

## Conditions

### When to choose
The frontend is React/Vue/Svelte and you want **one language** across the stack
with shared types and validation; the workload is I/O-heavy (APIs, real-time,
BFFs, microservices); npm-speed matters; the team is JS/TS-first. Real-time
features (chat, notifications, collaborative editing) come naturally. A strong fit
for startups and for the BFF layer of a [modular monolith](../architecture/modular-monolith.md).

### When to avoid
CPU-intensive workloads (the event loop blocks on CPU); a team with deep
Java/C#/Go/Python expertise (no payback to switch); very large enterprise backends
where structure matters more than velocity (Java/Spring fits better); or
serverless-first where cold starts hurt.

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Team size | 1–30 | 30–100 | > 100 (need a strict framework, e.g. NestJS) |
| Throughput | 10K–100K req/s I/O-bound | 100K+ | CPU-bound (move hot path to Go/Rust) |
| Complexity | APIs / BFFs / real-time | monolithic enterprise | heavy compute (avoid) |

## Recommendation
| Concern | Options | Guidance |
|---------|---------|----------|
| Framework | Express; Fastify; NestJS; Hono | minimal / perf / enterprise-structure / edge |
| ORM | Prisma; Drizzle; TypeORM; Knex | DX vs perf+types vs enterprise vs SQL-builder |
| Validation | Zod; class-validator | Zod is the ecosystem default |
| Auth | Passport; Clerk/Auth0 | self-hosted strategies vs managed |
| Testing | Vitest; Jest; Supertest; Playwright | Vitest for speed; Supertest for APIs |
| Real-time | Socket.io; ws; SSE | compatibility / perf / one-way |

Reference shape: feature-first `modules/` (controller, service, repository,
types), `shared/` (middleware, db, events, utils), `config/`, `app.ts`,
`server.ts`. The same vertical-slice discipline as the modular monolith applies.

## Rationale
The gains: full-stack TypeScript (shared types, validation, utilities), the
largest package ecosystem, fast prototyping, excellent I/O throughput on the event
loop, and native real-time. The costs: TS build complexity, dependency-security
surface, quality variance across npm, and a real tendency toward spaghetti without
discipline — plus single-threaded CPU blocking and memory management at scale. The
discipline that keeps it coherent is the same module-boundary rule the monolith
uses.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| Express | NestJS | team growing, need governance — migrate module-by-module (NestJS wraps Express) |
| Node monolith | Node microservices | team split / scaling — extract modules behind APIs |
| Node | Node + Python sidecar | ML/AI features — Python for ML, Node for API, gRPC/queue between |
| Node | Go for hot paths | CPU bottleneck — rewrite the specific service, keep Node for I/O |

## Provenance
documented — recovered from the prior KB (`arch/stacks/backend-nodejs.md`) and
reshaped into the v1 template under #434.
