# ADR 016 — Agent JSON Contract

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


**Status:** Accepted
**Date:** 2026-04-13
**Supersedes:** none
**Related:** ADR 001 (three-layer hierarchy), ADR 011 (STM as inter-skill data transport), ADR 015 (LTM resolution protocol)

## Context

Plays orchestrate agents. Agents do domain work via skills. The boundary between play and agent is invoked tens of times across a single L2 run, and historically there was no enforced shape for that handoff — each play invented its own prompt format, each agent parsed differently, and reading STM artifacts was implicit.

This made three things hard:
1. **Compile-time auditing.** `create-play` could not statically verify that a play step gives an agent everything it needs (P1, P11 in the agent audit checklist).
2. **Pause/resume.** Without a `task_id` keyed to a status file, plays could not deterministically skip completed steps on resume.
3. **Inter-step wiring.** Each step's outputs become the next step's inputs. Without a named contract, this wiring lived in prose, drifted, and broke silently.

Every play → agent dispatch must follow a single canonical schema, and `create-play` must enforce it.

## Decision

The universal protocol for play → agent communication is the **Agent JSON Contract**. Every play step that dispatches to an agent serializes this contract; every agent parses this contract. No exceptions.

### Input Contract (play → agent)

```json
{
  "intent_path": "<path to play's reference/intent.yaml>",
  "stm_base": "<resolved from .meridian/core/config.yaml stm.base-path>",
  "stm": {
    "input": {
      "<named_key>": "<path to input artifact in STM>"
    },
    "output": {
      "<named_key>": "<path where agent should write output artifact>"
    }
  },
  "task_id": "<unique task identifier from compiled play step>"
}
```

| Field | Required | Source | Description |
|-------|----------|--------|-------------|
| `intent_path` | Yes | Play's `reference/intent.yaml` | Agent reads this to understand constraints, failure conditions, scenarios |
| `stm_base` | Yes | `.meridian/core/config.yaml` → `stm.base-path` | Root path for all STM artifacts. Resolved during pre-flight. |
| `stm.input` | Yes | Prior steps' `stm.output` paths | Named paths to artifacts this step needs to read. Empty `{}` if first step. |
| `stm.output` | Yes | Compiler determines during compilation | Named paths where agent writes its artifacts. Become `stm.input` for downstream steps. |
| `task_id` | Yes | Compiled step ID | Unique within the play. Also used as key in the status file for pause/resume. |
| `ltm_context` | No | Object with `project_base`, `core_base`, `query_domains`, `locked_artifacts`. When present, agent follows R1–R4 from ADR 015 (resolution protocol). |

### STM path convention

All paths follow:
```
{stm_base}/{issue}/evidence/{play-name}/{artifact}.yaml
```

Example:
```
stm_base = .meridian/project/issues/
issue    = 95
play   = commit-code

→ .meridian/project/issues/95/evidence/commit-code/analysis.yaml
```

### Output Contract (agent → play)

```json
{
  "status": "completed | failed | blocked",
  "stm": {
    "input": { "<echoed from input>" },
    "output": {
      "<named_key>": "<actual path written>"
    }
  },
  "task_id": "<echoed from input>",
  "error": null
}
```

| Field | Description |
|-------|-------------|
| `status` | `completed` = success, `failed` = unrecoverable, `blocked` = needs external help |
| `stm.input` | Echoed from input contract (for traceability) |
| `stm.output` | Enriched — may add paths beyond what was requested if agent discovered additional artifacts |
| `task_id` | Echoed from input (for status file matching) |
| `error` | `null` on success. Structured failure object on failure (per `structured-failure-protocol.md`) |
| `resolution_trace_path` | Path to resolution trace YAML in STM. Written when `ltm_context` was provided in the input. Contains per-decision entries with `resolved_from` (project/core/llm), source path, and value. |

### Wiring Rule

Each step's `stm.input` contains the `stm.output` paths from the steps it depends on:

```
Step 1 output: { "analysis": ".../analysis.yaml" }
                    ↓
Step 2 input:  { "analysis": ".../analysis.yaml" }
Step 2 output: { "issue_mappings": ".../issue-mappings.yaml" }
                    ↓
Step 5 input:  { "analysis": ".../analysis.yaml",
                 "issue_mappings": ".../issue-mappings.yaml" }
```

No step reads data that wasn't explicitly produced by a prior step's output contract.

### Transfer Mechanism

At runtime, the play executor (Claude Code) reads the JSON contract from the compiled SKILL.md step and passes it to the agent via the `Agent` tool prompt. The agent parses the contract, reads from `stm.input` paths, does its work, writes to `stm.output` paths, and returns the output contract.

### Resolution Protocol Hook

When `ltm_context` is present in the input contract, agents follow the R1–R4 resolution protocol defined in ADR 015 (`resolution-protocol.md`). This protocol establishes a 3-layer knowledge hierarchy (project LTM → core LTM → LLM reasoning) and produces a resolution trace documenting where each domain decision came from.

`ltm_context` is optional. Agents that do not receive it continue operating with their existing behavior — backward compatibility is guaranteed.

## Consequences

**Positive**
- `create-play` audit checks (P1 JSON Contract, P11 Context Sufficiency) are enforceable statically.
- Pause/resume is deterministic — `task_id` keys directly into the play's status file.
- Inter-step data flow is explicit and greppable. No more "agent reads X" in prose.
- Adding a new agent requires only that it parse this schema — plays are decoupled from agent internals.
- LTM resolution (ADR 015) plugs in via a single optional field.

**Negative**
- Plays pay a small verbosity cost — every step embeds a JSON block. The benefit (auditability, wiring clarity) outweighs it.
- Agents that pre-date this contract had to be retrofitted (one-time cost, completed).

**Enforcement**
- `create-play` validates every dispatch against this schema during compilation (checklist P1, P7, P11).
- The schema lives in this ADR — it is foundational, not organizational memory. Any change requires a new ADR.
