---
name: synthesize-personas
description: Read the locked intent epics from specify output and extract JTBD personas with capability mapping. Every persona uses the format "When [situation], I want to [motivation], so I can [outcome]" — demographic-driven personas are rejected.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# synthesize-personas

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `designer` during `design` Stage 1. Produces `personas.md` with JTBD persona profiles and capability mapping.

## Purpose

Extract user types from the intent epics' `expectation.success_scenarios` and `failure_conditions`/`expectation.recovery`, distill them into JTBD personas, and map each persona to the capabilities they interact with. The output is not a marketing artifact — it's a design input that tells the designer which journeys to map and which screens to build.

## Input

Receive from the designer agent. All paths resolve against `{product_base}` supplied by the play via the JSON contract — do not hard-code `.garura/product/` or assume a working directory.

- `epics_dir` (path, required) — typically `{product_base}scope/epics/`
- `scope_path` (path, required) — typically `{product_base}scope/scope.yaml`
- `mvp_recommendation_path` (path, required) — `{product_base}scope/mvp-recommendation.md` (per rules/product.md Rule 13 MVP Focus / design C15). This skill reads the `Primary Focus` section to extract primary use cases and authors one persona per primary use case. Capabilities that serve only deferred use cases do NOT get a persona, and downstream stages inherit the narrowing via the personas.md output. Missing or empty file returns structured failure `{what_failed: missing_mvp_recommendation}` — the play's pre-flight should have caught this but the skill re-checks defensively.
- `product_research_path` (path, required) — `{product_base}research/` (the product's frozen domain library per rules/product.md Rule 15 Pull-to-Product). This skill reads domain user-type hints from the product's research folder ONLY — never directly from `core/components/memory/knowledge/domain/`. Passing `ltm_domain_taxonomy_path` is a structural failure (design intent.yaml F13).
- `personas_path` (string, required) — typically `{product_base}experience/personas.md`
- `decision_manifest_path` (path, required) — path for the `decision-manifest.yaml` output, written alongside the primary artifact (e.g., `{product_base}experience/decision-manifest-synthesize-personas.yaml`). Exact path is passed by the calling agent.

## Process

### 1. Load inputs

Resolve each input path by substituting `{product_base}` from the incoming JSON contract; do not re-prefix with `.garura/product/` or assume a working directory.

- Glob `{epics_dir}/*.yaml` and load each intent epic.
- Load `scope.yaml` for the selected capability list.

### 2. Extract user-type candidates

Walk every epic's `expectation.success_scenarios` and `failure_conditions` (plus `expectation.recovery`). Each scenario entry contains a description that implicitly references a user role (explicit or implicit: "the user", "an admin", "the compliance officer", "a new signup"). Build a set of candidate user types.

Deduplicate based on functional role, not demographic overlap. "End user in B2C context" and "consumer shopper" collapse to one persona if they describe the same functional role.

### 3. For each persona candidate, synthesize JTBD

For every deduplicated user type, write a persona record:

```markdown
## Persona: {persona-name}

### Job Story (primary)
When I <situation from epic scenarios>,
I want to <motivation from intent epic's `intents[0]` entry>,
so I can <outcome from expectation.success_scenarios[0].then>.

### Additional Job Stories
- When <situation 2>, I want to <motivation 2>, so I can <outcome 2>.
- When <situation 3>, I want to <motivation 3>, so I can <outcome 3>.

### Capabilities Mapped
- {capability ID 1}: {role this persona plays — e.g., primary actor, secondary beneficiary}
- {capability ID 2}: ...

### Edge Cases This Persona Hits
- {failure scenario from an epic where this persona is the impacted party}
- {another failure scenario}
```

**JTBD format rules:**
- Every persona has at least one job story in the `When [situation], I want to [motivation], so I can [outcome]` format.
- No demographic fields (age, income, geography, education).
- No name-as-avatar ("Sarah, 34, marketing manager").
- Persona name is a functional role (`end-user`, `admin`, `compliance-officer`, `new-signup`, `power-user`).

### 3b. Emit decision manifest

Before composing personas.md, write `decision-manifest.yaml` to `{decision_manifest_path}`.

Record every inferred decision produced during Steps 2 and 3. Assign tier at runtime based on grounding source: **high** when the decision was a direct match against a KB rule, file, or catalog entry; **mid** when context was built via web research; **low** when neither KB nor research yielded a grounding source.

**Decisions to record** (decision_id prefix: `D-sp-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-sp-001` | `user-type-extraction-dedup` | Which candidate user-type roles are extracted from epic scenarios, and how functionally overlapping roles are collapsed to one persona (Step 2) |
| `D-sp-002` | `jtbd-synthesis` | For each persona, which situation, motivation, and outcome are selected from the epic scenarios and intent field for the primary job story (Step 3) |
| `D-sp-003` | `persona-name-selection` | The functional role name chosen for each persona (e.g., `end-user`, `admin`, `compliance-officer`) (Step 3) |

```yaml
schema_version: "1.0"
skill: "synthesize-personas"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-sp-001"
    decision_type: "user-type-extraction-dedup"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the deduplicated set of user types extracted}"
    alternatives_considered:
      - alt: "{alternative grouping or role}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision listed above
```

### 4. Compose personas.md

Structure:

```markdown
# Personas — {product slug}

Generated by design Stage 1 on {timestamp}.
Source: {epics_dir} (N epics)

## Persona: end-user
...

## Persona: admin
...

## Capability → Persona Map
| Capability | Primary Persona | Secondary Persona(s) |
| UM-F001 | end-user | admin |
| CM-F003 | end-user | compliance-officer |
```

### 5. Return output contract

```yaml
personas:
  path: <written path>
  persona_count: <int>
  capabilities_mapped: <int>
  capabilities_unmapped: <int>  # must be 0 — any >0 is a structured failure
  jtbd_format_violations: <int>  # must be 0
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Constraints

- NEVER produce demographic personas. JTBD format only.
- NEVER leave a scope capability unmapped. Every capability in `scope.selected_capabilities` must appear in the `Capability → Persona Map` table with at least one persona.
- NEVER invent capabilities not in the scope. Personas map only to scope entries.
- NEVER add persona names like "Sarah, 34, marketing manager". Persona names are functional roles.
- ALWAYS draw job stories from real epic scenarios — never fabricate.
- ALWAYS include the full JTBD structure: situation, motivation, outcome.
- NEVER commit an inferred decision to the primary artifact (personas.md) without recording it in `decision-manifest.yaml` first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.
- ALWAYS include `alternatives_considered` (≥1 entry) for every decision, even high-confidence ones.

## Version

| Field | Value |
|-------|-------|
| Version | 0.2.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/agents/designer.md`, `core/components/skills/generate-screen-inventory` |
