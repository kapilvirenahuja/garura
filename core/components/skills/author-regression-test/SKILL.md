---
name: author-regression-test
description: Author a failing regression-test artifact (a YAML eval-spec with grep or structural assertions) that captures the defect from rca.yaml / design.yaml, verify it is in a red state against the current codebase, and return the path. Enforces the TDD red-before-green invariant for the fix-it play.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob, Bash
---

# author-regression-test

Model-invocable skill for regression-test artifact authorship and red-state verification.

## Purpose

Given a completed RCA and fix design, write a YAML eval-spec regression test that will PASS when the fix is applied and FAIL on the current (unfixed) codebase. Verify it fails before returning — if it passes on the unfixed code, the test is not a regression test and the skill fails.

This enforces the red-before-green invariant (C14 of /fix-it) without any builder self-report. tech-designer invokes this skill instead of writing the test file inline.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `rca_path` | yes | Path to rca.yaml |
| `design_path` | yes | Path to design.yaml |
| `project_root` | yes | Codebase root — assertions execute against this |
| `test_style` | optional | `yaml_eval_spec` (default for YAML/markdown-only repos) or `unit_test` (code repos with a test runner) |
| `runner_hint` | optional | Command hint for unit-test style (e.g., `pytest path::test`) |
| `output_base` | yes | Directory to write regression-test.yaml |

## Process

1. **Read RCA + design.** Identify the root cause's file + logic + why-wrong.

2. **Derive an observable assertion.** Choose an assertion that is:
   - **Specific** — asserts the fix was applied (e.g., "line X no longer contains Y", "function Z handles empty list")
   - **Mechanical** — runnable with grep/ripgrep, file existence, structural YAML/JSON checks, or a unit-test command
   - **Red on current code** — the assertion fails now, before the fix

3. **Author regression-test.yaml:**

   ```yaml
   style: yaml_eval_spec | unit_test
   target_issue: "{issue_number}"
   based_on:
     rca: "{rca_path}"
     design: "{design_path}"
   assertions:
     - id: A1
       description: "{what this proves}"
       kind: grep_absent | grep_present | file_exists | file_shape | command_exit_zero
       spec:
         # for grep_absent / grep_present:
         pattern: "{regex}"
         path: "{file or glob}"
         # for file_exists:
         path: "{file}"
         # for command_exit_zero:
         command: "{shell}"
         cwd: "{relative}"
   pass_when: "all_assertions_pass"
   verified_red_at: "{ISO-8601}"
   expected_state_before_fix: red
   expected_state_after_fix: green
   ```

4. **Verify red state.** Execute every assertion against `project_root` NOW. Every assertion must fail (as defined by its `kind`). Capture exit state per assertion.

5. **Halt on unexpected green.** If ALL assertions already pass on the unfixed code, the test is not a regression test. Return `status: failed`, `reason: already_green`. The agent must re-sharpen the assertion.

6. **Write the file.** Only after red verification passes.

## Output

```yaml
regression_test_path: "{output_base}/regression-test.yaml"
style: yaml_eval_spec | unit_test
assertion_count: {n}
red_verified: true
verified_at: "{ISO-8601}"
status: written
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| RCA or design missing | I/O | `status: failed`, `reason: missing_input` |
| Assertion already green on unfixed code | Test does not capture the defect | `status: failed`, `reason: already_green`, `green_assertions` |
| Assertion execution error | Malformed pattern/command | `status: failed`, `reason: assertion_error`, `assertion_id`, `error` |
| No observable assertion derivable | RCA too abstract | `status: failed`, `reason: no_observable_assertion` |

## Boundaries

- Read-only against codebase except for writing the test file into `{output_base}`.
- The test must be verified red before the file is written — never write an unverified test.
- You do not run the quality-auditor verification loop — that is the agent's job post-implement.
- You do not modify source code to make the test pass.
