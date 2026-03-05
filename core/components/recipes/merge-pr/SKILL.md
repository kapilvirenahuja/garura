---
name: merge-pr
description: Merge the current branch's PR, switch to main, pull latest, and delete the feature branch. Use when your PR is approved and you want to complete the merge lifecycle.
user-invokable: true
---

# merge-pr

Merge the pull request associated with the current feature branch into its base branch, switch the local checkout to the base branch with latest upstream state, and remove the feature branch from both local and remote. The final state is: local checkout on base branch, base branch up to date with remote, feature branch absent.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C6), failure conditions (F1–F5), and acceptance scenarios (S1–S2). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents via JSON contracts — never execute domain work directly.

**Forbidden:** Direct `git` commands for merge or branch operations. Direct `gh`/`glab`/`bb` commands for platform operations. All domain work goes through agents.

**Agent boundaries:**

| Agent | Domain | Stages |
|-------|--------|--------|
| `repo-orchestrator` | Git: verify PR, merge, switch branch, pull, delete branch | 2, 5 |

**Infrastructure agents (do not count toward budget):**

| Agent | Domain | Stage |
|-------|--------|-------|
| `intent-resolver` | Intent decomposition | 1 |

## Fixed Stages

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work | repo-orchestrator |
| 5 | Generation | Domain work | repo-orchestrator |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

Infrastructure stages (0, 1, 6, 7) do NOT count toward the agent budget.
Domain work stages (2, 5) count toward the budget: **1 domain agent (L1 max).**

## Two Core Phases

The recipe has a clear phase boundary — but no human checkpoint (direct-generation workflow):

- **Readiness phase** (Stage 2): Verify PR exists, check mergeable status, confirm no conflicts, validate clean tree. Everything required to be READY.
- **Generation phase** (Stage 5): Merge PR, switch to base branch, pull latest, delete feature branch.

## STM Data Flow Rules

```
Stage 2 → repo-orchestrator writes STRUCTURED DATA to STM (source of truth)
           - PR status, mergeable state, base branch, conflict check
Stage 5 → repo-orchestrator reads STM data → merges PR, switches branch, pulls, deletes branch
```

**No brief or checkpoint stages** — this recipe uses the direct-generation workflow.

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/merge-pr.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

If resuming an interrupted run, read DAG from STM:

```
DAG location: {stm_base}/{issue}/dag/merge-pr.json
Written: After Stage 1
Updated: After each stage completion
On resume: Read DAG, skip completed tasks, continue from where it stopped
```

No re-planning on resume. The DAG is the execution state.

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
  "intent_path": "reference/intent.yaml",
  "stm_base": "<resolved from config>",
  "stm": {
    "input": { "<named paths using {stm_base}/{issue}/...>" },
    "output": { "<named paths using {stm_base}/{issue}/...>" }
  },
  "task_id": "<task id from DAG>"
}
```

The agent returns ONLY an enriched JSON contract with updated `stm` paths and `status`. All artifacts are in STM files.

## Pre-flight (Stage 0)

Execute these checks before any domain work:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve `stm_base` from `core/config.yaml` | — | Hard halt — config is required |
| Current branch is not main/master/default | C1 | Hard halt with message |
| Working tree is clean | C3 | Hard halt — instruct user to commit first |
| Platform config exists and is valid | implicit | Hard halt — no platform configured |
| PR exists for current branch | C2 | Hard halt — no PR to merge |

Pre-flight checks run via Bash (read-only queries) since these are infrastructure, not domain work.

```bash
# Resolve STM base path from config
stm_base=$(grep 'base-path' core/config.yaml | head -1 | awk '{print $2}')

# C1 — branch guard
git branch --show-current
git remote show origin | grep 'HEAD branch'

# C3 — clean tree
git status --porcelain

# Platform config
grep '^platform:' core/config.yaml

# C2 — PR exists
gh pr view --json number,state,baseRefName,mergeable 2>/dev/null
```

**Path resolution rule:** After pre-flight, the recipe holds `stm_base`. All agent contract paths MUST use `{stm_base}/{issue}/` — never hardcode paths.

## Agent Declarations

| Agent | Domain | Max Calls | Skills Used |
|-------|--------|-----------|-------------|
| `repo-orchestrator` | repo | 2 (Stages 2, 5) | `merge-pr` |

**Total domain agent calls: 2** — 1 agent (L1 budget = max 2 agents).

## Workflow Reference

```
Workflow template: ~/.meridian/core/memory/workflows/direct-generation.yaml
```

No brief or checkpoint stages — direct from readiness to generation.

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Recipe (inline) | After skill output (Stages 2, 5) | Did this skill's output satisfy mapped failure conditions? | `failure_conditions` from intent.yaml |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole merge lifecycle satisfy acceptance? | `scenarios` from intent.yaml |

### Step Evals (after Stage 2)

- **readiness-eval-1**: PR exists for current branch (F5)
- **readiness-eval-2**: PR has no merge conflicts (F1, C4)
- **readiness-eval-3**: Working tree is clean (F4, C3)

### Step Evals (after Stage 5)

- **gen-eval-1**: PR merged successfully on platform (C5)
- **gen-eval-2**: Local checkout is on base branch (F3)
- **gen-eval-3**: Base branch is up to date with remote (F3, C4)
- **gen-eval-4**: Feature branch deleted locally and remotely (F2, C5, C6)

### Scenario Evals (Stage 6)

- **scenario-1 (S1)**: Developer can immediately start next feature — on up-to-date base branch, no stale feature branch
- **scenario-2 (S2)**: Code reviewer can confirm PR is merged on platform and merge commit is on base branch

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/merge-pr.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/merge-pr.json
Written: After Stage 1 (intent resolution)
Updated: After each stage completion
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.
