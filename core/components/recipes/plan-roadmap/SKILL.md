---
name: plan-roadmap
description: Plan a time-phased product roadmap from a locked vision — scope, brief, feedback loop, generate artifacts
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# plan-roadmap

Plan a time-phased product roadmap from a locked vision — scope epics, generate a reviewable brief, run a feedback loop, then produce the roadmap and engineering view post-approval.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** for pre-flight validation (C1, C3 halt messages) only.

## Agent Invocation Protocol

Each step defines a YAML block. Fill the `{variables}` with resolved values and pass **only** the filled YAML as the agent prompt. No other text, instructions, context, or formatting — the YAML block is the entire prompt.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct file operations.

**Agent boundaries:**
- `product-strategist` — product domain only: epic scoping, roadmap brief drafting, roadmap artifact generation, engineering view
- `tech-designer` — feasibility only: technical blocker identification, foundation investment requirements, sequencing risks
- `repo-orchestrator` — git operations only: commits after phase completion (non-blocking)
- Everything else (pre-flight checks, checkpoint writes, approval logic, reporting) — orchestrator owns it

**Path resolution:**
All `.meridian/` paths in this recipe are **relative to the project root** (the current working directory). NEVER expand `.meridian/` to an absolute path under the user's home directory. The orchestrator MUST resolve paths as `{project_root}/.meridian/project/product/...` — NOT `~/.meridian/project/product/...`. STM is project-scoped; `~/.meridian/core/memory/` is for LTM only.

## Arguments

```
/plan-roadmap --vision <path>
/plan-roadmap --resume
```

## Steps

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | orchestrator |
| Step 1 | Derive Epics from Vision | product-strategist (call 1/3) |
| Step 2 | Assess Feasibility | tech-designer (call 2/3) |
| Step 3 | Produce Review Brief | product-strategist (call 3/3) |
| Step 4 | Feedback Loop + Checkpoint | orchestrator + product-strategist (feedback only, not counted) |
| Step 5 | Produce Roadmap Artifacts | product-strategist (compound: 2 outputs) |
| Step 6 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

**The orchestrator owns this step entirely. Do not delegate.**

Validate directly:
- `--vision` path is provided and file exists at the path (C1)
- Vision file contains `Status: LOCKED` (C3)

If any check fails → halt immediately with the appropriate `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

Derive `slug` from the vision filename or frontmatter for use in subsequent steps.

### Step 1 — Derive Epics from Vision

Agent call 1 of 3 (`product-strategist`). Pass only the following YAML as the agent prompt:

```yaml
intent_path: "{recipe_base}/reference/intent.yaml"
vision_path: "{--vision value}"
artifact_base: ".meridian/project/product/"
```

**Expected return:**
```yaml
scoped_epics:
  epics_path: ".meridian/project/product/{slug}/epics.yaml"
  slug: "{product slug}"
  epic_count: {integer}
```

If `epic_count` < 3 → halt: "product-strategist returns fewer than 3 scoped epics."
If structured failure → see Recovery section.

### Step 2 — Assess Feasibility

Agent call 2 of 3 (`tech-designer`). Pass only the following YAML as the agent prompt:

```yaml
intent_path: "{recipe_base}/reference/intent.yaml"
epics_path: "{scoped_epics.epics_path from Step 1}"
artifact_base: ".meridian/project/product/"
slug: "{slug from Step 1}"
```

**Expected return:**
```yaml
feasibility:
  feasibility_path: ".meridian/project/product/{slug}/feasibility.yaml"
```

If structured failure → see Recovery section.

### Step 3 — Produce Review Brief

Agent call 3 of 3 (`product-strategist`). Pass only the following YAML as the agent prompt:

```yaml
intent_path: "{recipe_base}/reference/intent.yaml"
epics_path: "{scoped_epics.epics_path from Step 1}"
feasibility_path: "{feasibility.feasibility_path from Step 2}"
vision_path: "{--vision value}"
```

**Expected return:**
```yaml
brief:
  path: ".meridian/project/product/{slug}/brief-{timestamp}.html"
  epic_count: {integer}
  sections_present: [bet, story, decisions, not_doing, asks, assumptions]
  c_brief_1_pass: true|false
  c_brief_1_violations: ["{description}"]
  c_brief_2_pass: true|false
  c_brief_2_violations: ["{description}"]
```

**Brief constraint enforcement:** If `c_brief_1_pass: false` OR `c_brief_2_pass: false` → re-invoke `product-strategist` with violation details only. Max 1 re-invocation. If still fails → halt.

If structured failure → see Recovery section.

### Step 4 — Feedback Loop + Checkpoint

**The orchestrator owns this step entirely, except for brief adjustment invocations.**

Write checkpoint to `.meridian/project/product/checkpoint/plan-roadmap/{YYYYMMDD-HHMMSS}.md` with: `brief_path={brief.path}`, `brief_status=pending`, `feedback_cycles=0`, `vision_path`, `slug`, `epics_path`, `feasibility_path`.

Present brief using `templates/approval-prompt.md`.

Parse user response:
- **Plain text** (not Tether/Vanish) → invoke `product-strategist` to adjust brief (pass feedback as plain text in recipe context under key `user_feedback`); re-present updated brief; increment `feedback_cycles` in checkpoint; max 3 cycles.
- After 3 cycles without Tether → re-present current brief with Tether/Vanish only ("Maximum feedback cycles reached — type **Tether** to approve the current brief or **Vanish** to halt.").
- **`Tether`** → update checkpoint `brief_status=approved`, `approved_brief_path={brief.path}`; proceed to Step 5.
- **`Vanish`** → update checkpoint `brief_status=rejected`; write evidence; invoke repo-orchestrator to commit; halt.

**NOTE:** Feedback adjustment invocations do NOT count against the C5 agent call budget — they are feedback loop iterations, not new workflow steps.

### Step 5 — Produce Roadmap Artifacts

Agent call compound (`product-strategist`). Pass only the following YAML as the agent prompt:

```yaml
intent_path: "{recipe_base}/reference/intent.yaml"
epics_path: "{epics_path from checkpoint}"
feasibility_path: "{feasibility_path from checkpoint}"
approved_brief_path: "{approved_brief_path from checkpoint}"
artifact_base: ".meridian/project/product/"
```

**Expected return:**
```yaml
results:
  - status: "success"
    output:
      roadmap:
        path: ".meridian/project/product/{slug}/roadmap.md"
        status: "DRAFT"
        epic_count: {count}
  - status: "success"
    output:
      engineering_view:
        path: ".meridian/project/product/{slug}/roadmap-engineering.md"
        audience: "Engineering"
```

If structured failure → see Recovery section.

### Step 6 — Report

**The orchestrator owns this step entirely. Do not delegate.**

Update checkpoint with all artifact paths and `status=COMPLETED`.

Write evidence to `.meridian/project/product/evidence/plan-roadmap/{YYYYMMDD-HHMMSS}.md`:
- Artifact paths (roadmap.md, roadmap-engineering.md)
- Epic count
- Sections filled/empty per epic (IDD core vs Technical)
- Feedback cycles consumed

Present final report using `templates/final-report.md`.

Invoke `repo-orchestrator` to commit all evidence and checkpoint files with message `chore(stm): record plan-roadmap evidence`. **Non-blocking.**

---

### --- RESUME ---

**`/plan-roadmap --resume`** — No `--vision` or `--phase` argument needed.

1. Find the latest checkpoint at `.meridian/project/product/checkpoint/plan-roadmap/` ordered by created timestamp (most recent first).
2. Read all checkpoint fields: `brief_status`, `brief_path`, `approved_brief_path`, `feedback_cycles`, `vision_path`, `slug`, `epics_path`, `feasibility_path`.
3. Route based on checkpoint state:
   - `brief_status: pending` → load brief from `brief_path`, re-present using `templates/approval-prompt.md` ("Resuming — feedback loop at cycle {feedback_cycles}/3"), continue from Step 4.
   - `brief_status: approved` AND `roadmap.md` does not exist at `.meridian/project/product/{slug}/roadmap.md` → jump directly to Step 5 (generate artifacts).
4. Report to user: "Resuming plan-roadmap — {description of what it is doing}"
5. If no checkpoint found → halt: "No plan-roadmap checkpoint found — start with `/plan-roadmap --vision <path>`"

---

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + original intent
- Max 2 retries per step. After that, halt with full failure context.

For retries, add to recipe context:
```yaml
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

**Pre-flight failures (C1, C3) are not recoverable** — hard halt with the constraint's `halt_message`.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — pre-flight validation + passed to agents |
| Checkpoint | `templates/checkpoint.md` | STM checkpoint artifact |
| Approval Prompt | `templates/approval-prompt.md` | Brief presentation + feedback loop |
| Final Report | `templates/final-report.md` | Phase completion summary |

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 2.0.0 |
| Distinct Agents | 2 (product-strategist, tech-designer) |
| Agent Calls (main flow) | 3 (product-strategist x2, tech-designer x1) + feedback iterations (not counted) |
| Agent Calls (post-Tether) | 1 compound (2 artifacts: roadmap.md + roadmap-engineering.md) |
| Checkpoint | Once — at brief gate (Step 4) |
