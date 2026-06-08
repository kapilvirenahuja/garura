# merge-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Merge an approved change: merge the PR, switch to main and pull the latest, and delete
the feature branch (local and remote).

Pipeline position: **end** (fourth step of the end sequence: commit-change →
propose-change → review-change → merge-change). Independent, invokable play; ordering is
enforced by pre-flight (the PR must be approved and mergeable). Supersedes the old merge-pr
play.

### Constraints

- C1 — The PR is merged only after review-change approved it (an approval verdict exists).
- C2 — After the merge, the checkout switches to main and pulls the latest.
- C3 — The feature branch is deleted, both local and remote, after a successful merge.
- C4 — The merge happens only when the PR is mergeable (no conflicts, required checks not
  failing).
- C5 — Re-running after the PR is already merged is a clean no-op, not an error.

### Failure conditions

- F1 — The PR is merged without an approval verdict.
- F2 — After the merge, the checkout isn't on updated main.
- F3 — The feature branch is left undeleted (local or remote) after merge.
- F4 — A merge is attempted on a non-mergeable PR (conflicts or failing checks).
- F5 — Re-running on an already-merged PR errors or attempts to re-merge.

## Expectation

### Success scenarios

- S1 — (developer, approved PR) Given an approved, mergeable PR, when merge-change runs,
  then it merges the PR, switches to updated main, and deletes the feature branch.
  Measure: the PR is merged; the checkout is on main and up to date with origin/main; the
  feature branch is gone locally and on remote.
- S2 — (developer, not approved) Given a PR with no approval verdict, when it runs, then
  it halts without merging. Measure: the PR is not merged; the run halts with the reason.
- S3 — (developer, not mergeable) Given conflicts or failing checks, when it runs, then it
  halts without merging. Measure: the PR is not merged; the run halts with the reason.
- S4 — (developer, already merged) Given the PR is already merged, when it runs again,
  then it is a no-op and ends cleanly. Measure: no second merge is attempted; the run ends
  successfully.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a merge was attempted without an approval verdict. direction: halt
  and require review-change to approve the PR first. handoff: human.
- REC2 (F2) — trigger: after merge the checkout isn't on updated main. direction: check
  out main and pull the latest. handoff: autonomous.
- REC3 (F3) — trigger: the feature branch is still present after merge. direction: delete
  the branch locally and on remote. handoff: autonomous.
- REC4 (F4) — trigger: the PR is not mergeable. direction: halt; conflicts must be
  resolved or failing checks fixed before retrying. handoff: human.
- REC5 (F5) — trigger: a re-run on an already-merged PR. direction: detect the merged
  state and no-op cleanly. handoff: autonomous.
