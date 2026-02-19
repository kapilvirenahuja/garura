# Recipes

Recipes are human-invocable workflows that define the order of operations for Phoenix OS.

## Philosophy

Recipes define **what to do and in what order**. They are the entry points for all Phoenix OS workflows.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Never forked** | Recipes define steps/order — forking loses meaning |
| **Artifact-producing** | Every recipe produces tangible output |
| **Checkpoint-ending** | Recipes stop for approval at defined points |
| **Deterministic** | Same recipe = same flow, predictable behavior |

## Recipe Levels

Phoenix OS has a three-layer hierarchy:

| Level | Invocability | Constraints | Purpose |
|-------|--------------|-------------|---------|
| **L1** | Human OR Model | ≤2 distinct agents | Atomic activities |
| **L2** | Human only | ≤5 distinct agents (ideal 3) | High-order workflows |
| **L3** | TBD | TBD | Not yet designed |

### When to Use Each Level

| Use L1 When | Use L2 When |
|-------------|-------------|
| Single-purpose task | Multi-step workflow |
| Can be model-invoked | Needs human oversight |
| Produces one artifact | Chains multiple artifacts |
| Simple checkpoint | Multiple checkpoints |

## L1 Recipes (Atomic Activities)

L1 recipes are the building blocks of Phoenix OS workflows.

### L1 Properties

1. **Atomic** — Single, focused purpose
2. **Artifact-producing** — Always creates a tangible output
3. **Checkpoint-ending** — Always stops for approval
4. **Flexible invocability** — Human OR model can invoke

### L1 Flow Pattern

```
L1 Recipe
    │
    └── Agent: {single agent}
              │
              └── Agent uses skills as needed
              │
              └── Agent produces ARTIFACT
    │
    └── CHECKPOINT: Present artifact for approval
```

### L1 Constraints

- Maximum 2 distinct agents (an agent may be called multiple times)
- Exactly one artifact produced
- Must end at a checkpoint
- Recovery agent calls are exempt from the agent limit

## L2 Recipes (High-Order Workflows)

L2 recipes chain L1 recipes together to accomplish complex goals.

### L2 Properties

1. **Chaining** — Sequences multiple L1 recipes
2. **Guardian-validated** — Each checkpoint can be auto-approved
3. **Human-only** — Only humans can start L2 workflows
4. **Goal-oriented** — Represents user intent

### L2 Flow Pattern

```
L2 Recipe
    │
    ├── L1: {first step}
    │       Artifact: {output}
    │       └── CHECKPOINT ◄── [Guardian: skip?]
    │
    ├── L1: {second step}
    │       Artifact: {output}
    │       └── CHECKPOINT ◄── [Guardian: skip?]
    │
    └── L1: {final step}
            Artifact: {final output}
            └── DONE
```

### Guardian Logic

The workflow guardian evaluates at each checkpoint:

| Criterion | Question |
|-----------|----------|
| **Quality** | Does artifact meet threshold? |
| **Security** | Any security concerns? |
| **Breaking** | Will this break existing functionality? |
| **Risk** | Within acceptable risk tolerance? |

```
ALL criteria pass → Skip human approval
ANY criterion fails → Stop for human approval
```

### L2 Constraints

- Maximum 5 distinct agents (ideal 3; each may be called multiple times)
- Human-invocable only
- Each L1 must complete before next starts
- Guardian validates between L1s
- Recovery agent calls are exempt from the agent limit

## Naming Conventions

Both L1 and L2 recipes follow the **`{action}-{object}`** pattern:

| Component | Description | Examples |
|-----------|-------------|----------|
| **action** | Verb describing what to do | analyze, design, implement, validate |
| **object** | Noun describing the target | bug, fix, feature, code |

The level (L1/L2) is indicated in the recipe metadata, not the name.

## Recipe Definition Structure

Recipes follow Claude's skill/command format:

### Three Elements of Intent (Required)

Every recipe MUST declare the Three Elements of Intent in its YAML front-matter. This is a foundational IDD requirement — see [Intent-Driven Development](../philosophy/intent-driven-development.md#the-three-elements-of-intent).

| Element | What It Captures | Purpose |
|---------|-----------------|---------|
| **intent** | The positive space — what outcome this recipe achieves | Agents check: "Am I moving toward this?" / "Have I achieved this?" |
| **constraints** | The boundaries the solution must respect | Agents check: "Am I within these?" |
| **failure_conditions** | The halt signals — when to assess recovery or abort | Agents check: "Has any of these been triggered?" → assess recovery → HALT if unrecoverable |

**Rules:**
- `intent` is a single string in business language (not technical). It must be self-evidently testable.
- `constraints` is an ordered list (hardest first). Use MUST/SHOULD for severity.
- `failure_conditions` is a list of halt triggers. When triggered, the agent enters the **recovery reasoning loop** (see below) before halting.
- `description` is kept alongside `intent` — it serves Claude Code's skill discovery; `intent` serves IDD agent decision-making.

### Intent-Driven Recovery

When a failure condition is triggered during recipe execution, the agent MUST NOT halt immediately. Instead, it follows the **recovery reasoning loop** — deriving recovery paths from the IDD elements themselves.

#### Recovery Reasoning Loop

```
Failure condition triggered
    │
    ├── Read intent: "What am I trying to achieve?"
    ├── Read constraint violated: "What boundary was hit?"
    ├── Assess: "Can I satisfy this constraint through another path?"
    │
    ├── YES → Propose recovery (with checkpoint approval)
    │         User approves (Tether) → Execute recovery → Continue workflow
    │         User rejects (Vanish) → HALT
    │
    └── NO → HALT (intent is unreachable)
```

#### Recovery Principles

| Principle | Description |
|-----------|-------------|
| **Intent-first** | Recovery serves the declared intent, not a prescribed procedure |
| **Constraint-respecting** | Recovery must satisfy ALL constraints — never bypass them |
| **Agent-reasoned** | Recovery paths are derived at runtime, not hardcoded in recipes |
| **Checkpoint-gated** | Recovery always requires user approval before execution |
| **Skill-delegated** | Recovery actions delegate to existing skills and agents |

#### How It Works

The agent uses the Three Elements of Intent as its reasoning inputs:

- **Intent** tells the agent WHAT to achieve — the goal doesn't change because of an obstacle
- **Constraints** tell the agent WHERE the boundaries are — recovery must find a path within them
- **Failure conditions** tell the agent WHEN to start recovery reasoning — they are triggers, not stop signs

Recipes MUST NOT hardcode recovery procedures. The agent reasons about recovery dynamically. This keeps recipes declarative and lets agent intelligence handle the "how".

#### What Recipes Declare vs. What Agents Derive

| Recipes declare (static) | Agents derive (dynamic) |
|--------------------------|------------------------|
| Intent — the outcome | Whether the intent is still achievable |
| Constraints — the boundaries | Which constraint is blocking and how to satisfy it |
| Failure conditions — the triggers | Whether recovery is possible and what it looks like |

#### Example: Agent Recovery Reasoning

```
Triggered: "Current branch is a protected branch"
Intent:    "Persist completed work as conventional commits with traceability"
Violated:  "MUST NOT commit on protected branches"

Agent reasons:
  - Intent is to commit code. That hasn't changed.
  - The constraint says I need a feature branch, not that I should stop.
  - I know the setup-branch skill exists. I need an issue ID to name the branch.
  - Recovery: resolve issue ID → create feature branch → continue workflow.
  - This satisfies the constraint without abandoning the intent.
  → Propose recovery to user.
```

### L1 Recipe Structure

```yaml
---
name: {action}-{object}
level: L1
invocable: human OR model
description: {short summary for CLI/tooling discovery}
agent: {agent to invoke}
artifact: {path to artifact}

# === Three Elements of Intent (IDD) ===
intent: >
  {Business outcome this recipe achieves. WHY/WHAT, never HOW.}

constraints:
  - {Boundary the solution must respect}
  - {Another boundary}

failure_conditions:
  - {Condition that means HALT — intent is unreachable}
  - {Another halt condition}
---

# Recipe Instructions

[Steps for the recipe to follow...]

## Inputs

[Required inputs...]

## Outputs

[Expected outputs...]
```

### L2 Recipe Structure

```yaml
---
name: {action}-{object}
level: L2
invocable: human
description: {short summary for CLI/tooling discovery}
l1-recipes:
  - {first L1}
  - {second L1}
  - {third L1}

# === Three Elements of Intent (IDD) ===
intent: >
  {Business outcome this workflow achieves. WHY/WHAT, never HOW.}

constraints:
  - {Boundary the solution must respect}
  - {Another boundary}

failure_conditions:
  - {Condition that means HALT — intent is unreachable}
  - {Another halt condition}
---

# Workflow Instructions

[How the workflow chains L1s...]

## Guardian Rules

[When to auto-approve vs stop...]
```

## Why Recipes Are Never Forked

Forking a recipe would:
1. Lose the defined order of operations
2. Create unpredictable behavior
3. Break the determinism guarantee
4. Lose context between steps

Recipes are **orchestrators** — they coordinate, not execute.

## Artifact Locations

| Artifact Type | Location Pattern |
|---------------|------------------|
| Documentation | `.phoenix-os/{issue}/docs/` |
| Evidence | `.phoenix-os/{issue}/evidence/` |
| External | Returned directly (URLs, IDs) |

## Recipe Location

Recipe definitions are stored in:

```
core/components/recipes/
├── l1/       # L1 recipe definitions
├── l2/       # L2 recipe definitions
└── meta/     # Meta-recipes (build Phoenix itself)
```

See: [docs/usage/recipes/](../usage/recipes/) for concrete implementations.

## Task Framework Integration

Recipes use Claude's task framework (TaskCreate, TaskUpdate, TaskList, TaskGet) for workflow visibility and state management.

### Why Task Framework?

| Benefit | Description |
|---------|-------------|
| **Visibility** | `TaskList` shows full workflow progress at any time |
| **State Management** | Task metadata stores workflow state between invocations |
| **Agent Resume** | agentId stored in metadata enables reliable resume |
| **Audit Trail** | All decisions recorded in task metadata |
| **Extensibility** | Agents can add subtasks for discovered work |

### Task-Driven Recipe Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ Recipe (L1)                                                 │
│                                                             │
│  1. TaskCreate: analysis-task                               │
│  2. TaskCreate: checkpoint-task (blockedBy: #1)             │
│  3. TaskCreate: execution-task (blockedBy: #2)              │
│                                                             │
│  4. Assign & invoke agent for task #1                       │
│  5. Agent completes task #1, stores agentId in metadata     │
│  6. Recipe evaluates checkpoint, completes task #2          │
│  7. Resume agent for task #3 (using stored agentId)         │
│  8. Agent completes task #3                                 │
│  9. Recipe generates final report from task metadata        │
└─────────────────────────────────────────────────────────────┘
```

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
    _phoenix:                  # Phoenix-internal namespace
      recipeId: string         # Links task to recipe instance
      invocation: number       # 1, 2, ... for resume tracking
      agentId: string          # For resuming agent
      checkpointDecision: pending|approved|rejected|auto-approved
    # Domain data stored alongside
    analysisResult: {...}
    commitResult: {...}
```

### Task Lifecycle in Recipes

1. **Recipe creates task graph** with dependencies (`blockedBy`)
2. **Recipe assigns task** to agent via Task tool prompt
3. **Agent fetches task** with TaskGet, updates status to `in_progress`
4. **Agent executes work** (invokes skills)
5. **Agent completes task** with TaskUpdate, stores results in metadata
6. **Recipe reads results** from task metadata for next step
7. **Repeat** for subsequent tasks

### Metadata Conventions

| Key | Purpose | Set By |
|-----|---------|--------|
| `_phoenix.recipeId` | Links task to recipe instance | Recipe |
| `_phoenix.invocation` | Tracks invocation number | Recipe |
| `_phoenix.agentId` | Enables agent resume | Agent |
| `_phoenix.checkpointDecision` | Records approval outcome | Recipe |
| `analysisResult` | Analysis output | Agent |
| `commitResult` | Execution output | Agent |

### Example: Task Progression

```
Initial state (after Step 1):
  #1 [pending] Analyze changes
  #2 [pending] Checkpoint decision (blocked by #1)
  #3 [pending] Execute commits (blocked by #2)

After agent completes analysis:
  #1 [completed] Analyze changes ✓
  #2 [pending] Checkpoint decision
  #3 [pending] Execute commits (blocked by #2)

After checkpoint approval:
  #1 [completed] Analyze changes ✓
  #2 [completed] Checkpoint decision ✓
  #3 [pending] Execute commits

After agent completes execution:
  #1 [completed] Analyze changes ✓
  #2 [completed] Checkpoint decision ✓
  #3 [completed] Execute commits ✓
```

### When to Use Task Framework

| Use Tasks | Skip Tasks |
|-----------|------------|
| Multi-step workflows | Single atomic operation |
| Need workflow visibility | Simple skill invocation |
| Resume across invocations | No state to preserve |
| Audit trail required | Ephemeral operations |

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [Agents Component Guide](./phx-agents.md)
- [Skills Component Guide](./phx-skills.md)
