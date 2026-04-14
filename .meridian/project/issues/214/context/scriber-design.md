# Scriber Agent — Design Note

**Sub-issue:** 214.1
**Task:** T1
**Date:** 2026-04-14
**Status:** Draft for implementation

## Purpose

The `scriber` agent is a lightweight utility agent that plays dispatch to write evidence, checkpoint, and status artifacts to disk. It runs in the background so plays can continue domain work in parallel with evidence I/O. Scriber is the ONLY component that writes to evidence/checkpoint/status paths — plays never write these directly.

## Role in the Meridian hierarchy

```
Claude Code (orchestrator)
    └── runs Play
            └── dispatches Domain Agent (foreground, blocking)          ← domain work
            └── dispatches Scriber (background, non-blocking)            ← evidence/checkpoint/status
```

Scriber is a **utility agent** alongside `doc-builder` and `repo-orchestrator`. It is NOT counted against any play-level agent budget (and after 214.2 lands, there are no play budgets at all).

## What scriber writes vs what stays inline

The split is about ownership, not performance:

| Artifact | Writer | Rationale |
|----------|--------|-----------|
| User-visible plan output (spec.md, verify.md, tasks.md) | Play (inline) | User reads these immediately after play run; must be synchronous |
| Final report presented at end of play | Play (inline) | Synchronous — the user is waiting for it |
| Checkpoint file at approval gate | Scriber | Written before the gate but the gate itself is user-input-blocked, so background write is fine |
| Checkpoint file after gate (status updates) | Scriber | Non-blocking status updates as the play progresses |
| Evidence files (step eval results, scenario eval results, run traces) | Scriber | Accumulated during play run; not user-facing until review |
| Status file (resume state, step timestamps) | Scriber | Written continuously during play execution |
| Self-commit preparation files (git index, temp files) | Play (inline) | Must be synchronous with the commit |

**Rule of thumb:** If the orchestrator must read the file back in the same step, it writes inline. If the file is for later consumption (user review, resume, audit), it goes through scriber.

## Dispatch contract

Scriber is dispatched via the standard Meridian JSON agent contract:

```json
{
  "intent_path": "core/components/plays/{calling-play}/reference/intent.yaml",
  "stm_base": ".meridian/project/issues/",
  "scribe_task": {
    "operation": "write_evidence",
    "target_path": ".meridian/project/issues/214/evidence/start-feature-planning/scenario-evals.md",
    "content": "<markdown or yaml body>",
    "template": null,
    "metadata": {
      "play_name": "start-feature-planning",
      "issue_number": 214,
      "step": "scenario-evals",
      "timestamp": "2026-04-14T20:15:00+0530"
    }
  },
  "task_id": "scribe-scenario-evals"
}
```

Fields:

- `operation`: One of `write_evidence`, `write_checkpoint`, `write_status`, `append_evidence`. The operation determines which template (if any) scriber applies.
- `target_path`: Absolute path inside the whitelist. Scriber refuses to write outside the 9 allowed paths (see "Whitelist enforcement" below).
- `content`: The body. Markdown or YAML. Scriber does not reformat — it writes verbatim unless a template is specified.
- `template`: Optional. If provided, scriber reads the template, substitutes placeholders from `content` + `metadata`, and writes the result.
- `metadata`: Contextual fields. Scriber stamps these into the file header for audit.
- `task_id`: Caller-provided identifier for correlation.

Scriber returns:

```json
{
  "status": "completed" | "failed",
  "written_path": "<absolute path>",
  "bytes_written": 12345,
  "duration_ms": 45,
  "failure_reason": null
}
```

## Whitelist enforcement

Scriber is the gatekeeper for folder compliance at the write boundary. The `write-evidence` skill it invokes checks `target_path` against the 9 whitelist patterns:

- `.meridian/core/...` — except `.meridian/core/memory/` which is gitignored and managed elsewhere
- `.meridian/product/product/...`
- `.meridian/product/ux/...`
- `.meridian/product/arch/...`
- `.meridian/project/issues/{N}/specs/...`
- `.meridian/project/issues/{N}/evidence/...`
- `.meridian/project/issues/{N}/checkpoint/...`
- `.meridian/project/issues/{N}/context/...`
- `.meridian/project/issues/{N}/review/...`

If a caller tries to write outside these, scriber returns `status: failed` with `failure_reason: "target_path outside whitelist"`. The orchestrator decides whether to halt or continue.

## Background execution pattern

Scriber is dispatched via the Agent tool with `run_in_background: true`. The calling play continues to the next domain task without waiting. When scriber completes, the orchestrator gets a task-notification event with the result.

**Model choice:** scriber uses Haiku. Its work is mechanical — path validation, template substitution, file write. No complex reasoning required. Haiku is fast and cheap; the background dispatch pattern plus Haiku's speed means evidence I/O has effectively zero impact on the orchestrator's wall-clock time. This frees the expensive model (Opus) for domain work.

**Parallelism:** multiple scribers can run concurrently. A play might dispatch one scriber for evidence, another for checkpoint, another for status updates. Each runs independently.

**Non-blocking guarantees:** the play does NOT wait for scriber to complete before continuing. The orchestrator polls task notifications passively. At play shutdown, the orchestrator checks for any outstanding scriber tasks and either waits briefly or logs a warning.

## Failure semantics

If a scriber dispatch fails:

1. **Path validation failure** (whitelist violation): scriber returns immediately with `status: failed`. Caller treats this as a programming error (caller passed a bad path); halts and reports.
2. **Disk/permission failure**: scriber retries once; if retry fails, returns `status: failed` with the OS error. Caller logs a warning and continues. Evidence is lost but play proceeds — evidence is non-critical by definition (the rule-of-thumb rule above).
3. **Template expansion failure** (bad placeholder): scriber returns `status: failed` with the missing field name. Caller treats this as a programming error.
4. **Scriber agent timeout**: Claude Code may time out the background task. Caller gets a timeout notification. Caller logs a warning; evidence may be partial or missing.

**Non-blocking rule:** scriber failure never halts a play. The play continues to completion. The orchestrator's final report lists any scriber failures so they're visible for investigation.

Exception: if the calling play's success criterion depends on the evidence file existing (e.g., self-commit requires the evidence file to be committed), then the orchestrator does block on scriber completion for that specific write. This is rare; most evidence is optional.

## Interaction with the self-commit step

Start-of-play, mid-play evidence writes → scriber (non-blocking).
End-of-play self-commit preparation → inline (the orchestrator needs to know which files to stage).

The flow:

1. During play: scriber writes evidence files in background.
2. Before self-commit: orchestrator waits for any outstanding scriber tasks to complete (brief bounded wait, ~5 seconds max).
3. Self-commit: orchestrator stages the specific files that scriber wrote, using the paths returned in each scriber's `written_path` response. This is how the orchestrator knows which files to commit.
4. Commit happens inline (repo-orchestrator invoked synchronously).

## What scriber does NOT do

- Write domain artifacts (code, config, specs). Those are the play's direct responsibility.
- Call other agents. Scriber invokes only `write-evidence` skill.
- Make scheduling decisions. It writes what it's told to write.
- Transform content beyond template substitution. If the caller wants content transformed, they do it and pass the transformed content.
- Manage git state. Scriber writes files to disk; git operations go through repo-orchestrator.

## Why a dedicated agent instead of inline Write calls

Three reasons:

1. **Parallelism.** Background execution lets the main orchestrator continue to domain work while I/O happens. For multi-step plays, this shaves measurable wall-clock time.
2. **Whitelist enforcement at one boundary.** Every evidence write goes through one skill (`write-evidence`), which enforces the folder whitelist. No other agent or skill writes to evidence paths directly. This makes whitelist compliance auditable.
3. **Consistent formatting.** Scriber applies templates, timestamps, and metadata consistently. If a play author wants to skip the template, they pass `template: null`, but the default path is structured.

## Alternatives rejected

| Alternative | Reason rejected |
|---|---|
| Inline Write calls per evidence file | No parallelism; no single enforcement boundary for whitelist; inconsistent formatting across plays |
| One persistent scriber per play, messages via SendMessage | Possible; more complex; saved for a future iteration if per-dispatch overhead becomes a bottleneck |
| File-queue pattern (scriber reads from a queue file written by plays) | Extra indirection; hard to debug; defers writes past play end |
| Scriber also writes domain artifacts | Breaks the separation between domain work and evidence; expands scriber's responsibility unboundedly |

## Open items for T2/T3 implementation

- Model confirmed: Haiku (user decision 2026-04-14 post-T5).
- Define the specific set of templates scriber ships with (checkpoint template, evidence-summary template, status template).
- Document the task-notification polling pattern the orchestrator uses — this may need to be patternized in CLAUDE.md or a memory file so every play adopts it consistently.
