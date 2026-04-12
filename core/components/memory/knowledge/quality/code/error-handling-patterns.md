# Error Handling Patterns
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any production service, API, or library that handles failures from I/O, network, or user input
**When this does NOT apply:** Pure computational functions with no I/O or external dependencies
**Search patterns:** error handling, error types, custom errors, error boundary, logging, recovery, user-facing errors, try-catch, Result type
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Error handling is where most production incidents originate — not in the happy path, but in the handling of failures. Poor error handling manifests as swallowed exceptions, uninformative error messages, missing logs, and cascading failures.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| CODE-23 | Custom error types defined for domain errors (not raw `Error` or `Exception`) | L2 | grep `throw new Error(` for untyped throws; check for `errors/` or `exceptions/` directory | grep |
| CODE-24 | Errors are never silently swallowed (empty catch blocks) | L2 | grep `catch\s*{[^}]*}` or `except:\s*pass`; ESLint `no-empty` rule | ESLint, grep |
| CODE-25 | Errors are logged with context (stack trace + relevant identifiers) | L3 | grep for `catch` blocks without logger call; check logger includes `err.stack` or equivalent | grep, logger audit |
| CODE-26 | User-facing error messages never expose stack traces or internal details | L3 | grep API response serializers for `stack` field; test error responses return generic messages | grep, integration tests |
| CODE-27 | Error recovery is explicit: retry with backoff, fallback, or circuit breaker | L4 | grep for `retry`, `backoff`, circuit breaker library usage in service clients | grep |
| CODE-28 | Error boundaries present at service entry points (API handlers, queue consumers) | L4 | Every HTTP handler has a top-level try/catch or middleware wrapper; grep for unguarded `async` handlers | grep, middleware audit |
| CODE-29 | Result/Either types used for expected failures instead of exceptions | L4 | Check for `neverthrow`, `fp-ts`, `Result<T,E>` usage; grep for try-catch in business logic | grep |
| CODE-30 | Error handling coverage enforced: error paths have explicit tests | L5 | Coverage report shows error branches covered; mutation testing validates error path assertions | Jest/pytest coverage, Stryker |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Pokemon exception handling | `catch (Exception e) {}` — catch-all with no action | Hides failures; production incidents with no trace |
| String comparison errors | `if (err.message === "Not found")` | Brittle; breaks on message changes |
| Error swallowing in async | `promise.catch(() => {})` with no log or rethrow | Silent failures in async chains |
| Exposing internals | Returning `err.stack` in API 500 response | Leaks implementation details to attackers |
| Re-throw without context | `catch (e) { throw e; }` loses the call context | Stack trace doesn't help diagnose root cause |

## Why It Matters

Silent failures are the hardest class of production bug to diagnose. An error that is logged with context costs 15 minutes to fix. The same error swallowed can cost days of investigation.

## Applicability Boundaries

**In scope:** Service layers, API handlers, queue consumers, external API clients, database access layers
**Out of scope:** Pure mathematical/transformation functions, code that explicitly documents "let it crash" semantics (e.g., Erlang-style supervisors)

## Rationale

Error handling patterns cannot be retrofitted easily — they require consistent discipline from the first line of code. These checks prevent the pattern of "add logging later" which never happens.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
