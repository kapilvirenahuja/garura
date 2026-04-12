# Load Testing and Profiling Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any service handling user traffic or latency-sensitive workloads
**When this does NOT apply:** Internal batch jobs with no user-facing SLA or developer tooling scripts
**Search patterns:** load test, k6, artillery, jmeter, locust, flame graph, memory profiling, benchmark, performance budget, CI performance
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Load testing and profiling practices establish a measured baseline for performance and expose regressions before they reach production. Without tooling and baselines, performance is undocumented opinion.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| PERF-01 | Load testing tool present in repo or CI pipeline | L1 | Check for k6, Artillery, JMeter, or Locust config/scripts in repo | k6, Artillery, JMeter, Locust |
| PERF-02 | At least one load test scenario covers the critical user path | L2 | Verify scenario file exercises primary API endpoints or UI flows | k6 scenarios, Artillery phases |
| PERF-03 | Performance budget defined: p95 latency target documented per endpoint | L2 | Check docs, ADR, or CI threshold config for numeric latency targets | k6 thresholds, Artillery ensure |
| PERF-04 | Flame graph or CPU profiling evidence exists for hot paths | L3 | Check for profiling output files or links in runbooks/postmortems | pprof, async-profiler, py-spy |
| PERF-05 | Memory profiling performed: no unbounded growth under sustained load | L3 | Load test with memory tracking enabled; check for heap growth trend | pprof, Valgrind, Chrome DevTools |
| PERF-06 | Benchmark suite exists for performance-critical functions | L3 | Check for benchmark files (`*_bench_test.go`, `bench*.js`, `*benchmark.py`) | Go benchmark, benchmark.js |
| PERF-07 | Load tests run in CI pipeline on PR merge to main | L4 | Verify CI config (GitHub Actions, GitLab CI) includes load test step | CI config files |
| PERF-08 | Baseline performance metrics documented and version-pinned | L4 | Check runbook or ADR for current p50/p95/p99 baseline with timestamp | Grafana snapshots, k6 cloud |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Load test exists but runs only manually | Tests never run in CI; regressions ship undetected | Performance degrades silently across releases |
| Latency targets as verbal agreement only | No numeric threshold in config or docs | Impossible to fail a build on regression; no shared standard |
| Profiling done once at launch, never again | Profiles represent initial state; changed code paths not profiled | Hot paths from new features go unmeasured |
| Load test hits only happy path | Error paths, retries, and timeouts not tested under load | Cascading failures under stress go undetected pre-production |
| Benchmark suite but no comparison baseline | Benchmarks run but output never compared to prior run | Regressions pass unnoticed; benchmarks become decorative |

## Why It Matters

A system without load tests has unknown capacity. A system without profiling has unknown bottlenecks. Performance regressions discovered in production cost 10x more to fix than those caught in CI.

## Applicability Boundaries

**In scope:** User-facing services, APIs, background workers with throughput SLAs, frontend assets with Core Web Vitals targets
**Out of scope:** One-off migration scripts, local developer tooling, admin utilities with <10 users

## Rationale

Performance problems compound. A 50ms regression per release becomes a 500ms regression after 10 releases. Load testing and profiling are the only early-warning systems.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
