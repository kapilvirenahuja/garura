# API Design and Scalability
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a project's API contracts are well-structured and designed for growth
**When this does NOT apply:** Internal-only scripts or CLIs with no external API surface
**Search patterns:** REST conventions, API versioning, error response, pagination, rate limiting, scaling, HTTP methods, status codes
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project's API layer follows established conventions for correctness, consistency, and capacity to scale — so consumers can rely on stable contracts and operators can handle traffic growth.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| ARCH-17 | HTTP methods match semantic intent (GET reads, POST creates, PUT/PATCH updates, DELETE removes) | All | Grep route definitions for method/action mismatches | Grep route files |
| ARCH-18 | HTTP status codes are used consistently and correctly (200/201/204/400/401/403/404/422/500) | All | Sample 5-10 endpoints; check return codes against action | Code review |
| ARCH-19 | API versioning strategy is defined and applied (URL prefix, header, or content negotiation) | All | Check for `/v1/` prefix or `Accept-Version` header handling | Grep routes |
| ARCH-20 | Error responses follow a consistent schema across all endpoints | All | Compare error bodies from 3+ endpoints for structural consistency | API testing |
| ARCH-21 | List endpoints implement pagination (cursor or offset) | All | Check if collection endpoints return unbounded arrays | Grep response shapes |
| ARCH-22 | Rate limiting is implemented or documented as a known gap | All | Check for middleware (express-rate-limit, nginx limit_req) or explicit ADR noting absence | Grep middleware |
| ARCH-23 | Scaling considerations are documented (stateless design, horizontal scalability, session handling) | All | Check README, ADR, or architecture docs for scaling notes | Read docs |
| ARCH-24 | Breaking vs non-breaking change policy exists (deprecation headers, changelog, or versioning increment rule) | All | Check CHANGELOG, ADR, or API guidelines document | Read docs, Glob |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Verb-in-URL REST | `/api/getUsers`, `/api/createUser` instead of `GET /users`, `POST /users` | Clients can't predict routes; breaks tooling expectations |
| Unversioned public API | Breaking changes deployed with no version increment | Consumers broken without notice |
| Inconsistent error schema | Some endpoints return `{ error: "..." }`, others `{ message: "..." }`, others plain strings | Client error handling becomes endpoint-specific |
| Unbounded list responses | Collection endpoint returns all records with no pagination | Database and memory pressure at scale |
| Stateful API servers | Session state stored in server memory | Horizontal scaling impossible without sticky sessions |

## Why It Matters

API design debt is expensive to fix once consumers exist. A missing versioning strategy means every breaking change requires coordinating all consumers simultaneously. Inconsistent error schemas mean every client must handle errors differently. These are design decisions that calcify early and cost disproportionately to correct later.

## Applicability Boundaries

**In scope:** HTTP APIs (REST, REST-like) intended for external or inter-service consumption
**Out of scope:** GraphQL APIs (different conventions apply), internal function calls, event-driven message schemas

## Rationale

API surface area is a contract. Assessing adherence to established conventions before the API has consumers is the cheapest point to course-correct. After consumers exist, correctness requires deprecation cycles and coordination.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
