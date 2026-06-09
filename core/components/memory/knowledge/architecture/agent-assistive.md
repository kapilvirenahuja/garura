---
id: architecture/agent-assistive
title: "Assistive agent: suggest, never act — a human approves every real effect"
conditions:
  is_agent: true
  autonomy: low-to-medium       # the offload weights are low–medium
  consequence: low-to-high      # safe even when actions are consequential
  stage: first-agentic-feature
evolve_when:
  - architecture/agent-supervised-autonomous
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Assistive agent: suggest, never act — a human approves every real effect

## Topic
The first, safe rung of agent autonomy. The agent does the thinking and proposes; a human
makes every real-world effect happen. The right default for a team's first agentic feature,
and for any feature where a wrong action is expensive.

## Conditions
`is_agent: true` with low-to-medium offload, and especially when actions are consequential
(touch customer data, money, or anything hard to undo). Also the right starting point
whenever the team is new to agents and wants to earn trust before granting autonomy.

## Recommendation
- The agent **drafts, suggests, and explains** — it never commits a write or an irreversible
  action on its own.
- Every effecting action is **staged for a human to approve** (a diff, a draft, a proposed
  command). The human is the commit button.
- Tools are **read-mostly**: retrieval and analysis are free; anything that changes state is
  a *proposal*, not a call.
- **Handoff cadence: every effecting step.** On the agentic lens this reads as high handoff,
  loose-to-medium guardrails (the human is the guardrail).
- Keep a full audit trail of what was suggested and what the human did with it — this is the
  data that later justifies (or denies) more autonomy.

## Rationale
Assistive-first is how trust is earned without risking damage. The agent captures the value
(it does the work) while the human keeps the authority (they approve the effect), so a wrong
suggestion costs a rejected draft, not a production incident. It also generates the evidence
— how often the human accepts unchanged — that tells you whether the feature has earned the
next rung. Teams that skip straight to autonomous agents on consequential actions tend to
get one bad incident and then ban agents entirely; assistive-first avoids that trap.

## Evolve when
The acceptance rate is consistently high, the failure modes are understood, and the human
approval step has become pure ceremony → climb to a supervised autonomous agent that acts
inside a fence and escalates only when unsure. See
`architecture/agent-supervised-autonomous`.

## Provenance
seeded (Kapil + assistant, #434).
