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
| **Internal** | Not directly invocable by humans (see Meta-Utility exception) |
| **Context-sharing** | Share the agent's context (never forked) |

## Two Categories

Meridian has two categories of components that deploy as Claude Code skills:

| Category | What It Is | Invocability | Purpose |
|----------|-----------|--------------|---------|
| **Skills** | Learned capabilities (how to do it) | Model only (via agents) | Execute with expertise |
| **Recipes** | Workflows (what to do and in what order) | Human OR Model | Orchestrate workflow |

Both deploy to `.claude/skills/` but serve fundamentally different roles. This document covers **Skills**. See [Recipes](./recipes.md) for recipe documentation.

### Meta-Utility Skills (Exception)

Some skills exist to manage the Meridian framework itself. These are classified as **meta-utility skills** and may be `user-invocable: true` despite the general rule that skills are model-invocable only.

Example: `sync-claude` — synchronizes Meridian components to Claude Code directories. It is invoked directly by the user because it manages the deployment pipeline, not a domain task.

Meta-utility skills:
- Are user-invocable
- Serve framework operations, not domain work
- Are not invoked by agents or recipes

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

Skills follow two naming patterns:

#### Technology-Specific Skills: `{action}-{tech/method}`

For skills that embody technology or methodology expertise:

| Pattern | Examples |
|---------|----------|
| `write-{language}-code` | `write-java-code`, `write-typescript-code` |
| `create-{framework}-tests` | `create-jest-tests`, `create-pytest-tests` |
| `do-{type}-analysis` | `do-rca-analysis`, `do-impact-analysis` |

#### Operation Skills: `{action}-{object}`

For skills that perform repository or project operations:

| Pattern | Examples |
|---------|----------|
| `analyze-{object}` | `analyze-changes`, `analyze-pr` |
| `create-{object}` | `create-commit` |
| `submit-{object}` | `submit-pr` |
| `manage-{object}` | `manage-issue` |
| `setup-{object}` | `setup-branch` |

## Skill Properties

### Model-Invocable Only

Skills are **never invoked directly by humans** (except meta-utility skills). The invocation chain is:

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

## Skill Definition Structure

Skills are self-contained directories following Claude Code's skill format.

### Directory Structure

```
core/components/skills/{skill-name}/
├── SKILL.md              # Skill definition
├── reference/            # Skill-specific reference files (optional)
│   └── {domain-ref}.md
└── templates/            # Output format templates
    └── {output}.md
```

### SKILL.md Frontmatter

Frontmatter contains only fields that Claude Code and tooling systems consume:

```yaml
---
name: {skill-name}
description: {what this skill does}
user-invocable: false
model: {sonnet|haiku}
allowed-tools: {Tool1, Tool2}
---
```

| Field | Description |
|-------|-------------|
| `name` | Skill identifier, matches directory name |
| `description` | Short summary for CLI/tooling discovery |
| `user-invocable` | `false` for skills, `true` only for meta-utility skills |
| `model` | Model to use (see Model Selection below) |
| `allowed-tools` | Comma-separated list of tools the skill may use |

### SKILL.md Body Structure

```markdown
# {skill-name}

{One-line description of what the skill does.}

## Purpose

{What this skill does and its boundaries. What it DOES vs what it does NOT do.}

## Input

{What the skill receives from the calling agent.}

## Process

{Step-by-step execution — the skill's core logic.}
{References to local files or LTM for organizational knowledge.}

## Output

{Structured output format, typically referencing templates/{output}.md}

## Reference

{Optional — load directives for reference files.}

## Constraints

{NEVER/ALWAYS rules that bound the skill's behavior.}

## Version

| Field | Value |
|-------|-------|
| Version | {semver} |
| Category | {analysis|operations|coding|testing|patterns|quality} |
```

### Model Selection

| Model | When To Use | Examples |
|-------|-------------|----------|
| `haiku` | Execution-only skills — no analysis, no decision-making, fast operations | `create-commit`, `setup-branch`, `submit-pr`, `sync-claude` |
| `sonnet` | Analysis skills — reasoning, categorization, pattern matching, complex logic | `analyze-changes`, `analyze-pr`, `manage-issue` |

**Rule of thumb:** If the skill just runs commands and formats output, use `haiku`. If the skill needs to read, reason, and categorize, use `sonnet`.

## Skill References

Skills reference two types of knowledge (see [ADR 009](../adr/009-skill-ltm-organizational-knowledge.md)):

### Skill-Local References

Skill-specific knowledge that is NOT organizational — detection patterns, tool-specific API references, evaluation logic. These live in the skill's `reference/` directory.

```markdown
Load patterns from: `reference/risks.md`
```

### LTM References (Organizational Knowledge)

Organizational standards that adopters customize — commit categories, issue templates, quality gates. These live in LTM and are referenced by well-known paths.

```markdown
Load categories from: `~/.meridian/core/memory/standards/commits/categories.md`
```

| Knowledge Type | Location | Mutable By Adopter |
|---------------|----------|-------------------|
| Skill behavior (process, constraints) | Skill-local (embedded) | No — edit skill source |
| Skill-specific references (risk patterns) | `reference/` directory | No — edit skill source |
| Organizational standards (categories) | LTM (`~/.meridian/core/memory/`) | Yes — edit LTM |
| Output format | `templates/` directory | No — edit skill source |

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

## Related Documentation

- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 007: Skill-Local References](../adr/007-skill-local-references.md) — Partially superseded by ADR 009
- [ADR 009: Skill LTM Organizational Knowledge](../adr/009-skill-ltm-organizational-knowledge.md)
- [Agents Component Guide](./agents.md)
- [Recipes Component Guide](./recipes.md)
