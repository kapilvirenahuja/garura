# implement — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one ready epic on a realized slice, build it to done — every spec passing
— strictly inside the epic's box: break it into stories, tasks, and tests
test-first in working memory, publish that plan to the epic's tracked issue and
keep it current as the working spine, build with verification walled off from
the implementer, and accept "done" only from adversarial steelman verification
that tried to refute it. The play opens the work; it never closes it — closing
belongs after /validate accepts.

The play has a second entry: the **fix round**. When /validate rejects the
build it stamps the epic `fix_required` and posts a fix report naming each
failure by check and location. Implement re-enters LIGHTWEIGHT: the report is
the exact work list — its findings become plan revision pieces on the existing
plan, no fresh breakdown, no fresh workspace — the epic flips back to
`in_delivery`, and the same done bar applies. Implement ↔ validate is expected
to loop a few rounds; agents fix, validate finds.

Pipeline position: **start**. The D2 pipeline-position rule prepends
`start-change` (resolve/create the epic's issue, cut the branch off fresh main,
optional worktree, init STM). No end sequence is injected — an epic may only
merge, and be deleted, after /validate accepts; the close chain belongs to the
validation side of the pipeline, never to this play. On a fix round the head is
a resume: the issue and branch already exist; nothing is duplicated.

### Constraints

- C1 — Anchored to exactly one epic on a realized slice with all its dependency
  epics already delivered, in ready state (the build) — or in fix_required state
  carrying its /validate fix report (the fix round). Anything else: halt.
- C2 — The epic is the tightest box. Everything the play knows and touches is
  what the epic carries or references — outcome, user check, functionality
  references, context, acceptance. The implementation never crosses those
  boundaries.
- C3 — Grounding comes only from the product model and shape — the epic, the
  ICE it references, the slice's lenses — plus the repository as it actually
  exists. Requirements are never invented; the ICE is referenced, never copied.
- C4 — The play opens the work and never performs any closing action — no
  commit, raise, review, or merge. Full done exists only after validation
  accepts, outside this play.
- C5 — The breakdown — stories, tasks, tests, implementation targets — is
  produced test-first into working memory (STM) only. Nothing of it is written
  into the product model.
- C6 — Spec separation: the test author and the implementer work from the same
  specs and never see each other's output. The implementer never sees test
  content.
- C7 — Evals are authored and executed in a sub-agent compartmentalized from
  the implementer; the implementer never sees eval content or pass criteria.
- C8 — The play prescribes the setup (workspace, evals) and the done bar. The
  ordering of build–test–judge inside a piece of work is left to the executing
  agent — no fixed loop.
- C9 — Done means every spec passes, and the verdict comes from independent
  steelman verification that actively tries to refute "it works" — never from
  the implementer's self-report.
- C10 — Quality gates come from the slice's quality lens; the build is not done
  while any gate fails.
- C11 — The deliverable is code, tests, and the documentation the change
  requires — all inside the same box.
- C12 — All work management flows through the project-tracking orchestrator
  role. The breakdown plan is published to the epic's tracked issue the moment
  it exists, and every story and task's state — planned, in progress, done —
  is kept current on that issue as the build moves. The plan must survive a
  lost session; it never lives only in the conversation. This tracking is
  config-governed, on by default.
- C13 — The published plan is the working spine of the build: stories, tasks,
  and tests with their dependencies forming a DAG. The executing agent anchors
  to the tracked plan throughout — work follows the plan's pieces and their
  dependency order, and any deviation is recorded as a plan update through the
  tracking role, never made silently. (Beside C8: the DAG orders the pieces;
  within a piece, when to test and judge stays the agent's call.)
- C14 — The fix round is lightweight and report-bounded: the /validate fix
  report is the exact work list — every revision piece traces to a report
  finding; no fresh breakdown, no fresh workspace; the epic flips fix_required
  → in_delivery at re-entry; and work beyond what the report names is out of
  box.

### Failure conditions

- F1 — Work proceeds when the epic is missing, not ready, or its dependency
  epics aren't delivered.
- F2 — Any change or artifact lands outside the epic's box.
- F3 — Something gets built that no epic field, referenced ICE, lens, or
  repository fact grounds — an invented requirement.
- F4 — The play performs a closing action, or declares full done without
  validation.
- F5 — Breakdown artifacts are written into the product model instead of
  working memory.
- F6 — The implementer's input carries test content, eval content, or pass
  criteria — or the test author receives implementation.
- F7 — Done is declared while any spec or quality gate fails.
- F8 — The accepting verdict comes from the implementer itself rather than the
  independent steelman check.
- F9 — A breakdown exists but was never published to the tracked issue, or the
  states on the issue have gone stale — they no longer match actual progress —
  at any point the play pauses or ends.
- F10 — Execution diverges from the tracked plan silently: work happens that
  isn't a plan piece, or dependency order is violated, without the plan being
  updated first.
- F11 — A fix round overreaches: work happens that no fix-report finding names,
  a fresh breakdown or workspace is cut instead of revising the existing plan,
  or the epic is left stamped fix_required while its fix is being built.

## Expectation

### Success scenarios

- S1 — (developer, end to end) Given a ready epic on a realized slice with all
  dependency epics delivered, when /implement runs to completion, then code,
  tests, and documentation exist that deliver the epic's outcome, and the
  change is left open — built but unclosed — awaiting validation. Measure: the
  breakdown exists in STM; every acceptance criterion of the epic maps to at
  least one passing spec; the final verdict artifact is authored by the
  independent verifier and reads pass; the play's evidence records zero
  commit, raise, review, or merge actions.
- S2 — (project manager, the plan survives) Given the epic is broken down,
  when the plan is published, then the epic's issue carries the full breakdown
  — stories, tasks, tests, with their dependencies — and at every pause or
  finish, each piece's state on the issue matches actual progress. Measure:
  the issue carries the plan with pieces and dependency edges; at play end or
  pause, every piece state on the issue equals the state recorded in STM
  evidence — zero divergence.
- S3 — (tech lead, box discipline) Given the epic's box, when implementation
  completes, then every change traces to a plan piece and every plan piece
  traces to something the epic carries or references — nothing crosses the
  boundary. Measure: each changed file maps to a plan piece; each plan piece
  cites its grounding (epic field, referenced ICE, lens, or repository fact);
  zero changes lack a mapping; zero writes land under the product model tree.
- S4 — (QA engineer, honest verification) Given the implementer claims the
  work is done, when verification runs, then the evals were authored in a
  sub-agent the implementer never talked to, they actively tried to refute the
  claim, and the verdict is independent. Measure: the eval author's input
  contains no implementer output; the implementer's input contains no test or
  eval content; every refutation found before the final pass is recorded with
  the fix that answered it; the verdict is authored by the verifier, not the
  implementer.
- S5 — (developer, resumability) Given a session dies mid-build, when
  /implement restarts, then it re-anchors to the tracked plan on the issue and
  the STM record, and continues from where the plan says things stand — no
  re-derivation, no duplicate breakdown. Measure: on resume, no second
  breakdown is created; the first action after resume targets the earliest
  plan piece not marked done; in-flight pieces are reset and re-run, not
  double-counted.
- S6 — (developer, the fix round) Given an epic /validate stamped fix_required
  with its fix report posted, when /implement re-enters, then the epic flips
  back to in_delivery, the existing plan gains revision pieces derived from the
  report's findings — nothing else — and the build resumes along the revised
  DAG to the same done bar. Measure: every revision piece cites a fix-report
  finding id; no second breakdown and no second workspace exist; the epic
  status is in_delivery while the fix is built; the done bar (gates + steelman
  verdict) re-runs unchanged.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: no epic resolvable, the epic isn't ready, or a
  dependency epic isn't delivered, yet build steps are starting. direction:
  halt and name the failed precondition; a human supplies a valid ready epic
  or first delivers the dependency. handoff: human.
- REC2 (F2) — trigger: a change or artifact maps to nothing in the epic's box.
  direction: strip the out-of-box work from the change; if the work seems
  genuinely needed, surface it as a question for routing back to the owning
  play — never widen the box from inside implement. handoff: autonomous.
- REC3 (F3) — trigger: a built behavior has no grounding in the epic, its ICE,
  a lens, or the repository. direction: halt that piece and present the
  ungrounded requirement to the human — where the box has no wall, only the
  human draws one. handoff: human.
- REC4 (F4) — trigger: a closing action is attempted or recorded, or full done
  is declared without validation. direction: stop the action, leave the change
  open, and end at "specs passing, awaiting validation". handoff: autonomous.
- REC5 (F5) — trigger: breakdown artifacts found under the product model.
  direction: move them to STM and restore the product model to its prior
  state. handoff: autonomous.
- REC6 (F6) — trigger: the implementer's input carries test or eval content,
  or the test author received implementation. direction: rebuild the input
  clean — spec artifact paths only — and re-dispatch the piece. handoff:
  autonomous.
- REC7 (F7) — trigger: done is about to be declared while a spec or quality
  gate fails. direction: feed the failure back as work on the plan and
  re-verify; done only when everything passes. handoff: autonomous.
- REC8 (F8) — trigger: the accepting verdict traces back to the implementer.
  direction: discard the self-report and obtain the verdict from the
  independent steelman verifier. handoff: autonomous.
- REC9 (F9) — trigger: the plan was never published to the issue, or issue
  states diverge from actual progress. direction: publish or refresh the plan
  on the issue through the tracking role before any further build work.
  handoff: autonomous.
- REC10 (F10) — trigger: work is detected that isn't a plan piece, or
  dependency order is violated. direction: pause the work, update the plan
  first through the tracking role, then continue along the updated DAG.
  handoff: autonomous.
- REC11 (F11) — trigger: fix-round work maps to no fix-report finding, a fresh
  breakdown or workspace appears, or the epic still reads fix_required after
  re-entry. direction: drop the unreported work (or route it as a question per
  REC2), derive revision pieces only from the report, re-anchor to the existing
  plan and workspace, and flip the epic to in_delivery before building.
  handoff: autonomous.
