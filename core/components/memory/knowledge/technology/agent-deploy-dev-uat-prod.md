---
id: technology/agent-deploy-dev-uat-prod
title: "Agent deployment: dev → uat → prod, promotion gated by an eval suite (not just tests)"
conditions:
  is_agent: true
  surface: agentic-feature
  cloud: aws-or-gcp
  stage: any
evolve_when: []
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Agent deployment: dev → uat → prod, promotion gated by an eval suite (not just tests)

## Topic
How an agent moves from build to users. The environment path is the familiar dev → uat →
prod, but the **promotion gate is different**: because an agent is non-deterministic, you
gate on an **eval suite**, not just pass/fail tests. This is the operational (`/run`) lens
for an agentic slice.

## Conditions
Any `is_agent: true` slice on Bedrock or Vertex (see `technology/agent-platform-bedrock-gcp`).

## Recommendation
- **Three environments.**
  - **dev** — build and iterate on prompts, tools, orchestration; cheap models OK while
    shaping.
  - **uat** — the agent runs against realistic data and the **eval suite**; humans review
    sample transcripts. The gate before prod.
  - **prod** — real users, behind the guardrail baseline, with live observability.
- **Gate promotion on evals, not just tests.** Maintain an eval suite — a set of
  representative cases with graded expectations (accuracy, safety, refusal-when-it-should,
  cost/latency). A change promotes only if it holds or improves the eval scores. Unit tests
  still cover the deterministic plumbing (tools, parsing); evals cover the agent's behavior.
- **Treat prompt + model + tools as the release.** A prompt edit or a model swap is a
  behavior change — it re-runs the eval suite and promotes through the same path. Pin the
  model version (see `technology/agent-model-selection`).
- **Canary in prod.** Roll a new prompt/model to a slice of traffic, watch the live eval
  metrics and cost, then ramp — never a hard cutover. (Mirrors the gradual-rollout stance in
  `technology/gcp-modular-monolith-runtime`.)
- **Observe in prod.** Trace every run; sample and score live; alert on cost, refusal-rate,
  and failure spikes. The eval suite grows from the prod cases that surprised you.

## Rationale
The thing that breaks agent deployments is treating them like deterministic software: a
green test suite says nothing about whether the agent still behaves well after a prompt or
model change. Eval-gated promotion is the agentic equivalent of tests — it's the only thing
that catches a "looks fine, acts worse" regression before users do. The uat eval gate plus a
prod canary keeps non-deterministic changes from shipping blind, and the prod traces are
what feed the eval suite so it gets stronger over time.

## Evolve when
Eval coverage lags the failures you see in prod, or model/prompt changes ship faster than the
suite can vet them → invest in the eval suite and automate the gate before adding more
autonomy (`architecture/agent-supervised-autonomous`).

## Provenance
seeded (Kapil + assistant, #434).
