# Implementation Context — Issue #252: Component Linting for Garura Components

## Solution Summary

Deliver a two-layer linting capability:
1. A deterministic Node.js CLI tool at `core/tools/lint-components/` that parses and validates all Garura components against structural, semantic, and cross-reference rules, emitting structured JSON output.
2. A `lint-components` skill at `core/components/skills/lint-components/SKILL.md` that wraps the Node tool, reads the quality profile to classify violation severities, and produces a structured lint report artifact usable from enhance, review, pr-review, and ship pipelines.

No changes to create-play or CI/CD are required for this issue.

## Files to Create

- `core/tools/lint-components/package.json` — Node.js package manifest with js-yaml dependency. Declares main entry as index.js. Defines a lint bin script.
- `core/tools/lint-components/index.js` — CLI entry point. Accepts `--target` (default: `core/components`) and `--output` (json|text, default: json) flags. Orchestrates discover → structural → semantic → cross-reference → reporter. Exit code 0 if no errors; 1 if any errors. Output format: `{ violations: [{file, rule, severity, message, line}], summary: {errors, warnings, infos} }`.
- `core/tools/lint-components/lib/discover.js` — Walks `core/components/` to enumerate skills (`skills/*/SKILL.md`), plays (`plays/*/SKILL.md`), agents (`agents/*.md`), and intent.yaml files (`plays/*/reference/intent.yaml`). Returns a structured component map.
- `core/tools/lint-components/lib/parse-frontmatter.js` — Extracts YAML between triple-dash delimiters from Markdown files using js-yaml. Returns `{ parsed: {...}, raw: string, error: null|string }`. Handles missing frontmatter gracefully.
- `core/tools/lint-components/lib/rules/structural.js` — Per-file structural rules:
  - Frontmatter completeness per component type:
    - Skills: required fields `name`, `description`, `user-invocable`, `model`, `allowed-tools` (comma string). `allowed-tools` must be a comma-separated string.
    - Agents: required fields `name`, `domain`, `role`, `description`, `model`, `tools` (YAML list). `tools` must be a YAML list array.
    - Plays: required fields `name`, `description`, `user-invocable` OR `user-invokable`, `model`.
  - Required sections per type:
    - Skills: `## Input`, `## Process`, `## Output` (ERROR if missing)
    - Plays: `## Compiled From`, `## Role`, `## Pre-flight` (ERROR if missing)
  - Intent.yaml schema: required top-level keys `intent`, `constraints`, `failure_conditions`, `scenarios` (ERROR if missing)
  - Spelling inconsistency: `user-invokable` vs `user-invocable` → WARNING (not ERROR). Both are accepted as structurally valid.
  - Wrong field format: ERROR if `allowed-tools` is not a comma string for skills; ERROR if `tools` is not a YAML list for agents.
- `core/tools/lint-components/lib/rules/semantic.js` — Cross-file semantic rules:
  - Build global index of all known skill names (from `skills/*/SKILL.md`) and agent names (from `agents/*.md`).
  - Scan each play SKILL.md for skill references in Skill tool call blocks and skill invocation patterns. Flag missing skills as ERROR.
  - Scan play Boundaries tables for agent references. Flag missing agents as ERROR.
  - Template file references (`~/.garura/core/memory/standards/templates/...`) are only checked if `--validate-templates` flag is passed (off by default).
  - Reference extraction is conservative — only extract references from clearly structured contexts (JSON blocks, Skill Pool tables), not free-form prose.
- `core/tools/lint-components/lib/rules/cross-reference.js` — Cross-reference integrity rules:
  - For each play: parse intent.yaml and compiled SKILL.md.
  - Constraint ID uniqueness: duplicate `C{N}` IDs within one intent.yaml → ERROR.
  - Failure condition ID uniqueness: duplicate `F{N}` IDs → ERROR.
  - Scenario ID uniqueness: duplicate `S{N}` IDs → ERROR.
  - Scenario coverage: scenario IDs in intent.yaml without corresponding `SCE-{N}` entries in SKILL.md → WARNING (not ERROR).
  - Sub_plays chain in Compilation Metadata, when declared, must match the play references (ERROR if mismatch).
- `core/tools/lint-components/lib/reporter.js` — Output formatter:
  - JSON format (default): `{ violations: [{file, rule, severity, message, line}], summary: {errors, warnings, infos} }` written to stdout.
  - Text format (`--output text`): human-readable, one violation per line with file path, rule, severity, message.
- `core/components/skills/lint-components/SKILL.md` — Skill wrapper. Frontmatter: `name: lint-components`, `user-invocable: false`, `model: sonnet`, `allowed-tools: Bash, Read`. Required sections: `## Purpose`, `## Input`, `## Process`, `## Output`, `## Constraints`. Process: (1) run `npm install` in `core/tools/lint-components/` if `node_modules/` absent; (2) invoke `node core/tools/lint-components/index.js --target core/components --output json`; (3) capture JSON output; (4) read `.garura/product/specification/quality-profile.yaml` to derive severity policy; (5) write structured lint report artifact to STM output path; (6) return pass/fail based on quality-profile-derived policy.

## Files to Modify

None.

## Connections

- `index.js` → `discover.js`: calls `discover()` to enumerate all components before running any rule set.
- `index.js` → `rules/structural.js`: passes each discovered component (with parsed frontmatter) to structural rules.
- `index.js` → `rules/semantic.js`: passes the full component map to semantic rules for cross-component reference validation.
- `index.js` → `rules/cross-reference.js`: passes parsed intent.yaml data and compiled SKILL.md content for each play.
- `rules/structural.js` → `parse-frontmatter.js`: calls parse-frontmatter for every SKILL.md and agent .md file.
- `index.js` → `reporter.js`: after all rule sets complete, passes accumulated violations to reporter for formatting.
- `SKILL.md (lint-components)` → `index.js`: invokes via `node core/tools/lint-components/index.js --target core/components --output json`.
- `SKILL.md (lint-components)` → `.garura/product/specification/quality-profile.yaml`: reads to derive severity policy; logs profile status field in output.
- `SKILL.md (lint-components)` → enhance/review/pr-review/ship pipelines: standalone invocable; produces lint report artifact to STM output path.

## Ordered Tasks

**T1 — Create Node.js package skeleton**
Create `core/tools/lint-components/` directory, `package.json` (js-yaml dependency, main: index.js, bin: lint-components → index.js), and `index.js` CLI entry point with `--target` and `--output` flag parsing. Rule sets can be empty stubs at this stage. Goal: `node core/tools/lint-components/index.js --target core/components --output json` exits 0 and emits valid JSON `{ violations: [], summary: { errors: 0, warnings: 0, infos: 0 } }`.

**T2 — Implement parse-frontmatter.js and discover.js**
Depends on T1. Implement frontmatter parser (triple-dash YAML extraction + js-yaml parse) and component discovery walker. `discover.js` must classify each found file as skill, play, agent, or intent-yaml and return the structured component map. Expected counts: agents ~19, plays ~22, skills ~92+.

**T3 — Implement structural rule set**
Depends on T2. Implement `lib/rules/structural.js` with all per-file rules per the Files section above. The spelling inconsistency (`user-invokable` vs `user-invocable`) must produce WARNING not ERROR for any individual file.

**T4 — Implement semantic rule set**
Depends on T2. Implement `lib/rules/semantic.js`. Use conservative extraction — only pattern-match skill/agent references from clearly structured contexts (JSON tool call blocks, Boundary tables, Skill Pool tables). Free-form prose references are best-effort.

**T5 — Implement cross-reference rule set**
Depends on T2. Implement `lib/rules/cross-reference.js`. ID uniqueness checks are ERROR; scenario coverage gaps are WARNING.

**T6 — Implement reporter.js and wire all rules into index.js**
Depends on T3, T4, T5. Implement `lib/reporter.js`. Wire all three rule sets into index.js. Merge violations. Set exit code to 1 when `summary.errors > 0`, else 0.

**T7 — Author lint-components SKILL.md**
Depends on T6. Write `core/components/skills/lint-components/SKILL.md` per spec in Files section. Must include explicit npm install check step in Process. Quality profile severity mapping: ERRORs = blockers per maintainability targets; WARNINGs = informational. Log quality profile status in output artifact.
