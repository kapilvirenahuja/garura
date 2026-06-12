# launch — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given an **epic** /validate stamped `validated`, land it on a **human's evidenced
acceptance**: bring the increment up live on the slice's run-lens dev/QA tier, build the
HITL testing scenarios from the epic's user_check and acceptance criteria — each telling
the human what to run and what to test — walk the human through them one at a time
recording their typed verdict on every scenario, and only a complete, recorded sign-off
releases the close chain that merges the epic. The epic is then delivered and deleted,
and production rollout follows from main. An agent never signs for the human.

/launch is the HITL gate of the execute pipeline (implement → validate → launch) — "this
HITL is critical". Agents build, agents verify hard, the HUMAN accepts the running
product, then it lands. A rejected scenario is a launch defect: reported on the epic's
tracked issue (the project-tracking connection every epic defect honors) and routed back
through the fix loop — the epic stamped `fix_required` with the report as /implement's
exact work list, the same seam /validate uses.

Pipeline position: **end**. /launch is the CLOSER of the execute pipeline: it runs on the
epic branch the pipeline already carries, and after the evidenced sign-off the D2 rule's
end sequence (commit-change → propose-change → review-change → merge-change) lands the
work. After the merge, the epic schema's /merge fill executes: status → delivered, then
the epic record is deleted. (#434, decisions 20 + 24)

### Constraints

- C1 — Runs only on an epic stamped `validated`, on its issue branch. Hard halt
  otherwise — validate's stamp is the gate.
- C2 — The live environment is the dev or QA tier from the slice's run lens — the early
  tiers, nothing further ahead. Launch deploys what the lens declares for that tier; it
  never invents infrastructure and never touches anything beyond dev/QA.
- C3 — Launch builds the HITL testing scenarios from the epic's user_check and
  acceptance criteria: each scenario tells the human what to run (concrete steps on the
  deployed environment) and what to test (what they should see if it works). Every
  scenario traces to the epic's box; every acceptance criterion gets a scenario.
- C4 — Scenarios are presented to the human one at a time — run this, check this — and
  the play expects an answer before moving on: the typed response recorded verbatim. An
  agent never answers for the human, paraphrases hesitation into a pass, or skips an
  unanswered scenario.
- C5 — The close chain runs only after a recorded sign-off with every scenario accepted.
  Any rejected or unanswered scenario blocks the close — the epic stays open.
- C6 — A rejected scenario becomes a defect report posted to the epic's tracked issue
  through the project-tracking orchestrator role — the connection every epic defect
  honors — and routes back through the fix loop: the epic stamped `fix_required` with
  the report as the work list, and launch halts unclosed.
- C7 — After the merge lands, the epic schema's /merge fill executes: status →
  `delivered`, then the epic record is deleted. Never before the merge.
- C8 — Launch never performs the production rollout itself — prod follows from main via
  the run lens's CD path. Launch records the handoff, nothing more.
- C9 — Evidence persists: the deploy record, the scenario set, every typed response,
  the sign-off, and the defect report when there is one (config-gated like every play's
  evidence).

### Failure conditions

- F1 — Launch ran on an epic without the `validated` stamp.
- F2 — The close chain ran without a complete recorded sign-off, or with a rejected
  scenario in it.
- F3 — A sign-off record carries agent-authored or paraphrased acceptance — forged
  evidence.
- F4 — A scenario traces to nothing in user_check or acceptance — invented scope — or
  an acceptance criterion has no scenario covering it.
- F5 — The deploy target wasn't drawn from the run lens's dev/QA tier, or anything
  beyond dev/QA was touched.
- F6 — A rejected scenario was dropped or smoothed over instead of becoming the defect
  report on the tracked issue.
- F7 — The epic was deleted before the merge, or left undeleted after it.
- F8 — Launch executed a production rollout itself.

## Expectation

### Success scenarios

- S1 — (product owner, happy launch) Given a validated epic, when the increment comes
  up on the run lens's dev/QA tier and the human accepts every scenario, then the close
  chain merges the epic and it ends delivered and deleted, with production following
  from main. Measure: the sign-off record holds every scenario with a verbatim typed
  response, all accepted; the close-chain evidence exists; the deploy record cites the
  lens tier; the epic record is gone after merge with delivered recorded in evidence.
- S2 — (product owner, rejection) Given a scenario the human rejects, then a defect
  report lands on the epic's tracked issue via the project-tracking role, the epic is
  stamped `fix_required`, and the close chain never runs. Measure: the issue carries
  the report comment; epic status reads `fix_required`; zero end-sequence evidence
  exists.
- S3 — (auditor, no forged evidence) Given the sign-off record, then every result is
  the human's typed answer, recorded verbatim alongside what was shown. Measure: the
  record validator passes; any scenario missing the human's own text fails it.
- S4 — (delivery lead, coverage) Given the epic's user_check and acceptance criteria,
  then every criterion maps to at least one scenario and every scenario traces back to
  the box. Measure: the coverage check reports zero unmapped in both directions.
- S5 — (operator, safe environment) Given the deploy, then only the run lens's dev/QA
  tier was touched. Measure: the deploy record's target matches the lens's declared
  tier; no further-ahead target appears anywhere in the run.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the epic is not stamped `validated`. direction: halt; /validate
  must accept first. handoff: human.
- REC2 (F2) — trigger: the close chain attempted with unanswered or rejected scenarios.
  direction: block the chain; return to the open scenarios. handoff: autonomous.
- REC3 (F3) — trigger: a result not in the human's own typed words. direction: strip
  it, re-present the scenario, record only the typed answer. handoff: human.
- REC4 (F4) — trigger: a scenario maps to nothing, or a criterion has no scenario.
  direction: rebuild the scenario set from the epic's fields. handoff: autonomous.
- REC5 (F5) — trigger: a deploy target beyond dev/QA or not from the lens. direction:
  tear down; redeploy per the lens's dev/QA tier. handoff: autonomous.
- REC6 (F6) — trigger: a rejection smoothed over or dropped. direction: build the
  defect report, post it through the project-tracking role, stamp `fix_required`.
  handoff: autonomous.
- REC7 (F7) — trigger: the epic deleted before merge, or still present after.
  direction: restore from the snapshot, or execute the delivered+delete fill — merge
  always first. handoff: autonomous.
- REC8 (F8) — trigger: a production rollout attempted. direction: stop it; record the
  handoff — prod belongs to CD from main. handoff: autonomous.
