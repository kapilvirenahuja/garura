# Evidence File Format

Canonical format for evidence files emitted at play close. Every play writes one of these at its final step, and the file is self-committed as part of the STM audit trail. Written in the background by the scriber agent.

Consumers: `specify`, `design`, `arch`, `implement`, every play that closes with an evidence step.

## File path convention

Product-scoped plays:

```
{product_base}/_evidence/{play-name}/{YYYYMMDD-HHMMSS}.md
```

Project-scoped plays:

```
{stm_base}/{issue}/evidence/{play-name}/{YYYYMMDD-HHMMSS}.md
```

One file per play run. Re-runs of the same play create a new timestamped file; evidence is append-only across runs.

## Shape

```markdown
---
play: {play-name}
run_id: {unique id — timestamp-based is fine}
issue: {issue number or null}
product_slug: {slug or null}
started_at: {ISO-8601}
completed_at: {ISO-8601}
status: COMPLETED | HALTED | ABORTED
exit_reason: success | validation_failed | user_vanish | pre_flight_failed | recovery_exhausted | {other}
---

# {Play Title} Evidence — {slug or issue}

## Context
{One-paragraph summary of what the run was doing — intent, product slug,
or issue title. Pulled from the play's invocation context.}

## Artifacts Produced
| Artifact | Path | Notes |
|----------|------|-------|
| {name} | {workspace-relative path} | {size, line count, or content summary} |
| ... | ... | ... |

## Step Eval Results
| Eval ID | Source | Status | Detail |
|---------|--------|--------|--------|
| SE-1 | F1 | PASS \| FAIL | {one-line detail if FAIL; skip if PASS} |
| SE-2 | F3 | PASS | {optional note} |
| ... | ... | ... | ... |

Summary: `{N}/{M}` step evals passed.

## Scenario Eval Results
| Eval ID | Source | Status | Detail |
|---------|--------|--------|--------|
| SCE-1 | S1 | PASS | {optional note} |
| ... | ... | ... | ... |

Summary: `{N}/{M}` scenario evals passed.

## Checkpoint Decisions
| Stage | Cycle | Decision | Timestamp |
|-------|-------|----------|-----------|
| {stage-slug} | 1 | Tether | {timestamp} |
| {stage-slug} | 1 | Orbit | {timestamp} |
| {stage-slug} | 2 | Tether | {timestamp} |
| ... | ... | ... | ... |

{One line per checkpoint cycle. Orbit cycles are visible as separate rows.}

## Resolution Gate Outcomes
{Only when the play had a pre-lock resolution gate (e.g. specify).
Lists every issue surfaced at the gate and how it was resolved (RESOLVED
audit entries or Vanish).}

| Issue | Severity | Resolution | Note |
|-------|----------|------------|------|
| {field path} | blocker \| warning | RESOLVED \| Vanish | {user's resolution text} |

## Recovery Attempts
{Only when any agent returned a structured failure and the play invoked
recovery. Lists each recovery cycle, which agent was dispatched, and
whether it succeeded.}

| Cycle | Agent | Reason | Outcome |
|-------|-------|--------|---------|
| 1 | {agent-name} | {failure category} | resolved \| escalated |
| ... | ... | ... | ... |

## Commit Reference
Self-commit SHA: `{short sha}` ({subject line})

## Next Consumers
{1-3 lines naming the downstream plays / consumers that will read these
artifacts. For specify: "design reads enriched-capabilities.yaml
and epics/; arch reads quality-profile.yaml and epics/". For
implement: "/validate checks the built epic against expectations;
the close chain follows acceptance".}
```

## Field rules

| Field | Rule |
|-------|------|
| `play` | Exact play slug. |
| `run_id` | Unique per run. Timestamp-based (`{play}-{YYYYMMDD-HHMMSS}`) is fine. |
| `status` | `COMPLETED` on normal close; `HALTED` on explicit user Vanish; `ABORTED` on unrecoverable failure. |
| `exit_reason` | Short token describing why the run ended. Specific values are per-play. |
| Step Eval Results | Must list EVERY SE-n defined in the compiled play — no silent skips. PASS / FAIL only; DEFERRED / N-A are allowed if the corresponding step was not reached (e.g., Vanish cleanup path). |
| Scenario Eval Results | Must list EVERY SCE-n defined in the compiled play. |
| Checkpoint Decisions | One row per checkpoint cycle. Orbit retries produce multiple rows for the same stage. |
| Commit Reference | Populated AFTER the self-commit step. If the commit step failed, use `N/A — commit failed, see recovery`. |

## Non-blocking

The evidence file is self-committed but the commit is non-blocking. If pre-commit hooks reject the commit, the evidence file remains on disk and the run still closes. A warning is recorded in `Recovery Attempts` if applicable.

## Related

- `checkpoint.md` — referenced by `Checkpoint Decisions` rows
- `approval-prompt.md` — rendered for each checkpoint; the user's responses feed `Checkpoint Decisions`
- `delivery-report.md` — the user-facing summary (different artifact — user-visible, not STM-scoped)
