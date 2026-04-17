# Project Planning Summary: Garura

## What It Is

Garura is an agentic framework implementing Intent-Driven Software Development (IDSD) for deterministic AI-assisted code generation. It transforms AI copilots from non-deterministic assistants into predictable, enterprise-grade development partners.

## Architecture

Three-layer hierarchy with strict delegation rules:

- **Plays**: Workflow orchestration. Atomic plays (human or model invocable, max 2 agent calls). High-order plays (human-only, chain atomic plays, max 5 agent calls). 11 plays defined: commit-code, create-pr, start-feature, plan-roadmap, ship, and others.
- **Agents** (8 defined): Domain experts invoked by plays via the Task tool. Includes repo-orchestrator, project-orchestrator, code-builder, tech-designer, product-strategist, intent-crafter, intent-resolver, and doc-builder. Agents discover and invoke skills.
- **Skills** (29 defined): Self-contained, model-invocable capabilities. Examples: create-commit, setup-branch, analyze-changes, draft-product-spec, scout-project. Skills embed their own references and never read LTM at runtime.

Data flow: High-order play chains atomic plays, plays invoke agents, agents invoke skills, skills produce artifacts to STM.

## Tech Stack

- **Runtime**: Claude Code (Anthropic CLI) as the orchestration platform; also supports Factory.AI Droids
- **VCS/Platform**: GitHub (via `gh` CLI)
- **Language**: Pure Markdown definitions for agents, skills, plays, and memory -- no application code
- **Deployment**: `/sync-claude` copies `core/components/` to `~/.claude/` (global) or `.claude/` (project-local, ephemeral)
- **Configuration**: `core/config.yaml` (YAML-based path resolution)

## Memory System

- **Long-Term Memory (LTM)**: Organizational knowledge (practices, templates, quality gates, standards) authored in `core/components/memory/`, deployed to `~/.garura/core/memory/`.
- **Short-Term Memory (STM)**: Issue-centric artifacts at `.garura/project/issues/{issue-number}/` with subdirectories for spec, design, evidence, delivery, and checkpoint.

## Key Constraints

1. **Agent-first delegation**: Plays must never use tools directly when an agent covers that domain. Direct git commands are forbidden inside plays.
2. **Play budget limits**: L1 max 2 agent calls; L2 max 5 (ideal 3).
3. **Explicit approvals**: Tether/Vanish/Orbit protocol for commits, PRs, and destructive actions.
4. **Task-driven workflow**: Every implementation task requires a corresponding verification task with dependency mapping before execution begins.
5. **Source of truth**: All authoring happens in `core/components/`; deployed artifacts are derived copies.

## Key Patterns

- **JSON contract flow**: Play passes contract to agent, agent to skill, skill returns artifact, flows back up.
- **Skill-Memory pattern**: Skills are self-contained; LTM overrides merge at deployment time, not runtime.
- **Issue-centric STM (ADR 008)**: All work artifacts organize under issue numbers with archival lifecycle (ADR 010).
- **Evidence self-commit (ADR 012)**: Skills produce evidence files that are committed as part of the workflow.
- **5-step AI-Native SDLC**: Discover, Specify, Design, Build, Run.
