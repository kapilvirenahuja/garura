---
name: diff-artifacts
description: Model-reasoned coverage diff between two artifacts. Given an input and output artifact, classifies each input element as covered, partial, or dropped, flags drifted output content, and writes a coverage-check report. Invoked by the judge agent when config.instructions asks for an artifact diff, or directly by any caller that needs coverage analysis.
user-invocable: false
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
---

# diff-artifacts

## Purpose

Model-reasoned coverage/diff between two artifacts. Given an input artifact
and an output artifact, this skill reads both, extracts discrete elements
from the input per the specified check_type, and classifies each element's
representation in the output as covered, partial, dropped, or drifted.
Produces a structured coverage-check.yaml report.

## Input

```json
{
  "input_path": "<path to input artifact>",
  "output_path": "<path to output artifact>",
  "check_type": "<free-text description of what to extract and compare>",
  "output_report_path": "<path where coverage-check.yaml will be written>"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `input_path` | yes | Path to the input artifact to extract elements from |
| `output_path` | yes | Path to the output artifact to check coverage against |
| `check_type` | yes | Free-text description of what element types to extract (e.g., "product-to-epics", "problem-to-vision") |
| `output_report_path` | yes | Path where this skill writes coverage-check.yaml |

## Output

Writes `coverage-check.yaml` at `output_report_path`.

**coverage-check.yaml schema:**

```yaml
coverage_check:
  checked_at: "{ISO-8601}"
  checked_by: "judge"
  check_type: "product-to-epics | problem-to-vision"
  input_path: "<path>"
  output_path: "<path>"
  elements:
    - input_element: "{element ID or description}"
      source_field: "{field in input artifact}"
      status: "covered | partial | dropped"
      output_reference: "{where in output this is addressed, or null}"
      note: "{explanation}"
  drifted:
    - output_element: "{content in output not traceable to any input}"
      note: "{explanation}"
  summary:
    total_input_elements: {integer}
    covered: {integer}
    partial: {integer}
    dropped: {integer}
    drifted: {integer}
    coverage_score: "{covered + 0.5*partial / total * 100}%"
```

## Process

1. **Read input artifact** — Read the file at `input_path`. Extract every
   discrete element relevant to `check_type` (e.g., strategic goals,
   success metrics, target users, assumptions, out_of_scope items, profile
   dimensions, problem facets). Record each element with its source field.

2. **Read output artifact** — Read the file at `output_path`. Extract all
   content that should trace to input elements, including section headers,
   field values, references, and any content not traceable to the input.

3. **Per-element classification** — For each input element extracted in
   step 1, reason about its representation in the output artifact:
   - `covered`: output has a clear, traceable reference to this input element
   - `partial`: output addresses the element but incompletely (e.g., goal
     referenced but no metric addressed)
   - `dropped`: input element has no representation in the output
   Use model reasoning — do not rely on literal string matching.

4. **Detect drifted content** — Identify any content in the output artifact
   that does not trace to any input element (scope creep or new material
   introduced without an input anchor). Record each drifted item.

5. **Write report** — Compute summary counts and coverage_score. Write
   the complete coverage-check.yaml to `output_report_path`.

## Constraints

- **C1 — Model-reasoned, not grep-based.** Element classification MUST use
  model reasoning to assess semantic coverage. Do not rely on literal keyword
  matching. An element can be "covered" even if the exact phrasing differs,
  and can be "dropped" even if a similar term appears without meaningful
  treatment.

- **C2 — Write only to output_report_path.** This skill writes exactly one
  file: coverage-check.yaml at the path specified in `output_report_path`.
  No other files are created or modified.

## Failure Conditions

- `input_not_found`: File at `input_path` does not exist or cannot be read.
- `output_not_found`: File at `output_path` does not exist or cannot be read.
- `write_failed`: Could not write coverage-check.yaml to `output_report_path`.
- `check_type_unrecognizable`: `check_type` is so ambiguous that no element
  extraction strategy can be inferred; skill returns structured failure.
