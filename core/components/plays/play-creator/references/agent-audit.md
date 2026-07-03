# Agent Audit Checklist (P1–P11)

These principles apply to the **domain agents a compiled play will use at runtime**.
They do NOT apply to this skill's own operation, and they do not apply to one-shot
build-time helpers. Utility agents (e.g. a repo/commit helper) are exempt from the
domain-agent budget but must still pass every applicable principle.

A subagent's job is twofold: gather the context the work needs, and verify that what the
skill produced is right. It is the context-and-assurance layer between the play and the
skill — it does not do the building itself.

Audit each agent the play depends on against all 11. Any FAIL is a gap the user should
fix (upgrade the agent), replace (build a compliant one), or consciously accept.

## Principles

### P1 — JSON-contract communication
The agent receives a **JSON contract** — its task plus the file paths to read its inputs
from — and returns a JSON contract with the paths to what it wrote. No prose-prompt input,
no unstructured text output.
- **Pass:** input and output are JSON contracts.
- **Fail:** the agent expects a prose prompt or returns free text.

### P2 — Files on disk, paths in the contract
The real outputs are written to **files on disk**; the contract carries the *paths*, never
the contents. Components hand each other file references, not inline blobs or
prompt-embedded data.
- **Pass:** reads from and writes to the paths named in its contract; outputs live on disk.
- **Fail:** passes payloads inline or expects prompt-embedded data.

### P3 — Intent awareness
The agent is given a pointer to the intent and reads it to understand the constraints
and failure conditions relevant to its task, self-selecting which apply.
- **Pass:** reads the intent and applies the relevant constraints.
- **Fail:** ignores intent, or needs constraints pre-extracted for it.

### P4 — Structured failure
When blocked, the agent returns a structured failure (what failed, which domain owns
it, what's needed) — never a raw error or a silent halt.
- **Pass:** defines a structured failure return.
- **Fail:** returns error strings or halts without structure.

### P5 — No direct user interaction
The agent never asks the user directly. It returns to its caller, and the caller (the
play, or you) handles any human interaction.
- **Pass:** no direct user-questioning in the agent.
- **Fail:** the agent pauses to ask the user.

### P6 — Output discipline
The agent returns only its enriched contract. Artifacts go to files; explanations and
tables do not get returned alongside the contract.
- **Pass:** returns the contract only; artifacts live in files.
- **Fail:** returns prose/tables/analysis with the contract.

### P7 — Skill delegation for artifact production
The agent delegates artifact production to a skill when a suitable one exists (agent =
context engineering; skill = artifact production). If none exists, it may produce
directly, noted as a gap.
- **Pass:** invokes skills for production, or documents that none exists.
- **Fail:** writes artifacts directly when a relevant skill exists.

### P8 — Recovery and escalation
The agent self-recovers with a bounded number of attempts (≈2) and escalates with
structure when still blocked.
- **Pass:** retries with fix context, then escalates.
- **Fail:** halts on first error, or retries forever.

### P9 — Domain boundaries
The agent stays inside its declared domain and never does another agent's job.
- **Pass:** only does work in its domain.
- **Fail:** crosses into another domain (e.g. a repo agent managing issues).

### P10 — Task-graph participation
The agent marks its own task in-progress/completed in the shared task graph, and may
add discovered sub-work — but never edits the play's own top-level tasks.
- **Pass:** updates its task status.
- **Fail:** completes work without touching task status.

### P11 — Context sufficiency
The agent has a real protocol to gather the context its artifacts need: a memory
search, a sufficiency check, and a research fallback when memory is thin — plus the
tools to do that research if its domain needs outside knowledge.
- **Pass:** documented context-loading (memory search → sufficiency check → research
  fallback) and the tools to match.
- **Fail:** asked to produce knowledge-dependent artifacts with no systematic context
  gathering and no research fallback.
- **Exempt:** agents that operate purely on data handed to them via paths (e.g. a
  validator) — their context is fully supplied, so no research fallback is required.
  The test: can it produce its output from the contract alone, or must it discover
  knowledge?

## Audit report shape

For each agent:

```markdown
## Agent Audit: {agent-name}

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 Structured contract     | PASS/FAIL        | … |
| P2 Path handoff            | PASS/FAIL        | … |
| P3 Intent awareness        | PASS/FAIL        | … |
| P4 Structured failure      | PASS/FAIL        | … |
| P5 No direct user interaction | PASS/FAIL     | … |
| P6 Output discipline       | PASS/FAIL        | … |
| P7 Skill delegation        | PASS/FAIL/N-A    | … |
| P8 Recovery & escalation   | PASS/FAIL        | … |
| P9 Domain boundaries       | PASS/FAIL        | … |
| P10 Task-graph participation | PASS/FAIL      | … |
| P11 Context sufficiency    | PASS/FAIL/EXEMPT | … |
```
