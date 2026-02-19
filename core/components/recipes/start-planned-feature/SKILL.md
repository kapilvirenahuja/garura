---
name: start-planned-feature
description: "NEVER call EnterPlanMode. Orchestrate feature planning and implementation via sub-agents — no plan mode."
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet

# === Three Elements of Intent (IDD) ===
intent: >
  Deliver a complete feature or bug fix — from analysis through implementation
  to pull request — with a structured plan approved by the user before any
  code changes.

constraints:
  - MUST NOT call EnterPlanMode or ExitPlanMode — all planning via Plan sub-agent
  - Single approval gate only (Tether/Vanish at plan review) — execution is autonomous after
  - Planning phase is read-only — no code changes until plan is approved
  - Plan output MUST be persisted as three artifacts (spec.md, verify.md, tasks.md)
  - Orchestrator MUST delegate to agents — never execute tools directly
  - Maximum 3 distinct agents (project-orchestrator, repo-orchestrator, code-builder); each may be called multiple times
  - Recovery agent calls are exempt from the agent limit
  - Null type_hint defaults to feature/ prefix

failure_conditions:
  - User rejects plan at approval gate (Vanish)
  - Code-builder reports success: false with unresolvable issues
  - Branch creation fails on origin
  - PR creation fails after commits are made
  - Plan sub-agent fails to produce all three required sections (SPEC, VERIFY, TASKS)
---

# CRITICAL: DO NOT ENTER PLAN MODE

**You MUST NOT call `EnterPlanMode` or `ExitPlanMode`. This is a hard rule with zero exceptions.**

All planning is handled by a Plan sub-agent via the Task tool. You are already the orchestrator — entering plan mode would break the workflow.

If you feel tempted to enter plan mode: STOP. Invoke the Plan sub-agent instead.

---

# start-planned-feature

Orchestrate a feature or bug fix through sub-agents: deep technical analysis via Plan sub-agent, then autonomous implementation through PR creation.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden tools (never call these):** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct git/gh commands.

## Tasks

| Task | Agent | Verification |
|------|-------|--------------|
| Resolve or create issue | project-orchestrator | Issue returned with type_hint |
| Deep analysis + RCA + plan | Plan sub-agent | Structured analysis returned |
| Write planning artifacts | orchestrator | 3 files written to `.phoenix-os/{issue}/planning/` |
| Plan approval | orchestrator | User approves via Tether/Vanish |
| Persist checkpoint to STM | orchestrator | Checkpoint written |
| Create and push branch | repo-orchestrator | Branch created and tracking origin |
| Implement changes | code-builder | All steps completed, verified |
| Commit + create PR | repo-orchestrator | PR created with plan references |
| Report | orchestrator | Final summary presented |

## Input Parsing

Parse the user's input to determine the intent:

| Input Pattern | Interpretation |
|---------------|----------------|
| Bare number: `42`, `#42` | `issue_number: 42` — read existing issue |
| Text: `"Add OAuth login"` | `description: "Add OAuth login"` — resolve or create |
| With parent: `--parent 10` or `--parent #10` | `parent_issue_number: 10` — attach as sub-issue |

**Examples:**
```
/start-planned-feature 42                          → issue_number: 42
/start-planned-feature "Add OAuth login"           → description: "Add OAuth login"
/start-planned-feature "Login validation" --parent 42  → description: "Login validation", parent: 42
/start-planned-feature #42                         → issue_number: 42
```

## Workflow

This recipe has two phases separated by a single approval gate.

### Phase 1: PLANNING (read-only, user approval required)

#### 1. Resolve Issue

Invoke `project-orchestrator` via Task tool:

```
subagent_type: "project-orchestrator"
Agent: project-orchestrator

Intent: resolve or create issue
Input:
  action: resolve_or_create
  issue_number: {if provided}
  description: {if provided}
  parent_issue_number: {if provided}
```

**Expected output:**
```yaml
issue:
  number: {int}
  title: "{title}"
  labels: [{list}]
  state: "{open|closed}"
  body_summary: "{first 200 chars}"
  url: "{html_url}"
  created: {true|false}
  parent_issue: {parent_number or null}
  type_hint: "{feature|fix|hotfix|refactor|docs|chore|null}"
```

Derive branch name using the same logic as `start-feature`:
```
{type}/{issue_number}-{slug}
```

**Type mapping** (from `type_hint`):

| type_hint | Branch Prefix |
|-----------|---------------|
| `feature` | `feature/` |
| `fix` | `fix/` |
| `hotfix` | `hotfix/` |
| `refactor` | `refactor/` |
| `docs` | `docs/` |
| `chore` | `chore/` |
| `null` | Default to `feature/` |

**Slug derivation:**
- Take issue title
- Lowercase
- Replace spaces and special chars with hyphens
- Remove consecutive hyphens
- Truncate to max 40 characters
- Remove trailing hyphens

#### 2. Deep Analysis + RCA + Plan

Invoke the **Plan sub-agent** via Task tool. This delegates all codebase exploration, analysis, and plan design to Claude's built-in planning capabilities without entering plan mode.

```
subagent_type: "Plan"

You are performing deep technical analysis for issue #{number} — {title}.

Issue body: {full issue body}
Type: {type_hint}
Labels: {labels}
Repository: {working directory}

Explore the codebase thoroughly and produce a comprehensive technical plan.

Instructions:
1. Explore the codebase — find relevant files, understand patterns, trace dependencies
2. For bugs: identify root cause (what's broken, why, where)
3. For features: map architectural impact (what exists, what's needed, risks)
4. Design a technical approach with alternatives considered
5. Break the approach into self-sufficient execution steps where each step
   specifies: what to do, which files to modify, expected outcome, verification

Return your analysis as THREE clearly separated sections using the exact headers below:

---

## SPEC

### Summary
{1-2 paragraph overview of what this feature/fix is about}

### Root Cause (if bug)
{Root cause description — what, why, where. Omit section if not a bug.}

### Affected Files
| File | Role | Change Needed |
|------|------|---------------|
| {path} | {role} | {change} |

### Technical Approach
**Strategy:** {chosen approach}

#### Alternatives Considered
| Approach | Reason Rejected |
|----------|----------------|
| {alt} | {reason} |

#### Risks
| Risk | Mitigation | Severity |
|------|------------|----------|
| {risk} | {mitigation} | {low/med/high} |

### Scope
| Metric | Value |
|--------|-------|
| Files to touch | {count} |
| Complexity | {low/medium/high} |
| Estimated steps | {count} |

---

## VERIFY

### Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}
- ...

### Verification Steps
| Step | Method | Expected Outcome |
|------|--------|-----------------|
| {step} | {manual/automated/review} | {outcome} |

### Edge Cases
| Scenario | Expected Behavior |
|----------|------------------|
| {scenario} | {behavior} |

---

## TASKS

### Execution Plan

#### Step 1: {description}
- **Files:** {file paths with actions: create/modify/delete}
- **Details:** {specific changes to make}
- **Expected Outcome:** {what success looks like}
- **Verification:** {how to confirm this step worked}

#### Step 2: {description}
...
```

The Plan sub-agent returns its analysis as text output. It cannot write files.

#### 3. Write Planning Artifacts

Parse the Plan sub-agent's output and write **three files** to STM:

1. **`.phoenix-os/{issue}/planning/spec.md`** — Content from the `## SPEC` section
2. **`.phoenix-os/{issue}/planning/verify.md`** — Content from the `## VERIFY` section
3. **`.phoenix-os/{issue}/planning/tasks.md`** — Content from the `## TASKS` section

Each file should include a header:

```markdown
# {Section Title}: #{issue} — {title}
<!-- Generated by start-planned-feature recipe -->
<!-- Plan sub-agent output — do not edit manually -->

{section content}
```

#### 4. APPROVAL GATE (Tether / Vanish)

Present the plan summary to the user for review. Do NOT use EnterPlanMode or AskUserQuestion.

**Output format:**

```markdown
## Planned Feature: #{issue} — {title}

### Specification
{Brief summary from spec.md — strategy, scope, key files}

### Verification
{Count of acceptance criteria, verification approach}

### Execution
{Count of steps, estimated complexity}

### Artifacts Written
| Artifact | Path |
|----------|------|
| Specification | `.phoenix-os/{issue}/planning/spec.md` |
| Verification | `.phoenix-os/{issue}/planning/verify.md` |
| Task Breakdown | `.phoenix-os/{issue}/planning/tasks.md` |

---

Type **Tether** to proceed with implementation or **Vanish** to cancel.
```

Parse response:
- `Tether` / `tether` → continue to Phase 2
- `Vanish` / `vanish` → halt recipe, update checkpoint to REJECTED
- Anything else → ask for clarification

**This is the ONLY approval gate in the entire recipe.**

### Phase 2: EXECUTION (autonomous, no further approvals)

#### 5. Persist Checkpoint

Write checkpoint to STM:

`.phoenix-os/{issue}/checkpoint/start-planned-feature/{YYYYMMDD-HHMMSS}.md` with Status: APPROVED.

#### 6. Generate Execution Task Graph

Read `.phoenix-os/{issue}/planning/tasks.md` and create Claude Tasks from the execution steps:

```
TaskCreate: "Create branch {type}/{issue}-{slug}" (agent: repo-orchestrator)
TaskCreate: "Implement step 1: {description}" (agent: code-builder)
TaskCreate: "Implement step 2: {description}" (agent: code-builder)
... (all steps from tasks.md)
TaskCreate: "Commit and create PR" (agent: repo-orchestrator)
TaskCreate: "Report results" (agent: orchestrator)
```

**Self-sufficient principle:** Each task description contains ALL context needed — full step details, files to modify, specific changes, expected outcome, and verification method.

Set dependencies via `addBlockedBy` to enforce execution order.

#### 7. Create Branch

Invoke `repo-orchestrator` via Task tool:

```
subagent_type: "repo-orchestrator"
Agent: repo-orchestrator

Intent: create branch
Input:
  branch_name: "{type}/{issue_number}-{slug}"
  issue_number: {issue_number}
  push_to_origin: true
```

#### 8. Implement Changes

Invoke `code-builder` via Task tool:

```
subagent_type: "general-purpose"
Agent: code-builder

Intent: Implement all changes per execution plan
Input:
  execution_plan: {full content from tasks.md}
  issue_number: {issue}
  branch: "{branch_name}"
  repository_path: "{cwd}"

Execute each step from the execution plan sequentially.
For each step:
1. Read existing files before modifying
2. Make the changes specified
3. Verify against expected outcome
4. Document any deviations

Return results in the code-builder output contract format.
```

**Escape hatch:** If code-builder reports `success: false` with unresolvable issues, halt the recipe and report.

#### 9. Commit + Create PR

Invoke `repo-orchestrator` via Task tool:

```
subagent_type: "repo-orchestrator"
Agent: repo-orchestrator

Intent: Commit all changes and create pull request
Input:
  issue_number: {issue}
  branch: "{branch_name}"
  plan_summary: "{from spec.md}"
  commit_strategy: "group_by_type"
  pr_title: "{conventional commit style title}"
  pr_body_context:
    plan_reference: ".phoenix-os/{issue}/planning/spec.md"
    execution_reference: ".phoenix-os/{issue}/planning/tasks.md"
    verification_reference: ".phoenix-os/{issue}/planning/verify.md"
```

The repo-orchestrator:
1. Runs `analyze-changes` to understand what changed
2. Creates commits via `create-commit` (grouped by type)
3. Runs `analyze-pr` for checklist
4. Creates PR via `submit-pr` with plan references in body

#### 10. Report

Save implementation evidence:
- `.phoenix-os/{issue}/evidence/implementation.md`

Update checkpoint with all tasks completed.

Present final report to user.

## Artifact Templates

### Checkpoint Artifact

```markdown
# Start Planned Feature Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** start-planned-feature
- **Step:** {current-step} of 10
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| Resolve/create issue | {pending|completed} | project-orchestrator |
| Deep analysis + RCA + plan | {pending|completed} | Plan sub-agent |
| Write planning artifacts | {pending|completed} | orchestrator |
| Plan approval | {pending|completed} | orchestrator (Tether/Vanish) |
| Persist checkpoint | {pending|completed} | orchestrator |
| Create branch | {pending|completed} | repo-orchestrator |
| Implement changes | {pending|completed} | code-builder |
| Commit + create PR | {pending|completed} | repo-orchestrator |
| Report | {pending|completed} | orchestrator |

## Completed Outputs
### Issue
| Field | Value |
|-------|-------|
| Number | #{number} |
| Title | {title} |
| Labels | {labels} |
| State | {state} |
| URL | {url} |
| Created | {yes/no} |
| Parent | {parent or N/A} |

## Branch
| Field | Value |
|-------|-------|
| Type | {type_hint} |
| Branch | `{branch_name}` |

## Plan
| Field | Value |
|-------|-------|
| Approach | {strategy summary} |
| Files | {count} |
| Steps | {count} |
| Complexity | {low/medium/high} |

## Planning Artifacts
| Artifact | Path |
|----------|------|
| Specification | `.phoenix-os/{issue}/planning/spec.md` |
| Verification | `.phoenix-os/{issue}/planning/verify.md` |
| Task Breakdown | `.phoenix-os/{issue}/planning/tasks.md` |

## Decision
- **Approval Status:** {PENDING_APPROVAL|APPROVED|REJECTED}
```

### Final Report

```markdown
# Planned Feature Complete

## Overview
| Field | Value |
|-------|-------|
| Issue | #{issue} — {title} |
| Branch | `{branch}` |
| PR | #{pr_number} — {pr_url} |
| Commits | {count} |

## What Happened
1. Issue resolved: #{issue}
2. Plan sub-agent: codebase analyzed, RCA + technical plan produced
3. Planning artifacts written to `.phoenix-os/{issue}/planning/`
4. Plan approved by user (Tether)
5. Branch created: `{branch}`
6. {N} implementation steps executed
7. Changes committed ({commit_count} commits)
8. PR created: {pr_url}

## Evidence Trail
| Artifact | Location |
|----------|----------|
| Specification | `.phoenix-os/{issue}/planning/spec.md` |
| Verification | `.phoenix-os/{issue}/planning/verify.md` |
| Task Breakdown | `.phoenix-os/{issue}/planning/tasks.md` |
| Implementation | `.phoenix-os/{issue}/evidence/implementation.md` |
| Checkpoint | `.phoenix-os/{issue}/checkpoint/start-planned-feature/{ts}.md` |

## PR Checklist
{from analyze-pr output}
```

## Escape Hatches

The recipe halts if:

| Condition | Action |
|-----------|--------|
| User types Vanish at approval gate | Recipe stops, checkpoint updated to REJECTED |
| Code-builder reports `success: false` | Recipe stops, partial evidence saved, user notified |
| Repo-orchestrator fails branch creation | Recipe stops, plan preserved, user notified |
| Repo-orchestrator fails PR creation | Recipe stops, commits preserved, user can manually create PR |
| `type_hint` is `null` | Default to `feature/` prefix (no blocking prompt in planned flow) |

## Agent Call Budget

| # | Agent | Phase | Purpose |
|---|-------|-------|---------|
| 1 | `project-orchestrator` | Planning | Resolve/create issue |
| 2 | Plan sub-agent (`subagent_type: "Plan"`) | Planning | Codebase analysis + RCA + technical plan |
| 3 | `repo-orchestrator` | Execution | Create and push branch |
| 4 | `code-builder` | Execution | Implement all changes per execution plan |
| 5 | `repo-orchestrator` | Execution | Commit all changes + create PR |

**Total: 3 distinct agents** (5 invocations, within L2 ≤5 distinct agents limit)

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 2.0.0 |
| Distinct Agents | 3 (project-orchestrator, repo-orchestrator, code-builder) |
| Checkpoint | Single (plan approval via Tether/Vanish) |
