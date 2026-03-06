# Agent Contract Schema

The universal protocol for recipe→agent communication. Every recipe sends this. Every agent receives this. No exceptions.

## Input Contract (recipe → agent)

```json
{
  "intent_path": "<path to recipe's reference/intent.yaml>",
  "stm_base": "<resolved from core/config.yaml stm.base-path>",
  "stm": {
    "input": {
      "<named_key>": "<path to input artifact in STM>"
    },
    "output": {
      "<named_key>": "<path where agent should write output artifact>"
    }
  },
  "task_id": "<unique task identifier from compiled recipe step>"
}
```

### Field definitions

| Field | Required | Source | Description |
|-------|----------|--------|-------------|
| `intent_path` | Yes | Recipe's `reference/intent.yaml` | Agent reads this to understand constraints, failure conditions, scenarios |
| `stm_base` | Yes | `core/config.yaml` → `stm.base-path` | Root path for all STM artifacts. Resolved during pre-flight. |
| `stm.input` | Yes | Prior steps' `stm.output` paths | Named paths to artifacts this step needs to read. Empty `{}` if first step. |
| `stm.output` | Yes | Compiler determines during compilation | Named paths where agent writes its artifacts. Become `stm.input` for downstream steps. |
| `task_id` | Yes | Compiled step ID | Unique within the recipe. Also used as key in the status file for pause/resume. |

### STM path convention

All paths follow: `{stm_base}/{issue}/evidence/{recipe-name}/{artifact}.yaml`

Example:
```
stm_base = .meridian/project/issues/
issue = 95
recipe = commit-code

→ .meridian/project/issues/95/evidence/commit-code/analysis.yaml
```

## Output Contract (agent → recipe)

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

### Field definitions

| Field | Description |
|-------|-------------|
| `status` | `completed` = success, `failed` = unrecoverable, `blocked` = needs external help |
| `stm.input` | Echoed from input contract (for traceability) |
| `stm.output` | Enriched — may add paths beyond what was requested if agent discovered additional artifacts |
| `task_id` | Echoed from input (for status file matching) |
| `error` | `null` on success. Structured failure object on failure (per `structured-failure-protocol.md`) |

## Wiring Rule

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

## Transfer Mechanism

At runtime, the recipe executor (Claude Code) reads the JSON contract from the compiled SKILL.md step and passes it to the agent via the `Agent` tool prompt. The agent parses the contract, reads from `stm.input` paths, does its work, writes to `stm.output` paths, and returns the output contract.
