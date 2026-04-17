# Plays

Plays are human-invocable workflows that define the order of operations for Garura.

## Philosophy

Plays define **what to do and in what order**. They are the entry points for all Garura workflows.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Never forked** | Plays define steps/order — forking loses meaning |
| **Artifact-producing** | Every play produces tangible output |
| **Checkpoint-gated** | Plays stop for approval at defined points |
| **Deterministic** | Same play = same flow, predictable behavior |

## Plays

Per ADR 017 (2026-04-14), play levels (L1/L2) and agent-count budgets are retired. A play is just a play — coherence is enforced by the intent schema (constraints, failure conditions, scenarios) and by evals, not by a level or agent-count ceiling. Play authors focus on structural correctness, not compliance bookkeeping.

Plays still distinguish themselves along two axes:

- **Invocability**: some plays are human-only (they stop at checkpoints waiting for Tether/Vanish); others can be model-invoked for automated sequencing.
- **Chaining**: some plays chain other plays (e.g., `ship` chains `commit-code` → `create-pr` → `review-pr` → `merge-pr`); most are standalone.

Neither of these requires a level label.

## Two Play Patterns

Two patterns coexist in the codebase. The pattern used depends on the play's execution model.

### Pattern A — Linear Step Plays

Used by plays (commit-code, create-pr) and plays that chain other plays (ship). Steps execute in sequence with a fixed phase structure.

```
PRE-FLIGHT → [PRE-EXECUTION] → CHECKPOINT → EXECUTE → REPORT
```

Each step passes a **play context block** (YAML) to agents:

```yaml
---
Play context:
  intent: "{what this step achieves}"
  task: "{specific directive}"
  pre_flight: {results from Step 0}
  behavioral_constraints: {constraints from reference/intent.yaml}
```

**Conditional step skipping** is valid in plays. `ship` skips the commit step when the working tree is already clean, and skips PR creation when a PR already exists.

**Plays can delegate to other plays.** `ship` invokes `commit-code` and `create-pr` as sub-plays via the Skill tool, passing `ship_context.auto_approve: true` to suppress their interactive checkpoints.

### Pattern B — Task-Driven DAG Plays

Used by plays like `prepare-epic`. The play creates the full task graph upfront using TaskCreate with `blockedBy` dependencies, then executes capabilities in dependency order. Agents communicate via a **JSON contract** rather than per-step YAML context blocks.

```
Pre-flight → Create Task Graph → Execute Capabilities (in dependency order) → Checkpoint → Execute Post-Checkpoint Capabilities → Report
```

**HARD GATE: All tasks MUST be created with correct dependencies before any agent execution begins.** The play does not proceed until the full task graph is verified — every capability task exists, every `blockedBy` link is set, and the checkpoint task is in the graph.

## JSON Contract

The JSON contract is the primary communication mechanism in task-driven plays. A single contract object is created at the start of the workflow and flows through every agent invocation. Each agent enriches it by populating null fields with artifact paths it produces.

### Contract Structure

```json
{
  "intent_path": "reference/intent.yaml",
  "stm_base": ".garura/project/product/",
  "slug": "<derived from input>",
  "stm": {
    "vision_path": "<input path>",
    "epics_path": null,
    "feasibility_path": null,
    "brief_path": null,
    "approved_brief_path": null,
    "roadmap_path": null,
    "engineering_view_path": null
  },
  "checkpoints": [
    { "name": "brief_review", "status": "pending" }
  ],
  "evidence": [
    { "name": "prepare-epic", "location": null }
  ],
  "notes": [],
  "step_failure": null
}
```

### Contract Fields

| Field | Owner | Purpose |
|-------|-------|---------|
| `intent_path` | Play | Path to intent.yaml — agents read it directly |
| `stm_base` | Play | Base path for all STM artifacts |
| `slug` | Play | Identifier derived from the input (e.g., vision file name) |
| `stm.*` | Agents | Artifact paths — agents populate null fields with paths they produce |
| `checkpoints` | Play | Checkpoint status — play updates after human review |
| `evidence` | Play | Evidence paths — play updates at report step |
| `notes` | Agents | Short observations from the current step (max 3, 1 sentence each). Structured context for downstream agents — not prose. |
| `step_failure` | Agents | Non-null only when the agent cannot recover. Play reads this to decide retry or halt. |

**Note on LTM paths:** The contract carries STM artifact paths (the `stm.*` fields above). Agents ALSO discover and pass LTM paths to skills as separate input parameters during the Context Crafting step. These LTM paths are NOT stored in the contract — they are assembled by the agent at invocation time. Examples: `epic_schema_path` (the schema the skill must conform to) and `template_path` (the template the skill fills). The contract tells agents WHERE prior artifacts landed; LTM discovery tells agents WHAT standards and templates govern the current step.

### How the Contract Flows

1. Play creates the initial contract with input path set, all `stm.*` artifact paths null
2. Play sends the contract to the first agent as the **entire** agent prompt
3. Agent produces artifacts, populates `stm` paths, optionally adds `notes`, returns enriched contract
4. If the agent fails after recovery attempts, it sets `step_failure` instead of populating `stm` paths
5. Play checks `step_failure` first, then validates that expected `stm` paths are non-null
6. Play sends the enriched contract to the next agent — the contract grows through the workflow

### CRITICAL Rule: JSON Contract Is the Entire Agent Prompt

When invoking an agent in a task-driven play, pass **only** the JSON object as the prompt. Do NOT append instructions, field definitions, examples, rules, or any other text after it. Agents read their own definition files and `intent_path` — they already know what to do. Adding instructions overrides agent behavior with potentially wrong information.

If you find yourself writing "Rules:", "For each epic:", or "Example return format:" after the JSON — STOP. Delete it. Send only the JSON.

### `notes` Format

```json
"notes": [
  "5 epics derived — all trace to distinct strategic goals",
  "E2 depends on E1 foundation — sequencing constraint"
]
```

### `step_failure` Format

```json
"step_failure": {
  "step": "scope_epics",
  "error": "insufficient_epics",
  "message": "Only 2 epics identifiable from vision",
  "recovery_attempted": true,
  "recovery_details": "Broadened strategic goal interpretation — still only 2 distinct epics"
}
```

When `step_failure` is non-null, `stm` paths for the failed step remain null. Play checks `step_failure` before checking `stm` paths.

## Play Directory Structure

Every play is a self-contained directory:

```
{play-name}/
├── SKILL.md              # Play execution blueprint
├── reference/
│   └── intent.yaml       # User-facing intent contract
└── templates/
    ├── checkpoint.md      # Checkpoint artifact template
    ├── approval-prompt.md # User-facing Tether/Vanish approval prompt
    └── {play-specific}.md
```

## Intent and System Constraints: Where They Live

**System constraints** (framework guardrails, agent boundaries, forbidden tools, path rules) live in `SKILL.md` — they are not user-facing.

**User-facing intent** (goal, constraints with template refs, failure conditions, validation scenarios) lives in `reference/intent.yaml`.

This separation means agents can read the user contract independently without parsing orchestration logic.

### intent.yaml Schema (Task-Driven Plays)

`prepare-epic` uses the canonical intent.yaml shape — metadata plus the four content fields — readable by both agents and users:

```yaml
name: prepare-epic
description: "Produce implementation-ready design artifacts (features, architecture, tech, scenarios, plan) for a feature."
version: 0.1.0
checksum: "<sha256 of normalized content zone>"

intent: >
  Given a feature specification, produce implementation-ready artifacts
  that a code-builder can execute against: features, architecture, tech,
  verification scenarios, and execution plan — each audited and
  cross-validated before lock.

constraints:
  - id: C1
    rule: "features.yaml must exist and be locked before proceeding to architecture"
  - id: C2
    rule: "Every epic in the plan must trace to at least one feature and one scenario"

failure_conditions:
  - id: F1
    condition: "Any mandatory artifact (features, architecture, tech, scenarios, plan) is missing at lock time"

scenarios:
  - id: S1
    persona: "code-builder"
    given: "A locked execution plan entry and its referenced artifacts"
    then: "Can determine scope, exit gate, and starting file set without asking the author"
```

### intent.yaml Schema (Linear Step Plays)

`commit-code` and `create-pr` use a structured schema with pre-flight and behavioral constraint categories:

```yaml
intent: "{Business outcome. WHY/WHAT, never HOW.}"

constraints:
  pre_flight:
    - id: C1
      check: "{environmental condition}"
      halt_message: "{message if fails}"

  behavioral:
    - id: CN
      rule: "{runtime behavioral constraint}"

failure_conditions:
  - "{Condition that means HALT — intent is unreachable}"
```

## Four Crafts

Garura plays embody four crafts that work together:

| Craft | What | Where |
|-------|------|-------|
| **Intent Crafting** | Define the goal, constraints, and failure conditions | `reference/intent.yaml` |
| **Prompt Crafting** | Pass the JSON contract (task-driven) or play context block (linear) as the agent prompt | `SKILL.md` workflow steps |
| **Context Crafting** | Agents collect LTM templates and STM artifact paths to ground their work | Inside agent definitions |
| **Spec Crafting** | Skills fill templates with structured content to produce artifacts | Inside skill definitions |

## Agent Behavior Inside Plays

When a play invokes an agent, the agent does more than "read STM and call a skill." Agents follow a structured preparation process before invoking any skill:

**1. Constraint validation (first, always).** The agent reads `intent_path` and validates ALL constraints from `intent.yaml` before invoking any skill. If any constraint would be violated, the agent returns a structured failure immediately — no skill is invoked.

**2. Selective LTM discovery.** The agent searches LTM for relevant standards, schemas, and templates that govern the current step (e.g., `epic_schema_path`, `template_path`). It evaluates whether the discovered LTM is sufficient to ground the skill's output. If LTM is insufficient, the agent may fall back to domain research before proceeding.

**3. Skill invocation.** Only after constraints are validated and LTM is assembled does the agent invoke the skill, passing both STM artifact paths (from the contract) and LTM paths (from discovery) as inputs.

**Multi-intent handling.** Agents may process multiple intents in a single invocation (e.g., "scope epics then draft brief"). For plays with a fixed task DAG, this is less relevant — the play controls sequencing. For direct agent invocations outside a play, agents detect all intents in the prompt and process them in dependency order.

## Resume Pattern

Task-driven plays support resuming from a checkpoint. The `--resume` flag instructs the play to:

1. Find the latest checkpoint artifact in `.garura/project/product/checkpoint/{play-name}/`, ordered by timestamp (most recent first)
2. Reconstruct the JSON contract from checkpoint state
3. Route based on checkpoint status:
   - `brief_review.status: pending` → re-present the artifact to the user, continue from the feedback loop
   - `brief_review.status: approved` with downstream `stm` paths null → jump to post-checkpoint execution
4. Report to user what it is resuming from

If no checkpoint is found, the play halts with a message directing the user to start fresh with the full invocation (e.g., `/prepare-epic`).

```
/prepare-epic --resume
```

## Capability Graph (Task-Driven Plays)

Task-driven plays declare a capability graph that defines the execution DAG. This is the static description of what the play will create when it builds the task graph.

Example from `prepare-epic`:

| # | Capability | Agent | Needs | Produces |
|---|------------|-------|-------|----------|
| 1 | Draft product spec (features.yaml) | feature-steward | feature intent | features.yaml |
| 2 | Draft technical approach | tech-designer | features.yaml | technical-approach.md |
| 3 | Draft low-level design | tech-architect | features.yaml, technical-approach.md | tech.yaml |
| 4 | Draft verification scenarios | feature-steward | features.yaml | scenarios.yaml |
| — | CHECKPOINT: human review | orchestrator | features, tech, scenarios | approved_design |
| 5 | Draft execution plan | tech-designer | features, tech, scenarios, approved design | plan.yaml |
| 6 | Cross-validate all artifacts | feature-steward | features, tech, scenarios, plan | validation-result.yaml |

**Capability graph vs. task graph:** The capability graph (6 capabilities + checkpoint) shows WHAT gets produced — the deliverables and their data dependencies. The task graph adds orchestrator-owned tasks that are not capabilities: the human review checkpoint task and the final report task. The two views are complementary: the capability graph is the design-time declaration; the task graph is the runtime execution plan created from it.

## Recovery

### Pre-flight Hard Halts

Pre-flight constraints represent environmental conditions the agent cannot fix. When a pre-flight check fails, the play halts immediately. No recovery is attempted.

### Runtime Recovery Loop

When a failure condition is triggered during Steps 1+:

```
Agent returns structured failure
    │
    ├── Read domain_assessment.responsible_domain
    ├── Invoke responsible agent with fix context + original intent
    ├── Max retries per step (typically 1-2)
    ├── Success → continue workflow
    └── Retries exhausted → HALT with full failure context
```

For retries, the `retry` field is added to the JSON contract (task-driven) or play context block (linear):

```json
"retry": {
  "previous_failure": "{what_failed}",
  "fix_applied": "{what was done to fix it}",
  "attempt": 2
}
```

The agent receiving a retry reads `retry.previous_failure` to understand what went wrong and `retry.fix_applied` to understand what the recovery agent changed. `retry.attempt` tracks how many times this step has been retried so the play can enforce the max retry limit.

Recovery reasoning is loaded from LTM: `docs/framework/intent-driven-recovery.md`

## Complete Play Roster

| Play | Pattern | Purpose |
|--------|---------|---------|
| `commit-code` | Linear | Commit changes grouped by concern with conventional messages |
| `create-pr` | Linear | Create a pull request with review checklist |
| `review-pr` | Linear | Diff-scoped quality review for a pull request |
| `merge-pr` | Linear | Merge a pull request and clean up the branch |
| `start-feature` | Linear | Start a new feature branch from an issue |
| `start-feature-planning` | Linear | Plan a feature before implementation |
| `capture-learning` | Linear | Capture learnings to LTM (archival) |
| `briefs` | Linear | Regenerate HTML briefs from product YAML artifacts |
| `fix-it` | Task-Driven | RCA-driven defect resolution — root-cause trace, design fix, ship |
| `prepare-epic` | Task-Driven | Produce implementation-ready design artifacts (features, tech, scenarios, plan) |
| `implement-epic` | Task-Driven | Implement a feature through an eval-driven TDD loop |
| `create-play` | Task-Driven | Compile a new play from an intent.yaml |
| `ship` | Linear (chains atomic plays) | Deliver branch work — commit, PR, review, merge, return |
| `report-issue` | Linear | Report a defect against Garura |

## Artifact Locations (per ADR 017 whitelist)

| Artifact Type | Location Pattern |
|---------------|------------------|
| Specifications (issue-scoped) | `.garura/project/issues/{N}/specs/` |
| Evidence | `.garura/project/issues/{N}/evidence/{play-name}/{timestamp}.md` |
| Checkpoints | `.garura/project/issues/{N}/checkpoint/{play-name}/{timestamp}.md` |
| Context (prepare-epic, build-arch) | `.garura/project/issues/{N}/context/` |
| Review artifacts | `.garura/project/issues/{N}/review/` |
| Product planning (specify-product output) | `.garura/product/` |
| UX (design-exp output) | `.garura/product/ux/` |
| Architecture (build-arch output) | `.garura/product/arch/` |
| External | Returned directly (URLs, IDs) |

## Task Framework Integration

Plays use Claude's task framework (TaskCreate, TaskUpdate, TaskList, TaskGet) for workflow visibility and state management.

### Why Task Framework?

| Benefit | Description |
|---------|-------------|
| **Visibility** | `TaskList` shows full workflow progress at any time |
| **State Management** | Task metadata stores workflow state between invocations |
| **Agent Resume** | agentId stored in metadata enables reliable resume |
| **Audit Trail** | All decisions recorded in task metadata |
| **Extensibility** | Agents can add subtasks for discovered work |

### Task Schema

```yaml
task:
  id: string
  subject: string              # "Analyze uncommitted changes"
  description: string          # Full task details
  activeForm: string           # "Analyzing changes" (for spinner)
  status: pending|in_progress|completed
  owner: string                # "repo-orchestrator"
  blockedBy: [taskId]
  metadata:
    _garura:                   # Garura-internal namespace
      playId: string         # Links task to play instance
      invocation: number       # 1, 2, ... for resume tracking
      agentId: string          # For resuming agent
      checkpointDecision: pending|approved|rejected|auto-approved
```

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [Agents Component Guide](./agents.md)
- [Skills Component Guide](./skills.md)
- [Play Structure Standard](../framework/play-structure.md)
