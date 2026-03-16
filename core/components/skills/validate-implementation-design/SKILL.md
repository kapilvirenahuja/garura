---
name: validate-implementation-design
description: Cross-validate YAML implementation artifacts against intent constraints for coverage, compartmentalization, audience separation, and structural completeness
user-invocable: false
model: sonnet
allowed-tools: Read
---

# validate-implementation-design

Model-invocable skill for cross-validating YAML implementation design artifacts against intent constraints and failure conditions.

## Purpose

Read and evaluate YAML implementation artifacts (features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml) against intent constraints and failure conditions. Returns a structured validation_result with per-check outcomes and classified issues. Does NOT modify any artifact.

You DO the validation. You do NOT modify any artifact or decide what happens next.

## Input

Receive from agent:
- `features_path` — (required) Full path to features.yaml
- `architecture_path` — (required) Full path to architecture.yaml
- `tech_path` — (required) Full path to tech.yaml
- `scenarios_path` — (required) Full path to scenarios.yaml
- `plan_path` — (required) Full path to plan.yaml

## Process

1. **Read all artifacts.** Read all five paths. If any artifact is not found, return structured failure identifying the missing artifact(s). All five must be present to proceed.

2. **Check status.** If all artifacts are LOCKED, return structured failure: "All artifacts are already LOCKED — no validation needed."

3. **Run validation checks.** Run all 14 checks below. Each check maps to a specific constraint or failure condition.

---

### V1 — Features artifact has no tech refs

Scan `features.yaml` — specifically the `identity`, `invariants`, `scope`, and `features` sections (including all `behaviors` and `constraints` sub-fields) — for technology names, SDK references, database product names, hosting platform names, library names, or deployment patterns. The features artifact must describe behaviors, invariants, and scope only — no technology-specific terms.

- **PASS:** Zero technology references found in features.yaml
- **FAIL:** One or more technology references found (list each field path and value)

---

### V2 — architecture.yaml has concrete tech names

Scan the `stack` section of `architecture.yaml` for vague technology references — terms like "a relational database," "a web framework," "an LLM provider," "a hosting platform," or any unnamed technology placeholder. Every `stack` entry must have a specific `technology` value (e.g., "React 19", "Python 3.12", "Claude Sonnet 3.5"). Check `platforms` and `integrations` sections similarly for named providers.

- **PASS:** Every stack component names a concrete technology; every platform and integration names a specific provider
- **FAIL:** One or more vague technology references found (list each `stack[].technology` or `platforms[].platform` value that is vague)

---

### V3 — tech.yaml has project structure with file paths

Verify `tech.yaml` has a `project_structure` section with at least one entry in `directories` or `key_files`, and that each entry has a non-empty `path` field. Also verify the `components` section has at least one component with a non-empty `key_files` list.

- **PASS:** `project_structure` is present with at least one directory or key file; at least one component has key_files
- **FAIL:** `project_structure` is absent or empty, or no component has key_files (describe the gap)

---

### V4 — tech.yaml has libraries with versions

Verify `tech.yaml` has a `libraries` section with at least one entry, and that every library entry has a non-empty `version` field. A library entry with a missing or blank `version` is a violation.

- **PASS:** `libraries` section is present with at least one entry; every entry has a non-empty version
- **FAIL:** `libraries` section is absent, or one or more library entries are missing `version` (list the library names)

---

### V5 — scenarios.yaml has feature back-links on every scenario

Scan every scenario within every group in `scenarios.yaml`. Each scenario must have a `feature_ref` field that references a feature ID defined in `features.yaml`. A scenario with a missing, blank, or unresolvable `feature_ref` is a violation.

- **PASS:** Every scenario has a `feature_ref` that resolves to a feature in features.yaml
- **FAIL:** One or more scenarios are missing `feature_ref` or reference a non-existent feature ID (list the scenario IDs)

---

### V6 — scenarios.yaml feature_gates covers all features in features.yaml

Extract all feature IDs from `features.yaml.features`. Extract all `feature_ref` values from `scenarios.yaml.feature_gates`. Every feature that appears in features.yaml must have a corresponding entry in `scenarios.yaml.feature_gates`. A feature with no gate entry means it has no defined completion criteria.

- **PASS:** Every feature ID in features.yaml has a corresponding entry in scenarios.yaml feature_gates
- **FAIL:** One or more feature IDs from features.yaml are absent from scenarios.yaml feature_gates (list the missing feature IDs)

---

### V7 — plan.yaml has no scenario descriptions, only IDs in scenario_gate

Scan the `execution_order` section of `plan.yaml`. For each entry, inspect the `scenario_gate` field. The `scenario_gate.scenario_ids` must contain only scenario ID values (e.g., "SC-AUTH-001") — not scenario descriptions, titles, or copied text from scenarios.yaml. Any scenario description appearing in plan.yaml is a compartmentalization violation.

- **PASS:** All `scenario_gate.scenario_ids` values are scenario ID strings only
- **FAIL:** One or more scenario_gate entries contain descriptive text instead of IDs (list the offending execution_order entries)

---

### V8 — No audience collision across artifacts

Check each artifact for content that belongs to a different artifact's audience:
- `features.yaml` (product stakeholders) must not contain architecture or technology content
- `architecture.yaml` (architects) must not contain feature behavior descriptions or scenario content
- `tech.yaml` (implementers) must not contain business goals, market context, or scenario descriptions
- `scenarios.yaml` (validators) must not contain implementation details, file paths, or architecture decisions
- `plan.yaml` (implementers) must not contain scenario descriptions — only IDs

- **PASS:** No audience collision detected
- **FAIL:** One or more audience collisions found (list artifact, field path, and offending content)

---

### V9 — plan.yaml summary cumulative count matches total scenarios

In `plan.yaml`:
- Sum all `scenario_gate.count` values across all entries in `execution_order`. This is the declared scenario total.
- Check `summary.total_scenarios` — it must equal the sum computed above.
- Check `summary.per_feature` — for each entry, `cumulative_scenarios` must equal the running total of scenario counts up to and including that sequence position.

- **PASS:** `summary.total_scenarios` equals sum of all `scenario_gate.count` values; cumulative counts are correct
- **FAIL:** Mismatch found (state the computed value, the declared value, and the discrepancy)

---

### V10 — plan.yaml every feature has observable exit gate

For every entry in `plan.yaml.execution_order`, verify the `exit_gate` field has a non-empty `description` and `observable: true`. An exit gate referencing process steps ("complete the tests", "finish the code") instead of observable outcomes ("user can log in via OAuth, session persisted") is a violation. Also check `prerequisites.exit_gate` exists.

- **PASS:** Every execution_order entry has an exit gate with observable: true and a concrete description; prerequisites has an exit gate
- **FAIL:** One or more entries lack an exit gate, have observable: false, or have vague process-step descriptions (identify the entry)

---

### V11 — Every scenario appears in exactly one feature_gate scenario_gate

Cross-check `scenarios.yaml` and `plan.yaml`:
1. Extract all scenario IDs from `scenarios.yaml` (every `scenario.id` across all groups).
2. Extract all scenario IDs referenced in `plan.yaml.execution_order[*].scenario_gate.scenario_ids`.
3. Every scenario ID from scenarios.yaml must appear in exactly one plan.yaml scenario_gate — not zero, not two.

- **PASS:** Every scenario ID from scenarios.yaml appears in exactly one plan.yaml scenario_gate
- **FAIL:** Scenario IDs appearing in zero plan gates (not mapped) or in multiple plan gates (list the IDs and their occurrences)

---

### V12 — plan.yaml has at least 2 features in execution_order

Verify `plan.yaml.execution_order` contains at least 2 entries (each entry represents one feature slice). A plan with fewer than 2 features in execution order is structurally incomplete.

- **PASS:** `execution_order` has 2 or more entries
- **FAIL:** `execution_order` has fewer than 2 entries (state the actual count)

---

### V13 — architecture.yaml has agentic PCAM section (if product has agentic components)

Inspect `architecture.yaml`. If `agentic` is present as a non-empty section, verify it contains all four PCAM sub-sections (`perception`, `cognition`, `action`, `memory`) each with at least one entry. If `agentic` is absent or null, check whether any `stack`, `platforms`, or `integrations` entry suggests an agentic component (e.g., an LLM, Claude, GPT, agent framework). If agentic signals exist in the stack but the `agentic` section is absent, that is a violation.

- **PASS:** No agentic signals detected (non-agentic product), OR agentic section is present with all four PCAM sub-sections populated
- **FAIL:** Agentic signals detected in stack/platforms but `agentic` section is absent, OR `agentic` section is present but missing one or more PCAM sub-sections (identify what's missing)
- **SKIP:** If this check is not applicable (no agentic signals at all and no agentic section), mark as PASS with note "Non-agentic product — check not applicable"

---

### V14 — features.yaml blast_radius present on every feature

Scan every entry in `features.yaml.features`. Each feature must have a `blast_radius` field present. The field CAN be null or have empty arrays — the field's existence is what matters. A feature entry with no `blast_radius` key at all is a violation.

- **PASS:** Every feature entry has a `blast_radius` field (value may be null or empty)
- **FAIL:** One or more features are missing the `blast_radius` field entirely (list the feature IDs)

---

4. **Classify issues.** For each failed check, classify severity:
   - `blocker` — Constraint violation or failure condition triggered (any V1–V14 FAIL)
   - `warning` — Content is present but sparse, ambiguous, or borderline
   - `suggestion` — Improvement opportunity that does not block locking

5. **Determine ready_for_lock.** `true` only if all 14 checks pass AND no blocker-severity issues exist.

## Output

```yaml
validation_result:
  ready_for_lock: true|false
  checks:
    - check_id: "V1"
      name: "Features artifact has no tech refs"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V2"
      name: "architecture.yaml has concrete tech names"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V3"
      name: "tech.yaml has project structure with file paths"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V4"
      name: "tech.yaml has libraries with versions"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V5"
      name: "scenarios.yaml has feature back-links on every scenario"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V6"
      name: "scenarios.yaml feature_gates covers all features"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V7"
      name: "plan.yaml has only scenario IDs in scenario_gate"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V8"
      name: "No audience collision across artifacts"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V9"
      name: "plan.yaml summary cumulative count matches total scenarios"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V10"
      name: "plan.yaml every feature has observable exit gate"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V11"
      name: "Every scenario appears in exactly one feature_gate scenario_gate"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V12"
      name: "plan.yaml has at least 2 features in execution_order"
      status: "PASS|FAIL"
      details: "{description of findings}"
    - check_id: "V13"
      name: "architecture.yaml has agentic PCAM section"
      status: "PASS|FAIL|SKIP"
      details: "{description of findings}"
    - check_id: "V14"
      name: "features.yaml blast_radius present on every feature"
      status: "PASS|FAIL"
      details: "{description of findings}"
  issues:
    - message: "{description of issue}"
      check_id: "{V1-V14}"
      severity: "blocker|warning|suggestion"
```

**IMPORTANT**: This skill produces validation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER modify any artifact — read-only across all five inputs
- NEVER approve lock (ready_for_lock: true) when any check has FAIL status or blocker-severity issues exist
- ALWAYS return all 14 checks with status, even if the check passes trivially
- ALWAYS list every individual violation in the issues array — do not summarize multiple violations into a single issue
- V13 may return PASS with a "not applicable" note for non-agentic products — this is not a skip in the ready_for_lock sense

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | analysis |
