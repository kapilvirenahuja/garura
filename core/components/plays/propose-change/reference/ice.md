# propose-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Raise the current change for review: run a self-review on its scope and quality, push
the branch, and open a pull request that carries that review, so the change is ready
for review-change.

Pipeline position: **end** (second step of the end sequence: commit-change →
propose-change → review-change → merge-change). The D2 pipeline-position rule injects this
sequence into any play declared `position: end`. The plays are independent and invokable;
their order is enforced by each one's pre-flight, not by welding them into one play.

### Constraints

- C1 — A self-review on scope and quality runs before the PR opens, and its result
  travels in the PR.
- C2 — The branch is pushed to origin and a pull request is opened against main.
- C3 — The change is fully committed first; the play does not raise with a dirty tree.
- C4 — The PR references its tracked issue.
- C5 — Raising again when a PR already exists for the branch updates that PR; it never
  opens a duplicate.
- C6 — The self-review's rules come from a standards file resolved for the current
  project (a project-level override wins over the base `standards/rules/self-review.md`);
  the review never runs on rules hardcoded in the play.
- C7 — The play ends by proving its Done means at close (gated, #464), and commits its
  own run artifacts (self-review.md, resolved-rules.json, pr.json) on the feature branch
  BEFORE the push — the PR carries the play's own record and the tree stays clean.

### Failure conditions

- F1 — A PR opens without the scope/quality self-review attached.
- F2 — The branch wasn't pushed, or the PR wasn't opened.
- F3 — A PR is raised while uncommitted changes are left behind.
- F4 — The PR has no issue reference.
- F5 — A second run opens a duplicate PR for the same branch.
- F6 — The self-review runs on hardcoded rules, or ignores a project override of the
  rules file when one is present.
- F7 — The close proves nothing — COMPLETED without the Done means held.

## Expectation

### Success scenarios

- S1 — (developer, clean change) Given a committed feature branch with an issue, when
  propose-change runs, then a self-review from the resolved rules file is produced, the
  branch is pushed, and a PR is opened against main carrying the self-review and the
  issue reference. Measure: a PR exists for the branch; its body contains the self-review
  checklist; its body references the issue; the run artifacts are committed before the
  push; the stop-condition verdict reads held.
- S2 — (developer, project override) Given the project supplies its own self-review
  rules file, when propose-change runs, then the self-review uses the project's rules,
  not the base. Measure: the recorded resolved rules path is the project override, and
  the checklist reflects it.
- S3 — (developer, re-raise) Given a PR already exists for the branch, when
  propose-change runs again, then it updates the existing PR instead of opening a new
  one. Measure: the open-PR count for the branch is unchanged; the same PR number is
  reused.
- S4 — (developer, dirty tree) Given uncommitted changes, when propose-change runs, then
  it halts before pushing or opening and asks for the change to be committed first.
  Measure: no push and no PR were made; the user is told to commit.

### Done means

- D1 — says: "the self-review exists"
  check: { type: artifact_exists, path: "context/self-review.md" }
- D2 — says: "the PR record exists"
  check: { type: artifact_exists, path: "context/pr.json" }
- D3 — says: "the PR targets main"
  check: { type: field_equals, file: "context/pr.json", field: "base", equals: "main" }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a PR would open without the self-review. direction: run the
  self-review from the resolved rules file and attach it before opening. handoff:
  autonomous.
- REC2 (F2) — trigger: the push or PR-open failed. direction: retry the push/open and
  surface the platform error. handoff: autonomous.
- REC3 (F3) — trigger: uncommitted changes at raise time. direction: halt and have the
  change committed (e.g. via commit-change) before raising. handoff: human.
- REC4 (F4) — trigger: the PR has no issue reference. direction: add the issue reference
  to the PR. handoff: autonomous.
- REC5 (F5) — trigger: a second run would open a duplicate PR. direction: detect the
  existing PR for the branch and update it instead. handoff: autonomous.
- REC6 (F6) — trigger: the self-review ran on hardcoded rules or ignored a project
  override. direction: re-resolve the rules file via standards_order (project override →
  base) and re-run the self-review. handoff: autonomous.
- REC7 (F7) — trigger: the close would stamp COMPLETED without the stop-condition
  verdict held. direction: evaluate the stop condition, surface the unmet clauses, and
  close HALTED (`stop_condition_unmet`) until they are fixed — an unevaluable verdict is
  never a pass. handoff: autonomous.
