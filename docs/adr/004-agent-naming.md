# ADR 004: Agent Naming Convention

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


## Status

Accepted

## Date

2026-01-23

## Context

Meridian originally documented a `{domain}-keeper` pattern but used inconsistent naming:

| Documented | Actual Usage |
|------------|--------------|
| `{domain}-keeper` | `project-keeper`, `repo-keeper` |
| — | `bug-analyzer`, `bug-implementer` (specialist pattern) |

Three patterns were in use:

| Pattern | Type | Examples | Problem |
|---------|------|----------|---------|
| `{domain}-keeper` | Domain Stewards | `project-keeper` | Good for API domains |
| `{role}` | SDLC Roles | `developer` | Too broad, unclear domain |
| `{domain}-{action}er` | Specialists | `bug-analyzer` | Creates agent explosion |

## Decision

Consolidate to the **`{domain}-{role}` pattern** with two categories:

### 1. Domain-Role Agents (SDLC)

Core agents follow `{domain}-{role}`:

| Agent | Domain | Role | Responsibility | Status |
|-------|--------|------|----------------|--------|
| `code-builder` | implementation | builder | Write code, implement features, fix bugs | Implemented |
| `tech-designer` | design | designer | Technical design, RCA, architecture | Implemented |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination | Implemented |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches | Implemented |
| `quality-validator` | quality | validator | Test, review, validate, quality gates | Planned |
| `engineering-manager` | engineering | manager | QP compliance certification | New |

Note: `quality-validator` was implemented as `quality-auditor` (auditor role) rather than the originally planned `quality-validator`.

### 2. Special-Purpose Agents

| Agent | Purpose |
|-------|---------|
| `workflow-guardian` | Validates approval bypass in plays |

### Deprecated Patterns

| Old (Deprecated) | New | Reason |
|------------------|-----|--------|
| `bug-analyzer` | `tech-designer` | RCA is design work |
| `bug-implementer` | `code-builder` | Implementation is building |
| `test-keeper` | `quality-validator` | Testing is validation |
| `grooming-keeper` | `project-orchestrator` | Refinement is coordination |

### Naming Rules

1. **Domain** = area of expertise (implementation, design, quality, project, repo, workflow)
2. **Role** = SDLC function (builder, validator, designer, orchestrator, guardian, manager)
3. **One agent = one domain** (not one task)
4. **Current: 4 implemented** (code-builder, tech-designer, repo-orchestrator, project-orchestrator) + **2 planned** (quality-validator, workflow-guardian)

### Right Granularity

| Too Narrow | Too Granular | Right Level |
|------------|--------------|-------------|
| `builder` | `bug-analyzer` | `code-builder` |
| `designer` | `bug-implementer` | `tech-designer` |
| `validator` | `test-writer` | `quality-validator` |

Exception: `test-writer` operates as a play-scoped sub-role within implement-epic. It is not a standalone agent file, but its context isolation requirements (asymmetric information with code-builder) justify its existence as a named role within the play.

## Consequences

### Positive

- Single consistent pattern
- Clear domain ownership
- Reduced agent explosion (6 total vs. 10+)
- Maps to SDLC roles teams understand

### Negative

- Requires migration of existing agent references
- CLAUDE.md documentation must be updated
- Existing `bug-analyzer`, `bug-implementer` agents deprecated

### Migration Path

1. Create new agents with `{domain}-{role}` names
2. Update CLAUDE.md to document new pattern
3. Deprecate old specialist agents
4. Update plays to use new agents

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 006: Naming Conventions](./006-naming-conventions.md)
