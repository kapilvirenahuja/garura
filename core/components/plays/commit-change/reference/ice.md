# commit-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Commit all uncommitted work on the feature branch, grouped by concern, with conventional
messages that reference the tracked issue — leaving a clean tree ready to raise. The play
commits only; it does not push (propose-change pushes when it opens the PR).

Pipeline position: **end**. commit-change is the first step of the end sequence
(commit-change → propose-change → review-change → merge-change) that D2 injects into any
play declared `position: end`. Positions are start and end only — there is no middle.

### Constraints

- C1 — Work is committed on a feature branch, never on main.
- C2 — Changes are grouped by concern; each commit holds one coherent concern.
- C3 — Each commit uses conventional format and references the tracked issue.
- C4 — Every changed file lands in a commit or has a stated exclusion reason; the working
  tree is clean afterward.
- C5 — When there is nothing to commit, the play exits cleanly without committing.
- C6 — Sensitive files (secrets, credentials, keys) are never committed; their presence
  blocks the commit.
- C7 — The play commits only; it never pushes (pushing is propose-change's job).

### Failure conditions

- F1 — A commit mixes unrelated concerns.
- F2 — A commit message is generic / doesn't describe the change, or lacks the issue
  reference.
- F3 — Changed files are left uncommitted with no recorded exclusion reason.
- F4 — Work is committed on main.
- F5 — A secret or sensitive file gets committed.
- F6 — The play pushes, overstepping into propose-change.

## Expectation

### Success scenarios

- S1 — (developer, multi-concern changes) Given uncommitted changes spanning more than one
  concern on a feature branch, when commit-change runs, then each concern becomes a
  separate conventional commit referencing the issue, the tree is left clean, and nothing
  is pushed. Measure: commits are grouped one-concern-each; each is conventional and
  references the issue; `git status` is clean; the remote branch tip is unchanged.
- S2 — (developer, nothing to commit) Given a clean working tree, when commit-change runs,
  then it exits cleanly without creating a commit. Measure: no commit is created; the run
  exits gracefully.
- S3 — (reviewer, log readability) Given the resulting commits, then each is reviewable
  from the log alone — type, scope, descriptive subject, issue reference. Measure: every
  commit follows conventional format with an issue reference.
- S4 — (developer, sensitive file) Given a secret or sensitive file among the changes,
  when commit-change runs, then it blocks before committing. Measure: no commit is created;
  the sensitive file is flagged.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a commit covers more than one concern. direction: regroup so each
  commit holds a single concern; re-stage by group and recommit. handoff: autonomous.
- REC2 (F2) — trigger: a commit subject is generic or missing the issue reference.
  direction: rewrite the subject to describe the change and add the issue reference.
  handoff: autonomous.
- REC3 (F3) — trigger: changed files remain uncommitted with no exclusion reason.
  direction: commit the remaining files in an appropriate group, or record an explicit
  exclusion reason. handoff: autonomous.
- REC4 (F4) — trigger: the current branch is main. direction: halt; the work must be moved
  to a feature branch (start-change) before committing. handoff: human.
- REC5 (F5) — trigger: a sensitive file is staged. direction: unstage the sensitive file
  and confirm it is excluded before committing. handoff: human.
- REC6 (F6) — trigger: the play attempted a push. direction: this play commits only —
  drop the push; leave pushing to propose-change. handoff: autonomous.
