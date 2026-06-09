---
name: map-test-surface
description: Enumerate every test file in a codebase, extract test subjects and assertions, detect the test framework in use, and emit test-surface.yaml. Used by test-engineer.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob, Bash
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# map-test-surface

Model-invocable skill for mapping the test surface of a codebase.

## Purpose

Produce a complete inventory of existing tests: file locations, subjects (what they test), assertion counts, frameworks used. Emit `test-surface.yaml` — the basis for later blast-radius computation and coverage-gap analysis.

Previously authored inline by test-engineer.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `project_root` | yes | Codebase root |
| `test_globs` | optional | Override test-file globs (default auto-detect by language) |
| `output_base` | yes | Directory to write test-surface.yaml |

## Process

1. **Detect test framework(s).** From config (`pytest.ini`, `jest.config`, `go.sum`, etc.) and file naming (`*_test.py`, `*.test.ts`, `*_test.go`, `spec/` dirs).

2. **Glob test files.** Language-specific defaults; user override via `test_globs`.

3. **Per file, extract:**
   - **framework** — pytest | unittest | jest | vitest | mocha | go-test | junit | ...
   - **subjects** — the module/class/function each test block exercises (derived from imports + test names)
   - **test_count** — number of test functions / `it(...)` / methods
   - **assertion_count** — approximate count via grep (`assert`, `expect(`, `should`)
   - **tags** — skip / xfail / slow / integration markers

4. **Aggregate.** Total test count, assertion count, per-framework counts, subjects covered.

5. **Emit test-surface.yaml:**

   ```yaml
   project_root: "{project_root}"
   generated_at: "{ISO-8601}"
   frameworks: [ ... ]
   totals:
     test_files: {n}
     test_functions: {n}
     assertions: {n}
   files:
     - path: "{test file}"
       framework: "{name}"
       subjects: [ "{module/class/function under test}" ]
       test_count: {n}
       assertion_count: {n}
       tags: [ ... ]
   subjects_index:
     - subject: "{module/class/function}"
       tested_by: [ "{test file path}" ]
   ```

## Output

```yaml
test_surface_path: "{output_base}/test-surface.yaml"
test_file_count: {n}
status: written
```

## Boundaries

- Read-only.
- Do not execute tests — that is quality-auditor's domain.
- Approximate assertion counts via grep are acceptable — deep AST analysis is out of scope.
