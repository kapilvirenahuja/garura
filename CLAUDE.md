# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Garura is an agentic framework implementing **Intent-Driven Software Development** principles for deterministic AI-assisted development. It uses a three-layer hierarchy: **Plays** → **Agents** (domain experts) → **Skills** (learned capabilities).

## Architecture

```
core/components/           # Source of truth (edit here)
├── agents/                # Agent definitions
├── skills/                # Skills (model-invocable only)
├── plays/                 # plays
└── memory/                # LTM: standards, formats, knowledge

~/.claude/                 # Global deployment (via /sync-claude, default)
├── agents/                # Deployed agents
└── skills/                # Deployed skills + plays

~/.garura/core/memory/     # Global KB (via /sync-claude, default)
```

**Note:** `.claude/` and `.garura/core/memory/` are NO LONGER tracked in the repository. They are gitignored.
- Components deploy to `~/.claude/` (global mode, default) or `.claude/` (project mode, ephemeral)
- Memory deploys to `~/.garura/core/memory/` (global mode, default) or `.garura/core/memory/` (project mode, ephemeral)

**Data Flow:** Play → invokes agents via Task tool → agents invoke skills → skills produce artifacts to STM (`{stm_base}/{issue}/` — resolved from `stm.base-path` in `.garura/core/config.yaml`)

## Behavioral Rules

### 1. Source of Truth

Author all components in `core/components/`. The canonical deployment is `~/.claude/` (global).
After editing source, run `/sync-claude` to deploy globally. Use `/sync-claude --project` for ephemeral local copies (gitignored).

### 2. Execution Model

**Plays run in Claude Code.** Claude Code orchestrates plays and invokes agents for domain-specific tasks.

```
Claude Code (orchestrator)
    └── runs Play
            └── invokes Agent via Task tool
                    └── agent invokes Skills
```

**Agent-First:** Within plays, delegate domain tasks to agents. Never use tools directly when an agent covers that domain.

```
# ❌ WRONG — bypassing agent
git commit -m "..." directly in play

# ✅ CORRECT — delegate to agent
Task tool → subagent_type: "repo-orchestrator"
```

### 3. Explicit Approvals

Never use `AskUserQuestion` for checkpoints. Output summary, wait for typed response.

```markdown
## Proposed {Action}

{Summary}

---
```
### 4. Agents hold the role of Context Crafting

Agents roles are to gather context and put those on files. the actual work are supposed to be done by skills, which agents will call.

## Play Pipeline Rules

A play change is one of two kinds, and the kind decides the path:

- **Intent change** — anything touching what the play *decides or guarantees*:
  the intent statement, constraints (C-), failure conditions (F-), scenarios
  (S-), the agent/skill flow, or evals. This MUST go through
  `reference/intent.yaml` → `/create-play --build {play}`. Never hand-edit a
  compiled `SKILL.md` for an intent change.

- **Non-intent change** — output format, close/report scaffolding, template
  wiring, surface prose: nothing that alters a guarantee, decision, or eval.
  This is a **direct edit** to the compiled `SKILL.md`. Do NOT run
  `/create-play`; rebuilding when intent is unchanged wastes the pipeline.
  Record the edit with a `**Direct-edit deviation note ({issue}):**` footer.

`create-play` itself has no `intent.yaml` (it is the compiler bootstrap) — all
changes to it are direct edits to its `SKILL.md` by definition.

**Durability rule for non-intent edits:** a hand edit to a generated file is
clobbered by the next intent-driven rebuild unless the compiler reproduces it.
The canonical example is the **Standard Play Close** block — every play's
Evidence & Close section. Its single source of truth is
`core/components/memory/standards/rules/play-close.md`; `/create-play` emits it
(gate G12) so direct-edit and rebuild converge; `lint-components` fails any
play missing its exact anchor pair. Any new shared scaffolding must follow the
same converge-and-lint pattern, not just a one-off hand edit.


## Reference

- `core/grounding/glossary.md` — Canonical definitions of every Garura concept
- `.garura/core/config.yaml` — Paths and settings
- `docs/adr/` — Architecture Decision Records (8 ADRs)
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, play, memory documentation
