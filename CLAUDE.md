# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Phoenix OS is an agentic framework implementing **AI-native SDLC** principles for intent-driven, deterministic AI-assisted development. It uses a three-layer hierarchy: **Commands** (user workflows) → **Agents** (domain experts) → **Skills** (learned capabilities).

## Architecture

Phoenix OS uses the native Claude Code plugin format:

```
phoenix-os/
├── .claude-plugin/           # Plugin manifest
│   └── plugin.json
├── skills/                   # Model-invocable capabilities
│   ├── analyze-changes/      # Analyze uncommitted changes
│   ├── analyze-pr/           # Analyze PR readiness
│   ├── create-commit/        # Create commits
│   ├── submit-pr/            # Submit pull requests
│   └── memory/               # Repository standards & conventions
├── commands/                 # User-invocable workflows
│   ├── commit-code.md        # Commit workflow
│   └── create-pr.md          # PR creation workflow
├── agents/                   # Domain experts
│   └── repo-orchestrator.md  # Repository operations
├── CLAUDE.md                 # This file
└── README.md                 # Project documentation
```

**Data Flow:** Command → invokes agents → agents invoke skills → skills produce artifacts to STM (`.phoenix-os/project/`)

## Behavioral Rules

### 1. Source of Truth

All components are in their respective root-level directories:
- `skills/` — Model-invocable skills
- `commands/` — User-invocable commands
- `agents/` — Domain expert agents

### 2. Execution Model

**Commands run in Claude Code.** Claude Code orchestrates commands and invokes agents for domain-specific tasks.

```
Claude Code (orchestrator)
    └── runs Command
            └── invokes Agent via Task tool
                    └── agent invokes Skills
```

**Agent-First:** Within commands, delegate domain tasks to agents. Never use tools directly when an agent covers that domain.

| Domain Task | Agent |
|-------------|-------|
| Git, commits, branches, PRs | `repo-orchestrator` |

```
# ❌ WRONG — bypassing agent
git commit -m "..." directly in command

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

### 4. Command Constraints

Commands are user-invocable workflows that orchestrate agents:
- Max 2 agent calls per command
- Always produce checkpoint for user approval
- Never execute git/gh commands directly

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

- `docs/adr/` — Architecture Decision Records
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, command documentation
