---
name: draft-roadmap
description: Generate roadmap.yaml — produced ONLY after the roadmap-brief is Tether-approved
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-roadmap

Model-invocable skill for generating the full roadmap.yaml artifact after brief approval.

## Purpose

Generate `roadmap.yaml` — produced ONLY after the roadmap-brief is Tether-approved. This is the machine-readable artifact consumed by downstream recipes (manage-backlog, start-feature-planning, plan-architecture). It consolidates roadmap content (thesis, narrative, timeline) and feasibility data (per-feature risks, blockers, sequencing) into a single artifact.

You DO produce the roadmap artifact. You do NOT approve the brief, validate feasibility, or decide what happens next.

## Output Schema

The output MUST conform to `schemas/roadmap.yaml` in this skill's directory. Read the schema before producing output. Every field defined in the schema must be present in the output YAML. The schema is the contract — if it's in the schema, it's in the output.

## Input

Receive from agent:
- `product_yaml_path` — (required) Path to the approved product.yaml, e.g. `.meridian/product/discovery/product.yaml`
- `approved_roadmap_brief_path` — (required) Path to the Tether-approved roadmap-brief.html artifact
- `feasibility_path` — (required) Path to the STM feasibility data written by assess-feasibility, e.g. `.meridian/product/roadmap/feasibility.yaml`
- `artifact_base` — (required) Base path for output, e.g., `.meridian/product/`
- `slug` — (required) Product slug

## Pre-conditions

Verify brief is approved — check for Tether record in checkpoint. If not approved, return structured failure:

```json
{ "error": "brief_not_approved", "message": "Roadmap brief has not been Tether-approved — run DRAFT phase feedback loop first" }
```

## Process

1. **Verify brief approval** — Confirm Tether record exists for the brief at `approved_roadmap_brief_path`. Halt immediately with structured failure if not approved.

2. **Read product.yaml** at `product_yaml_path` to extract:
   - `slug`, `status`
   - `strategic_goals` — used to anchor the thesis
   - `assumptions` — carried forward into roadmap assumptions
   - `out_of_scope` — preserved verbatim as exclusions

3. **Read approved roadmap-brief.html** at `approved_roadmap_brief_path` to extract:
   - The Bet section → `thesis`
   - The Story section → `narrative`
   - Decisions table → feature metadata (horizon, priority, effort, dependencies)
   - Exclusions chapter → roadmap `exclusions`
   - Assumptions chapter → roadmap `assumptions`

4. **Read feasibility.yaml** at `feasibility_path` using the Read tool. Extract per-feature feasibility data: risk_level, technical_risks, blockers, sequencing_constraints, architecture_impact.

5. **Compose roadmap.yaml** conforming to the roadmap.yaml schema. Populate all sections:

   - **Top-level metadata**: slug (from product.yaml), status `"DRAFT"`, created_at (current ISO-8601), updated_at (current ISO-8601), product_ref (path to product.yaml), approved_brief_ref (`approved_roadmap_brief_path`)
   - **thesis**: extracted verbatim from The Bet section of the brief — 1–2 sentences
   - **narrative**: extracted verbatim from The Story section — 3–4 paragraphs as a YAML block scalar
   - **timeline**: one entry per horizon (near/mid/long) with epic_refs using E-ID notation (E1, E2, etc.), preserving the sequencing expressed in the approved brief
   - **feasibility**: one entry per epic with all fields from feasibility.yaml — epic_ref (E-ID), risk_level, technical_risks (list with risk/severity/affected_systems/mitigation), blockers, sequencing_constraints, architecture_impact
   - **critical_blockers**: hard blockers from feasibility that must be resolved before proceeding — severity high or critical, affected_features, resolution
   - **open_questions**: unresolved technical or strategic questions from feasibility open_questions
   - **risk_summary**: computed from feasibility data — total_epics, high_risk_count, medium_risk_count, blocker_count, foundation_epics
   - **exclusions**: copied verbatim from the approved brief's Exclusions chapter (which originates from locked product.yaml out_of_scope)
   - **assumptions**: copied verbatim from the approved brief's Assumptions chapter (which originates from locked product.yaml assumptions)

6. **Write to** `{artifact_base}roadmap/roadmap.yaml` using the Write tool.

7. **Return output contract.**

## Epic ID Mapping

Epics referenced in timeline and feasibility use E-ID notation (E1, E2, E3...). The mapping from epic names to E-IDs must be consistent throughout the document — if an epic is E2 in timeline, it is E2 in feasibility and risk_summary.

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
  approved_brief: "{path}"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- Brief approval is a pre-condition — the Pre-conditions section handles enforcement via structured failure
- ALWAYS include `approved_brief_ref` in roadmap.yaml
- ALWAYS read from product.yaml (not vision.md) — product.yaml is the upstream input
- ALWAYS consolidate feasibility data into roadmap.yaml — do NOT leave feasibility as a separate artifact
- ALWAYS transcribe thesis, narrative, timeline sequencing, exclusions, and assumptions from the approved brief verbatim — do NOT paraphrase or regenerate them
- Epic IDs (E1, E2...) MUST be consistent across timeline, feasibility, risk_summary, and critical_blockers sections
- All timeline epic_refs MUST have a corresponding feasibility entry
- `user-invocable: false`

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | strategy |
