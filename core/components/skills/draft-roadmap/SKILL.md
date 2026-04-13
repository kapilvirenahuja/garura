---
name: draft-roadmap
description: Generate roadmap.yaml directly from locked upstream YAML artifacts (product.yaml, epics.yaml, feasibility.yaml) — no brief intermediate
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-roadmap

Model-invocable skill for generating the full roadmap.yaml artifact by composing it directly from three locked upstream YAML artifacts.

## Purpose

Generate `roadmap.yaml` by reading `product.yaml` (vision, strategic_goals, scope, assumptions), `epics.yaml` (scoped IDD epics), and `feasibility.yaml` (per-epic risk, blockers, sequencing) and composing a single consolidated artifact. This is the machine-readable artifact consumed by downstream plays (manage-backlog, start-feature-planning, plan-architecture).

You DO produce the roadmap artifact. You do NOT validate feasibility, render briefs, or decide what happens next.

## Output Schema

The output MUST conform to `schemas/roadmap.yaml` in this skill's directory. Read the schema before producing output. Every field defined in the schema must be present in the output YAML. The schema is the contract — if it's in the schema, it's in the output.

## Input

Receive from agent:
- `product_yaml_path` — (required) Path to the locked product.yaml, e.g. `.meridian/product/discovery/product.yaml`
- `epics_yaml_path` — (required) Path to the approved epics.yaml written by scope-roadmap-epics, e.g. `.meridian/product/roadmap/epics.yaml`
- `feasibility_path` — (required) Path to the approved feasibility.yaml written by assess-feasibility, e.g. `.meridian/product/roadmap/feasibility.yaml`
- `artifact_base` — (required) Base path for output, e.g., `.meridian/product/`
- `slug` — (required) Product slug

## Pre-conditions

All three YAML inputs must exist and be readable. If any input is missing, return structured failure:

```json
{ "error": "input_missing", "message": "Required YAML input not found: <path>" }
```

## Process

1. **Read product.yaml** at `product_yaml_path` to extract:
   - `slug`, `status`
   - `vision` — source material for narrative
   - `strategic_goals` — source material for thesis, and anchor for timeline reasoning
   - `assumptions` — carried forward verbatim into roadmap `assumptions`
   - `scope.out_of_scope` — carried forward verbatim into roadmap `exclusions`

2. **Read epics.yaml** at `epics_yaml_path` to extract:
   - Every epic's `id` (E1, E2, …), `name`, `strategic_goal_ref`, `intent`, `constraints.in_scope`, and any `horizon` / `priority` / `foundation_investment` metadata the scoping agent recorded.

3. **Read feasibility.yaml** at `feasibility_path` to extract per-epic data: `risk_level`, `technical_risks`, `blockers`, `sequencing_constraints`, `architecture_impact`, plus top-level `critical_blockers` and `open_questions` if present.

4. **Compose roadmap.yaml** conforming to the roadmap.yaml schema. Populate all sections:

   - **Top-level metadata**: `slug` (from product.yaml), `status: "DRAFT"`, `created_at` (current ISO-8601), `updated_at` (current ISO-8601), `product_ref` (path to product.yaml), `epics_ref` (path to epics.yaml), `feasibility_ref` (path to feasibility.yaml)
   - **thesis**: 1–2 sentences composed directly from product.yaml `strategic_goals` — summarize the strategic bet the goals express. Do NOT invent goals not present in product.yaml.
   - **narrative**: 3–4 paragraphs composed from product.yaml `vision` + `strategic_goals` and the epic sequencing implied by `epics.yaml` + `feasibility.yaml.sequencing_constraints`. Explains how the epics flow together and why each horizon builds on the previous.
   - **timeline**: one entry per horizon (near/mid/long). Derive epic-to-horizon assignment from (a) epics.yaml `horizon` / `priority` fields if present, otherwise (b) feasibility.yaml `sequencing_constraints` (epics with no dependencies → near; epics that depend on near-epics → mid; epics that depend on mid-epics → long). Each timeline entry has `horizon`, `label`, and `epic_refs` using the epic IDs from epics.yaml directly.
   - **feasibility**: one entry per epic copied directly from feasibility.yaml — `epic_ref`, `risk_level`, `technical_risks` (list with risk/severity/affected_systems/mitigation), `blockers`, `sequencing_constraints`, `architecture_impact`. Preserve ordering from feasibility.yaml.
   - **critical_blockers**: copy from feasibility.yaml `critical_blockers` verbatim (may be empty list).
   - **open_questions**: copy from feasibility.yaml `open_questions` verbatim (may be empty list).
   - **risk_summary**: computed from feasibility data — `total_epics` (count of feasibility entries), `high_risk_count`, `medium_risk_count`, `blocker_count`, `foundation_epics` (epics whose epics.yaml entry has `foundation_investment: true`, else empty list).
   - **exclusions**: copied verbatim from product.yaml `scope.out_of_scope`.
   - **assumptions**: copied verbatim from product.yaml `assumptions`.

5. **Write to** `{artifact_base}roadmap/roadmap.yaml` using the Write tool.

6. **Return output contract.**

## Epic ID Consistency

Epic IDs (E1, E2, …) are sourced directly from epics.yaml and MUST be used unchanged in roadmap.yaml `timeline`, `feasibility`, `risk_summary.foundation_epics`, and `critical_blockers.affected_epics`. Do NOT renumber, remap, or invent epic IDs.

## Output

```yaml
roadmap:
  roadmap_yaml_path: "{full path to roadmap.yaml}"
  slug: "{slug}"
  epic_count: {integer}
  feasibility_entries: {integer}
  high_risk_count: {integer}
  blocker_count: {integer}
  status: "DRAFT"
  sources:
    product_ref: "{product_yaml_path}"
    epics_ref: "{epics_yaml_path}"
    feasibility_ref: "{feasibility_path}"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- ALWAYS read all three YAML inputs before composing roadmap.yaml — no field may be fabricated
- ALWAYS derive thesis and narrative from product.yaml vision + strategic_goals — never invent strategic direction not grounded in product.yaml
- ALWAYS copy exclusions verbatim from product.yaml `scope.out_of_scope`
- ALWAYS copy assumptions verbatim from product.yaml `assumptions`
- ALWAYS copy feasibility entries verbatim from feasibility.yaml — do not re-assess risks
- ALWAYS consolidate feasibility data into roadmap.yaml — do NOT leave feasibility as a separate artifact
- Epic IDs (E1, E2…) MUST be consistent across timeline, feasibility, risk_summary, and critical_blockers sections and MUST match the IDs in epics.yaml
- All timeline epic_refs MUST have a corresponding feasibility entry
- NEVER read, parse, or reference a roadmap-brief.html file — briefs are not an input to this skill
- `user-invocable: false`

## Version

| Field | Value |
|-------|-------|
| Version | 3.0.0 |
| Category | strategy |
