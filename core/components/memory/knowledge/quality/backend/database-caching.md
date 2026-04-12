# Backend Database and Caching Patterns
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing database query patterns, caching strategy, and connection configuration in backend services
**When this does NOT apply:** Stateless compute with no database or cache dependency
**Search patterns:** N+1 query, query optimization, indexes, explain plan, migration safety, connection pooling, cache invalidation, cache stampede, Redis, SELECT *, raw SQL, ORM
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers the runtime correctness and performance of database access — N+1 detection, index hygiene, migration safety, connection pooling, and cache reliability. Universal check.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| BE-17 | No N+1 query patterns — related entities loaded with joins or batch loads, not in loops | L3 | grep `for` / `forEach` loops containing DB calls; check ORM eager loading config | ORM query logs, Datadog APM |
| BE-18 | No `SELECT *` in production queries — explicit column selection used | L2 | grep `SELECT \*` in raw SQL; check ORM `.findAll()` without `attributes` | grep |
| BE-19 | Slow queries identified via EXPLAIN ANALYZE — queries on large tables have supporting indexes | L4 | Run `EXPLAIN ANALYZE` on the top 5 most-called queries; check for Seq Scan on large tables | pg_stat_statements, EXPLAIN |
| BE-20 | Database migrations are zero-downtime compatible — no blocking locks on large tables | L4 | Review migrations for `ALTER TABLE ... ADD COLUMN NOT NULL` without default; check for index creation `CONCURRENTLY` | Manual review |
| BE-21 | Connection pool configured and sized — not using default (usually too small) | L3 | grep database client instantiation for `pool:` config; verify `max` connections set | Manual review |
| BE-22 | Cache invalidation strategy explicit — cache entries evicted on write, not just TTL-expired | L3 | Review mutation handlers for corresponding cache delete/invalidation calls | Manual review |
| BE-23 | Cache stampede prevention in place for high-traffic keys (mutex lock or probabilistic early expiry) | L4 | Review cache read path for lock-before-compute or staggered TTL pattern | Manual review |
| BE-24 | Raw SQL in application code validated — parameterized queries used, no string concatenation | L2 | grep `query(` or `execute(` with string template literals containing user input | grep, ESLint |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| N+1 in REST list endpoints | Fetching parent records then querying each child in a loop | 100-row response triggers 101 queries |
| `ALTER TABLE` without CONCURRENTLY | Adding an index on a 10M-row table locks writes for minutes | Production outage during migration |
| Single shared Redis connection | No connection pooling; one slow command blocks all callers | Latency spikes across all cache operations |
| TTL-only cache invalidation | Cache entries expire after 5 minutes but writes don't evict | Stale reads for up to 5 minutes after update |
| Unconfigured connection pool | `new Pool()` with default `max: 10` for a service handling 500 concurrent requests | Connection exhaustion, timeouts |

## Why It Matters

Database performance issues are the most common cause of production incidents in data-backed services. N+1 queries that pass in development collapse under real load. Migration safety failures cause outages during deployments.

## Applicability Boundaries

**In scope:** Any backend service using a relational or NoSQL database and/or Redis-style cache
**Out of scope:** Serverless functions with sub-second execution times where connection pooling models differ (use PgBouncer or Data API instead)

## Rationale

These checks are high-leverage: a single N+1 fix or index addition can eliminate 90% of query load. They are concrete, measurable, and can be partially automated through query log analysis.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
