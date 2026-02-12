---
name: start-feature
description: Start feature work by resolving/creating an issue, deriving a branch, and pushing to origin
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# start-feature

Start feature work: resolve or create a GitHub issue, derive a type-aware branch name, create the branch, and push to origin.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

## Tasks

| Task | Agent | Verification |
|------|-------|--------------|
| Resolve or create issue | project-orchestrator | Issue returned with type_hint |
| Checkpoint decision | orchestrator | User approved branch name and issue |
| Create and push branch | repo-orchestrator | Branch created and tracking origin |

## Input Parsing

Parse the user's input to determine the intent:

| Input Pattern | Interpretation |
|---------------|----------------|
| Bare number: `42`, `#42` | `issue_number: 42` — read existing issue |
| Text: `"Add OAuth login"` | `description: "Add OAuth login"` — resolve or create |
| With parent: `--parent 10` or `--parent #10` | `parent_issue_number: 10` — attach as sub-issue |

**Examples:**
```
/start-feature 42                          → issue_number: 42
/start-feature "Add OAuth login"           → description: "Add OAuth login"
/start-feature "Login validation" --parent 42  → description: "Login validation", parent: 42
/start-feature #42                         → issue_number: 42
```

## Workflow

### 1. Resolve Issue

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

**Important:** If a description is provided without an issue number, the agent MUST create a new GitHub issue using the `manage-issue` skill with `action: create`. Do not skip issue creation.

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

### 2. Derive Branch Name

Using the issue data, construct a branch name:

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
| `null` | User selects during checkpoint |

**Slug derivation:**
- Take issue title
- Lowercase
- Replace spaces and special chars with hyphens
- Remove consecutive hyphens
- Truncate to max 40 characters
- Remove trailing hyphens

**Example:** Issue #42 "Add OAuth Login Flow" with type_hint `feature` → `feature/42-add-oauth-login-flow`

Reference branch naming conventions from: `core/components/memory/practices/git/branching.md`

### 3. Checkpoint

Write artifact to STM using **two-phase write** (ADR 008):

**Phase 1 (pre-issue):** If issue is being created (not yet resolved):
- Write checkpoint to: `.phoenix-os/_pending/{YYYYMMDD-HHMMSS}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md`
- This is a temporary location

**Phase 2 (post-issue):** After issue is resolved/created and issue number is known:
- Move from `_pending/` to: `.phoenix-os/{issue-number}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md`
- Delete the `_pending/{timestamp}/` directory

**If issue number is provided upfront** (e.g., `/start-feature 7`):
- Skip Phase 1, write directly to: `.phoenix-os/{issue-number}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md`

**Always checkpoint.** Branch creation is externally visible.

If `type_hint` is `null`, the checkpoint MUST prompt the user to select a type before proceeding.

Present summary and wait for `Tether` or `Vanish`.

**After user responds**, update the checkpoint artifact:
1. Set `Status` to `APPROVED` or `REJECTED`
2. Set `Approval Status` to `APPROVED` or `REJECTED`
3. Mark `Checkpoint approval` task as `completed`
4. Advance `Step` to `4 of 5`

If `REJECTED`, stop execution — do not proceed to Step 4.

### 4. Create Branch

Invoke `repo-orchestrator` via Task tool:

```
subagent_type: "repo-orchestrator"
Agent: repo-orchestrator

Intent: create branch and push to origin using the setup-branch skill
Input:
  branch_name: "{derived_branch_name}"
  issue_number: {issue_number}
  push_to_origin: true
```

**Important:** The agent MUST use the `setup-branch` skill, which handles worktree creation for dirty working trees, stashing for small changes, and pushing to origin.

**Expected output:**
```yaml
result:
  success: true/false
  branch:
    name: "{branch_name}"
    base_ref: "{base}"
    pushed: true/false
    tracking: "{origin/branch_name}"
  worktree:
    used: true/false
    path: "{path or null}"
    reason: "{reason or null}"
  error: "{message if failed}"
```

### 5. Report

Present final summary with all results.

**After reporting**, update the checkpoint artifact:
1. Mark all remaining tasks (`Create and push branch`, `Report`) as `completed`
2. Set `Step` to `5 of 5`

## Artifact Templates

### Checkpoint Artifact

```markdown
# Start Feature Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** start-feature
- **Step:** {current-step} of 5
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| Resolve/create issue | {pending|completed} | project-orchestrator |
| Derive branch name | {pending|completed} | orchestrator |
| Checkpoint approval | {pending|completed} | orchestrator |
| Create and push branch | {pending|completed} | repo-orchestrator |
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

## Proposed Branch
| Field | Value |
|-------|-------|
| Type | {type_hint or NEEDS SELECTION} |
| Branch | `{branch_name}` |
| Convention | `{type}/{issue_number}-{slug}` |

## Current Step
Awaiting user approval for branch creation.

## Inputs Needed to Continue
- User approval (Tether/Vanish)
- Type selection (if type_hint is null)

## Decision
- **Approval Status:** {status}
```

### User Approval Prompt

```markdown
## Proposed Feature Start

### Issue

| Field | Value |
|-------|-------|
| Number | #{number} |
| Title | {title} |
| URL | {url} |
| Created | {new issue / existing issue} |

### Proposed Branch

**`{branch_name}`**

{If type_hint is null:}
> **Type selection required.** Could not determine branch type from issue labels or title.
> Please specify: `feature`, `fix`, `hotfix`, `refactor`, `docs`, or `chore`

---

Type **Tether** to create the branch or **Vanish** to cancel.
```

### Final Report

```markdown
# Feature Started

## Overview

| Field | Value |
|-------|-------|
| Issue | #{number} — {title} |
| URL | {issue_url} |
| Branch | `{branch_name}` |
| Tracking | `{origin/branch_name}` |
| Worktree | {path or N/A} |

## What Happened

1. {Issue resolved/created}: #{number}
{2. Sub-issue attached to #{parent} (if applicable)}
3. Branch created: `{branch_name}`
4. Pushed to origin with tracking

## Next Steps

1. Start working on the feature
2. When ready, use `/commit-code` to commit changes
3. When complete, use `/create-pr` to open a pull request
```

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.2 |
| Agent Calls | 2 |
| Checkpoint | Always |
