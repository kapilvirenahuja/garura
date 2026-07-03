# launch — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given an **epic** /validate stamped `validated`, land it on a **human's evidenced
acceptance**: bring the increment up live on the slice's **local environment** (the
`local` environment declared in the run lens's `run.yaml`), build the
HITL testing scenarios from the epic's user_check and acceptance criteria — each telling
the human what to run and what to test — walk the human through them one at a time
recording their typed verdict on every scenario, and only a complete, recorded sign-off
releases the close chain that merges the epic. The epic is then stamped `delivered` and
KEPT in place as the as-delivered record (never deleted), and production rollout follows
from main. An agent never signs for the human.

/launch is the HITL gate of the execute pipeline (implement → validate → launch) — "this
HITL is critical". Agents build, agents verify hard, the HUMAN accepts the running
product, then it lands. A rejected scenario is a launch defect: reported on the epic's
tracked issue (the project-tracking connection every epic defect honors) and routed back
through the fix loop — the epic stamped `fix_required` with the report as /implement's
exact work list, the same seam /validate uses.

Pipeline position: **end**. /launch is the CLOSER of the execute pipeline: it runs on the
epic branch the pipeline already carries, and after the evidenced sign-off the D2 rule's
end sequence (commit-change → propose-change → review-change → merge-change) lands the
work. After the merge, the epic schema's /merge fill executes: status → delivered, and
the epic record is KEPT in place as the as-delivered record — never deleted. (#434,
decisions 20 + 24; ADR 019, #439)

### Constraints

- C1 — Runs only on an epic stamped `validated`, on its issue branch. Hard halt
  otherwise — validate's stamp is the gate.
- C2 — The live environment is the **local environment** declared in the slice's run
  lens (`run.yaml`, type `local`, tier 0). Launch brings the increment up on that local
  environment exactly as the lens declares it; it never invents infrastructure and never
  stands up a cloud environment (dev/qa/stage/prod — those belong to /deploy and CD).
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
  `delivered`; the epic record is KEPT in place as the as-delivered record. The epic is
  never stamped `delivered` before the merge, and is never deleted.
- C8 — Launch never performs the production rollout itself — prod follows from main via
  the run lens's CD path. Launch records the handoff, nothing more.
- C9 — Evidence persists: the deploy record, the scenario set, every typed response,
  the sign-off, and the defect report when there is one (config-gated like every play's
  evidence).
- C10 — The deploy record's reachable target must match the epic's declared
  `surface.type` per `surface-contract.md`, checked before the human is asked to accept
  anything. A `web_dashboard` or `server_api` surface needs a real reachable target — a
  local URL, a preview URL, or the declared server endpoint; a local command
  (`python3 ...`) or a JSON-artifact path satisfies only `cli`. A deploy target whose
  shape can't satisfy the declared surface is REJECTED before HITL, never stood up for the
  human to sign off on.
- C11 — Every HITL scenario preserves the user verb of the `must_open` artifact it covers
  per `surface-contract.md`: "open the Formula reference" is covered by a scenario that
  opens it, never by one that runs `python3 -m unittest`. A scenario whose verb does not
  match the surface is a semantic mismatch and is rejected before the walk — the scenario
  set is rebuilt to preserve the surface's verbs.

### Failure conditions

- F1 — Launch ran on an epic without the `validated` stamp.
- F2 — The close chain ran without a complete recorded sign-off, or with a rejected
  scenario in it.
- F3 — A sign-off record carries agent-authored or paraphrased acceptance — forged
  evidence.
- F4 — A scenario traces to nothing in user_check or acceptance — invented scope — or
  an acceptance criterion has no scenario covering it.
- F5 — The increment was brought up on an environment other than the declared local one
  — a cloud environment (dev/qa/stage/prod) was stood up or touched.
- F6 — A rejected scenario was dropped or smoothed over instead of becoming the defect
  report on the tracked issue.
- F7 — The epic was stamped `delivered` before the merge landed, was not stamped
  `delivered` after it, or was deleted at all.
- F8 — Launch executed a production rollout itself.
- F9 — Launch accepted a deploy target that doesn't match the epic's surface — a local
  command or a JSON-artifact path stood in for an openable dashboard or callable API — and
  asked the human to accept it instead of rejecting it before HITL.
- F10 — A HITL scenario covered a `must_open` artifact with the wrong user verb — a
  unit-test run stood in for an "open" check — and the walk presented it anyway instead of
  rejecting the verb mismatch before the human ever saw it.

## Expectation

### Success scenarios

- S1 — (product owner, happy launch) Given a validated epic, when the increment comes
  up on the slice's local environment and the human accepts every scenario, then the close
  chain merges the epic and it ends delivered and kept, with production following
  from main. Measure: the sign-off record holds every scenario with a verbatim typed
  response, all accepted; the close-chain evidence exists; the deploy record cites the
  local environment; the epic record is present after merge reading `delivered`, with
  delivered also recorded in evidence.
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
- S5 — (operator, safe environment) Given the deploy, then only the declared local
  environment was touched. Measure: the deploy record's environment matches the lens's
  declared local environment; no cloud-tier target appears anywhere in the run.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the epic is not stamped `validated`. direction: halt; /validate
  must accept first. handoff: human.
- REC2 (F2) — trigger: the close chain attempted with unanswered or rejected scenarios.
  direction: block the chain; return to the open scenarios. handoff: autonomous.
- REC3 (F3) — trigger: a result not in the human's own typed words. direction: strip
  it, re-present the scenario, record only the typed answer. handoff: human.
- REC4 (F4) — trigger: a scenario maps to nothing, or a criterion has no scenario.
  direction: rebuild the scenario set from the epic's fields. handoff: autonomous.
- REC5 (F5) — trigger: an environment other than the declared local one was brought up
  (a cloud environment). direction: tear down; bring up only the declared local
  environment. handoff: autonomous.
- REC6 (F6) — trigger: a rejection smoothed over or dropped. direction: build the
  defect report, post it through the project-tracking role, stamp `fix_required`.
  handoff: autonomous.
- REC7 (F7) — trigger: the epic deleted at all, stamped `delivered` before merge, or not
  stamped `delivered` after it. direction: restore the epic from git if it was deleted;
  execute the delivered stamp — merge always first. handoff: autonomous.
- REC8 (F8) — trigger: a production rollout attempted. direction: stop it; record the
  handoff — prod belongs to CD from main. handoff: autonomous.
- REC9 (F9) — trigger: the deploy record's reachable target shape doesn't satisfy the
  epic's `surface.type` — a local command or JSON-artifact path standing in for a
  web_dashboard/server_api surface. direction: reject before HITL; require a real reachable
  target for the declared surface (a local/preview URL or the declared endpoint), redeploy
  per the run lens, and re-check the shape before any scenario is shown. handoff: human.
- REC10 (F10) — trigger: a HITL scenario's verb doesn't preserve the `must_open`
  artifact's user verb — a unit-test run covering an "open" check. direction: reject before
  the walk; rebuild the scenario set so each scenario preserves the surface's verb for the
  artifact it covers, then re-run the coverage and verb gate. handoff: autonomous.
