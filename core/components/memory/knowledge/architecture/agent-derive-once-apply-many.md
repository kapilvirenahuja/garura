---
id: architecture/agent-derive-once-apply-many
title: "Derive once, apply many: LLM derives the plan, deterministic code applies it at scale"
conditions:
  is_agent: true
  surface: agentic-feature
  stage: any
evolve_when: []
provenance: "documented (Kapil — content-migrator production design session, 2026-06-10) + assistant"
---

# Derive once, apply many: LLM derives the plan, deterministic code applies it at scale

## Topic
How to take an agentic pipeline that transforms many records (migration, bulk
transformation, batch enrichment) to production without paying an LLM call per record and
without letting the LLM touch execution. The LLM's job is to **derive a plan once**; cheap
deterministic code **applies it N times**. The pattern came out of taking the content-migrator
prototype to production on AWS Bedrock, but it holds for any high-volume agentic transform.

## Conditions
Any `is_agent: true` slice whose work is "apply the same judgment to many items" — the
expensive reasoning is per *kind* of input, not per *instance*. If every item genuinely needs
fresh judgment, this pattern does not apply; see
`architecture/agent-orchestration-patterns` instead.

## Recommendation
Five rules, together:

1. **Derive once, apply many.** One expensive LLM call derives an explicit, inspectable plan
   (e.g. a field-mapping plan). Deterministic code applies that plan to every record. A
   per-record LLM fallback is allowed only for records the plan cannot handle — and each use
   of it is a signal to improve the plan, not the steady state.
2. **The orchestration is never an LLM.** A state machine (Step Functions in the reference
   build; any workflow engine) owns the flow: stage order, retries, and every loop with a
   hard max-iteration cap. The model reasons inside a stage; deterministic code decides what
   runs next.
3. **A human approves the plan, a human never authors it.** The machine pauses after
   derivation, surfaces the plan plus its decisions for sign-off, and only then releases the
   apply stage against production data. The gate sits at the plan — the one cheap place
   where review covers all N records at once.
4. **The agent selects from a fixed action catalog — it never emits code.** Transform
   primitives are a versioned, callable allowlist; the derived plan can only compose them.
   This is simultaneously the determinism guarantee and the prompt-injection defense: source
   content is attacker-controllable text, and a poisoned record cannot make the system run
   arbitrary logic because no path from model output to execution exists. Platform
   guardrails (PII, schema enforcement — see `architecture/agentic-guardrails-baseline`)
   sit on top of this boundary, not instead of it.
5. **Route models by stage, meter by run.** The hard derivation gets the strong model; bulk
   checks get a cheap one; matching gets embeddings. Because cost is per plan rather than
   per record, budget caps are set per run/tenant and the unit economics stay flat as N
   grows.

Wrap the whole pipeline in the standard governance set — traces on every model call, evals
of each derived plan against a golden set, drift monitoring on inputs and outputs — and
persist derived plans plus their decisions so the tenth similar run reuses the first nine
(still derived, now informed).

## Rationale
Per-record LLM calls make cost scale linearly with volume and make every record a fresh
non-determinism risk; deriving a plan makes cost (and review effort, and the audit surface)
scale with the number of *plans*. Keeping orchestration deterministic and constraining the
model to an allowlist removes the two biggest production failure modes at once — runaway
loops and injected behavior — by construction rather than by detection. The human gate at
the plan is the highest-leverage review point in the whole pipeline: one approval covers
millions of applications.

## Evolve when
A real workload shows the plan-level grain is too coarse (most records routing to the LLM
fallback) → revisit where judgment lives, possibly per-segment plans. Or the action catalog
grows so wide it stops being a meaningful security boundary → split catalogs per pipeline
stage.

## Provenance
documented (Kapil — content-migrator → Bedrock production design session, 2026-06-10;
prototype at ~/cto/builder/content-migrator) + assistant.
