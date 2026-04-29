---
name: generate-unit-pure-tests
description: "Generate Tier-C unit tests for pure business rules — rules free of framework/stack coupling. Selectively generated where the rule's logic is non-trivial (multi-branch guards, state transitions, computational rules). Stack-coupled units (middleware internals, framework hooks, ORM specifics) are NOT generated — they die with the old stack and are cited_existing only per C24/F11. Owned by test-engineer."
user-invocable: false
model: opus
allowed-tools: Read, Write, Grep, Glob
---

# generate-unit-pure-tests

Owned by the `test-engineer` agent. Invoked once per feature whose behavior-spec contains rules classifiable as pure business logic (no stack coupling). Generates the inner tier of the test hierarchy.

## Purpose

Pure-unit tests exercise business rules at the smallest testable granularity where the test still makes sense without the framework. Example rules that qualify:
- "Reject member-signup when email domain is on blocklist" — can be tested on an `isAllowedEmailDomain(email)` function (or its method-level equivalent) without standing up Express or the database.
- "Pro-rate subscription credit when plan downgrades mid-cycle" — computational rule; can be tested on the pure calculation function.
- "Allow post-publish when member has 'publisher' role in at least one workspace the post belongs to" — multi-branch authorization guard on a pure function.

Rules that do NOT qualify (Tier D — cited_existing only, per C24 and F11):
- "Express middleware rejects requests without valid JWT" — the middleware IS the framework coupling; tests would test Express behavior, not the rule.
- "React hook re-renders when context changes" — framework behavior, not business rule.
- "Bookshelf ORM soft-delete hides records on fetch" — ORM behavior.

Classification of pure vs stack-coupled is the skill's core discipline. Erring on the side of caution is correct — a rule tested in pure form is portable; a stack-coupled test generated in error dies with the old stack.

## Input

Receive via JSON contract from test-engineer.

- `behavior_spec_path` (path, required) — the feature's spec from `extract-feature-behavior-spec`.
- `test_harness_path` (path, required).
- `codebase_root` (path, required).
- `output_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals/generated-tests/unit-pure/`.
- `ltm_context` (object, required).

## Process

### 1. Validate inputs

- Confirm `behavior_spec_path` parses and has the C4a shape.
- Confirm `test_harness_path` is present with a harness of role `unit`.

### 2. Classify rules into pure vs stack-coupled

For each entry in `behavior_spec.business_rules[]`:

**Pure-classification positive signals:**
- Cited_locations point to utility modules (utils/, lib/, pure/), helper functions, or domain-model methods whose signature does not take framework-native types (Request, Response, Query, etc.).
- Rule statement describes a computation or guard expressible over data (no HTTP, no ORM, no DOM).
- Rule's existing tests (if any) are unit tests not integration tests — detected via map-test-surface's per-test test_type.

**Stack-coupled negative signals:**
- Cited_locations are inside middleware/, controllers/, route handlers, React hooks, ORM model definitions with lifecycle callbacks.
- Rule statement mentions framework-native concepts ("rejects request", "re-renders component", "ORM cascade").
- The rule only makes sense in the context of a stack-specific call (e.g., "ORM applies tenant filter on every query").

Classification output per rule:
- `pure` → queued for generation.
- `stack_coupled` → excluded with reason recorded in the sidecar for cited_existing references.
- `borderline` → generate with caution and mark the test with a `// TIER C candidate — review for portability` comment. /enrich can reclassify at review time.

### 3. Locate the pure-testable unit

For each pure rule, walk the cited_locations to find the minimal pure function / method / class that encodes the rule. Criteria:
- Smallest function whose assertion captures the rule's logic.
- No side effects beyond return value (or explicit documented side effects captured in the rule's cited_locations).
- Importable without framework initialization.

If no pure function can be located even though the rule looks pure (e.g., the logic is inlined in a controller handler), the skill flags this rule as `pure_but_not_extracted` and records it as a refactor-hint knowledge gap. It does NOT emit a test for inlined logic — the test would be stack-coupled by necessity.

### 4. Select unit test framework

From test_harness_path, pick the harness with role `unit`:
- Node.js → Jest or Vitest (match existing codebase convention).
- Python → pytest or unittest.
- Java → JUnit 5 or TestNG.
- Ruby → RSpec or Minitest.
- Go → `go test` native.

### 5. Generate one test file per pure unit

File path:

```
{output_dir}/{feature-id}__{unit-name}.spec.{ext}
```

Example: `MEM-F001-signup__isAllowedEmailDomain.spec.ts`.

Content:
- Import the pure unit.
- One test per scenario in the behavior-spec that exercises this rule.
- One test per edge_case whose trigger falls within this rule's domain.
- Assertions derived from the spec's Given/When/Then — inputs from Given, action from When, assertion from Then.

Every test follows the detected framework's idioms. No framework mocks, no database fixtures, no HTTP seeding — that is Tier A/B territory.

### 6. Annotate with cited_specs

Test file header:

```
// Generated by /decode — DO NOT HAND-EDIT; rerun the play
// Tier C — pure business logic unit tests, portable across stacks within language family
// covers:
//   - behavior_spec: {behavior_spec_path}
//   - rules: [BR-MEM-F001-001]
//   - scenarios: [SC-MEM-F001-005, SC-MEM-F001-006]
//   - edge_cases: [EC-MEM-F001-002]
// pure_unit:
//   path: src/validators/email-domain.ts
//   export: isAllowedEmailDomain
```

Sidecar at `{output_dir}/{feature-id}__cited-specs.yaml`:

```yaml
generated_tests:
  - path: "{output_dir}/MEM-F001-signup__isAllowedEmailDomain.spec.ts"
    tier: "unit_pure"
    pure_unit: "src/validators/email-domain.ts:isAllowedEmailDomain"
    covers_rules: ["BR-MEM-F001-001"]
    covers_scenarios: [...]
cited_existing_for_stack_coupled:
  - rule_id: "BR-MEM-F001-007"
    reason: "stack_coupled: cited_locations inside Express middleware"
    existing_test_ref: "tests/middleware/jwt-guard.spec.ts:L42-L78"
```

The `cited_existing_for_stack_coupled` list satisfies /decode's C24 discipline — stack-coupled rules are NOT tested by new generation, only cited against pre-existing tests. /enrich and /validate consume this to know which rules rely on old-stack tests.

### 7. Return contract

```yaml
feature_id: "{feature_id}"
generated_files:
  - path: "{output_dir}/MEM-F001-signup__isAllowedEmailDomain.spec.ts"
    tier: "unit_pure"
    pure_unit: "src/validators/email-domain.ts:isAllowedEmailDomain"
    covers_rules: ["BR-MEM-F001-001"]
    covers_scenarios: [...]
  # ...
total_files: <int>
rules_classified:
  pure: <int>
  stack_coupled: <int>
  borderline: <int>
  pure_but_not_extracted: <int>
framework: "vitest"
status: "success"
```

## Output

Primary artifacts: test files at `{output_dir}/`.
Companion: `{output_dir}/{feature-id}__cited-specs.yaml`.

## Failure Modes

```yaml
status: failure
what_failed: "no_pure_rules_in_spec | harness_unsuitable | unit_not_locatable_for_all_pure_rules"
detail: "<specific>"
evidence: {...}
```

`no_pure_rules_in_spec` returns `status: empty` rather than failure — a feature may have zero pure rules (pure I/O orchestration, pure stack-coupled middleware). Tier A contract tests handle coverage in that case.

## Notes

- The pure/stack-coupled classification is the most important discipline in this skill. Generating a stack-coupled test in error means test count goes up but migration portability goes down. When in doubt, classify as stack_coupled and let /enrich review at review time — it is easier to upgrade from cited-existing to generated than to retract a bad generated test.
- Pure-unit tests are NOT concerned with performance, concurrency, or non-functional properties. Those are NFR concerns tracked elsewhere. A pure-unit test asserts functional correctness only.
- Existing pure-unit tests in the codebase (from map-test-surface, test_type: "unit") are preferred — when the existing test already covers a scenario, the skill references it in cited_specs rather than generating a duplicate. Generation fills gaps.
- Test-runner isolation (C15) applies: test-runner runs the generated pure-unit tests against the current codebase with no knowledge of the spec. If they pass, the rule is verified. If they fail, /decode halts the feature per C25.
