---
name: scope-roadmap-epics
description: Extract epics from a locked product definition, scope them with IDD fields (intent, constraints, scenarios, failure conditions), and write to STM
user-invocable: false
model: sonnet
allowed-tools: Read, Write
category: strategy
version: 2.1.0
---

# scope-roadmap-epics

Model-invocable skill for extracting and scoping epics from a locked product definition.

## Purpose

Read a locked product.yaml and derive 3–6 epics linked to Strategic Goals. Each epic gets full IDD treatment: intent (3 paragraphs), constraints (in/out/must-not-break), success scenarios (given/when/then), and failure conditions. Plus scoping fields: time bucket, priority, effort, dependencies. Returns a path to the STM artifact.

You DO derive, scope, and fully define the epics. You do NOT create GitHub issues, make implementation decisions, or choose technical approaches.

## Input

Receive from agent:
- `product_yaml_path` — (required) Full path to product.yaml
- `artifact_base` — (required) Base path for STM artifacts, e.g. `.meridian/project/product/`
- `epic_schema_path` — (required) Path to the epic schema in LTM, e.g. `~/.meridian/core/memory/standards/templates/epic-schema.md`. The agent discovers this from LTM and passes it — the skill does NOT search LTM itself.
- `time_horizon` — (optional, default: "12 months") Planning window for bucket assignment
- `profile_knowledge_path` — (optional) Path to LTM project-profiling directory for domain taxonomy reasoning

## Pre-conditions

1. **Read product.yaml** at `product_yaml_path`. If not found, return structured failure: artifact not found.
2. **Verify LOCKED status:** If status is not LOCKED, return structured failure:
   ```json
   { "error": "product_not_locked", "message": "Product is not LOCKED — run /discover-product --phase lock first" }
   ```

## Process

1. **Load the epic schema** — read the file at `epic_schema_path` (passed by the agent from LTM) using the Read tool. This defines the required fields (10 scoping + 4 IDD), prohibited fields, valid values, YAML structure, and the validation checklist. All epics MUST conform to this schema. If `epic_schema_path` is not provided, fall back to `reference/epic-schema.md`.

2. **Read product.yaml** at `product_yaml_path` — extract product name, slug, Strategic Goals, assumptions, and user context.

2b. **Read project profiles** — extract the `profiles` section from product.yaml. If profiles are present, use them to inform epic scoping depth:
   - PP-7 (Industry Vertical) determines which domain taxonomy modules are relevant
   - PP-6 (Delivery Ambition) informs epic ambition — POC-level products scope fewer, lighter epics
   - NFR Profile values inform whether infrastructure/hardening epics are needed
   - QP Profile values inform whether quality-focused epics (observability, testing setup) are warranted
   If profiles section is absent, proceed without profile-informed reasoning (backward compatible).

3. **Extract Strategic Goals** from the product.yaml `strategic_goals` section.

4. **Derive epics** — identify 3–6 epics (maximum 6), each linked to one named Strategic Goal. If fewer than 3 are identifiable, return structured failure: `{ "error": "insufficient_epics", "message": "Fewer than 3 distinct epics identifiable from product.yaml — product definition may need more detail" }`.

5. **Scope each epic** — for each epic, fill ALL fields per `reference/epic-schema.md`:
   - Scoping fields: `bucket`, `priority`, `effort`, `depends_on`, `foundation_investment`
   - IDD fields: `intent` (3 full paragraphs — p1: problem today, p2: outcome after, p3: strategic connection), `constraints` (in_scope, out_of_scope, must_not_break), `success_scenarios` (minimum 2, given/when/then, binary testable), `failure_conditions` (2–4 observable outcomes)
   - Profile-informed depth: when profiles are available, the agent reasons about feature depth using the three-axis model — PP dimensions determine feature applicability, NFR dimensions determine infrastructure requirements, QP dimensions determine quality tooling needs.

6. **Validate against schema (silently)** — run the full validation checklist in `reference/epic-schema.md` before writing. Verify all 14 fields per epic. Correct any violations before proceeding. Do NOT output the validation results — validate internally and fix issues. Only output a structured failure if validation fails after correction.

7. **Validate against intent failure conditions (silently)** — if the agent passes `intent_path`, read the intent file and check the `failure_conditions` list. Verify: epic count >= 3, every epic traces to a strategic goal from product.yaml. If any failure condition is triggered, return structured failure before writing. Do NOT output the validation results — validate internally only.

8. **Write to STM** — write the scoped epics to `{artifact_base}/{slug}/epics.yaml` using the Write tool. Use the YAML structure from `reference/epic-schema.md`. The file must be a valid YAML document — no placeholders, all fields filled.

## Output Schema

This skill has no output schema file — it returns a YAML block directly. The full epics data is written to the STM artifact.

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after. The YAML block below is your entire response:

```yaml
scoped_epics:
  epics_path: "{artifact_base}/{slug}/epics.yaml"
  slug: "{product slug from product.yaml}"
  epic_count: {integer}
```

The full epics data is written to `epics_path`. Downstream skills and agents MUST read from that file — do NOT pass the full epic list through memory.

## Reference

Load epic schema from: `epic_schema_path` (passed by agent from LTM: `~/.meridian/core/memory/standards/templates/epic-schema.md`). Fallback: `reference/epic-schema.md`.

## Constraints

- NEVER create GitHub issues
- NEVER include implementation details — no code, architecture choices, or technical stack decisions
- NEVER include NFR targets unless they generate a distinct sequenceable epic
- NEVER pass full epic data through memory — ALWAYS write to STM and return the path
- NEVER add fields not defined in `reference/epic-schema.md`
- NEVER use `horizon` — use `bucket`; NEVER use `dependencies` — use `depends_on`
- ALWAYS load epic schema from `epic_schema_path` (or fallback `reference/epic-schema.md`) before generating any epics
- ALWAYS validate epics against the full schema checklist (14 fields per epic) before writing
- ALWAYS use F-IDs (F1, F2, F3, ...) for epic IDs — NEVER E-IDs (E1, E2)
- ALWAYS use `strategic_goal_ref` with SG-IDs (SG1, SG2, ...) from product.yaml `strategic_goals[].id` — NEVER use the goal title text as the reference
- ALWAYS write full IDD content (intent, constraints, success_scenarios, failure_conditions) for every epic
- ALWAYS return structured failure if product.yaml is not LOCKED
- ALWAYS return structured failure if fewer than 3 epics are identifiable
- ALWAYS write the epics file to `{artifact_base}/{slug}/epics.yaml` before returning output
- WHEN profiles are available in product.yaml, USE them to inform epic depth, priority, and feature inclusion — do not ignore profile data
- Minimum 3 epics, maximum 6 epics

## Version

| Field | Value |
|-------|-------|
| Version | 2.1.0 |
| Category | strategy |
