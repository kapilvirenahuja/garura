---
name: plan-roadmap
description: Plan a time-phased product roadmap from a locked vision
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# plan-roadmap

Plan a time-phased product roadmap from a locked vision — scope epics, generate a reviewable brief, run a feedback loop, then produce the roadmap and engineering view post-approval.

## Intent

Read `reference/intent.yaml` — the user contract. It defines the goal, constraints
(including template references), failure conditions, and validation scenarios.

This file is passed to every agent invocation as part of the JSON contract.
Agents read it to understand what to produce and what constraints to respect.

## Role

You are the orchestrator. You own the task graph, checkpoints, and evidence.
You delegate domain tasks to agents via the JSON contract — never execute domain
work directly.

**Agents available:**
| Agent | Domain |
|-------|--------|
| product-strategist | Product: epics, briefs, roadmaps |
| tech-designer | Technical: feasibility, blockers, sequencing |
| repo-orchestrator | Git: commits (non-blocking) |

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct file operations beyond Read/Write for checkpoints and evidence.

**Path resolution:**
All `.meridian/` paths in this recipe are **relative to the project root** (the current working directory). NEVER expand `.meridian/` to an absolute path under the user's home directory. The orchestrator MUST resolve paths as `{project_root}/.meridian/project/product/...` — NOT `~/.meridian/project/product/...`. STM is project-scoped; `~/.meridian/core/memory/` is for LTM only.

## System Constraints

Framework-level guardrails, not user-facing intent.

- Maximum 3 agent calls in main flow. Feedback adjustments do not count.
- Checkpoint MUST be written before presenting brief to user.
- All artifacts written to `.meridian/project/product/{slug}/` relative to project root.
- Orchestrator delegates to agents — never invokes skills directly.
- Communications between agents and skills MUST use JSON contracts.
  Details written to STM as artifacts, paths passed in JSON.
- **CRITICAL: The JSON contract is the ENTIRE agent prompt.** When invoking an agent, pass ONLY the JSON object. Do NOT append instructions, field definitions, examples, rules, epic schemas, or any other text after the JSON. Agents have their own definitions — they know what to do. Adding instructions overrides agent behavior with potentially wrong information. If you find yourself writing "Rules:", "For each epic:", or "Example return format:" after the JSON — STOP. Delete it. Send only the JSON.

## Arguments

```
/plan-roadmap --vision <path>
/plan-roadmap --resume
```

## Capability Graph

This is the execution DAG. At L2, the recipe defines the graph.

| # | Capability | Agent | Needs | Produces |
|---|------------|-------|-------|----------|
| 1 | Scope epics with IDD fields | product-strategist | vision | epics.yaml |
| 2 | Assess technical feasibility | tech-designer | epics.yaml | feasibility.yaml |
| 3 | Produce reviewable brief | product-strategist | epics, feasibility, vision | brief.html |
| — | **CHECKPOINT: human review** | orchestrator | brief.html | approved_brief |
| 4 | Produce full roadmap | product-strategist | epics, feasibility, approved brief | roadmap.md |
| 5 | Produce engineering view | product-strategist | roadmap.md | roadmap-engineering.md |

**STM base:** `.meridian/project/product/{slug}/`

## JSON Contract

A single contract flows through the entire workflow. Recipe creates the initial contract. Each agent enriches it with artifact paths.

```json
{
  "intent_path": "reference/intent.yaml",
  "stm_base": ".meridian/project/product/",
  "slug": "<derived from vision>",
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
| `stm.*` | Agents | Artifact paths — agents populate null fields with paths they produce |
| `checkpoints` | Recipe | Checkpoint status — recipe updates after human review |
| `evidence` | Recipe | Evidence paths — recipe updates at report step |
| `notes` | Agents | Short observations from the current step (max 3 items, 1 sentence each). Validation summaries, warnings, or context for downstream agents. Not prose — structured notes only. |
| `step_failure` | Agents | Non-null only when the agent cannot recover. Recipe reads this to decide retry/halt. |

### `notes` format

Agents MAY add up to 3 notes per invocation. Each note is a short string (1 sentence). Notes are for downstream context — not validation checklists or verbose output.

```json
"notes": [
  "5 epics derived — all trace to distinct strategic goals",
  "E2 depends on E1 foundation — sequencing constraint"
]
```

### `step_failure` format

Non-null only when the agent attempted self-recovery and still failed. Recipe reads this to decide retry or halt.

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

**How it works:**
- Recipe creates the initial contract with vision_path set, everything else null, notes empty, step_failure null
- Sends contract to first agent
- Agent produces artifacts, adds paths to `stm`, optionally adds notes, returns the enriched contract
- If agent fails after recovery attempts, sets `step_failure` instead of `stm` paths
- Recipe sends enriched contract to next agent
- Each agent adds to the same contract — it grows through the workflow
- Recipe checks `step_failure` first, then validates `stm` paths

**No per-capability output schemas.** The contract IS the schema. Agents add paths to `stm`, notes to `notes`, failures to `step_failure`. Recipe validates what's present.

## Workflow

### Step 0 — Pre-flight

**Orchestrator owns. Do not delegate.**

Read `reference/intent.yaml`. Validate:
- Vision path provided and file exists
- Vision has Status: LOCKED (satisfies C-LOCKED)

Halt on failure. Derive `slug` from vision.

### Step 1 — Create Task Graph

**HARD GATE: Do NOT proceed to Step 2 until all tasks are created and dependencies are set.**

After pre-flight passes, create the full task graph using TaskCreate:

| Task | Agent | Blocked By | Description |
|------|-------|------------|-------------|
| Scope epics | product-strategist | — | Derive IDD epics from vision |
| Assess feasibility | tech-designer | Scope epics | Technical feasibility of epics |
| Produce brief | product-strategist | Scope epics, Assess feasibility | Reviewable brief |
| Human review | orchestrator | Produce brief | Checkpoint: Tether/Vanish |
| Produce roadmap | product-strategist | Human review | Full roadmap from approved brief |
| Produce eng view | product-strategist | Produce roadmap | Engineering-facing view |
| Report | orchestrator | Produce eng view | Evidence + final report |

After creating all tasks with dependencies, initialize the JSON contract:

```json
{
  "intent_path": "{recipe_base}/reference/intent.yaml",
  "stm_base": ".meridian/project/product/",
  "slug": "{slug from pre-flight}",
  "stm": {
    "vision_path": "{--vision value}",
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

Verify: all 7 tasks exist with correct blockedBy before proceeding.

### Step 2 — Execute Pre-Review Tasks

Execute capabilities 1-3 by invoking agents in dependency order.

**CONSTRAINT: The JSON contract is the ENTIRE agent prompt.** Copy-paste the JSON object as the prompt. Nothing before it, nothing after it. No "You are the product-strategist agent", no "Your task is", no field definitions, no rules, no examples. The agent reads its own definition file and intent.yaml — it already knows what to do.

**Capability 1 — Scope epics (product-strategist):**

Pass this JSON contract as the agent prompt:
```json
{
  "intent_path": "{recipe_base}/reference/intent.yaml",
  "stm_base": ".meridian/project/product/",
  "slug": "{slug}",
  "stm": {
    "vision_path": "{--vision value}",
    "epics_path": null,
    "feasibility_path": null,
    "brief_path": null,
    "approved_brief_path": null,
    "roadmap_path": null,
    "engineering_view_path": null
  },
  "checkpoints": [{ "name": "brief_review", "status": "pending" }],
  "evidence": [{ "name": "plan-roadmap", "location": null }],
  "notes": [],
  "step_failure": null
}
```

**Expected return:** The same JSON contract with `stm.epics_path` populated, optional `notes`, `step_failure` null.

Validate: check `step_failure` first — if non-null, handle failure. Then check `stm.epics_path` is non-null.

**Capability 2 — Assess feasibility (tech-designer):**

Pass the enriched contract (now has `stm.epics_path` set) as the agent prompt. No other text.

**Expected return:** The same JSON contract with `stm.feasibility_path` populated, optional `notes`, `step_failure` null.

Validate: check `step_failure` first, then `stm.feasibility_path` is non-null.

**Capability 3 — Produce brief (product-strategist):**

Pass the enriched contract (now has `stm.epics_path` and `stm.feasibility_path` set) as the agent prompt. No other text.

**Expected return:** The same JSON contract with `stm.brief_path` populated, optional `notes`, `step_failure` null.

Validate: check `step_failure` first, then `stm.brief_path` is non-null. If brief constraint violations → re-invoke once. If still fails → halt.

### Step 3 — Human Review (Checkpoint)

Write checkpoint to STM. Update contract: checkpoints[brief_review].status = pending.
Present brief using templates/approval-prompt.md.

Feedback loop:
- Plain text → re-invoke product-strategist with user_feedback; max 3 cycles
- Tether → update checkpoint status = approved, proceed
- Vanish → update checkpoint status = rejected, halt

### Step 4 — Execute Post-Review Tasks

Execute capabilities 4-5. Send enriched contract (now includes `stm.approved_brief_path`) as the agent prompt. No other text.

**Expected returns:** Contract with `stm.roadmap_path` populated, then `stm.engineering_view_path` populated.

### Step 5 — Report

Update checkpoint. Write evidence (update contract evidence section).
Present final report. Invoke repo-orchestrator (non-blocking).
Mark report task complete.

---

### --- RESUME ---

**`/plan-roadmap --resume`** — No `--vision` argument needed.

1. Find the latest checkpoint at `.meridian/project/product/checkpoint/plan-roadmap/` ordered by created timestamp (most recent first).
2. Read all checkpoint fields and reconstruct the JSON contract from checkpoint state.
3. Route based on checkpoint state:
   - `brief_review.status: pending` → re-present brief, continue from Step 3 feedback loop.
   - `brief_review.status: approved` AND `roadmap_path` is null → jump to Step 4.
4. Report to user: "Resuming plan-roadmap — {description of what it is doing}"
5. If no checkpoint found → halt: "No plan-roadmap checkpoint found — start with `/plan-roadmap --vision <path>`"

---

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + original intent
- Max 2 retries per step. After that, halt with full failure context.

For retries, add to the JSON contract:
```json
{
  "retry": {
    "previous_failure": "{what_failed}",
    "fix_applied": "{what was done to fix it}",
    "attempt": 2
  }
}
```

**Pre-flight failures are not recoverable** — hard halt.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | User contract — passed to agents via JSON contract |
| Checkpoint | `templates/checkpoint.md` | STM checkpoint artifact |
| Approval Prompt | `templates/approval-prompt.md` | Brief presentation + feedback loop |
| Final Report | `templates/final-report.md` | Phase completion summary |

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 3.0.0 |
| Distinct Agents | 2 (product-strategist, tech-designer) |
| Agent Calls (main flow) | 3 (product-strategist x2, tech-designer x1) + feedback iterations (not counted) |
| Agent Calls (post-Tether) | 1 compound (2 artifacts: roadmap.md + roadmap-engineering.md) |
| Checkpoint | Once — at brief gate (Step 3) |
