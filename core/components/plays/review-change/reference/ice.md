# review-change — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Review an open change thoroughly so the decision to merge rests on something outside the
change itself. Assess — every run — what categories of work the diff actually contains;
resolve each category's review treatment from the review-knowledge memory shelf; and
review each category through the layers that apply to it: the objective linters first,
then, for design-bearing categories, a design-grounding check whose principles are
reconstructed from committed/external sources rather than from the branch's own new
content. Run only the layers and steps that apply to the categories present. Consolidate
every finding — each citing its basis — into one report grouped by category and severity
with a recommended verdict, then stop at a single mandatory human gate where the reviewer
owns the approve-or-reject decision, which is posted to the PR.

The guiding rule: the change under review is never its own standard.

Pipeline position: **end** (third step of the end sequence: commit-change →
propose-change → review-change → merge-change). Independent, invokable play; ordering
enforced by pre-flight (an open PR must exist).

### Constraints

- C1 — Work categories are assessed from the actual diff on every run; the play presumes
  no fixed category list and hardcodes none.
- C2 — Each category's review treatment — which layers run, which linters apply, the
  rubric, and whether design-grounding is required — is resolved from the review-knowledge
  memory shelf, never carried in the play body.
- C3 — Only the layers and steps applicable to the categories present are run; a category
  that is absent has its layer skipped, not failed (applicability is universal).
- C4 — Design-grounding reconstructs each design's principles from committed/external
  sources (base ref, decision records, memory), never from the branch's own new content.
- C5 — The set of files under review is the PR diff; reads outside the diff are permitted
  only to reconstruct external grounding, and the play never runs a full-repo scan.
- C6 — Findings are classified by the PR severity taxonomy (P1–P4), and every finding
  cites its basis — a linter rule identifier or a grounded design principle.
- C7 — Where a category in scope has a runnable check (a test suite, a language linter),
  that check is executed, not merely read.
- C8 — The play produces a recommended verdict but never auto-decides; the approve-or-
  reject decision is the reviewer's at one mandatory human gate, and that decision is
  posted to the PR.

### Failure conditions

- F1 — Categories are presumed or hardcoded instead of assessed from the diff.
- F2 — A category's treatment is taken from the play body instead of the review-knowledge
  memory shelf.
- F3 — A layer runs for a category that is absent, or an applicable layer is skipped.
- F4 — Design-grounding is drawn from the branch's own new content (a circular review).
- F5 — The review expands beyond the diff into a full-repo scan.
- F6 — A finding is reported with no cited basis.
- F7 — A runnable check in scope is read but not executed.
- F8 — The play auto-decides the verdict, or the human's decision is not posted to the PR.

## Expectation

### Success scenarios

- S1 — (reviewer, mixed PR) Given an open PR touching more than one kind of work, when
  review-change runs, then the assessed categories match what the diff contains and each
  present category is reviewed through exactly the layers its treatment calls for. Measure:
  the assessed category set reflects the diff; every present category ran its applicable
  layers; no absent-category layer ran.
- S2 — (reviewer, single-kind PR) Given a PR touching only one kind of work, when it runs,
  then only that category's treatment runs and the layers tied to absent categories are
  skipped. Measure: only the applicable layers ran; design-grounding and test execution are
  skipped — not failed — when their categories are absent.
- S3 — (reviewer, external grounding) Given a PR that changes a design-bearing artifact and
  its own description of the design, when it runs, then the design principles are grounded
  from committed/external sources, not the branch's new text. Measure: every grounding
  source is committed/external; none is a diff-added file.
- S4 — (reviewer, blocking finding) Given a PR with a P1 finding, when it runs, then the
  recommended verdict is reject citing that finding, the human gate is presented, and the
  decision posted to the PR is the human's. Measure: recommended verdict is reject with the
  P1 cited; the posted decision equals the human's input.
- S5 — (reviewer, cited basis) Given any PR, when the consolidated report is produced, then
  every finding names a linter rule or a grounded principle as its basis. Measure: zero
  findings without a cited basis.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: categories presumed or hardcoded. direction: re-run the category
  assessment from the diff and discard any presumed list. handoff: autonomous.
- REC2 (F2) — trigger: treatment taken from the play body. direction: re-resolve the
  category's treatment from the review-knowledge memory shelf. handoff: autonomous.
- REC3 (F3) — trigger: a layer ran for an absent category, or an applicable layer was
  skipped. direction: recompute applicability from the assessed categories — skip absent-
  category layers, run every applicable one. handoff: autonomous.
- REC4 (F4) — trigger: grounding drawn from the branch's own new content. direction: re-
  ground the design from committed/external sources only and re-check conformance. handoff:
  autonomous.
- REC5 (F5) — trigger: the review expanded beyond the diff. direction: re-scope to the diff;
  keep any outside reads read-only and grounding-only. handoff: autonomous.
- REC6 (F6) — trigger: a finding has no cited basis. direction: attach the finding's basis
  (linter rule or grounded principle) or drop the finding. handoff: autonomous.
- REC7 (F7) — trigger: a runnable check was read but not executed. direction: execute the
  check and fold its result into the findings. handoff: autonomous.
- REC8 (F8) — trigger: the verdict was auto-decided, or the decision was not posted.
  direction: hold at the human gate, record the reviewer's decision verbatim, and post it to
  the PR. handoff: human.
