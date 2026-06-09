---
name: draft-verification-scenarios
description: Create a scenarios.yaml artifact with grouped scenarios, feature back-links, feature gates, and coverage summary from a features specification
user-invocable: false
model: sonnet
allowed-tools: Read, Write
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# draft-verification-scenarios

Model-invocable skill for creating verification scenario specifications as structured YAML.

## Purpose

Transform a features specification into a structured `scenarios.yaml` artifact. Every feature behavior in the spec must map to at least one scenario -- full traceability, no gaps. Scenarios back-link to features; features never link back to scenarios.

You DO create the scenarios.yaml artifact. You do NOT validate it, execute the scenarios, or decide what happens next.

## Output Schema

The output MUST conform to `schemas/scenarios.yaml` in this skill's directory. Read the schema before producing output. Every field defined in the schema must be present in the output YAML. The schema is the contract — if it's in the schema, it's in the output.

## Input

Receive from agent:
- `features_yaml_path` — (required) Path to features.yaml
- `output_base` — (required) Base path for output (e.g., `.garura/product/roadmap/`)

## Process

1. **Determine artifact path:** `{output_base}/scenarios.yaml`

2. **Read and parse features specification:** Read features.yaml at `features_yaml_path`. Extract:
   - Every feature (F1, F2, ...) with its name, description, behaviors, success_scenarios, and failure_conditions
   - Architectural invariants from features.yaml
   - Scope boundaries (in_scope items that imply testable behavior)

3. **Build traceability map:** For each feature and each behavior within it (F{N}-B{N}), record the feature ID, behavior ID, and behavior description. This map drives scenario generation -- every behavior entry must produce at least one scenario. Invariants that are testable must also produce scenarios.

4. **Plan scenario groups:** Organize scenarios by feature area. Each group mirrors a feature or a cluster of related features. Assign a group ID prefix in the format `GRP-{NAME}` (e.g., GRP-AUTH, GRP-PAYMENTS, GRP-CORE). Each group lists the feature_refs it covers.

5. **Generate scenarios:** For each entry in the traceability map, produce one or more scenarios. Each scenario must conform to the scenarios.yaml schema:

   - `id` — `SC-{GRP}-{NNN}` format, zero-padded 3 digits (e.g., SC-AUTH-001, SC-PAY-003)
   - `title` — short descriptive title
   - `feature_ref` — back-link to specific feature ID (e.g., F1) -- REQUIRED
   - `behavior_ref` — back-link to specific behavior ID (e.g., F1-B1) -- include when scenario covers a named behavior; omit only for invariant-level scenarios
   - `description` — concrete situation being tested, not abstract
   - `expected_behavior` — list of observable outcomes the system should produce
   - `pass_criteria` — explicit, binary conditions that determine pass or fail; no ambiguity
   - `automation` — `automated` or `hybrid`
   - `test_type` — `unit` | `integration` | `e2e` | `acceptance`
   - `manual_element` — (hybrid only) what the human evaluates and why the machine cannot

   **Automation classification rules:**
   - `automated` — full unit/integration/e2e test, no human judgment needed; state the test type
   - `hybrid` — automated setup and structural assertions, but one or more quality judgments require human review; document what is automated and what the human evaluates
   - NEVER classify as `automated` if it requires subjective quality judgment
   - NEVER classify as `hybrid` without documenting the manual_element

6. **Build feature_gates section:** For each feature in features.yaml, produce a gate entry listing all scenario IDs that must pass for that feature to be accepted:
   - `feature_ref` — feature ID
   - `feature_name` — feature name from features.yaml
   - `required_scenarios` — list of SC-* IDs for this feature
   - `total_count` — total scenario count
   - `automated_count` — count of automated scenarios
   - `hybrid_count` — count of hybrid scenarios
   - `gate_criteria` — plain-language summary: "All {N} scenarios must pass for {feature_name} to be accepted"

7. **Validate full coverage:** Cross-check the traceability map. Every behavior in features.yaml must have at least one scenario. Every feature must appear in at least one group. If a behavior has no scenario, add one before writing.

8. **Compute coverage summary:**
   - `total_scenarios` — count of all scenarios across all groups
   - `automated` — total automated scenario count
   - `hybrid` — total hybrid scenario count
   - `per_group` — breakdown by group (group_id, count, automated, hybrid)
   - `uncovered_features` — features with zero scenarios (must be empty)
   - `uncovered_behaviors` — behaviors with zero scenarios (must be empty)

9. **Write artifact:** Write `scenarios.yaml` at `{output_base}/scenarios.yaml` with `status: DRAFT`.

10. **Return output.**

## Output

```yaml
scenarios_yaml:
  path: "{full path to scenarios.yaml}"
  scenarios_yaml_path: "{full path to scenarios.yaml}"
  total_count: {number}
  automated_count: {number}
  hybrid_count: {number}
  groups:
    - id: "GRP-{NAME}"
      name: "{group name}"
      feature_refs: ["F1"]
      count: {number}
  coverage: "full"
  uncovered_features: []
  uncovered_behaviors: []
  status: "DRAFT"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

### COMPARTMENTALIZATION
- scenarios.yaml is VALIDATOR-FACING. It must never be shared with or referenced by code-builder agents.
- Scenarios know about features (back-links via feature_ref and behavior_ref). Features NEVER link to scenarios.
- feature_gates in this artifact serve as the authoritative mapping for validators -- which scenarios gate each feature.

### SCENARIO QUALITY
- NEVER produce a scenario without all required fields (id, title, feature_ref, description, expected_behavior, pass_criteria, automation, test_type)
- NEVER classify a scenario as `automated` if it requires subjective quality judgment -- use `hybrid`
- NEVER classify a scenario as `hybrid` without documenting the manual_element
- NEVER leave a feature behavior uncovered -- every behavior in features.yaml must have at least one scenario
- ALWAYS use `SC-{GRP}-{NNN}` ID format with zero-padded three-digit numbers
- ALWAYS organize scenarios into groups that mirror features.yaml feature areas

### ARTIFACT RULES
- NEVER overwrite a LOCKED scenarios.yaml -- return structured failure
- ALWAYS set `status: DRAFT` in the written artifact
- ALWAYS include feature_gates section with an entry for every feature in features.yaml
- ALWAYS ensure uncovered_features and uncovered_behaviors are empty before writing
- Audience is validators (quality-validator agent, human QA) -- scenarios must be independently testable without implementation knowledge

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | analysis |
