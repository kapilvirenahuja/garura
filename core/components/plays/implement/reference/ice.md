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

Before any code is written the play distills the work into a **spec**: a crisp,
human-readable, ICE-shaped boundary document that states the rules, patterns,
design decisions, and configuration the build must hold to — captured once from
understanding both the requirement and the existing code, never the code itself.
On the initial build a **human approves that spec**, and that approval is the last
checkpoint before the build runs **autonomously** — the human hands off and the
agent carries the epic to done alone. Because no one is watching the build, the
spec must be right at approval and the build's context must stay tight: each
piece is built from its own piece, its dependencies, and the spec — never the
whole plan or a free roam of the repository — with progress on disk so a long run
pauses, resumes, and hands off without drift. The play may stand up temporary,
single-use implementation skills at runtime to author the per-language build
prompt, removing them when it finishes.

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
merge, and be stamped `delivered`, after /validate accepts; the close chain
belongs to the validation side of the pipeline, never to this play. On a fix round the head is
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
- C15 — The build never begins until a human has explicitly approved the spec.
  On the initial build this approval is mandatory and never skipped — it is the
  last human checkpoint before the build runs autonomously, the point where
  human and agent align on what will be built. A fix round does not re-gate: it
  is report-bounded (C14), its revision pieces trace to /validate's findings and
  cannot widen the approved box, so it re-enters and proceeds without a fresh
  approval.
- C16 — The approved artifact is a spec: a crisp, human-readable, ICE-shaped
  boundary document — Intent (what the build delivers), Context (the rules,
  patterns, design decisions, and configuration — ports and the like — the build
  must hold to, plus the map of the existing code it touches), Expectation (the
  acceptance and the done bar). It states boundaries, never code; it references
  the epic, its ICE, and the lenses rather than copying them; and it stays within
  a tight readable bound (about one to two pages). It is the build's north star
  and the thing the human approves — tight for two reasons: it must guarantee the
  requirement is met, and it must keep the build's context controlled.
- C17 — Each builder and test-author works from its own plan piece, that piece's
  dependencies, and the spec — never the whole plan, sibling pieces, or free
  repository roam. The piece is the working box; scoping context to it is what
  keeps a long autonomous build faithful and its token and context cost bounded.
- C18 — The play may generate temporary, single-use implementation skills at
  runtime to author per-language build prompts, and removes them when the run
  ends. These are a context-optimization device — the model authors the
  implementation prompt better than a fixed one — never durable components, and
  they never widen the box beyond the spec.

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
- F12 — The autonomous build starts without an explicit, recorded human approval
  of the spec on the initial build — the run began unaligned, the one human
  checkpoint skipped.
- F13 — A builder or test-author is handed context beyond its piece — the whole
  plan, sibling pieces, or free repository roam — bloating the build's context
  and inviting drift from the piece it was meant to deliver.
- F14 — The approved spec fails its job as a boundary document: it copies code,
  balloons past the readable bound, or omits a boundary the build needs — a rule,
  pattern, design decision, or configuration like a port — so the alignment it
  was meant to carry is false.

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
- S7 — (developer, the approval gate) Given a built and validated spec, when the
  initial build is about to run, then the human is always presented the spec and
  the build does not start until they approve it. Measure: on the initial build
  no build piece is dispatched before a recorded human approval; the spec is
  ICE-shaped (Intent/Context/Expectation) and within the readable bound; every
  initial-build run carries an approval record; a fix round carries none and is
  not gated.
- S8 — (developer, tight autonomous build) Given the approved spec, when the
  build runs unattended, then each piece is built from its own piece, its
  dependencies, and the spec — never the whole plan — and progress is on disk so
  the run is pausable and resumable. Measure: no builder or test-author contract
  carries the full plan, a sibling piece, or a free-repo directive; every
  builder contract carries the piece, its dependencies, and the spec; the run
  completes from approval to done with no further human input; any temporary
  implementation skill created is removed by run end.

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
- REC12 (F12) — trigger: a build piece is about to dispatch on the initial build
  with no recorded human approval of the spec. direction: hold all build work,
  present the spec, and dispatch nothing until the human approves; the approval
  is recorded as the gate the run passed through. handoff: human.
- REC13 (F13) — trigger: a builder or test-author contract carries context
  beyond its piece — the whole plan, a sibling piece, or a free-repo directive.
  direction: rebuild the contract to carry only the piece, its dependencies, and
  the spec, and re-dispatch. handoff: autonomous.
- REC14 (F14) — trigger: the spec copies code, exceeds the readable bound, or
  omits a boundary the build needs. direction: re-author it as a crisp ICE
  boundary document — trim code to references, cut to the bound, and add the
  missing rule, pattern, design, or config — then return it to the human for
  approval before building. handoff: human.
