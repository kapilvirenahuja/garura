---
id: architecture/agentic-guardrails-baseline
title: "Agentic guardrails baseline: the floor under every agent, at any autonomy level"
conditions:
  is_agent: true
  surface: agentic-feature
  stage: any
evolve_when: []
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Agentic guardrails baseline: the floor under every agent, at any autonomy level

## Topic
The non-negotiable safety floor every agent sits on, whether it's assistive or supervised-
autonomous. The autonomy rung decides *how much* the agent does on its own; this baseline is
what's always true regardless. It's what the agentic lens's `guardrails` and `handoff` axes
ground in.

## Conditions
Every `is_agent: true` slice. Applies at every autonomy level — the floor doesn't move; only
what's built on top of it does.

## Recommendation
Every agent, minimum:

- **Least-privilege, scoped tools.** Each tool has the narrowest permission that works; no
  ambient broad access. The agent can only touch what it's explicitly granted.
- **Input + output validation.** Validate/sanitize what comes in (prompt-injection and
  untrusted-content defense) and what goes out (schema, policy, safety checks) before it
  acts or returns.
- **A kill switch.** A way to stop or disable the agent immediately, without a deploy.
- **Rate + cost limits.** Caps on calls, tokens, spend, and loop iterations per run and per
  period — so a misbehaving agent fails small, not catastrophically.
- **Full logging + traceability.** Every step, tool call, and decision logged, so any run can
  be reconstructed and audited.
- **A defined human-handoff trigger.** An explicit rule for when the agent must stop and call
  a human (low confidence, out-of-bounds, a sensitive action) — even an autonomous agent has
  one.
- **Eval/observability hooked in** (see `technology/agent-deploy-dev-uat-prod`): you can
  measure whether it's behaving, not just hope.

## Rationale
Almost every agent incident traces back to a missing item on this list — an over-scoped tool
after a prompt injection, no spend cap during a retry loop, no kill switch when it
misbehaved in prod, or no logs to explain what happened. These controls are cheap to build
in from the start and expensive to retrofit after an incident. They're also exactly what
platform guardrail features (Bedrock Guardrails, Vertex safety) and the agent's own
orchestration are there to provide — see `technology/agent-platform-bedrock-gcp`.

## Evolve when
The baseline doesn't evolve — it's the floor. As autonomy rises (assistive →
supervised-autonomous) the controls *tighten* (smaller fence, stricter validation, lower
loop bounds), but every item here stays present.

## Provenance
seeded (Kapil + assistant, #434).
