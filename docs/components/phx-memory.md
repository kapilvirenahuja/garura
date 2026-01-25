# Memory

Phoenix OS uses a dual memory architecture: Long-Term Memory (LTM) and Short-Term Memory (STM).

## Philosophy

Memory is **project contextual information** that enables consistent, knowledge-driven behavior.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Dual architecture** | LTM persists, STM is ephemeral |
| **Separation of concerns** | Standards vs artifacts |
| **Knowledge-driven** | Agents read memory to apply standards |
| **Artifact-tracked** | Work is documented in STM |

## Memory Types

| Type | Lifecycle | Purpose | Location |
|------|-----------|---------|----------|
| **LTM** | Project setup → persists | Practices, standards, templates | `core/components/memory/` |
| **STM** | Recipe start → recipe end | Artifacts created during recipe | `.phoenix-os/{issue}/` |

## Long-Term Memory (LTM)

LTM contains **project contextual information** that persists across all recipes and sessions.

### LTM Purpose

LTM stores:
- **Practices** — How to do things (guidelines, standards)
- **Templates** — Output formats (document templates)
- **Tools** — Tool-specific patterns (platform operations)

### LTM Usage

Agents and skills read from LTM to:
1. Follow established practices
2. Use consistent templates
3. Apply tool-specific patterns
4. Maintain team conventions

```
Agent invoked
    │
    └── Reads LTM:
          ├── practices/{domain}/
          ├── templates/{type}/
          └── tools/{platform}/
    │
    └── Applies standards to work
```

### LTM Organization

```
core/components/memory/
├── practices/       # How to do things
├── templates/       # Output formats
└── tools/           # Tool-specific patterns
```

## Short-Term Memory (STM)

STM contains **artifacts created during recipe execution** for a specific issue.

### STM Purpose

STM stores:
- **Documents** — Specs, designs, analysis
- **Evidence** — Validation, tests, changes

### STM Lifecycle

```
Recipe starts
    │
    └── STM folder created: .phoenix-os/{issue}/
              │
              ├── L1 step 1 → Creates artifact
              │
              ├── L1 step 2 → Creates artifact
              │
              └── L1 step N → Creates artifact
    │
Recipe ends
    │
    └── STM persists for reference
```

### STM Organization

```
.phoenix-os/{issue}/
├── docs/           # Documentation artifacts
└── evidence/       # Implementation evidence
```

## Memory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LTM (Long-Term Memory)                   │
│  Created: At project setup                                  │
│  Contains: Practices, standards, templates                  │
│  Location: core/components/memory/                          │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    persist skill (STM → LTM)
                    (converts critical learnings)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    STM (Short-Term Memory)                  │
│  Created: When recipe starts                                │
│  Contains: Artifacts for this issue                         │
│  Location: .phoenix-os/{issue}/                             │
└─────────────────────────────────────────────────────────────┘
```

## STM → LTM Persistence

When a recipe completes, critical STM content can be persisted to LTM:

**Candidates for persistence:**
- Successful patterns discovered
- New learnings about codebase
- Reusable solutions
- Updated best practices

**Persistence flow:**
```
Recipe completes
    │
    └── Skill: persist
          │
          ├── Analyze STM for reusable knowledge
          ├── Extract patterns, learnings
          └── Update LTM with critical parts
```

## Memory in Recipe Execution

### L1 Recipe Memory Pattern

```
L1 Recipe
    │
    ├── Agent reads LTM:
    │     ├── practices/
    │     └── templates/
    │
    ├── Agent does work
    │
    └── Agent writes STM:
          └── artifact in .phoenix-os/{issue}/
```

### L2 Recipe Memory Flow

L2 recipes chain L1s, with each L1 reading from previous STM:

```
L2 Recipe
    │
    ├── L1: step 1 → STM: artifact A
    │
    ├── L1: step 2
    │       ├── Reads STM: artifact A
    │       └── STM: artifact B
    │
    └── L1: step 3
            ├── Reads STM: artifact B
            └── STM: artifact C
```

## Memory Location

Memory definitions are stored in:

```
core/components/memory/
├── practices/       # Guidelines, standards
├── templates/       # Output templates
└── tools/           # Tool-specific patterns
```

See: [docs/usage/memory/](../usage/memory/) for concrete implementations.

## Related Documentation

- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [Architecture Philosophy](../philosophy/architecture.md)
- [Recipes Component Guide](./phx-recipes.md)
