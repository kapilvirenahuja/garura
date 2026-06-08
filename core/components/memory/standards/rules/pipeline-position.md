# Pipeline Position

Single source of truth for how a play declares where it sits in the delivery pipeline and
what start/end machinery play-creator folds into it. This is the D2 auto-build rule (#434):
the composition lives here once, so every play play-creator compiles wires the same
start-change opening and the same commit → propose → review → merge closing — instead of
each play re-deciding how a change is opened and landed.

It governs only the **delivery pipeline** (the path that opens an issue, does the work, and
lands it on main). Strategic and model-building plays (vision, understand, shape, roadmap,
realize, grill, …) are not on this pipeline and declare `position: none`.

## The declaration

Every play declares one frontmatter field:

```yaml
position: start | end | both | none
```

- **none** (default) — standalone play; nothing is injected. Strategic/model-building
  plays and one-off utilities use this.
- **start** — the play opens a pipeline. play-creator injects **start-change** as the
  play's first step (resolve/create the issue, cut the branch off fresh main, optional
  worktree, init STM).
- **end** — the play closes a pipeline. play-creator injects the **end sequence** as the
  play's closing steps, in order: **commit-change → propose-change → review-change →
  merge-change**, placed after the play's own work and before the Standard Play Close.
- **both** — the play is self-contained: start-change is injected at the front and the end
  sequence at the back, bracketing the play's own work. This is the "start, do everything,
  close the loop" shape — e.g. a `fix-defect` play that opens the issue, fixes it, and
  lands it in one command.

There are only these positions. There is no "middle" — a play's own work simply sits
between the injected start and end; the work is not a declared position.

## The two sequences

| Sequence | Member plays (in order) | Injected when position is |
|----------|-------------------------|---------------------------|
| start | `start-change` | `start` or `both` |
| end | `commit-change` → `propose-change` → `review-change` → `merge-change` | `end` or `both` |

These six plays are the **members** — the building blocks. A member play declares the
`position` of the sequence it belongs to (`start-change: start`; the four end plays: `end`)
so play-creator knows the sequence composition. **A member is never injected into itself**:
play-creator recognizes the members by name and injects no sequence into one of them.
Everything else with a non-`none` position is a **consumer** that receives injection.

## How play-creator injects it (explicit, named)

Injection is explicit, not a hidden macro. The injected pieces appear as named sub-play
steps in the compiled play, wired as JSON-contract handoffs over files on disk (the same
discipline as any other step) and run as sub-plays — each is dispatched with
`parent_run_id` so it emits only its C1 evidence and the parent's close absorbs it (per
`play-close.md`).

- **start** → prepend a first step that runs `start-change`, before the play's own first
  work step. The play's Task DAG gains that step at the head; everything else `blockedBy`
  it.
- **end** → append four closing steps that run `commit-change`, then `propose-change`, then
  `review-change`, then `merge-change`, each `blockedBy` the previous, after the play's last
  work step and before the Evidence & Close step. review-change's verdict gates
  merge-change (a reject stops the sequence; the config `review-pr.bypass` governs whether
  it hard-blocks).
- **both** → both of the above, bracketing the work.

The compiled play shows each injected piece by name in its Workflow and Task DAG — a reader
sees exactly what runs and a partial/resumed run is followable. play-creator does NOT
collapse the end sequence into one opaque "close the change" step.

## Relationship to start-change / the end plays

This rule defines the *composition*; the member plays define the *behavior*. They converge:
play-creator injects calls to the member plays — it never re-implements their steps inline.
A consumer play that hand-rolls its own issue/branch/PR/merge steps instead of declaring a
position and receiving the injection is a violation (it duplicates and drifts from the
members).

## Enforced

Two layers — what the linter checks mechanically, and what play-creator enforces at
compile.

**Linter (`scripts/lint_play.py`, per-compile, mechanical):**
- The frontmatter MUST carry a `position` field with one of `start | end | both | none`.
  Missing or invalid ⇒ lint failure. (`position` is required on compiled
  delivery/consumer plays; strategic, model-building, and meta plays are `none`.)

**play-creator (compile time):**
- For a **consumer** play (position not `none`, name not a member): play-creator injects
  the member calls for the declared position in the required place — `start-change` at the
  head of the Task DAG; the end sequence as the ordered closing steps before the Standard
  Play Close (step 4b).
- For a **member** play: never inject its own sequence into itself; its `position` matches
  its sequence (`start-change: start`; the four end plays: `end`).
- No consumer play hand-rolls issue/branch/PR/merge steps that duplicate a member; those
  come only via injection.

A mechanical lint check that a consumer's compiled output *contains* the injected sequence
in order lands with the **first consumer play (Phase E)** — the five plays here are all
members, so no consumer exists yet to check. Until then, injection correctness is enforced
by play-creator at compile, not re-verified by the linter.

## Related

- `play-close.md` — the Standard Play Close the end sequence is appended before; sub-play
  (`parent_run_id`) evidence convention
- `evidence-recording.md` — D1; the injected sub-plays record evidence the play-only way
- `start-change`, `commit-change`, `propose-change`, `review-change`, `merge-change` — the
  member plays this rule composes
