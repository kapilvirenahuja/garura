# Project Scout: Chronos

**Scanned:** 2026-03-14
**Project root:** /Users/kapilahuja/cto/builder/chronos
**Focus:** planning

## Overview

Personal AI for strategic leaders — a dual-tempo, intent-driven PCAM runtime that captures, classifies, synthesizes, and compounds knowledge. Built on IDD philosophy, Phoenix pattern language, and PCAM execution model. Currently in documentation-complete / pre-implementation state: all product docs exist, no application code written yet.

## Architecture

- **Pattern:** Split-architecture (2 deployment units, 1 shared database)
- **Components:** Python Engine (Railway), Next.js Web (Vercel), Neon Postgres (pgvector), Upstash Redis
- **Key invariant:** Memory layers (signal store, STM, vault, audit log) must remain architecturally distinct — never collapse into one store

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Anthropic SDK tool_runner with compaction |
| Observability | Langfuse v3 (AnthropicInstrumentor) |
| Embeddings | voyage-3 (VoyageAI) |
| Discord | discord.py 2.x (slash commands, WebSocket) |
| Scheduler | APScheduler |
| Internal API | FastAPI |
| Web Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| DB Client | Drizzle ORM |
| Database | Neon Postgres with pgvector |
| Cache | Upstash Redis |
| Web Hosting | Vercel |

## Product Documentation

| Document | Status | Key Metric |
|----------|--------|------------|
| Vision | LOCKED | 3 strategic goals |
| Product Spec | Active | 6 core behaviors |
| Technical Approach | Active | 3 recipes, 2 deployment units |
| LLD | Active | 9 phases |
| Scenarios | Active | 54 total: 34 automated, 19 hybrid |

## Critical Constraints

- Memory layers must remain distinct — signal store, STM, vault, audit log never collapse
- Recipes define what, agents determine how — no ad hoc prompting bypassing recipe/agent/skill chain
- Anthropic/Claude is implementation machinery, not the architecture — provider-independent by design
- Signals always stored before processing — no inline processing risking data loss

## Implementation Structure

| Phase | Delivers | Scenarios |
|-------|----------|-----------|
| 0 | Infrastructure accounts + credentials | 0 |
| 1 | Silent capture + trust | 6 |
| 2 | Vault + heartbeat classification | 9 |
| 3 | Capture review (web + notification) | 5 |
| 4 | Consult CTO (clarify + synthesize + sessions) | 21 |
| 5 | Consult review + revision | 4 |
| 6 | Memory promotion | 5 |
| 7 | Audit viewer + session pages + evals | 4 |
| 8 | Production deploy | smoke |

**Gating rule:** Nothing advances until current phase's scenarios pass.

## Planning Notes

- Phase 4 is the largest slice (21 scenarios, 39% of total) — plan for longest implementation cycle there
- No application code exists yet — engine/, web/, db/ directories are empty; all 54 scenarios are pending
- 14 scenario groups span capture, classify, consult, memory promotion, review, sessions, channels, confidence scoring, audit log, trust, response gates, observability, Phoenix chain integrity, and domain cartridge
