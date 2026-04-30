# lint-components

Run the component linter and produce a classified YAML quality report as an STM artifact.

## Overview

The `lint-components` skill installs the linter if needed, runs it against `core/components/`, parses the JSON output, classifies violations by severity, and writes a structured YAML report to the path you specify. Plays invoke this skill to get a machine-readable quality snapshot without calling the CLI directly.

**What the skill does, in order:**
1. Checks whether `node_modules/` is present in `core/tools/lint-components/`; runs `npm install --silent` if absent (idempotent)
2. Runs the linter and captures its JSON output
3. Parses the JSON
4. Reads `.garura/product/specification/quality-profile.yaml` to get the profile `status` field
5. Classifies violations: `error` → `blocker`; `warning` and `info` → `informational`
6. Writes the structured YAML artifact to the output path

## Metadata

| Field | Value |
|-------|-------|
| `name` | `lint-components` |
| `user-invocable` | `false` |
| `model` | `sonnet` |
| `allowed-tools` | `Bash, Read` |

This skill has no `reference/intent.yaml`. SKILL.md is the sole source of the contract.

## Invocation

### Input fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_root` | string | Yes | Absolute path to the repository root. The linter runs from this directory. |
| `output_path` | string | Yes | STM path where the lint report YAML will be written. |

### Example STM contract

```yaml
stm:
  input:
    project_root: /path/to/repo
  output:
    lint_report: .garura/project/issues/{issue}/evidence/{play}/lint-report.yaml
```

The skill resolves `output_path` from the `lint_report` output field.

## Process

1. **Dependency check.** Verify `core/tools/lint-components/node_modules/` exists. If absent, run `npm install --silent` from `core/tools/lint-components/`. This is idempotent — subsequent runs skip this step.

2. **Run linter.** Execute `node core/tools/lint-components/index.js --target core/components --output json` from `project_root`. Capture stdout.

   **Exit code handling:** Exit code `1` from the linter means violations were found. The skill must **not** treat exit code `1` as failure — it is expected output. Only exit code `2` (fatal runtime error) is a skill failure.

3. **Parse output.** Parse captured stdout as JSON.

4. **Read quality profile.** Read `.garura/product/specification/quality-profile.yaml`. Extract the `status` field. If the file is absent, set `quality_profile_status: not_found` and apply the default classification.

5. **Classify violations.** Apply severity-to-classification mapping (see [Severity and Classification](#severity-and-classification) below).

6. **Write artifact.** Write the structured YAML report to `output_path`.

## Severity and Classification

### Mapping

| Severity (from linter) | Classification (in report) |
|------------------------|---------------------------|
| `error` | `blocker` |
| `warning` | `informational` |
| `info` | `informational` |

**Important:** Severity values are hardcoded in the linter source (`lib/rules/structural.js`, `lib/rules/semantic.js`, `lib/rules/cross-reference.js`). They are not configurable via `quality-profile.yaml`.

**What `quality-profile.yaml` contributes:** The skill reads this file to populate the `quality_profile_status` field in the report. The profile informs the classification tier (blocker vs. informational) but does not override the per-rule severities set in source.

**Note on `info` severity:** The `info` severity is supported in the linter output infrastructure (the summary tracks `infos`; the schema documents `severity: info`). No current rule emits `info`, so the `informational` count will reflect only `warning` violations in practice. This may change as new rules are added.

## Output

### Artifact shape

```yaml
generated_at: <ISO timestamp>
quality_profile_status: <status from quality-profile.yaml, or "not_found">
summary:
  errors: <count>
  warnings: <count>
  infos: <count>
  blockers: <count>          # equals errors count
  informational: <count>     # equals warnings + infos count
pass: <true if errors == 0, false otherwise>
violations:
  - file: <path relative to project_root>
    rule: <rule id>
    severity: <error|warning|info>
    classification: <blocker|informational>
    message: <human-readable message>
    line: <line number, 0 if not applicable>
```

### Sample violation entry

```yaml
violations:
  - file: core/components/skills/my-skill/SKILL.md
    rule: structural/missing-frontmatter-field
    severity: error
    classification: blocker
    message: "Missing required frontmatter field: allowed-tools"
    line: 0
```

## Related

- [For CLI install and rule tier reference, see the lint-components tool doc](../../agentic-methodology/tools/lint-components.md)
