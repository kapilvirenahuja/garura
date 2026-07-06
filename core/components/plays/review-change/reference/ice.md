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
content. The design-grounding is a concurrent read-only fan-out — one grounding pass per
design-bearing category, dispatched as one batch and joined before consolidation — so a
diff spanning several design-bearing categories is grounded in a single parallel pass
rather than a serial sweep. Run only the layers and steps that apply to the categories
present. Consolidate
every finding — each citing its basis — into one report grouped by category and severity
with a recommended verdict, then stop at a single decision gate: resolved per gate-config,
the reviewer owns the approve-or-reject decision when the gate is on, and the computed
recommendation becomes the decision — marked as a harness verdict — when it is off; either
way the decision is posted to the PR.

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
- C8 — The play produces a recommended verdict and stops at one decision gate that
  resolves per gate-config (`standards/rules/gate-config.md`; per-play
  `gates.plays.review-change` is now off per the #467 ruling). Gate ON: the play never
  auto-decides — the approve-or-reject decision is the reviewer's, and that decision is
  posted to the PR. Gate OFF: the recommendation from `compute_verdict.py` BECOMES the
  recorded decision — `decision.yaml` carries `decided_by: harness`, the recommendation
  verbatim, and the citing findings; the verdict is posted to the PR clearly marked as a
  harness verdict; a REJECT outcome stands exactly as a human reject would (fix the cited
  findings, re-raise; `review-pr.bypass` semantics untouched). The verdict is still never
  silent and never unposted (C9 unchanged).
- C9 — The play ends by proving its Done means at close (gated, #464): a verdict rendered
  AND posted counts as done regardless of approve/reject; after posting, the play records
  `review/posted.json` `{posted: true, comment_url}` and commits+pushes its run artifacts
  (`context.yaml`, `findings.yaml`, `verdict.yaml`, `posted.json`) to the feature branch —
  the open PR carries its own review record.
- C10 — The mechanical PR/host I/O runs in bundled scripts calling git/gh directly (via
  `platform_adapter.py`), not an agent dispatch (#484, tool-first + ADR 025): binding the PR
  context (diff, changed paths, base, standards_order, review shelf) runs in
  `fetch_pr_context.py`; posting the human's verdict comment + committing/pushing the run
  artifacts runs in `post_verdict.py`. The `repo-orchestrator` dispatch is removed. The
  category assessment and design-grounding (`change-reviewer`) and the standards linter
  (`quality-auditor`) STAY agent-run — they are genuine judgment, not mechanical.
- C11 — Design-grounding runs as a concurrent read-only fan-out
  (`standards/rules/concurrent-fanout.md`): once assessment fixes the design-bearing
  category set (the opening barrier), the play dispatches one read-only `change-reviewer`
  per design-bearing category in a single concurrent batch — each grounding ONLY its own
  category from committed/external sources and writing ONLY its own output file
  (`design-findings-<category>.yaml`), no grounding agent depending on another — and the
  play joins the whole batch before consolidation (the closing barrier). The three fan-out
  safety conditions hold (read-only over shared inputs; distinct output paths; no sibling
  dependency), and outputs are collected in a stable category order, so the result is
  identical to a serial run — concurrency changes only wall-clock. A single design-bearing
  category is a fan-out of width one.

### Failure conditions

- F1 — Categories are presumed or hardcoded instead of assessed from the diff.
- F2 — A category's treatment is taken from the play body instead of the review-knowledge
  memory shelf.
- F3 — A layer runs for a category that is absent, or an applicable layer is skipped.
- F4 — Design-grounding is drawn from the branch's own new content (a circular review).
- F5 — The review expands beyond the diff into a full-repo scan.
- F6 — A finding is reported with no cited basis.
- F7 — A runnable check in scope is read but not executed.
- F8 — The play auto-decides the verdict while the gate is on, or the decision is not
  posted to the PR.
- F9 — COMPLETED without the Done means held (e.g. a verdict computed but never posted).
- F10 — With the gate off, the recorded decision differs from the computed
  recommendation, or the posted comment does not identify the decider (harness vs human).
- F11 — A mechanical PR/host operation (context bind, or verdict post + artifact
  commit/push) was run through an agent dispatch instead of its bundled script.
- F12 — Design-grounding was run as a single monolithic pass over all design-bearing
  categories (a serial sweep) instead of a per-category concurrent fan-out; or a grounding
  agent grounded outside its assigned category or wrote a shared/overlapping output path;
  or the batch was not joined before consolidation read its outputs.

## Expectation

### Success scenarios

- S1 — (reviewer, mixed PR) Given an open PR touching more than one kind of work, when
  review-change runs, then the assessed categories match what the diff contains and each
  present category is reviewed through exactly the layers its treatment calls for. Measure:
  the assessed category set reflects the diff; every present category ran its applicable
  layers; no absent-category layer ran; posted.json records the comment URL; run artifacts
  are committed and pushed to the branch; the stop-condition verdict reads held.
- S2 — (reviewer, single-kind PR) Given a PR touching only one kind of work, when it runs,
  then only that category's treatment runs and the layers tied to absent categories are
  skipped. Measure: only the applicable layers ran; design-grounding and test execution are
  skipped — not failed — when their categories are absent; posted.json records the comment
  URL; run artifacts are committed and pushed to the branch; the stop-condition verdict
  reads held.
- S3 — (reviewer, external grounding) Given a PR that changes a design-bearing artifact and
  its own description of the design, when it runs, then the design principles are grounded
  from committed/external sources, not the branch's new text. Measure: every grounding
  source is committed/external; none is a diff-added file.
- S4 — (reviewer, blocking finding) Given a PR with a P1 finding, when it runs, then the
  recommended verdict is reject citing that finding and the gate resolves per gate-config:
  on — the human gate is presented and the decision posted is the human's; off — the
  harness reject is recorded and posted, marked as a harness verdict, and stands exactly
  as a human reject would. Measure: recommended verdict is reject with the P1 cited; the
  posted decision equals the recorded decision and names its decider.
- S5 — (reviewer, cited basis) Given any PR, when the consolidated report is produced, then
  every finding names a linter rule or a grounded principle as its basis. Measure: zero
  findings without a cited basis.
- S6 — (reviewer, multi-category grounding) Given a PR whose diff contains more than one
  design-bearing category, when review-change grounds them, then each design-bearing
  category is grounded by its own read-only agent dispatched in one concurrent batch, and
  all are joined before consolidation. Measure: the number of grounding agents dispatched
  equals the number of design-bearing categories; each wrote only its own
  `design-findings-<category>.yaml`; the batch was joined before the consolidation step read
  any of them; the consolidated result is order-stable (identical to a serial run).

### Done means

- D1 — says: "findings exist"
  check: { type: artifact_exists, path: "review/findings.yaml" }
- D2 — says: "the verdict exists"
  check: { type: artifact_exists, path: "review/verdict.yaml" }
- D3 — says: "the verdict is on the PR"
  check: { type: field_equals, file: "review/posted.json", field: "posted", equals: true }

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
- REC8 (F8) — trigger: the verdict was auto-decided while the gate was on, or the
  decision was not posted. direction: hold at the human gate, record the reviewer's
  decision verbatim, and post it to the PR. handoff: human.
- REC9 (F9) — trigger: the run is about to close COMPLETED with the Done means unmet (e.g.
  a verdict computed but never posted, or posted.json / the run artifacts missing).
  direction: post the verdict / fix the run state (write posted.json, commit+push the run
  artifacts), then re-evaluate the stop condition; the close stays HALTED until the verdict
  reads held. handoff: autonomous.
- REC10 (F10) — trigger: with the gate off, `decision.yaml` differs from the computed
  recommendation, or the posted comment does not identify its decider. direction: rewrite
  `decision.yaml` from `recommended_verdict.yaml` (`decided_by: harness`, recommendation
  verbatim, citing findings) and re-post the comment with the decider named. handoff:
  autonomous.
- REC10 (F11) — trigger: a mechanical PR/host op was run through an agent instead of its
  script. direction: route it through the script (`fetch_pr_context.py` / `post_verdict.py`,
  via `platform_adapter.py`) and remove the agent dispatch. handoff: autonomous.
- REC12 (F12) — trigger: grounding ran as a serial monolithic pass, or a grounding agent
  crossed category scope / wrote a shared output, or the batch wasn't joined before
  consolidation. direction: re-dispatch grounding as a concurrent read-only fan-out — one
  read-only `change-reviewer` per design-bearing category, each scoped to its category and
  its own `design-findings-<category>.yaml`, joined before consolidation. handoff:
  autonomous.
