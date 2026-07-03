---
id: technology/agent-platform-bedrock-gcp
title: "Agent platform: build on AWS Bedrock and GCP Vertex AI — managed models, tools, and guardrails"
conditions:
  is_agent: true
  surface: agentic-feature
  cloud: aws-or-gcp
  stage: any
evolve_when:
  - technology/agent-deploy-dev-uat-prod
provenance: "documented (Kapil, #434 — preferred agent platforms) + assistant"
---

# Agent platform: build on AWS Bedrock and GCP Vertex AI — managed models, tools, and guardrails

## Topic
Where agents are built and deployed. Don't hand-roll the model serving, the guardrail layer,
or the retrieval plumbing — use a managed agent platform. The two we build on are **AWS
Bedrock** and **GCP Vertex AI**.

## Conditions
Any `is_agent: true` slice. Platform choice usually follows where the rest of the product
already runs (the modular monolith on GCP → Vertex is the path of least resistance; an
AWS-centric product → Bedrock), or which models/features one offers that the task needs.

## Recommendation
- **AWS Bedrock** — a spread of frontier and small models behind one API, plus managed
  **Agents** (orchestration + tool use), **Knowledge Bases** (managed retrieval/RAG), and
  **Guardrails** (content + policy filters). Reach for Bedrock when the product lives on AWS
  or needs a model only it serves.
- **GCP Vertex AI** — Google + partner models, **Agent Builder** (orchestration, grounding,
  tools), managed retrieval, and built-in safety controls. The default when the product
  already runs on GCP (it sits next to the Cloud Run + Cloud SQL runtime — see
  `technology/gcp-modular-monolith-runtime`).
- **Use the platform's building blocks for the parts you'd otherwise hand-roll** — managed
  retrieval, the guardrail layer, tool/function wiring — and keep your own code to the
  domain logic and the orchestration the platform doesn't cover (see
  `technology/agent-building-blocks`).
- **Stay model- and platform-portable.** Keep the agent's interface to the model behind a
  thin abstraction so a Bedrock model and a Vertex model are swappable. Model leadership
  moves fast; don't hard-couple to one.
- **Deploy the agent as a service** in the product's existing runtime (e.g. a Cloud Run
  service on GCP), calling the platform's managed pieces — not as a notebook or a one-off.

## Rationale
The managed platforms collapse the parts you'd otherwise build and operate — model serving,
retrieval, guardrails — into configuration, which is where most agent build time used to go.
Bedrock and Vertex both expose models, agents, retrieval, and guardrails behind one API, so
the work becomes assembling and prompting, not plumbing. Picking the platform that matches
where the product already runs avoids a second cloud's worth of ops. The portability
discipline is the hedge: the *platform* is sticky (retrieval, guardrails), but the *model*
should never be.

## Evolve when
The agent is built and working in dev → it needs an environment-promotion and eval-gating
story before it reaches users. See `technology/agent-deploy-dev-uat-prod`.

## Provenance
documented (Kapil, #434) + assistant.
