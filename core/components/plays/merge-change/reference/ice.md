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
- C6 — The play ends by proving its Done means at close (gated, #464). merge-gate.json
  carries the machine fields the proof reads: pr_merged (true on a fresh merge AND on the
  already-merged no-op path) and branch_deleted (true when the feature branch is gone
  locally and on origin; on the no-op path, true when it was already gone). At close, the
  play commits its run records (merge-gate.json, the review dir if present) on main per
  the evidence self-commit rule (ADR 012) — the push of that commit is reported as owed
  to the human, never performed by the play.
- C7 — The Confirm Merge checkpoint is **pinned** (`class: one-way-door, pinned`;
  `standards/rules/gate-config.md`). The land on `main` is irreversible, so it always
  presents and waits for a typed human approval — no config value, policy, or ledger can
  turn it off (the #467 re-pin correction: the rest of merge-change is automatic, but the
  actual land keeps its human beat). The three machine preconditions — `approved: true`
  (the review-change verdict), `mergeable: true` (no conflicts), and no failing required
  checks — are a **machine wall verified before the checkpoint is presented**: if any is
  false the run HALTS without asking (there is nothing to approve). Only when all three
  hold is the human confirmation presented; the merge proceeds solely on the typed
  approval.

### Failure conditions

- F1 — The PR is merged without an approval verdict.
- F2 — After the merge, the checkout isn't on updated main.
- F3 — The feature branch is left undeleted (local or remote) after merge.
- F4 — A merge is attempted on a non-mergeable PR (conflicts or failing checks).
- F5 — Re-running on an already-merged PR errors or attempts to re-merge.
- F6 — COMPLETED without the Done means held (e.g. merged but the branch survived, or the
  gate record missing).
- F7 — A merge proceeded without the pinned human approval on the land, or the three
  machine preconditions (approved, mergeable, no failing required checks) were not all
  verified true before the human was presented.

## Expectation

### Success scenarios

- S1 — (developer, approved PR) Given an approved, mergeable PR, when merge-change runs,
  then it merges the PR, switches to updated main, and deletes the feature branch.
  Measure: the PR is merged; the checkout is on main and up to date with origin/main; the
  feature branch is gone locally and on remote; merge-gate.json reads pr_merged true and
  branch_deleted true; the records commit exists on main; the stop-condition verdict reads
  held.
- S2 — (developer, not approved) Given a PR with no approval verdict, when it runs, then
  it halts without merging. Measure: the PR is not merged; the run halts with the reason.
- S3 — (developer, not mergeable) Given conflicts or failing checks, when it runs, then it
  halts without merging. Measure: the PR is not merged; the run halts with the reason.
- S4 — (developer, already merged) Given the PR is already merged, when it runs again,
  then it is a no-op and ends cleanly. Measure: no second merge is attempted; the run ends
  successfully; merge-gate.json reads pr_merged true and branch_deleted true; the records
  commit exists on main; the stop-condition verdict reads held.

### Done means

- D1 — says: "the merge gate is recorded"
  check: { type: artifact_exists, path: "review/merge-gate.json" }
- D2 — says: "the PR is merged"
  check: { type: field_equals, file: "review/merge-gate.json", field: "pr_merged", equals: true }
- D3 — says: "the branch is gone both sides"
  check: { type: field_equals, file: "review/merge-gate.json", field: "branch_deleted", equals: true }

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
- REC6 (F6) — trigger: the run is about to close COMPLETED with the Done means unmet.
  direction: fix the state — delete the surviving branch / rewrite the gate record — and
  re-evaluate the stop condition; the close stays HALTED until the verdict reads held.
  handoff: autonomous.
- REC7 (F7) — trigger: a merge would proceed without the pinned human approval, or a
  precondition (approved, mergeable, no-failing-required-checks) was not verified true
  before presenting. direction: halt the merge; if a precondition failed, surface which
  one and do not present; if the human beat was skipped, present and wait. handoff:
  autonomous.
