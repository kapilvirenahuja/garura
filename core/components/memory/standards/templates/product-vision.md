<!-- Template: product-vision.md -->
<!-- Used by: draft-product-vision skill -->
<!-- Source data: market-context.yaml from discover-product-opportunity -->
<!-- Placeholder syntax: {variable} for simple substitution -->
<!-- Rendering: skill reads this template, populates from market context, writes to STM -->

<!-- sync: source={market_context_path} hash=generated generated={date} -->
---
intent: "{intent_description}"
constraints:
  - "Strategic Goals terminology only — OKRs and OKR-specific language are prohibited"
  - "Minimum 3 strategic goals, minimum 2 target user personas"
  - "Status must remain DRAFT until validated and locked"
failure_conditions:
  - "Vision contains OKRs, Objectives, or Key Results terminology"
  - "Fewer than 3 strategic goals defined"
  - "No identifiable target audience"
  - "Vision is overwritten while in LOCKED status"
---

# Product Vision: {product_name}

**Status:** DRAFT
**Created:** {date}
**Last Updated:** {date}
**Phase:** discover-product

---

## Problem Statement

{market_context.problem}

---

## Target Users

<!-- Render one persona subsection per entry in market_context.target_users -->
<!-- Minimum 2 personas required (C7, F1) -->

### Persona {n}: {persona.persona}

| Field | Value |
|-------|-------|
| Role | {persona.role — derive from persona name if not explicit} |
| Primary Goal | {persona.goal} |
| Key Frustration | {persona.frustration} |
| Context of Use | {persona.context} |

---

<!-- Repeat for each persona -->

## Value Proposition

<!-- Synthesize from market_context.differentiators + persona frustrations -->
<!-- 1-2 paragraphs: what the product is, why it matters, core unlock -->

{synthesized_value_proposition}

---

## Strategic Goals

> **Note:** Strategic Goals define what the product aims to achieve. They are directional commitments, not OKR cascades.

<!-- Derive 3-5 strategic goals from market opportunity -->
<!-- Each goal: bold title + descriptive sentence -->
<!-- NEVER use OKR terminology (Objectives, Key Results) -->

1. **{goal_title}:** {goal_description}

2. **{goal_title}:** {goal_description}

3. **{goal_title}:** {goal_description}

<!-- Optional goals 4-5 if market context supports them -->

---

## Success Metrics

<!-- One or more metrics per strategic goal -->
<!-- Each metric must be quantifiable with a measurement method -->

| Strategic Goal | Metric | Target | Measurement Method |
|----------------|--------|--------|--------------------|
| {goal_title} | {metric_name} | {quantifiable_target} | {how_measured} |

---

## Competitive Landscape

<!-- One row per competitor from market_context.competitors -->
<!-- "Our Advantage" column: derive from market_context.differentiators vs competitor weaknesses -->

| Competitor | Key Strengths | Key Weaknesses | Our Advantage |
|------------|--------------|----------------|---------------|
| {competitor.name} | {competitor.strengths — comma-separated} | {competitor.weaknesses — comma-separated} | {derived_advantage} |

---

## Assumptions

<!-- Reframe market_context.risks as assumptions that must hold true -->
<!-- Also add strategic assumptions about market, partners, regulation -->

1. {assumption}

---

## Out of Scope

<!-- Derive from problem boundaries — what the product explicitly does NOT do -->
<!-- Format: bold category + explanation -->

- **{category}:** {explanation}

---

*Storage path: `{artifact_path}`*
