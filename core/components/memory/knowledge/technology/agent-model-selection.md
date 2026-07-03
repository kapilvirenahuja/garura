---
id: technology/agent-model-selection
title: "Agent model selection: frontier model for hard reasoning, small/fast model for the rest"
conditions:
  is_agent: true
  surface: agentic-feature
  platform: bedrock-or-vertex
  stage: any
evolve_when: []
provenance: "seeded (Kapil + assistant, #434 — agentic seed)"
---

# Agent model selection: frontier model for hard reasoning, small/fast model for the rest

## Topic
Which model to put behind each part of an agent. Model choice is a per-task decision, not a
one-model-for-everything default — the wrong split is the top driver of both cost and
latency complaints.

## Conditions
Any `is_agent: true` slice, built on a platform that offers a range of models (AWS Bedrock,
GCP Vertex AI — see `technology/agent-platform-bedrock-gcp`).

## Recommendation
- **Match the model to the job, per step:**
  - **Frontier / large model** — the hard reasoning: planning, multi-step tool use, ambiguous
    judgment, code. Accuracy here pays for itself.
  - **Small / fast model** — the high-volume, low-judgment work: routing/classification,
    extraction, short rewrites, formatting. Cheaper and faster, and usually just as good on
    these.
- **Route, don't over-provision.** In a multi-step agent, let a cheap model do the routing
  and the simple steps and call the frontier model only for the steps that need it. This is
  where most cost and latency is won or lost.
- **Pin and version the model.** Treat the model id + version as part of the release; a model
  swap is a behavior change that must pass the eval suite (see
  `technology/agent-deploy-dev-uat-prod`).
- **Stay portable.** Prefer the platform's model-agnostic interface so you can move between a
  Bedrock model and a Vertex model without rewriting the agent — model leadership changes
  often; don't hard-couple.

## Rationale
The recurring mistake is running the most expensive model for everything, then being
surprised by the bill and the latency — when most steps in an agent are routing and
extraction a small model nails. The second mistake is hard-coding one model so a better/
cheaper one can't be adopted. Per-step routing plus a portable interface fixes both, and
both Bedrock and Vertex expose a spread of models behind one API to make it easy.

## Evolve when
A step that a small model handles starts failing (inputs got harder), or a frontier step
became routine → re-route that step up or down. Re-run evals on any model change.

## Provenance
seeded (Kapil + assistant, #434).
