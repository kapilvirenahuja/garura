# ADR 001: Three-Layer Hierarchy (L2 → L1 → Skills)

## Status

Accepted

## Date

2026-01-23

## Context

Meridian needed a clear architecture for organizing its workflows. The original design had a flat structure where recipes directly called sub-agents and skills without clear boundaries, leading to:

- Unclear invocability rules (what can humans invoke vs. models?)
- No consistent checkpoint/approval model
- Difficulty composing complex workflows from simpler units
- Ambiguity about when artifacts should be produced

## Decision

Meridian adopts a **three-layer hierarchy**:

```
L2 Recipes (High-Order)     User intent: fix-bug, code-microservice
        ↓
L1 Recipes (Activities)     Atomic units: analyze-bug, design-fix, implement-fix
        ↓
Skills (Learned Capabilities)   Agent knowledge: write-java-code, create-selenium-tests
```

### Layer Definitions

| Layer | Purpose | Invocability | Max Calls |
|-------|---------|--------------|-----------|
| **L2 Recipes** | Workflow chaining L1s | Human only | ≤5 agent calls |
| **L1 Recipes** | Atomic activity → artifact → checkpoint | Human OR Model | ≤2 agent calls |
| **Skills** | Learned capabilities agents use | Model only (via agent) | N/A |

### Key Properties

1. **L2 Recipes (High-Order)**
   - Chain multiple L1 recipes
   - Human invocable only
   - Include guardian agent for approval bypass decisions
   - Maximum 5 agent calls (ideal 3)

2. **L1 Recipes (Activities)**
   - Atomic, single-purpose workflows
   - Can be invoked by humans OR models
   - Always produce an artifact
   - Always stop at a checkpoint for approval

3. **Skills (Learned Capabilities)**
   - Technology/methodology specific knowledge
   - Model invocable only (agents call skills)
   - NOT forked — share agent context
   - Stable over time

## Consequences

### Positive

- Clear separation between workflow coordination (L2), activity execution (L1), and capability (Skills)
- Predictable checkpoint behavior for human oversight
- Enables non-stop work mode through guardian validation
- Clean boundaries for composition

### Negative

- More files to maintain (L1 and L2 definitions separate)
- Initial learning curve for understanding the layers
- Requires discipline to classify recipes correctly

## Related ADRs

- [ADR 002: L1 Checkpoint Model](./002-l1-checkpoint-model.md)
- [ADR 003: Guardian Approval Model](./003-guardian-approval.md)
- [ADR 005: Skills as Capabilities](./005-skills-as-capabilities.md)
