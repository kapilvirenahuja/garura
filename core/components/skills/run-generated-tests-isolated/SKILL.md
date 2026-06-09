---
name: run-generated-tests-isolated
description: Execute generated tests against the current codebase using the detected TEST_HARNESS and report pass/fail per test. Context-isolated — consumed ONLY by the test-runner agent, which receives no extraction context. Reports pass/fail plus stderr; does not interpret failures. This is the baseline-green verification gate for /decode (C25).
user-invocable: false
model: sonnet
allowed-tools: Bash, Read, Write
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# run-generated-tests-isolated

Called by the `test-runner` agent in context isolation. This skill is the sole interface between /decode's extraction pipeline and its verification gate.

## Purpose

Per /decode C25, every captured behavior/flow/aspect spec must have its generated tests run green against the current codebase before the spec is considered captured. Per C15, this execution happens in a context-isolated agent — `test-runner` — that sees only the test files and the codebase. This skill is the execution primitive.

The skill does NOT interpret failures. It invokes the test harness, captures stdout/stderr, parses pass/fail per the harness's declared format, and reports. Anything beyond pass/fail is the calling play's responsibility to act on.

## Input

Receive from the `test-runner` agent via JSON contract.

- `test_harness` (object, required) — the record produced by `detect-test-harness`. Contains runner_command, working_dir, env_vars, stdout_parse_format, install_command.
- `test_files` (list[path], required) — absolute paths of the generated test files to run. The skill passes these to the runner as positional arguments when the harness supports file-level selection (jest, pytest, playwright, junit single-class, etc.). When the harness does not support it, the skill invokes the full suite and filters the output by file in parsing.
- `codebase_root` (path, required) — the repo root.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/test-run-reports/{unit-id}-{timestamp}.yaml`.
- `install_if_missing` (bool, optional, default false) — if true AND harness reports `install_required: true`, run the install command before the test command. Default false — installs are an operator decision.
- `timeout_seconds` (int, optional, default 900) — hard ceiling on runner wall-clock.

## Process

### 1. Validate inputs

- Confirm every entry in `test_files` exists and is within `codebase_root`.
- Confirm `test_harness` contains every required field.
- Confirm `output_path` parent directory exists.

### 2. Install dependencies (conditional)

If `install_if_missing` is true AND `test_harness.install_required` is true:
- Invoke `test_harness.install_command` in `codebase_root` with the harness's env vars.
- Capture exit code. Non-zero → structured failure `what_failed: install_failed` with stderr.

### 3. Invoke runner

Construct the command:
```
cd {test_harness.working_dir}
{test_harness.runner_command} {test_files joined appropriately}
```

Apply env vars from `test_harness.env_vars`. Enforce the `timeout_seconds` ceiling. Capture stdout, stderr, and exit code.

### 4. Parse stdout per format

Dispatch to the format-specific parser:
- `jest` — parse "Tests: X passed, Y failed" summary and per-test entries
- `vitest` — similar to jest
- `pytest` — parse "PASSED tests/..." lines and final summary
- `surefire` / `junit` — parse surefire-reports/TEST-*.xml (more reliable than stdout for JUnit)
- `playwright` — parse "X passed, Y failed" summary and per-spec entries
- `go-test` — parse "--- PASS" / "--- FAIL" lines
- unknown format → `status: partial`, report raw stdout, flag for manual review

Produce per-test entries:
```yaml
per_test:
  - file: "path/to/test.spec.ts"
    name: "it should reject expired subscriptions"
    status: "passed" | "failed" | "skipped"
    duration_ms: <int>
    failure_message: "<string if failed, else null>"
```

### 5. Emit test-run report

Write at `output_path`:

```yaml
run_at: "{ISO timestamp}"
harness_id: "{test_harness.id}"
codebase_root: "{path}"
test_files: ["..."]
summary:
  total: <int>
  passed: <int>
  failed: <int>
  skipped: <int>
  duration_ms: <int>
per_test: [...]
runner_exit_code: <int>
stdout_tail: "<last ~4KB of stdout>"
stderr_tail: "<last ~4KB of stderr>"
parser_status: "ok" | "partial" | "failed"
```

## Output

Primary artifact: `test-run-report.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "install_failed | runner_timeout | runner_unreachable | parse_failure | unsafe_paths"
detail: "<specific>"
evidence: { exit_code: <int>, stderr_tail: "<string>" }
```

`parse_failure` means the runner exited but the output format was not parseable. The raw stdout is still recorded for manual review — the caller can then inspect and decide whether to update the harness catalog.

## Notes

- Context isolation is enforced at the agent level (`test-runner` agent contract), not inside this skill. This skill will execute whatever test_files it receives — the isolation discipline prevents the runner from being handed the wrong files.
- The skill does NOT retry failed tests. A flake is a real signal that the extraction or the generated test is not robust; /decode surfaces it to the user per C25.
- Environment setup (database seeding, service startup) is NOT handled here. If the test harness requires it, the runner is invoked in an already-prepared environment. `detect-test-harness` records required env vars; provisioning is an operator responsibility.
- Exit codes are recorded verbatim. Tests can pass with non-zero exit codes (e.g., Playwright returning non-zero for warnings); the parser output is authoritative on pass/fail, not the exit code.
- stdout_tail and stderr_tail are truncated to bound report size. Full output is NOT captured as that would violate isolation (report shipping full logs to non-runner contexts).
