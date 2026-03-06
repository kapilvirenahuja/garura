# Agent Audit Checklist (P1-P10)

These principles apply to domain agents that the **compiled recipe** will use at runtime. They do NOT apply to build-time agents like `intent-crafter` or `intent-resolver`.

## Principles

### P1 — JSON Contract Communication
Agent receives a JSON contract with `stm` paths and task-specific context. Agent returns an enriched JSON contract with updated `stm` paths. No prompt-based input/output.

**Pass:** Agent definition shows JSON contract input/output format.
**Fail:** Agent expects prose prompts or returns unstructured text.

### P2 — STM Path Handoff
Components pass file paths from STM to each other — not prompts, not inline data.

**Pass:** Agent reads from and writes to STM file paths specified in contract.
**Fail:** Agent passes data inline in the contract or expects prompt-embedded data.

### P3 — Intent Awareness
Agent receives `intent_path` in its JSON contract and reads intent.yaml to understand constraints, failure conditions, and scenarios. The agent self-selects which constraints are relevant to its task.

**Pass:** Agent reads `intent_path` from contract and applies relevant constraints.
**Fail:** Agent ignores intent or requires constraints to be pre-extracted.

### P4 — Structured Failure Protocol
When blocked, agent returns structured failure per `docs/framework/structured-failure-protocol.md`. Never returns raw errors or unstructured text.

**Pass:** Agent definition includes structured failure return format.
**Fail:** Agent returns error strings or halts without structured output.

### P5 — No Direct User Interaction
Agent never uses `AskUserQuestion`. Returns to caller for user interaction.

**Pass:** No `AskUserQuestion` usage in agent definition.
**Fail:** Agent asks users directly or pauses for input.

### P6 — Output Contract Discipline
Agent returns ONLY the enriched JSON contract. Artifacts go to STM files.

**Pass:** Agent returns JSON contract only. Analysis, data, artifacts are in STM files.
**Fail:** Agent returns prose, tables, or explanations alongside the contract.

### P7 — Skill Delegation for Artifact Production
Agent delegates artifact production to skills when skills exist. Agent = context engineering. Skill = artifact production. If no skill exists, agent may produce directly (note as gap).

**Pass:** Agent invokes skills for artifact production. OR no skill exists and this is documented.
**Fail:** Agent writes artifacts directly when a relevant skill exists.

### P8 — Recovery and Escalation
Agent has self-recovery (max 2 attempts) and structured escalation when blocked.

**Pass:** Agent retries with fix context, escalates after max attempts.
**Fail:** Agent halts on first error or retries indefinitely.

### P9 — Domain Boundaries
Agent stays within its declared domain. Never performs work belonging to another agent's domain.

**Pass:** Agent only does work in its declared domain.
**Fail:** Agent crosses into another agent's domain (e.g., repo agent managing issues).

### P10 — Task Graph Participation
Agent marks tasks as `in_progress` and `completed` via TaskUpdate. Can add new tasks if it discovers additional work.

**Pass:** Agent uses TaskUpdate for status tracking.
**Fail:** Agent completes work without updating task status.

## Audit Report Template

For each agent, produce:

```markdown
## Agent Audit: {agent-name}

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS/FAIL | {what was found} |
| P2 STM Path Handoff | PASS/FAIL | {what was found} |
| P3 Intent Awareness | PASS/FAIL | {what was found} |
| P4 Structured Failure | PASS/FAIL | {what was found} |
| P5 No Direct User Interaction | PASS/FAIL | {what was found} |
| P6 Output Contract Discipline | PASS/FAIL | {what was found} |
| P7 Skill Delegation | PASS/FAIL/N-A | {what was found} |
| P8 Recovery and Escalation | PASS/FAIL | {what was found} |
| P9 Domain Boundaries | PASS/FAIL | {what was found} |
| P10 Task Graph Participation | PASS/FAIL | {what was found} |
```

Write audit report to `{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/agent-audit-{agent-name}.md`.
