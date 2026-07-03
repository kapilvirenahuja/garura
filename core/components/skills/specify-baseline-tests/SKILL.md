---
name: specify-baseline-tests
description: Given coverage gaps from blast-radius.yaml, author specifications for baseline tests that capture CURRENT behavior before changes begin. Writes baseline-tests.yaml. Used by test-engineer.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# specify-baseline-tests

Model-invocable skill for baseline-test specification.

## Purpose

For every coverage gap identified in blast-radius, author a baseline-test specification that, when implemented, will pin down the CURRENT behavior of the uncovered code. Baseline tests protect against regressions introduced by the change — they are NOT forward-looking behavior specs.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `blast_radius_path` | yes | Path to blast-radius.yaml |
| `project_root` | yes | Codebase root for reading the uncovered code |
| `test_surface_path` | yes | To match conventions (framework, file layout) used elsewhere |
| `output_base` | yes | Directory to write baseline-tests.yaml |

## Process

1. **Read blast-radius gaps.** Focus only on `coverage_gaps` entries.

2. **Read uncovered code.** For each gap file, read the code and identify its public entry points (exported functions, class methods, module-level side effects).

3. **Describe current behavior.** Per entry point, characterize: inputs, outputs, observable side effects, error paths. This is descriptive — not prescriptive. If the current code does X in case Y, the baseline test documents "does X in case Y", even if X is buggy.

4. **Specify test.** For each entry point:
   - `test_id`
   - `target_file`
   - `target_symbol`
   - `current_behavior` — one line
   - `test_description` — one line
   - `setup` — any state needed
   - `call` — input form
   - `assertion` — observable outcome
   - `framework` — match project convention (from test_surface)
   - `suggested_file` — where the test should live

5. **Emit baseline-tests.yaml:**

   ```yaml
   generated_at: "{ISO-8601}"
   sourced_from: "{blast_radius_path}"
   baseline_tests:
     - test_id: BT-001
       target_file: "{path}"
       target_symbol: "{function/class/method}"
       current_behavior: "{one-line observable}"
       test_description: "{one-line}"
       setup: "{preconditions}"
       call: "{input shape}"
       assertion: "{expected outcome — current behavior}"
       framework: "{name}"
       suggested_file: "{path}"
   summary:
     count: {n}
     by_framework: { ... }
   ```

## Output

```yaml
baseline_tests_path: "{output_base}/baseline-tests.yaml"
baseline_test_count: {n}
status: written
```

## Boundaries

- Baseline tests describe CURRENT behavior — even if buggy. Do not prescribe future behavior.
- You do not implement the tests — you specify them.
- You do not modify source code.
