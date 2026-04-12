# Integration and E2E Testing Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Services with external API dependencies, database interactions, or user-facing UI flows
**When this does NOT apply:** Internal utility libraries with no I/O or UI
**Search patterns:** integration test, e2e, end-to-end, cypress, playwright, pact, contract testing, API test, database test, supertest
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Integration and E2E tests validate that components work correctly together. They catch the class of bugs that unit tests cannot — mismatched API contracts, broken DB queries, UI flows that fail across component boundaries.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| TEST-11 | API endpoints have integration tests with real HTTP (not mocked router) | L3 | grep for `supertest`/`httptest`/`requests` in test files; at least one test per endpoint | supertest, httptest |
| TEST-12 | Database integration tests run against a real DB (test container or test schema) | L3 | `docker-compose.test.yml` exists or `testcontainers` used; grep for in-memory DB substitutes in integration tests | Testcontainers, Docker |
| TEST-13 | E2E tests cover the top 3 critical user journeys | L3 | Cypress/Playwright spec files exist; journey list documented in test README | Cypress, Playwright |
| TEST-14 | Contract tests defined for all inter-service API dependencies | L4 | Pact provider/consumer tests exist; pact broker configured | Pact |
| TEST-15 | E2E tests run in CI on every PR (not just nightly) | L4 | CI pipeline config shows E2E step; check `.github/workflows/` or equivalent | GitHub Actions |
| TEST-16 | Integration tests clean up state after each run | L4 | Each integration test has teardown; DB tests use transactions rolled back or truncated | pytest fixtures, Jest afterEach |
| TEST-17 | Browser E2E tests run across 2+ browsers in CI | L5 | Playwright config lists `chromium`, `firefox`, `webkit` projects | Playwright |
| TEST-18 | API contract breaking changes detected automatically | L5 | Pact can-i-deploy check in CI; consumer-driven contract violations block merge | Pact |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Mocked integration test | "Integration test" that mocks the database or HTTP calls | Gives false assurance; real integration bugs remain |
| Flaky E2E suite | E2E tests that fail 20%+ of the time without code changes | Team disables tests; safety net disappears |
| Integration tests as unit tests | Running integration test suite for every function | Slow feedback loop; devs stop running tests locally |
| Shared E2E test database | Multiple CI runs share one DB instance with no isolation | Tests interfere; random failures across PRs |

## Why It Matters

Integration bugs are responsible for a disproportionate share of production incidents. The gap between "unit tests pass" and "system works" is where integration tests live.

## Applicability Boundaries

**In scope:** HTTP APIs, database-backed services, microservice boundaries, user-facing UI workflows
**Out of scope:** Pure in-process libraries, data pipelines with no service boundaries

## Rationale

Integration and E2E test standards protect against the false confidence of a green unit test suite. They are the last automated gate before production.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
