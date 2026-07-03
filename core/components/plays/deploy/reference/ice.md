# deploy — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-editor; never hand-edit the compiled SKILL.md.

## Intent

Take a **delivered increment** — a validated epic already merged to main — and deploy it to a named
**cloud environment**, defaulting to the **lowest cloud tier defined** in the slice's run lens (dev).
Run exactly what that environment's `run.yaml` declares — provider, region, compute, services,
networking, and the deploy command — then prove the increment actually came up healthy with an
**independent** reachability check, and record the deploy as evidence. `/deploy` is on-demand and
lightweight: it changes nothing in the product model, and it stops below production — production
rollout stays with CD from main. The `/deploy` command in the ProductOS command model. Use when a
delivered increment needs to run on a cloud environment the run lens already defined.

Pipeline position: **none** (standalone). `/deploy` acts on an already-delivered increment on main; it
opens no issue, cuts no branch, and lands no PR — it deploys and records evidence. It reads the slice's
`run.yaml` and the repository; it never writes the product model. (#434)

### Constraints

- C1 — Deploys exactly what the slice's `run.yaml` cloud environment declares — provider, region,
  compute, services, networking, and the declared deploy command. It never invents infrastructure or
  runs a step the run lens did not declare.
- C2 — Target resolution: defaults to the lowest cloud tier defined in `run.yaml` (dev); the user may
  name a higher cloud tier; **production is out of scope — refuse it outright (halt)**, never silently
  cap at a lower tier.
- C3 — Deploys only a delivered increment — the epic is validated and merged to main. It never deploys
  unvalidated, unmerged, or undelivered work.
- C4 — Never writes the product model (the spine, any lens, ICE, decisions, or the slice/epic record).
  `/deploy` executes only.
- C5 — "Done" only when an **independent** reachability/health check confirms the increment answers in
  the target environment — a real green, not that the deploy command exited 0.
- C6 — Secrets are read from the secrets-manager binding the run lens declares; no secret value is
  printed, logged, or written into the deploy record or the repo.
- C7 — Records a deploy evidence record — the target environment, what ran, the address, and the health
  proof — per the D1 evidence rule.
- C8 — On a failed or unhealthy deploy, the environment is left in its **prior known state** — never
  half-deployed — and the failure is reported. `/deploy` does not attempt an automatic
  rollback-and-redeploy; a human decides the next move.

### Failure conditions

- F1 — `/deploy` deployed to an environment the run lens does not define, or ran a step the run lens did
  not declare.
- F2 — `/deploy` targeted production, or a cloud tier that is out of scope.
- F3 — `/deploy` deployed undelivered, unmerged, or unvalidated code.
- F4 — `/deploy` wrote a product-model file (the spine, a lens, ICE, a decision, or the slice/epic
  record).
- F5 — `/deploy` reported success while the increment is not actually healthy in the target environment
  (a false green).
- F6 — A secret value leaked — printed, logged, written into the deploy record, or committed.
- F7 — A failed deploy left the environment half-deployed rather than in its prior known state.
- F8 — The slice has no run lens, or no cloud environment is defined, and `/deploy` proceeded anyway.

## Expectation

### Success scenarios

- S1 — (devops engineer, default deploy) Given a slice whose `run.yaml` defines a dev cloud environment
  and a delivered increment on main, when `/deploy` runs with no target named, then it resolves dev (the
  lowest cloud tier), deploys exactly what dev declares, an independent health check confirms the
  increment answers, and a deploy evidence record is written. Measure: the resolved target is dev; the
  deploy record shows the declared deploy ran and a green health check with an address; an evidence file
  exists; the product model is byte-identical before and after.
- S2 — (devops engineer, named higher tier) Given dev and stage cloud environments are both defined,
  when `/deploy` runs with target `stage`, then it deploys to stage, not dev. Measure: the deploy
  record's environment is stage.
- S3 — (release manager, production refused) Given `/deploy` is asked to target production, then it
  halts before any deploy — production is out of scope. Measure: `/deploy` exits without deploying; the
  resolver returns the out-of-scope signal; no deploy record for production is written.
- S4 — (security reviewer, no secret leak) Given the target environment declares a secrets-manager
  binding, when `/deploy` runs, then secrets are read from the manager and no secret literal appears in
  the logs, the deploy record, or the repo. Measure: the deploy record and logs carry no secret literal;
  the record names the secrets-manager binding used.
- S5 — (SRE, false green caught) Given the declared deploy command exits 0 but the increment does not
  actually answer, when `/deploy` runs the independent health check, then it reports failed, not done.
  Measure: `/deploy`'s status is failed; "done" is gated on the health check, not the command exit code.
- S6 — (SRE, failed deploy left clean) Given the deploy fails, when `/deploy` stops, then the
  environment is left in its prior state — not half-deployed — the failure is reported, and no automatic
  rollback-and-redeploy is attempted. Measure: the deploy record shows failure and prior-state-left; no
  redeploy attempt is recorded.
- S7 — (product owner, no model write) Given `/deploy` runs to completion, then the product model — the
  spine, the lenses, decisions, and the slice/epic record — is byte-identical before and after. Measure:
  byte-identical.
- S8 — (devops engineer, no cloud environment) Given a slice with no cloud environment defined in
  `run.yaml`, when `/deploy` runs, then it halts — there is nothing to deploy against. Measure: `/deploy`
  exits on the no-cloud-environment signal; no deploy is attempted.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: `/deploy` deployed to, or ran, something the run lens does not declare. direction:
  stop and undo the out-of-scope action; deploy only what the target environment's `run.yaml` declares.
  handoff: autonomous.
- REC2 (F2) — trigger: production or an out-of-scope tier was targeted. direction: halt; production
  rollout is out of scope — it stays with CD from main. handoff: human.
- REC3 (F3) — trigger: the increment is not delivered, merged, or validated. direction: halt; `/deploy`
  deploys only a validated, merged increment — route to /validate or /launch first. handoff: human.
- REC4 (F4) — trigger: a product-model file changed. direction: revert the write; `/deploy` executes
  only and never writes the model. handoff: autonomous.
- REC5 (F5) — trigger: success was reported but the increment is not healthy. direction: mark the deploy
  failed; "done" requires the independent health check to pass. handoff: autonomous.
- REC6 (F6) — trigger: a secret value appeared in the logs, the record, or the repo. direction: strip
  it, read secrets only from the declared secrets-manager binding, and re-verify no secret literal
  remains. handoff: autonomous.
- REC7 (F7) — trigger: a failed deploy left the environment half-deployed. direction: report the partial
  state for a human to resolve; `/deploy` does not auto-rollback. handoff: human.
- REC8 (F8) — trigger: no run lens, or no cloud environment is defined. direction: halt; run `/run` to
  define the cloud environment before `/deploy`. handoff: human.
