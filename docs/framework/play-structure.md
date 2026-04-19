# Play Structure Standard

Every play MUST follow one of the two patterns documented here. The canonical phase structure is the default. The task-driven DAG variant is used by plays that define a capability graph upfront.

---

## Canonical Phase Structure (Default)

```
PRE-FLIGHT → [PRE-EXECUTION] → CHECKPOINT → EXECUTE → REPORT
```

| Phase | Required | Owned By | Purpose |
|-------|----------|----------|---------|
| **PRE-FLIGHT** | Yes | Orchestrator | Validate preconditions. Halt immediately on failure. |
| **PRE-EXECUTION** | No | Orchestrator + Agents | Any work needed before a decision can be made (analysis, resolution, planning). One or more named sub-phases. |
| **CHECKPOINT** | Yes | Orchestrator | Present proposed actions to user. Write STM artifact. Gate: auto-approve or Tether/Vanish. |
| **EXECUTE** | Yes | Agents (domain tasks) | Carry out the approved plan. May be broken into sub-phases. |
| **REPORT** | Yes | Orchestrator | Write evidence/summary artifacts. Present outcome to user. |

---

## Rules

### PRE-FLIGHT
- Always the first step (Step 0)
- Invoke an agent to read system state (branch, file status, etc.)
- If any check fails: output the halt message, write a failure artifact, **exit immediately**
- No further steps run if pre-flight fails

### PRE-EXECUTION (optional, inject between PRE-FLIGHT and CHECKPOINT)
- Name sub-phases descriptively: Analyze, Resolve Issue, Plan, Design, etc.
- Each sub-phase has a single scoped agent task with an expected output contract
- Orchestrator owns any artifact writes between sub-phases (agents return data, orchestrator writes files)
- Examples: commit-code injects Analyze + Resolve Issue; start-planned-feature injects Resolve Issue + Plan + Write Artifacts

### CHECKPOINT
- Always orchestrator-owned — never delegated to an agent
- Write STM artifact **before** presenting to user (Status: PENDING_APPROVAL)
- Auto-approve logic is evaluated by the orchestrator, not an agent
- If user approval required: present using approval-prompt template, parse Tether/Vanish
- Update artifact Status to APPROVED or REJECTED before continuing or halting

### EXECUTE
- Delegate domain tasks to agents, one scoped task per invocation
- Agents receive the exact scope of their task — no workflow logic bleeds into agent context
- Orchestrator sequences sub-phases; agents do not chain themselves
- On agent failure: invoke recovery, max 2 retries, then HALT

### REPORT
- Always orchestrator-owned — never delegated
- Write final evidence/summary to STM
- Present outcome to user using the report template

---

## Play Header Template

Every play MUST declare its phase structure at the top:

```markdown
## Phases

| Phase | Steps | Agent |
|-------|-------|-------|
| PRE-FLIGHT | Step 0 | repo-orchestrator (state check) |
| PRE-EXECUTION: {name} | Step 1 | {agent} |
| PRE-EXECUTION: {name} | Step 2 | {agent} |
| CHECKPOINT | Step 3 | orchestrator |
| EXECUTE | Steps 4–N | {agent(s)} |
| REPORT | Step N+1 | orchestrator |
```

---

## Phase Injection Examples

### commit-code
```
PRE-FLIGHT → Analyze → Resolve Issue → CHECKPOINT → Execute (per group) → REPORT
```

### start-planned-feature
```
PRE-FLIGHT → Resolve Issue → Plan → Write Artifacts → CHECKPOINT → Create Branch → Implement → Commit + PR → REPORT
```

### start-feature (minimal)
```
PRE-FLIGHT → Resolve/Create Issue → CHECKPOINT → Create Branch + STM → REPORT
```

---

## Conditional Step Skipping

Conditional step skipping is valid in plays. A step is skipped when a pre-flight detection result makes it unnecessary. The orchestrator logs the skip reason and moves to the next step without invoking an agent.

Examples from `ship`:
- Step 1 (Commit) is skipped when `pre_flight.has_uncommitted_changes == false`
- Step 2 (Create PR) is skipped when `pre_flight.pr_exists == true`

Skipped steps are recorded in the final evidence artifact.

---

## Plays Delegating to Sub-Plays

Plays can invoke other plays as sub-plays via the Skill tool. The invoking play passes context that suppresses interactive checkpoints in the sub-play:

```yaml
---
Play context:
  intent: "Commit uncommitted changes as part of the ship workflow"
  ship_context:
    auto_approve: true
    issue: {issue_number}
```

The sub-play reads `ship_context.auto_approve: true` and writes a checkpoint artifact with `Status: AUTO_APPROVED` without presenting the approval prompt to the user. This keeps the audit trail intact while allowing the invoking play to orchestrate the full flow without interruption.

---

## Task-Driven DAG Variant

Used by plays like `prepare-epic` that define a capability graph rather than a fixed step sequence. The play creates the **full task graph upfront** using TaskCreate with `blockedBy` dependencies, then executes capabilities in dependency order.

### Structure

```
Pre-flight → Create Task Graph (HARD GATE) → Execute Pre-Checkpoint Capabilities → Checkpoint → Execute Post-Checkpoint Capabilities → Report
```

**Create Task Graph** is an explicit step between Pre-flight and Execute that has no equivalent in the canonical pattern. In this step, the play calls TaskCreate for every capability in the capability graph — including the checkpoint task and the report task — and sets all `blockedBy` dependencies before any agent is invoked.

**HARD GATE: Execution only begins after the full task graph is verified.** The play confirms every task exists and every dependency link is set. If any task is missing or a dependency is wrong, the play corrects it before proceeding. No agent receives a contract prompt until this gate is passed.

### How It Differs from the Canonical Pattern

| Aspect | Canonical (Linear) | Task-Driven DAG |
|--------|-------------------|-----------------|
| Step definition | Fixed sequence in SKILL.md | Dynamic task graph created at runtime |
| Agent communication | YAML play context block per step | JSON contract flows through all agents |
| Checkpoint placement | Fixed in the phase sequence | Declared as a task node in the graph |
| Agent prompt | YAML context + task description | JSON contract only — no appended text |
| Resume | Not typically supported | Supported via checkpoint artifact reconstruction |

### Capability Graph Declaration

Task-driven plays declare their execution DAG as a capability graph table in SKILL.md:

```
| # | Capability | Agent | Needs | Produces |
|---|------------|-------|-------|----------|
| 1 | Scope epics | feature-steward | vision | epics.yaml |
| 2 | Assess feasibility | tech-designer | epics.yaml | feasibility.yaml |
| 3 | Produce brief | feature-steward | epics, feasibility | brief.html |
| — | CHECKPOINT | orchestrator | brief.html | approved_brief |
| 4 | Produce roadmap | feature-steward | approved brief | roadmap.md |
```

### JSON Contract Rule

In the task-driven pattern, the JSON contract IS the entire agent prompt. Nothing is appended after the JSON object. See [Plays Component Guide](../components/plays.md#critical-rule-json-contract-is-the-entire-agent-prompt) for the full rule.

---

## Version

| Field | Value |
|-------|-------|
| Standard | play-structure |
| Version | 1.1.0 |
| Applies To | All plays |
