---
name: commit-code
description: Commit code changes grouped by issue type with conventional messages
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# commit-code

Commit uncommitted changes with conventional commit messages, grouped by issue type.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands.

## Tasks

| Task | Agent | Verification |
|------|-------|--------------|
| Analyze uncommitted changes | repo-orchestrator | Groups extracted, risks identified |
| NWWI gate | orchestrator | Issue ID resolved from branch or user |
| Checkpoint decision | orchestrator | User approved (or auto-approved) |
| Execute commits | repo-orchestrator | Clean working tree |

## Workflow

### 1. Analyze

Invoke `repo-orchestrator` to run `analyze-changes` skill.

**Expected output:**
```yaml
analysis:
  branch: {branch_name}
  checkpoint_needed: true/false
  checkpoint_reason: "{reason}"
  groups:
    - type: {feat|fix|refactor|docs|test|chore}
      scope: {component}
      subject: {description}
      files: [list]
  risks:
    sensitive_files: [list]
    breaking_changes: [list]
```

### 2. NWWI Gate

Before writing any checkpoint, verify an issue ID is available:

1. Extract issue number from the current branch name (e.g., `feature/7-...` → issue #7)
2. If no issue number found in branch name, prompt the user:
   ```
   No issue ID found in branch name. NWWI requires an issue for commits.
   Please provide an issue number or type "create" to create a new issue.
   ```
3. If user provides a number, validate it exists via `project-orchestrator`
4. If user types "create", invoke `project-orchestrator` to create an issue
5. Store the resolved `{issue-number}` for checkpoint path construction

**This is a hard gate. Do not proceed to checkpoint without a valid issue ID.**

### 3. Checkpoint

Write artifact to STM: `.phoenix-os/{issue-number}/checkpoint/commit-code/{YYYYMMDD-HHMMSS}.md`

**Auto-approve when ALL:**
- Single logical group
- No sensitive files
- No breaking changes
- Clear issue type
- NOT a hotfix branch

**Checkpoint when ANY:**
- Multiple logical groups
- Sensitive files in changes
- Breaking changes detected
- Ambiguous/mixed issue types
- Branch is `hotfix/*` or `hotfix-*`

**If checkpoint needed**, present summary and wait for `Approve` or `Reject`.

### 4. Execute

Invoke `repo-orchestrator` to run `create-commit` skill for each approved group.

**Expected output:**
```yaml
result:
  success: true/false
  commit:
    hash: {sha}
    type: {type}
    scope: {scope}
    subject: {subject}
    files: [list]
  validation:
    clean_tree: true/false
    conventional_format: true/false
```

### 5. Report

Present summary with commit hashes, files changed, and validation status.

## Artifact Templates

### Checkpoint Artifact

```markdown
# Commit Code Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** commit-code
- **Step:** {current-step} of 5
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}
- **Branch:** {branch_name}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| Analyze changes | {pending|completed} | repo-orchestrator |
| NWWI gate | {pending|completed} | orchestrator |
| Checkpoint approval | {pending|completed} | orchestrator |
| Execute commits | {pending|completed} | repo-orchestrator |
| Report | {pending|completed} | orchestrator |

## Completed Outputs
{Analysis results from step 1: groups, risks, branch info}

## Proposed Commits

{for each group}
### {type}({scope}): {subject}
- Files: {file_list}
{end for}

## Current Step
Awaiting user approval for proposed commits.

## Inputs Needed to Continue
- User approval (Approve/Reject)

## Decision
- **Auto-Approved:** {yes/no}
- **Approval Status:** {status}
```

### User Approval Prompt

```markdown
## Proposed Commits

**Reason for checkpoint:** {checkpoint_reason}

### 1. {type}({scope}): {subject}

| Attribute | Value |
|-----------|-------|
| Type | {type} |
| Scope | {scope} |
| Files | {count} |

**Files:**
- `{file1}`
- `{file2}`

---

Type **Approve** to proceed or **Reject** to cancel.
```

### Final Report

```markdown
# Commit Summary

## Overview

| Metric | Value |
|--------|-------|
| Total Commits | {n} |
| Files Changed | {n} |
| Branch | {branch_name} |
| Auto-Approved | {yes/no} |

## Commits

### 1. {type}({scope}): {subject}

- **Hash**: `{hash}`
- **Files**: {file_list}

## Validation

| Criteria | Status |
|----------|--------|
| All changes committed | {pass/fail} |
| One type per commit | {pass/fail} |
| Conventional format | {pass/fail} |
| No sensitive files | {pass/fail} |
```

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 2.0.1 |
| Agent Calls | 2 |
| Checkpoint | Conditional |
