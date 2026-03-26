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

Read a locked product.yaml and derive epics linked to Strategic Goals. The number of epics is determined by the vision — each must represent a distinct, deliverable capability. Each epic gets full IDD treatment: intent (3 paragraphs), constraints (in/out/must-not-break), success scenarios (given/when/then), and failure conditions. Plus scoping fields: time bucket, priority, effort, dependencies. Returns a path to the STM artifact.

You DO derive, scope, and fully define the epics. You do NOT create GitHub issues, make implementation decisions, or choose technical approaches.

## Input

Receive from agent:
- `product_yaml_path` — (required) Full path to product.yaml
- `artifact_base` — (required) Base path for STM artifacts, e.g. `.meridian/product/`
- `epic_schema_path` — (required) Path to the epic schema in LTM, e.g. `~/.meridian/core/memory/standards/templates/epic-schema.md`. The agent discovers this from LTM and passes it — the skill does NOT search LTM itself.
- `epic_rules_path` — (required) Path to epic management rules in LTM, e.g. `~/.meridian/core/memory/standards/agent-lifecycle/epic-management-rules.md`. Contains rules for vertical slice delivery, single-module-scope, mock phasing, dependency discipline, etc. The agent discovers this from LTM and passes it.
- `domain_taxonomy_paths` — (required when domain taxonomy exists) List of domain taxonomy module paths from LTM, e.g. `~/.meridian/core/memory/knowledge/domain-taxonomy/*.md`. These define module boundaries used to enforce Rule 2 (single-module-scope). The agent globs `~/.meridian/core/memory/knowledge/domain-taxonomy/` and passes all found paths.
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

1b. **Load epic management rules** — read the file at `epic_rules_path` using the Read tool. This defines rules for epic structure: vertical slice delivery (Rule 1), single-module-scope (Rule 2), mocks as phased delivery (Rule 3), scope boundaries (Rule 4), success verifiability (Rule 5), dependency discipline (Rule 6), foundation investments (Rule 7). All rules MUST be applied during epic derivation and scoping. If `epic_rules_path` is not provided, proceed without rules enforcement (backward compatible) but note the gap in output.

1c. **Load and match domain taxonomy** — read each file in `domain_taxonomy_paths` using the Read tool. Each taxonomy module defines a domain's capabilities, features, and boundaries. After reading all modules, **semantically match** them against the product's profile (PP-7 Industry Vertical, strategic goals, target users, value proposition) to identify which modules are relevant to this product. Irrelevant modules (e.g., `personalization.md` for a B2B invoicing tool) are excluded. Relevant modules define the feature universe and module boundaries for this product — epics draw from these capabilities and each epic must sit within exactly one module (Rule 2). If `domain_taxonomy_paths` is not provided or the list is empty, proceed without module-scope validation (backward compatible) but note the gap in output.

2. **Read product.yaml** at `product_yaml_path` — extract product name, slug, Strategic Goals, assumptions, and user context.

2b. **Read project profiles** — extract the `profiles` section from product.yaml. If profiles are present, use them to inform epic scoping depth:
   - PP-7 (Industry Vertical) determines which domain taxonomy modules are relevant
   - PP-6 (Delivery Ambition) informs epic ambition — POC-level products scope fewer, lighter epics
   - NFR Profile values inform whether infrastructure/hardening epics are needed
   - QP Profile values inform whether quality-focused epics (observability, testing setup) are warranted
   If profiles section is absent, proceed without profile-informed reasoning (backward compatible).

3. **Extract Strategic Goals** from the product.yaml `strategic_goals` section.

4. **Derive epics** — identify epics by combining three inputs:
   - **Strategic goals** from product.yaml — each epic must trace to at least one named SG
   - **Product profile** — PP dimensions (vertical, delivery ambition, persona complexity), NFR dimensions (infrastructure needs), QP dimensions (quality tooling needs) determine what capabilities the product requires
   - **Matched taxonomy modules** (from step 1c) — the relevant domain modules define the available feature universe. Epics should cover capabilities from these modules that serve the strategic goals, not invent capabilities outside the taxonomy.
   
   Each epic must represent a distinct, deliverable capability — not a task and not a bundle of unrelated work. **NEVER target a specific epic count.** The count is a natural outcome of the vision, profile, and taxonomy — it could be 3 or 12 depending on the product's scope. When epic management rules are loaded (step 1b), apply:
   - **Rule 1 (Vertical Slice):** each epic delivers end-to-end testable user value, not a horizontal layer
   - **Rule 2 (Single Module Scope):** each epic is owned by exactly one domain module from the taxonomy (step 1c). If an epic spans multiple modules, split it.
   - **Rule 7 (Foundation Investments):** mark shared infrastructure epics with `foundation_investment: true`, place in `near` bucket with P1 priority

5. **Scope each epic** — for each epic, fill ALL fields per `reference/epic-schema.md`:
   - Scoping fields: `bucket`, `priority`, `effort`, `depends_on`, `foundation_investment`
   - IDD fields: `intent` (3 full paragraphs — p1: problem today, p2: outcome after, p3: strategic connection), `constraints` (in_scope, out_of_scope, must_not_break), `success_scenarios` (minimum 2, given/when/then, binary testable), `failure_conditions` (2–4 observable outcomes)
   - Profile-informed depth: when profiles are available, the agent reasons about feature depth using the three-axis model — PP dimensions determine feature applicability, NFR dimensions determine infrastructure requirements, QP dimensions determine quality tooling needs.
   - When epic rules are loaded, additionally apply: **Rule 3** (mocks introduced must be replaced in a subsequent epic), **Rule 4** (in_scope/out_of_scope/must_not_break are mandatory — name specific scope creep risks), **Rule 5** (success scenarios must be binary testable — no "should" language), **Rule 6** (depends_on uses E-IDs only, no circular dependencies)

6. **Validate against schema (silently)** — run the full validation checklist in `reference/epic-schema.md` before writing. Verify all 14 fields per epic. Correct any violations before proceeding. Do NOT output the validation results — validate internally and fix issues. Only output a structured failure if validation fails after correction.

7. **Validate against intent failure conditions (silently)** — if the agent passes `intent_path`, read the intent file and check the `failure_conditions` list. Verify: epic count >= 3, every epic traces to a strategic goal from product.yaml. If any failure condition is triggered, return structured failure before writing. Do NOT output the validation results — validate internally only.

8. **Write to STM** — write the scoped epics to `{artifact_base}/roadmap/epics.yaml` using the Write tool. Use the YAML structure from `reference/epic-schema.md`. The file must be a valid YAML document — no placeholders, all fields filled.

## Output Schema

This skill has no output schema file — it returns a YAML block directly. The full epics data is written to the STM artifact.

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after. The YAML block below is your entire response:

```yaml
scoped_epics:
  epics_path: "{artifact_base}/roadmap/epics.yaml"
  slug: "{product slug from product.yaml}"
  epic_count: {integer}
```

The full epics data is written to `epics_path`. Downstream skills and agents MUST read from that file — do NOT pass the full epic list through memory.

## Reference

Load epic schema from: `epic_schema_path` (passed by agent from LTM: `~/.meridian/core/memory/standards/templates/epic-schema.md`). Fallback: `reference/epic-schema.md`.

## Constraints

- NEVER target, suggest, or enforce a specific epic count (e.g., "aim for 5-8 epics"). The count is determined by the product's strategic goals, profile, and taxonomy — it is never an input or target
- NEVER create GitHub issues
- NEVER include implementation details — no code, architecture choices, or technical stack decisions
- NEVER include NFR targets unless they generate a distinct sequenceable epic
- NEVER pass full epic data through memory — ALWAYS write to STM and return the path
- NEVER add fields not defined in `reference/epic-schema.md`
- NEVER use `horizon` — use `bucket`; NEVER use `dependencies` — use `depends_on`
- ALWAYS load epic schema from `epic_schema_path` (or fallback `reference/epic-schema.md`) before generating any epics
- ALWAYS validate epics against the full schema checklist (14 fields per epic) before writing
- ALWAYS use E-IDs (E1, E2, E3, ...) for epic IDs — NEVER F-IDs (F1, F2) which are reserved for features.yaml
- ALWAYS populate ltm_citations with the specific LTM file paths that informed each epic's derivation — which taxonomy module defined its domain boundary, which rules shaped its structure, which profile dimensions influenced its scope
- ALWAYS use `strategic_goal_ref` with SG-IDs (SG1, SG2, ...) from product.yaml `strategic_goals[].id` — NEVER use the goal title text as the reference
- ALWAYS write full IDD content (intent, constraints, success_scenarios, failure_conditions) for every epic
- ALWAYS return structured failure if product.yaml is not LOCKED
- ALWAYS write the epics file to `{artifact_base}/roadmap/epics.yaml` before returning output
- WHEN profiles are available in product.yaml, USE them to inform epic depth, priority, and feature inclusion — do not ignore profile data
- WHEN epic_rules_path is provided, APPLY all 7 rules during epic derivation and scoping — do not ignore any rule
- WHEN domain_taxonomy_paths is provided, ENFORCE Rule 2 (single-module-scope) — no epic may span multiple domain modules. If an epic would span modules, split it into separate epics with depends_on links
- WHEN epic_rules_path or domain_taxonomy_paths are NOT provided, note the gap in output notes but do not halt (backward compatible)
- ALWAYS cross-reference each epic's in_scope against product.yaml scope.out_of_scope and any items marked as deferred — no epic may claim a capability that the product vision explicitly excludes or defers. Return structured failure if any violation is detected.
- ALWAYS verify that every item in product.yaml scope.in_scope has at least one epic whose in_scope explicitly claims it — no in_scope capability may be silently absorbed as an implementation detail without explicit ownership. If a capability is cross-cutting, either create a horizontal epic with cross_cutting_justification (per Rule 2 exception) or explicitly assign each fragment to a named epic.
- WHEN a cross-cutting capability from product.yaml scope.in_scope cannot fit single-module-scope, create an epic with cross_cutting_justification per epic-management-rules Rule 2 exception — do not silently drop or fragment the capability without an owning epic

## Version

| Field | Value |
|-------|-------|
| Version | 2.1.0 |
| Category | strategy |
