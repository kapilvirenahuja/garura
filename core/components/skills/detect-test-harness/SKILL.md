---
name: detect-test-harness
description: Inspect scan-index manifests, existing CI workflow, and detected test frameworks to produce a TEST_HARNESS record describing how to actually run the codebase's tests — framework, runner command, working directory, dependency install command, env vars, and stdout pass/fail parse format. Pattern-matches against a canonical harness catalog. Called by /decode before test generation or baseline-green verification (C26). Halts with a prerequisites error when no runnable harness is detectable (F18).
user-invocable: false
model: sonnet
allowed-tools: Bash, Read, Write, Grep, Glob
---

# detect-test-harness

Called by the `/decode` play during pre-flight, after `scan-codebase` and before any test generation or execution. Produces the TEST_HARNESS record that the `test-runner` agent consumes verbatim.

## Purpose

`/decode` cannot emit specs unless their generated tests can be verified green against the current codebase (C25). Verification requires a working test harness — not just a framework name, but the exact invocation that actually runs tests in this repo. Detection has to cover framework, invocation command, working directory, dependency state, env vars, and stdout format for pass/fail parsing.

The skill is deterministic: it holds a canonical catalog of test harness patterns and matches against scan-index signals.

## Input

Receive from the `/decode` play orchestrator via JSON contract.

- `scan_index_path` (path, required) — `{stm_base}/{issue}/evidence/decode/scan-index.json` OR the reused codify scan-index when decode runs back-to-back.
- `codebase_root` (path, required) — the repo root for resolving working directories.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/test-harness.yaml`.
- `workspace_override` (path, optional) — explicit workspace path when the user provides `--workspace <path>` on a non-runnable base repo.

## Process

### 1. Validate inputs

- Confirm `scan_index_path` exists and parses as JSON.
- Confirm `codebase_root` exists.
- If `workspace_override` provided, use that as the resolved working directory.

### 2. Parse scan-index signals

Extract the following sections from scan-index:
- `manifests[]` — package.json (scripts.test, devDependencies), pyproject.toml (tool.pytest, tool.poetry.scripts), pom.xml (surefire plugin config), build.gradle (test task), Gemfile (rspec, minitest), go.mod (no script — Go test is builtin).
- `config_files[]` — jest.config.js, vitest.config.ts, pytest.ini, playwright.config.ts, cypress.config.js, phpunit.xml, .rspec.
- `ci_files[]` — .github/workflows/*.yml, .gitlab-ci.yml, circleci/config.yml. Look for test invocations.
- `trees[]` — test directories (test/, tests/, __tests__, spec/, e2e/) for default test root.

### 3. Match against canonical harness catalog

The skill holds a pattern table:

```yaml
canonical_harnesses:
  - id: jest-node
    detect_signals:
      - manifest_dep: "jest"
      - config_file: "jest.config.*"
    runner_command: "pnpm test"   # or npm/yarn — preferred script key is scripts.test
    framework: "jest"
    working_dir: "{codebase_root}"
    install_command: "pnpm install"
    env_vars: []
    stdout_parse:
      format: "jest"   # built-in parser: "Tests: X passed, Y failed"
  - id: vitest-node
    detect_signals:
      - manifest_dep: "vitest"
      - config_file: "vitest.config.*"
    # ...
  - id: pytest-python
    detect_signals:
      - manifest_dep: "pytest"
      - config_file: "pytest.ini"
    runner_command: "pytest"
    working_dir: "{codebase_root}"
    install_command: "pip install -e . && pip install -r requirements-dev.txt"
    stdout_parse:
      format: "pytest"
  - id: junit-maven
    detect_signals:
      - manifest_pattern: "pom.xml with maven-surefire-plugin"
    runner_command: "mvn test"
    install_command: "mvn dependency:resolve"
    stdout_parse: { format: "surefire" }
  - id: playwright
    detect_signals:
      - manifest_dep: "@playwright/test"
    runner_command: "pnpm exec playwright test"
    stdout_parse: { format: "playwright" }
  # ... additional harnesses
```

For every harness whose detect_signals are all satisfied, add a candidate entry. A single codebase may have multiple candidates (unit + E2E).

### 4. Resolve primary runner command

Prefer scripts.test (package.json) or equivalent if it exists and its expansion matches a detected candidate. Otherwise use the candidate's default runner_command.

For pnpm/npm/yarn repos, pick the package manager from `lockfile` signals:
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm

### 5. Check runnability

Light runnability check (does NOT actually run tests):
- Verify the runner command's primary binary is resolvable in `codebase_root` context — check for the binary in `node_modules/.bin/`, `venv/bin/`, `.venv/bin/`, or system PATH inference.
- Check for presence of install markers (`node_modules/`, `.venv/`, `vendor/`, `target/`) — if absent, mark `install_required: true`.

If the primary binary is not present AND install is required AND no explicit workspace override was given, emit `runnability: prereq-missing` with the install command for the caller to surface.

### 6. Emit test-harness.yaml

Write at `output_path`:

```yaml
detected_at: "{ISO timestamp}"
codebase_root: "{path}"
working_dir: "{resolved working dir}"
harnesses:
  - id: jest-node
    role: "unit"
    framework: "jest"
    runner_command: "pnpm test"
    install_command: "pnpm install"
    env_vars: []
    stdout_parse_format: "jest"
    runnability: "runnable" | "prereq-missing" | "unknown"
    install_required: <bool>
  - id: playwright
    role: "e2e"
    framework: "playwright"
    runner_command: "pnpm exec playwright test"
    # ...
primary_runner: "jest-node"   # first in priority for baseline-green
runnability_summary: "runnable | prereq-missing | not-detectable"
warnings: ["..."]
```

## Output

Primary artifact: `test-harness.yaml` at `output_path`.

## Failure Modes

```yaml
status: failure
what_failed: "scan_index_missing | no_harness_detectable | parse_error"
detail: "<specific>"
evidence: { offending_path: "<path>" }
```

`no_harness_detectable` is the F18 trigger — /decode halts on this per C26's "specs that cannot be verified are not captured."

## Notes

- The canonical harness catalog is embedded in the skill. Adding support for a new stack means adding a catalog entry; it does not require LLM reasoning.
- The skill does NOT attempt to install dependencies. That is an operator decision. When install is required, the skill records the install command and lets /decode surface it to the user.
- Env vars required for tests (database URLs, auth secrets) are detected via common patterns in CI files (`env:` blocks) and .env.test / .env.example files. They are recorded by name only — values are never captured.
- Multiple harness candidates is the normal case (unit framework + E2E framework). `primary_runner` names the one that runs the broadest tier (usually the unit/integration harness).
