---
name: create-pr
description: Create pull request with dynamic, context-aware quality checklist. Use when your branch is ready and you want to open a PR with tailored checklist, evidence, and eval results.
user-invokable: true
---

# create-pr

Create a pull request on the user's configured git platform, linked to the originating issue. The PR body contains a dynamic quality checklist tailored to the actual changes, with evidence backing every item. Eval results are embedded in the PR as quality proof. Approval is confidence-gated: auto-submit when confidence is high, checkpoint for user decision when confidence is low.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C7), failure conditions (F1–F5), and acceptance scenarios (S1–S2). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents via JSON contracts — never execute domain work directly.

**Forbidden:** Direct `git` commands for PR analysis or creation. Direct `gh`/`glab`/`bb` commands for platform operations. All domain work goes through agents.

**Agent boundaries:**

| Agent | Domain | Stages |
|-------|--------|--------|
| `repo-orchestrator` | Git: analyze PR readiness, push branch, create PR, draft brief | 2, 3, 5 |
| `project-orchestrator` | Issues: resolve issue linkage for PR | 2 |

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

- **Readiness phase** (Stages 2, 3, 4): Analyze branch diff, build quality checklist, resolve issue linkage, assess confidence on target branch and checklist completeness, produce brief, get approval if needed. Everything required to be READY.
- **Generation phase** (Stage 5): Push branch and create PR from the approved STM artifacts.

Before approval: getting READY. After approval: GENERATING deliverables.

## STM Data Flow Rules

```
Stage 2 → Agents write STRUCTURED DATA to STM (source of truth)
           - repo-orchestrator writes PR analysis (checklist, evidence, target branch, confidence) to STM
           - project-orchestrator writes issue linkage to STM
Stage 3 → repo-orchestrator creates BRIEF from STM (VIEW for humans, skippable)
Stage 4 → Human reviews brief, Tether/Vanish (skippable when all high confidence)
Stage 5 → repo-orchestrator reads STM data (NOT brief) → pushes branch, creates PR
```

**Critical rule: Stage 5 agents NEVER read the brief. They read the STM data the brief was generated from.**

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/create-pr.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

If resuming an interrupted run, read DAG from STM:

```
DAG location: {stm_base}/{issue}/dag/create-pr.json
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

When dispatching to a domain agent, send a JSON contract:

```json
{
  "intent_path": "reference/intent.yaml",
  "stm": {
    "input": { "<named paths from prior tasks>" },
    "output": { "<named paths for this task's artifacts>" }
  },
  "task_id": "<task id from DAG>"
}
```

The agent returns ONLY an enriched JSON contract with updated `stm` paths and `status`. All artifacts are in STM files.

## Pre-flight (Stage 0)

Execute these checks before any domain work:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Current branch is not main/master/default | implicit | Hard halt with message |
| Working tree is clean (all changes committed) | C3 | Hard halt — instruct user to commit first |
| Branch pushed to remote | C3 | Auto-push (infrastructure, not a halt) |
| Platform config exists and is valid | C1 | Hard halt — no platform configured |
| Platform reference file exists for configured platform | C1 | Hard halt — unsupported platform |
| Open issues exist for issue linkage | F1 | Hard halt — no issue to link |
| Branch has commits ahead of base | implicit | Graceful exit — nothing to PR |

Pre-flight checks run via Bash (read-only queries) since these are infrastructure, not domain work.

```bash
# Branch guard
git branch --show-current
git remote show origin | grep 'HEAD branch'

# C3 — clean tree
git status --porcelain

# C3 — push check
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
git log @{u}..HEAD --oneline 2>/dev/null

# C1 — platform config
grep '^platform:' core/config.yaml

# C1 — platform reference exists
test -f "reference/../../../skills/submit-pr/reference/{platform}/pr.md"

# F1 — open issues
# Read issue count from platform

# Commits ahead
git log main..HEAD --oneline
```

## Agent Declarations

| Agent | Domain | Max Calls | Skills Used |
|-------|--------|-----------|-------------|
| `repo-orchestrator` | repo | 3 (Stages 2, 3, 5) | `analyze-pr`, `submit-pr` |
| `project-orchestrator` | project | 1 (Stage 2) | `manage-issue` |

**Total domain agent calls: 4** — but across 2 agents (L1 budget = max 2 agents).

## Workflow Reference

```
Workflow template: ~/.meridian/core/memory/workflows/readiness-brief-generation.yaml
```

Stages 3 and 4 are `skippable: true` per the workflow template. This recipe skips them when ALL confidence signals return high (target branch, checklist completeness, evidence coverage).

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Recipe (inline) | After skill output (Stages 2, 5) | Did this skill's output satisfy mapped failure conditions? | `failure_conditions` from intent.yaml |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole PR satisfy acceptance? | `scenarios` from intent.yaml |

### Step Evals (after Stage 2)

- **readiness-eval-1**: Issue link confirmed — STM contains resolved issue link (F1)
- **readiness-eval-2**: Target branch confidence is high (C7, F5)
- **readiness-eval-3**: Checklist items are change-specific — every item traces to diff (C4, F2)
- **readiness-eval-4**: Every checklist item has evidence backing (C5, F3)
- **readiness-eval-5**: Platform config resolved from project configuration (C1)
- **readiness-eval-6**: No code modifications during analysis (C2)
- **readiness-eval-7**: Overall confidence gate — determines if Stages 3/4 skip

### Step Evals (after Stage 5)

- **gen-eval-1**: PR created on correct platform (C1)
- **gen-eval-2**: PR linked to issue (F1)
- **gen-eval-3**: Checklist in PR body is change-specific (C4, F2)
- **gen-eval-4**: Every PR checklist item has evidence (C5, F3)
- **gen-eval-5**: Eval results embedded in PR body (C6, F4)
- **gen-eval-6**: Target branch matches high-confidence selection or user confirmation (C7, F5)

### Scenario Evals (Stage 6)

- **scenario-1 (S1)**: Code reviewer can assess merge safety, understand rationale via checklist and evidence, trace to issue — sufficient to approve/reject/comment without external context
- **scenario-2 (S2)**: Author can verify all changes accounted for, evidence supports each item, PR linked to correct issue — confident PR is submission-ready

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/create-pr.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/create-pr.json
Written: After Stage 1 (intent resolution)
Updated: At every checkpoint (Stage 4) — marks completed tasks
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.

## Evidence Self-Commit (Stage 7)

After scenario validation passes (Stage 6), the recipe writes evidence and checkpoint artifacts to STM. These artifacts must be committed before the recipe exits — otherwise they persist as dirty working tree state and leak into the next recipe invocation's changeset.

**Procedure:**

1. Write evidence artifacts to `{stm_base}/{issue}/evidence/create-pr/{YYYYMMDD-HHMMSS}.md`
2. Write checkpoint to `{stm_base}/{issue}/checkpoint/create-pr/{YYYYMMDD-HHMMSS}.md`
3. Present PR summary to user
4. **After presenting**, invoke `repo-orchestrator` to commit the evidence and checkpoint files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record create-pr evidence for #{issue_number} (#{issue_number})'. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/create-pr/{same-timestamp}.md"
    - "{stm_base}/{issue}/checkpoint/create-pr/{same-timestamp}.md"
  commit_message: "chore(stm): record create-pr evidence for #{issue_number} (#{issue_number})"
```

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt. The PR already exists; a missing evidence commit is not fatal.

See [ADR 012: Evidence Self-Commit](../../../docs/adr/012-evidence-self-commit.md) for the architectural rationale.
