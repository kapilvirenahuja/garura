# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Phoenix OS is an agentic framework implementing **Fluidic SDLC** principles for intent-driven, deterministic AI-assisted development. It uses a three-layer hierarchy: **Recipes** (L1/L2 workflows) → **Agents** (domain experts) → **Skills** (learned capabilities).

## Architecture

```
core/components/           # Source of truth (edit here)
├── agents/               # Agent definitions (6 agents)
├── skills/               # Skills (model-invocable only)
├── recipes/              # L1/L2 recipes
└── memory/               # LTM: practices, templates, standards

.claude/                   # Synced output (never edit directly)
├── agents/               # Deployed agents
└── skills/               # Deployed skills + recipes
```

**Data Flow:** L2 Recipe → chains L1s → L1 invokes ≤2 agents → agents invoke skills → skills produce artifacts to STM (`.phoenix-os/project/`)

## Behavioral Rules

### 1. Source of Truth

Author all components in `core/components/`. Never edit `.claude/` directly.

```
core/components/skills/   → .claude/skills/  (via /sync-claude)
core/components/recipes/  → .claude/skills/  (via /sync-claude)
core/components/agents/   → .claude/agents/  (via /sync-claude)
```

After editing source, run `/sync-claude`.

### 2. Execution Model

**Recipes run in Claude Code.** Claude Code orchestrates recipes and invokes agents for domain-specific tasks.

```
Claude Code (orchestrator)
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
# ❌ WRONG — bypassing agent
git commit -m "..." directly in recipe

# ✅ CORRECT — delegate to agent
Task tool → subagent_type: "repo-orchestrator"
```

### 3. Explicit Approvals

Never use `AskUserQuestion` for checkpoints. Output summary, wait for typed response.

```markdown
## Proposed {Action}

{Summary}

---

Type **Approve** to proceed or **Reject** to cancel.
```

Parse: `Approve`/`approve` → proceed. `Reject`/`reject` → cancel. Else → clarify.

Applies to: commits, PRs, protected branches, destructive actions.

### 4. Recipe Constraints

| Level | Invocability | Max Agent Calls |
|-------|--------------|-----------------|
| L1 | Human OR Model | ≤2 |
| L2 | Human only | ≤5 (ideal 3) |

### 5. Task-Driven Workflow

Always use Claude's Task tools for non-trivial work. Plan before executing.

**Workflow:**

1. **Understand** — Clarify what needs to be done
2. **Decompose** — Break into discrete tasks via `TaskCreate`
3. **Identify verification** — Add tasks for testing/validation of each work task
4. **Assign agents** — Identify which agent handles each task
5. **Map dependencies** — Use `TaskUpdate` with `addBlockedBy` to set order
6. **Review plan** — Present task graph to user before starting
7. **Execute** — Only begin work after tasks are properly set up

**Task Pattern:**

```
TaskCreate: "Implement X" (agent: code-builder)
TaskCreate: "Verify X" (agent: quality-validator) → blockedBy: [implement task]
TaskCreate: "Implement Y" (agent: code-builder) → blockedBy: [verify X if dependent]
TaskCreate: "Verify Y" (agent: quality-validator) → blockedBy: [implement Y]
```

**Rules:**
- Every implementation task should have a corresponding verification task
- Never start execution before task graph is complete
- Update task status as you progress (`in_progress` → `completed`)
- Use `TaskList` to check progress and find next available task

**Agent/Skill Responsibilities:**
- Agents and skills MUST mark their assigned tasks as `completed` when done
- Agents and skills CAN add new tasks via `TaskCreate` if they discover additional work
- Agents and skills MUST NEVER abandon a task — always complete or escalate
- If blocked, create a new task describing the blocker and link with `addBlockedBy`

## Reference

- `core/config.yaml` — Paths and settings
- `docs/adr/` — Architecture Decision Records (7 ADRs)
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, recipe, memory documentation
