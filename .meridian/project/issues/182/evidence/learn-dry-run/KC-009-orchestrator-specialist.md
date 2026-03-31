# Recipe Orchestrator vs Agent Specialist Separation
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Designing new recipes, extending existing agents, or deciding whether a task belongs in the recipe layer or the agent layer.
**When this does NOT apply:** Standalone scripts or single-agent tasks with no orchestration layer; utility agents that are explicitly designed to be stateful across calls.
**Search patterns:** orchestrator specialist, recipe agent separation, workflow state, domain reasoning, agent substitution, separation of concerns
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

The recipe-agent boundary is a strict separation of responsibilities:

**Recipes own:**
- Workflow sequencing — which steps run in which order
- Checkpoint management — when to pause and wait for human input
- Status tracking — which steps are complete, which are pending
- Information flow filtering — deciding which context to pass to each agent
- Cross-step coordination — passing outputs from one agent as inputs to the next

**Agents own:**
- Domain-specific reasoning — decisions within their area of expertise
- Artifact production — creating the outputs the recipe requested
- Knowledge resolution — looking up LTM to inform domain decisions
- Self-contained error handling — attempting recovery within their domain before escalating

**Hard constraints:**
- Recipes NEVER perform domain work directly. A recipe that validates code quality, computes architecture decisions, or writes implementation files is doing agent work. Extract it.
- Agents NEVER manage workflow state. An agent that tracks "step 3 of 7 complete" or decides which agent to call next is doing recipe work. Remove it.

**Why the boundary enables substitution:** Because recipes only pass contracts (input schemas) to agents, any agent implementation can be swapped without changing the recipe. Because agents only produce artifacts (output schemas) without tracking state, any agent can be paused and resumed independently.

**Violation pattern to watch:** "I'll just add this logic to the recipe since it's simpler." Logic in the recipe is untested domain work. Domain work in the recipe cannot be swapped or tested independently.

## Why It Matters

When recipes accumulate domain logic, they become fragile monoliths that cannot be tested in isolation and cannot have their domain components improved independently. When agents accumulate workflow state, they become tightly coupled to the specific recipe that calls them and cannot be reused in other workflows. The separation is not aesthetic — it is the mechanism that makes the system maintainable and composable.

## Applicability Boundaries

**In scope:** Any multi-step automated pipeline with an orchestration layer and specialist workers. This includes CI/CD pipelines, data processing workflows, and agent-based systems.
**Out of scope:** Single-step automations with no orchestration; systems where all agents are identical and interchangeable without domain specialization.

## Rationale

Orchestrator/specialist separation is a universal design principle that appears in microservices (API gateway vs service), pipeline architecture (coordinator vs worker), and manufacturing (scheduler vs machine). Its application to recipe-agent design in Meridian follows the same structural logic. The pattern is worth capturing as core because it prevents a common failure mode in any orchestrated system: accumulation of domain logic in the orchestrator.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
