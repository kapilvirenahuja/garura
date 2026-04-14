---
name: configure-capabilities
description: Load the domain-taxonomy capability catalog, apply project-profile-driven inclusion rules, walk every cross-tree constraint explicitly, present optional capabilities to the user, produce scope.yaml with selected/rejected capabilities and the constraint_trace audit.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# configure-capabilities

Model-invocable skill for selecting capabilities from the KB catalog against a project profile. Called by the `product-keeper` agent during `specify-product` Stage 3.

## Purpose

Deterministic capability selection — given a project profile and a KB catalog, produce a scope.yaml that lists:
- `selected_capabilities` — capabilities that are in-scope, with per-capability rationale
- `rejected_capabilities` — capabilities that were excluded, with reason
- `constraint_trace` — every cross-tree constraint walked, whether it fired, and what it forced

Every decision is recorded. No silent exclusion, no silent inclusion.

## Input

Receive from product-keeper agent:
- `project_profile_path` (path, required) — frozen project profile YAML
- `market_brief_path` (path, optional) — informs domain selection when market data suggests specific domains
- `ltm_domain_taxonomy_path` (path, required) — typically `core/components/memory/knowledge/domain-taxonomy/`
- `ltm_cross_tree_constraints_path` (path, required) — typically `{ltm_domain_taxonomy_path}/_cross-tree-constraints.yaml`
- `ltm_kb_extension_conventions_path` (path, required) — the parser guide at `core/components/memory/standards/kb-extension-conventions.md`
- `selected_domains` (list, required) — the domain names selected in Stage 2 (e.g., `["user-management", "commerce"]`)
- `optional_capability_selections` (list, optional) — user-approved optional capabilities from checkpoint
- `output_path` (string, required) — typically `.meridian/product/product/scope.yaml`

## Process

### 1. Load and parse

- Read the project profile YAML into an ordered mapping.
- Read `_cross-tree-constraints.yaml` in full — it's small and always needed.
- For each `selected_domain`, read the corresponding `{domain}.md` file.
- For each domain file, extract every feature block (heading `### {PREFIX}-F\d+:`) and parse its `### Inclusion`, `### Cross-Tree Refs`, and metadata per `kb-extension-conventions.md`.

### 2. Auto-include mandatory features

For every feature in every selected domain:
- If `Inclusion` says `Default: **mandatory**` AND no `Exclude when` condition matches the profile → INCLUDE.
- If `Inclusion` has `Mandatory when` condition AND the condition matches the profile → INCLUDE.

Record each inclusion in `selected_capabilities` with `rationale: "mandatory by default"` or `rationale: "mandatory-when condition matched: {condition}"`.

### 3. Walk cross-tree constraints explicitly

For EVERY constraint in `_cross-tree-constraints.yaml` (not just those that fire):
- Evaluate the `condition` expression against the project profile and the currently-selected capability set.
- If the condition matches:
  - For each `implies_include` feature ID → add to `selected_capabilities` if not already present, with `rationale: "cross-tree constraint {id}: {description}"`.
  - For each `implies_exclude` feature ID → add to `rejected_capabilities` with `reason: "excluded by {id}: {description}"`.
  - For each `implies_include_depth` / `implies_exclude_depth` → record the depth cap in `depth_caps`.
- Record the constraint decision in `constraint_trace`:

  ```yaml
  constraint_trace:
    - id: CTC-001
      description: "High-security profiles require MFA"
      fired: true | false
      condition_evaluated: "<the resolved expression>"
      action_taken: <list of feature IDs affected>
      rationale: <the constraint's rationale from the YAML>
  ```

Constraints that do NOT fire are still recorded with `fired: false` — the trace is complete.

### 4. Apply conditional features

For every feature with `Default: **conditional**`:
- Evaluate the `Mandatory when` condition against the profile.
- If matched → INCLUDE with rationale.
- Otherwise → leave for user decision in step 5.

### 5. Present optional features

Features with `Default: **optional**` that were NOT included by a cross-tree constraint are returned in a `pending_user_selection` list. The calling play presents these at the capability-configuration checkpoint.

If `optional_capability_selections` was passed in (user already selected them via a previous checkpoint cycle), add them to `selected_capabilities` with `rationale: "user-selected at checkpoint"`.

### 6. Apply depth caps from CTC-005 / CTC-010

If any cross-tree constraint fired `implies_exclude_depth`, record a global `depth_ceiling` for affected features. Downstream enrichment honors this ceiling when deriving business rules from the Depth Spectrum.

### 7. Write scope.yaml

```yaml
slug: <from project_profile.name>
status: DRAFT
created_at: <ISO-8601>
project_profile_path: <echoed>
selected_capabilities:
  - id: UM-F001
    domain: user-management
    name: "Login / Authentication"
    rationale: "mandatory by default (Inclusion); cross-tree CTC-001 also implies MFA"
    depth_cap: null | advanced | enterprise
  - ...
rejected_capabilities:
  - id: UM-F007
    domain: user-management
    name: "Social Login (OAuth2)"
    reason: "excluded by CTC-009 (SSO-only auth excludes social login)"
  - ...
pending_user_selection:
  - id: UM-F006
    domain: user-management
    name: "User Profile (Extended / Preferences)"
    default: optional
    recommendation: "consider if UX maturity >= 3"
constraint_trace:
  - id: CTC-001
    fired: true
    action_taken: ["UM-F004"]
    ...
  - id: CTC-002
    fired: false
    condition_evaluated: "'HIPAA' in compliance (false — compliance is [])"
    action_taken: []
    ...
depth_caps:
  global: null | advanced | enterprise
  per_feature: {}
```

### 8. Return the output contract

```yaml
scope:
  path: <written path>
  selected_count: <int>
  rejected_count: <int>
  pending_count: <int>
  constraints_walked: <int>    # should equal total constraints in the file
  constraints_fired: <int>
  dangling_feature_refs: <int> # must be 0 — any >0 is a structured failure
```

## Constraints

- NEVER skip a cross-tree constraint. All constraints are walked, whether or not they fire. Missing from the trace is a compliance violation.
- NEVER invent feature IDs. Every ID in `selected_capabilities`, `rejected_capabilities`, and `pending_user_selection` must resolve to a real feature in a domain-taxonomy markdown file.
- NEVER silently exclude a capability. Every exclusion has a `reason` recorded in `rejected_capabilities`.
- NEVER silently include a capability. Every inclusion has a `rationale`.
- NEVER write outside `{output_path}`. Scope.yaml is the only file this skill writes.
- ALWAYS evaluate cross-tree conditions against BOTH the project profile AND already-selected capabilities (for constraints that reference prior selections).
- ALWAYS record the full constraint trace — both fired and not-fired constraints.
- ALWAYS read the feature files selectively (grep for the feature heading and parse the block); do not bulk-load every domain file into memory.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/agents/product-keeper.md`, `core/components/memory/standards/kb-extension-conventions.md`, `core/components/memory/knowledge/domain-taxonomy/_cross-tree-constraints.yaml` |
