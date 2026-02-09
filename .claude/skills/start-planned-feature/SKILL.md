---
name: start-planned-feature
description: Plan a feature with RCA and technical design, then implement end-to-end through PR
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, EnterPlanMode, ExitPlanMode, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# start-planned-feature

Plan a complex feature or bug fix with deep technical analysis and RCA, get user approval on the plan, then implement autonomously through PR creation.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, or any direct git/gh commands.

## Tasks

| Task | Agent | Verification |
|------|-------|--------------|
| Resolve or create issue | project-orchestrator | Issue returned with type_hint |
| Deep analysis + RCA + plan | tech-designer (Explore) | Structured analysis in contract format |
| Plan approval | orchestrator (plan mode) | User approves via ExitPlanMode |
| Persist plan to STM | orchestrator | Evidence files written to STM docs/ |
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

#### 2. Enter Plan Mode

Call `EnterPlanMode`. This switches to read-only mode where only the plan file can be written.

#### 3. Deep Analysis + RCA + Plan

Invoke `tech-designer` as Explore sub-agent:

```
subagent_type: "Explore"
Agent: tech-designer

You are the tech-designer agent. Analyze the following issue and produce
a comprehensive technical plan.

Issue: #{number} — {title}
Body: {full issue body}
Type: {type_hint}
Labels: {labels}
Repository: {working directory}

Instructions:
1. Explore the codebase thoroughly — find relevant files, understand patterns,
   trace dependencies
2. For bugs: identify root cause (what's broken, why, where)
3. For features: map architectural impact (what exists, what's needed, risks)
4. Design a technical approach with alternatives considered
5. Break the approach into self-sufficient execution steps where each step
   specifies: what to do, which files to modify, expected outcome, verification

Return your analysis in the structured format specified in the tech-designer
output contract.
```

Tech-designer returns analysis as text output.

#### 4. Write Plan to Plan File

Write the tech-designer's analysis to the **plan file** in structured markdown format. This is the only writable location in plan mode.

**Plan file format:**

```markdown
# Technical Plan: #{issue} — {title}

## Analysis Summary
{1-2 paragraph overview}

## Root Cause (if bug)
{Root cause description — what, why, where}

## Affected Files
| File | Role | Change Needed |
|------|------|---------------|
| {path} | {role} | {change} |

## Technical Approach
**Strategy:** {chosen approach}

### Alternatives Considered
| Approach | Reason Rejected |
|----------|----------------|
| {alt} | {reason} |

### Risks
| Risk | Mitigation | Severity |
|------|------------|----------|
| {risk} | {mitigation} | {low/med/high} |

## Execution Plan

### Step 1: {description}
- **Files:** {file paths with actions: create/modify/delete}
- **Details:** {specific changes to make}
- **Expected Outcome:** {what success looks like}
- **Verification:** {how to confirm this step worked}

### Step 2: {description}
...

## Scope
| Metric | Value |
|--------|-------|
| Files to touch | {count} |
| Complexity | {low/medium/high} |
| Estimated steps | {count} |
```

#### 5. Exit Plan Mode = APPROVAL GATE

Call `ExitPlanMode`. This presents the plan file to the user for review.

**What happens:**
- User sees the full plan
- User can iterate natively — edit the plan file, ask questions, request changes
- Claude updates the plan (may re-invoke tech-designer Explore for major rethinks)
- User approves → recipe continues in normal mode
- User rejects → recipe halts

**This is the ONLY approval gate in the entire recipe.** Plan mode's native approval flow handles iteration naturally.

### Phase 2: EXECUTION (autonomous, no further approvals)

#### 6. Persist Plan to STM

After approval, read the approved plan file and write evidence to STM:
- `.phoenix-os/{issue}/docs/rca.md` (for bugs) or `.phoenix-os/{issue}/docs/analysis.md` (for features)
- `.phoenix-os/{issue}/docs/tech-plan.md`
- `.phoenix-os/{issue}/docs/execution-plan.md`

Write checkpoint: `.phoenix-os/{issue}/checkpoint/start-planned-feature/{YYYYMMDD-HHMMSS}.md` with Status: APPROVED.

#### 7. Generate Execution Task Graph

Create Claude Tasks from the approved execution plan:

```
TaskCreate: "Create branch {type}/{issue}-{slug}" (agent: repo-orchestrator)
TaskCreate: "Implement step 1: {description}" (agent: code-builder)
TaskCreate: "Implement step 2: {description}" (agent: code-builder)
... (all steps from execution plan)
TaskCreate: "Commit and create PR" (agent: repo-orchestrator)
TaskCreate: "Report results" (agent: orchestrator)
```

**Self-sufficient principle:** Each task description contains ALL context needed — full step details, files to modify, specific changes, expected outcome, and verification method.

Set dependencies via `addBlockedBy` to enforce execution order.

#### 8. Create Branch

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

#### 9. Implement Changes

Invoke `code-builder` via Task tool:

```
subagent_type: "general-purpose"
Agent: code-builder

Intent: Implement all changes per execution plan
Input:
  execution_plan: {full plan from approved plan file}
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

#### 10. Commit + Create PR

Invoke `repo-orchestrator` via Task tool:

```
subagent_type: "repo-orchestrator"
Agent: repo-orchestrator

Intent: Commit all changes and create pull request
Input:
  issue_number: {issue}
  branch: "{branch_name}"
  plan_summary: "{from approved plan}"
  commit_strategy: "group_by_type"
  pr_title: "{conventional commit style title}"
  pr_body_context:
    plan_reference: ".phoenix-os/{issue}/docs/tech-plan.md"
    execution_reference: ".phoenix-os/{issue}/docs/execution-plan.md"
```

The repo-orchestrator:
1. Runs `analyze-changes` to understand what changed
2. Creates commits via `create-commit` (grouped by type)
3. Runs `analyze-pr` for checklist
4. Creates PR via `submit-pr` with plan references in body

#### 11. Report

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
- **Step:** {current-step} of 11
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| Resolve/create issue | {pending|completed} | project-orchestrator |
| Deep analysis + RCA | {pending|completed} | tech-designer |
| Plan approval | {pending|completed} | orchestrator (plan mode) |
| Persist plan to STM | {pending|completed} | orchestrator |
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
2. Plan mode: codebase analyzed, RCA + technical plan produced
3. Plan approved by user
4. Branch created: `{branch}`
5. {N} implementation steps executed
6. Changes committed ({commit_count} commits)
7. PR created: {pr_url}

## Evidence Trail
| Artifact | Location |
|----------|----------|
| RCA/Analysis | `.phoenix-os/{issue}/docs/rca.md` |
| Technical Plan | `.phoenix-os/{issue}/docs/tech-plan.md` |
| Execution Plan | `.phoenix-os/{issue}/docs/execution-plan.md` |
| Implementation | `.phoenix-os/{issue}/evidence/implementation.md` |
| Checkpoint | `.phoenix-os/{issue}/checkpoint/start-planned-feature/{ts}.md` |

## PR Checklist
{from analyze-pr output}
```

## Escape Hatches

The recipe halts if:

| Condition | Action |
|-----------|--------|
| User rejects plan in ExitPlanMode | Recipe stops, checkpoint updated to REJECTED |
| Code-builder reports `success: false` | Recipe stops, partial evidence saved, user notified |
| Repo-orchestrator fails branch creation | Recipe stops, plan preserved, user notified |
| Repo-orchestrator fails PR creation | Recipe stops, commits preserved, user can manually create PR |
| `type_hint` is `null` | Default to `feature/` prefix (no blocking prompt in planned flow) |

## Agent Call Budget

| # | Agent | Phase | Purpose |
|---|-------|-------|---------|
| 1 | `project-orchestrator` | Planning | Resolve/create issue |
| 2 | `tech-designer` (Explore) | Planning | Codebase analysis + RCA + technical plan |
| 3 | `repo-orchestrator` | Execution | Create and push branch |
| 4 | `code-builder` | Execution | Implement all changes per execution plan |
| 5 | `repo-orchestrator` | Execution | Commit all changes + create PR |

**Total: 5 agent calls** (within L2 ≤5 limit)

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 1.0.0 |
| Agent Calls | 5 |
| Checkpoint | Single (plan approval via ExitPlanMode) |
