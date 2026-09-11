**Harness verdict (gate off per `gates.plays.review-change`): APPROVE**

Computed by the harness, not typed by a human. Equals the computed recommendation verbatim: no P1 findings.

## What was reviewed

Categories were assessed from the diff, not presumed. Four present across 28 paths:

| Category | Treatment | Result |
|---|---|---|
| harness (7 paths) | design-grounded from committed sources | 1×P2, 1×P4 |
| code (10 paths) | standards linter + every runnable check executed | clean |
| memory (1 path) | design-grounded from committed sources | clean |
| stm_run_artifacts (10 paths) | no playbook on the shelf | gap, recorded |

## The claims were tested, not accepted

The PR claims two intent changes that went through the ICE pipeline, with no element counts moved. Both reviewers checked that independently:

- Both plays' recorded fingerprints match `shasum -a 256` over their own `reference/ice.md`.
- `lint_play.py` passes with 0 gaps on both `/ux` and `/shape`.
- The element counts were recounted by hand AND diffed line by line against `main`. The claim holds exactly: `/ux` 14/15/7/15 and `/shape` 15/16/8/16, both unchanged. Every change is a sentence added inside a rule that already existed — nothing bolted on.

**The most important check, and it passed.** This whole issue exists because #548 widened a guarantee with no input wired to satisfy it. The harness reviewer traced the new promise end to end: the readiness gate resolves personas and journeys and fails loudly when one is broken, the play hands them over in its Step 1 contract, the authoring skill declares them as inputs, and the skill is told to expand journeys rather than invent flows. Nothing dangling. The defect did not recur in a new place.

## Code — executed, not read

- `py_compile` on all 10 changed Python files: exit 0.
- `ruff check` on all 10: exit 0, all checks passed.
- The 8 `check_ready_slice.py` copies: the 166-line diff is byte-identical across all 8. `grill`'s copy still differs only where it already differed before this PR.
- `check_ready_slice.py` run read-only against the real griffin model: positive case passes with old output keys unchanged and the new `personas[]`/`journeys[]` present — the additive claim holds. Three negative fixtures (a broken surface `persona_ref`, a surface with no journey, a journey with a broken `persona_ref`) each exit 1 with the documented error. Pre-existing exit codes unchanged.
- `validate_ux.py --readiness`: positive pass, plus three negatives — unresolved journey ref, a persona that disagrees with the journey's own persona, and an unexpanded journey — all correctly error. Omitting `--readiness` degrades to a warning, so it is genuinely optional.
- `validate_shape.py`: the new persona-grounding check fires as warnings only (3 warnings, `ok: true`, exit 0) and never blocks.

## Memory — clean, and the last PR's lessons held

PR #549 drew two P2 findings on a sibling schema: a breaking change with no migration note, and a stale claim contradicting its neighbour. Both were checked for here:

- The migration note is present and correctly scoped. Because the change is additive and optional, nothing breaks, so the full migrate-existing-records obligation is not triggered the way it was for #549. The note says plainly it is not a substitute for the parked schema-evolution play.
- Both validation claims in the file are now accurate and agree with each other, verified against the real validator code: it errors only on `id`/`name`, says nothing about `description`/`node_ref`, and only warns on the three new fields. Commit `dfd95fd1` fixed the one place still claiming nothing read them.
- A real griffin persona carrying only `id`, `name`, `description`, `node_ref` stays valid — zero errors, one non-blocking warning.
- Every other committed file mentioning persona was checked for staleness. None describes the persona record's shape, so none went stale the way `lens/_index.md` did last time.

## The one P2 — pre-existing, carried forward

Both plays carry a deviation note admitting they were hand-compiled from `reference/ice.md` rather than produced by a `/play-editor` run, because play-editor is interactive-only and cannot run headless here. The repo's own play-pipeline rule in `CLAUDE.md` carves out no such exception.

**This PR did not introduce it.** The note is already on `main` from #500, verified by reading the base ref. But this change builds further work on a compiled file that was never checked against what the real compiler would emit, and the same unresolved "this needs to happen" note has now ridden along for three PRs.

Basis: the play-pipeline rule, `CLAUDE.md` on main. Worth its own issue rather than another carry-forward.

**P4, informational:** `author-shape-bundle` went 0.3.0 → 0.4.0 for an additive, backward-compatible change. Nothing wrong, just noted.

## Open items for the record — none caused by this PR

- `context.yaml` resolved the review shelf to `./.garura/core/memory/knowledge/review/`, which does not exist in this repo. Both the category assessment and both grounding passes fell back to the committed shelf at `core/components/memory/knowledge/review/` and said so. **This is the second review in a row hitting it** (it was recorded on #549 too) and it should be fixed at the source.
- `stm_run_artifacts` still has no playbook on the review shelf. Recorded as a gap on both reviews now.
- The griffin worktree changed between two read-only calls during the code review — another process is editing it. Not a defect here; the reviewer captured self-consistent input/output pairs.

## Routing

Approve. `review-pr.bypass` is `true` for this repo, so the verdict does not hard-block the merge either way. Nothing open is blocking.
