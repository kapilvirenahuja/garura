# Skills

Skills are learned capabilities that agents possess — technology or methodology-specific knowledge.

## Philosophy

**Skills = what agents LEARN**

Skills represent the "how" of execution. They are technology or methodology-specific knowledge that agents apply to accomplish tasks.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Learned** | Technology/methodology specific knowledge |
| **Stable** | Don't change frequently over time |
| **Reusable** | Used by multiple agents and recipes |
| **Internal** | Not directly invocable by humans |
| **Context-sharing** | Share the agent's context (never forked) |

## Key Distinction: Recipes vs Skills

| Aspect | Recipes | Skills |
|--------|---------|--------|
| **What** | Activities (what to do) | Capabilities (how to do it) |
| **Invocability** | Human OR Model | Model only (via agents) |
| **Purpose** | Orchestrate workflow | Execute with expertise |
| **Stability** | May evolve with process | Stable knowledge |

## Skill Categories

Skills are organized by what they enable:

### By Purpose

| Category | Pattern | What It Does |
|----------|---------|--------------|
| **Coding** | `write-{language}-code` | Write code in specific language |
| **Testing** | `create-{framework}-tests` | Create tests with specific framework |
| **Analysis** | `do-{type}-analysis` | Perform specific type of analysis |
| **Patterns** | `apply-{pattern}` | Apply architectural/design patterns |
| **Quality** | `check-{type}` | Validate against quality criteria |
| **Operations** | `run-{operation}` | Execute specific operations |

### Naming Convention

Skills follow the pattern that describes the **learned capability**:

```
{action}-{technology/methodology}-{optional-qualifier}
```

Examples of the pattern (not concrete implementations):
- Coding skill: `write-{language}-code`
- Testing skill: `create-{framework}-tests`
- Analysis skill: `do-{methodology}-analysis`

## Skill Properties

### Model-Invocable Only

Skills are **never invoked directly by humans**. The invocation chain is:

```
Human → Recipe → Agent → Skill
```

This ensures:
- Proper context is built
- Standards are applied
- Decisions are made by the agent

### Context Sharing

Skills share the agent's context because:
1. **Continuity** — Skills need context built by the agent
2. **Efficiency** — No redundant context building
3. **Coherence** — Skills work together toward the agent's goal

### Never Forked

Forking a skill would:
- Create a 1:1 limit (one skill per agent)
- Lose shared context
- Break the coherence principle

## Skill Invocation

```
Agent: {domain}-{role}
    │
    ├── Reads LTM for standards
    │
    ├── Decides which skills to apply
    │
    └── Invokes skills with shared context
              │
              ├── Skill A: {does work}
              │
              └── Skill B: {does work}
    │
    └── Produces artifact
```

### Agent Autonomy

Agents have **full autonomy** in skill selection:
- Agent decides which skills to invoke
- Agent decides the order of invocation
- Agent decides when to stop

## Skill vs Actions

| Type | What It Is | Relationship |
|------|------------|--------------|
| **Skills** | Learned capability (how) | What agents know |
| **Actions** | Operation to perform (what) | What agents do |

**Agents use skills to perform actions.**

## Skill Definition Structure

Skills follow Claude's skill/command format:

```yaml
---
name: {skill-name}
category: {coding|testing|analysis|patterns|quality|operations}
description: {what this skill enables}
memory:
  - {LTM paths for standards}
---

# Skill Instructions

[Detailed instructions for executing the skill...]

## Standards

[Standards to follow from LTM...]

## Patterns

[Common patterns this skill applies...]
```

## Skill Qualifiers

Use qualifiers **only when multiple types exist**:

| Scenario | Naming |
|----------|--------|
| Single type exists | `design` |
| Multiple types exist | `design-tech`, `design-ux` |

This prevents unnecessary prefixes while maintaining clarity.

## Skill Location

Skill definitions are stored in:

```
core/components/skills/
```

See: [docs/usage/skills/](../usage/skills/) for concrete implementations.

## Related Documentation

- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [Agents Component Guide](./phx-agents.md)
- [Recipes Component Guide](./phx-recipes.md)
