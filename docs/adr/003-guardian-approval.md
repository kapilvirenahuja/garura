# ADR 003: Guardian Approval Model

## Status

Accepted

## Date

2026-01-23

## Context

L1 recipes always stop at checkpoints for human approval. This is valuable for oversight but creates friction in workflows where:

- The artifact quality is clearly sufficient
- No security or breaking concerns exist
- The operation is within acceptable risk tolerance

Users wanted a way to enable "non-stop work" mode while maintaining quality gates.

## Decision

L2 recipes include a **workflow-guardian** agent that validates whether human approval can be skipped at each checkpoint.

```
L2 Recipe: fix-bug
    │
    ├── L1: analyze-bug ──────────────────────────┐
    │       Artifact: rca.md                      │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    │                          │
    │                          NO → STOP for human approval
    │
    ├── L1: design-fix ───────────────────────────┐
    │       Artifact: tech-design.md              │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    ...
```

### Guardian Decision Criteria

The workflow-guardian evaluates:

| Criterion | Question |
|-----------|----------|
| **Quality** | Does artifact meet quality threshold? |
| **Security** | Any security concerns identified? |
| **Breaking Changes** | Will this break existing functionality? |
| **Risk Tolerance** | Within acceptable risk parameters? |
| **Complexity** | Is the change simple enough to auto-approve? |

### Decision Rules

```
ALL criteria pass → Skip human approval, continue workflow
ANY criterion fails → Stop for human approval
```

### Guardian Agent

| Agent | Purpose |
|-------|---------|
| `workflow-guardian` | Validates if human approval can be skipped in L2 |

The guardian is a specialized agent with read access to:
- LTM quality standards
- Project risk configuration
- Artifact content for validation

## Consequences

### Positive

- Enables non-stop work mode for low-risk operations
- Maintains human oversight for complex/risky changes
- Configurable risk tolerance per project
- Clear audit trail of guardian decisions

### Negative

- Adds complexity to L2 recipes
- Requires well-defined quality thresholds
- Guardian misconfiguration could skip important reviews

### Safeguards

1. Guardian defaults to STOP if uncertain
2. Human can always override guardian decisions
3. Guardian decisions are logged for audit
4. Configuration reviewed at project setup

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](./002-l1-checkpoint-model.md)
