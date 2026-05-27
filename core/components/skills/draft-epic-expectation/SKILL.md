---
name: draft-epic-expectation
description: "Generate the Expectation block (success_scenarios + recovery) for a product-layer intent epic by reading its intent block and applying the epic-expectation generation rules. Performs a read-merge-write — reads the existing epic YAML (written by generate-intent-epics), populates the stub expectation block, and writes back atomically. Produces expectation block with vetted.status pending — a human approves it at the specify Tether checkpoint."
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# draft-epic-expectation

Generates the Expectation block for a **product-layer intent epic** from its intent triple (`intents[]`, `failure_conditions[]`). The companion to `generate-intent-epics` on the Expectation side of ICE at the product layer.

This skill is the **epic case** — distinct from `draft-play-expectation` (play layer) and `generate-feature-expectation` (runtime feature layer). It reads an epic YAML file that already has the intent block and stub expectation block written by `generate-intent-epics`, populates `success_scenarios` and `recovery`, and writes back atomically.

## Purpose

Take an epic YAML file's intent block (`intents[]`, `failure_conditions[]`) and produce a complete `expectation:` block — `success_scenarios` and `recovery` — so the intent stays the clean triple while the testable and recoverable parts live in the expectation block. The output is a draft: `vetted.status: pending` until a human approves it at the Tether checkpoint in `/specify`.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `epic_path` | yes | Path to the epic YAML file (already has stub expectation block from `generate-intent-epics`) |
| `rules_path` | no | Override for the generation rules (default `core/components/memory/standards/rules/expectation-generation.md`) |
| `decision_manifest_path` | no | Override for the decision-manifest output path. Default: same directory as the epic file, named `decision-manifest-draft-epic-expectation-{epic-id}.yaml`. |

## Process

### 1. Read the rules

Read the file at `rules_path`. Every decision below — what counts as a success scenario, how recovery entries are structured, when `handoff` is `autonomous` vs `human` — is governed by these rules. Do not improvise beyond them.

### 2. Read the epic file

Read the full epic YAML at `epic_path`. Locate the intent block fields:
- `intents[]` — list of intent statements (one per distinct user/outcome)
- `failure_conditions[]` — plain list of cause strings

Also locate the stub expectation block (written by `generate-intent-epics`):
```yaml
expectation:
  vetted:
    status: pending
    approved_by: null
    approved_at: null
  success_scenarios: []
  recovery: []
```

If the stub is missing, halt with `status: failed, reason: missing_expectation_stub`.

### 3. Generate `success_scenarios`

Derive one success scenario per distinct consumer/outcome combination across all entries in `intents[]`. For each entry:
- `id`: `S{N}` (sequential, 1-based)
- `persona`: the named actor from the intent entry (the grammatical subject)
- `given`: the pre-condition implied by the intent entry's context
- `then`: the observable outcome stated in the intent entry, expressed as a binary-testable "user can point to this and say it happened" statement. Forbidden words in `then`: `should`, `smooth`, `intuitive`, `seamless`, `better`, `user-friendly`, `fast` (without a number), `improved` (without a measurement).
- `measure`: the observable, binary signal a reviewer uses to verify this scenario. Must be concrete and point-at-able.

Minimum 2 success scenarios across all `intents[]` entries. If `intents[]` has only one entry but yields one scenario, derive a second scenario from a different persona/context angle if the rules permit; otherwise surface `D-dee-002` as a low-confidence decision.

Record decision `D-dee-001` for each scenario's phrasing choices (see Decision Manifest section).

### 4. Generate `recovery`

Produce exactly one recovery entry per entry in `failure_conditions[]`. No more, no fewer. For each failure condition string:
- `id`: `REC{N}` (sequential, 1-based, matching the failure_conditions index)
- `for_failure_condition`: the failure condition string verbatim (copy exactly, do not paraphrase)
- `trigger`: the failure condition as an observable symptom — what a reviewer would see or measure when this condition occurs
- `direction`: the inverse of the failure condition, expressed as directional guidance for resolving or mitigating it. Not implementation code, not a ticket number — a human-readable recovery direction.
- `handoff`: apply the autonomous-vs-human test from the rules. `autonomous` when the recovery direction can be executed by an L4 agent without human judgment; `human` when a person must make a decision or take an action.
- `derivable_at_l4`: `true` when `handoff: autonomous`; `false` when `handoff: human`.

Record decision `D-dee-003` for each handoff routing (see Decision Manifest section).

### 5. Stamp provenance

Set in the expectation block:
- `vetted.status: pending`
- `vetted.approved_by: null`
- `vetted.approved_at: null`

Never emit `vetted.status: approved` — only a human sets that at the Tether checkpoint.

### 6. Write back atomically (read-merge-write)

Merge the populated `success_scenarios` and `recovery` into the existing epic file's `expectation:` block, replacing the empty stubs. Write the entire file back to `epic_path`. Every other field in the file (identity, intent block, boundaries, constraints, business rules, validation, dependencies, KB traceability) must be preserved verbatim — do not alter anything outside the `expectation:` block.

### 7. Emit decision manifest

Write `decision-manifest.yaml` alongside the primary artifact (to the same directory as `epic_path`, or to `decision_manifest_path` if supplied).

**Decisions to record** (decision_id prefix: `D-dee-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-dee-001` | `success-scenario-phrasing` | How each `intents[]` entry is mapped to observable-outcome language in the `then` clause; which persona and pre-condition are derived for `given`; what the binary `measure` signal is |
| `D-dee-002` | `scenario-count-expansion` | When `intents[]` has fewer entries than the minimum scenario count, how the additional scenarios are derived from alternate personas or context angles |
| `D-dee-003` | `recovery-handoff-routing` | For each failure condition, whether `handoff` is `autonomous` or `human` per the autonomous-vs-human test; the `derivable_at_l4` value |

```yaml
schema_version: "1.0"
skill: "draft-epic-expectation"
epic_path: "{epic_path}"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-dee-001"
    decision_type: "success-scenario-phrasing"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the then clause and measure chosen}"
    alternatives_considered:
      - alt: "{alternative phrasing}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one D-dee-001 per success scenario, one D-dee-003 per recovery entry
```

### 8. Return the output contract

```yaml
expectation_drafted:
  epic_path: "{epic_path}"
  success_scenario_count: <int>
  recovery_count: <int>
  vetted_status: pending
  status: written
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| Epic file missing/unreadable | I/O | `status: failed, reason: missing_epic` |
| Epic has no `intents[]` or empty list | Malformed epic | `status: failed, reason: no_intents` |
| Epic has no `failure_conditions[]` or fewer than 2 entries | Malformed epic | `status: failed, reason: insufficient_failure_conditions` (recovery cannot be fully generated) |
| Expectation stub missing from epic file | `generate-intent-epics` was not run first | `status: failed, reason: missing_expectation_stub` |
| Rules file missing | I/O | `status: failed, reason: missing_rules` |
| Epic file unwritable | I/O | `status: failed, reason: output_write_error` |

## Boundaries

- Reads `epic_path` and `rules_path`; writes ONLY back to `epic_path` (read-merge-write) and the decision manifest.
- Modifies ONLY the `expectation:` block — every other field in the epic YAML is preserved verbatim.
- Never sets `vetted.status: approved` — only a human does at the Tether checkpoint.
- One recovery entry per failure condition — no more, no fewer.
- Never edits `intents[]`, `failure_conditions[]`, or any other intent-block field.
- Never applies play-layer or feature-layer generation rules — this is the epic case only.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-05-27 |
| Related | `core/components/skills/generate-intent-epics`, `core/components/skills/validate-intent-epics`, `core/components/agents/epic-expectation-crafter`, `core/components/memory/standards/schemas/intent-epic.yaml` |
