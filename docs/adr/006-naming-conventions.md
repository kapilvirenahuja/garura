# ADR 006: Naming Conventions

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


## Status

Accepted

## Date

2026-01-23

## Context

Meridian components (plays, skills, agents) had inconsistent naming patterns, making it difficult to:
- Understand component type from name
- Follow consistent creation patterns
- Maintain documentation accuracy

## Decision

Establish clear naming conventions for all Meridian components.

### Play Naming: `{action}-{object}`

**High-Order Plays** — User intent, workflow:

| Pattern | Examples |
|---------|----------|
| `{action}-{object}` | `fix-bug`, `code-microservice`, `create-feature`, `review-pr` |

**Atomic Plays** — Atomic units, produce artifacts:

| Pattern | Examples |
|---------|----------|
| `{action}-{object}` | `analyze-bug`, `design-fix`, `implement-fix`, `validate-fix` |

Note: High-order and atomic plays share the same naming pattern. The level is indicated in metadata, not the name.

### Skill Naming

Skills use two patterns depending on type:

#### Technology-Specific Skills: `{action}-{tech/method}`

For skills that embody technology or methodology expertise:

| Pattern | Examples |
|---------|----------|
| `write-{language}-code` | `write-java-code`, `write-typescript-code` |
| `create-{framework}-tests` | `create-jest-tests`, `create-pytest-tests` |
| `do-{type}-analysis` | `do-rca-analysis`, `do-impact-analysis` |
| `apply-{pattern}` | `apply-tdd-pattern`, `apply-clean-architecture` |
| `check-{type}` | `check-quality-gates`, `check-security-scan` |
| `run-{operation}` | `run-tests`, `run-build`, `run-lint` |

#### Operation Skills: `{action}-{object}`

For skills that perform repository or project operations:

| Pattern | Examples |
|---------|----------|
| `analyze-{object}` | `analyze-changes`, `analyze-pr` |
| `create-{object}` | `create-commit`, `create-issue` |
| `submit-{object}` | `submit-pr` |
| `update-{object}` | `update-issue` |

**Why two patterns:**
- Technology skills need the tech/method qualifier to distinguish variants (Java vs TypeScript)
- Operation skills are platform-aware (GitHub) but don't have variants — the platform is injected by the agent

### Agent Naming: `{domain}-{role}`

All agents follow the domain-role pattern:

| Domain | Role | Agent Name |
|--------|------|------------|
| code | builder | `code-builder` |
| quality | validator | `quality-validator` |
| tech | designer | `tech-designer` |
| project | orchestrator | `project-orchestrator` |
| repo | orchestrator | `repo-orchestrator` |
| workflow | guardian | `workflow-guardian` |

### Skill Qualifiers (Optional)

Use qualifiers only when multiple types exist:

| Scenario | Naming |
|----------|--------|
| Single type | `design` |
| Multiple types | `design-tech`, `design-ux` |

### Summary Table

| Component | Pattern | Examples |
|-----------|---------|----------|
| **High-Order Plays** | `{action}-{object}` | `fix-bug`, `create-feature` |
| **Atomic Plays** | `{action}-{object}` | `analyze-bug`, `commit-code` |
| **Skills (tech)** | `{action}-{tech/method}` | `write-java-code`, `do-rca-analysis` |
| **Skills (ops)** | `{action}-{object}` | `analyze-changes`, `submit-pr` |
| **Agents** | `{domain}-{role}` | `code-builder`, `tech-designer` |

### Validation Rules

1. **Plays**: Must start with a verb (action)
2. **Skills (tech)**: Must include technology/methodology qualifier
3. **Skills (ops)**: Must describe an operation on an object
4. **Agents**: Must have exactly one hyphen (domain-role)
5. **No underscores**: Use hyphens for all component names

### Anti-Patterns

| Anti-Pattern | Problem | Correct |
|--------------|---------|---------|
| `bugFixer` | CamelCase, unclear type | `fix-bug` (play) |
| `bug-analyzer` | Specialist pattern | `tech-designer` (agent) |
| `javaCode` | Missing action verb | `write-java-code` (skill) |
| `the-code-builder` | Article prefix | `code-builder` (agent) |

## Consequences

### Positive

- Consistent naming across codebase
- Easy to identify component type from name
- Clear creation guidelines
- Documentation accuracy

### Negative

- Existing components may need renaming
- Requires discipline to follow conventions
- Migration effort for legacy names

## Related ADRs

- [ADR 004: Agent Naming](./004-agent-naming.md)
- [ADR 005: Skills as Capabilities](./005-skills-as-capabilities.md)
