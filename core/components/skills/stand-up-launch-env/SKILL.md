---
name: stand-up-launch-env
description: Bring one epic's increment up LIVE on the slice's LOCAL environment so a human can walk it — the deploy half of /launch's HITL gate. Reads the slice's structured run.yaml for the local environment's declared bring-up (its `local.run` command and any seed) and the repository, brings the increment up there, verifies it is actually reachable, and writes a deploy record: environment, target, the reachable address, any seeded test credentials, and how to tear it down. NEVER stands up a cloud environment (dev/qa/stage/prod) — those belong to /deploy and CD from main. Tears the environment down when asked (the reverse contract). Live-system work — this is the worker skill the env-operator agent dispatches; scripts assert over its record afterwards. Use from /launch only.
version: 0.1.0
user-invocable: false
model: best
allowed-tools: Read, Write, Bash, Glob, Grep
---

# stand-up-launch-env

The increment is built and validated; now it has to be RUNNING somewhere a human can
reach. This skill stands it up on the slice's **local environment** — the one /launch
uses — and nothing in the cloud, then proves it is reachable before reporting done.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `run_lens` | yes | The slice's structured `run.yaml` (read-only) — its `environments[]`; read the local environment's `local.run` + seed. |
| `environment` | yes | The environment name the eligibility gate resolved — the local environment (type `local`, tier 0). Stand up THIS, nothing else. |
| `repo_root` | yes | The product repository root, on the epic branch. |
| `mode` | yes | `up` or `down` (teardown of a record this skill produced). |
| `deploy_record` | yes | Where to write (or read, for `down`) the record. |

## Procedure (`up`)

1. **Read the local environment's declared bring-up.** In `run.yaml`, find the named
   environment in `environments[]` (type `local`) and read its `local.run` (the bring-up
   command — `npm run dev`, a compose file, etc.) and any `local.seed`. The lens is the
   only source; never invent infrastructure.
2. **Bring it up.** Run the declared path: build if it needs building, start, and seed
   test data when the local environment declares a seed step.
3. **Prove it is reachable.** Hit the address (health endpoint or front page) and
   capture the evidence — a deploy that cannot be reached is a failure, not a record.
4. **Write the deploy record:**

   ```yaml
   deploy:
     environment: local
     target: "docker compose -f compose.dev.yaml up -d"   # the local env's local.run
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
- Stand up, modify, or even probe a cloud environment (dev/qa/stage/prod) — no cloud
  target may appear in any command or record. Cloud environments belong to /deploy and
  CD from main, never to this skill.
- Invent infrastructure the local environment does not declare.
- Report done without reachability evidence.
- Touch the product model or the epic record.
- Leave secrets in the record — credentials only for seeded TEST users.

### ALWAYS
- Stand up exactly the resolved local `environment`.
- Record the teardown path with the deploy.
- Return the record path, not the contents.
