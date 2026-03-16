# Chronos -- Project Planning Summary

## What It Is

Chronos is a personal AI for strategic leaders -- a dual-tempo, intent-driven system that captures thinking from Discord, classifies and synthesizes it into compounding knowledge, and retrieves it on demand. It is a second brain, not a chatbot. Built on three philosophical layers: IDD (Intent-Driven Design), Phoenix (pattern language), and PCAM (Perception, Cognition, Agency, Manifestation).

## Architecture

Split-architecture with two deployment units sharing one database:

- **Python Engine (Railway):** Long-running process hosting the Discord bot (discord.py 2.x WebSocket), agent loop (Anthropic SDK `tool_runner` with compaction), heartbeat scheduler (APScheduler), embedding pipeline (voyage-3), and an internal FastAPI REST API.
- **Next.js Web (Vercel):** Server-rendered surfaces for artifact reading, capture review, session management, decision audit log viewer, and API routes for Vercel Cron and review action proxying.
- **Shared Infra:** Neon Postgres with pgvector (system of record + vector search), Upstash Redis (scheduling state, ephemeral cache), Langfuse Cloud (observability).

Communication: Next.js reads Postgres directly (Drizzle ORM) and calls Python engine API (shared-secret auth) for write operations.

## Tech Stack

| Layer | Key Technologies |
|-------|-----------------|
| LLM | Anthropic SDK (`tool_runner`, `@beta_tool`), no LangChain/OpenAI |
| Embeddings | voyage-3 (1024 dim, Anthropic ecosystem) |
| Discord | discord.py 2.x (slash commands, message listener) |
| Web | Next.js 15 (App Router), Tailwind CSS, Drizzle ORM |
| Database | Neon Postgres + pgvector, Upstash Redis |
| Observability | Langfuse v3 (`AnthropicInstrumentor` + `@observe`) |

## Constraints

- Discord-only channel (no WhatsApp/Telegram/voice).
- CTO role profile only (PM and Entrepreneur deferred).
- Three active intents: capture, retrieve, synthesize (decide and brief deferred).
- No external LLM dependencies beyond Anthropic ecosystem.
- No separate migration framework -- schema via SQL + Drizzle push.
- Memory layers (Signal Store, STM, Vault, Audit Log) must remain distinct and never collapsed.

## Three Recipes (v1)

| Recipe | Tempo | Trigger |
|--------|-------|---------|
| Capture & Classify | Fast (30-min heartbeat) | Discord message + scheduled heartbeat |
| Consult CTO | Slow (on-demand) | Owner `/ask` on Discord |
| Memory Promotion | Long (monthly) | Scheduled long-cadence heartbeat |

## Implementation Phases

Nine vertical slices, each delivering testable scenarios before advancing:

| Phase | Delivers | Cumulative Scenarios |
|-------|----------|---------------------|
| 0 | Prerequisites (accounts, credentials) | 0 |
| 1 | Silent capture + trust | 7 |
| 2 | Vault + heartbeat classification | 15 |
| 3 | Capture review (web + notification) | 21 |
| 4 | Consult CTO (clarify + synthesize + sessions) | 41 |
| 5 | Consult review + revision | 45 |
| 6 | Memory promotion | 50 |
| 7 | Audit viewer + session pages + evals | 54 |
| 8 | Production deploy | 54 + smoke |

## Scenario Coverage

54 total verification scenarios (35 automated, 19 hybrid). Grouped across: Capture (silent intake, burst, trust), Classification (heartbeat-driven), Review (web surfaces, notifications), Consult CTO (clarification, synthesis, sessions, RAG cartridge), Memory Promotion (pattern detection, vault promotion), and Observability (audit log, Langfuse traces, evals). Every feature traces to a `SC-*` scenario ID. Nothing ships without its scenarios passing.
