# focus — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Show the small set of tracked issues worth attention right now, shaped by one of three
fixed modes, with a plain reason on every entry.

The tracked issue host is the single source of "what is worth attention". No backlog
file, no sprint plan, no product model, and no work queue is consulted, and none is
created. This play is the issue-side counterpart to `/next`, which reads the product
model and is explicitly forbidden from reading issues; the two never overlap.

A real project's issue list is long, so the play never shows the whole list. It shows a
capped, ordered slice of it, chosen by the mode the operator asked for:

- **today** — open issues that could be picked up now: unblocked, and either unassigned
  or assigned to the operator.
- **review** — open work already in flight: assigned, carrying a linked branch or pull
  request, or stale past the bar.
- **recent** — issues closed inside the recency window: what got done.

The mode is a fixed, named choice supplied when the play is run, with `today` as the
default. It is never inferred from free text and never resolved at run time. Ordering
inside a mode is deterministic, so the same issue set and mode always give the same
list; the only variable input is the issue host's state.

Every entry names its issue number and title and says, in plain words, why it is
showing — built from the signals that selected it, not from prose invented per run.

Every entry also says what the issue **is** — a defect, an epic, a refactor, a feature,
documentation, a chore, or unlabelled — and, where the table names one, which garura play
to run for it. Both come from a fixed table keyed on the issue's own labels, held in a
data file the project can extend. Neither is ever inferred, and neither is ever worked
out by reading the product model: recommending from the model is `/next`'s job, and a
second recommender that can disagree with the first is worse than no recommendation at
all.

**The cardinal rule: silence beats a wrong answer.** Where the table names no play — a
kind with no command, or a label set matching no row — the entry carries **no
recommendation at all**. Not a generic pointer, not a safe-looking default, not another
play's name. The entry states its kind, says plainly that it cannot tell, and stops. A
default offered in place of an answer still reads as advice, and advice the play cannot
back is worse than the gap it was hiding.

### Constraints

- C1 — Every entry derives solely from issues read from the tracked issue host. No
  backlog, sprint plan, product model, or work queue is consulted, and none is created.
- C2 — Read only: the play never creates, edits, closes, comments on, labels, assigns or
  otherwise writes to any issue, and never launches another play.
- C3 — Every entry names its issue number and title and carries a non-empty plain-language
  reason built from the signals that selected it, plus its kind. It carries a play to run
  only when the table names one for that kind.
- C4 — Output is capped at 10 entries. When more issues match the mode, the surplus is
  counted and reported, never listed.
- C5 — The mode is exactly one of `today`, `review`, `recent`, with `today` as the
  default. An unrecognised mode halts the play; it is never guessed or inferred.
- C6 — `recent` reads issues closed inside the recency window (7 days). `today` and
  `review` read open issues. A mode never returns an issue in the wrong state.
- C7 — Selection and ordering are deterministic: the same captured issue set and the same
  mode always yield the same ordered, capped list. No judgment is applied to selection,
  ordering, or reason text.
- C8 — When a mode matches nothing, the play says so plainly and stops. It never falls
  back to another mode, widens the recency window, or relaxes the mode's filters.
- C9 — The play leaves no working artifacts behind. Its only durable products are the
  presented list and, when evidence recording is on, the evidence record. Every transient
  working file is deleted once the list has been verified and presented. The evidence
  record is never deleted.
- C11 — An entry's kind and its recommended play come only from a fixed table keyed on the
  issue's labels, held in a data file resolved at pre-flight. First matching row wins and
  the row order is the precedence. A label set matching no row falls back to the table's
  declared fallback. The play never infers a kind, never invents a play name, and never
  derives a recommendation by reading the product model — model-derived recommendation is
  `/next`'s responsibility, not this play's.
- C12 — Silence beats a wrong answer. Where the table names no play for an entry — a
  matched row with no command, or no matched row at all — the entry carries no
  recommendation whatsoever: no default, no generic pointer, no substitute play name. It
  states its kind, says it cannot tell, and stops. The count of entries carrying no
  recommendation is reported, so the gap is visible rather than papered over.
- C10 — The play ends by proving its Done means at close, never by its step list running
  out. The proof is evaluated at close, before the self-clean removes the working folder;
  the verdict's durable copy is the evidence record.

### Failure conditions

- F1 — The play writes to the issue host (creates, edits, closes, comments, labels or
  assigns).
- F2 — An entry is shown with no reason, or with no issue number.
- F3 — The rendered list is longer than the cap, or the surplus is not reported.
- F4 — An entry is in the wrong state for its mode (a closed issue under `today` or
  `review`; an open issue, or one closed outside the window, under `recent`).
- F5 — The mode argument is unrecognised and the play guesses a mode instead of halting.
- F6 — The issue host call fails or returns partial data and the play presents the result
  as a complete list.
- F7 — Working files remain on disk after the run completes.
- F8 — The close reports COMPLETED without the Done means held.
- F9 — An entry carries a kind or a recommended play that the kind map does not contain —
  an invented play name, a kind asserted without a matching label, or a recommendation
  derived from the product model instead of the table.
- F10 — An entry the table has no play for is given one anyway — a default, a generic
  pointer, or a substitute — instead of carrying no recommendation.

## Context

- `/next` (`core/components/plays/next/`) is the model-side recommender. Its C1 forbids
  reading any backlog or issue store, so `/focus` is the issue-side counterpart, not a
  duplicate. Neither play reads the other's source.
- The issue host is resolved from `.garura/core/config.yaml`; all live host reads go
  through the `platform-adapter` skill's `list-issues` verb, invoked by the
  `project-orchestrator` agent. Scripts never shell out to the host (layer rule).
- The existing `manage-issue` skill's `list` action is hard-capped at 5 results and
  pre-filtered to unassigned enhancement/no-label issues. That is too narrow for this
  play, so `/focus` captures through `platform-adapter` directly.
- The kind map lives at `reference/kind-map.yaml` beside the play, the same
  data-file-beside-the-play pattern `/next` uses for its work-intelligence shelf. Its label
  vocabulary matches garura's own issue standard (`standards/templates/github-issue.md`),
  so a project opening issues through the pipeline lands on the right kind unaided. Note
  that `start-change` does not itself apply a kind label — an unlabelled issue is expected
  and reads as `unlabelled`, pointing at `/next`.
- The cardinal rule this play implements — `standards/rules/no-unbacked-recommendation.md`.
  `/focus` is its reference implementation: C12 is the rule, F10 its failure, S8 its
  scenario, REC10 its strip-not-replace recovery. Any change here must keep that wiring.
- Position `none`: read-only, runnable on any branch at any point in the pipeline.

## Expectation

### Success scenarios

- S1 — **solo builder, "what do I pick up now"**
  Given a repo with many open issues and no mode supplied.
  Then the play runs in `today` and shows at most 10 open, unblocked issues, each with
  its number, title and a plain reason.
  Measure: every entry has `state: open`; entry count is at most 10; every entry has a
  non-empty reason, an issue number and a kind; an entry has a play name only where the
  table gives one, and every other entry has none.

- S2 — **lead, "show me what is in flight"**
  Given open issues, some assigned or carrying a linked branch or pull request, and some
  untouched for weeks.
  Then `--mode review` shows only in-flight or stale open issues; open issues with no
  in-flight signal are absent.
  Measure: every entry carries at least one in-flight signal (assignee, linked branch or
  PR, or age past the stale bar); no entry lacking all three appears.

- S3 — **anyone, "what got done"**
  Given issues closed inside and outside the recency window.
  Then `--mode recent` shows only issues closed inside the window; open issues never
  appear.
  Measure: every entry has `state: closed` and a `closed_at` inside the window; entry
  count is at most 10.

- S4 — **big repo, over the cap**
  Given more issues match the mode than the cap allows.
  Then the play lists exactly the cap and states plainly how many more matched.
  Measure: exactly 10 entries are listed and the reported surplus equals matched minus 10.

- S5 — **empty result**
  Given no issue matches the chosen mode.
  Then the play states that the mode found nothing and stops, without switching mode or
  widening the window.
  Measure: zero entries, an explicit empty message, and the recorded mode equals the
  requested mode.

- S7 — **full-garura project, labelled issues**
  Given a repo whose issues carry the standard labels — one `defect`, one `epic`, one
  `refactor`, one `feature`, and one with no labels at all.
  Then each entry names the kind its label maps to and the play the table gives for that
  kind, and the unlabelled one reads `unlabelled`, carries no recommendation at all, and
  names no play.
  Measure: the `defect` entry's command is `fix-bug`, the `epic` entry's is `grill`, the
  `refactor` entry's is `refactor`, the `feature` entry's is `shape`; the unlabelled entry
  has no command and no recommendation text naming any play; every command value that is
  present appears in the kind map.

- S8 — **operator, "why is this one blank"**
  Given a run whose entries include kinds the table has no play for (documentation, chore)
  and issues with no labels at all.
  Then those entries carry no recommendation, the play states plainly that it cannot tell
  and why, and it reports how many entries it could not recommend for.
  Measure: no entry lacking a table command carries any play name; the reported
  no-recommendation count equals the number of such entries; that count appears in the
  presented list.

- S6 — **audit, "it changed nothing"**
  Given a run in any mode.
  Then no issue on the host was created, edited, closed, commented on, labelled or
  assigned.
  Measure: the run's write-verb count against the issue host is 0 and the captured
  issue set is byte-identical before and after selection.

### Recovery

- REC1 (F1) — trigger: a write verb is attempted against the issue host. Direction: halt
  the run before the call lands and report the attempted verb; read-only is structural
  and is never repaired by retry. Handoff: human.
- REC2 (F2) — trigger: an entry has no reason or no issue number. Direction: drop the
  malformed entry, re-render from the captured issue file, and record the drop.
  Handoff: autonomous.
- REC3 (F3) — trigger: the rendered list exceeds the cap, or the surplus count is absent.
  Direction: re-apply the cap over the captured set and re-render with the surplus count.
  Handoff: autonomous.
- REC4 (F4) — trigger: an entry's state does not match its mode. Direction: re-run the
  mode filter over the captured file and re-render. Handoff: autonomous.
- REC5 (F5) — trigger: the mode argument is not one of the three named values.
  Direction: halt and list the three valid modes; never guess. Handoff: human.
- REC6 (F6) — trigger: the issue host call fails or returns partial data. Direction: halt
  before rendering and report the host error and that no list was produced; never present
  a partial list as complete. Handoff: human.
- REC7 (F7) — trigger: working files remain after the run completes. Direction: delete
  the working folder; the already-presented list is the only product. Handoff: autonomous.
- REC9 (F9) — trigger: an entry's kind or recommended play is absent from the kind map.
  Direction: re-derive both from `kind-map.yaml` over the captured labels and re-render; a
  kind or command that still fails to resolve means the map is incomplete — record the gap
  and fall the entry back to `unlabelled` + the `/next` pointer rather than naming a play
  the table does not contain. Handoff: autonomous.
- REC10 (F10) — trigger: an entry the table has no play for carries a recommendation.
  Direction: strip the recommendation from that entry, re-render it as kind-only with the
  map's no-command note, and re-report the no-recommendation count. Never repair by
  choosing a different play — the absence is the correct answer. Handoff: autonomous.
- REC8 (F8) — trigger: the close would report COMPLETED without the Done means held.
  Direction: surface the unmet clauses and re-run the producing step to restore the
  missing artifact, or close HALTED with the verdict recorded. Handoff: autonomous.

### Done means

- D1 — the captured issue set exists on disk. check: `artifact_exists` `issues.json`
- D2 — the mode was resolved to one of the three named values. check: `field_equals`
  `selection.json` field `mode_valid` equals `true`
- D3 — the capped, ordered selection exists (machine form). check: `artifact_exists`
  `selection.json`
- D4 — every listed entry carries a reason, an issue number and a kind. check:
  `field_equals` `selection.json` field `entries_missing_fields` equals `0`
- D6 — every recommended play resolves in the kind map; none was invented, and no entry
  the table has no play for was given one. check: `field_equals` `selection.json` field
  `entries_off_map` equals `0`
- D5 — the presented list exists (human form). check: `artifact_exists` `focus.md`
