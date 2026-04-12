# Coverage and Test Patterns
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any codebase where test suite health needs to be measured or enforced
**When this does NOT apply:** Exploratory scripts, spike solutions, or code that will be discarded
**Search patterns:** coverage, test pyramid, mutation testing, flaky tests, coverage threshold, branch coverage, line coverage, test stability
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Coverage metrics measure the breadth of testing. The test pyramid describes the correct ratio of unit to integration to E2E tests. Together they indicate whether a test suite provides real confidence or only the appearance of it.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| TEST-19 | Line coverage ≥ 60% on business logic modules | L2 | `jest --coverage` / `pytest --cov`; coverage report for `src/` | Jest, pytest-cov |
| TEST-20 | Branch coverage ≥ 50% on business logic modules | L2 | Coverage report shows branch % per file; flag files with <50% branch | Jest, pytest-cov |
| TEST-21 | CI enforces coverage threshold — build fails on regression | L3 | `jest --coverage --coverageThreshold` or `pytest --cov-fail-under` set in CI | Jest, pytest-cov |
| TEST-22 | Test pyramid ratio: unit > integration > E2E | L3 | Count test files by type; unit test count should exceed integration by ≥ 3:1 | grep, manual count |
| TEST-23 | Line coverage ≥ 80% on business logic modules | L4 | Same as TEST-19 but higher threshold enforced in CI | Jest, pytest-cov |
| TEST-24 | Flaky tests are tracked and resolved within 5 business days | L4 | CI failure log shows test failure reason; flaky label in test management tool | GitHub Issues, Buildkite |
| TEST-25 | Mutation testing score ≥ 60% | L5 | Stryker/mutmut report shows surviving mutants below threshold | Stryker, mutmut |
| TEST-26 | Test execution time is monitored and regressed tests are flagged | L5 | CI reports slowest 10 tests; alert if any test exceeds 5 seconds | Jest `--verbose`, pytest-benchmark |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Line coverage theater | 95% line coverage with zero branch coverage | Critical conditional paths completely untested |
| Inverted pyramid | More E2E tests than unit tests | Slow feedback; flaky E2E suite becomes bottleneck |
| Coverage exclusions overuse | `.istanbul.ignore` / `# pragma: no cover` on business logic | Coverage number is fiction |
| Testing only happy paths | 100% coverage but only `if` branch tested, never `else` | Failures hit uncovered branches in production |
| Disabled flaky tests | `test.skip` used to silence flaky tests permanently | Safety net has silent holes |

## Why It Matters

Coverage thresholds without branch coverage are easily gamed. The combination of line coverage + branch coverage + mutation score provides a meaningful measure of test suite strength that correlates with defect escape rate.

## Applicability Boundaries

**In scope:** All hand-written production code; coverage should exclude generated files and vendor code
**Out of scope:** Configuration files, migration scripts, infrastructure-as-code

## Rationale

Coverage standards prevent the "green CI but broken prod" failure mode. They need to be enforced in CI to have any effect — a coverage report that no one looks at is noise.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
