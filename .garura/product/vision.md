---
product: Garura
slug: garura
status: LOCKED
created: 2026-03-01
last_updated: 2026-03-04
---

# Garura — Product Vision

**Status:** LOCKED

## Problem Statement

Software teams using AI assistants waste enormous time on context switching, prompt engineering, and re-explaining project state to every new AI session. There is no durable, structured way for an AI to understand a project's intent, constraints, and current state — so every session starts from zero. The result is low-quality AI output, repeated mistakes, and engineers spending more time managing AI than building.

## Target Users

- **Engineering leads at growth-stage startups** — running 5–20 person engineering teams, using Claude or Cursor daily, frustrated that AI gives generic advice that ignores project context
- **Solo founders with technical backgrounds** — building 0→1 products, need to move fast, can't afford to re-explain architecture decisions every session
- **Platform engineers** — responsible for internal tooling standards, want to enforce consistent AI-assisted workflows across teams

## Value Proposition

Garura is the operating layer for intent-driven AI development. It gives AI assistants persistent project memory, structured workflows (plays), and a shared understanding of intent — so every AI session starts informed, not blank. Teams stop babysitting AI and start delegating to it.

## Strategic Goals

1. **Persistent Context** — AI assistants retain full project intent, constraints, and decisions across sessions without manual re-entry
2. **Structured Workflows** — Common development operations (feature planning, code review, shipping) execute as repeatable, auditable plays
3. **Audience-Separated Artifacts** — Product, engineering, and stakeholder artifacts generated from a single source of truth, never manually maintained in parallel
4. **Progressive Enrichment** — Artifacts start lightweight and gain depth as the project matures — no big-bang documentation upfront
5. **Zero-Friction Adoption** — Works with existing Claude Code setup; no new infrastructure, no new tools, no migration cost

## Success Metrics

- Time from idea to first AI-assisted commit: < 30 minutes
- Percentage of AI sessions that start with full project context loaded: > 90%
- Play execution success rate (no human intervention required): > 80%
- Teams reporting reduced context-switching overhead: > 75% in 90-day cohort

## Competitive Landscape

- **GitHub Copilot / Cursor** — IDE-level AI, no persistent project intent, no workflow structure
- **Linear + Notion** — Project management, not AI orchestration; humans still bridge AI and project context
- **LangChain / LlamaIndex** — Developer frameworks for building AI apps, not for operating AI-assisted development workflows
- **Custom CLAUDE.md files** — Ad-hoc, project-specific, non-transferable; Garura is the structured, shareable version of this

## Key Assumptions

- Claude Code (or equivalent agentic AI) remains the primary AI development interface for target users
- Teams are willing to adopt a structured workflow if setup cost is under 30 minutes
- The value of persistent context compounds — teams that use it for 30+ days will not revert
- Markdown-based artifacts are sufficient for machine-readable consumption by AI agents

## Out of Scope

- Building a new IDE or AI model
- Replacing existing project management tools (Linear, Jira)
- Supporting non-Claude AI assistants in v1
- Enterprise SSO, audit logging, or compliance features in v1
