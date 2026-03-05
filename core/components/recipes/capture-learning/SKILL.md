---
name: capture-learning
description: Capture learnings from completed work and archive STM directories
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# capture-learning

Promote learnings from completed issue work into LTM, then archive the STM directory.

## Status: v0.1.0 — Partial Implementation

**Implemented:**
- Step 3: Archive STM directory to `_archive/{YYYY-MM}/` (via `archive-issue-stm` skill)

**Not yet implemented (future work):**
- Step 2: Extract patterns from completed STM artifacts (`extract-patterns` skill — does not exist)
- Step 2: Draft LTM entries from patterns (`draft-ltm-entry` skill — does not exist)
- Step 2: LTM governance integration (PR-based review for promoted entries)
- See IDSD spec P2 (`capture-learning`) for the full design

When Steps 2 is built, the full flow will be: analyze STM → extract patterns → draft LTM entries → stage for review → archive STM. For now, only archival runs.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C2), behavioral constraints (C3–C6), and failure conditions. All constraint IDs referenced in this recipe map to that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

## Input Patterns

| Pattern | Example |
|---------|---------|
| `42` or `#42` | Archive STM for closed issue #42 |
| `--all-closed` | Archive all closed issues with unarchived STM directories (batch mode) |

## Phases

| Step | Name | Agent | Status |
|------|------|-------|--------|
| Step 0 | Pre-flight | repo-orchestrator | Implemented |
| Step 1 | Resolve issue | project-orchestrator | Implemented |
| Step 2 | Extract & promote learnings | TBD (knowledge agent) | **NOT IMPLEMENTED** |
| Step 3 | Archive STM | repo-orchestrator | Implemented |
| Step 4 | Report | orchestrator | Implemented |

## Workflow

### Step 0 — Pre-flight

**C1** (requires GitHub state — invoke `project-orchestrator`): Verify the issue is closed.

**C2** (requires filesystem state — invoke `repo-orchestrator`): Verify `{stm_base}/{issue}/` exists.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Verify preconditions before capturing learnings"
  task: "Check if issue #{number} is closed on GitHub. Check if .meridian/{number}/ exists. Return pass/fail for C1 and C2."
```

**Expected output:**
```yaml
pre_flight:
  issue_number: {integer}
  issue_state: {open|closed}
  closed_at: {ISO date or null}
  stm_exists: true|false
  results: [{id: C1, status: PASS|FAIL}, {id: C2, status: PASS|FAIL}]
```

Any FAIL → hard halt with the corresponding `halt_message` from `reference/intent.yaml`.

**Batch mode (`--all-closed`):** Invoke `repo-orchestrator` to list all `.meridian/` directories (excluding `_archive/`, `_pending/`, `core/`). For each, check if the GitHub issue is closed. Collect the set of {issue_number, closed_at} that pass both C1 and C2. Process each sequentially through Steps 1-3.

### Step 1 — Resolve Issue

Invoke `project-orchestrator` to fetch issue details.

```yaml
---
Recipe context:
  intent: "Capture learnings from completed work and archive STM"
  task: "Read issue #{number}. Return issue number, title, state, closedAt."
```

**Expected output:**
```yaml
issue:
  number: {integer}
  title: {string}
  state: closed
  closed_at: {ISO date}
```

Derive archive bucket: extract `YYYY-MM` from `closed_at`.

### Step 2 — Extract & Promote Learnings (NOT IMPLEMENTED)

**This step is a placeholder for future implementation.**

When built, this step will:
1. Read all STM artifacts (specs, evidence, ADRs, retro notes) from `{stm_base}/{issue}/`
2. Invoke `extract-patterns` skill to identify reusable patterns
3. Invoke `draft-ltm-entry` skill to produce structured LTM entries
4. Stage entries for PR-based review (LTM governance)

For now: **skip this step**, log "Learning extraction not yet implemented — skipping to archive" in evidence.

### Step 3 — Archive STM

Invoke `repo-orchestrator` with the `archive-issue-stm` skill.

```yaml
---
Recipe context:
  intent: "Archive completed issue STM to year-month bucket"
  task: "Use the archive-issue-stm skill. Move {stm_base}/{issue}/ to {stm_archive}/{YYYY-MM}/{issue}/. The close date is {closed_at}. Return archive result."
  behavioral_constraints:
    - "C4: Use close date for bucketing"
    - "C5: Preserve all STM contents"
```

**Expected output:**
```yaml
archive:
  issue_number: {integer}
  archived: true|false
  source: "{stm_base}/{issue}/"
  target: "{stm_archive}/{YYYY-MM}/{issue}/"
  bucket: "{YYYY-MM}"
  reason: "{success or failure reason}"
```

If `archived: false` → halt with reason. Do not retry archive operations — they should be deterministic.

### Step 4 — Report

**Orchestrator owns this step entirely. Do not delegate.**

Present summary to user using `templates/capture-report.md`.

For batch mode: present summary table of all processed issues.

## Recovery

Pre-flight failures are hard halts — no recovery.

Archive failures: do not retry. The failure reason should be diagnostic (directory not found, already archived, move failed). Present to user for manual resolution.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract |
| Report | `templates/capture-report.md` | Final report |
| ADR 010 | `docs/adr/010-stm-archival.md` | Archival convention |
| IDSD Spec | `.claude/specs/idsd/idsd.md` | Full capture-learning design (P2) |

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 0.1.0 |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) |
| Checkpoint | None (archival is non-destructive move — no approval needed) |
| Implementation Status | Partial — archival only. See Status section. |
