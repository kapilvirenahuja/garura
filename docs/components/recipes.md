# Recipes

Recipes are human-invocable workflows that define the order of operations for Meridian.

## Philosophy

Recipes define **what to do and in what order**. They are the entry points for all Meridian workflows.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Never forked** | Recipes define steps/order — forking loses meaning |
| **Artifact-producing** | Every recipe produces tangible output |
| **Checkpoint-gated** | Recipes stop for approval at defined points |
| **Deterministic** | Same recipe = same flow, predictable behavior |

## Recipe Levels

| Level | Invocability | Max Agent Calls | Purpose |
|-------|--------------|-----------------|---------|
| **L1** | Human OR Model | ≤2 distinct agents | Atomic activities |
| **L2** | Human only | ≤5 distinct agents (ideal 3) | High-order workflows |

Recovery agent calls and Claude built-in sub-agents (Task, Plan, Explore) are exempt from the agent limit.

### When to Use Each Level

| Use L1 When | Use L2 When |
|-------------|-------------|
| Single-purpose task | Multi-step workflow |
| Can be model-invoked | Needs human oversight |
| Produces one artifact | Chains multiple artifacts |
| Simple checkpoint | Multiple checkpoints or task graph |

## Two Recipe Patterns

Two patterns coexist in the codebase. The pattern used depends on the recipe's execution model.

### Pattern A — Linear Step Recipes

Used by L1 recipes (commit-code, create-pr) and L2 recipes that chain L1s (ship). Steps execute in sequence with a fixed phase structure.

```
PRE-FLIGHT → [PRE-EXECUTION] → CHECKPOINT → EXECUTE → REPORT
```

Each step passes a **recipe context block** (YAML) to agents:

```yaml
---
Recipe context:
  intent: "{what this step achieves}"
  task: "{specific directive}"
  pre_flight: {results from Step 0}
  behavioral_constraints: {constraints from reference/intent.yaml}
```

**Conditional step skipping** is valid in L2 recipes. `ship` skips the commit step when the working tree is already clean, and skips PR creation when a PR already exists.

**L2 recipes can delegate to L1 recipes.** `ship` invokes `commit-code` and `create-pr` as sub-recipes via the Skill tool, passing `ship_context.auto_approve: true` to suppress their interactive checkpoints.

### Pattern B — Task-Driven DAG Recipes

Used by L2 recipes like `plan-roadmap`. The recipe creates the full task graph upfront using TaskCreate with `blockedBy` dependencies, then executes capabilities in dependency order. Agents communicate via a **JSON contract** rather than per-step YAML context blocks.

```
Pre-flight → Create Task Graph → Execute Capabilities (in dependency order) → Checkpoint → Execute Post-Checkpoint Capabilities → Report
```

**HARD GATE: All tasks MUST be created with correct dependencies before any agent execution begins.** The recipe does not proceed until the full task graph is verified — every capability task exists, every `blockedBy` link is set, and the checkpoint task is in the graph.

## JSON Contract

The JSON contract is the primary communication mechanism in task-driven recipes. A single contract object is created at the start of the workflow and flows through every agent invocation. Each agent enriches it by populating null fields with artifact paths it produces.

### Contract Structure

```json
{
  "intent_path": "reference/intent.yaml",
  "stm_base": ".meridian/project/product/",
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
    { "name": "plan-roadmap", "location": null }
  ],
  "notes": [],
  "step_failure": null
}
```

### Contract Fields

| Field | Owner | Purpose |
|-------|-------|---------|
| `intent_path` | Recipe | Path to intent.yaml — agents read it directly |
| `stm_base` | Recipe | Base path for all STM artifacts |
| `slug` | Recipe | Identifier derived from the input (e.g., vision file name) |
| `stm.*` | Agents | Artifact paths — agents populate null fields with paths they produce |
| `checkpoints` | Recipe | Checkpoint status — recipe updates after human review |
| `evidence` | Recipe | Evidence paths — recipe updates at report step |
| `notes` | Agents | Short observations from the current step (max 3, 1 sentence each). Structured context for downstream agents — not prose. |
| `step_failure` | Agents | Non-null only when the agent cannot recover. Recipe reads this to decide retry or halt. |

**Note on LTM paths:** The contract carries STM artifact paths (the `stm.*` fields above). Agents ALSO discover and pass LTM paths to skills as separate input parameters during the Context Crafting step. These LTM paths are NOT stored in the contract — they are assembled by the agent at invocation time. Examples: `epic_schema_path` (the schema the skill must conform to) and `template_path` (the template the skill fills). The contract tells agents WHERE prior artifacts landed; LTM discovery tells agents WHAT standards and templates govern the current step.

### How the Contract Flows

1. Recipe creates the initial contract with input path set, all `stm.*` artifact paths null
2. Recipe sends the contract to the first agent as the **entire** agent prompt
3. Agent produces artifacts, populates `stm` paths, optionally adds `notes`, returns enriched contract
4. If the agent fails after recovery attempts, it sets `step_failure` instead of populating `stm` paths
5. Recipe checks `step_failure` first, then validates that expected `stm` paths are non-null
6. Recipe sends the enriched contract to the next agent — the contract grows through the workflow

### CRITICAL Rule: JSON Contract Is the Entire Agent Prompt

When invoking an agent in a task-driven recipe, pass **only** the JSON object as the prompt. Do NOT append instructions, field definitions, examples, rules, or any other text after it. Agents read their own definition files and `intent_path` — they already know what to do. Adding instructions overrides agent behavior with potentially wrong information.

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

When `step_failure` is non-null, `stm` paths for the failed step remain null. Recipe checks `step_failure` before checking `stm` paths.

## Recipe Directory Structure

Every recipe is a self-contained directory:

```
{recipe-name}/
├── SKILL.md              # Recipe execution blueprint
├── reference/
│   └── intent.yaml       # User-facing intent contract
└── templates/
    ├── checkpoint.md      # Checkpoint artifact template
    ├── approval-prompt.md # User-facing Tether/Vanish approval prompt
    └── {recipe-specific}.md
```

## Intent and System Constraints: Where They Live

**System constraints** (framework guardrails, agent boundaries, forbidden tools, path rules) live in `SKILL.md` — they are not user-facing.

**User-facing intent** (goal, constraints with template refs, failure conditions, validation scenarios) lives in `reference/intent.yaml`.

This separation means agents can read the user contract independently without parsing orchestration logic.

### intent.yaml Schema (Task-Driven Recipes)

`plan-roadmap` uses a minimal intent.yaml that is readable by both agents and users:

```yaml
name: plan-roadmap
goal: "Prepare a roadmap"

constraints:
  - id: C-TEMPLATE
    rule: "Follow the roadmap brief template"
    template_ref: "standards/templates/roadmap-brief.html"
  - id: C-LOCKED
    rule: "Vision must be locked before roadmap planning"

failure_conditions:
  - "Fewer than 3 epics"
  - "Roadmap is not internally consistent"

scenarios:
  - id: S1
    persona: "Product Manager"
    given: "Approved roadmap brief"
    then: "Can clearly describe each epic's intent, constraints, and success criteria"
```

### intent.yaml Schema (Linear Step Recipes)

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

Meridian recipes embody four crafts that work together:

| Craft | What | Where |
|-------|------|-------|
| **Intent Crafting** | Define the goal, constraints, and failure conditions | `reference/intent.yaml` |
| **Prompt Crafting** | Pass the JSON contract (task-driven) or recipe context block (linear) as the agent prompt | `SKILL.md` workflow steps |
| **Context Crafting** | Agents collect LTM templates and STM artifact paths to ground their work | Inside agent definitions |
| **Spec Crafting** | Skills fill templates with structured content to produce artifacts | Inside skill definitions |

## Agent Behavior Inside Recipes

When a recipe invokes an agent, the agent does more than "read STM and call a skill." Agents follow a structured preparation process before invoking any skill:

**1. Constraint validation (first, always).** The agent reads `intent_path` and validates ALL constraints from `intent.yaml` before invoking any skill. If any constraint would be violated, the agent returns a structured failure immediately — no skill is invoked.

**2. Selective LTM discovery.** The agent searches LTM for relevant standards, schemas, and templates that govern the current step (e.g., `epic_schema_path`, `template_path`). It evaluates whether the discovered LTM is sufficient to ground the skill's output. If LTM is insufficient, the agent may fall back to domain research before proceeding.

**3. Skill invocation.** Only after constraints are validated and LTM is assembled does the agent invoke the skill, passing both STM artifact paths (from the contract) and LTM paths (from discovery) as inputs.

**Multi-intent handling.** Agents may process multiple intents in a single invocation (e.g., "scope epics then draft brief"). For L2 recipes with a fixed task DAG, this is less relevant — the recipe controls sequencing. For direct agent invocations outside a recipe, agents detect all intents in the prompt and process them in dependency order.

## Resume Pattern

Task-driven recipes support resuming from a checkpoint. The `--resume` flag instructs the recipe to:

1. Find the latest checkpoint artifact in `.meridian/project/product/checkpoint/{recipe-name}/`, ordered by timestamp (most recent first)
2. Reconstruct the JSON contract from checkpoint state
3. Route based on checkpoint status:
   - `brief_review.status: pending` → re-present the artifact to the user, continue from the feedback loop
   - `brief_review.status: approved` with downstream `stm` paths null → jump to post-checkpoint execution
4. Report to user what it is resuming from

If no checkpoint is found, the recipe halts with a message directing the user to start fresh with the full invocation (e.g., `/plan-roadmap`).

```
/plan-roadmap --resume
```

## Capability Graph (Task-Driven Recipes)

L2 task-driven recipes declare a capability graph that defines the execution DAG. This is the static description of what the recipe will create when it builds the task graph.

Example from `plan-roadmap`:

| # | Capability | Agent | Needs | Produces |
|---|------------|-------|-------|----------|
| 1 | Scope epics with IDD fields | product-strategist | vision | epics.yaml |
| 2 | Assess technical feasibility | tech-designer | epics.yaml | feasibility.yaml |
| 3 | Produce reviewable brief | product-strategist | epics, feasibility, vision | brief.html |
| — | CHECKPOINT: human review | orchestrator | brief.html | approved_brief |
| 4 | Produce full roadmap | product-strategist | epics, feasibility, approved brief | roadmap.md |
| 5 | Produce engineering view | product-strategist | roadmap.md | roadmap-engineering.md |

**Capability graph vs. task graph:** The capability graph (5 capabilities + checkpoint) shows WHAT gets produced — the deliverables and their data dependencies. The task graph adds orchestrator-owned tasks that are not capabilities: the human review checkpoint task and the final report task. This brings the total task count to 7 for `plan-roadmap`. The two views are complementary: the capability graph is the design-time declaration; the task graph is the runtime execution plan created from it.

## Recovery

### Pre-flight Hard Halts

Pre-flight constraints represent environmental conditions the agent cannot fix. When a pre-flight check fails, the recipe halts immediately. No recovery is attempted.

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

For retries, the `retry` field is added to the JSON contract (task-driven) or recipe context block (linear):

```json
"retry": {
  "previous_failure": "{what_failed}",
  "fix_applied": "{what was done to fix it}",
  "attempt": 2
}
```

The agent receiving a retry reads `retry.previous_failure` to understand what went wrong and `retry.fix_applied` to understand what the recovery agent changed. `retry.attempt` tracks how many times this step has been retried so the recipe can enforce the max retry limit.

Recovery reasoning is loaded from LTM: `docs/framework/intent-driven-recovery.md`

## Complete Recipe Roster

| Recipe | Level | Pattern | Purpose |
|--------|-------|---------|---------|
| `commit-code` | L1 | Linear | Commit changes grouped by concern with conventional messages |
| `create-pr` | L1 | Linear | Create a pull request with review checklist |
| `start-feature` | L1 | Linear | Start a new feature branch from an issue |
| `start-feature-planning` | L1 | Linear | Plan a feature before implementation |
| `discover-product` | L1 | Linear | Discover and document product requirements |
| `capture-learning` | L1 | Linear | Capture learnings to LTM (archival) |
| `ship` | L2 | Linear (chains L1s) | Deliver branch work — commit, PR, review, merge, return |
| `plan-roadmap` | L2 | Task-Driven DAG | Scope epics, produce brief, get approval, produce roadmap |

## Artifact Locations

| Artifact Type | Location Pattern |
|---------------|-----------------|
| Specifications | `.meridian/{issue}/spec/` |
| Design | `.meridian/{issue}/design/` |
| Evidence | `.meridian/{issue}/evidence/` |
| Delivery | `.meridian/{issue}/delivery/` |
| Checkpoints | `.meridian/{issue}/checkpoint/{recipe-name}/{timestamp}.md` |
| Product artifacts | `.meridian/project/product/{slug}/` |
| External | Returned directly (URLs, IDs) |

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
    _meridian:                 # Meridian-internal namespace
      recipeId: string         # Links task to recipe instance
      invocation: number       # 1, 2, ... for resume tracking
      agentId: string          # For resuming agent
      checkpointDecision: pending|approved|rejected|auto-approved
```

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [Agents Component Guide](./agents.md)
- [Skills Component Guide](./skills.md)
- [Recipe Structure Standard](../framework/recipe-structure.md)
