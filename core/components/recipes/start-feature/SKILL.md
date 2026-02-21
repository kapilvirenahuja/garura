---
name: start-feature
description: Create or resume a work context — issue + branch + STM directory
user-invocable: true
model: sonnet
level: L1
agent_calls: 2
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet

# === Three Elements of Intent (IDD) ===
intent: >
  Create or resume a work context — issue + branch + STM directory —
  as the universal precursor to all tracked work.

constraints:
  - Must always be the first step for any work
  - Branch name MUST follow convention: {type}/{issue_number}-{slug}
  - Slug max 40 characters, lowercase, hyphenated, derived from issue title
  - Always checkpoint before branch creation — branches are externally visible
  - If type_hint is null, user MUST select type before proceeding
  - Two-phase STM write when issue does not yet exist (ADR 008)
  - Orchestrator MUST delegate to agents — never execute git/gh commands directly
  - Maximum 2 distinct agents (project-orchestrator, repo-orchestrator); each may be called multiple times
  - Recovery agent calls are exempt from the agent limit

failure_conditions:
  - User rejects proposed branch at checkpoint (Vanish)
  - Branch creation fails on origin
  - Issue cannot be resolved or created on GitHub
  - Issue ID not found (resume mode)
  - Branch already exists and has conflicts
  - type_hint is null and user does not provide a selection
---

# start-feature

Universal precursor to all tracked work. Creates or resumes a work context: GitHub issue, type-aware branch, and STM directory.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

## Input Patterns

| Pattern | Mode | Example |
|---------|------|---------|
| `"Add OAuth login"` | NEW | Create issue, create branch, initialize STM |
| `42` or `#42` | NEW | Resolve existing issue, create branch, initialize STM |
| `--resume 42` | RESUME | Resolve issue, checkout existing branch, verify STM |
| `--parent 10` | (modifier) | Attach as sub-issue to parent |

```
/start-feature "Add OAuth login"                    → NEW mode
/start-feature 42                                   → NEW mode (existing issue)
/start-feature --resume 42                          → RESUME mode
/start-feature "Login validation" --parent 42       → NEW mode with parent
```

## Outcomes by Mode

### NEW Mode

When done, the following must be true:

1. **Issue exists on GitHub** — created or resolved from input. Has type_hint, labels, title.
2. **Branch exists on origin** — follows naming convention, pushed with tracking. User approved at checkpoint.
3. **STM directory initialized** — `.phoenix-os/{issue}/` with required subdirectories.
4. **Checkpoint artifact written** — records decision trail in STM.
5. **Roadmap link offered** — if `.phoenix-os/project/product/` exists, user was offered the option to link issue to a roadmap feature.

### RESUME Mode

When done, the following must be true:

1. **Issue resolved** — existing issue found and loaded. Fail if not found.
2. **On the correct branch** — existing branch checked out, working tree ready.
3. **STM directory verified** — exists with required subdirectories; created if missing.
4. **No checkpoint needed** — branch already exists, no externally visible action.

## Agents

| Agent | Domain | Invoked Via |
|-------|--------|-------------|
| project-orchestrator | Issue resolution/creation, epic linking | `Task` tool with `subagent_type: "project-orchestrator"` |
| repo-orchestrator | Branch creation, checkout, push to origin | `Task` tool with `subagent_type: "repo-orchestrator"` |

Intent must be propagated to every agent invocation: `"Intent: {action}: {context}"`

## Contracts

These are interfaces that downstream recipes depend on. They must be honored exactly.

### 1. STM Directory Structure

```
.phoenix-os/{issue}/
├── spec/          # define-feature, start-planned-feature write here
├── design/        # design-feature, tech-designer write here
├── evidence/      # verify-feature, validator write here
├── delivery/      # deliver-feature, create-pr write here
└── checkpoint/    # all recipes write checkpoint artifacts here
```

### 2. Branch Naming Convention

```
{type}/{issue_number}-{slug}
```

| type_hint | Branch Prefix |
|-----------|---------------|
| `feature` | `feature/` |
| `fix` | `fix/` |
| `hotfix` | `hotfix/` |
| `refactor` | `refactor/` |
| `docs` | `docs/` |
| `chore` | `chore/` |
| `null` | User selects during checkpoint |

Slug: lowercase issue title, spaces/special chars → hyphens, no consecutive hyphens, max 40 chars, no trailing hyphens.

Reference: `~/.phoenix-os/core/memory/practices/git/branching.md`

### 3. Two-Phase STM Write (ADR 008)

When issue number is not yet known (description-only input):
- **Phase 1:** Write to `.phoenix-os/_pending/{YYYYMMDD-HHMMSS}/` (temporary)
- **Phase 2:** After issue is created, move to `.phoenix-os/{issue}/` and delete `_pending/` entry

When issue number is known upfront: write directly to `.phoenix-os/{issue}/`.

### 4. Checkpoint Artifact

Path: `.phoenix-os/{issue}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md`

```markdown
# Start Feature Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** start-feature
- **Mode:** {NEW|RESUME}
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Issue
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

## Decision
- **Approval Status:** {PENDING|APPROVED|REJECTED}
```

### 5. User Approval (NEW Mode Only)

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
Any other response → clarify before proceeding.
```

### 6. Final Report

```markdown
# Feature Started

## Overview

| Field | Value |
|-------|-------|
| Mode | {NEW / RESUME} |
| Issue | #{number} — {title} |
| URL | {issue_url} |
| Branch | `{branch_name}` |
| Tracking | `{origin/branch_name}` |
| STM | `.phoenix-os/{issue}/` |
| Worktree | {path or N/A} |

## What Happened

{Narrative summary of actions taken — not a prescribed list.}

## Next Steps — Choose Your Speed

| Speed | Time | Command | When to use |
|-------|------|---------|-------------|
| **Fast** | Minutes | `/build-feature` → `/commit-code` → `/deliver-feature` | Small change, no spec needed |
| **Planned** | Hours | `/start-planned-feature` | Needs design but not full spec |
| **Strategic** | Days | `/discover-product` → full SDLC pipeline | New product capability |
```

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) |
| Checkpoint | NEW mode: always. RESUME mode: only if STM created. |
