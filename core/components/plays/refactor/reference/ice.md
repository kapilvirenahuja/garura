# refactor — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator/play-editor; never hand-edit the compiled SKILL.md.

## Intent

Given a **refactor target** — code the user names — and the **product model** plus the code's
**current behavior** as fixed contracts, improve the code's internal quality (structure,
duplication, naming, complexity) without changing its external behavior or the product model,
proving behavior is preserved before it lands. A refactor is internal-only: it changes how the
code reads and is shaped, never what it does and never the product model. Where the target's test
coverage is thin, the current behavior is pinned with **characterization tests captured first**
(green on the untouched code) so the refactor has a behavioral net to prove against. One human
checkpoint on the refactor plan precedes any code change; after approval the work runs
autonomously and lands through review.

Pipeline position: **both**. This play owns only the refactor core (gather the target + its
behavior contract + test surface → pin behavior → checkpoint on the plan → refactor → prove
behavior preserved and quality improved). The D2 pipeline-position rule
(`standards/rules/pipeline-position.md`) brackets it: `start-change` is injected at the head
(resolve or create the refactor issue, cut the branch off fresh main, optional worktree, init
STM) and the end sequence `commit-change → propose-change → review-change → merge-change` is
injected as the closing chain. This source never hand-rolls issue/branch/PR/merge steps.

### Constraints

- C1 — Never writes the product model: the product-os tree (spine, lenses, ICE, decisions, and
  slice/epic records) is byte-identical before and after. A refactor is code-only.
- C2 — Preserves external behavior: the observable contract — public APIs, inputs→outputs, and
  side effects — is unchanged. A behavior change means it is not a refactor.
- C3 — Behavior preservation is proven: the target's tests pass before AND after; where coverage
  is thin, characterization tests are captured first (green on the untouched code) to pin the
  behavior; no test is weakened, skipped, or deleted to make it pass.
- C4 — Scoped to the declared target: every modified file is within the target the plan declared
  (or carries a recorded deviation justification); the change does not sprawl.
- C5 — Real quality improvement: the change targets concrete quality issues (duplication,
  complexity, naming, structure) per the quality standards — not cosmetic churn or restyling for
  its own sake.
- C6 — The refactor-plan checkpoint (Step 5, class standard, NOT pinned) resolves as a gate per
  `standards/rules/gate-config.md` (first match wins: `gates.plays.refactor` →
  `gates.classes.standard` → `gates.default`; absent ⇒ on; per-play now off under #467 Batch D).
  The resolution — fire or skip — is always recorded, never silent. When ON, exactly one human
  checkpoint on the refactor plan (what improves, why, and how behavior is held) precedes any code
  change, and after approval no further human approval is requested. When OFF, the refactor proceeds
  ONLY behind the behavior-pin machine wall (C3): the characterization/behavior suite captured and
  GREEN before the refactor, GREEN after, and no test weakened or deleted — any of those failing is
  a HARD HALT, never gated. The human plan-approval is replaced by exactly this behavior-pin
  precondition.
- C7 — The play ends by proving its Done means at close (gated, #464): the refactor plan exists,
  the pre-refactor behavior baseline record exists, and behavior preservation is recorded as
  MACHINE fields — the behavior guard writes a preservation record whose `behavior_preserved`
  field is true (tests green before AND after, no test weakened) — never as prose in a report.
  A close whose Done means does not hold reads HALTED, never COMPLETED.

### Failure conditions

- F1 — A product-model file was added, removed, or changed by the refactor.
- F2 — External behavior changed — a public API, an input→output, or a side effect differs.
- F3 — A test was weakened, skipped, or deleted to make it pass, or behavior preservation was
  left unproven (tests not run, or red before or after).
- F4 — The change sprawled beyond the declared target — a modified file outside the target with no
  deviation justification.
- F5 — Cosmetic churn with no real quality improvement, passed off as a refactor.
- F6 — The refactor landed (any code change was made) without the single human checkpoint.
- F7 — The run closed COMPLETED without the Done means held — a missing plan or baseline
  artifact, or behavior preservation asserted in prose with no machine preservation record.
- F8 — With the plan-approval gate off, a refactor proceeded or landed without the behavior-pin
  holding — the behavior suite was not green both before and after, or a test was weakened/deleted —
  so the machine precondition that replaced the human approval was not actually met.

## Expectation

### Success scenarios

- S1 — (developer, well-tested target) Given a target that already carries passing tests, when
  /refactor runs and the plan is approved, then the code is improved, the same tests pass after,
  and the product model is untouched. Measure: the baseline test verdict is green and the
  post-refactor verdict (same suite, independent run) is green; `check_model_untouched.py` passes;
  the quality audit names at least one concrete improvement.
- S2 — (developer, thin-coverage target) Given a target with thin coverage, when /refactor runs,
  characterization tests are captured first and are green on the untouched code, then the refactor
  is made and those tests still pass. Measure: a characterization-test artifact exists, recorded
  green before implementation; the post-refactor verdict on the same suite is green.
- S3 — (reviewer, no model change) Given /refactor completes, the product-os tree is byte-identical
  before and after. Measure: `check_model_untouched.py` reports PASS over the before/after
  snapshots.
- S4 — (reviewer, no behavior change) Given /refactor completes, the observable contract is
  unchanged — the behavior suite is green before and after and the plan declares no API/contract
  change. Measure: `check_behavior_preserved.py` PASS; the plan's `behavior_contract` is marked
  unchanged.
- S5 — (developer, the checkpoint) Given the plan is ready, the checkpoint presents what improves,
  why, and how behavior is held, before any code change. Measure: no implementation report exists
  with a timestamp preceding the recorded approval; the checkpoint was presented.
- S6 — (QA engineer, no weakening) Given the refactor is verified, no test file was removed and no
  file's assertion count dropped. Measure: `check_behavior_preserved.py` finds no removed or
  weakened test between the before/after test manifests.

### Done means

- D1 — says: "the refactor plan exists"
  check: { type: artifact_exists, path: "evidence/refactor/refactor-plan.yaml" }
- D2 — says: "the pre-refactor behavior baseline record exists"
  check: { type: artifact_exists, path: "evidence/refactor/baseline-verdict.yaml" }
- D3 — says: "behavior preservation is machine-recorded: green before AND after, no test weakened"
  check: { type: field_equals, file: "evidence/refactor/preservation.yaml", field: "behavior_preserved", equals: true }

### Recovery (one per failure condition)

- REC1 (F1) — trigger: a product-model file changed. direction: revert the product-model write and
  restore the tree to its pre-refactor snapshot; a refactor changes code only. handoff: autonomous.
- REC2 (F2) — trigger: external behavior changed. direction: revert the behavior-changing edit; if
  the change is actually wanted it is not a refactor — route it to /fix or /implement. handoff:
  human.
- REC3 (F3) — trigger: a test was weakened/deleted or behavior is unproven. direction: restore the
  test to its prior strength and re-run; where coverage was thin, capture the characterization
  tests first and prove green before and after. handoff: autonomous.
- REC4 (F4) — trigger: a modified file lies outside the declared target with no justification.
  direction: restrict the change to the target, or record the deviation justification, before the
  close. handoff: autonomous.
- REC5 (F5) — trigger: the change is cosmetic churn with no real quality gain. direction: re-scope
  the refactor to a concrete quality issue named against the standards, or drop it. handoff: human.
- REC6 (F6) — trigger: a code change was made with no completed checkpoint preceding it. direction:
  hold for the single human approval before any implementation step runs; revert any premature
  edit. handoff: human.
- REC7 (F7) — trigger: the run is about to close COMPLETED with the Done means unmet (a missing
  plan or baseline artifact, or preservation asserted in prose with no machine record). direction:
  produce the missing artifact — re-run the behavior guard with `--out` so the preservation
  record carries the machine fields — then re-evaluate the stop condition; the close stays HALTED
  until the verdict reads held. handoff: autonomous.
- REC8 (F8) — trigger: with the gate off, a refactor proceeded or landed while the behavior-pin was
  broken (baseline or post not green, or a test weakened/deleted). direction: restore the
  behavior-pin — re-capture or repair the characterization suite to green on the pre-refactor code
  and restore any weakened test to its prior strength — re-run the behavior guard, and do not land
  until green before AND after. handoff: human.
