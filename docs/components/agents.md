# Agents

Agents are autonomous decision-makers in Meridian with domain-specific expertise.

## Philosophy

Agents are **truly agentic** — they make all decisions within their domain. They are judges, not executors.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **One domain** | Each agent owns exactly one domain of expertise |
| **Decision makers** | Agents judge and decide, not just execute instructions |
| **Context sharing** | Agents build context and share it with skills they invoke |
| **Skill autonomy** | Agents decide which skills to use based on the situation |
| **Knowledge-driven** | Agents read from Long-Term Memory (LTM) to apply standards |

## Naming Convention

### The `{domain}-{role}` Pattern

All agents follow the **`{domain}-{role}`** naming pattern:

- **Domain**: The area of expertise (code, quality, tech, project, repo, workflow)
- **Role**: The function performed (builder, validator, designer, orchestrator, guardian)

This pattern ensures:
1. Clear ownership — each agent owns one domain
2. Predictable naming — easy to identify what an agent does
3. Right granularity — not too broad, not too narrow

### Role Types

| Role | Responsibility |
|------|----------------|
| **builder** | Creates, implements, constructs |
| **validator** | Tests, reviews, validates, enforces quality |
| **designer** | Analyzes, designs, architects |
| **orchestrator** | Coordinates, manages, tracks |
| **guardian** | Protects, validates decisions, enforces rules |

### Granularity Principle

Meridian avoids both extremes:

| Too Narrow | Too Granular | Right Level |
|------------|--------------|-------------|
| Generic role only | Task-specific specialist | Domain + role |
| `builder` | `bug-analyzer` | `{domain}-builder` |
| `designer` | `feature-implementer` | `{domain}-designer` |

**Principle:** 1 agent = 1 domain expertise, not 1 task.

## Agent Behavior

### Decision Making

Agents make autonomous decisions about:
- Which skills to invoke
- How to interpret requirements
- What approach to take
- When to ask for clarification

### Context Building

Agents build context by:
1. Reading from LTM (practices, standards, templates)
2. Analyzing the current state
3. Understanding requirements
4. Sharing context with invoked skills

### Artifact Production

Every agent invocation produces:
- A tangible artifact (document, code, report)
- Evidence of work done
- Clear output for the next step

## Invocation Model

Agents are invoked through L1 and L2 recipes:

```
L1 Recipe → invokes → Agent → uses → Skills
                         ↓
                    Produces ARTIFACT
```

**Critical Rule:** Agents are **never invoked directly** by users. Users invoke recipes, recipes invoke agents.

## Agent Definition Structure

Agent definitions follow Claude Code's agent format:

Tool sets vary by role. Orchestrators use skills; builders and designers use direct tools.

| Role | Typical Tools | Rationale |
|------|--------------|-----------|
| orchestrator | Task, Bash, Read, Write, Skill | Delegates work to skills |
| builder | Bash, Read, Write, Edit, Grep, Glob | Direct file manipulation |
| designer | Bash, Read, Grep, Glob, Write | Read-heavy exploration + plan output |
| validator | *(planned)* | *(TBD)* |
| guardian | *(planned)* | *(TBD)* |

```yaml
---
name: {domain}-{role}
domain: {domain}
role: {role}
description: {what this agent does}
model: sonnet
tools:
  # Varies by role — see table above
  - Bash
  - Read
  - Write
  # Orchestrators add: Task, Skill
  # Builders add: Edit, Grep, Glob
  # Designers add: Grep, Glob
---

# {domain}-{role}

## Identity

[Who this agent is and what domain it owns...]

## Capabilities

[Available skills and when to use each...]

## Context Loading

[How to read LTM (config, practices) and inject to skills...]

## Decision Framework

[How this agent makes decisions...]

## Output Contracts

[Expected return formats for each skill invocation...]

## Boundaries

[NEVER and ALWAYS rules...]
```

## Why Not Specialist Agents?

Meridian deprecates specialist patterns (e.g., `bug-analyzer`, `test-writer`) because:

| Problem | Solution |
|---------|----------|
| Proliferation | Too many single-purpose agents |
| Overlap | Unclear boundaries between specialists |
| Maintenance | Hard to keep consistent |
| Context loss | Each specialist starts fresh |

Instead, domain agents handle multiple related tasks with shared context.

## Agent Location

Agent definitions are stored in:

```
core/components/agents/
```

See: [docs/usage/agents/](../usage/agents/) for concrete implementations.

## Related Documentation

- [ADR 004: Agent Naming](../adr/004-agent-naming.md)
- [Recipes Component Guide](./recipes.md)
- [Skills Component Guide](./skills.md)
