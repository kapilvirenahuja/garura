# review-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Review an open change against the invoker's resolved standards: run the diff-scoped
quality check, classify findings by the severity taxonomy, and end in an explicit
approve or reject verdict posted to the PR.

Pipeline position: **end** (third step of the end sequence: commit-change →
propose-change → review-change → merge-change). Independent, invokable play; ordering
enforced by pre-flight (an open PR must exist). Supersedes the old review-pr play.

### Constraints

- C1 — The review is scoped to the PR diff only; it never runs a full-repo scan.
- C2 — Findings are classified deterministically by the PR severity taxonomy (P1–P4),
  not ad-hoc.
- C3 — Standards are resolved from the invoker's `standards_order` (project, KB, LTM);
  they are never hardcoded in the play.
- C4 — The play ends in exactly one verdict: approve or reject.
- C5 — A reject cites the blocking findings that caused it; an approve records that no
  blocking (P1) findings remain.
- C6 — The verdict is posted to the PR so the decision is visible on the change.

### Failure conditions

- F1 — The review reads beyond the PR diff (full-repo).
- F2 — Findings are classified ad-hoc instead of by the severity taxonomy.
- F3 — The play ends with no verdict, or an ambiguous one.
- F4 — It approves while P1/blocking findings remain, or rejects without citing them.
- F5 — The verdict isn't posted to the PR.
- F6 — Standards used weren't resolved from the invoker's `standards_order`.

## Expectation

### Success scenarios

- S1 — (reviewer, clean PR) Given an open PR with no P1 findings, when review-change
  runs, then it produces diff-scoped findings classified by the taxonomy and ends in
  approve, posted to the PR. Measure: verdict == approve; no P1 in findings; a verdict
  comment exists on the PR.
- S2 — (reviewer, blocking PR) Given an open PR with a P1 finding, when review-change
  runs, then it ends in reject citing that finding, posted to the PR. Measure: verdict ==
  reject; cited blocking findings include the P1; a verdict comment exists on the PR.
- S3 — (reviewer, project standards) Given the invoker's `standards_order` resolves
  project standards, when it runs, then the review uses those standards. Measure: the
  recorded resolved standards set matches the `standards_order` resolution.
- S4 — (reviewer, diff scope) Given a PR touching a subset of files, when it runs, then
  only those files' domains are evaluated. Measure: the evaluated paths are a subset of
  the PR's changed paths.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the review touched files outside the diff. direction: re-scope to
  `changed_paths` only and re-run. handoff: autonomous.
- REC2 (F2) — trigger: findings classified ad-hoc. direction: re-classify via the PR
  severity taxonomy. handoff: autonomous.
- REC3 (F3) — trigger: no or ambiguous verdict. direction: apply the verdict rule —
  reject if any P1 or sub-threshold confidence, else approve. handoff: autonomous.
- REC4 (F4) — trigger: approve with a P1 remaining, or reject without citations.
  direction: recompute the verdict against the findings and attach the blocking-finding
  citations. handoff: autonomous.
- REC5 (F5) — trigger: the verdict wasn't posted. direction: post the verdict comment to
  the PR. handoff: autonomous.
- REC6 (F6) — trigger: standards weren't from `standards_order`. direction: re-resolve
  standards via `standards_order` and re-run the review. handoff: autonomous.
