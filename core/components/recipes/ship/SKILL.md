---
name: ship
description: Deliver current branch work to main — commit, PR, merge, and cleanup in one command. No approvals needed.
user-invokable: true
model: sonnet
---

# ship

Deliver all uncommitted work on the current feature branch to the main branch in a single automated pipeline: commit all changes, create and submit a pull request, merge the PR, switch to main, pull latest, and delete the feature branch. No human approvals at any stage — all decisions auto-proceed regardless of confidence level. The end state is: local checkout on main, main up to date with remote, feature branch gone, and all work reachable from main's history.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C6), failure conditions (F1–F6), and acceptance scenarios (S1–S2). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator of an L2 recipe. You chain L1 recipes in sequence — you do NOT invoke agents directly. Each L1 recipe manages its own agents, skills, and evals internally.

**L2 orchestration boundaries:**

| Step | L1 Recipe | What It Does |
|------|-----------|--------------|
| 1 | `commit-code` | Commit all changes, grouped by concern, mapped to issues |
| 2 | `create-pr` | Create PR with quality checklist and evidence |
| 3 | `merge-pr` | Merge PR, switch to main, pull latest, delete branch |

**Infrastructure agents (do not count toward budget):**

| Agent | Domain | Stage |
|-------|--------|-------|
| `intent-resolver` | Intent decomposition | 1 |

## Fixed Stages

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work (via L1 chain) | commit-code, create-pr |
| 5 | Generation | Domain work (via L1 chain) | merge-pr |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

Infrastructure stages (0, 1, 6, 7) do NOT count toward the agent budget.
Domain work is delegated to L1 recipes which manage their own agent budgets.

**L2 budget: 3 L1 recipe invocations** (ideal for L2 max of 5).

## Two Core Phases

- **Readiness phase** (Stage 2): commit-code commits all changes, create-pr creates the PR. These produce all artifacts needed for merge.
- **Generation phase** (Stage 5): merge-pr merges, switches, pulls, and cleans up.

## STM Data Flow Rules

```
Stage 2 → L1 recipes write their own STM artifacts (commits, PR data)
           - commit-code writes commit records to STM
           - create-pr writes PR data (number, URL, checklist) to STM
Stage 5 → merge-pr reads PR number from STM → merges, switches, pulls, deletes branch
```

Each L1 recipe manages its own STM data flow internally. Ship reads cross-recipe artifacts only when needed to pass context between L1s (e.g., PR number from create-pr to merge-pr).

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/ship.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

### Dispatch

The DAG for ship is a linear chain of L1 recipe invocations:

```
commit-code → create-pr → merge-pr
```

For each L1 recipe in the chain:

1. Invoke the L1 recipe via Skill tool
2. **Override approval gates:** Pass `approval_override: "auto-proceed"` to suppress all human checkpoints within the L1 recipe (C2)
3. Check result — if the L1 recipe fails, ship halts immediately with the L1's failure details
4. Pass forward any STM artifacts the next L1 needs (e.g., PR number)

### Approval Override (C2)

Ship overrides all approval gates in chained L1 recipes. This means:
- commit-code: even low-confidence groupings and issue mappings auto-proceed
- create-pr: even low-confidence target branch and checklist auto-proceed
- merge-pr: no approval gates by design (direct-generation workflow)

The override is achieved by including `"approval_override": "auto-proceed"` in the invocation context. L1 recipes that encounter this flag skip their Stage 3 (brief) and Stage 4 (checkpoint).

### Cross-Recipe Data Flow

```
commit-code outputs → STM commit records
                    ↓
create-pr reads commit records → produces PR (number, URL)
                    ↓
merge-pr reads PR number → merges, switches, pulls, deletes
```

Ship reads the PR number from create-pr's STM output and passes it to merge-pr's input contract.

## Pre-flight (Stage 0)

Execute these checks before any L1 recipe invocation:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve `stm_base` from `core/config.yaml` | — | Hard halt — config is required |
| Current branch is not main/master/default | C1 | Hard halt with message |
| Changed files exist (staged, unstaged, untracked) | implicit | Graceful exit — nothing to ship |
| Platform config exists | implicit | Hard halt — no platform configured |

Pre-flight checks run via Bash (read-only queries) since these are infrastructure, not domain work.

```bash
# Resolve STM base path
stm_base=$(grep 'base-path' core/config.yaml | head -1 | awk '{print $2}')

# C1 — branch guard
branch=$(git branch --show-current)
default_branch=$(git remote show origin | grep 'HEAD branch' | awk '{print $NF}')
# Halt if branch == default_branch or main or master

# Changes exist
git status --porcelain

# Platform config
grep '^platform:' core/config.yaml
```

Ship's pre-flight is lighter than individual L1 pre-flights because each L1 recipe runs its own pre-flight. Ship validates only the cross-cutting concerns.

## Agent Declarations

Ship is an L2 recipe — it invokes L1 recipes, not agents directly.

| L1 Recipe | Internal Agents | Internal Skills |
|-----------|----------------|-----------------|
| `commit-code` | `repo-orchestrator`, `project-orchestrator` | `analyze-changes`, `create-commit`, `resolve-issues`, `manage-issue` |
| `create-pr` | `repo-orchestrator`, `project-orchestrator` | `analyze-pr`, `submit-pr`, `manage-issue` |
| `merge-pr` | `repo-orchestrator` | `merge-pr` |

## Workflow Reference

```
Workflow template: ~/.meridian/core/memory/workflows/direct-generation.yaml
```

No brief or checkpoint stages — ship is a fully automated pipeline (C2).

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | L1 recipes (internal) | Within each L1 | Each L1 runs its own step evals per its intent.yaml | L1 `failure_conditions` |
| **Scenario evals** | Ship recipe | Stage 6 (E2E) | Does the full pipeline satisfy ship's acceptance? | `scenarios` from ship's intent.yaml |

### Step Evals (delegated to L1s)

Each L1 recipe runs its own step evals internally. Ship does NOT re-run L1 step evals. If an L1 step eval fails, the L1 recipe fails, and ship halts.

### Scenario Evals (Stage 6)

- **scenario-1 (S1)**: Developer — all feature work is in main's history, feature branch gone (local + remote), main is current with remote, ready to start next feature immediately
- **scenario-2 (S2)**: Code reviewer — merged PR on platform linked to issue, quality checklist and evidence present, merge commit on main, commits traceable to issue

#### Scenario Eval Execution

```bash
# S1 checks
git branch --show-current                        # must be main/default
git status                                        # must be up to date
git branch --list {feature_branch}               # must be empty
git branch -r --list origin/{feature_branch}     # must be empty
git log main --oneline -5                        # feature commits visible

# S2 checks
gh pr view {pr_number} --json state,title,body   # state must be MERGED
gh pr view {pr_number} --json body | grep -q "Quality Checklist"  # checklist present
```

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/ship.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/ship.json
Written: After Stage 1 (intent resolution)
Updated: After each L1 recipe completes
On resume: Recipe reads DAG from STM, skips completed L1s, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state. If commit-code completed but create-pr failed, resume starts from create-pr.

## Evidence Self-Commit (Stage 7)

After scenario validation passes (Stage 6), the recipe writes evidence and checkpoint artifacts to STM. Because ship is an L2 recipe that ends on `main` after merge, its evidence self-commit lands on `main` — this is expected and correct. The evidence captures the delivery record; its natural home is on `main` alongside the merge commit.

**Procedure:**

1. Write evidence artifacts to `{stm_base}/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md`
2. Write checkpoint to `{stm_base}/{issue}/checkpoint/ship/{YYYYMMDD-HHMMSS}.md`
3. Present final delivery report to user
4. **After presenting**, invoke `repo-orchestrator` to commit the evidence and checkpoint files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record ship evidence for #{issue_number} (#{issue_number})'. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/ship/{same-timestamp}.md"
    - "{stm_base}/{issue}/checkpoint/ship/{same-timestamp}.md"
  commit_message: "chore(stm): record ship evidence for #{issue_number} (#{issue_number})"
```

**Note:** Each chained L1 recipe (commit-code, create-pr) runs its own self-commit on the feature branch before ship merges. Ship's self-commit is the only one that lands directly on `main`.

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt. Delivery already succeeded; a missing evidence commit is not fatal.

See [ADR 012: Evidence Self-Commit](../../../docs/adr/012-evidence-self-commit.md) for the architectural rationale.
