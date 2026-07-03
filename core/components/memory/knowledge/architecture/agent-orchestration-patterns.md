---
id: architecture/agent-orchestration-patterns
title: "Agent orchestration patterns: from single agent to multi-agent, and when each fits"
conditions:
  is_agent: true
  surface: agentic-feature
  stage: any
evolve_when: []
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Agent orchestration patterns: from single agent to multi-agent, and when each fits

## Topic
How the agent's control loop is shaped — the orchestration pattern. Start simple; add
structure only when the task genuinely needs it. Most "multi-agent" systems should have been
one well-prompted agent with good tools.

## Conditions
Any `is_agent: true` slice. The right pattern is set by task complexity, not ambition.

## Recommendation
Climb this ladder only as far as the task forces you:

- **Single prompt (no loop).** One model call, no tools. For pure generation/transform. Not
  really an agent — don't add a loop it doesn't need.
- **Tool-using agent (the default agent).** One agent in a reason → call-tool → observe loop
  until done. Covers the large majority of real agentic features. Exhaust this before
  anything fancier.
- **Router / dispatcher.** A lightweight classifier routes each request to the right
  specialized handler/agent. Use when inputs fall into distinct, known kinds.
- **Sequential pipeline.** Fixed stages, each a focused agent/step, output → next input. Use
  when the work has genuine ordered phases (extract → analyze → draft → check).
- **Supervisor + workers (multi-agent).** A supervisor decomposes a task and delegates to
  specialized worker agents, then synthesizes. Use only for genuinely broad/parallel work
  where one context can't hold it all — it costs latency, tokens, and a lot of failure
  surface.
- **Reflection / critique loop.** The agent (or a second "critic") reviews and revises its
  own output before returning. Use when quality matters more than latency and a cheap check
  catches real errors.

Default to the lowest rung that works. Add a rung only with evidence the simpler one fails.

## Rationale
The empirical pattern across agent projects: complexity added for elegance, not need, is the
main source of fragility — more agents means more places to drift, more cost, more
non-determinism, harder debugging. A well-prompted tool-using agent with good tools and
retrieval beats a multi-agent maze for most tasks. Multi-agent earns its keep only when the
work is genuinely too broad or parallel for one context. Reflection is the cheapest quality
win when you can afford the extra turn.

## Evolve when
A single tool-using agent starts missing because the task is too broad, spans clearly
separable specialties, or needs parallelism → introduce a router, a pipeline, or a
supervisor — the smallest step that closes the specific gap.

## Provenance
seeded (Kapil + assistant, #434).
