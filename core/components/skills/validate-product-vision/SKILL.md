---
name: validate-product-vision
description: Validate a product vision document for completeness and readiness to lock
user-invocable: false
model: sonnet
allowed-tools: Read
---

# validate-product-vision

Model-invocable skill for validating product vision documents.

## Purpose

Read and evaluate a vision.md artifact against completeness criteria. Returns a structured validation_result. Does NOT modify the vision artifact.

You DO the validation. You do NOT modify the artifact or decide what happens next.

## Input

Receive from agent:
- `vision_path` — (required) Full path to vision.md

## Process

1. **Read artifact:** Read `vision_path`. If not found, return structured failure: artifact not found.

2. **Check status:** If status is LOCKED, return structured failure: "Vision is already LOCKED — no validation needed."

3. **Evaluate completeness checklist:**
   - `strategic_goals_defined`: Strategic Goals section has ≥3 goals, each clearly stated
   - `target_users_identified`: Target Users section has ≥2 personas with role, goal, frustration
   - `success_metrics_measurable`: Success Metrics section has quantifiable indicators (numbers, percentages, or concrete observable outcomes) — not vague phrases like "improve user satisfaction"
   - `competitive_landscape_covered`: Competitive Landscape has ≥2 named competitors with strengths/weaknesses
   - `assumptions_listed`: Assumptions section has ≥3 items

4. **Evaluate each section for content quality:**
   - Problem Statement: non-empty, identifies a real user problem (not a solution description)
   - Value Proposition: differentiates from competitors
   - Out of Scope: explicitly bounds what is NOT built

5. **Compute completeness_score:** Weighted score (0–100) based on checklist pass/fail + content quality.

6. **Classify issues:** `blocker` (fails a mandatory checklist item), `warning` (sparse section), `suggestion` (improvement opportunity).

7. **Determine ready_for_lock:** true only if completeness_score ≥ 70 AND no blocker-severity issues.

## Output

```yaml
validation_result:
  ready_for_lock: true|false
  completeness_score: 0-100
  issues:
    - message: "{description of issue}"
      field: "{section name}"
      severity: "blocker|warning|suggestion"
  checklist:
    strategic_goals_defined: true|false
    target_users_identified: true|false
    success_metrics_measurable: true|false
    competitive_landscape_covered: true|false
    assumptions_listed: true|false
```

**IMPORTANT**: This skill produces validation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER modify the vision artifact — read-only
- NEVER approve lock (ready_for_lock: true) when blocker-severity issues exist
- ALWAYS return all checklist fields (false if section absent or empty)

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
