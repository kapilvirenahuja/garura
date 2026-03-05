---
name: start-feature
description: Create or resume a work context — assess current state, resolve or create an issue, create or switch to a feature branch, initialize STM directory
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, Bash, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# start-feature

Given any starting state — uncommitted changes, an issue number, or a descriptive title — produce a ready-to-work environment: a GitHub issue tracking the work, a feature branch checked out by convention, and an initialized STM directory. Single flow, no modes. Uncommitted changes always preserved.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C10), failure conditions (F1–F8), and acceptance scenarios (S1–S5). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents via JSON contracts — never execute domain work directly.

**Forbidden:** Direct `git` commands for branch creation/switching. Direct `gh` commands for issue operations. All domain work goes through agents.

**Agent boundaries:**

| Agent | Domain | Stages |
|-------|--------|--------|
| `project-orchestrator` | Issues: resolve issues, create issues, confidence scoring | 2 |
| `repo-orchestrator` | Git: create/switch branches, carry forward changes | 5 |

**Infrastructure agents (do not count toward budget):**

| Agent | Domain | Stage |
|-------|--------|-------|
| `intent-resolver` | Intent decomposition | 1 |

## Fixed Stages

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work | project-orchestrator |
| 5 | Generation | Domain work | repo-orchestrator |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

Infrastructure stages (0, 1, 6, 7) do NOT count toward the agent budget.
Domain work stages (2, 5) count toward the budget: **2 domain agents (L1 max).**

Stages 3 and 4 are inactive — this recipe uses the `direct-generation` workflow (no brief, no checkpoint). The only human interaction is ambiguity resolution during Stage 2 (C5).

## Two Core Phases

- **Readiness phase** (Stage 2): Capture changed files, resolve or create the issue, assess confidence, validate against failure conditions. Everything needed to know WHAT work context to create.
- **Generation phase** (Stage 5): Create or switch to the feature branch, initialize STM directory. PRODUCING the work context.

Before generation: getting READY (what issue? what branch name?). After readiness: GENERATING the environment.

## STM Data Flow Rules

```
Stage 2 → project-orchestrator writes STRUCTURED DATA to STM (source of truth)
           - changed files captured by recipe (infrastructure)
           - issue resolution result written to STM by project-orchestrator
Stage 5 → repo-orchestrator reads issue data from STM → creates/switches branch
           - recipe reads issue number from STM → initializes STM directory
```

**Critical rule: Stage 5 agents read the STM data from Stage 2 — not prompt prose.**

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/start-feature.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

### Dispatch

Iterate tasks in dependency order. For each task:

1. Check `blockedBy` — all must be `completed`
2. Determine owner:
   - Owner is an agent name → delegate via JSON contract
   - Owner is `"recipe"` → execute inline
   - Owner is `"intent-resolver"` → invoke intent-resolver agent
3. Mark task `in_progress` via TaskUpdate
4. Execute
5. Mark task `completed` via TaskUpdate (or `failed` on failure)

### Agent Invocation Pattern

When dispatching to a domain agent, send a JSON contract. All STM paths MUST be constructed from `{stm_base}` resolved in Stage 0 — never hardcoded.

```json
{
  "intent_path": "core/components/recipes/start-feature/reference/intent.yaml",
  "stm_base": "<resolved from config>",
  "stm": {
    "input": { "<named paths using {stm_base}/{issue}/...>" },
    "output": { "<named paths using {stm_base}/{issue}/...>" }
  },
  "task_id": "<task id from DAG>"
}
```

The agent returns ONLY an enriched JSON contract with updated `stm` paths and `status`. All artifacts are in STM files.

### Input Parsing

The recipe accepts three input patterns (C1 — single flow, no modes):

| Input | Detection | Action |
|-------|-----------|--------|
| No args | No arguments provided | Capture changed files → resolve issue from changes |
| `42` or `#42` | Numeric or `#`-prefixed numeric | Use as issue number directly |
| `"Add OAuth login"` | Non-numeric string | Use as issue title for creation |

All three converge on the same downstream flow: issue resolved → branch created → STM initialized.

## Pre-flight (Stage 0)

Execute these checks before any domain work:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve `stm_base` from `core/config.yaml` | — | Hard halt — config is required |
| Git repository present | — | Hard halt — not a git repo |
| Platform config exists (`platform: github`) | — | Hard halt — no platform configured |
| Capture `git status --porcelain` snapshot | C2 | Store as pre-recipe state for F4 eval |

Pre-flight checks run via Bash (read-only queries) since these are infrastructure, not domain work.

```bash
# Resolve STM base path
stm_base=$(grep 'base-path' core/config.yaml | head -1 | awk '{print $2}')

# Git repo check
git rev-parse --is-inside-work-tree

# Platform config
grep '^platform:' core/config.yaml

# Snapshot changed files (for F4 eval later)
git status --porcelain > /tmp/start-feature-pre-state.txt
```

No branch guard. The recipe works from any branch (main, develop, feature/*).

## Agent Declarations

| Agent | Domain | Max Calls | Skills Used |
|-------|--------|-----------|-------------|
| `project-orchestrator` | project | 1 (Stage 2) | `resolve-issues`, `manage-issue` |
| `repo-orchestrator` | repo | 1 (Stage 5) | `setup-branch` |

**Total domain agent calls: 2** — exactly the L1 budget.

### Stage 2 — project-orchestrator Contract

```json
{
  "intent_path": "core/components/recipes/start-feature/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": {
      "changed_files": "{stm_base}/_pending/start-feature/changed-files.txt",
      "args": "{stm_base}/_pending/start-feature/args.yaml"
    },
    "output": {
      "issue_resolution": "{stm_base}/_pending/start-feature/issue-resolution.yaml"
    }
  },
  "task_id": "readiness-resolve-issue"
}
```

**Expected output artifact (`issue-resolution.yaml`):**

```yaml
issue:
  number: {int}
  title: "{title}"
  url: "{url}"
  state: "open"
  created: true|false
  type_hint: "{feature|fix|hotfix|refactor|docs|chore|null}"
inference:
  source: "changed_files|explicit_number|explicit_title"
  confidence: "high|medium|low"
  candidates_considered: {int}
  ambiguity_resolved_by_user: true|false
```

Note: Uses `{stm_base}/_pending/start-feature/` for pre-issue artifacts. Once issue number is known, the recipe moves artifacts to `{stm_base}/{issue}/`.

### Stage 5 — repo-orchestrator Contract

```json
{
  "intent_path": "core/components/recipes/start-feature/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": {
      "issue_resolution": "{stm_base}/{issue}/evidence/start-feature/issue-resolution.yaml"
    },
    "output": {
      "branch_result": "{stm_base}/{issue}/evidence/start-feature/branch-result.yaml"
    }
  },
  "task_id": "gen-branch"
}
```

**Expected output artifact (`branch-result.yaml`):**

```yaml
branch:
  name: "{type}/{issue_number}-{slug}"
  action: "created|switched"
  pushed: true|false
  changes_preserved: true|false
```

## Workflow Reference

```
Workflow template: core/components/memory/workflows/direct-generation.yaml
```

Direct generation — no brief or checkpoint stages. The only human interaction is ambiguity resolution during Stage 2 (C5), handled inline by the project-orchestrator returning to the recipe for user input.

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Recipe (inline) | After skill output (Stages 2, 5) | Did this skill's output satisfy mapped failure conditions? | `failure_conditions` from intent.yaml |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole environment satisfy acceptance? | `scenarios` from intent.yaml |

### Step Evals (after Stage 2 — readiness-issue-eval)

| Eval | Failure Condition | Check |
|------|-------------------|-------|
| SE-1 | F5 | If inference confidence is "low", recipe must have halted — not proceeded |
| SE-2 | F6 | If existing open issue matched, no new issue was created |
| SE-3 | F7 | If best candidate was closed, user confirmation was obtained before reopen |
| SE-4 | F8 | If multiple candidates with no clear winner, user was asked to pick |
| SE-5 | F1 | Issue number is non-null and issue exists on GitHub as OPEN |
| SE-6 | C10 | If new issue created, body contains ~25–60 word summary |

### Step Evals (after Stage 5 — gen-branch-stm-eval)

| Eval | Failure Condition | Check |
|------|-------------------|-------|
| SE-9 | F2 | Branch name matches `{type}/{issue_number}-{slug}` pattern |
| SE-10 | F4 | Uncommitted changes from pre-recipe snapshot still present |
| SE-11 | F3 | STM directory exists at `{stm_base}/{issue}/` |
| SE-12 | C3 | If branch existed, it was switched to (not duplicated) |

### Scenario Evals (Stage 6)

- **SCE-1 (S1)**: Uncommitted changes, no args → issue inferred, branch created, changes preserved, STM ready
- **SCE-2 (S2)**: Explicit issue number → exact issue used, branch named with that number, STM ready
- **SCE-3 (S3)**: Descriptive title → new issue created with ~40-word body, branch created, STM ready
- **SCE-4 (S4)**: Existing branch → switched (not recreated), no duplicate issue, changes preserved
- **SCE-5 (S5)**: Team lead audit → issue visible, titled, summarized, traceable to branch on origin

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/start-feature.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/start-feature.json
Written: After Stage 1 (intent resolution)
Updated: After each stage completes
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 2.0.0 |
| Workflow | direct-generation |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) |
| Step Evals | 10 |
| Scenario Evals | 5 |
