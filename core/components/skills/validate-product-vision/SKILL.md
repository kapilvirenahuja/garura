---
name: validate-product-vision
description: Validate a product.yaml artifact for completeness and readiness to lock
user-invocable: false
model: sonnet
allowed-tools: Read
---

# validate-product-vision

Model-invocable skill for validating product.yaml artifacts.

## Purpose

Read and evaluate a product.yaml artifact against completeness criteria. Returns a structured validation_result. Does NOT modify the product artifact.

You DO the validation. You do NOT modify the artifact or decide what happens next.

## Output Schema

Returns structured data (not a file). The `validation_result` object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ready_for_lock` | boolean | yes | true only if completeness_score ≥ 70 AND no blocker-severity issues |
| `completeness_score` | integer (0–100) | yes | Weighted score based on checklist pass/fail and content quality |
| `issues` | list | yes | Each issue: `message` (string), `field` (YAML field name), `severity` (blocker/warning/suggestion) |
| `checklist.strategic_goals_defined` | boolean | yes | ≥3 strategic_goals with non-empty title and description |
| `checklist.target_users_identified` | boolean | yes | ≥2 target_users with non-empty persona, goal, frustration |
| `checklist.success_metrics_measurable` | boolean | yes | success_metrics entries have quantifiable target values |
| `checklist.competitive_landscape_covered` | boolean | yes | ≥2 competitors with name, strength, weakness |
| `checklist.assumptions_listed` | boolean | yes | ≥3 non-empty assumptions entries |

## Input

Receive from agent:
- `product_yaml_path` — (required) Full path to product.yaml

## Process

1. **Read artifact:** Read `product_yaml_path`. If not found, return structured failure: artifact not found.

2. **Check status:** If status is LOCKED, return structured failure: "product.yaml is already LOCKED — no validation needed."

3. **Evaluate completeness checklist** by inspecting YAML fields directly:

   **Read `type` field from product.yaml. Default to "product" if absent.**

   **When type = "product" (existing behavior, unchanged):**
   - `strategic_goals_defined`: `strategic_goals` list has ≥3 entries, each with non-empty `title` and `description`
   - `target_users_identified`: `target_users` list has ≥2 entries, each with non-empty `persona`, `goal`, and `frustration`
   - `success_metrics_measurable`: `success_metrics` list has entries with `target` values that are quantifiable (numbers, percentages, or concrete observable outcomes) — not vague phrases like "improve user satisfaction"
   - `competitive_landscape_covered`: `competitors` list has ≥2 entries, each with non-empty `name`, at least one `strength`, and at least one `weakness`
   - `assumptions_listed`: `assumptions` list has ≥3 non-empty entries

   **When type = "library":**
   - `strategic_goals_defined`: `strategic_goals` list has ≥3 entries, each with non-empty `title` and `description` (SAME threshold — load-bearing)
   - `target_users_identified`: NOT EVALUATED (omit from checklist entirely)
   - `success_metrics_measurable`: `success_metrics` list has entries with `target` values that are quantifiable (numbers, percentages, or concrete observable outcomes) — not vague phrases like "improve user satisfaction" (SAME)
   - `competitive_landscape_covered`: NOT EVALUATED (omit from checklist entirely)
   - `assumptions_listed`: `assumptions` list has ≥1 non-empty entry (lowered threshold)

4. **Evaluate content quality** for key YAML fields:
   - `problem`: non-empty string, identifies a real user problem (not a solution description)
   - `value_proposition`: non-empty, includes language that differentiates from competitors
   - `out_of_scope`: list has ≥1 entry with `category` and `rationale` — explicitly bounds what is NOT built

5. **Compute completeness_score:** Weighted score (0–100) based on checklist pass/fail + content quality.

6. **Classify issues:** `blocker` (fails a mandatory checklist item), `warning` (sparse field), `suggestion` (improvement opportunity).

7. **Determine ready_for_lock:** true only if completeness_score ≥ 70 AND no blocker-severity issues.

## Output

```yaml
validation_result:
  ready_for_lock: true|false
  completeness_score: 0-100
  issues:
    - message: "{description of issue}"
      field: "{YAML field name}"
      severity: "blocker|warning|suggestion"
  checklist:
    strategic_goals_defined: true|false
    target_users_identified: true|false
    success_metrics_measurable: true|false
    competitive_landscape_covered: true|false
    assumptions_listed: true|false
```

For type="library", the checklist contains only 3 items (strategic_goals_defined, success_metrics_measurable, assumptions_listed). Omitted items are absent from the output, not reported as false.

Completeness scoring: each active checklist item has equal weight. Library: 3 items at ~33% each. Product: 5 items at ~20% each.

**IMPORTANT**: This skill produces validation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER modify the product.yaml artifact — read-only
- NEVER approve lock (ready_for_lock: true) when blocker-severity issues exist
- ALWAYS return all checklist fields (false if field is absent, empty list, or empty string)
- ALWAYS reference YAML field names in `issues[].field` — not section names from a markdown document
- ALWAYS read type field from product.yaml before evaluating checklist
- NEVER evaluate target_users_identified or competitive_landscape_covered when type is "library"
- ALWAYS keep strategic_goals_defined threshold at ≥3 regardless of type

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | analysis |
