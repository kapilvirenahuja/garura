---
name: stand-up-launch-env
description: Bring one epic's increment up LIVE on the slice's run-lens dev/QA tier so a human can walk it — the deploy half of /launch's HITL gate. Reads the run lens for the declared early-tier target (a local dev server, docker compose, or a cloud dev environment — whatever the lens says) and the repository, brings the increment up there, verifies it is actually reachable, and writes a deploy record: tier, target, the reachable address, any seeded test credentials, and how to tear it down. NEVER goes further than dev/QA — no uat, no staging, no production; the lens's later tiers belong to CD from main. Tears the environment down when asked (the reverse contract). Live-system work — this is the worker skill the env-operator agent dispatches; scripts assert over its record afterwards. Use from /launch only.
version: 0.1.0
user-invocable: false
model: best
allowed-tools: Read, Write, Bash, Glob, Grep
---

# stand-up-launch-env

The increment is built and validated; now it has to be RUNNING somewhere a human can
reach. This skill stands it up on the run lens's earliest declared tier — and nothing
further ahead — then proves it is reachable before reporting done.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `run_lens` | yes | The slice's run lens (read-only) — environments/targets, the dev/QA tier's declared shape. |
| `tier` | yes | The tier the eligibility gate resolved (dev/qa/test/preview) — deploy THIS, nothing else. |
| `repo_root` | yes | The product repository root, on the epic branch. |
| `mode` | yes | `up` or `down` (teardown of a record this skill produced). |
| `deploy_record` | yes | Where to write (or read, for `down`) the record. |

## Procedure (`up`)

1. **Read the lens's declared target for the tier.** The lens names what dev/QA is for
   this product — a local command (`npm run dev`, compose), or a cloud dev target with
   its deploy command. The lens is the only source; never invent infrastructure.
2. **Bring it up.** Run the declared path: build if it needs building, start/deploy,
   seed test data when the lens or repo declares a seed step.
3. **Prove it is reachable.** Hit the address (health endpoint or front page) and
   capture the evidence — a deploy that cannot be reached is a failure, not a record.
4. **Write the deploy record:**

   ```yaml
   deploy:
     tier: dev
     target: "docker compose -f compose.dev.yaml up -d"   # what the lens declared
     address: "http://localhost:3000"                      # where the human goes
     reachable: true
     evidence: "GET / -> 200 at 2026-06-12T..."
     credentials: {user: "demo@x.test", note: "seeded test user"}   # when seeded
     teardown: "docker compose -f compose.dev.yaml down"
   ```

## Procedure (`down`)

Read the record, run its `teardown`, confirm the address no longer answers, append
`torn_down: true` to the record.

## Boundaries

### NEVER
- Deploy to, modify, or even probe any tier beyond dev/QA — no uat, staging, or
  production target may appear in any command or record (prod follows from main via
  the lens's CD, never from this skill).
- Invent infrastructure the lens does not declare.
- Report done without reachability evidence.
- Touch the product model or the epic record.
- Leave secrets in the record — credentials only for seeded TEST users.

### ALWAYS
- Deploy exactly the resolved `tier`.
- Record the teardown path with the deploy.
- Return the record path, not the contents.
