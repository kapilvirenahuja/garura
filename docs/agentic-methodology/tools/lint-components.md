# lint-components

Validate Meridian component contracts — plays, skills, agents, and intent files — from the command line.

## Overview

`lint-components` is a Node.js tool that scans `core/components/` and checks every component file against its structural, semantic, and cross-reference rules. It is the same rule engine invoked by the `lint-components` skill — running it directly gives you immediate feedback without spinning up a full play.

**What it checks:**
- Structural integrity: required frontmatter fields, required body sections, parse errors
- Semantic correctness: skill and agent references in play bodies resolve to real components
- Cross-reference consistency: intent.yaml IDs are unique and every scenario in intent.yaml is covered in the corresponding play

**Scan depth:** The discover function scans exactly one level deep under the target path for `SKILL.md` files (skills and plays) and `.md` files (agents). Nested subdirectories are not traversed.

## Install

Run once from the tool directory:

```bash
cd core/tools/lint-components
npm install
```

This installs `js-yaml` (the only external dependency) into `core/tools/lint-components/node_modules/`. All other modules (`fs`, `path`) are Node.js built-ins.

**Node version:** No `engines` field is declared in `package.json`. The minimum Node.js version requirement is unstated in the manifest.

## Usage

**Direct invocation** (from the repository root):

```bash
node core/tools/lint-components/index.js
```

**Using the bin alias** (after `npm link` or global install):

```bash
lint-components
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--target=<path>` | `core/components` | Directory to scan. Resolved relative to `process.cwd()`. |
| `--output=<format>` | `json` | Output format: `json` or `text`. |
| `--validate-templates` | off | Accepted by the parser but not yet implemented. The flag is stored but no rule module reads it — it has no effect on output. |

## Output

### JSON format (default)

```json
{
  "violations": [
    {
      "file": "core/components/skills/my-skill/SKILL.md",
      "rule": "structural/missing-frontmatter-field",
      "severity": "error",
      "message": "Missing required frontmatter field: allowed-tools",
      "line": 0
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 0,
    "infos": 0
  }
}
```

### Text format

```
error: core/components/skills/my-skill/SKILL.md:0 [structural/missing-frontmatter-field] Missing required frontmatter field: allowed-tools
1 errors, 0 warnings, 0 infos
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | No errors found. Warnings and infos may still be present. |
| `1` | One or more violations with `severity: error` found. |
| `2` | Fatal runtime error (unexpected failure). |

## Rule Tiers

All rule IDs and severities are hardcoded in the rule modules. There is no external configuration file that maps rules to severities.

The `info` severity is supported in the output infrastructure (summary counts `infos`, schema documents `severity: info`) but no current rule emits it.

### Structural

Structural rules verify that component files are well-formed. They operate per-file and halt early on parse errors.

| Rule ID | Component Type | Severity | What it checks |
|---------|---------------|----------|----------------|
| `structural/frontmatter-parse-error` | Skills (`core/components/skills/*/SKILL.md`) | `error` | Frontmatter cannot be parsed; file-level check halts early. |
| `structural/missing-frontmatter-field` | Skills (`core/components/skills/*/SKILL.md`) | `error` | Required fields: `name`, `description`, `user-invocable`, `model`, `allowed-tools`. Each missing field is a separate violation. |
| `structural/allowed-tools-must-be-string` | Skills (`core/components/skills/*/SKILL.md`) | `error` | `allowed-tools` must be a comma-separated string, not a YAML array. |
| `structural/missing-section` | Skills (`core/components/skills/*/SKILL.md`) | `error` | Required body sections: `## Input`, `## Process`, `## Output`. Each missing section is a separate violation. |
| `structural/frontmatter-parse-error` | Agents (`core/components/agents/*.md`) | `error` | Frontmatter cannot be parsed; file-level check halts early. |
| `structural/missing-frontmatter-field` | Agents (`core/components/agents/*.md`) | `error` | Required fields: `name`, `description`, `model`, `tools`. Plus either `domain` or `role` must be present. |
| `structural/tools-must-be-array` | Agents (`core/components/agents/*.md`) | `error` | `tools` must be a YAML list (array), not a string. |
| `structural/frontmatter-parse-error` | Plays (`core/components/plays/*/SKILL.md`) | `error` | Frontmatter cannot be parsed; file-level check halts early. |
| `structural/missing-frontmatter-field` | Plays (`core/components/plays/*/SKILL.md`) | `error` | Required fields: `name`, `description`, `model`. Plus either `user-invocable` or `user-invokable` must be present. |
| `structural/missing-section` | Plays (`core/components/plays/*/SKILL.md`) | `error` | Required body sections: `## Compiled From`, `## Role`, `## Pre-flight`. Each missing section is a separate violation. |
| `structural/spelling-inconsistency` | Plays (`core/components/plays/*/SKILL.md`) | `warning` | Corpus-level check: when both `user-invocable` and `user-invokable` spellings appear across plays, each file using the minority spelling (`user-invokable`) receives a warning. |
| `structural/yaml-parse-error` | Intents (`core/components/plays/*/reference/intent.yaml`) | `error` | YAML fails to parse. |
| `structural/invalid-structure` | Intents (`core/components/plays/*/reference/intent.yaml`) | `error` | Top-level value is not a YAML object. |
| `structural/missing-intent-key` | Intents (`core/components/plays/*/reference/intent.yaml`) | `error` | Required top-level keys: `intent`, `constraints`, `failure_conditions`, `scenarios`. |

### Semantic

Semantic rules verify that names referenced inside play bodies resolve to real components. These rules run only on plays.

| Rule ID | Severity | What it checks |
|---------|----------|----------------|
| `semantic/skill-not-found` | `error` | A skill name extracted from the play body is not present as a directory under `core/components/skills/`. |
| `semantic/agent-not-found` | `error` | An agent name extracted from the play body is not present as a `.md` file under `core/components/agents/`. |

**Extraction patterns for skill references:**
- `## Skill Pool` table rows where the first column is a backtick-quoted skill name
- `Skill: <name>` or `` Skill: `<name>` `` at the start of a line
- `` invokes `<skill-name>` skill `` or `` invoke `<skill-name>` skill ``

**Extraction patterns for agent references:**
- `## Agent Boundaries`, `**Agent boundaries:**`, or `Agent boundaries:` table rows where the first column is a backtick-quoted agent name

### Cross-Reference

Cross-reference rules verify integrity between paired files (intent.yaml + play SKILL.md).

| Rule ID | Severity | What it checks |
|---------|----------|----------------|
| `cross-ref/duplicate-constraint-id` | `error` | Two or more `constraints` entries in an intent.yaml share the same `id`. |
| `cross-ref/duplicate-failure-condition-id` | `error` | Two or more `failure_conditions` entries share the same `id`. |
| `cross-ref/duplicate-scenario-id` | `error` | Two or more `scenarios` entries share the same `id`. |
| `cross-ref/uncovered-scenario` | `warning` | For each scenario ID of the form `S{N}` in an intent.yaml, the corresponding play SKILL.md must contain the string `SCE-{N}`. One warning per uncovered scenario. |

## Related

- [For skill invocation (JSON contract), see the lint-components skill doc](../../usage/skills/lint-components.md)
