---
id: architecture/agent-supervised-autonomous
title: "Supervised autonomous agent: acts inside a fenced sandbox, escalates when unsure"
conditions:
  is_agent: true
  autonomy: high                # the offload weights are high–xhigh
  consequence: low-to-medium    # reversible / bounded blast radius
  stage: earned-after-assistive
evolve_when: []
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Supervised autonomous agent: acts inside a fenced sandbox, escalates when unsure

## Topic
The earned rung above assistive: the agent **acts on its own** within tight, explicit
bounds, and pulls a human in only when it hits the edge of those bounds or its own
confidence. The aim is to remove the human from the routine path while keeping them on the
exceptional one.

## Conditions
`is_agent: true` with high-to-xhigh offload, where actions are **reversible or bounded** in
blast radius, and the assistive rung has proven the agent's judgment (see
`architecture/agent-assistive`). Not for irreversible, high-consequence actions — those stay
assistive or get a hard human gate.

## Recommendation
- **Fence the sandbox.** Allow-listed tools and a scoped boundary (which data, which
  accounts, which operations). Inside the fence the agent acts freely; it cannot reach
  outside it.
- **Dry-run + validate before effecting.** For state-changing actions, produce the intended
  change, validate it against rules, and only then apply — so a bad plan fails closed.
- **Escalate on uncertainty or out-of-bounds.** Low confidence, an ambiguous case, or a
  request to step outside the fence → hand off to a human with the context. This is the
  control that makes autonomy safe.
- **Bound the loop.** Max steps, max retries, max cost/time per run — the agent stops and
  escalates rather than spinning.
- On the agentic lens this reads as high weights with **tight guardrails and a
  confidence/bounds-triggered handoff** (not every-step).

## Rationale
Supervised autonomy is where agents pay off at scale — the routine cases run unattended,
humans handle only the exceptions — but only when the fence and the escalation trigger are
real. The failure mode is autonomy without a tight enough sandbox or a working escalation:
the agent acts confidently on a case it should have flagged. Dry-run-before-effect and
fail-closed validation turn "the agent did something wrong" into "the agent's plan was
rejected." Bounding the loop prevents the runaway-cost and infinite-retry incidents.

## Evolve when
The blast radius grows (actions become less reversible or higher-stakes), or the escalation
rate reveals the fence is too loose → tighten the sandbox, add a hard human gate on the
risky actions (back toward assistive for those), or split the agent so the dangerous part is
isolated.

## Provenance
seeded (Kapil + assistant, #434).
