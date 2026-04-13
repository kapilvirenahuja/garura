# Memory

Meridian uses a dual memory architecture: Long-Term Memory (LTM) and Short-Term Memory (STM).

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

| Type | Lifecycle | Purpose | Authoring Location | Runtime Location |
|------|-----------|---------|---------------------|------------------|
| **LTM** | Project setup → persists | Practices, standards, templates | `core/components/memory/` | `~/.meridian/core/memory/` (global), `.meridian/core/memory/` (project) |
| **STM** | Play start → play end | Artifacts created during play | N/A | `.meridian/{issue}/` |

## Long-Term Memory (LTM)

LTM contains **project contextual information** that persists across all plays and sessions.

### LTM Purpose

LTM stores:
- **Standards** — Rules, conventions, quality criteria ("What are the rules?")
- **Formats** — Templates and output shapes ("What does the output look like?")
- **Knowledge** — Searchable reference material for design decisions ("What should I consider?")

### LTM Usage

Agents read from LTM to:
1. Follow established practices
2. Discover template paths to pass to skills
3. Apply tool-specific patterns
4. Maintain team conventions

Skills read from LTM only when agents explicitly pass them LTM paths — skills do not search LTM themselves.

```
Agent invoked
    │
    └── Context Crafting — reads LTM from ~/.meridian/core/memory/:
          ├── standards/{domain}/      # Cross-cutting rules and quality criteria
          ├── formats/{type}/          # User-facing message formats
          └── knowledge/{domain}/      # Design decisions and patterns
    │
    └── (Skill/play-specific templates are bundled with the owning component, NOT in LTM)
    │
    └── Passes LTM template paths to skill
    │
    └── Skill reads template, writes STM artifact
```

### LTM Organization

**Authoring (source of truth):**
```
core/components/memory/
├── standards/           # Rules, conventions, quality criteria (cross-cutting only)
│   ├── _index.md
│   ├── commits/         # Commit categorization and quality rules
│   ├── git/             # Branch naming + PR severity taxonomy
│   ├── agent-lifecycle/ # Epic management rules
│   ├── intent-schema.yaml          # Canonical intent.yaml contract
│   ├── knowledge-file-template.md  # Knowledge-file format
│   └── resolution-protocol.md      # R1–R4 LTM resolution
├── formats/             # User-facing message formats (issues, PRs, etc.)
│   ├── _index.md
│   └── github-issue.md
└── knowledge/           # Searchable reference material
    ├── _index.md
    └── architecture/

# Skill/play-specific schemas and templates live with the owning component:
#   core/components/skills/scope-roadmap-epics/reference/epic-schema.md
#   core/components/plays/briefs/templates/{*-brief.html, brief-common.css, brief-render.js, hub.html, fixtures/}
# Foundational architecture rules live in docs/adr/, not standards/.
```

**Deployment:**
- Source: `core/components/memory/`
- Global mode (default): `~/.meridian/core/memory/` (shared across all projects, deployed via `/sync-claude`)
- Project mode (ephemeral): `.meridian/core/memory/` (project-specific, deployed via `/sync-claude --project`, gitignored)

**Runtime (where agents read from):**
```
~/.meridian/core/memory/    # Global mode (default)
.meridian/core/memory/      # Project mode
```

### LTM Access Pattern (ADR 009)

Agents do NOT search LTM directly on behalf of skills. Instead, agents perform **Context Crafting**: they discover which LTM paths are relevant, then pass those paths to skills as explicit inputs.

```
Agent invoked (via JSON contract)
    │
    └── Context Crafting:
          ├── Reads intent.yaml at intent_path from contract
          ├── Reads STM artifacts at non-null stm.* paths
          └── Assembles LTM paths (e.g., taxonomy and rule paths from standards/)
                    │
                    ▼
          Skill invocation:
          └── Receives LTM template paths + STM artifact paths
                    │
                    ▼
          Skill reads template from LTM
          Skill fills template with content
          Skill writes artifact to STM
```

Skills receive template paths from agents — skills do NOT search LTM themselves. This boundary keeps skills narrow and testable: each skill knows how to use a template once given the path; it does not need to discover which template to use.

See [ADR 009: JSON Contract Pattern and Four Crafts Architecture](../adr/009-json-contract-four-crafts.md) for details on runtime LTM reads.

## Short-Term Memory (STM)

STM contains **artifacts created during play execution** for a specific issue.

### STM Purpose

STM stores:
- **Documents** — Specs, designs, analysis
- **Evidence** — Validation, tests, changes

### STM Lifecycle

```
Play starts
    │
    └── STM folder created: .meridian/{issue}/
              │
              ├── L1 step 1 → Creates artifact
              │
              ├── L1 step 2 → Creates artifact
              │
              └── L1 step N → Creates artifact
    │
Play ends
    │
    └── STM persists for reference
```

### STM Organization

```
.meridian/{issue}/
├── spec/           # Specifications, requirements
├── design/         # Technical design, architecture
├── evidence/       # Implementation evidence per play
│   └── {play-name}/
│       └── {YYYYMMDD-HHMMSS}.md
├── delivery/       # Delivery artifacts (PR details, release)
└── checkpoint/     # Play execution state per play
    └── {play-name}/
        └── {YYYYMMDD-HHMMSS}.md
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
│  Created: When play starts                                │
│  Contains: Artifacts for this issue                         │
│  Location: .meridian/{issue}/                               │
└─────────────────────────────────────────────────────────────┘
```

## STM → LTM Persistence

When a play completes, critical STM content can be persisted to LTM:

**Candidates for persistence:**
- Successful patterns discovered
- New learnings about codebase
- Reusable solutions
- Updated best practices

**Persistence flow:**
```
Play completes
    │
    └── Skill: persist
          │
          ├── Analyze STM for reusable knowledge
          ├── Extract patterns, learnings
          └── Update LTM with critical parts
```

## Memory in Play Execution

### Play Memory Pattern

```
Play
    │
    ├── Agent reads LTM:
    │     ├── standards/
    │     ├── formats/
    │     └── knowledge/
    │
    ├── Agent does work
    │
    └── Agent writes STM:
          └── artifact in .meridian/{issue}/
```

### Play Memory Flow

Plays chain other plays, with each reading from previous STM:

```
High-Order Play
    │
    ├── step 1 → STM: artifact A
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

**Authoring:** Memory is authored in:
```
core/components/memory/
├── standards/       # Rules, conventions, quality criteria
├── formats/         # Templates and output shapes
└── knowledge/       # Searchable reference material
```

**Runtime:** Agents read memory from:
- `~/.meridian/core/memory/` (global mode, default — shared across all projects)
- `.meridian/core/memory/` (project mode — project-specific)

See: [docs/usage/memory/](../usage/memory/) for concrete implementations.

## Related Documentation

- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 009: JSON Contract Pattern and Four Crafts Architecture](../adr/009-json-contract-four-crafts.md)
- [Architecture Philosophy](../philosophy/architecture.md)
- [Plays Component Guide](./plays.md)
