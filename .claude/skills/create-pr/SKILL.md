---
name: create-pr
description: Create pull request with dynamic, context-aware quality checklist
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# create-pr

Create a pull request with a context-aware quality checklist based on what changed.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

## Tasks

| Task | Agent | Verification |
|------|-------|--------------|
| Analyze PR readiness | repo-orchestrator | Checklist generated, blocking issues identified |
| Checkpoint decision | orchestrator | User approved |
| Create pull request | repo-orchestrator | PR created with checklist |

## Workflow

### 1. Analyze

Invoke `repo-orchestrator` to run `analyze-pr` skill.

**Expected output:**
```yaml
analysis:
  branch: {branch_name}
  base: {base_branch}
  suggested_title: "{conventional commit title}"
  context:
    file_patterns_matched: [list]
    commit_types: [list]
  checklist:
    must_have:
      - item: "{description}"
        trigger: "{why}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{details}"
    nice_to_have:
      - item: "{description}"
        trigger: "{why}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{details}"
  blocking_issues: [list]
  ready: true/false
```

### 2. Checkpoint

**Issue context:** Extract issue number from the current branch name (e.g., `feature/7-...` → issue #7). The issue number is required for the checkpoint path. If no issue number can be extracted, this recipe cannot proceed — NWWI principle applies.

Write artifact to STM: `.phoenix-os/{issue-number}/checkpoint/create-pr/{YYYYMMDD-HHMMSS}.md`

**Always checkpoint.** PRs are externally visible.

Present summary and wait for `Approve` or `Reject`.

### 3. Execute

Invoke `repo-orchestrator` to run `submit-pr` skill.

**Expected output:**
```yaml
result:
  success: true/false
  pr:
    number: {number}
    url: "{url}"
    state: "{open|draft}"
    title: "{title}"
  checklist:
    required_count: {count}
    optional_count: {count}
```

### 4. Report

Present summary with PR URL, checklist summary, and next steps.

## Artifact Templates

### Checkpoint Artifact

```markdown
# Create PR Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** create-pr
- **Step:** {current-step} of 4
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}
- **Branch:** {branch_name}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| Analyze PR readiness | {pending|completed} | repo-orchestrator |
| Checkpoint approval | {pending|completed} | orchestrator |
| Create pull request | {pending|completed} | repo-orchestrator |
| Report | {pending|completed} | orchestrator |

## Completed Outputs
{Analysis results: branch, base, suggested title, checklist}

## Quality Checklist

### Must-Have (blocking)
| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item} | {trigger} | {status} | {evidence} |

### Nice-to-Have (optional)
| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item} | {trigger} | {status} | {evidence} |

## Current Step
Awaiting user approval for PR creation.

## Inputs Needed to Continue
- User approval (Approve/Reject)

## Decision
- **Approval Status:** {status}
```

### User Approval Prompt

```markdown
## Proposed Pull Request

**Title:** {suggested_title}

### Details

| Field | Value |
|-------|-------|
| Base | {base_branch} |
| Head | {current_branch} |
| Commits | {commit_count} |

### Quality Checklist (Generated)

#### Must-Have (blocking)

| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item} | {trigger} | ✅/❌/⏳ {status} | {evidence} |

#### Nice-to-Have (optional)

| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item} | {trigger} | ✅/❌/⏳ {status} | {evidence} |

### Blocking Issues

{list_or_None}

---

Type **Approve** to create the PR or **Reject** to cancel.
```

**Status emoji mapping:** PASS → ✅, FAIL → ❌, REVIEW → ⏳

### Final Report

```markdown
# Pull Request Created

## Overview

| Field | Value |
|-------|-------|
| PR | #{number} |
| URL | {url} |
| Title | {title} |
| Base | {base} ← {head} |
| State | {open/draft} |

## Checklist in PR

**{required_count}** required items, **{optional_count}** optional items.

## Next Steps

1. Share PR link with reviewers
2. Complete manual checklist items
3. Address any failing automated checks
4. Merge when all required items pass
```

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 2.0.1 |
| Agent Calls | 2 |
| Checkpoint | Always |
