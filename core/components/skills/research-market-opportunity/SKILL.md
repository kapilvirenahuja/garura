---
name: research-market-opportunity
description: Parse a product idea, query web and LTM for market context, produce a quantified market brief with TAM/SAM/SOM, competitive landscape, market gaps, and risks. Fresh skill built in 214.5; not the deleted discover-product-opportunity.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# research-market-opportunity

Model-invocable skill for producing a market brief from a free-text product idea. Called by the `market-analyst` agent during `specify` Stage 1.

## Purpose

Answer four questions, each with quantified data and cited sources:
1. **Who is the market?** (industry, segment, geographic scope)
2. **How big is it?** (TAM / SAM / SOM with growth rate)
3. **Who competes today?** (named competitors with positioning and scale)
4. **What are the gaps?** (market needs unaddressed by existing solutions)

Produce a `market-brief.md` at the target path. Every claim cites a source. Unsourced claims are marked "insufficient data" — no fabrication.

## Input

Receive from the market-analyst agent:
- `product_idea` (string, required) — free-text description, minimum 5 meaningful words
- `industry_hint` (string, optional) — e.g., "healthcare", "BFSI", "SaaS"
- `project_profile_path` (path, optional) — to read geographic scope, audience, timeline
- `ltm_domain_taxonomy_path` (path, required) — typically `core/components/memory/knowledge/domain/`
- `output_path` (string, required) — target file path under `.garura/product/specification/market-brief.md`

## Process

1. **Parse the product idea.** Extract product type, user type, core problem. If parsing fails (idea is too vague), return structured failure with `what_failed: parse`.

2. **Load LTM context.** Read the domain-taxonomy markdown files whose `Search patterns` line matches the parsed product. Pull `When It Matters`, `Signals`, and `Tradeoffs` prose for 2-4 most-relevant features. This grounds the brief in existing catalog knowledge.

3. **Query web for market size.** Use WebSearch with queries: `"{industry} TAM {current year}"`, `"{product category} market size"`, `"{product category} CAGR"`. Capture URLs and numeric claims. If at least two independent sources agree within 2x, use their range. If none or only one, mark as "single source — verify".

4. **Query web for competitive landscape.** Use WebSearch with `"{product category} competitors"`, `"alternatives to {nearest known competitor}"`, `"{industry} {product type} vendors"`. For each competitor surfaced, attempt to find: positioning statement, revenue estimate (if public), customer count (if public), key differentiation. Record each with a source URL.

5. **Identify market gaps.** Compare competitor feature descriptions against the product idea. Note unmet needs, pricing gaps, integration gaps, UX gaps. Each gap must be traceable to either a competitor's published limitations or a domain-taxonomy Tradeoffs note.

6. **Enumerate risks.** From the LTM domain-taxonomy Signals sections and project profile, identify:
   - Regulatory risks (specific regulation names — GDPR, HIPAA, PCI-DSS, etc.)
   - Market timing risks (adjacent technology shifts, macro trends)
   - Technology risks (dependencies, platform lock-in, vendor risk)

7. **Compose the brief.** Write to `{output_path}` using this structure:

   ```markdown
   # Market Brief — {product slug or name}

   ## Snapshot
   - Product idea: <one-sentence restatement>
   - Industry: <vertical>
   - Geographic scope: <from project profile or idea>
   - Brief generated: <ISO-8601 timestamp>

   ## Market Size
   - TAM: <value> (source: <url>)
   - SAM: <value> (source: <url>)
   - SOM: <value>  (source: <url>)  # realistic for the first appetite
   - Growth rate: <CAGR>% over <horizon> (source: <url>)

   ## Competitive Landscape
   | Competitor | Positioning | Revenue (est) | Customers (est) | Differentiation |
   | ... | ... | ... | ... | ... |

   ## Market Gaps
   - <gap 1>
   - <gap 2>

   ## Risks
   - Regulatory: <specific regulation + impact>
   - Market timing: <trend + impact>
   - Technology: <dependency + impact>

   ## Sources
   - <url 1>
   - <url 2>
   ```

8. **Return the output contract** with `market_brief_path`, `feature_count_referenced` (from LTM), `source_count`, `source_credibility_summary` (how many independent sources per quantified claim).

## Output

```yaml
market_brief:
  path: <written path>
  source_count: <int>
  tam_sources: <int>      # number of independent sources for TAM
  sam_sources: <int>
  som_sources: <int>
  competitor_count: <int>
  gaps_identified: <int>
  risks_identified: <int>
  insufficient_data_markers: <int>  # fields marked "insufficient data"
```

## Constraints

- NEVER fabricate TAM/SAM/SOM numbers. If web search yields zero credible sources for a field, write `insufficient data — requires primary research` and increment the `insufficient_data_markers` counter.
- NEVER invent competitor names. Every row in the competitive landscape table must trace to at least one source URL.
- NEVER invent LTM feature references. If the domain-taxonomy query returns zero matches, skip the LTM-grounding section rather than hallucinating.
- NEVER write outside `{output_path}`. The whitelist enforcement happens at write time.
- ALWAYS cite sources. Every quantified claim carries a URL or an explicit "insufficient data" marker.
- ALWAYS structure the brief per the template. Downstream stages parse this file; free-form prose breaks them.
- ALWAYS pass results back via the output contract. Do not print the brief to the caller's response.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-04-14 |
| Related | `core/components/agents/market-analyst.md`, `core/components/plays/specify/` |
