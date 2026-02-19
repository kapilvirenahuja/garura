---
name: commit-code
description: Commit code changes grouped by issue type with conventional messages
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet

# === Three Elements of Intent (IDD) ===
intent: >
  Safely persist completed work as conventional commits with full traceability
  to a tracked issue.

constraints:
  - MUST NOT commit on protected branches (main, master, develop)
  - All commits MUST reference a valid GitHub issue (NWWI principle)
  - Commits MUST use conventional commit format (type(scope): subject)
  - One logical change type per commit
  - Sensitive files (credentials, secrets, env) require explicit human approval
  - Orchestrator MUST delegate to agents — never execute git commands directly
  - Maximum 2 distinct agents (repo-orchestrator, project-orchestrator); each may be called multiple times
  - Recovery agent calls are exempt from the agent limit

failure_conditions:
  - Current branch is a protected branch (main, master, develop)
  - No valid issue ID resolvable from branch name or user input
  - User rejects proposed commits at checkpoint (Vanish)
  - Working tree is not clean after commit execution
  - Commit does not pass conventional format validation
---

# commit-code

Commit uncommitted changes with conventional commit messages, grouped by issue type.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands.

## Recovery

When any failure condition is triggered, follow the intent-driven recovery practice before halting.

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

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

Before writing any checkpoint, verify an issue ID is available. **All issue operations MUST go through `project-orchestrator`** — never use `repo-orchestrator` for issue lookups.

1. Extract issue number from the current branch name (e.g., `feature/7-...` → issue #7)
2. If no issue number found in branch name, invoke `project-orchestrator` to search for a matching issue based on the change analysis from Step 1
3. If a matching issue is found, use it. If multiple candidates, present them to the user.
4. If no matching issue is found, invoke `project-orchestrator` to create one
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

**If checkpoint needed**, present summary and wait for `Tether` or `Vanish`.

**After user responds (or auto-approve)**, update the checkpoint artifact:
1. Set `Status` to `APPROVED` or `REJECTED`
2. Set `Approval Status` to `APPROVED`, `REJECTED`, or `Auto-Approved`
3. Set `Auto-Approved` to `yes` or `no`
4. Mark `Checkpoint approval` task as `completed`
5. Advance `Step` to `4 of 5`

If auto-approved, write the checkpoint directly with `Status: APPROVED` and `Auto-Approved: yes`.

If `REJECTED`, stop execution — do not proceed to Step 4.

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

**After reporting**, update the checkpoint artifact:
1. Mark all remaining tasks (`Execute commits`, `Report`) as `completed`
2. Set `Step` to `5 of 5`

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
- User approval (Tether/Vanish)

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

Type **Tether** to proceed or **Vanish** to cancel.
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
| Version | 2.1.0 |
| Distinct Agents | 2 (repo-orchestrator, project-orchestrator) |
| Checkpoint | Conditional |
