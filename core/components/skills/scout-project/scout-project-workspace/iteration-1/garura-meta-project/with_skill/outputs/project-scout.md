# Project Scout: Garura

**Scanned:** 2026-03-14
**Project root:** /Users/kapilahuja/cto/builder/garura
**Focus:** architecture

## Overview

Garura is an agentic framework implementing Intent-Driven Software Development (IDSD) for deterministic AI-assisted development. It uses a three-layer hierarchy (Plays, Agents, Skills) with a dual memory system (STM/LTM) to give AI assistants persistent project context and structured workflows. The project is in active development with product vision LOCKED and a 6-epic roadmap in DRAFT.

## Architecture

- **Pattern:** Three-layer hierarchy -- High-order plays chain atomic plays, plays invoke Agents (max 2 calls), Agents invoke Skills. Claude Code is the orchestrator. No runtime server; everything executes as markdown-defined components within Claude Code sessions.
- **Components:** `core/components/` (source of truth: agents, skills, plays, memory) deploys to `~/.claude/` (global) via `/sync-claude`. STM lives at `.garura/project/issues/`. LTM lives at `~/.garura/core/memory/`. Product artifacts at `.garura/product/`.
- **Key invariant:** Agent-first delegation -- plays must never use tools directly when an agent covers that domain. Skills are model-invocable only; never user-invocable. Plays define the only entry points for structured workflows.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Claude Code CLI (Anthropic) |
| Component format | Markdown (agents, skills, plays) + YAML (config, intents) |
| Version control | Git + GitHub CLI (`gh`) |
| Memory (LTM) | Flat markdown files with Glob/Grep retrieval |
| Memory (STM) | Issue-scoped markdown artifacts in `.garura/project/issues/` |
| Deployment sync | `/sync-claude` skill (copies `core/components/` to `~/.claude/`) |
| Platform | GitHub (issues, PRs, branches) |

## Product Documentation

| Document | Status | Key Metric |
|----------|--------|------------|
| Vision | LOCKED | 5 strategic goals |
| Roadmap | DRAFT | 6 epics (E1-E6) |
| Roadmap Brief | DRAFT | 6 epics, 3 horizons (Near/Mid/Long) |
| Engineering View | DRAFT | 6 technical risks, 7 open questions |

## Critical Constraints

- Agent-first: plays delegate to agents, never bypass with direct tool calls
- Atomic plays max 2 agent calls; high-order plays max 5 (ideal 3)
- Tether/Vanish explicit approval protocol at all checkpoints -- no auto-approval
- Skills are model-invocable only; self-contained with local references
- Source of truth is `core/components/`; `.claude/` and `.garura/core/memory/` are gitignored deployment targets
- No work without issue (NWWI) -- STM is issue-centric per ADR 008

## Implementation Structure

| Phase | Delivers | Status |
|-------|----------|--------|
| E1 -- Persistent Context Engine (Near, P1, L) | STM/LTM storage, CLAUDE.md auto-population, context loading | planned |
| E2 -- Play Execution Engine (Near, P1, XL) | Play execution, agent delegation, Tether/Vanish, checkpoints | planned |
| E4 -- Strategic Planning Track (Near, P1, L) | discover-product, plan-roadmap plays, audience-separated artifacts | planned |
| E3 -- Quality & Verification Layer (Mid, P2, M) | quality-validator agent, verification scenarios, evidence artifacts | planned |
| E5 -- Feature Development Track (Mid, P2, XL) | End-to-end pipeline: issue to ship, artifact traceability | planned |
| E6 -- Adoption & Onboarding (Long, P2, M) | Project init, setup validation, progressive enrichment | planned |

**Gating rule:** E1 -> E2 -> E3 -> E5 -> E6 is the critical path. E4 runs parallel off E2. No epic begins until its dependencies are stable.

## Planning Notes

- 8 agents defined (code-builder, doc-builder, intent-crafter, intent-resolver, product-strategist, project-orchestrator, repo-orchestrator, tech-designer); 30 skills; 11 plays
- 13 ADRs document architectural decisions; 3 philosophy docs define IDSD principles
- LTM contains standards (commits, branching, agent contracts), formats (GitHub issues), knowledge (evolutionary scaling), and templates (epic schema, product vision, intent schema)
- All 6 epics have IDD core (intent/constraints/scenarios/failures) at 100%; technical context and blast radius at 0% -- pending `/plan-architecture`
- Intent-driven play architecture (intent-crafter + intent-resolver agents, intent schema) suggests a shift toward declarative play definition
