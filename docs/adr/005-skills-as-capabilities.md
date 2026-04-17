# ADR 005: Skills as Learned Capabilities

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


## Status

Accepted

## Date

2026-01-23

## Context

The term "skill" was used loosely in Meridian, sometimes referring to:
- Simple actions (fetch issue, commit code)
- Complex workflows (analyze bug)
- Technology-specific knowledge (write Java code)

This ambiguity made it unclear:
- What is a skill vs. a play?
- Who can invoke skills?
- How do skills relate to agents?

## Decision

**Skills are learned capabilities** — technology or methodology-specific knowledge that agents possess.

### Skill Definition

```
Skills = what agents LEARN (technology/methodology specific)
```

### Skill Categories

| Category | Pattern | Examples |
|----------|---------|----------|
| **Coding** | `write-{language}-code` | `write-java-code`, `write-typescript-code` |
| **Testing** | `create-{framework}-tests` | `create-jest-tests`, `create-pytest-tests` |
| **Analysis** | `do-{type}-analysis` | `do-rca-analysis`, `do-impact-analysis` |
| **Patterns** | `apply-{pattern}` | `apply-tdd-pattern`, `apply-clean-architecture` |
| **Quality** | `check-{type}` | `check-quality-gates`, `check-security-scan` |
| **Operations** | `run-{operation}` | `run-tests`, `run-build` |

### Key Distinction

| Type | What It Is | Examples | Invocability |
|------|------------|----------|--------------|
| **Plays** | Activities (what to do) | `analyze-bug`, `commit-code` | Human OR Model |
| **Skills** | Capabilities (how to do it) | `write-java-code`, `do-rca-analysis` | Model only |

### Skills by Agent

| Agent | Skills |
|-------|--------|
| **code-builder** | `write-java-code`, `write-typescript-code`, `apply-tdd-pattern` |
| **quality-validator** | `run-tests`, `check-quality-gates`, `do-code-review` |
| **tech-designer** | `do-rca-analysis`, `do-impact-analysis`, `apply-clean-architecture` |
| **project-orchestrator** | `create-issue`, `update-issue`, `manage-project` |
| **repo-orchestrator** | `analyze-changes`, `create-commit`, `analyze-pr`, `submit-pr` |

### Invocability Rules

1. **Humans CANNOT invoke skills directly**
   - Skills are internal agent capabilities
   - Humans invoke plays

2. **Agents call skills as needed**
   - Agent receives task from play
   - Agent decides which skills to apply
   - Agent has autonomy in skill selection

3. **Skills are NOT forked**
   - Skills share agent context
   - Forking would create 1:1 agent-skill limit
   - Skills are reusable building blocks

### Skill Properties

| Property | Description |
|----------|-------------|
| **Learned** | Technology/methodology knowledge |
| **Stable** | Don't change frequently |
| **Reusable** | Used by multiple agents/plays |
| **Internal** | Not directly invocable by humans |

### Skill Execution Preferences

Skills prefer tools in this order:

| Priority | Tool Type | Examples | Why |
|----------|-----------|----------|-----|
| 1 | **CLI tools** | `gh`, `git`, `npm` | Fast, reliable, well-documented |
| 2 | **Direct APIs** | REST, GraphQL | Predictable, typed responses |
| 3 | **MCPs** | MCP servers | Last resort — adds latency and complexity |

**Rationale:**
- CLI tools are battle-tested and have predictable behavior
- Direct APIs provide structured responses without intermediaries
- MCPs add an abstraction layer that can introduce latency and failure points

**Example:**
```
# Preferred: Use gh CLI directly
gh pr create --title "feat: add login" --base main

# Avoid: Using MCP for the same operation
mcp__github__create_pull_request(...)
```

Skills should use the simplest, most direct tool available for the job.

## Consequences

### Positive

- Clear separation between "what to do" (plays) and "how to do it" (skills)
- Skills map to team expertise (Java developers, QA specialists)
- Agents have autonomy in skill selection
- Extensible — add skills for new technologies

### Negative

- More abstractions to understand
- Skill-agent mapping must be maintained
- Initial skill catalog requires definition

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 006: Naming Conventions](./006-naming-conventions.md)
