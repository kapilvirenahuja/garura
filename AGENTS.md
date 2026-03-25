# AGENTS.md

This file provides guidance to Factory Droids when working with code in this repository.

## Overview

Meridian is an agentic framework implementing **Intent-Driven Software Development** principles for deterministic AI-assisted development. It uses a three-layer hierarchy: **Recipes** (L1/L2 workflows) → **Agents** (domain experts) → **Skills** (learned capabilities).

## Architecture

```
core/components/           # Source of truth (edit here)
├── agents/               # Agent definitions (Claude Code native)
├── skills/               # Skills (model-invocable only)
├── recipes/              # L1/L2 recipes
└── memory/               # LTM: standards, formats, knowledge

~/.factory/                # Global deployment (via /sync-droids, default)
├── droids/               # Deployed agents (transformed from Claude Code format)
└── skills/               # Deployed skills + recipes

~/.meridian/core/memory/   # Global LTM (via /sync-droids, default)
```

**Note:** `.factory/` and `.meridian/core/memory/` are NOT tracked in the repository. They are gitignored.
- Components deploy to `~/.factory/` (global mode, default) or `.factory/` (project mode, ephemeral)
- Memory deploys to `~/.meridian/core/memory/` (global mode, default) or `.meridian/core/memory/` (project mode, ephemeral)
- The `sync-droids` script transforms Claude Code agents into Factory Droid format during deployment

**Data Flow:** L2 Recipe → chains L1s → L1 invokes ≤2 agents → agents invoke skills → skills produce artifacts to STM (`{stm_base}/{issue}/` — resolved from `stm.base-path` in `core/config.yaml`)

## Tool Name Mapping

Source files use Claude Code tool names. The `sync-droids` script transforms these during deployment.

| Claude Code | Factory Droid |
|-------------|---------------|
| `Bash` | `Execute` |
| `Write` | `Edit`, `Create` |
| `WebFetch` | `FetchUrl` |
| `Read` | `Read` |
| `Grep` | `Grep` |
| `Glob` | `Glob` |
| `Edit` | `Edit` |
| `Task` | `Task` |
| `WebSearch` | `WebSearch` |
| — | `LS` (added automatically) |

## Behavioral Rules

### 1. Source of Truth

Author all components in `core/components/`. The canonical deployment is `~/.factory/` (global).

**Global mode (default):**
```
core/components/skills/   → ~/.factory/skills/          (via /sync-droids)
core/components/recipes/  → ~/.factory/skills/          (via /sync-droids)
core/components/agents/   → ~/.factory/droids/          (via /sync-droids, transformed)
core/components/memory/   → ~/.meridian/core/memory/    (via /sync-droids)
```

**Project mode (ephemeral):**
```
core/components/skills/   → .factory/skills/            (via /sync-droids --project, gitignored)
core/components/recipes/  → .factory/skills/            (via /sync-droids --project, gitignored)
core/components/agents/   → .factory/droids/            (via /sync-droids --project, gitignored)
core/components/memory/   → .meridian/core/memory/      (via /sync-droids --project, gitignored)
```

After editing source, run `/sync-droids` to deploy globally. Use `/sync-droids --project` for ephemeral local copies (gitignored).

### 2. Execution Model

**Recipes run in Factory Droid.** The Droid orchestrates recipes and invokes agents (droids) for domain-specific tasks.

```
Droid (orchestrator)
    └── runs Recipe (L1/L2)
            └── invokes Agent via Task tool
                    └── agent invokes Skills
```

**Agent-First:** Within recipes, delegate domain tasks to agents. Never use tools directly when an agent covers that domain.

| Domain Task | Agent |
|-------------|-------|
| Git, commits, branches | `repo-orchestrator` |
| Issues, tracking | `repo-orchestrator` + `project-orchestrator` context |
| Technical design, RCA | `tech-designer` |
| Implementation | `code-builder` |
| Testing, validation | `quality-validator` |

```
# WRONG — bypassing agent
git commit -m "..." directly in recipe

# CORRECT — delegate to agent
Task tool → subagent_type: "repo-orchestrator"
```

### 3. Git Discipline

Never commit or push directly to main. All work goes through feature branches and PRs — no exceptions, no matter how small the change. The flow is always: `/start-feature` → work on branch → `/ship` (or manual PR). Do not rush to commit; accumulate related changes and commit when a logical unit of work is complete. Never auto-proceed through the commit/PR/merge pipeline without the user explicitly invoking `/ship`.

### 4. Explicit Approvals

Never use `AskUser` for checkpoints. Output summary, wait for typed response.

```markdown
## Proposed {Action}

{Summary}

---

Type **Tether** to proceed or **Vanish** to cancel.
```

Parse: `Tether`/`tether` → proceed. `Vanish`/`vanish` → cancel. Else → clarify.

Applies to: commits, PRs, protected branches, destructive actions.

### 5. Recipe Constraints

| Level | Invocability | Max Agent Calls |
|-------|--------------|-----------------|
| L1 | Human OR Model | ≤2 |
| L2 | Human only | ≤5 (ideal 3) |

### 6. Task-Driven Workflow

Always use Task tools for non-trivial work. Plan before executing.

**Workflow:**

1. **Understand** — Clarify what needs to be done
2. **Decompose** — Break into discrete tasks
3. **Identify verification** — Add tasks for testing/validation of each work task
4. **Assign agents** — Identify which agent handles each task
5. **Map dependencies** — Set execution order
6. **Review plan** — Present task graph to user before starting
7. **Execute** — Only begin work after tasks are properly set up

**Rules:**
- Every implementation task should have a corresponding verification task
- Never start execution before task graph is complete
- Update task status as you progress (`in_progress` → `completed`)

**Agent/Skill Responsibilities:**
- Agents and skills MUST mark their assigned tasks as `completed` when done
- Agents and skills CAN add new tasks if they discover additional work
- Agents and skills MUST NEVER abandon a task — always complete or escalate

## Reference

- `core/config.yaml` — Paths and settings
- `docs/adr/` — Architecture Decision Records (8 ADRs)
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, recipe, memory documentation
