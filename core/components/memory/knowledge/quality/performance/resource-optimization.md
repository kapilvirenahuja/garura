# Resource Optimization Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any service with measurable resource consumption: memory, CPU, network, or frontend bundle size
**When this does NOT apply:** Proof-of-concept services not serving real traffic or scripts run once
**Search patterns:** memory leak, connection pool, caching, CDN, lazy loading, code splitting, bundle size, query optimization, N+1, index
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Resource optimization prevents the class of performance problems caused by wasteful use of existing capacity: leaked connections, unbounded caches, oversized bundles, and missing database indexes.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| PERF-17 | Memory leak detection: load test with heap sampling; no unbounded growth over 30-minute run | L3 | Run load test + heap profiler; heap at t=30min must be ≤ 110% of t=5min | pprof, heapdump, Chrome DevTools |
| PERF-18 | Connection pooling configured for all database and external service clients | L2 | Grep for pool config: `pool_size`, `maxConnections`, `connectionLimit`; flag unconfigured clients | grep, code review |
| PERF-19 | Caching strategy documented: what is cached, TTL, invalidation mechanism | L3 | Check ADR or runbook for cache topology; verify TTL values are explicit, not infinite | Redis, Memcached, CDN config |
| PERF-20 | CDN configured for all static assets (JS, CSS, images, fonts) | L2 | Verify static asset URLs resolve to CDN origin (e.g., CloudFront, Fastly); check cache headers | Network tab, CDN config |
| PERF-21 | Frontend: lazy loading and code splitting applied; initial bundle ≤ 200KB gzipped | L3 | Run `webpack-bundle-analyzer` or `source-map-explorer`; check initial JS chunk size | webpack-bundle-analyzer |
| PERF-22 | Database queries reviewed for N+1 patterns; ORM eager loading configured where needed | L3 | Enable query logging in staging; flag queries that scale with result set size | ORM query log, Bullet (Rails) |
| PERF-23 | Database indexes exist for all high-cardinality columns used in WHERE/JOIN/ORDER BY | L3 | Run `EXPLAIN ANALYZE` on top-10 queries by frequency; flag full table scans | EXPLAIN ANALYZE, pg_stat_statements |
| PERF-24 | Bundle size tracked in CI: build fails if initial bundle exceeds defined threshold | L4 | Verify CI step runs bundle size check (e.g., `bundlesize`, `size-limit`); threshold in config | bundlesize, size-limit |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Connection per request (no pooling) | New DB connection opened and closed per HTTP request | Connection exhaustion under load; 10x latency overhead |
| Infinite TTL cache with manual invalidation | Cache entries live forever; invalidation is ad hoc | Stale data served indefinitely; invalidation bugs cause incidents |
| No N+1 protection in ORM | Relationships loaded lazily inside loops; 1 query becomes N+1 | 100-row result triggers 101 DB queries; linear scaling to timeout |
| Monolithic JS bundle served on initial load | All application code in one chunk; no route-based splitting | 3+ second first-contentful-paint on mid-range devices |
| Missing index on foreign key column | JOIN on unindexed foreign key causes sequential scan | Full table scan on every join; query time scales with table size |

## Why It Matters

Resource inefficiency is invisible until scale. A missing connection pool works fine at 10 RPS and collapses at 1000. Catching these patterns early is orders of magnitude cheaper than emergency optimization under an outage.

## Applicability Boundaries

**In scope:** Backend services with database access, frontend applications with build tooling, any service using external APIs or caches
**Out of scope:** Read-only static sites with no dynamic backend, CLIs running on developer machines

## Rationale

Most performance problems are not algorithmic — they are structural: missing indexes, untuned pools, oversized bundles. These patterns are grep-detectable and fixable before they compound.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
