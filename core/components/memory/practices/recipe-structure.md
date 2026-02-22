# Recipe Structure Standard

Every recipe MUST follow this phase structure. This is non-negotiable.

---

## Canonical Phases

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

## Recipe Header Template

Every recipe MUST declare its phase structure at the top:

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

## Version

| Field | Value |
|-------|-------|
| Standard | recipe-structure |
| Version | 1.0.0 |

| Applies To | All L1 and L2 recipes |
