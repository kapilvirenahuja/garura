---
name: draft-product-vision
description: Create a consolidated product.yaml from market context and vision synthesis
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-product-vision

Model-invocable skill for creating the product.yaml artifact.

## Purpose

Synthesize market context into a structured product.yaml artifact. Writes the consolidated product artifact to the project STM. This is the root artifact — it contains both market context data and vision data in one file. Strategic Goals section REPLACES OKRs — it captures what the product aims to achieve, not OKR cascades.

You DO create the product.yaml document. You do NOT validate it or decide what happens next.

## Output Schema

The output MUST conform to `schemas/product.yaml` in this skill's directory. Read the schema before producing output. Every field defined in the schema must be present in the output YAML. The schema is the contract — if it's in the schema, it's in the output.

## Input

Receive from agent:
- `market_context` — (required) Structured output from discover-product-opportunity
- `product_name` — (optional) Slug derived from problem_statement if not provided
- `artifact_base` — (required) Base path, e.g., `.meridian/project/product/`
- `domain` — (optional) Confirmed domain context (e.g., "B2B SaaS", "retail") — use to sharpen vision language and strategic goals when present
- `raw_intent` — (conditional) The original intent text, provided when market_context is absent (opportunity discovery skipped per C12). One of market_context or raw_intent must be present.
- `product_type` — (optional) "product" or "library". Default: "product". Determines the type field written to product.yaml.
- `profile_knowledge_path` — (optional) Path to LTM project-profiling directory (e.g., `~/.meridian/core/memory/knowledge/project-profiling/`). When provided, the skill reads profile dimension definitions and guidance tables to derive profiles.

## Process

1. **Derive slug:** If `product_name` provided, slugify it (lowercase, hyphens). Else derive from first 3-4 significant words of `market_context.problem`.

2. **Determine artifact path:** `{artifact_base}{slug}/product.yaml`

3. **Check for existing product.yaml:** Read path. If LOCKED, return structured failure: "product.yaml is LOCKED — drop to DRAFT first." If DRAFT exists, overwrite (user re-triggered DRAFT).

4. **Compose product.yaml:** Populate all fields from `market_context` and synthesized vision content:
   - `slug`: derived slug
   - `status`: "DRAFT"
   - `created_at`: current ISO-8601 timestamp
   - `updated_at`: current ISO-8601 timestamp
   - `problem`: from `market_context.problem`
   - `target_users`: from `market_context.target_users` — each entry as `{id, persona, goal, frustration, context}`
   - `competitors`: from `market_context.competitors` — each entry as `{name, strengths, weaknesses, our_advantage}`
   - `market_size`: from `market_context.market_size` as `{tam, sam, som, note}`
   - `differentiators`: from `market_context.differentiators` as list
   - `risks`: from `market_context.risks` as list (market risks)
   - `value_proposition`: synthesize 1-2 paragraphs from differentiators and user frustrations
   - `strategic_goals`: derive 3-5 goals from market opportunity — each as `{id, title, description, metric, target, measurement}` (NEVER OKRs)
   - `success_metrics`: derive measurable indicators for each Strategic Goal — each as `{strategic_goal_ref, metric, target, measurement_method}`
   - `assumptions`: from `market_context.risks` reframed as assumptions (what must be true for the product to succeed)
   - `out_of_scope`: derive from problem boundaries — each as `{category, rationale}`

**When raw_intent is provided (type=library, opportunity skipped):**
- `problem`: Derive from raw_intent — restate as "Developers/teams who {situation} need {outcome} because {reason}"
- `target_users`: Derive consumers from intent if mentioned. May be empty list.
- `competitors`: Empty list. Do NOT fabricate competitors.
- `market_size`: null
- `differentiators`: Extract technical differentiators from intent if present. May be empty.
- `risks`: Extract technical risks (adoption risk, maintenance burden, API stability).
- `value_proposition`: Synthesize from intent — what makes this library worth building as a shared component.
- `strategic_goals`: Derive 3-5 goals from intent. Goals focus on adoption, API quality, developer experience.
- `success_metrics`: Derive from strategic goals.
- `assumptions`: Derive from intent.
- `out_of_scope`: Derive from intent boundaries.
- Set `type: "library"`

5. **Derive project profiles (Three-Axis Model):**

   Read profile dimension definitions from `profile_knowledge_path` (if provided) or from LTM at `~/.meridian/core/memory/knowledge/project-profiling/`. The cascade is sequential: PP → NFR → QP.

   **5a. Product Profile (PP-1 through PP-7):**
   Read `product-profile.md`. For each dimension, derive a level (1-5) from the BRD/intent/market context:
   - PP-1 (User Sophistication): from `target_users` personas and their technical ability
   - PP-2 (UX Maturity): from intent's UX ambition and channel requirements
   - PP-3 (Persona Complexity): from `target_users` count and role diversity
   - PP-4 (Geographic Scope): from market context geography signals
   - PP-5 (Integration Density): from integration mentions in intent/market context
   - PP-6 (Delivery Ambition): from explicit scope signals (MVP, enterprise, POC)
   - PP-7 (Industry Vertical): from `domain` or industry signals in intent

   For each dimension, include a `rationale` string explaining why this level was chosen.

   **5b. NFR Profile (NFR-1 through NFR-7):**
   Read `nfr-profile.md` and the NFR Guidance section in `product-profile.md`. Set initial NFR defaults from the PP values per the guidance table (e.g., PP-7 >= 4 → NFR-5 >= 3). Then refine based on explicit NFR signals in the BRD/intent (e.g., "99.99% uptime" → NFR-4 = 4). Include rationale per dimension.

   **5c. Quality Profile (QP-1 through QP-7):**
   Read `quality-profile.md` and its PP+NFR Guidance section. Set initial QP defaults from the PP and NFR values per the guidance table (e.g., PP-6 >= 3 → QP-1 >= 3, NFR-2 >= 4 → QP-7 >= 4). Then refine based on explicit quality signals in the BRD/intent (e.g., "WCAG AA compliance" → QP-6 = 3). Include rationale per dimension.

   **5d. Write profiles to product.yaml `profiles` section** following the schema.

   **When type is "library":** Profiles are still derived but may have lower defaults. PP-6 drives the cascade — a library at PP-6 = 1 (POC) defaults all NFR and QP to 1.

6. **Write artifact:** Write product.yaml with `status: "DRAFT"` to `{artifact_base}{slug}/product.yaml`.

7. **Return output.**

## Output

```yaml
product:
  path: "{full path to product.yaml}"
  slug: "{derived slug}"
  fields:
    - problem
    - target_users
    - competitors
    - market_size
    - differentiators
    - risks
    - value_proposition
    - strategic_goals
    - success_metrics
    - assumptions
    - out_of_scope
    - profiles
  profiles_derived: true
  status: "DRAFT"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER use OKRs, OKR cascades, or objective/key-result terminology
- NEVER overwrite a LOCKED product.yaml — return structured failure
- ALWAYS set status: "DRAFT" in the written artifact
- ALWAYS include all fields defined in the product.yaml schema (may be null but must be present)
- ALWAYS write valid YAML — use block scalars (`|`) for multi-line string fields (value_proposition)
- ALWAYS use field names exactly matching the schema: slug, status, created_at, updated_at, problem, target_users, competitors, market_size, differentiators, risks, value_proposition, strategic_goals, success_metrics, assumptions, out_of_scope, profiles
- NEVER fabricate market data when type is "library" — empty fields are correct
- ALWAYS set the `type` field based on input signal (market_context present = "product", raw_intent only = "library")
- ALWAYS produce >=3 strategic goals regardless of type (load-bearing for downstream)
- ALWAYS derive all three profiles (PP, NFR, QP) in sequential cascade order
- ALWAYS include rationale for each profile dimension level
- ALWAYS read profile dimension definitions from LTM before deriving — do not invent dimensions
- NEVER present profiles as a cold questionnaire — derive from BRD/intent, then present as knobs for user validation
- NEVER reinterpret a source document deferral as in-scope — if the BRD/PRD/intent explicitly defers, excludes, or marks a capability as out-of-scope for the current phase, it MUST appear in product.yaml scope.out_of_scope, not scope.in_scope
- NEVER silently override an explicit source document requirement with risk-based, UX-based, or strategic reasoning — when the agent's reasoning conflicts with the source (e.g., changing "auto-recording" to "optional recording"), record a decision_point in product.yaml with original_requirement, proposed_alternative, and rationale for user resolution at the brief checkpoint
- ALWAYS preserve source document scope decisions with fidelity — capabilities the source explicitly includes go in in_scope, capabilities it explicitly defers go in out_of_scope, ambiguous capabilities are surfaced as decision_points

## Version

| Field | Value |
|-------|-------|
| Version | 3.0.0 |
| Category | analysis |
