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

### 2. Checkpoint

Write artifact to STM: `.phoenix-os/project/checkpoints/commit-code/{YYYYMMDD-HHMMSS}.md`

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

### 3. Execute

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

### 4. Report

Present summary with commit hashes, files changed, and validation status.

## Artifact Templates

### Checkpoint Artifact

```markdown
# Commit Checkpoint

**Created:** {YYYY-MM-DD HH:MM:SS}
**Branch:** {branch_name}
**Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Proposed Commits

{for each group}
### {type}({scope}): {subject}
- Files: {file_list}
{end for}

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
| Version | 2.0.0 |
| Agent Calls | 2 |
| Checkpoint | Conditional |
