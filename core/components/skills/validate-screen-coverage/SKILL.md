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

Receive from the designer agent. All paths resolve against `{product_base}` supplied by the play via the JSON contract — do not hard-code `.meridian/product/` or assume a working directory.

- `screens_dir` (path, required) — typically `{product_base}experience/screens/`
- `scope_path` (path, required) — typically `{product_base}scope/scope.yaml`
- `epics_dir` (path, required) — typically `{product_base}scope/epics/`
- `flows_dir` (path, optional) — typically `{product_base}experience/flows/` (if null, skip flow checks)
- `ltm_screen_inventory_schema_path` (path, required)
- `product_research_path` (path, required) — `{product_base}research/` (the product's frozen domain library per rules/product.md Rule 15 Pull-to-Product). This skill reads domain references from the product's research folder ONLY. Passing `ltm_domain_taxonomy_path` is a structural failure (design-exp intent.yaml F13).
- `validation_path` (string, required) — validation result YAML written here
- `mode` (string, optional) — `"strict"` (default) or `"partial"`. In `strict` mode, orphan scenarios (success_scenarios without a flow, failure_scenarios without a recovery flow) flip the overall status to `failed`. In `partial` mode, orphan scenarios are reported in the output but do NOT flip status — useful for iterative/test runs where the flow set is still being built. The validator ALWAYS runs every other check; `mode` only affects how orphan scenarios gate status.

## Process

Resolve each input path by substituting `{product_base}` from the incoming JSON contract; do not re-prefix with `.meridian/product/` or assume a working directory.

### 1. Load schema + epics + scope

- Read `screen-inventory-schema.yaml` for per-screen rules.
- Load `scope.yaml` → capability set.
- Load every intent epic in `epics_dir` → build sets of all success_scenarios and failure_scenarios (indexed by epic ID + scenario index).
- Glob `{screens_dir}/*.md` → parse each screen file. Each screen is a Markdown document with YAML frontmatter (`id`, `capabilities` (a YAML list), `name`, and optional `capability_classification` — one of `user_surface` (default), `substrate`, `admin_only`) and structured sections (`## Purpose`, `## Personas`, `## States`, `## Navigation`, `## Accessibility`, and optionally `## Wireframe`). Parse the frontmatter via YAML; parse the body sections by walking H2/H3 headings and capturing the content between them.

### 2. Per-screen validation

For every screen, run:

- **Frontmatter fields:** `id`, `capabilities` (list with ≥1 entry), `name` — all present.
- **Capabilities shape:** `capabilities` MUST be a YAML list, not a scalar. A scalar `capability:` field is a blocking violation (`legacy_singular_capability`). Each list entry is a feature ID.
- **Capability classification:** if present, `capability_classification` is one of `user_surface`, `substrate`, `admin_only`. Anything else is a `bad_capability_classification` violation. Absent = treated as `user_surface`.
- **Mandatory sections:** `## Purpose`, `## Personas`, `## States`, `## Navigation`, `## Accessibility` — all present and non-empty. `## Wireframe` is required if `validate-wireframes` mode is enabled (post-Stage 4).
- **Personas section:** at least one bullet entry.
- **States section:** at least 3 H3 subsections (e.g., `### default`, `### loading`, `### error`). At least one must be an error-adjacent state (`error`, `lockout`, `empty`, `failure`, `timeout`).
- **Layout specificity:** the `default` state's `Layout:` line is not a generic phrase (`"a form"`, `"a page"`, `"generic"`). It's either a named layout hint or a specific composition description.
- **Navigation section:** `Entry points:` present with at least one entry; `Exit points:` contains at least `success:`.
- **Accessibility section:** if the screen has any interactive actions in its default state, at least one accessibility entry referencing a WCAG level.
- **Capability resolution:** every entry in the screen's `capabilities` list must exist in the scope's `selected_capabilities` set. A dangling entry is a `dangling_capability` violation.

### 3. Cross-screen validation

- **Capability coverage:** Every `user_surface` capability in `scope.selected_capabilities` must appear in the **union of all screen files' `capabilities` lists**. Screens classified as `substrate` or `admin_only` still contribute their entries to the union (and pass their own dangling checks), but capabilities that are themselves substrate/admin-only (if ever marked as such in scope) are exempt from the user-surface coverage requirement. For now, `scope.selected_capabilities` is assumed user-surface unless scope explicitly classifies entries otherwise. The `orphan_capabilities` list collects any user-surface capability whose union-membership is empty.
- **Flow coverage (if `flows_dir` is provided):**
  - For every `success_scenarios[i]` in every epic, there is at least one flow file in `flows_dir` that references either the scenario ID or a screen whose `capabilities` list contains the scenario's epic capability.
  - For every `failure_scenarios[i]`, there is at least one recovery flow referencing it.
  - In `strict` mode (default), any orphan scenario flips overall `status` to `failed` and is counted under `by_category.orphan_success_scenario` / `orphan_failure_scenario`.
  - In `partial` mode, orphan scenarios are listed separately under `orphan_scenarios_in_partial` and do NOT flip overall status. Per-screen violations, shape violations, and orphan_capabilities STILL flip status in partial mode — only the flow-coverage orphan scenarios are excluded from the gate.

### 4. Build validation result

```yaml
status: passed | failed
mode: strict | partial        # echoes the received mode
summary:
  total_screens: <int>
  screens_passed: <int>
  screens_failed: <int>
  total_violations: <int>
  by_category:
    missing_field: <int>
    legacy_singular_capability: <int>      # per-screen — capability: scalar still present
    bad_capability_classification: <int>   # per-screen — invalid classification value
    state_count_below_min: <int>
    vague_layout: <int>
    dangling_capability: <int>
    orphan_capability: <int>        # cross-screen — user_surface capability with zero screens
    orphan_success_scenario: <int>  # cross-screen — success scenario with no flow (strict only)
    orphan_failure_scenario: <int>  # cross-screen — failure with no recovery flow (strict only)
coverage:
  capabilities_total: <int>
  capabilities_covered: <int>
  orphan_capabilities: [<list of IDs>]
  success_scenarios_total: <int>
  success_scenarios_with_flow: <int>
  failure_scenarios_total: <int>
  failure_scenarios_with_recovery: <int>
orphan_scenarios_in_partial:
  # populated ONLY when mode == partial; lists scenarios the strict gate would have failed on
  success: [<epic_id/scenario_index>, ...]
  failure: [<epic_id/scenario_index>, ...]
screens:
  - id: SCR-user-login-primary
    path: <path>
    capabilities: [UM-F001]
    capability_classification: user_surface
    status: passed | failed
    violations:
      - field: states
        category: state_count_below_min
        detail: "Screen has 2 states; minimum is 3"
```

### 5. Write output

Write the validation result to `{validation_path}`. Do NOT modify any screen files.

### 6. Return output contract

```yaml
validation:
  path: <written path>
  status: passed | failed
  mode: strict | partial
  total_screens: <int>
  failed_screens: <int>
  total_violations: <int>
  orphan_scenarios_in_partial_count: <int>   # 0 in strict mode
```

## Constraints

- NEVER modify screen files. Read-only.
- NEVER "auto-fix" violations. Report them, let `generate-screen-inventory` regenerate on cycle-back.
- NEVER skip a check. All checks run on every screen, even after the first failure — the full list is needed for fix context.
- NEVER return `passed` with any per-screen violation or any `orphan_capabilities`. `passed` means zero per-screen violations AND zero user-surface capability orphans. In `strict` mode this additionally means zero orphan scenarios.
- NEVER accept `mode: partial` in production runs — only test/iterative runs where the flow set is known to be incomplete. The caller (a play) MUST default to `strict` and only pass `partial` when the run is explicitly non-final.
- NEVER silently collapse a multi-capability screen to a single capability when checking coverage. The full `capabilities` list participates in the union.
- NEVER accept `capability:` as a scalar in frontmatter. It is the legacy shape and MUST produce a `legacy_singular_capability` violation.
- NEVER count `substrate` or `admin_only` screens against user-surface capability coverage obligations, but DO still run per-screen checks against them (dangling capability, state count, layout specificity, etc.).
- ALWAYS read the schema as the source of truth — no hard-coded rules in skill logic.
- ALWAYS check both directions of flow coverage (success + failure).
- ALWAYS echo `mode` and (when `partial`) `orphan_scenarios_in_partial` in the output so downstream plays can see what the strict gate would have rejected.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-screen-inventory`, `core/components/skills/map-user-flows`, `core/components/memory/standards/schemas/screen-inventory.yaml` |
