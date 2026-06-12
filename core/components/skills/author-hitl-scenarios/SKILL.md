---
name: author-hitl-scenarios
description: Build /launch's HITL testing scenarios for one EPIC — the manual walk the human runs on the deployed dev/QA environment before anything lands. Reads the epic record (user_check + acceptance criteria + context) and the deploy record (where the increment is reachable), and writes scenarios.yaml — one scenario per testable claim, each telling the human WHAT TO RUN (concrete numbered steps on the deployed environment, starting from its real address) and WHAT TO TEST (what they should see if it works), with a `covers` list tracing every scenario to an acceptance index or the user_check. Both directions must close: every acceptance criterion gets a scenario, every scenario traces to the box — nothing invented, nothing untested. Draft only — the play presents the scenarios one at a time and records the human's typed answers; this skill never presents, never answers, never signs. The scenario-authoring work for the /launch play.
version: 0.1.0
user-invocable: false
model: best
allowed-tools: Read, Write, Glob
---

# author-hitl-scenarios

Turns one validated epic into the **HITL testing scenarios** — the human's manual walk
of the running product. Agents built it and verified it hard; this is the script for the
human to ACCEPT it. The scenarios must be runnable by a person who did not build the
thing: concrete steps from the deployed environment's front door, and an observable
check per scenario.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `epic_file` | yes | The epic record (read-only) — user_check, acceptance, context. |
| `deploy_record` | yes | stand-up-launch-env's record — the reachable address, tier, any test credentials. |
| `out_scenarios` | yes | Where to write `scenarios.yaml`. |

## Procedure

1. **Read the box.** The epic's `user_check` (the open/do/verify line /grill cut the
   epic at), every `acceptance` criterion, and `context` (personas, systems, scope).
   Read the deploy record for the real address the steps start from.

2. **Author one scenario per testable claim.** The user_check always gets a scenario;
   each acceptance criterion gets at least one. Merge only when two criteria are
   genuinely one walk (the `covers` list carries both). Each scenario:

   ```yaml
   scenarios:
     - id: hitl-1
       title: "Account locks after five failed logins"
       covers: [user_check, 0]      # acceptance indexes and/or the literal user_check
       run:                          # WHAT TO RUN — concrete, numbered, from the front door
         - "Open {deploy address}/login"
         - "Enter user demo@x.test with a wrong password, five times"
       check: "The sixth attempt shows the lockout message and no login is possible for 15 minutes"   # WHAT TO TEST
   ```

3. **Write steps for a human, not an agent.** Real URLs from the deploy record, real
   test data (from the epic's context or the deploy record's seeded credentials),
   observable outcomes — never "verify the API returns 200" when the human is on a
   screen; say what the screen shows.

## Boundaries

### NEVER
- Invent a scenario no epic field grounds — every scenario's `covers` traces to an
  acceptance index or the user_check (the coverage gate fails otherwise).
- Leave an acceptance criterion uncovered — both directions close.
- Present scenarios, record answers, or mark results — the PLAY runs the human loop;
  the sign-off record is the human's, never this skill's (#436).
- Touch the epic record, the model, or the environment — read epic + deploy record,
  write scenarios.yaml, nothing else.

### ALWAYS
- Start run steps from the deploy record's real address.
- Make every `check` observable by a person (what they see, not what the system does
  internally).
- Return the scenarios path, not the contents.
