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

5. **Write artifact:** Write product.yaml with `status: "DRAFT"` to `{artifact_base}{slug}/product.yaml`.

6. **Return output.**

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
  status: "DRAFT"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER use OKRs, OKR cascades, or objective/key-result terminology
- NEVER overwrite a LOCKED product.yaml — return structured failure
- ALWAYS set status: "DRAFT" in the written artifact
- ALWAYS include all fields defined in the product.yaml schema (may be null but must be present)
- ALWAYS write valid YAML — use block scalars (`|`) for multi-line string fields (value_proposition)
- ALWAYS use field names exactly matching the schema: slug, status, created_at, updated_at, problem, target_users, competitors, market_size, differentiators, risks, value_proposition, strategic_goals, success_metrics, assumptions, out_of_scope

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | analysis |
