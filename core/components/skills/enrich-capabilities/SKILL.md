---
name: enrich-capabilities
description: For each selected capability, merge project-profile-specific overrides onto the KB base values (business rules, depth spectrum cap, experiential warnings), producing enriched-capabilities.yaml — the input to intent-epic generation.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep
---

# enrich-capabilities

Model-invocable skill for context-merging KB capability data with project-specific overrides. Called by `product-keeper` during `specify-product` Stage 4.

## Purpose

The KB catalog holds generic feature definitions. The project profile holds specific context (security level, compliance, audience, timeline). This skill merges the two so downstream epic generation has a single enriched source per capability — no downstream skill re-reads the KB or re-applies the profile.

## Input

Receive from product-keeper:
- `scope_path` (path, required) — scope.yaml from configure-capabilities
- `project_profile_path` (path, required) — frozen project profile YAML
- `ltm_domain_taxonomy_path` (path, required) — `core/components/memory/knowledge/domain-taxonomy/`
- `market_brief_path` (path, optional) — used for additional context
- `output_path` (string, required) — `.meridian/product/product/enriched-capabilities.yaml`

## Process

### 1. Load scope

Parse `scope.yaml`. Iterate over `selected_capabilities`. For each capability, note its `id`, `domain`, and any `depth_cap` from constraint_trace.

### 2. For each selected capability, read the KB block

Use grep to isolate the specific feature block in `{domain}.md` (e.g., `grep -A 200 "^### UM-F001" user-management.md` stopping at the next `###`). Parse:
- The 4 prose sections (`When It Matters`, `Depth Spectrum`, `Signals`, `Tradeoffs`)
- The 5 structured sections (`Inclusion`, `Success Criteria`, `Failure Scenarios`, `Cross-Tree Refs`, `Experiential`)

### 3. Apply profile overrides

For each capability:
- **Depth selection:** determine which depth level (Basic / Standard / Advanced / Enterprise) applies based on the Signals section and the profile. If a `depth_cap` was set by cross-tree constraints (e.g., CTC-005 timeline=tight → cap at Standard), honor it.
- **Business rules:** extract rules implied by the selected depth. If the profile says `security_level: critical`, pick the strictest business rules from the Depth Spectrum's Enterprise level even if Standard was selected for depth — security rules ratchet up regardless of depth.
- **Success criteria:** pass through from the KB Success Criteria section.
- **Failure scenarios:** pass through from the KB Failure Scenarios section, enriched with profile-specific impact notes (e.g., "Impact on HIPAA-regulated flow" when compliance contains HIPAA).
- **Experiential warnings:** extract from the KB Experiential section — specifically the "Common mistakes" list.

### 4. Compose enriched record per capability

```yaml
enriched_capabilities:
  - id: UM-F001
    domain: user-management
    name: "Login / Authentication"
    selected_depth: standard | advanced | enterprise
    depth_cap_applied: null | standard | advanced
    profile_context:
      security_level: <from profile>
      industry: <from profile>
      compliance: <list from profile>
    business_rules_applied:
      - "Lock after 3 failed attempts — HIGH security level"
      - "Session timeout 15 minutes idle — enterprise profile"
    success_criteria:
      - "Login success rate > 95% on first attempt"
      - ...
    failure_scenarios:
      - scenario: "..."
        impact: "..."
        mitigation: "..."
    experiential_warnings:
      - "Skipping rate limiting on login endpoint"
      - ...
    kb_source:
      file: core/components/memory/knowledge/domain-taxonomy/user-management.md
      feature_id: UM-F001
      depth_spectrum_used: <depth>
```

### 5. Write enriched-capabilities.yaml

Write all enriched records to `{output_path}`. Include a top-level `status: DRAFT`, `created_at` timestamp, `source_scope_path` reference.

### 6. Return output contract

```yaml
enriched:
  path: <written path>
  enriched_count: <int>  # should match scope.selected_capabilities count
  missing_kb_sources: <int>  # must be 0 — any >0 is a structured failure
```

## Constraints

- NEVER invent business rules not derivable from the KB feature's Depth Spectrum or Tradeoffs sections.
- NEVER silently drop a scope entry. If a feature can't be found in the KB, return structured failure with the dangling ID.
- NEVER modify the KB catalog — this skill is read-only on domain-taxonomy.
- ALWAYS honor depth caps from cross-tree constraints.
- ALWAYS ratchet security / compliance business rules UP when the profile demands it, even if depth says otherwise.
- ALWAYS include every KB section's data (business_rules, success_criteria, failure_scenarios, experiential_warnings) in the enriched record.
- Read feature blocks selectively via grep — do not bulk-load whole domain files.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/skills/configure-capabilities`, `core/components/skills/generate-intent-epics`, `core/components/memory/standards/kb-extension-conventions.md` |
