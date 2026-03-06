---
name: capture-learning
description: Capture learnings from completed work and archive STM directories
user-invokable: true
model: sonnet
---

# capture-learning

Given a completed issue number, extract reusable holistic knowledge patterns from that issue's short-term memory artifacts and promote them into the long-term memory knowledge base — either updating existing knowledge artifacts or creating new ones. Independently, archive the issue's STM directory to `_archive/{YYYY-MM}/{issue}/` to keep the active workspace clean.

## Implementation Status

**Extraction skills (`extract-knowledge`, `promote-knowledge`) do not exist yet.** The recipe will bypass extraction and promotion tasks gracefully and proceed directly to archival. When these skills are built, remove the `bypass: true` flags from the DAG and assign a knowledge-domain agent.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines the operational contract: intent, constraints (C1–C7), failure conditions (F1–F4), and acceptance scenarios (S1–S3). All constraint IDs referenced in this recipe map to that file.

```
reference/intent.yaml → source of truth for all constraints and failure conditions
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents via JSON contracts — never execute domain work directly.

**Forbidden:** Direct `git` commands for repository operations. Direct `gh` commands for issue operations. All domain work goes through agents.

**Agent boundaries:**

| Agent | Domain | Stages |
|-------|--------|--------|
| `repo-orchestrator` | Git: archive STM directory | 5 |
| `project-orchestrator` | Issues: verify issue state, fetch close date | 2 |

**Infrastructure agents (do not count toward budget):**

| Agent | Domain | Stage |
|-------|--------|-------|
| `intent-resolver` | Intent decomposition | 1 |

## Fixed Stages

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work | project-orchestrator, recipe (bypass) |
| 3 | Human-Readable Brief | Domain work (skipped) | — |
| 4 | Human Checkpoint | Infrastructure (skipped) | — |
| 5 | Generation | Domain work | repo-orchestrator |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

Infrastructure stages (0, 1, 4, 6, 7) do NOT count toward the agent budget.
Domain work stages (2, 3, 5) count toward the budget: **2 domain agents (L1 max).**

Stages 3 and 4 are skipped: extraction is bypassed (skills do not exist), so no brief or human checkpoint is produced. When extraction skills are built, these stages become active.

## Two Core Phases

The recipe has a clear phase boundary at Stage 4:

- **Readiness phase** (Stages 2, 3, 4): Verify issue is closed, verify STM exists, extract knowledge (bypassed), promote to LTM (bypassed). Everything required to be READY for archival.
- **Generation phase** (Stage 5): Archive the STM directory.

Before approval: getting READY. After approval: GENERATING deliverables.

## STM Data Flow Rules

```
Stage 2 → project-orchestrator verifies issue state, writes result to STM
           recipe verifies STM directory exists
           extract-knowledge reads STM, writes knowledge drafts to STM (BYPASSED)
           promote-knowledge reads drafts from STM, writes to LTM (BYPASSED)
Stage 5 → repo-orchestrator reads issue close date from STM → archives STM directory
```

**When extraction skills are built:**
```
Stage 2 → extract-knowledge writes drafts to {stm_base}/{issue}/evidence/capture-learning/knowledge-drafts.yaml
           promote-knowledge reads drafts from STM → searches existing LTM → writes/updates knowledge/
Stage 3 → brief summarizing what was extracted and what will be promoted (skippable)
Stage 4 → human reviews extraction quality (skippable when confidence is high)
Stage 5 → repo-orchestrator archives STM directory
```

## Input Patterns

| Pattern | Example |
|---------|---------|
| `42` or `#42` | Capture learnings and archive STM for closed issue #42 |

## Execution

### Load DAG

On recipe invocation, check cache first:

```
Cache: .meridian/cache/intent-resolution/capture-learning.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
```

If cache is valid, load DAG directly (skip Stage 1). If stale, run intent-resolver, update cache.

If resuming an interrupted run, read DAG from STM:

```
DAG location: {stm_base}/{issue}/dag/capture-learning.json
Written: After Stage 1
Updated: At every checkpoint (Stage 4) — marks completed tasks
On resume: Read DAG, skip completed tasks, continue from where it stopped
```

No re-planning on resume. The DAG is the execution state.

### Dispatch

Iterate tasks in dependency order. For each task:

1. Check `blockedBy` — all must be `completed`
2. Check `bypass` flag — if `true`, log "Task {id} bypassed: {reason}" and mark `completed`
3. Determine owner:
   - Owner is an agent name → delegate via JSON contract
   - Owner is `"recipe"` → execute inline
   - Owner is `"intent-resolver"` → invoke intent-resolver agent
4. Mark task `in_progress` via TaskUpdate
5. Execute
6. Mark task `completed` via TaskUpdate (or `failed` on failure)

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

The agent returns ONLY an enriched JSON contract with updated `stm` paths and `status`. All artifacts are in STM files.

## Pre-flight (Stage 0)

Execute these checks before any domain work:

| Check | Constraint | Action on Failure |
|-------|-----------|-------------------|
| Resolve `stm_base` from `core/config.yaml` | — | Hard halt — config is required |
| Issue number provided as input | — | Hard halt — recipe requires an issue number |
| STM directory exists at `{stm_base}/{issue}/` | C2 | Hard halt — nothing to capture or archive |

Pre-flight checks run via Bash (read-only queries) since these are infrastructure, not domain work.

```bash
# Resolve STM base path from config
stm_base=$(grep 'base-path' core/config.yaml | head -1 | awk '{print $2}')

# Verify STM directory exists
test -d "{stm_base}/{issue}/"
```

**Note:** Issue-closed verification (C1 equivalent) is delegated to `project-orchestrator` in Stage 2, not checked in pre-flight. Pre-flight only validates local filesystem state.

**Path resolution rule:** After pre-flight, the recipe holds `stm_base`. All agent contract paths MUST use `{stm_base}/{issue}/` — never hardcode paths.

## Agent Declarations

| Agent | Domain | Max Calls | Skills Used |
|-------|--------|-----------|-------------|
| `repo-orchestrator` | repo | 1 (Stage 5) | `archive-issue-stm` |
| `project-orchestrator` | project | 1 (Stage 2) | `manage-issue` |

**Total domain agent calls: 2** — within L1 budget (max 2 agents).

## Workflow Reference

```
Workflow template: ~/.meridian/core/memory/workflows/readiness-brief-generation.yaml
```

Stages 3 and 4 are `skippable: true` per the workflow template. This recipe skips them entirely while extraction is bypassed.

## Two Eval Levels

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Recipe (inline) | After skill output (Stages 2, 5) | Did this skill's output satisfy mapped failure conditions? | `failure_conditions` from intent.yaml |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole output satisfy acceptance? | `scenarios` from intent.yaml |

### Step Evals (after Stage 2)

- **step-eval-1** (PLACEHOLDER): Validate extract-knowledge drafts have identity + profile metadata, search patterns present (F1, F4, C4). Skipped while skill is bypassed.
- **step-eval-2** (PLACEHOLDER): Validate promote-knowledge did not create duplicates, updated existing where applicable (C3, F2). Skipped while skill is bypassed.

### Step Evals (after Stage 5)

- **step-eval-3** (ACTIVE): Validate archive — STM directory moved to correct `_archive/{YYYY-MM}/{issue}/` path using close date (C3, C7), original directory removed, contents intact.

### Scenario Evals (Stage 6)

- **scenario-1 (S1)**: Agent can discover promoted knowledge by matching project context against search patterns and applicability criteria. While extraction is bypassed: validate bypass was reported and no malformed artifacts were created.
- **scenario-2 (S2)**: Developer can find holistic patterns organized across technology boundaries with structured reasoning. While extraction is bypassed: validate bypass was reported and no partial artifacts written.
- **scenario-3 (S3)**: Engineering lead can review archived STM — complete history present at archive location, original active path removed.

## Evidence Self-Commit (Stage 7)

After scenario validation passes (Stage 6), the recipe writes evidence and checkpoint artifacts to STM. These artifacts must be committed before the recipe exits.

**Procedure:**

1. Write evidence artifacts to `{stm_base}/{issue}/evidence/capture-learning/{YYYYMMDD-HHMMSS}.md`
2. Present summary to user
3. **After presenting**, invoke `repo-orchestrator` to commit the evidence files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record capture-learning evidence for #{issue_number} (#{issue_number})'. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/capture-learning/{same-timestamp}.md"
  commit_message: "chore(stm): record capture-learning evidence for #{issue_number} (#{issue_number})"
```

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt. Archival already succeeded; a missing evidence commit is not fatal.

See [ADR 012: Evidence Self-Commit](../../../docs/adr/012-evidence-self-commit.md) for the architectural rationale.

## DAG Caching

```
Cache location: .meridian/cache/intent-resolution/capture-learning.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

## DAG Resumption

```
DAG location: {stm_base}/{issue}/dag/capture-learning.json
Written: After Stage 1 (intent resolution)
Updated: At every checkpoint (Stage 4) — marks completed tasks
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.
