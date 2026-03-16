---
name: discover-product-opportunity
description: Parse a product problem or idea and extract market context — users, competitors, market size, differentiators, risks
user-invocable: false
model: sonnet
allowed-tools: Read
---

# discover-product-opportunity

Model-invocable skill for extracting structured market context from a free-text problem statement.

## Purpose

Extract structured market context from a free-text problem statement or product idea. The calling agent receives market_context and decides what to do next.

You DO the market analysis. You do NOT create documents or files — you return structured data only.

## Output Schema

Returns structured data (not a file). The `market_context` object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `problem` | string | yes | Refined one-sentence problem statement |
| `target_users` | list | yes | ≥2 user personas; each has `persona`, `goal`, `frustration`, `context` |
| `competitors` | list | yes | Direct and indirect competitors; each has `name`, `strengths[]`, `weaknesses[]` |
| `market_size` | object | yes | `tam`, `sam`, `som` (string or null), `note` |
| `differentiators` | list | yes | 2–4 potential product differentiators |
| `risks` | list | yes | 3–5 market-level risks |

## Input

Receive from agent:
- `problem_statement` — (required) User's problem or idea description
- `market_hints` — (optional) Enrichment context:
  - `industry` — e.g., "B2B SaaS", "retail", "healthcare"
  - `geography` — e.g., "North America", "APAC"
  - `target_segment` — e.g., "SMB", "enterprise", "consumer"

## Process

1. **Parse Problem:** Read `problem_statement`. Identify the core problem being solved vs. the product being built. Restate in one sentence: "Users who {situation} need {outcome} because {reason}."

2. **Derive Target Users:** Identify 2–3 distinct user personas from the problem statement. For each: role/title, primary goal, key frustration, context of use.

3. **Map Competitors:** Identify direct and indirect competitors based on the problem domain. For each: name, key strengths (what they do well), key weaknesses (gaps the proposed product could exploit). If no competitors are identifiable, return an empty list with a note.

4. **Estimate Market Size:** Derive TAM/SAM/SOM if the problem domain is well-known. If not derivable from available context, return `market_size: null` with `note: "Market size estimate requires domain-specific research"`.

5. **Identify Differentiators:** What could make this product uniquely valuable? List 2–4 potential differentiators based on competitor gaps and user frustrations.

6. **Assess Market Risks:** List 3–5 market-level risks (e.g., market saturation, regulatory constraints, incumbent lock-in, technology dependency).

## Output

Return structured YAML:

```yaml
market_context:
  problem: "{refined one-sentence problem statement}"
  target_users:
    - persona: "{name/role}"
      goal: "{primary goal}"
      frustration: "{key pain}"
      context: "{when/where they use this}"
  competitors:
    - name: "{competitor name}"
      strengths: ["{strength 1}", "{strength 2}"]
      weaknesses: ["{weakness 1}", "{weakness 2}"]
  market_size:
    tam: "{estimate or null}"
    sam: "{estimate or null}"
    som: "{estimate or null}"
    note: "{derivation note or 'requires research'}"
  differentiators:
    - "{differentiator 1}"
    - "{differentiator 2}"
  risks:
    - "{market risk 1}"
    - "{market risk 2}"
```

**IMPORTANT**: This skill produces structured data. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER write files — returns structured data only
- NEVER guess at market data — if unknown, use null with a note
- NEVER include OKRs, KPIs, or roadmap content — this is market analysis only
- ALWAYS include at least 2 target user personas
- ALWAYS return structured failure if problem_statement is too vague (fewer than 10 meaningful words after stop-word removal)

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
