---
name: validate-roadmap
description: Validate a roadmap.yaml artifact for structural completeness and readiness to lock
user-invocable: false
model: sonnet
allowed-tools: Read
---

# validate-roadmap

Model-invocable skill for validating roadmap.yaml artifacts.

## Purpose

Read and evaluate a roadmap.yaml artifact against completeness criteria. Returns a structured validation_result. Does NOT modify the roadmap artifact.

You DO the validation. You do NOT modify the artifact or decide what happens next.

## Output Schema

Returns structured data (not a file). The `validation_result` object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ready_for_lock` | boolean | yes | true only if completeness_score >= 70 AND no blocker-severity issues |
| `completeness_score` | integer (0-100) | yes | Weighted score based on checklist pass/fail |
| `issues` | list | yes | Each issue: `message` (string), `field` (YAML field name), `severity` (blocker/warning/suggestion) |
| `checklist.thesis_defined` | boolean | yes | Non-empty `thesis` string present |
| `checklist.narrative_sufficient` | boolean | yes | `narrative` has >= 3 paragraphs (separated by blank lines or newlines) |
| `checklist.timeline_populated` | boolean | yes | >= 1 horizon in `timeline` with non-empty `epic_refs` list |
| `checklist.feasibility_entries_present` | boolean | yes | >= 1 entry in `feasibility` with `risk_level`, `technical_risks`, and `sequencing_constraints` |
| `checklist.brief_ref_valid` | boolean | yes | `approved_brief_ref` points to an existing file path |
| `checklist.blockers_resolved` | boolean | yes | `critical_blockers` array is empty or all entries marked resolved; `open_questions` array is present |

## Input

Receive from agent:
- `roadmap_yaml_path` — (required) Full path to roadmap.yaml

## Process

1. **Read artifact:** Read `roadmap_yaml_path`. If not found, return structured failure: artifact not found.

2. **Check status:** If status is LOCKED, return structured failure: "roadmap.yaml is already LOCKED — no validation needed."

3. **Evaluate completeness checklist** by inspecting YAML fields directly:

   - `thesis_defined`: `thesis` field is a non-empty string (not null, not blank, not a placeholder like "TBD")
   - `narrative_sufficient`: `narrative` field has >= 3 paragraphs. Count paragraphs as text blocks separated by double newlines or explicit newline sequences. A single-paragraph summary is insufficient.
   - `timeline_populated`: `timeline` list has >= 1 entry (horizon) where `epic_refs` is a non-empty list. Each horizon should have a non-empty `name` or `label`.
   - `feasibility_entries_present`: `feasibility` list has >= 1 entry where `risk_level` is non-empty AND `technical_risks` is a non-empty list AND `sequencing_constraints` is present (may be empty list but key must exist)
   - `brief_ref_valid`: `approved_brief_ref` field is a non-empty string pointing to a file path. Read the file to confirm it exists. If the field is absent or the file does not exist, this check fails.
   - `blockers_resolved`: `critical_blockers` is an empty array OR all entries have a `resolved: true` field. `open_questions` key must be present (may be empty array).

4. **Evaluate content quality** for key YAML fields:
   - `thesis`: describes a strategic direction, not a feature list
   - `narrative`: connects product vision to timeline decisions with reasoning
   - Each timeline horizon has a rationale or description explaining why those features are in that phase

5. **Compute completeness_score:** Weighted score (0-100) based on checklist pass/fail. Each of the 6 checklist items has equal weight (~16.7% each).

6. **Classify issues:** `blocker` (fails a mandatory checklist item), `warning` (sparse field or weak content quality), `suggestion` (improvement opportunity).

7. **Determine ready_for_lock:** true only if completeness_score >= 70 AND no blocker-severity issues.

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
    thesis_defined: true|false
    narrative_sufficient: true|false
    timeline_populated: true|false
    feasibility_entries_present: true|false
    brief_ref_valid: true|false
    blockers_resolved: true|false
```

**IMPORTANT**: This skill produces validation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER modify the roadmap.yaml artifact — read-only
- NEVER approve lock (ready_for_lock: true) when blocker-severity issues exist
- ALWAYS return all checklist fields (false if field is absent, empty list, or empty string)
- ALWAYS reference YAML field names in `issues[].field` — not section names from a markdown document
- ALWAYS read status field from roadmap.yaml before evaluating checklist

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
