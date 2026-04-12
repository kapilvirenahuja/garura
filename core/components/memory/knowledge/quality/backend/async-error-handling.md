# Backend Async Error Handling
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing asynchronous code paths, background jobs, queue consumers, and promise-based logic
**When this does NOT apply:** Synchronous scripts with no async/await or promise chains
**Search patterns:** async, await, promise, unhandled rejection, empty catch, dead letter queue, retry, backoff, graceful shutdown, timeout, error boundary, queue consumer
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers error propagation, swallowing, and recovery patterns in asynchronous code — the most common source of silent production failures. Universal check.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| BE-09 | No empty catch blocks — all catches either rethrow, log with context, or handle explicitly | L2 | grep `catch\s*(\w*)\s*\{\s*\}`, grep `catch\s*\(e\)\s*\{\s*\}` | grep, ESLint (no-empty) |
| BE-10 | No fire-and-forget promises — every `async` call either awaited or `.catch()` attached | L3 | grep for unawated async calls; check for floating promises | eslint-plugin-no-floating-promises |
| BE-11 | Queue consumers implement dead letter queue (DLQ) routing after N failed retries | L3 | Review queue consumer config for DLQ configuration; check retry limit | Manual review |
| BE-12 | External service calls have explicit timeout configuration — no infinite waits | L3 | grep HTTP client instantiation for `timeout:` config; grep `axios.create` or `fetch` wrappers | grep |
| BE-13 | Retry logic uses exponential backoff with jitter — not fixed intervals | L4 | Review retry utilities; check for `sleep(N)` in retry loops | Manual review |
| BE-14 | Graceful shutdown handler registered — in-flight requests drain before process exit | L3 | grep `process.on('SIGTERM'`, `signal.addEventListener`, or framework shutdown hooks | grep |
| BE-15 | Async errors in Express/Fastify route handlers forwarded to error middleware via `next(err)` or async error plugin | L3 | grep route handlers using `async` without try/catch or error plugin | ESLint, grep |
| BE-16 | Process-level unhandled rejection handler present and logs with full context | L2 | grep `process.on('unhandledRejection'` | grep |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| `.catch(() => {})` silencing errors | Catching rejections and discarding them without logging or action | Silent failures — no alert, no trace, no recovery |
| Retry without backoff | Hammering a failing external service at fixed 1s intervals | Thundering herd, worsens downstream outage |
| Queue consumer with no DLQ | Messages that fail repeatedly block or drop silently | Data loss, stuck queues |
| Missing timeout on outbound HTTP | Default Node.js HTTP has no timeout — network partition hangs forever | Thread exhaustion, cascading failure |
| Graceful shutdown not implemented | SIGTERM kills process while requests are in-flight | Request loss, data corruption on writes |

## Why It Matters

Async errors are silent by nature — they don't crash the process, they don't surface in logs unless explicitly handled. A codebase with poor async error handling has a false green health dashboard hiding real failures.

## Applicability Boundaries

**In scope:** Node.js, Python async (asyncio), Go goroutines, Java CompletableFuture, any queue consumer
**Out of scope:** Purely synchronous code; this checklist doesn't apply if there is no async/concurrent execution

## Rationale

Async error handling bugs are the most common class of silent production incident. These checks provide a concrete, grep-able checklist that can be partially automated in CI.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
