# Unit Testing Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any production codebase with business logic or service layers
**When this does NOT apply:** Purely declarative config, infrastructure-as-code without logic branches
**Search patterns:** unit test, jest, pytest, mocha, arrange-act-assert, AAA, mocking, stubbing, test isolation, mutation testing
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Unit tests are the fastest feedback loop in software development. They validate individual functions and classes in isolation. Poorly written unit tests are worse than no tests — they create false confidence, break on trivial refactors, and slow teams down.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| TEST-01 | Tests exist for all business logic functions | L2 | Coverage report shows >0% on business logic files; grep for test files alongside source | Jest/pytest coverage |
| TEST-02 | Test structure follows Arrange-Act-Assert pattern | L2 | Manual review of test file; each test has setup, single action, assertion blocks | code review |
| TEST-03 | Each test asserts exactly one behavior | L2 | grep for multiple `expect`/`assert` calls per test function; flag tests with 5+ assertions | grep |
| TEST-04 | Mocks are used for external dependencies only (DB, HTTP, filesystem) | L3 | grep for mocked functions that are pure logic — should not be mocked | grep, review |
| TEST-05 | Test names describe behavior, not implementation | L3 | grep for test names like `test_function_name` vs `test_returns_error_when_input_invalid` | grep |
| TEST-06 | Tests are isolated: no shared mutable state between tests | L3 | `beforeEach`/`setUp` resets state; no module-level mutable variables in test files | Jest/pytest |
| TEST-07 | Test suite runs in under 30 seconds locally | L3 | `time npm test` / `time pytest`; flag if over threshold | npm, pytest |
| TEST-08 | Assertion libraries used (not bare `if` checks) | L3 | grep for `assert x == y` without assertion library; check for `expect(x).toBe(y)` pattern | Jest, pytest |
| TEST-09 | Snapshot tests are used sparingly and reviewed on change | L4 | Count `.snap` files; grep for `toMatchSnapshot` — flag if used for non-UI outputs | Jest |
| TEST-10 | Mutation testing score ≥ 70% | L5 | Run Stryker/mutmut; mutation score report shows threshold met | Stryker, mutmut |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Test the mock | Test asserts that a mock was called but not that the real behavior is correct | Tests pass even when logic is wrong |
| Tightly coupled test | Test imports internal implementation details (`_private_fn`) | Breaks on every refactor regardless of behavior |
| One giant test | Single test function exercises 10+ scenarios with branching logic | Failure gives no signal about which scenario broke |
| Over-mocking | Mocking 80% of the subject under test | Test is testing mock configuration, not real code |
| Brittle assertions | `expect(result).toEqual({ id: 1, createdAt: "2024-01-01" })` — date hardcoded | Breaks on timezone changes, clock differences |

## Why It Matters

Unit tests are the primary safety net for refactoring. A codebase with strong unit tests can be refactored confidently. Without them, every change carries unknown risk.

## Applicability Boundaries

**In scope:** Business logic, service layers, utility functions, data transformations, state machines
**Out of scope:** Framework glue code, ORM model definitions, pure configuration

## Rationale

Unit testing standards prevent the "test tax" — where tests exist but provide no confidence. The checks here distinguish tests that provide signal from tests that only add maintenance burden.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
