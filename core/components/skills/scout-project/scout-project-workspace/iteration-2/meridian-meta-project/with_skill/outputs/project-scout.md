# Project Scout: Meridian OS

**Scanned:** 2026-03-14
**Project root:** /Users/kapilahuja/cto/builder/meridian-os
**Focus:** architecture

## Overview

Meridian OS is an agentic framework implementing Intent-Driven Software Development (IDSD) for deterministic AI-assisted development. Vision is LOCKED; roadmap and engineering view are DRAFT with 6 epics planned across Near/Mid/Long horizons.

## Architecture

- **Pattern:** Three-layer hierarchy (Recipes -> Agents -> Skills) with Four Crafts separation (Intent, Prompt, Context, Spec) and JSON Contract data flow
- **Components:** L1/L2 Recipes (12 defined), Agents (8 defined: 6 implemented, 2 planned), Skills (30 defined), Dual Memory (LTM project-scoped + STM issue-scoped)
- **Data flow:** Recipe creates JSON contract -> Agent receives contract, performs Context Crafting (discovers LTM, reads STM) -> Skill receives assembled inputs, produces STM artifacts -> Agent enriches contract -> Recipe validates
- **Key invariant:** Recipes never execute domain work directly; all domain operations delegate to agents. Recipes own only orchestration, checkpoints, and evidence.
- **Recovery:** Structured failure protocol with max 2 retry cycles per agent; recovery calls exempt from agent count limits

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI runtime | Claude Code CLI (Anthropic) |
| VCS/platform | GitHub + GitHub CLI (gh) |
| Artifact format | Markdown + YAML |
| Config | YAML (core/config.yaml) |
| Distribution | curl-based bash installer |
| Deployment | /sync-claude to ~/.claude/ (global) |

## Product Documentation

| Document | Status | Key Metric |
|----------|--------|------------|
| Vision | LOCKED | 5 strategic goals |
| Roadmap | DRAFT | 6 epics (E1-E6) |
| Engineering View | DRAFT | 6 tech risk items |
| Brief | DRAFT | 3 open asks |

## Critical Constraints

- NWWI: No Work Without an Issue -- commit-code enforces issue linkage
- Recipes are contracts, never forked -- prescribed step order is non-negotiable
- Agent-first: recipes forbidden from using Bash, Grep, Glob, or direct git/gh commands
- L1 recipes: max 2 agent calls; L2 recipes: max 5 agent calls (ideal 3)
- Skills are model-invocable only, self-contained, stable over time

## Implementation Structure

| Phase | Delivers | Status |
|-------|----------|--------|
| E1 -- Persistent Context | STM/LTM storage, context loading, CLAUDE.md auto-population | planned |
| E2 -- Recipe Engine | L1/L2 execution, agent delegation, Tether/Vanish protocol | planned |
| E4 -- Strategic Planning | discover-product, plan-roadmap, audience-separated artifacts | planned |
| E3 -- Quality Layer | quality-validator agent, verification scenarios, evidence | planned |
| E5 -- Feature Dev Track | Issue-to-ship pipeline, artifact traceability chain | planned |
| E6 -- Adoption | Project init, progressive enrichment, setup validation | planned |

**Gating rule:** E1 -> E2 -> E3 -> E5 -> E6 is critical path. E4 runs parallel off E2.

## Planning Notes

- All 6 epics have Technical Context and Blast Radius sections marked "empty" -- architecture decisions not yet made
- Intent Primacy philosophy: recipes are scaffolding toward future intent-driven autonomous execution where constraints replace prescribed steps
