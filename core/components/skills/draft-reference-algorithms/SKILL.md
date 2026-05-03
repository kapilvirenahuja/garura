---
name: draft-reference-algorithms
description: Produce language-agnostic reference pseudocode sections for algorithmically complex internal interfaces identified in tech.yaml. One section per qualifying interface.
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-reference-algorithms

Model-invocable skill for generating language-agnostic reference pseudocode for algorithmically complex internal interfaces.

## Purpose

Read a set of qualifying `internal_interfaces` entries from `tech.yaml` and produce a `reference-algorithms.md` artifact. For each interface, generate one section covering: complexity class, invariants, edge cases, and language-agnostic reference pseudocode for the core algorithm.

This skill produces ONLY `reference-algorithms.md`. It does NOT modify `tech.yaml` or any other artifact. It does NOT determine which interfaces qualify — that pre-flight scan is done by the calling play/agent and passed in as `interface_ids`.

## Input

Receive from agent via JSON contract:

```yaml
tech_yaml_path: "{stm_base}/{issue}/context/design/tech.yaml"
interface_ids:        # list of qualifying interface IDs from pre-flight scan
  - "{interface_id_1}"
  - "{interface_id_2}"
stm_base: ".garura/project/issues/"
issue: "{issue_number}"
```

Nothing else is passed. Derive all content from `tech.yaml` using the provided `interface_ids`.

## Process

1. **Resolve output path:** `{stm_base}/{issue}/context/design/reference-algorithms.md`

2. **Check for existing artifact:** Read the output path. If the file exists AND contains the string `status: LOCKED`, stop immediately and return:
   ```yaml
   status: skipped
   reason: "reference-algorithms.md is already LOCKED"
   reference_algorithms_path: "{resolved output path}"
   ```
   If the file exists but is not LOCKED (i.e., status is DRAFT), overwrite it.

3. **Read tech.yaml:** Open `tech_yaml_path`. For each `interface_id` in the input list, locate the matching entry in the `internal_interfaces` section (match on the `id` field). Extract:
   - `module` — the module this interface belongs to
   - `function` (or operation name) — the callable being described
   - `behavior_contracts` — the behavioral description/constraints for this interface

4. **Derive complexity class:** Read `behavior_contracts` for each interface and classify into one of:
   - `state-machine` — interface manages discrete states with defined transitions
   - `scheduler` — interface governs timing, ordering, or sequencing of work
   - `retry-backoff` — interface handles failure recovery with retry/backoff logic
   - `reconciliation` — interface aligns divergent state between two sources of truth
   - `other` — does not clearly fit the above four

5. **Generate invariants and edge cases:** From `behavior_contracts`, extract or infer:
   - **Invariants** — conditions that must always hold (pre/post conditions, state invariants)
   - **Edge cases** — boundary conditions, failure modes, or unusual inputs the algorithm must handle

6. **Generate reference pseudocode:** Write language-agnostic pseudocode covering the core algorithm for each interface. Use plain structured notation (FUNCTION, IF, WHILE, FOR, RETURN, etc.) without any language-specific syntax. Pseudocode must cover the primary logic path: state transitions for state machines, the scheduling loop for schedulers, retry/backoff logic for retry interfaces, or the reconciliation steps for reconciliation interfaces.

7. **Write artifact:** Produce `reference-algorithms.md` at the resolved output path. Format the file as specified in the Output section below. Set `status: DRAFT` in the file header.

8. **Return output contract.**

## Output

### File format

```markdown
# Reference Algorithms: Issue #{issue}
status: DRAFT

## {interface_id}
**Module:** {module from tech.yaml internal_interfaces entry}
**Function:** {function from tech.yaml internal_interfaces entry}
**Complexity class:** {state-machine | scheduler | retry-backoff | reconciliation | other}

### Invariants
- {invariant 1}
- {invariant 2}

### Edge Cases
- {edge case 1}
- {edge case 2}

### Reference Pseudocode

```
FUNCTION {function_name}({params}):
  // language-agnostic pseudocode
  // covers the core algorithm: state transitions, scheduling loop,
  // retry logic, reconciliation steps, etc.
  ...
```
```

One `## {interface_id}` section per interface in the input list. Never merge two interfaces into one section.

### Output contract

```yaml
status: completed
reference_algorithms_path: "{stm_base}/{issue}/context/design/reference-algorithms.md"
artifact_status: DRAFT
interfaces_documented:
  - "{interface_id_1}"
  - "{interface_id_2}"
```

**IMPORTANT:** This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

### SCOPE
- This skill produces ONLY `reference-algorithms.md` — one section per qualifying interface
- NEVER read from KB or LTM — all context comes from `tech.yaml` and the `interface_ids` input list
- NEVER modify `tech.yaml` or any other file except the output `reference-algorithms.md`
- NEVER determine which interfaces qualify — that is the calling play's responsibility, delivered via `interface_ids`

### ARTIFACT RULES
- ALWAYS check for LOCKED status before overwriting — return `skipped` if LOCKED
- ALWAYS set `status: DRAFT` in the written file header
- ALWAYS produce exactly one `## {interface_id}` section per interface in the input list — never merge interfaces
- ALWAYS produce pseudocode in language-agnostic style — no Python, TypeScript, Java, or other language syntax

### PSEUDOCODE STYLE
- Use uppercase keywords: FUNCTION, IF, ELSE, WHILE, FOR, RETURN, THROW, CALL, EMIT, WAIT
- Use `//` for inline comments
- Parameters and variables use snake_case
- Do not import or reference any library, package, or runtime-specific API

### OUTPUT CONTRACT
- ALWAYS return a structured YAML output contract
- List every `interface_id` from the input under `interfaces_documented` in the returned contract

## Version

| Field   | Value                  |
|---------|------------------------|
| Version | 1.0.0                  |
| Category | design               |
