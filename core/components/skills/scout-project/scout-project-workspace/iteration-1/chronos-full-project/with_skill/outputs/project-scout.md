# Project Scout: Chronos

**Scanned:** 2026-03-14
**Project root:** /Users/kapilahuja/cto/builder/chronos
**Focus:** planning

## Overview

Chronos is a personal AI for strategic leaders -- a dual-tempo, intent-driven PCAM runtime that captures, classifies, synthesizes, and compounds knowledge. The project is in pre-implementation state: all product documentation (vision, spec, technical approach, LLD, scenarios) is complete, but no source code exists yet. The repository contains only documentation, philosophy, and LTM reference material.

## Architecture

- **Pattern:** Split-architecture with two deployment units sharing one database
- **Components:** Python Engine (Railway) -- Discord bot, agent loop, heartbeat scheduler, embedding pipeline, internal REST API; Next.js Web (Vercel) -- artifact pages, review surfaces, session management, audit log viewer
- **Key invariant:** Memory is first-class -- STM and LTM remain distinct layers; agents reason from STM, never from vault directly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM Cognition | Anthropic SDK (tool_runner with compaction, @beta_tool) |
| Embeddings | voyage-3 via VoyageAI API (1024 dim) |
| Observability | Langfuse Python SDK v3 (AnthropicInstrumentor + @observe) |
| Discord | discord.py 2.x (slash commands, message listener) |
| Scheduler | APScheduler |
| Internal API | FastAPI |
| Web Framework | Next.js 15 (App Router) |
| Web Styling | Tailwind CSS |
| Web DB Client | Drizzle ORM |
| Web Hosting | Vercel (+ Vercel Cron) |
| Database | Neon Postgres with pgvector |
| Cache | Upstash Redis |

## Product Documentation

| Document | Status | Key Metric |
|----------|--------|------------|
| Vision | LOCKED | 5 strategic goals |
| Product Spec | Active (v4.0.0) | 6 core behaviors, 5 architectural invariants |
| Technical Approach | Active (v2.0.0) | 3 plays, 2 deployment units |
| LLD | Active (v2.0.0) | 9 phases |
| Scenarios | Active (v1.0.0) | 54 total: 35 automated, 19 hybrid |

## Critical Constraints

- No LangChain/LangGraph -- orchestration is agentic via Claude tool_runner
- No OpenAI -- all LLM and embeddings via Anthropic ecosystem (Anthropic SDK + voyage-3)
- Plays define what, agents determine how -- Phoenix chain (Signal -> Play -> Agent -> Skill -> Memory) must never collapse into Signal -> model call -> answer
- Owner-only trust model in MVP -- single owner, unknown authors silently rejected
- Silent capture -- no acknowledgment messages on signal intake; system stays quiet

## Implementation Structure

| Phase | Delivers | Scenarios |
|-------|----------|-----------|
| 0 | Prerequisites (accounts, credentials) | 0 |
| 1 | Silent capture + trust | 6 |
| 2 | Vault + heartbeat classification | 9 |
| 3 | Capture review (web + notification) | 5 |
| 4 | Consult CTO (clarify + synthesize + sessions) | 21 |
| 5 | Consult review + revision | 4 |
| 6 | Memory promotion | 5 |
| 7 | Audit viewer + session pages + evals | 4 |
| 8 | Production deploy | smoke |

**Gating rule:** Nothing moves forward until the current phase's scenarios pass. Tests are written within each phase, not deferred.

## Planning Notes

- Project is documentation-complete but code-zero -- all 5 product docs exist, no engine/ or web/ directories yet
- Phase 4 (Consult CTO) is the heaviest phase at 21 scenarios and 15 build items -- it introduces sessions, intent detection, gates, artifacts, and the full consult pipeline
- LTM is well-structured with 28 files across formats (7), knowledge (11), and standards (10) -- ready to inform implementation
- Philosophy layer has 14 documents covering IDD, Phoenix, PCAM foundations -- these are reference, not implementation artifacts
- v1 scope is deliberately narrow: Discord-only input, CTO role profile only, 3 of 5 intents active (capture, retrieve, synthesize -- decide and brief deferred)
