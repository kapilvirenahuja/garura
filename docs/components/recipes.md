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
    └── Agent(s): {≤2 distinct agents}
              │
              └── Agents use skills as needed
              │
              └── Agents produce ARTIFACT
    │
    └── CHECKPOINT: Present artifact for approval
```

### L1 Constraints

- Maximum 2 distinct agents (an agent may be called multiple times)
- Exactly one artifact produced
- Must end at a checkpoint
- Recovery agent calls are exempt from the agent limit
- Claude built-in sub-agents (Plan, Explore, Task) are exempt from the agent limit — they are tools, not domain agents

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

Recipes follow Claude's skill/command format with a standardized directory structure and externalized intent.

### Recipe Directory Structure

Every recipe is a self-contained directory:

```
{recipe-name}/
├── SKILL.md              # Recipe execution blueprint
├── reference/
│   └── intent.yaml       # First-class intent schema (operational contract)
└── templates/
    ├── checkpoint.md      # Checkpoint artifact template
    ├── approval-prompt.md # User-facing Tether/Vanish approval prompt
    └── {recipe-specific}.md  # Recipe-specific templates (e.g., final-report.md)
```

**Reference implementation:** `core/components/recipes/create-pr/` is the golden standard for this structure.

### Three Elements of Intent (Required)

Every recipe MUST declare the Three Elements of Intent. These are **externalized** to `reference/intent.yaml` as a first-class schema file — not embedded in SKILL.md frontmatter. This is a foundational IDD requirement — see [Intent-Driven Development](../philosophy/intent-driven-development.md#the-three-elements-of-intent).

| Element | What It Captures | Purpose |
|---------|-----------------|---------|
| **intent** | The positive space — what outcome this recipe achieves | Agents check: "Am I moving toward this?" / "Have I achieved this?" |
| **constraints** | The boundaries the solution must respect (pre-flight + behavioral) | Agents check: "Am I within these?" |
| **failure_conditions** | The halt signals — when to assess recovery or abort | Agents check: "Has any of these been triggered?" → assess recovery → HALT if unrecoverable |

**Intent externalization pattern:**

The intent schema lives in `reference/intent.yaml` with structured constraint categories:

```yaml
intent: "{business outcome — WHY/WHAT, never HOW}"

constraints:
  pre_flight:
    - id: C1
      check: "{environmental condition to verify before work begins}"
      halt_message: "{message shown when this check fails}"
    # ... one entry per pre-flight check

  behavioral:
    - id: CN
      rule: "{behavioral constraint that applies during execution}"
    # ... one entry per behavioral rule

failure_conditions:
  - "{condition that means HALT — intent is unreachable}"
```

SKILL.md references this file via a load directive in its `## Intent` section — it does NOT duplicate the schema inline.

**Rules:**
- `intent` is a single string in business language (not technical). It must be self-evidently testable.
- `constraints.pre_flight` are environmental conditions checked in Step 0; failures are **hard halts** (not recoverable).
- `constraints.behavioral` are rules that apply during execution; agents receive relevant subsets via recipe context blocks.
- `failure_conditions` is a list of halt triggers. When triggered, the recipe enters the **recovery reasoning loop** (see below).
- `description` is kept in SKILL.md frontmatter — it serves Claude Code's skill discovery; `intent` (in `reference/intent.yaml`) serves IDD agent decision-making.

### Intent-Driven Recovery

Recovery in recipes follows a two-tier model: **pre-flight hard halts** and **runtime recovery loops**.

#### Pre-flight Hard Halts

Pre-flight constraints (checked in Step 0) represent environmental conditions the agent cannot fix. When a pre-flight check fails, the recipe halts immediately with the constraint's `halt_message` from `reference/intent.yaml`. No recovery is attempted.

Examples of pre-flight failures (from `create-pr`):
- Current branch is protected (main/master/develop)
- No commits to push
- Merge conflicts detected
- No issue number extractable from branch name

#### Runtime Recovery Loop

When a failure condition is triggered during Steps 1+ (not pre-flight), the recipe follows the **recovery reasoning loop** — deriving recovery paths from the IDD elements themselves.

```
Agent returns structured failure
    │
    ├── Read domain_assessment.responsible_domain
    │   (identifies which agent can fix it)
    │
    ├── Invoke responsible agent with:
    │   - fix context + original intent + retry metadata
    │
    ├── Max retries per step (typically 1-2)
    │
    ├── Success → continue workflow
    └── Retries exhausted → HALT with full failure context
```

Recovery reasoning is loaded from LTM: `docs/framework/intent-driven-recovery.md`

**Retry context added to recipe context bundle:**
```yaml
retry:
  previous_failure: "{what_failed}"
  fix_applied: "{what was done to fix it}"
  attempt: {N}
```

#### Recovery Principles

| Principle | Description |
|-----------|-------------|
| **Intent-first** | Recovery serves the declared intent, not a prescribed procedure |
| **Constraint-respecting** | Recovery must satisfy ALL constraints — never bypass them |
| **Agent-reasoned** | Recovery paths are derived at runtime, not hardcoded in recipes |
| **Single section** | All recovery logic lives in `## Recovery` — not scattered across steps |
| **Skill-delegated** | Recovery actions delegate to existing skills and agents |
| **Pre-flight exempt** | Pre-flight failures are hard halts — environmental conditions agents cannot fix |

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

### L1 Recipe Structure (Golden Standard)

Based on `create-pr` — the reference implementation for all L1 recipes.

#### SKILL.md

```yaml
---
name: {action}-{object}
description: {short summary for CLI/tooling discovery}
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---
```

```markdown
# {recipe-name}

{One-line description of what the recipe does.}

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your
operational contract: intent, pre-flight constraints, behavioral constraints,
and failure conditions. All constraint IDs referenced in this recipe map to
that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to
agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

**Agent boundaries:**
- `{agent-name}` — {domain} only: {what this agent handles}

## Phases

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | {agent} |
| Step 1 | {name} | {agent} |
| Step 2 | Checkpoint | orchestrator |
| Step 3 | Execute | {agent} |
| Step 4 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

{Invoke agent to check environmental preconditions.}

Provide recipe context:
  ```yaml
  ---
  Recipe context:
    intent: "{what this step achieves}"
    task: "Read `reference/intent.yaml`. Run every check in
           `constraints.pre_flight`. Return pass/fail for each.
           Do NOT halt — just return results."
  ```

{Orchestrator validates results — halt on any FAIL with that
constraint's `halt_message` from `reference/intent.yaml`.}

### Step N — {Name}

{Provide recipe context block with dynamic references:}

  ```yaml
  ---
  Recipe context:
    intent: "{what this step achieves}"
    task: "{specific directive}"
    pre_flight: {all results from Step 0}
    behavioral_constraints: {all behavioral constraints from reference/intent.yaml}
  ```

{Expected output structure.}
{One-line reference to Recovery section for failures.}

### Step N — Checkpoint

**The orchestrator owns this step entirely. Do not delegate.**

{Write checkpoint artifact using `templates/checkpoint.md`.}
{Present approval using `templates/approval-prompt.md`.}
{Parse Tether/Vanish.}

### Step N — Report

**The orchestrator owns this step entirely. Do not delegate.**

{Present report using `templates/{report-template}.md`.}
{Update checkpoint artifact.}

## Recovery

Load recovery reasoning from:
`docs/framework/intent-driven-recovery.md`

{Structured failure protocol — max N retries per step.}
{Pre-flight failures are hard halts — not recoverable.}

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract |
| Checkpoint | `templates/checkpoint.md` | STM artifact |
| Approval | `templates/approval-prompt.md` | Tether/Vanish prompt |

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | {semver} |
| Distinct Agents | {count} ({names}) |
| Checkpoint | Always / Conditional |
```

#### reference/intent.yaml

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

#### Key Structural Rules

| Rule | Rationale |
|------|-----------|
| Intent lives in `reference/intent.yaml`, not SKILL.md | Intent is a first-class schema that can grow independently |
| Agent context blocks reference `reference/intent.yaml` dynamically | Adding new constraints to the file is automatically picked up |
| Templates live in `templates/` directory | Separation of concerns — templates change independently of workflow |
| Pre-flight is always Step 0 | Environmental conditions must be verified before any work begins |
| Recovery is a single section, not scattered inline | One place for all failure handling |
| Version table is mandatory | Explicit level, agent count, and checkpoint behavior |

### L2 Recipe Structure

L2 recipes chain L1 recipes together. They follow the same directory structure (`SKILL.md` + `reference/` + `templates/`) with these differences:

```yaml
---
name: {action}-{object}
description: {short summary for CLI/tooling discovery}
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---
```

```markdown
# {recipe-name}

## Intent

**BEFORE executing any step, read `reference/intent.yaml`**

## Role

{Same orchestrator pattern — delegates to agents, never executes directly.}

## Phases

{Table showing L1 recipe chain with guardian gates between them.}

## Workflow

{Each step invokes an L1 recipe, with guardian validation between steps.}

## Guardian Rules

{Criteria for auto-approve vs stop at each checkpoint.}

## Recovery

{Same recovery pattern as L1.}

## References

{Intent file + all templates.}

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | {semver} |
| Distinct Agents | {count} |
| Checkpoint | {behavior} |
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
| Specifications | `.phoenix-os/{issue}/spec/` |
| Design | `.phoenix-os/{issue}/design/` |
| Evidence | `.phoenix-os/{issue}/evidence/` |
| Delivery | `.phoenix-os/{issue}/delivery/` |
| Checkpoints | `.phoenix-os/{issue}/checkpoint/{recipe-name}/{timestamp}.md` |
| External | Returned directly (URLs, IDs) |

## Recipe Location

Recipe definitions are stored in a flat directory structure:

```
core/components/recipes/
├── create-pr/           # Golden standard reference implementation
│   ├── SKILL.md
│   ├── reference/
│   │   └── intent.yaml
│   └── templates/
│       ├── checkpoint.md
│       ├── approval-prompt.md
│       └── final-report.md
├── commit-code/
│   ├── SKILL.md
│   ├── reference/
│   │   └── intent.yaml
│   └── templates/
├── start-feature/
│   ├── SKILL.md
│   ├── reference/
│   │   └── intent.yaml
│   └── templates/
├── start-feature-planning/
│   ├── SKILL.md
│   ├── reference/
│   │   └── intent.yaml
│   └── templates/
└── ...
```

Each recipe is a self-contained directory with its execution blueprint (`SKILL.md`), externalized intent (`reference/intent.yaml`), and templates (`templates/`).

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
