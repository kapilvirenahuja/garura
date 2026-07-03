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

~/.claude/                 # Global deployment (via /sud:install)
├── agents/                # Deployed agents
└── skills/                # Deployed skills + plays

~/.garura/core/memory/     # Global KB (via /sud:install)
```

**Note:** `.claude/` and `.garura/core/memory/` are NO LONGER tracked in the repository. They are gitignored.
- Components deploy to `~/.claude/` (global mode, default) or `.claude/` (project mode, ephemeral)
- Memory deploys to `~/.garura/core/memory/` (global mode, default) or `.garura/core/memory/` (project mode, ephemeral)

**Data Flow:** Play → invokes agents via Task tool → agents invoke skills → skills produce artifacts to STM (`{stm_base}/{issue}/` — resolved from `stm.base-path` in `.garura/core/config.yaml`)

## Behavioral Rules

### 1. Source of Truth

Author all components in `core/components/`. The canonical deployment is `~/.claude/` (global).
After editing source, run the sudarshan `/sud:install` meta-play to deploy components into a target's `.claude/` (skills + agents). Deployment tooling lives in sudarshan, not in garura itself.

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

### 5. User-Facing Voice (HARD RULE — load on every session in this repo)

Whenever you address the user in any reply — checkpoint, status update, summary, close report, or ad-hoc conversation — lead in the language the user operates in: **product, feature, capability, technology, outcome.** File paths, class names, function names, line numbers, schema field names, YAML keys, and agent/skill identifiers belong in an appendix or a machine-readable artifact, **never in the lead** of a human-facing message.

Signals you've drifted (stop and rewrite when you spot any in your own draft):
- The opening sentence names a file path, class, function, line number, or schema field.
- The user would have to read a table of files to learn what the work is *about*.
- A status update enumerates components touched before stating the outcome.
- A checkpoint asks the user to approve "changes to X.yaml" instead of "the decision that Y".

Both registers can coexist in one reply — user-facing lead first, machine-facing appendix second, in that order. A reply with only an appendix (no lead) is non-compliant. This rule applies to every reply regardless of which slash command, play, or skill is running — including ad-hoc conversation between plays. When a play, command, or sub-agent output violates it, **rewrite before showing the user — relaying ≠ pasting.**

The canonical long-form rule, lint anchors, and play scaffolding requirements live at `core/components/memory/standards/rules/user-facing-voice.md`. Defer to it on edge cases.

## Play Pipeline Rules

A play change is one of two kinds, and the kind decides the path:

- **Intent change** — anything touching what the play *decides or guarantees*:
  the intent statement, constraints (C-), failure conditions (F-), scenarios
  (S-), the agent/skill flow, or evals. This MUST go through
  `reference/intent.yaml` → `/play-creator --build {play}`. Never hand-edit a
  compiled `SKILL.md` for an intent change.

- **Non-intent change** — output format, close/report scaffolding, template
  wiring, surface prose: nothing that alters a guarantee, decision, or eval.
  This is a **direct edit** to the compiled `SKILL.md`. Do NOT run
  `/play-creator`; rebuilding when intent is unchanged wastes the pipeline.
  Record the edit with a `**Direct-edit deviation note ({issue}):**` footer.

`play-creator` itself has no `intent.yaml` (it is the compiler bootstrap) — all
changes to it are direct edits to its `SKILL.md` by definition.

**Durability rule for non-intent edits:** a hand edit to a generated file is
clobbered by the next intent-driven rebuild unless the compiler reproduces it.
The canonical example is the **Standard Play Close** block — every play's
Evidence & Close section. Its single source of truth is
`core/components/memory/standards/rules/play-close.md`; `/play-creator` emits it
(gate G12) so direct-edit and rebuild converge; `lint-components` fails any
play missing its exact anchor pair. Any new shared scaffolding must follow the
same converge-and-lint pattern, not just a one-off hand edit.


## Reference

- `core/grounding/glossary.md` — Canonical definitions of every Garura concept
- `.garura/core/config.yaml` — Paths and settings
- `docs/adr/` — Architecture Decision Records (8 ADRs)
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, play, memory documentation
