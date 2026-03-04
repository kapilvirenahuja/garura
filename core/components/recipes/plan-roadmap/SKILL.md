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

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1, C3), behavioral constraints (C4–C10, C-BRIEF-1, C-BRIEF-2), and failure conditions. All constraint IDs referenced in this recipe map to that file.

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
| Step 1 | Scope Epics | product-strategist (call 1/3) |
| Step 2 | Feasibility | tech-designer (call 2/3) |
| Step 3 | Generate Brief | product-strategist (call 3/3) |
| Step 4 | Feedback Loop + Checkpoint | orchestrator + product-strategist (feedback only, not counted) |
| Step 5 | Generate Artifacts | product-strategist (compound: 2 artifacts) |
| Step 6 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

**The orchestrator owns this step entirely. Do not delegate.**

Validate directly:
- `--vision` path is provided and file exists at the path (C1)
- Vision file contains `Status: LOCKED` (C3)

If any check fails → halt immediately with the appropriate `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

Derive `slug` from the vision filename or frontmatter for use in subsequent steps.

### Step 1 — Scope Epics

Create task: "Scope roadmap epics". Invoke `product-strategist` (agent call 1 of 3):

```yaml
---
Intent: Scope roadmap epics from locked vision at {vision_path}
Recipe context:
  intent: "Extract epics from locked vision, scope into time buckets with priorities and dependencies"
  task: "Invoke scope-roadmap-epics skill. Input: vision_path={vision_path}, time_horizon=12 months. Return scoped_epics output."
  vision_path: "{--vision value}"
  behavioral_constraints: {C4, C5 from reference/intent.yaml}
```

**Expected output:**
```yaml
scoped_epics:
  slug: "{product slug}"
  vision_path: "{path}"
  epics:
    - id: "E1"
      name: "{epic name}"
      strategic_goal: "{linked goal}"
      description: "{2–3 sentences}"
      bucket: "near|mid|long"
      priority: "P1|P2|P3"
      effort: "S|M|L|XL"
      depends_on: ["{epic id or null}"]
      foundation_investment: true|false
      github_issue_ref: "TBD"
```

If agent returns fewer than 3 epics → halt with failure condition: "product-strategist returns fewer than 3 scoped epics."

If agent returns structured failure → see Recovery section.

### Step 2 — Feasibility

Create task: "Technical feasibility assessment". Invoke `tech-designer` (agent call 2 of 3):

```yaml
---
Intent: Assess technical feasibility of scoped epics for {slug}
Recipe context:
  intent: "Evaluate technical feasibility of each scoped epic — identify hard blockers, foundation investment requirements, and sequencing risks"
  task: "Assess feasibility of the provided scoped epics. Return feasibility_flags per epic: feasible (true/false), blockers (list), foundation_required (true/false), risk (low/medium/high)."
  scoped_epics: {from Step 1}
  vision_path: "{--vision value}"
```

**Expected output:**
```yaml
feasibility_flags:
  - epic_id: "E1"
    feasible: true|false
    blockers: ["{blocker description}"]
    foundation_required: true|false
    risk: "low|medium|high"
```

If agent returns structured failure → see Recovery section.

### Step 3 — Generate Brief

Create task: "Generate roadmap brief". Invoke `product-strategist` (agent call 3 of 3):

```yaml
---
Intent: Draft roadmap brief for {slug} — gate artifact for human review
Recipe context:
  intent: "Generate lightweight roadmap review brief — 6 sections, 30-minute reviewable, decision-grade content only"
  task: "Invoke draft-roadmap-brief skill. Return brief output with c_brief_1_pass and c_brief_2_pass flags."
  scoped_epics: {from Step 1}
  feasibility_flags: {from Step 2}
  vision_path: "{--vision value}"
  artifact_base: ".meridian/project/product/"
  behavioral_constraints: {C-BRIEF-1, C-BRIEF-2 from reference/intent.yaml}
```

**Expected output:**
```yaml
brief:
  path: ".meridian/project/product/{slug}/brief-{timestamp}.md"
  epic_count: {integer}
  sections_present: [bet, story, decisions, not_doing, asks, assumptions]
  c_brief_1_pass: true|false
  c_brief_1_violations: ["{description of violation if any}"]
  c_brief_2_pass: true|false
  c_brief_2_violations: ["{description of technical element that does not change a decision}"]
```

**Brief constraint enforcement:** If `c_brief_1_pass: false` OR `c_brief_2_pass: false` → re-invoke `product-strategist` with violation details appended to recipe context. Max 1 re-invocation. If still fails → halt with constraint violation details.

If agent returns structured failure → see Recovery section.

### Step 4 — Feedback Loop + Checkpoint

**The orchestrator owns this step entirely, except for brief adjustment invocations.**

Write checkpoint to `.meridian/project/product/checkpoint/plan-roadmap/{YYYYMMDD-HHMMSS}.md` with: `brief_path={brief.path}`, `brief_status=pending`, `feedback_cycles=0`, `vision_path`, `slug`, `scoped_epics`, `feasibility_flags`.

Present brief using `templates/approval-prompt.md`.

Parse user response:
- **Plain text** (not Tether/Vanish) → invoke `product-strategist` to adjust brief (pass feedback as plain text in recipe context under key `user_feedback`); re-present updated brief; increment `feedback_cycles` in checkpoint; max 3 cycles.
- After 3 cycles without Tether → re-present current brief with Tether/Vanish only ("Maximum feedback cycles reached — type **Tether** to approve the current brief or **Vanish** to halt.").
- **`Tether`** → update checkpoint `brief_status=approved`, `approved_brief_path={brief.path}`; proceed to Step 5.
- **`Vanish`** → update checkpoint `brief_status=rejected`; write evidence; invoke repo-orchestrator to commit; halt.

**NOTE:** Feedback adjustment invocations do NOT count against the C5 agent call budget — they are feedback loop iterations, not new workflow steps.

### Step 5 — Generate Artifacts

Create task: "Generate roadmap artifacts". Invoke `product-strategist` compound (2 intents):

```yaml
---
Intents:
  1. "Draft roadmap from scoped epics and approved brief"
  2. "Generate engineering view from the drafted roadmap"
Recipe context:
  intent_count: 2
  intent_1: "Invoke draft-roadmap skill — generate roadmap.md post-Tether"
  intent_2: "Invoke generate-engineering-view skill on the resulting roadmap.md"
  dependency: "intent_2 depends on intent_1 output (roadmap.path)"
  scoped_epics: {from Step 1}
  approved_brief_path: "{approved_brief_path from checkpoint}"
  feasibility_flags: {from Step 2}
  artifact_base: ".meridian/project/product/"
  behavioral_constraints: {C6, C7, C9 from reference/intent.yaml}
```

**Expected output:**
```yaml
results:
  - intent: "Draft roadmap"
    skill: "draft-roadmap"
    status: "success"
    output:
      roadmap:
        path: ".meridian/project/product/{slug}/roadmap.md"
        status: "DRAFT"
        epic_count: {count}
  - intent: "Generate engineering view"
    skill: "generate-engineering-view"
    status: "success"
    output:
      engineering_view:
        path: ".meridian/project/product/{slug}/roadmap-engineering.md"
        audience: "Engineering"
```

If agent returns structured failure → see Recovery section.

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
2. Read all checkpoint fields: `brief_status`, `brief_path`, `approved_brief_path`, `feedback_cycles`, `vision_path`, `slug`, `scoped_epics`, `feasibility_flags`.
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
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
| Checkpoint | `templates/checkpoint.md` | STM checkpoint artifact |
| Approval Prompt | `templates/approval-prompt.md` | Brief presentation + feedback loop |
| Final Report | `templates/final-report.md` | Phase completion summary |

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 1.1.0 |
| Distinct Agents | 2 (product-strategist, tech-designer) |
| Agent Calls (main flow) | 3 (product-strategist x2, tech-designer x1) + feedback iterations (not counted) |
| Agent Calls (post-Tether) | 1 compound (2 artifacts: roadmap.md + roadmap-engineering.md) |
| Checkpoint | Once — at brief gate (Step 4) |
