# Standard Play Close

Canonical close procedure every play executes as its final step. One block,
play-agnostic. It produces the machine-readable evidence file and the
user-facing delivery report from LTM templates — never hand-authored prose.

This rule is the single source of truth for both the manual editor (direct
SKILL.md edit, allowed for this non-intent scaffolding) and the `/create-play`
compiler (which emits the same block so a rebuild converges, never clobbers).

## Why this is a non-intent change

The close block changes nothing a play *decides* or *guarantees* — no
constraint, failure condition, scenario, eval, agent, or skill. It only
standardizes how a completed run is reported. Per the play-pipeline boundary
rule it is therefore a direct edit, not an `intent.yaml` → rebuild cycle.
`/create-play` is updated to emit it so direct-edit and rebuild produce the
identical block (convergence — see `feedback_recipe_changes_via_rebake`).

## Pipeline Steps source — the generic mechanism

The one thing that made `define`'s report play-specific was its hand-named
phase table. The standard block does NOT hand-name steps. It derives the
Pipeline Steps table from the play's **task DAG** — the task list every play
builds at start per the task-tracking rule:

| Task DAG state | Pipeline Steps row |
|----------------|--------------------|
| task `completed` | status `PASS`, description = task subject (T-id stripped) |
| task `completed` + skipped note | status `SKIP`, reason from the skip note |
| task not reached / play halted before it | status `SKIP` (halted) |
| task failed / play aborted at it | status `FAIL`, detail = failure reason |

The "Key Output" column is **best-effort, orchestrator-filled** from run
context — it is NOT auto-derived (the task tracker exposes status and
description, not an artifact field). If a play's orchestrator has nothing
reliable for a row, leave that cell `—`; the Artifacts Produced table carries
the authoritative artifact list.

Because every play has a task DAG, this is uniform with zero per-play tuning.
A play that later wants a hand-tuned table (like `define`'s named phases) is an
intent-level change *for that one play only* — it does not block the standard.

## Two cross-cutting rules (pin these — they are not optional)

**`evidence.record` gate.** `.garura/core/config.yaml` may set
`evidence: record: false` (it does today; the comment says it skips STM
evidence writes across `ship` and all sub-plays). The split is fixed:
- **C1 (evidence file)** honors the flag — if `evidence.record` is false,
  skip the evidence-file write and record `evidence skipped (record=false)`
  in the delivery report's pointer line instead of a path.
- **C2 (delivery report)** is **always emitted**. It is a UX surface for the
  user, not audit evidence; it is never gated by `evidence.record`.
This is what lets a pilot tell the block worked even when evidence is off.

**`started_at` source (defined precedence, never fabricate).** In order:
(1) the timestamp the play recorded at its own pre-flight, if it records one;
(2) else the earliest checkpoint or evidence-file timestamp written this run;
(3) else the timestamp of the first task's transition to `in_progress` if the
harness exposes it. Never invent a round number. If only (3) is unavailable
too, write `started_at: unknown` — an honest unknown beats a fake precise time.

## The block

Paste verbatim into the play's final step (its "Evidence & Close" /
"Delivery" / final-step section). Substitute only `{play-name}`. All paths
resolve from `.garura/core/config.yaml` at the play's pre-flight; if the play
did not already resolve them, resolve them here. The opening and closing
marker comment lines are the **exact lint anchors** (see Enforced) — do not
alter their text.

```bash
# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---
# Path tokens resolved at pre-flight (resolve here if not already):
#   ltm_project_target  = yq '.ltm.project-target' .garura/core/config.yaml
#   evidence_base, slug:
#     project-scoped play : evidence_base="${stm_base}${issue}/evidence/{play-name}/"   ; slug="#${issue}"
#     product-scoped play : evidence_base="${product_base}_evidence/{play-name}/"        ; slug="${product_slug}"
evidence_template=$(cat "${ltm_project_target}standards/templates/evidence-file.md")
delivery_template=$(cat "${ltm_project_target}standards/templates/delivery-report.md")
ts=$(date -u +%Y%m%d-%H%M%S)
evidence_dest="${evidence_base}${ts}.md"
mkdir -p "$(dirname "$evidence_dest")"
```

**Step C1 — Write evidence file.** Gated by `evidence.record` (skip the write,
record `evidence skipped (record=false)`, still do C2 if the flag is false).
Otherwise fill the `evidence-file.md` slots; write the filled result to
`$evidence_dest`. Do NOT hand-author the body — fill slots:
- frontmatter: `play: {play-name}`, run_id `{play-name}-${ts}`, issue or
  product_slug, started_at / completed_at, status
  (`COMPLETED` | `HALTED` | `ABORTED`), exit_reason.
- Artifacts Produced: every artifact this run wrote (from `$evidence_base`,
  the play's output paths, and any commit SHAs).
- Step Eval Results / Scenario Eval Results: list every eval the play
  defines; `PASS`/`FAIL`, or `N/A` for a path not exercised. A play with no
  evals writes `none defined`.
- Checkpoint Decisions: one row per checkpoint cycle (Tether/Orbit/Vanish +
  timestamp) from the checkpoint files this run wrote; `none` if the play has
  no gates.
- Commit Reference: self-commit SHA(s), or `N/A — commit failed` / `N/A — no
  commit step`.
- terminal status line per the play's own convention.

**Step C2 — Render delivery report.** Fill the `delivery-report.md` slots and
**output the filled report to the user** at close. Do NOT hand-author prose:
- `## {Play-Name} Delivered — {slug or context}`
- Run Summary table: Play, Issue/Slug, Status, Started, Completed.
- Pipeline Steps table: built from the task DAG per the mapping above.
- Artifacts Produced table: the named artifacts + SHAs from C1.
- Next Steps: only if there are real follow-ons (downstream play, open
  defects, uncommitted artifacts). Omit if self-contained.
- End with a pointer to the full evidence file at `$evidence_dest`.

```bash
# --- end Standard Play Close ---
```

## Sub-plays

Detection convention (pinned): a parent's JSON contract to a sub-play always
carries `parent_run_id`. **Presence of `parent_run_id` ⇒ running as a
sub-play ⇒ skip C2** (emit only C1 evidence + a compact result struct to the
parent; the parent's close report absorbs it). **Absent ⇒ run directly by the
user ⇒ always do both C1 and C2.** This removes per-play hand-deciding —
every play applies the same one-key test.

## Non-blocking

Both steps are non-blocking. If the evidence write or the (optional) commit
fails, the run still closes; the failure is recorded in the evidence file's
Recovery Attempts section if applicable.

## Enforced

`lint-components` asserts every compiled play SKILL.md contains the standard
close block. The **exact lint anchor strings** (match literally, both must be
present, opener before closer):

- opener: `# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---`
- closer: `# --- end Standard Play Close ---`

A rebuild that drops them, or drift that alters them, fails lint. Sub-play-only
plays that legitimately skip C2 still carry the full block (C2 is run-time
gated by `parent_run_id`, not removed from the SKILL.md). This converts the
convention from remembered to enforced.

## Related

- `templates/delivery-report.md` — user-facing report shape (C2)
- `templates/evidence-file.md` — machine-readable evidence shape (C1)
- `templates/checkpoint.md` — checkpoint files that feed Checkpoint Decisions
- `feedback_recipe_changes_via_rebake` — the intent vs non-intent boundary
