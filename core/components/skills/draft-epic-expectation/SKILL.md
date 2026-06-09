---
name: draft-epic-expectation
description: "Generate the Expectations block (success_scenario + recovery) for a product-layer intent epic by reading its intent block and applying the epic-expectation generation rules. Performs a read-merge-write — reads the existing epic YAML (written by generate-intent-epics), populates the stub expectations block, and writes back atomically. Produces expectations block with vetted.status pending — a human approves it at the specify Tether checkpoint."
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# draft-epic-expectation

Generates the Expectations block for a **product-layer intent epic** from its intent triple (`intent.goal`, `intent.constraints`, `intent.failure_scenario`). The companion to `generate-intent-epics` on the Expectation side of ICE at the product layer.

This skill is the **epic case** — distinct from `draft-play-expectation` (play layer) and `generate-feature-expectation` (runtime feature layer). It reads an epic YAML file that already has the intent block and stub `expectations:` block written by `generate-intent-epics`, populates `success_scenario` and `recovery`, and writes back atomically.

## Purpose

Take an epic YAML file's intent block (`intent.goal`, `intent.failure_scenario`) and produce a complete `expectations:` block — `success_scenario` and `recovery` — so the intent stays the clean triple while the testable and recoverable parts live in the expectations block. The output is a draft: `vetted.status: pending` until a human approves it at the Tether checkpoint in `/specify`.

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
- `intent.goal` — one-sentence user-observable end-state (string)
- `intent.failure_scenario` — plain list of failure cause strings (≥ 2 entries)

Also locate the stub expectations block (written by `generate-intent-epics`):
```yaml
expectations:
  vetted:
    status: pending
    approved_by: null
    approved_at: null
  success_scenario: []
  recovery: []
```

If the stub is missing, halt with `status: failed, reason: missing_expectation_stub`.

### 3. Generate `success_scenario`

Derive one or more success scenarios from `intent.goal` plus any additional consumer/outcome angles implied by it. For each scenario:
- `id`: `S{N}` (sequential, 1-based)
- `persona`: the named actor from `intent.goal` (the grammatical subject — persona or canonical role)
- `given`: the pre-condition implied by `intent.goal`'s context
- `then`: the observable outcome stated in `intent.goal`, expressed as a binary-testable "user can point to this and say it happened" statement. ≤ 30 words. Forbidden words in `then`: `should`, `smooth`, `intuitive`, `seamless`, `better`, `user-friendly`, `feels`, `fast` (without a number), `improved` (without a measurement).
- `measure`: the observable, binary signal a reviewer uses to verify this scenario. Must be concrete and point-at-able (number, percentage, count, duration, presence/absence check, or named event).

Minimum 1 success scenario. When `intent.goal` cleanly implies more than one persona/context angle, emit one entry per angle. Surface `D-dee-002` as a low-confidence decision when the count expansion is not directly supported by the goal text.

Record decision `D-dee-001` for each scenario's phrasing choices (see Decision Manifest section).

### 4. Generate `recovery`

Produce exactly one recovery entry per entry in `intent.failure_scenario`. No more, no fewer. For each failure-scenario string:
- `id`: `REC{N}` (sequential, 1-based, matching the failure_scenario index)
- `for_failure_scenario`: the failure-scenario string verbatim (copy exactly, do not paraphrase)
- `trigger`: the failure scenario as an observable symptom — what a reviewer would see or measure when this condition occurs
- `direction`: the inverse of the failure scenario, expressed as directional guidance for resolving or mitigating it. Not implementation code, not a ticket number — a human-readable recovery direction.
- `handoff`: apply the autonomous-vs-human test from the rules. `autonomous` when the recovery direction can be executed by an L4 agent without human judgment; `human` when a person must make a decision or take an action.
- `derivable_at_l4`: `true` when `handoff: autonomous`; `false` when `handoff: human`.

Record decision `D-dee-003` for each handoff routing (see Decision Manifest section).

### 5. Stamp provenance

Set in the expectations block:
- `vetted.status: pending`
- `vetted.approved_by: null`
- `vetted.approved_at: null`

Never emit `vetted.status: approved` — only a human sets that at the Tether checkpoint.

### 6. Write back atomically (read-merge-write)

Merge the populated `success_scenario` and `recovery` into the existing epic file's `expectations:` block, replacing the empty stubs. Write the entire file back to `epic_path`. Every other field in the file (identity, intent block, connections, provenance) must be preserved verbatim — do not alter anything outside the `expectations:` block.

### 7. Emit decision manifest

Write `decision-manifest.yaml` alongside the primary artifact (to the same directory as `epic_path`, or to `decision_manifest_path` if supplied).

**Decisions to record** (decision_id prefix: `D-dee-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-dee-001` | `success-scenario-phrasing` | How `intent.goal` is mapped to observable-outcome language in the `then` clause; which persona and pre-condition are derived for `given`; what the binary `measure` signal is |
| `D-dee-002` | `scenario-count-expansion` | When `intent.goal` implies more than one persona/context angle but the support is indirect, how the additional scenarios are derived |
| `D-dee-003` | `recovery-handoff-routing` | For each `intent.failure_scenario` entry, whether `handoff` is `autonomous` or `human` per the autonomous-vs-human test; the `derivable_at_l4` value |

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
| Epic has no `intent.goal` or empty string | Malformed epic | `status: failed, reason: no_goal` |
| Epic has no `intent.failure_scenario` or fewer than 2 entries | Malformed epic | `status: failed, reason: insufficient_failure_scenarios` (recovery cannot be fully generated) |
| Expectations stub missing from epic file | `generate-intent-epics` was not run first | `status: failed, reason: missing_expectation_stub` |
| Rules file missing | I/O | `status: failed, reason: missing_rules` |
| Epic file unwritable | I/O | `status: failed, reason: output_write_error` |

## Boundaries

- Reads `epic_path` and `rules_path`; writes ONLY back to `epic_path` (read-merge-write) and the decision manifest.
- Modifies ONLY the `expectations:` block — every other field in the epic YAML is preserved verbatim.
- Never sets `vetted.status: approved` — only a human does at the Tether checkpoint.
- One recovery entry per `intent.failure_scenario` entry — no more, no fewer.
- Never edits `intent.goal`, `intent.constraints`, `intent.failure_scenario`, `connections`, `provenance`, or any other field outside `expectations`.
- Never applies play-layer or feature-layer generation rules — this is the epic case only.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | product-planning |
| Created | 2026-05-27 |
| Related | `core/components/skills/generate-intent-epics`, `core/components/skills/validate-intent-epics`, `core/components/agents/epic-expectation-crafter`, `core/components/memory/standards/schemas/intent-epic.yaml` |
