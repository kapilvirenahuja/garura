---
name: draft-product-vision
description: Create a product vision document with Strategic Goals from market context
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-product-vision

Model-invocable skill for creating product vision documents.

## Purpose

Synthesize market context into a structured vision.md artifact. Writes the vision document to the project STM. Strategic Goals section REPLACES OKRs — it captures what the product aims to achieve, not OKR cascades.

You DO create the vision document. You do NOT validate it or decide what happens next.

## Input

Receive from agent:
- `market_context` — (required) Structured output from discover-product-opportunity
- `product_name` — (optional) Slug derived from problem_statement if not provided
- `artifact_base` — (required) Base path, e.g., `.meridian/project/product/`

## Process

1. **Derive slug:** If `product_name` provided, slugify it (lowercase, hyphens). Else derive from first 3-4 significant words of `market_context.problem`.

2. **Determine artifact path:** `{artifact_base}{slug}/vision.md`

3. **Check for existing vision:** Read path. If LOCKED, return structured failure: "Vision is LOCKED — drop to DRAFT first." If DRAFT exists, overwrite (user re-triggered DRAFT).

4. **Compose vision document:** Load template from LTM at `standards/templates/product-vision.md`. Populate each section from `market_context`:
   - Problem Statement: from `market_context.problem`
   - Target Users: from `market_context.target_users` (render as persona cards)
   - Value Proposition: synthesize from differentiators and user frustrations
   - Strategic Goals: derive 3-5 strategic goals from market opportunity (NEVER OKRs)
   - Success Metrics: derive measurable indicators for each Strategic Goal
   - Competitive Landscape: from `market_context.competitors`
   - Assumptions: from `market_context.risks` (reframe as assumptions)
   - Out of Scope: derive from problem boundaries

5. **Write artifact:** Write vision.md with Status: DRAFT in the IDD intent header.

6. **Return output.**

## Output

```yaml
vision:
  path: "{full path to vision.md}"
  slug: "{derived slug}"
  sections:
    - problem_statement
    - target_users
    - value_proposition
    - strategic_goals
    - success_metrics
    - competitive_landscape
    - assumptions
    - out_of_scope
  status: "DRAFT"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load template from LTM: `standards/templates/product-vision.md`
The template defines the exact section structure, placeholder syntax, and rendering rules. Follow it precisely — the output must match the template structure.

## Constraints

- NEVER use OKRs, OKR cascades, or objective/key-result terminology
- NEVER overwrite a LOCKED vision — return structured failure
- ALWAYS set Status: DRAFT in the written artifact
- ALWAYS include the IDD intent header at the top of the written document
- ALWAYS include all 8 sections (may be sparse but must be present)

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
