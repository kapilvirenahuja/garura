---
name: commit-code
description: Commit changes in the current folder mapped to issues and grouped by issue-types using conventional messages. Use when you have uncommitted changes and want to create well-structured, traceable commits.
user-invokable: true
---

# commit-code

Commit all changed files (staged, unstaged, untracked) grouped by concern, using conventional commit format with issue references, and push the branch to the remote. Each commit describes the actual change and links to an existing issue. Approval is required only when confidence is low on grouping or issue mapping.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C7), failure conditions (F1–F4), and acceptance scenarios (S1–S2). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents via JSON contracts — never execute domain work directly.

**Forbidden:** Direct `git` commands for analysis or commits. Direct `gh` commands for issue operations. All domain work goes through agents.

**Agent boundaries:**

| Agent | Domain | Stages |
|-------|--------|--------|
| `repo-orchestrator` | Git: analyze changes, create commits, push branch, draft brief | 2, 3, 5 |
| `project-orchestrator` | Issues: fetch open issues, resolve issue mappings | 2 |

**Infrastructure agents (do not count toward budget):**

| Agent | Domain | Stage |
|-------|--------|-------|
| `intent-resolver` | Intent decomposition | 1 |

## Fixed Stages

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work | repo-orchestrator, project-orchestrator |
| 3 | Human-Readable Brief | Domain work (skippable) | repo-orchestrator |
| 4 | Human Checkpoint | Infrastructure (skippable) | recipe |
| 5 | Generation | Domain work | repo-orchestrator |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

Infrastructure stages (0, 1, 4, 6, 7) do NOT count toward the agent budget.
Domain work stages (2, 3, 5) count toward the budget: **2 domain agents (L1 max).**

## Two Core Phases

The recipe has a clear phase boundary at Stage 4:

- **Readiness phase** (Stages 2, 3, 4): Analyze changes, group by concern, map to issues, assess confidence, produce brief, get approval if needed. Everything required to be READY.
- **Generation phase** (Stage 5): Create commits from the approved STM artifacts and push to remote.

Before approval: getting READY. After approval: GENERATING deliverables.

## STM Data Flow Rules

```
Stage 2 → Agents write STRUCTURED DATA to STM (source of truth)
           - repo-orchestrator writes changeset analysis to STM
           - project-orchestrator writes issue mappings to STM
Stage 3 → repo-orchestrator creates BRIEF from STM (VIEW for humans, skippable)
Stage 4 → Human reviews brief, Tether/Vanish (skippable when all high confidence)
Stage 5 → repo-orchestrator reads STM data (NOT brief) → creates commits → pushes branch
```

**Critical rule: Stage 5 agents NEVER read the brief. They read the STM data the brief was generated from.**

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/commit-code.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

If resuming an interrupted run, read DAG from STM:

```
DAG location: {stm_base}/{issue}/dag/commit-code.json
Written: After Stage 1
Updated: At every checkpoint (Stage 4) — marks completed tasks
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
  "stm_base": "<resolved from config, e.g. .meridian/project/issues/>",
  "stm": {
    "input": { "<named paths using {stm_base}/{issue}/...>" },
    "output": { "<named paths using {stm_base}/{issue}/...>" }
  },
  "task_id": "<task id from DAG>"
}
```

Example with resolved paths:
```json
{
  "stm_base": ".meridian/project/issues/",
  "stm": {
    "input": {},
    "output": {
      "analysis": ".meridian/project/issues/95/evidence/commit-code/analysis.yaml"
    }
  }
}
```

The agent returns ONLY an enriched JSON contract with updated `stm` paths and `status`. All artifacts are in STM files.

## Pre-flight (Stage 0)

Execute these checks before any domain work:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve `stm_base` from `core/config.yaml` | — | Hard halt |
| Branch guard | C1 | Hard halt |
| Changes exist | C2 | Graceful exit |
| Sensitive file scan | C4 | Hard block |
| Open issues exist | C3 | Hard halt |

Pre-flight checks run via Bash (read-only git queries) since these are infrastructure, not domain work.

```bash
# Resolve STM base path from config
stm_base=$(grep 'base-path' core/config.yaml | head -1 | awk '{print $2}')

# C1
git branch --show-current
git remote show origin | grep 'HEAD branch'

# C2
git status --porcelain

# C4
# Scan against patterns from analyze-changes/reference/risks.md
```

**Path resolution rule:** After pre-flight, the recipe holds `stm_base`. When the DAG is loaded (from cache or intent-resolver), verify `dag.stm_base` matches the resolved config value. All agent contract paths MUST use `{stm_base}/{issue}/` — never hardcode `.meridian/{issue}/`.

## Agent Declarations

| Agent | Domain | Max Calls | Skills Used |
|-------|--------|-----------|-------------|
| `repo-orchestrator` | repo | 4 (Stages 2, 3, 5) | `analyze-changes`, `create-commit` |
| `project-orchestrator` | project | 1 (Stage 2) | `manage-issue`, `resolve-issues` |

**Total domain agent calls: 5** — but across 2 agents (L1 budget = max 2 agents).

## Workflow Reference

```
Workflow template: ~/.meridian/core/memory/workflows/readiness-brief-generation.yaml
```

Stages 3 and 4 are `skippable: true` per the workflow template. This recipe skips them when ALL issue mappings return high confidence and no flags exist.

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Recipe (inline) | After skill output (Stages 2, 5) | Did this skill's output satisfy mapped failure conditions? | `failure_conditions` from intent.yaml |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole git log satisfy acceptance? | `scenarios` from intent.yaml |

Eval criteria live in the DAG task descriptions (which reference intent.yaml constraint/failure IDs). The recipe executes each eval task by reading its `description` from the DAG — not from hardcoded rules here.

### Step Evals (after Stage 2)

- **readiness-eval-1** — DAG task, owner: recipe. Criteria in DAG description.
- **readiness-eval-2** — DAG task, owner: recipe. Criteria in DAG description.

### Step Evals (after Stage 5)

- **gen-eval-1** — DAG task, owner: recipe. Criteria in DAG description.
- **gen-eval-2** — DAG task, owner: recipe. Criteria in DAG description.

### Scenario Evals (Stage 6)

- **scenario-eval-1** — DAG task, owner: recipe. Validates S1 from intent.yaml.
- **scenario-eval-2** — DAG task, owner: recipe. Validates S2 from intent.yaml.

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/commit-code.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/commit-code.json
Written: After Stage 1 (intent resolution)
Updated: At every checkpoint (Stage 4) — marks completed tasks
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.

## Evidence Self-Commit (Stage 7)

After scenario validation passes (Stage 6), the recipe writes evidence and checkpoint artifacts to STM. These artifacts must be committed before the recipe exits — otherwise they persist as dirty working tree state and leak into the next recipe invocation's changeset.

**Procedure:**

1. Write evidence artifacts to `{stm_base}/{issue}/evidence/commit-code/{YYYYMMDD-HHMMSS}.md`
2. Write checkpoint to `{stm_base}/{issue}/checkpoint/commit-code/{YYYYMMDD-HHMMSS}.md`
3. Present commit summary to user
4. **After presenting**, invoke `repo-orchestrator` to commit the evidence and checkpoint files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record commit-code evidence for #{issue_number} (#{issue_number})'. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/commit-code/{same-timestamp}.md"
    - "{stm_base}/{issue}/checkpoint/commit-code/{same-timestamp}.md"
  commit_message: "chore(stm): record commit-code evidence for #{issue_number} (#{issue_number})"
```

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt. The feature commits already succeeded; a missing evidence commit is not fatal.

See ADR 012 (Evidence Self-Commit) in `docs/adr/012-evidence-self-commit.md` for the architectural rationale.
