# ADR 002: L1 Checkpoint Model

## Status

Accepted

**Note:** The checkpoint storage location defined in this ADR has been superseded by [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md). Checkpoints now use `.meridian/{issue}/checkpoint/{play}/{timestamp}.md` instead of the legacy path. The core model (artifact + checkpoint) remains unchanged.

## Date

2026-01-23

## Context

Previous workflows had inconsistent stopping points. Some plays ran to completion without user input, while others had arbitrary pause points. This made it difficult to:

- Know when human review was expected
- Understand what artifacts were produced
- Chain plays predictably in higher-order workflows

## Decision

Every play follows the **artifact + checkpoint** model:

```
Play: {name}
    │
    └── Agent executes work
              │
              └── Agent uses skills as needed
              │
              └── Agent produces ARTIFACT
    │
    └── CHECKPOINT: Present artifact for approval
```

### Rules

1. **Every play produces exactly one artifact**
   - Tangible output: document, code, URL, evidence file
   - Stored in STM: `.meridian/{issue}/docs/` or `.meridian/{issue}/evidence/`

2. **Every play stops at a checkpoint**
   - Play execution pauses
   - Artifact is presented to human for review
   - Human approves, rejects, or requests changes

3. **Invocability is flexible**
   - Humans can invoke directly: `/analyze-bug`
   - Models can invoke within higher-order workflows
   - Same behavior in both cases (artifact + checkpoint)

### Artifact Locations

| Artifact Type | Location |
|---------------|----------|
| Documentation (RCA, specs, designs) | `.meridian/{issue}/docs/` |
| Evidence (tests, validation) | `.meridian/{issue}/evidence/` |
| External (PR URL, Issue URL) | Returned directly |

## Consequences

### Positive

- Predictable play behavior
- Clear points for human oversight
- Artifacts can be reviewed, versioned, and referenced
- Clean chaining in plays

### Negative

- Requires discipline to produce artifacts even for simple operations
- Checkpoint overhead for trivial tasks (mitigated by guardian)

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 003: Guardian Approval Model](./003-guardian-approval.md)
- [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md) — Supersedes checkpoint location
