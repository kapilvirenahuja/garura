# fix-bug — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given an existing open defect issue, find the true root cause — trace the symptom
to the specific code and the reason it is wrong — design a fix that has weighed at
least one alternative, present the root cause and fix design at a single human
checkpoint, and on approval implement the fix and prove it works by an independent
check. After the checkpoint, everything runs autonomously. The play owns only this
core; opening the work (issue, branch, workspace) and closing it (commit, PR,
review, merge) are attached by the pipeline.

Pipeline position: **both**. The D2 pipeline-position rule prepends `start-change`
(resolve the existing issue, cut the branch off fresh main, optional worktree, init
STM) and appends the close sequence `commit-change → propose-change → review-change
→ merge-change`. So this source never spells out branch creation or shipping — those
come only via injection.

### Constraints

- C1 — Anchored to an existing open defect issue. If no open issue is resolvable
  from the branch name or arguments, halt — never invent a fix with no issue.
- C2 — RCA must trace from symptom to the specific root cause: the file, the logic,
  and why it is wrong. Restating the issue title or description is not RCA.
- C3 — The fix design must weigh at least one alternative with the reason it was
  rejected.
- C4 — The design checkpoint is no longer a pinned human gate: it resolves per
  `standards/rules/gate-config.md` (per-play override `gates.plays.fix-bug`, now
  **off** — the skip is recorded). When it is off, the fix proceeds only behind the
  machine preconditions that already made the human redundant: a completed RCA (root
  cause traced to the specific file and logic), a fix design carrying at least one
  weighed alternative, and a regression test proven **red before** the fix. TDD
  red-before-green is the hard invariant and is never gated. Any of the three missing
  is a hard halt — the fix never starts. When the switch is flipped back on, the
  single checkpoint is presented after RCA and fix design are complete, exactly as
  before.
- C5 — After the checkpoint is approved, implementation and verification run with no
  further human approval.
- C6 — RCA and design are grounded in the product's and core knowledge via the
  R1–R4 resolution protocol, and the resolution trace is recorded — unless no
  knowledge base is available, in which case the fallback is recorded explicitly.
- C7 — Red-before-green: a failing regression test for the defect must exist and be
  proven failing before any implementation begins.
- C8 — Validator-not-implementer: the pass/fail verdict that accepts the fix comes
  from an independent verifier, never from the agent that wrote the fix.
- C9 — Context isolation: the implementing agent works only from the design
  artifacts. It must not receive the checkpoint brief content, nor the regression
  test's assertion content — only the test's file path.
- C10 — The checkpoint is rendered inline from the design artifacts; no standalone
  brief or HTML artifact is produced.
- C11 — On approval, a background update is posted to the originating issue mirroring
  the approved root cause and fix plan. It is non-blocking and never gates
  implementation.
- C12 — Implementation changes stay within the files named in the design, unless a
  deviation is justified in the evidence.
- C13 — Verification failures retry a bounded number of times (cap 2 per task); on
  exhaustion the design is revised rather than halting blindly, and the play
  continues with the revised plan.
- C14 — The play ends by proving its Done means at close (gated, #464): the run
  closes COMPLETED only when the Done means hold on disk — never because the step
  list ran out.

### Failure conditions

- F1 — Implementation begins without the human approving the single checkpoint.
- F2 — The RCA names no specific root cause, or merely restates the issue title or
  description.
- F3 — The fix design weighs no alternative with a rejection reason.
- F4 — The issue does not exist, or is not in an open state, when the play starts.
- F5 — Implementation changes files not named in the design, with no documented
  justification.
- F6 — The implementing agent receives checkpoint-brief content, or the regression
  test's assertion content, in its input.
- F7 — The verdict used to accept the fix comes from the implementing agent rather
  than the independent verifier.
- F8 — A resolution trace was required (a knowledge base was available) but none was
  recorded.
- F9 — A standalone brief or HTML artifact exists after the checkpoint preparation
  phase.
- F10 — The fix is accepted without a regression test that was failing before the
  fix and passing after it.
- F11 — The checkpoint was approved but no background issue update was dispatched.
- F12 — The close proves nothing — the play closes COMPLETED without the Done means
  held.
- F13 — With the gate off, the fix proceeded to implementation without all three
  machine preconditions present — a completed RCA, a fix design carrying an
  alternative, and a regression test proven red before the fix.

## Expectation

### Success scenarios

- S1 — (developer, end to end) Given an open defect issue, when fix-bug runs and the
  checkpoint is approved, then the fix is delivered with a recorded root cause, a fix
  design carrying an alternative, an independent pass verdict, and the change merged
  referencing the issue. Measure: rca root_cause is non-empty and names a specific
  file; design has at least one alternative with a rejection reason; the verification
  verdict authored by the independent verifier is `pass`; a merged PR references the
  issue.
- S2 — (tech lead, reviewing the checkpoint) Given RCA and design are ready, when the
  checkpoint is presented, then it shows the root cause (specific file and logic), a
  blast-radius table with at least one affected file, the fix strategy, at least one
  alternative with its rejection reason, and a confidence value — rendered inline.
  Measure: each of those sections is present in the checkpoint; no `.html` file and no
  brief directory exists under the play's evidence path.
- S3 — (QA engineer, audit trail) Given the fix has shipped, when the audit trail is
  inspected, then the originating issue carries an approved-RCA comment whose creation
  precedes implementation, and the accepted fix carries an independent pass verdict.
  Measure: the issue has a comment with an approved-RCA header; the verification
  verdict authored by the independent verifier is `pass`; the checkpoint approval
  timestamp is strictly earlier than the implementation start timestamp.
- S4 — (developer, red-before-green) Given a regression test for the defect, when the
  fix is implemented, then the test was failing before implementation and passing
  after. Measure: a red verification is recorded before implementation begins, and the
  independent verdict after implementation is `pass`.

### Done means

- D1 — says: "the root cause is recorded"
  check: { type: artifact_exists, path: "evidence/fix-bug/rca.yaml" }
- D2 — says: "the fix design is recorded"
  check: { type: artifact_exists, path: "evidence/fix-bug/design.yaml" }
- D3 — says: "the regression test was proven red before the fix"
  check: { type: field_equals, file: "evidence/fix-bug/regression-test-path.yaml", field: "red_verified", equals: true }
- D4 — says: "the fix landed — the PR is merged"
  check: { type: field_equals, file: "review/merge-gate.json", field: "pr_merged", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: an implementation artifact exists, or the implement step is
  in progress, while the approval gate is not a completed approval preceding it.
  direction: hold for the single human approve/reject before any implementation step
  runs. handoff: human.
- REC2 (F2) — trigger: the RCA is missing, its root cause is empty, or it restates
  the issue text. direction: re-run RCA to trace symptom → the specific file, logic,
  and why it is wrong, distinct from the issue text. handoff: autonomous.
- REC3 (F3) — trigger: the design is missing or carries no alternative with a
  rejection reason. direction: re-run the design step to add at least one alternative
  with the reason it was rejected. handoff: autonomous.
- REC4 (F4) — trigger: the issue does not exist or is not open when the play starts.
  direction: escalate for a human to provide or reopen a valid open issue before the
  play proceeds. handoff: human.
- REC5 (F5) — trigger: a changed file is absent from the design with no deviation
  justification. direction: restrict the change to the mapped files, or record the
  deviation justification, before the fix is accepted. handoff: autonomous.
- REC6 (F6) — trigger: the implementing agent's input carries checkpoint-brief
  content or the test's assertion content. direction: rebuild the input with only the
  design artifact paths plus the regression-test file path, stripping all brief and
  assertion content. handoff: autonomous.
- REC7 (F7) — trigger: the accepting verdict came from the implementing agent.
  direction: discard the self-report and obtain the verdict from the independent
  verifier before accepting the fix. handoff: autonomous.
- REC8 (F8) — trigger: a knowledge base was available but no resolution trace was
  recorded. direction: re-run RCA to emit a resolution trace recording the layer that
  answered each domain question. handoff: autonomous.
- REC9 (F9) — trigger: a standalone brief or HTML artifact exists after checkpoint
  preparation. direction: remove the artifact and any brief directory so the evidence
  path holds none. handoff: autonomous.
- REC10 (F10) — trigger: the fix is about to be accepted without a red-then-green
  regression test. direction: author the failing regression test and confirm it red
  before implementation, then confirm it green via the independent verifier before
  accepting. handoff: autonomous.
- REC11 (F11) — trigger: the checkpoint was approved but no issue update was
  dispatched. direction: dispatch the background issue update mirroring the approved
  root cause and fix plan, tracked in evidence. handoff: autonomous.
- REC12 (F12) — trigger: the close would report COMPLETED without the Done means
  held. direction: evaluate the stop condition and surface the unmet clauses; the
  run closes HALTED until state is fixed. handoff: autonomous.
- REC13 (F13) — trigger: the gate resolved off and an implement step is starting
  while any of the RCA, the fix design, or a red-verified regression test is missing.
  direction: HARD HALT and name the missing precondition; do not start the fix until
  all three exist (re-run the producing step per REC2/REC3/REC10 as needed).
  handoff: autonomous.
