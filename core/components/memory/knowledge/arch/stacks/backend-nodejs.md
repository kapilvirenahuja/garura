# Node.js Backend

JavaScript/TypeScript server-side runtime — event-driven, non-blocking I/O, vast npm ecosystem.

**Search patterns:** Node.js, Express, Fastify, NestJS, TypeScript backend, JavaScript, npm, server-side, API, event loop

## When to Choose

Node.js is the natural backend choice when the frontend is React/Vue/Svelte — same language (TypeScript) across the entire stack. It excels at I/O-heavy workloads: APIs, real-time applications (WebSocket/Socket.io), microservices, and BFF layers. The npm ecosystem is the largest in software — there's a package for almost everything. Choose when the team is JavaScript/TypeScript-first, the workload is I/O-bound (not CPU-bound), and development speed matters. Startups and small teams benefit from full-stack TypeScript — one language, shared types, shared validation. Products with real-time features (chat, notifications, collaborative editing) benefit from Node's event-driven model.

## When to Avoid

Avoid for CPU-intensive workloads — image processing, ML inference, heavy computation. The single-threaded event loop blocks on CPU work. Avoid when the team has strong Java, C#, Go, or Python expertise — switching to Node for the backend when the frontend team is separate provides no benefit. Avoid for very large enterprise backends where NestJS's structure isn't enough and Java/Spring or .NET's enterprise patterns are preferred. Avoid when type safety at the ecosystem level matters more than development speed — Go and Rust provide stronger guarantees.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-30 | 30-100 | > 100 (need strict framework like NestJS) |
| Requests/sec | 10K-100K (I/O-bound) | 100K+ | CPU-bound workloads (use Go, Rust) |
| Complexity | APIs, BFFs, microservices, real-time | Monolithic enterprise backend | Heavy computation, ML serving |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Framework | Express (minimal), Fastify (performance), NestJS (enterprise), Hono (edge) | Express for simplicity; Fastify for speed; NestJS for enterprise structure; Hono for edge/serverless |
| ORM/DB | Prisma, Drizzle, TypeORM, Knex | Prisma for DX; Drizzle for performance + type safety; TypeORM for enterprise patterns |
| Validation | Zod, Joi, class-validator (NestJS), ArkType | Zod for ecosystem standard; class-validator for NestJS |
| Auth | Passport.js, custom JWT, Clerk SDK, Auth0 SDK | Passport for self-hosted strategies; Clerk/Auth0 for managed |
| Testing | Vitest, Jest, Supertest, Playwright (E2E) | Vitest for speed; Jest for ecosystem; Supertest for API testing |
| Real-time | Socket.io, ws, Server-Sent Events | Socket.io for broad compatibility; ws for performance; SSE for one-way |

## Reference Architecture

```
src/
├── modules/                  # Domain modules (feature-first)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.types.ts
│   └── orders/
│       └── ...
├── shared/
│   ├── middleware/           # Auth, logging, error handling, rate limiting
│   ├── database/            # Connection, migrations
│   ├── events/              # Event bus (in-process or broker)
│   └── utils/
├── config/                   # Environment, secrets, feature flags
├── app.ts                    # App setup, middleware chain
└── server.ts                 # Server bootstrap
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Express (minimal) | NestJS (structured) | Team growing, need governance | Migrate module by module; NestJS wraps Express |
| Node monolith | Node microservices | Team split, scaling needs | Extract modules behind existing API; NestJS microservices package |
| Node backend | Node + Python sidecar | ML/AI features needed | Python service for ML; Node for API; communicate via gRPC or queue |
| Node backend | Go for hot paths | CPU-bound bottleneck | Rewrite specific service in Go; keep Node for I/O-heavy services |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Full-stack TypeScript | Shared types, validation, utilities between frontend and backend | TypeScript adds build step complexity |
| Ecosystem | Largest package ecosystem (npm) | Dependency security risks, quality variance |
| Development speed | Fast to prototype and iterate | Can lead to spaghetti without framework discipline |
| I/O performance | Excellent for concurrent I/O (event loop) | Single-threaded — CPU-bound work blocks everything |
| Real-time | Native event-driven model suits WebSocket, SSE | Memory management at scale needs attention |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Callback hell | Deeply nested callbacks instead of async/await | Unreadable, error-prone code |
| Blocking the event loop | CPU-intensive synchronous code on the main thread | All requests stall, server becomes unresponsive |
| No input validation | Trusting client input without validation | Injection attacks, data corruption |
| Express without structure | Flat file of routes with inline logic | Unmaintainable past 20 endpoints |
| Package sprawl | Hundreds of npm dependencies for trivial functions | Security vulnerabilities, bundle bloat, supply chain risk |
