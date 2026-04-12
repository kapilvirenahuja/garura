# Backend API Design Validation
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing HTTP APIs (REST or REST-like) for design consistency, input safety, and operational readiness
**When this does NOT apply:** Internal message bus consumers, batch jobs, or GraphQL-only APIs (separate checklist applies)
**Search patterns:** REST, API design, input validation, rate limiting, pagination, error response, API versioning, Zod, Joi, Pydantic, req.body, req.params, unvalidated input
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers the structural and operational quality of HTTP APIs — from input validation at boundaries to consistent error responses and versioning strategy. Universal check.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| BE-01 | RESTful conventions followed: nouns for resources, HTTP methods match semantics (GET=read, POST=create, PUT/PATCH=update, DELETE=remove) | L2 | Audit route definitions for verb-based paths or mismatched methods | Manual review |
| BE-02 | All request inputs validated at the controller/handler boundary before use (Zod, Joi, Pydantic, class-validator) | L3 | grep `req.body\.`, `req.params\.`, `req.query\.` usages without validation; grep `request.json()` without schema parse | grep, ESLint |
| BE-03 | Validation errors return structured 400 responses with field-level details — not raw stack traces | L3 | Review error handler; test with invalid input | Manual test |
| BE-04 | Rate limiting applied to public/authenticated endpoints (not just unauthenticated ones) | L3 | Check middleware stack for rate limiter; verify per-user limits exist | Manual review |
| BE-05 | All list endpoints support pagination — no unbounded queries returning full table scans | L3 | grep route handlers returning arrays without `limit`/`offset` or cursor params | grep, Manual review |
| BE-06 | Consistent error response format across all endpoints: `{ error: { code, message, details? } }` | L3 | Audit error responses from 3+ endpoints for structural consistency | Manual test, contract test |
| BE-07 | API versioning strategy present: URL prefix (`/v1/`), header, or content negotiation — documented | L4 | Check route prefixes or headers; verify version strategy is documented | Manual review |
| BE-08 | No sensitive data in URL paths or query strings (tokens, passwords, PII) | L2 | grep route patterns for `:token`, `:password`, `?email=`, `?ssn=` | grep |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Unvalidated `req.body` used directly | `const { email } = req.body` without schema validation before DB operations | Injection, type confusion, runtime crashes |
| 200 OK on error | Returning HTTP 200 with `{ success: false }` body | Clients can't distinguish success from failure without parsing body |
| No pagination on list routes | `GET /users` returns all 500K users | OOM errors, timeout, DDoS amplification |
| Version-less public API | No versioning strategy; breaking changes deployed directly | Immediate client breakage |
| Rate limiting only at auth endpoints | Login rate-limited but expensive read endpoints unprotected | Resource exhaustion by authenticated users |

## Why It Matters

API design debt is expensive to fix after clients exist. Unvalidated inputs are the most common vector for injection attacks and production runtime errors. Rate limiting and pagination are the difference between an API that survives launch and one that doesn't.

## Applicability Boundaries

**In scope:** HTTP REST APIs in any language (Node.js, Python, Go, Java, .NET)
**Out of scope:** GraphQL APIs (different validation model), gRPC services, internal-only message consumers

## Rationale

These checks represent baseline production readiness for any public or partner-facing API. They are tool-agnostic and language-agnostic, making them appropriate as universal organizational standards.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
