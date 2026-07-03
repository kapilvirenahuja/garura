---
id: technology/agent-building-blocks
title: "Agent building blocks: the seven parts you assemble"
conditions:
  is_agent: true
  surface: agentic-feature
  stage: any
evolve_when:
  - architecture/agent-orchestration-patterns
  - technology/agent-model-selection
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Agent building blocks: the seven parts you assemble

## Topic
What an LLM agent is actually made of. Before choosing an orchestration pattern or a
platform, an agent is the assembly of a small, fixed set of parts. Naming them makes the
agentic lens concrete instead of hand-wavy.

## Conditions
Any slice the agentic lens marks `is_agent: true` — a feature that offloads cognitive,
creative, or logistical load onto an LLM that takes actions, not just answers.

## Recommendation
Assemble an agent from these seven parts; each is a deliberate choice:

1. **Model** — the reasoning engine. Picked per task, not one-size-fits-all (see
   `technology/agent-model-selection`).
2. **System prompt / role** — the instructions, persona, and policy that frame every turn.
   The cheapest, highest-leverage control surface; version it.
3. **Tools** — the functions the agent can call to act or fetch (function-calling). Each
   tool is an action surface, so each is scoped least-privilege (see
   `architecture/agentic-guardrails-baseline`).
4. **Memory / state** — short-term (the conversation/working context) and, when needed,
   long-term (durable facts across sessions). Keep it minimal; memory is also a leak/poison
   surface.
5. **Retrieval / context** — how the agent pulls in the right knowledge at the right time
   (RAG, search, structured lookups). The grounding that keeps it factual.
6. **Orchestrator** — the control loop that decides the next step: call a tool, reason
   again, hand off, or stop. The orchestration *pattern* is its own choice
   (`architecture/agent-orchestration-patterns`).
7. **Guardrails + eval/observability** — the safety layer (input/output validation, limits,
   kill switch) and the measurement layer (traces, eval suites). Not optional; an agent you
   can't observe is one you can't trust or improve.

## Rationale
Teams that struggle with agents usually skipped a part — no eval (can't tell if a change
helped), no scoped tools (one prompt-injection away from damage), or memory bolted on
without a leak story. Treating the agent as these seven explicit parts turns "build an
agent" into seven reviewable decisions, and maps cleanly onto what Bedrock and Vertex
provide out of the box (see `technology/agent-platform-bedrock-gcp`).

## Evolve when
Once the parts are chosen, the next decisions are how they're wired (orchestration pattern)
and which model goes where. See `architecture/agent-orchestration-patterns` and
`technology/agent-model-selection`.

## Provenance
seeded (Kapil + assistant, #434).
