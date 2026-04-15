---
name: validate-architecture-spec
description: Blocking validator for architecture.yaml and quality-standards.yaml. Asserts every capability is mapped to a component, every technology choice is named (not a category), every decision cites a driver, and every relevant ISO 25010 characteristic has a corresponding quality standard.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep
---

# validate-architecture-spec

Called by `tech-architect` during `build-arch` after Stage 1 (architecture derivation) and after Stage 2 (quality-standards derivation). Blocking validator — on any violation, returns structured failure and the calling play cycles back.

## Purpose

Enforce the `build-arch` intent.yaml contract against the actual output. Checks that architecture.yaml has specific technology names, capability-to-component mapping, cited drivers, and PII handling where relevant; checks that quality-standards.yaml covers every relevant ISO 25010 characteristic with concrete tooling and thresholds.

## Input

Receive from tech-architect:
- `architecture_path` (path, required) — `.meridian/product/architecture/architecture.yaml`
- `quality_standards_path` (path, optional — required in Stage 2 validation, null in Stage 1) — `.meridian/product/architecture/quality-standards.yaml`
- `scope_path` (path, required) — `.meridian/product/scope/scope.yaml`
- `epics_dir` (path, required)
- `quality_profile_path` (path, required)
- `ltm_architecture_path` (path, required) — for known technology name list
- `output_path` (string, required) — validation result YAML

## Process

### 1. Load inputs

- Parse `architecture.yaml`.
- If provided, parse `quality-standards.yaml`.
- Load `scope.selected_capabilities` set.
- Load every intent epic's `constraints` section and `capability` field.
- Load `quality-profile.yaml` characteristics with `relevance != not_applicable`.

### 2. Validate architecture.yaml

**Mandatory top-level sections:** `slug`, `status`, `stack`, `components`, `data_model`, `api_surface`, `deployment`, `adrs`.

**Stack specificity (C3):** For each stack field (frontend, backend, data_primary, data_cache, message_queue, auth), the `choice` value must:
- Contain a specific product name
- NOT match any of the category phrases: `a relational database`, `a message queue`, `a frontend framework`, `a cache`, `a backend framework`, `an auth provider`, `an NoSQL store`, `a database`, `a queue`, `a framework`, `an ORM`, `a runtime`.
- Each stack field has a `rationale` field (non-empty string, length ≥ 40 chars).
- Each stack field has a `drivers` list with ≥ 1 entry.

**Capability coverage (C5):** Every capability ID in `scope.selected_capabilities` appears in at least one entry in `components[].capability`. Orphan capabilities are violations.

**Performance coverage (C6):** For every intent epic that has a `constraints.performance` value, there is at least one component whose `performance_budget.source` cites that epic's ID OR at least one ADR whose `drivers` list cites the epic's performance constraint.

**ADR discipline (C9):** Every ADR has `id` (matching `ADR-\d+`), `title`, `status`, `date`, `context`, `alternatives` (list length ≥ 1), `decision`, `rationale`, `drivers` (≥ 1), and `consequences` (with positive and negative sub-lists).

**PII handling:** For every entity in `data_model.entities` with a non-empty `pii_fields` list, there must be a `pii_handling` sub-section with `encryption_at_rest: true` and an `encryption_source` string referencing either a compliance regulation or a security target.

### 3. Validate quality-standards.yaml (if provided)

**Mandatory top-level sections:** `slug`, `status`, `upstream`, `qp_dimensions`, `iso_25010_coverage`, `tooling_summary`, `debt_baseline`.

**QP dimension discipline (C8):** For every key under `qp_dimensions`, every standard entry has:
- `category` (non-empty)
- `tooling` (non-empty, names at least one specific product — same blacklist check as architecture stack)
- `threshold` (non-empty, contains a number, percentage, or specific measurable criterion)
- `enforcement` (non-empty)

**ISO 25010 coverage (C7):** For every characteristic in `quality-profile.iso_25010_profile` with `relevance != not_applicable`, there is a corresponding entry in `quality-standards.iso_25010_coverage` with a non-empty `standards_covering` list. `gaps` list should be empty.

**Vagueness detection:** Scan every string value in `qp_dimensions.*.standards[*]` for blacklisted phrases (`a linter`, `a coverage tool`, `appropriate testing`, `comprehensive coverage`, `good practices`, `industry standards`). Any match is a violation.

### 4. Build validation result

```yaml
status: passed | failed
summary:
  architecture_status: passed | failed
  quality_standards_status: passed | failed | skipped
  total_violations: <int>
  by_category:
    missing_field: <int>
    category_term: <int>
    uncited_decision: <int>
    orphan_capability: <int>
    missing_performance_mapping: <int>
    incomplete_adr: <int>
    missing_pii_handling: <int>
    qp_vagueness: <int>
    orphan_iso_characteristic: <int>
architecture:
  violations:
    - field: stack.frontend.choice
      category: category_term
      detail: "'a frontend framework' is a category, not a specific product"
quality_standards:
  violations: ...
```

### 5. Write output

Write validation result to `{output_path}`. Do NOT modify `architecture.yaml` or `quality-standards.yaml`.

### 6. Return output contract

```yaml
validation:
  path: <written path>
  status: passed | failed
  architecture_status: passed | failed
  quality_standards_status: passed | failed | skipped
  total_violations: <int>
```

## Constraints

- NEVER modify architecture or quality-standards files. Read-only.
- NEVER auto-fix violations. Report them; let `derive-architecture-spec` or `derive-quality-standards` regenerate on cycle-back.
- NEVER skip a check. All checks run on every field.
- NEVER return `passed` with any violation.
- ALWAYS check both files when both are present.
- ALWAYS load the upstream scope and epics to verify traceability.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | architecture |
| Created | 2026-04-14 |
| Related | `core/components/skills/derive-architecture-spec`, `core/components/skills/derive-quality-standards` |
