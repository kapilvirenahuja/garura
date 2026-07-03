# validate — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given an **epic** that /implement has built to "specs passing, awaiting validation",
independently verify it **agent-side** — exercise the slice's quality gates in anger, run
code-level security and quality scans, and check that nothing already delivered broke — and
end in an unambiguous verdict: stamp the epic clear for /launch, or block it with a fix
report so precise that /implement can fix exactly what's named, nothing more.

The operating principle: agents are good at FIXING things, so this play's whole value is
FINDING what is not working with total clarity. Implement ↔ validate is expected to run a
few rounds; the loop is affordable only because every finding is mechanically cited (the
failing check, the rule that fired, where) and the re-verification scope narrows per round.
Green is the entry condition, never the verdict: results are compared against the
benchmarks the product profile declares — all tests passing with coverage below the
profile's floor is a reject.

Validate is the deep agent-side gate of the **execute** pipeline (implement → validate →
launch). Agents build, validate verifies hard, the human accepts the running product at
/launch. Validate may compile, run, or deploy the product when a check needs a running
system — but deploying for human acceptance is /launch's, never this play's.

Pipeline position: **none**. /validate is the MIDDLE play of the execute pipeline: it
expects to run on the epic branch /implement already started (one issue per epic), injects
no head and no close, stops after the verdict is stamped and reported, and leaves the
branch as-is — /launch carries the close chain after human sign-off. Its one durable model
write is the surgical epic stamp. (#434, decisions 20 + 24)

### Constraints

- C1 — Runs only on an epic implement completed: the epic is in delivery and implement's
  done verdict (every piece done, gates passing, steelman PASS) is present. Hard halt
  otherwise.
- C2 — Verification is independent of the builder: validate re-runs or independently
  captures every check; it never trusts the builder's self-reported results, and it never
  edits product code.
- C3 — Every finding cites its mechanical source — the failing test id, the scan rule, the
  gate that didn't pass, and where it fired — captured to disk. No finding may rest on
  uncited inference.
- C4 — Deterministic checks run as scripts capturing results to files; the judging agent
  only infers over captured results, never runs the mechanics.
- C5 — Security verification is code-level only: static analysis, linting, dependency
  scanning. No penetration-style probing of running systems.
- C6 — Blast-radius scope is drawn from recorded change claims, never invented — round 1
  from implement's build claims, later rounds from the fix made against the previous
  validate report; prior delivered behavior inside that scope is re-verified as baseline
  regression.
- C7 — Validate may compile, run, or deploy the product only to test it. Deploying for
  human acceptance belongs to /launch.
- C8 — The verdict is binary and stamped on the epic: pass → `validated` (the precondition
  /launch requires); fail → `fix_required` (blocks /launch, re-admits /implement). The
  stamp write is surgical — status plus metadata, nothing else in the product model.
- C9 — Remediation routes back to /implement through the fix report; the re-entry is
  lightweight — implement fixes what the report names, no full re-plan, no fresh workspace.
- C10 — Loop cap: after 3 rejections on the same epic, halt to a human instead of looping
  again.
- C11 — The slice's quality-lens gates are checked independently here, against the product
  profile's benchmarks where the profile declares them — the lens declares the gates,
  validate verifies them; a declared benchmark with no captured measurement is a finding.
- C12 — Scan and check choices ground in KB learnings; anything uncovered is recorded as a
  KB gap, never silently chosen.
- C13 — Validate runs the runnable check the surface contract maps to the epic's declared
  `surface.type` (`surface-contract.md`): a real browser check that opens each `must_open`
  artifact and observes it render for `web_dashboard`; an HTTP/API check that calls the
  declared endpoint and asserts the response for `server_api`; a command run of
  `human_run_target` for `cli`; the library's/service's own tests for `library` /
  `service_read_model`. The check plan is incomplete unless it includes the surface-mapped
  check for a required surface, and the captured surface result must match the declared
  type. A required surface the run did not measure is `fix_required`, never `validated` —
  "no browser/API probes available" does not waive the check the surface requires, it fails
  it.

### Failure conditions

- F1 — Validate ran on an epic implement hadn't completed.
- F2 — A finding lacks its mechanical citation.
- F3 — The verdict contradicts the evidence — a pass stamped while any captured check
  failed or any declared benchmark went unmeasured.
- F4 — Validate edited product code or fixed something itself.
- F5 — An agent ran mechanics a script owns, or judged without captured results.
- F6 — A failed run left no `fix_required` stamp — /launch isn't actually blocked.
- F7 — The fix report names symptoms without the failing check and location — implement
  can't act on it directly.
- F8 — Blast-radius scope was invented instead of drawn from recorded change claims.
- F9 — Security checking went beyond code-level into probing live systems.
- F10 — The loop cap passed without human escalation.
- F11 — The epic record was touched beyond the surgical stamp.
- F12 — A scan or check choice was made with no KB grounding and no recorded gap.
- F13 — Validate stamped `validated` without measuring the epic's required surface — a
  browser/API/CLI promise passed on code-level checks alone (the surface-mapped check was
  never planned, never ran, or the captured surface result did not match the declared
  `surface.type`).

## Expectation

### Success scenarios

- S1 — (delivery lead, happy path) Given an epic implement finished, when /validate runs
  and every check passes, then the epic is stamped `validated` and /launch is unblocked.
  Measure: epic status equals `validated`; the verdict record exists, cites every captured
  check result, and carries zero findings.
- S2 — (implementer, the fix loop) Given a run where checks fail, then the epic is stamped
  `fix_required` and the fix report names each failure by its check and location;
  implement fixes exactly those items and the re-run passes. Measure: every report entry
  carries a check id plus location; the re-run flips the stamp to `validated`; total
  rounds ≤ 3.
- S3 — (security auditor) Given the security pass, then all findings trace to a
  static-analysis, lint, or dependency-scan rule on captured output, with no live-system
  probing, and every scan choice is KB-grounded or recorded as a gap. Measure: scan result
  files exist with rule ids per finding; no probe artifacts beyond code-level; zero
  ungrounded choices without a gap record.
- S4 — (product owner, nothing already shipped broke) Given prior delivered behavior, then
  its checks inside the recorded blast-radius scope re-ran as baseline regression, and any
  break is a cited finding. Measure: the regression results name their source scope from
  recorded change claims; each regression failure carries its check id.
- S5 — (human, escalation) Given three rejections on the same epic, then the loop halts
  and a human receives the full round history instead of a fourth round. Measure: after
  the third fail no further automated round exists; the escalation record lists each
  round's findings and fixes.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: implement's done verdict missing or incomplete at pre-flight.
  direction: halt; the epic must finish /implement first. handoff: human.
- REC2 (F2) — trigger: a finding has no mechanical citation. direction: rebuild the
  finding from captured results; re-run its check if needed; drop what cannot be cited.
  handoff: autonomous.
- REC3 (F3) — trigger: the verdict contradicts captured evidence. direction: recompute the
  verdict mechanically from the result files — never hand-stamp. handoff: autonomous.
- REC4 (F4) — trigger: validate edited product code. direction: revert the edit; record it
  as a finding routed to implement. handoff: autonomous.
- REC5 (F5) — trigger: an agent ran mechanics or judged without captured results.
  direction: re-dispatch with the script doing the work; the agent re-judges over its
  output. handoff: autonomous.
- REC6 (F6) — trigger: a failed run carries no `fix_required` stamp. direction: apply the
  stamp via the surgical writer before close. handoff: autonomous.
- REC7 (F7) — trigger: a fix report too vague to act on. direction: regenerate entries
  with check id + location from captured results. handoff: autonomous.
- REC8 (F8) — trigger: blast scope not drawn from recorded change claims. direction:
  rebuild the scope from the recorded claims; re-run regression on it. handoff:
  autonomous.
- REC9 (F9) — trigger: probing beyond code-level. direction: discard those results; re-run
  the security pass code-level only. handoff: autonomous.
- REC10 (F10) — trigger: the cap reached without escalation. direction: stop the loop;
  produce the escalation record with round history. handoff: human.
- REC11 (F11) — trigger: the epic record touched beyond the stamp. direction: restore the
  record and re-apply only the surgical stamp. handoff: autonomous.
- REC12 (F12) — trigger: an ungrounded scan choice with no gap recorded. direction: run
  the KB search; if still uncovered, record the gap proposal, then proceed. handoff:
  autonomous.
- REC13 (F13) — trigger: the required surface check for the epic's `surface.type` was not
  run, or the captured surface result does not match the declared type. direction: stamp
  `fix_required` naming the unmeasured or mismatched surface (the `surface.type` and the
  `must_open`/`human_run_target` it owed), and re-admit /implement to restore the surface so
  the next round can measure it. handoff: autonomous.
