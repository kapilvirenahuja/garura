---
name: archive-issue-stm
description: Archive a closed issue's STM directory into year-month buckets
user-invocable: false
model: haiku
allowed-tools: Bash, Read
---

# archive-issue-stm

Move a closed issue's STM directory to the year-month archive.

## Purpose

Archive `{stm_base}/{issue}/` to `{stm_archive}/{YYYY-MM}/{issue}/` when an issue is closed. Preserves all STM contents (checkpoint, evidence, planning, spec, design, delivery) as an audit trail.

You DO the move operation. You do NOT decide whether archival is appropriate — the calling agent has already made that decision.

## Input

Receive from agent:
- `issue_number` — (required) The GitHub issue number whose STM should be archived
- `close_date` — (optional) ISO date string for bucketing. If not provided, derive from GitHub issue `closedAt` field.

## Process

### Step 1: Verify source exists

```bash
ls -d {stm_base}/{issue_number} 2>/dev/null
```

If the directory does not exist, return output with `archived: false` and `reason: "STM directory not found"`.

### Step 2: Derive bucket

If `close_date` is provided, extract `YYYY-MM` from it.

If not provided, invoke the `platform-adapter` skill with `verb: view-issue` and `args: {issue_number: {issue_number}}`. Extract the close date using `jq '.closedAt // .closed_at'` to handle both GitHub (`closedAt`) and GitLab (`closed_at`) field names.

If the issue is not closed (field is null or empty), return output with `archived: false` and `reason: "Issue is not closed"`.

Extract `YYYY-MM` from the `closedAt` timestamp.

### Step 3: Check target does not already exist

```bash
ls -d {stm_archive}/{YYYY-MM}/{issue_number} 2>/dev/null
```

If the target already exists, return output with `archived: false` and `reason: "Archive already exists at {path}"`.

### Step 4: Create target directory and move

```bash
mkdir -p {stm_archive}/{YYYY-MM}
mv {stm_base}/{issue_number} {stm_archive}/{YYYY-MM}/{issue_number}
```

### Step 5: Verify move

```bash
ls -d {stm_archive}/{YYYY-MM}/{issue_number} 2>/dev/null && ! ls -d {stm_base}/{issue_number} 2>/dev/null
```

If verification fails, return output with `archived: false` and `reason: "Move verification failed"`.

## Output

Produce output using template: `templates/archive-output.md`

**IMPORTANT**: This skill produces operation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER delete the source directory — only move it
- NEVER archive an issue that is still open
- NEVER overwrite an existing archive
- ALWAYS create parent directories before moving
- ALWAYS verify the move succeeded
- ALWAYS use the issue's close date for bucketing, not the current date or creation date

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | operations |
