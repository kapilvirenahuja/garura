# Checkpoint Artifact Format

Canonical format for checkpoint files written by plays at each human-approval gate. Every checkpoint-gated play writes one of these per gate, written in the background by the scriber agent.

Consumers: `specify`, `design`, `arch`, every checkpoint-gated play.

## File path convention

```
{product_base}/_checkpoints/{play-name}/{stage-slug}-{YYYYMMDD-HHMMSS}.md
```

For project-scoped plays:

```
{stm_base}/{issue}/checkpoint/{play-name}/{YYYYMMDD-HHMMSS}.md
```

The filename MUST include a timestamp so multiple cycles of the same checkpoint (Orbit retries) produce separate artifacts — they do NOT overwrite.

## Shape

```markdown
---
play: {play-name}
stage: {stage-slug}
cycle: {1 | 2 | 3 | ...}
created_at: {ISO-8601 timestamp}
status: PENDING_APPROVAL | APPROVED | REJECTED | ORBIT_FEEDBACK | COMPLETED
decision: null | Tether | Orbit | Vanish
decided_at: null | {ISO-8601 timestamp}
---

# {Stage Title} — {product or issue slug}

## Context
{3-6 lines describing what this stage produced and why the user needs to review it.}

## Artifacts Under Review
| Artifact | Path | Size |
|----------|------|------|
| {name} | {workspace-relative path} | {bytes or lines} |
| ... | ... | ... |

## Summary
{Quantified summary block — counts, names, coverage percentages. Whatever
helps the user decide Tether/Orbit/Vanish. Never paste artifact content
verbatim; link to the file.}

## Evaluator Output
{Optional. When the stage had a validator pass, include the validator's
status line and any warnings. Blockers are reported here before the user
sees the prompt. Example:
- `validate-intent-epics`: status `passed`, 0 violations, 0 warnings
- `validate-kb-extension`: status `passed`
}

## User Feedback (populated on Orbit)
{Empty until an Orbit response is parsed. When populated, contains the
user's typed feedback text verbatim so the re-run step can ingest it as
additional context.}

## Decision Audit
| Field | Value |
|-------|-------|
| Decision | {null until user responds; then Tether / Orbit / Vanish} |
| Decided at | {timestamp} |
| Next action | {Proceed / Cycle back to step {N} / Halt and cleanup} |
```

## Lifecycle

1. **Before the prompt** — Play dispatches scriber (background) to write the checkpoint file with `status: PENDING_APPROVAL`. Decision fields are null.
2. **Play emits the approval prompt** — using `templates/approval-prompt.md`. The prompt cites the checkpoint file path.
3. **User responds** — Play parses the response (Tether / Orbit / Vanish).
4. **Play updates the checkpoint** via scriber:
   - Tether: `status: APPROVED`, `decision: Tether`, `decided_at: {now}`, proceed.
   - Orbit: `status: ORBIT_FEEDBACK`, `decision: Orbit`, `User Feedback` section populated, re-dispatch producing step(s).
   - Vanish: `status: REJECTED`, `decision: Vanish`, `decided_at: {now}`, invoke Vanish recovery, halt.
5. **Play close** — When the full play completes, update `status: COMPLETED` on every checkpoint that belongs to the completed run.

## Retention

Checkpoint files are NOT ephemeral. They are committed as STM evidence (via the play's self-commit step) and retained as the audit trail for every gate decision. The play's evidence section references every checkpoint file written during the run.

## Field rules

| Field | Rule |
|-------|------|
| `play` | Exact play slug (e.g. `specify`, `design`, `arch`). |
| `stage` | Stage slug within the play. Multiple gates per play produce different stage values. |
| `cycle` | 1 for the first attempt at this gate; 2+ for Orbit retries. |
| `status` | Exactly one of the 5 allowed values. Linear progression PENDING → (APPROVED \| REJECTED \| ORBIT_FEEDBACK). COMPLETED is set at play close. |
| `decision` | null while `PENDING_APPROVAL`; then one of Tether / Orbit / Vanish. |

## Related

- `approval-prompt.md` — the prompt text presented to the user (cites this checkpoint's path)
- `evidence-file.md` — the final evidence file written at play close (references every checkpoint)
