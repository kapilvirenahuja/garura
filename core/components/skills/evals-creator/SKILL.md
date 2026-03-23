---
name: evals-creator
description: Generate step evals and scenario evals from intent.yaml and skill contracts, including constraint-driven evals for artifact-verifiable constraints. Use when building a new recipe or updating evals after intent changes.
user-invocable: false
model: opus
allowed-tools: Read, Write
category: framework
version: 2.0.0
---

# evals-creator

Model-invocable skill for generating eval definitions from intent.yaml and skill contracts.

## Purpose

Read an intent.yaml and a set of skill output contracts to produce two levels of eval definitions: step evals (agent self-validates after skill output) and scenario evals (recipe validates E2E). Each eval is binary, traceable to its source in intent.yaml, and grounded in observable artifact state.

You DO generate eval definitions mapped to failure conditions and scenarios. You do NOT execute evals, run tests, or modify skills/agents.

## Input

Receive from agent:
- `intent_path` — (required) Full path to intent.yaml
- `skill_contracts` — (required) List of objects: `[{ "skill_name": "<name>", "contract_path": "<path to SKILL.md or output contract>" }]`
- `output_path` — (required) Path where evals YAML should be written (STM path)
- `constraint_classifications` — (optional) List of objects: `[{ "id": "C1", "category": "pre-flight|artifact-verifiable|structural" }]`. When provided, evals are generated for constraints classified as `artifact-verifiable`. Constraints classified as `pre-flight` or `structural` are ignored (those are enforced by the recipe's structure, not by evals).

## Pre-conditions

1. **Read intent.yaml** at `intent_path`. If not found, return structured failure:
   ```json
   { "error": "intent_not_found", "message": "intent.yaml not found at provided path" }
   ```
2. **Read each skill contract** at the provided `contract_path` entries. If any contract is missing, return structured failure:
   ```json
   { "error": "contract_not_found", "message": "Skill contract not found: <skill_name> at <contract_path>" }
   ```

## Process

1. **Parse intent.yaml** — extract `constraints` (each with an ID like C1, C2), `failure_conditions` (each with an ID like F1, F2), and `scenarios` (each with an ID like S1, S2). If `failure_conditions` or `scenarios` is missing or empty, return structured failure:
   ```json
   { "error": "incomplete_intent", "message": "intent.yaml missing failure_conditions or scenarios" }
   ```

2. **Parse each skill contract** — extract the output format, artifact patterns, and what each skill produces. Build a map of skill name to output shape.

3. **Generate step evals** — for each failure condition in intent.yaml:
   - Determine which skill's output would exhibit that failure state based on what each skill produces.
   - A failure condition may map to multiple skills — create one step eval per skill mapping.
   - Write the eval with: what to check, against which artifact pattern, concrete pass/fail criteria.
   - Every check and criteria MUST be binary and observable in the artifact — no subjective language.
   - Assign IDs sequentially: SE-1, SE-2, etc.

4. **Generate constraint evals** — if `constraint_classifications` is provided, for each constraint classified as `artifact-verifiable`:
   - Determine which skill's output would violate or satisfy the constraint's `rule` field.
   - Create one step eval that checks the constraint's rule against the relevant artifact.
   - The eval's `check` and `pass_criteria` fields MUST use the constraint's own language from its `rule` field — no invented thresholds, no reformulated criteria. The eval may make the language more concrete by pointing to a specific artifact and field, but MUST NOT introduce numeric thresholds or criteria not present in the constraint's `rule` text.
   - Exception: If the constraint's `rule` itself specifies a threshold (e.g., "maximum 3 dispatches"), the eval may reference that threshold.
   - A constraint eval may overlap with a failure condition eval if they test the same thing — set `source_type: "both"` and reference both IDs.
   - Assign IDs continuing from the step eval sequence (after failure condition evals).

5. **Generate scenario evals** — for each scenario in intent.yaml:
   - Determine what final artifact the persona receives based on the scenario's "then" clause.
   - Write the eval with: artifact path pattern, persona, what to verify, pass/fail criteria.
   - Every check MUST map directly to the scenario's "then" — do not invent additional checks.
   - Assign IDs sequentially: SCE-1, SCE-2, etc.

6. **Validate coverage** — verify that every failure condition has at least one step eval, every artifact-verifiable constraint has at least one step eval, and every scenario has at least one scenario eval. If any are unmapped, add the missing evals before writing. Produce a coverage summary for the output (see Output section).

7. **Write evals to STM** — write the complete evals YAML to `output_path` using the Write tool.

## Output Format

The evals YAML written to `output_path` MUST follow this structure:

```yaml
step_evals:
  - id: <string>                      # SE-1, SE-2, etc.
    source_type: <string>             # "failure_condition", "constraint", or "both"
    failure_condition_id: <string|null> # References F1, F2 from intent.yaml (null if source_type is "constraint")
    constraint_id: <string|null>       # References C1, C2 from intent.yaml (null if source_type is "failure_condition")
    skill: <string>                    # Which skill's output to check
    check: <string>                    # What to verify — concrete, binary, using intent's own language
    artifact_pattern: <string>         # Path pattern of the artifact to check
    pass_criteria: <string>            # What "pass" looks like — observable state, using intent's own language
    fail_criteria: <string>            # What "fail" looks like — observable state

scenario_evals:
  - id: <string>                      # SCE-1, SCE-2, etc.
    scenario_id: <string>             # References S1, S2 from intent.yaml
    persona: <string>                 # From scenario
    artifact_pattern: <string>        # What final artifact to validate
    check: <string>                   # What to verify — matches scenario's "then"
    pass_criteria: <string>           # Observable outcome
    fail_criteria: <string>           # Observable failure
```

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after. The YAML block below is your entire response:

```yaml
evals:
  path: "{output_path}"
  step_eval_count: {integer}
  scenario_eval_count: {integer}
  coverage:
    failure_conditions_covered: [F1, F2, ...]
    failure_conditions_uncovered: []
    constraints_covered: [C7, C10, ...]       # artifact-verifiable only
    constraints_uncovered: []                  # artifact-verifiable only
    scenarios_covered: [S1, S2, ...]
    scenarios_uncovered: []
```

The full eval definitions are written to `path`. Downstream agents and recipes MUST read from that file — do NOT pass eval content through memory.

## Constraints

- NEVER create evals that require subjective judgment — every check must be binary
- NEVER invent failure conditions not present in intent.yaml
- NEVER invent scenarios not present in intent.yaml
- NEVER include implementation details (tool names, agent names) in eval criteria
- NEVER pass full eval data through memory — ALWAYS write to STM and return the path
- ALWAYS make pass/fail criteria observable in artifacts
- ALWAYS map each failure condition to at least one step eval
- ALWAYS map each scenario to at least one scenario eval
- ALWAYS trace step evals to failure_condition_id and scenario evals to scenario_id
- ALWAYS read intent.yaml and all skill contracts before generating any evals
- ALWAYS write the evals file to `output_path` before returning output
- ALWAYS return structured failure if intent.yaml or any skill contract is missing
- NEVER introduce numeric thresholds, counts, or criteria not present in the source constraint or failure condition text
- ALWAYS use the constraint's or failure condition's own language as the basis for eval check and pass_criteria
- ALWAYS include source_type, failure_condition_id, and constraint_id fields on every step eval
- ALWAYS ignore constraints classified as "pre-flight" or "structural" — only generate evals for "artifact-verifiable"
- ALWAYS include coverage summary in the output return format

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | framework |
