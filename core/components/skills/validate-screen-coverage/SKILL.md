---
name: validate-screen-coverage
description: Blocking validator for the screen inventory. Asserts every capability maps to at least one screen, every screen has at least three states, every success scenario has a user flow, and every failure scenario has a recovery flow. Returns structured failure with per-screen error details.
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep
---

# validate-screen-coverage

Called by `designer` during `design-exp` after Stage 2 (screen inventory) and after Stage 3 (flows) for a second pass with flow coverage.

## Purpose

Enforce the structural coverage rules from `screen-inventory-schema.yaml`. Runs per-screen checks and cross-screen checks. On any violation, returns structured failure — the calling play halts and cycles back to `generate-screen-inventory` or `map-user-flows` with the error report.

## Input

Receive from the designer agent:
- `screens_dir` (path, required) — typically `.meridian/product/ux/screens/`
- `scope_path` (path, required) — `.meridian/product/product/scope.yaml`
- `epics_dir` (path, required) — `.meridian/product/product/epics/`
- `flows_dir` (path, optional) — `.meridian/product/ux/flows/` (if null, skip flow checks)
- `ltm_screen_inventory_schema_path` (path, required)
- `ltm_domain_taxonomy_path` (path, required)
- `output_path` (string, required) — validation result YAML

## Process

### 1. Load schema + epics + scope

- Read `screen-inventory-schema.yaml` for per-screen rules.
- Load `scope.yaml` → capability set.
- Load every intent epic in `epics_dir` → build sets of all success_scenarios and failure_scenarios (indexed by epic ID + scenario index).
- Glob `{screens_dir}/*.md` → parse each screen file. Each screen is a Markdown document with YAML frontmatter (id, capability, name) and structured sections (`## Purpose`, `## Personas`, `## States`, `## Navigation`, `## Accessibility`, and optionally `## Wireframe`). Parse the frontmatter via YAML; parse the body sections by walking H2/H3 headings and capturing the content between them.

### 2. Per-screen validation

For every screen, run:

- **Frontmatter fields:** `id`, `capability`, `name` — all present.
- **Mandatory sections:** `## Purpose`, `## Personas`, `## States`, `## Navigation`, `## Accessibility` — all present and non-empty. `## Wireframe` is required if `validate-wireframes` mode is enabled (post-Stage 4).
- **Personas section:** at least one bullet entry.
- **States section:** at least 3 H3 subsections (e.g., `### default`, `### loading`, `### error`). At least one must be an error-adjacent state (`error`, `lockout`, `empty`, `failure`, `timeout`).
- **Layout specificity:** the `default` state's `Layout:` line is not a generic phrase (`"a form"`, `"a page"`, `"generic"`). It's either a named layout hint or a specific composition description.
- **Navigation section:** `Entry points:` present with at least one entry; `Exit points:` contains at least `success:`.
- **Accessibility section:** if the screen has any interactive actions in its default state, at least one accessibility entry referencing a WCAG level.
- **Capability resolution:** `capability` frontmatter value exists in the scope's `selected_capabilities` set.

### 3. Cross-screen validation

- **Capability coverage:** Every capability in `scope.selected_capabilities` has ≥1 screen in the inventory. The `orphan_capabilities` list is empty.
- **Flow coverage (if `flows_dir` is provided):**
  - For every `success_scenarios[i]` in every epic, there is at least one flow file in `flows_dir` that references either the scenario ID or a screen whose capability matches the scenario's epic.
  - For every `failure_scenarios[i]`, there is at least one recovery flow referencing it.

### 4. Build validation result

```yaml
status: passed | failed
summary:
  total_screens: <int>
  screens_passed: <int>
  screens_failed: <int>
  total_violations: <int>
  by_category:
    missing_field: <int>
    state_count_below_min: <int>
    vague_layout: <int>
    dangling_capability: <int>
    orphan_capability: <int>       # cross-screen — capability with zero screens
    orphan_success_scenario: <int>  # cross-screen — scenario with no flow
    orphan_failure_scenario: <int>  # cross-screen — failure with no recovery flow
coverage:
  capabilities_total: <int>
  capabilities_covered: <int>
  orphan_capabilities: [<list of IDs>]
  success_scenarios_total: <int>
  success_scenarios_with_flow: <int>
  failure_scenarios_total: <int>
  failure_scenarios_with_recovery: <int>
screens:
  - id: SCR-user-login-primary
    path: <path>
    status: passed | failed
    violations:
      - field: states
        category: state_count_below_min
        detail: "Screen has 2 states; minimum is 3"
```

### 5. Write output

Write the validation result to `{output_path}`. Do NOT modify any screen files.

### 6. Return output contract

```yaml
validation:
  path: <written path>
  status: passed | failed
  total_screens: <int>
  failed_screens: <int>
  total_violations: <int>
```

## Constraints

- NEVER modify screen files. Read-only.
- NEVER "auto-fix" violations. Report them, let `generate-screen-inventory` regenerate on cycle-back.
- NEVER skip a check. All checks run on every screen, even after the first failure — the full list is needed for fix context.
- NEVER return `passed` with any violation. `passed` means zero violations across every screen AND every cross-screen check.
- ALWAYS read the schema as the source of truth — no hard-coded rules in skill logic.
- ALWAYS check both directions of flow coverage (success + failure).

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-screen-inventory`, `core/components/skills/map-user-flows`, `core/components/memory/standards/screen-inventory-schema.yaml` |
