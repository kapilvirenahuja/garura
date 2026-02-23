---
name: start-feature-planning
description: "NEVER call EnterPlanMode. Resolve issue, plan with IDD principles, create branch, deliver planning artifacts."
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# CRITICAL: DO NOT ENTER PLAN MODE

**You MUST NOT call `EnterPlanMode` or `ExitPlanMode`. Zero exceptions.**

All planning is via the Plan sub-agent (Task tool). You are the orchestrator.

---

# start-feature-planning

Resolve issue, plan with IDD principles, create branch, and deliver a ready-to-execute task graph.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C2), behavioral constraints (C3–C10), and failure conditions. All constraint IDs referenced in this recipe map to that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct git/gh commands.

## Phases

Each agent is invoked for a single, scoped domain task at a specific workflow step. Agents do not own workflow logic.

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | repo-orchestrator |
| Step 1 | Resolve Issue | project-orchestrator |
| Step 2 | Deep Analysis + Plan | Plan sub-agent (`subagent_type: "Plan"`) |
| Step 3 | Write Planning Artifacts | orchestrator |
| Step 4 | Checkpoint | orchestrator |
| Step 5 | Create Branch | repo-orchestrator |
| Step 6 | Report | orchestrator |

When invoking agents, provide recipe context:

```
---
Recipe context:
  intent: "Resolve issue, plan with IDD principles, create branch, deliver task graph"
  pre_flight:
    C1: {PASS|FAIL}
    C2: {PASS|FAIL}
  task: "{single, scoped task for this agent — one step only}"
  behavioral_constraints: {relevant behavioral constraints from reference/intent.yaml}
```

## Input Patterns

| Pattern | Example |
|---------|---------|
| `"Add OAuth login"` | Create issue, plan, branch, task graph |
| `42` or `#42` | Resolve existing issue, plan, branch, task graph |
| `--parent 10` | (modifier) Attach as sub-issue to parent |

## Workflow

### Step 0 — Pre-flight

**C2** (orchestrator evaluates directly): Verify intent is actionable — if empty or fewer than 3 meaningful words with no issue reference, halt immediately with C2's `halt_message` from `reference/intent.yaml`. No agent needed.

**C1** (requires git state — invoke `repo-orchestrator`): Check current branch.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Verify preconditions before planning"
  task: "Read `reference/intent.yaml`. Run the C1 check in `constraints.pre_flight`. Return pass/fail. Do NOT halt — just return results."
```

**Expected output:**
```yaml
pre_flight:
  branch: {branch_name or null}
  results: [{id: C1, status: PASS|FAIL}]
```

**Orchestrator validates results:** for any result with `status: FAIL`, halt immediately with that constraint's `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

### Step 1 — Resolve Issue

Invoke `project-orchestrator` — resolve or create issue.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Resolve issue, plan with IDD principles, create branch, deliver task graph"
  pre_flight:
    C1: PASS
    C2: PASS
  task: "Resolve or create GitHub issue. Return issue number, title, body, and type_hint."
  input: {description or issue number}
  parent: {parent_issue_number or null}
```

**Expected output:**
```yaml
issue:
  number: {integer}
  title: {string}
  body: {string}
  type_hint: {feature|fix|hotfix|refactor|docs|chore|null}
```

If `type_hint` is null → default to `feature/` (C10).

Derive branch name: `{type}/{issue_number}-{slug}`
- Slug: lowercase, hyphens, max 40 chars. Reference: `~/.phoenix-os/core/memory/standards/git/branching.md`

**Orchestrator initializes STM directory** at `.phoenix-os/{issue}/` with subdirectories: `spec/`, `design/`, `evidence/`, `delivery/`, `checkpoint/`, `planning/`.

### Step 2 — Deep Analysis + Plan (IDD-Aware)

Invoke **Plan sub-agent** via Task tool (`subagent_type: "Plan"`).

The prompt MUST instruct the Plan sub-agent to produce three sections, each beginning with an **IDD intent header**. The TASKS section MUST produce granular, implementable tasks with a dependency graph.

If Plan sub-agent returns output missing any of the three sections (SPEC, VERIFY, TASKS) → halt with: "Plan sub-agent produced incomplete output — missing required section(s). Cannot proceed without complete planning artifacts."

Plan sub-agent prompt structure:

```
You are performing deep technical analysis for issue #{number} — {title}.

Pre-flight:
  C1: {PASS|FAIL}
  C2: {PASS|FAIL}

Issue body: {body}
Type: {type_hint}
Repository: {cwd}

## IDD Context
Intent: {user's original intent}
Constraints: {any constraints from issue or user input}
Failure conditions: {what would make this work fail}

## Instructions
1. Explore the codebase — find relevant files, understand patterns, trace dependencies
2. For bugs: identify root cause (what's broken, why, where)
3. For features: map architectural impact (what exists, what's needed, risks)
4. Design a technical approach with alternatives considered
5. Break the approach into granular, self-sufficient tasks with a dependency graph

Return THREE sections with exact headers:

---

## SPEC

**Intent:** {restate what this change aims to achieve}
**Constraints:** {boundaries that must be respected}
**Failure Conditions:** {when this work should be considered failed}

### Summary
{1-2 paragraphs}

### Root Cause (if bug)
{Omit if not a bug}

### Affected Files
| File | Role | Change Needed |
|------|------|---------------|

### Technical Approach
**Strategy:** {chosen approach}
**Alternatives Considered:** {approach → reason rejected}
**Risks:** {risk → mitigation → severity}

---

## VERIFY

**Intent:** {verify that the implementation satisfies the spec intent}

### Acceptance Criteria
- [ ] {criterion directly traceable to the intent}

### Verification Steps
| Step | Method | Expected Outcome |
|------|--------|-----------------|

### Edge Cases
| Scenario | Expected Behavior |
|----------|------------------|

---

## TASKS

**Intent:** {implement the spec through granular, dependency-ordered tasks}

### Dependency Graph
{Show task dependencies — which tasks block which. Simple notation:}
T1 → T2 → T4
T1 → T3 → T4

### Task Breakdown

#### T1: {description}
- **Files:** {paths with actions: create/modify/delete}
- **Details:** {specific changes — enough for an implementor to execute without guessing}
- **Depends on:** none
- **Expected Outcome:** {what success looks like}
- **Verification:** {how to confirm this step worked}

#### T2: {description}
- **Depends on:** T1
...
```

The Plan sub-agent returns text. It cannot write files.

### Step 3 — Write Planning Artifacts

**Orchestrator owns this step entirely. Do not delegate.**

Parse Plan sub-agent output. Write three files to STM:

1. `.phoenix-os/{issue}/planning/spec.md` — from `## SPEC`
2. `.phoenix-os/{issue}/planning/verify.md` — from `## VERIFY`
3. `.phoenix-os/{issue}/planning/tasks.md` — from `## TASKS`

Each file header:
```markdown
# {Section}: #{issue} — {title}
<!-- Generated by start-feature-planning | Plan sub-agent output -->
```

### Step 4 — Checkpoint: Approval Gate (Tether / Vanish)

**Orchestrator owns this step entirely. Do not delegate.**

Write checkpoint artifact to `.phoenix-os/{issue}/checkpoint/start-feature-planning/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

Present plan summary using `templates/approval-prompt.md`. Do NOT use EnterPlanMode or AskUserQuestion.

Parse: `Tether`/`tether` → update artifact Status to `APPROVED`, proceed to Step 5. `Vanish`/`vanish` → update artifact Status to `REJECTED`, halt. Else → clarify.

**This is the ONLY approval gate in the recipe.**

### Step 5 — Create Branch

Invoke `repo-orchestrator`:

```yaml
---
Recipe context:
  intent: "Resolve issue, plan with IDD principles, create branch, deliver task graph"
  pre_flight:
    C1: PASS
    C2: PASS
  task: "Create and push branch `{type}/{issue_number}-{slug}` from main. Return branch name and push status."
  behavioral_constraints: {behavioral constraint C4 from reference/intent.yaml}
```

**Expected output:**
```yaml
result:
  success: true | false
  branch: {branch_name}
  status: {created_and_pushed | error}
  error: {message if success: false}
```

If `success: false` → invoke recovery (see Recovery section). Max 2 retries.

### Step 6 — Report

**Orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.phoenix-os/{issue}/evidence/start-feature-planning/{YYYYMMDD-HHMMSS}.md`:
- Issue number and title
- Branch created
- Planning artifacts written (spec, verify, tasks — with file paths)

Update checkpoint artifact `.phoenix-os/{issue}/checkpoint/start-feature-planning/{same-timestamp}.md`:
- Append branch created and planning artifacts written with confirmation status

Present final report to user using `templates/feature-started.md`.

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + the original intent
- Max 2 retry cycles per agent. After that, HALT with full failure context.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/start-feature-planning/{ts}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation |
| Feature Started | `templates/feature-started.md` | Final report |

### Contracts

**STM Directory Structure:**

```
.phoenix-os/{issue}/
├── spec/          # define-feature writes here
├── design/        # tech-designer writes here
├── evidence/      # verify-feature, validator write here
├── delivery/      # deliver-feature, create-pr write here
├── checkpoint/    # all recipes write checkpoint artifacts here
└── planning/      # start-feature-planning planning output
```

**Branch Naming Convention:** `{type}/{issue_number}-{slug}`

Reference: `~/.phoenix-os/core/memory/standards/git/branching.md`

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) — Plan sub-agent is a Claude built-in tool, exempt from agent limits |
| Checkpoint | Single (plan approval via Tether/Vanish) |
