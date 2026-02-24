# ADR 009: Skill LTM Reads for Organizational Knowledge

## Status

Accepted

## Date

2026-02-23

## Context

ADR 007 established that skills must be self-contained at runtime — all knowledge embedded locally, never reading from LTM. This was designed to prevent path-coupling and ensure portability.

In practice, two issues emerged:

1. **Shared organizational knowledge gets duplicated** — `commit-categories.md` existed identically in both `analyze-changes/reference/` and `analyze-pr/reference/`. Any change required updating both copies with drift risk.

2. **Organizational knowledge ≠ skill knowledge** — Commit categories, issue templates, and quality standards are organizational decisions, not skill capabilities. When someone adopts Meridian and wants to customize commit categories, they're teaching the system their organizational standards — that's a Long-Term Memory (LTM) concern, not a skill concern.

3. **The deploy-time sync from ADR 007 was never built** — Memory overrides via `core/memory/skill-overrides/` were designed but not implemented. Skills were manually keeping copies in sync.

## Decision

Allow skills to read from LTM at runtime for **organizational knowledge** — standards, categories, templates, and references that are mutable by the user to customize system behavior.

### The Distinction

| Knowledge Type | Where It Lives | When Loaded | Examples |
|---------------|----------------|-------------|----------|
| **Skill behavior** | Skill-local (embedded) | Deployment | Process steps, output format, constraints |
| **Organizational standards** | LTM | Runtime | Commit categories, issue templates, quality rules, branching conventions |

### Rules

1. **Skill behavior stays embedded** — The process, output format, constraints, and workflow steps are part of the skill definition. These never move to LTM.

2. **Organizational standards come from LTM** — Content that an adopter would reasonably customize to teach the system their preferences lives in LTM and is referenced by path.

3. **LTM paths are stable conventions** — Skills reference LTM via well-known paths under `~/.meridian/core/memory/` (global) or `.meridian/core/memory/` (project). These paths are treated as API contracts.

4. **Failure is loud** — If an LTM reference file is missing, the skill fails visibly (file not found), not silently. This is acceptable because LTM is deployed via `/sync-claude`.

5. **No duplication** — When organizational knowledge is shared by multiple skills, it exists once in LTM. Skills reference the single source.

### LTM Reference Paths

```
~/.meridian/core/memory/
├── standards/               # Rules, conventions, quality criteria
│   ├── commits/
│   │   ├── categories.md    # Used by analyze-changes, analyze-pr, create-commit
│   │   └── quality-rules.md # Used by analyze-pr, create-commit
│   └── git/
│       └── branching.md     # Used by repo-orchestrator, setup-branch
├── formats/                 # Templates and output shapes
│   └── github-issue.md      # Used by manage-issue
└── knowledge/               # Searchable reference material
    └── architecture/
        └── evolutionary-scaling.md  # Application architecture decisions
```

**Note:** Framework protocols (intent-driven-recovery.md, structured-failure-protocol.md, recipe-structure.md) are NOT organizational knowledge — they are Meridian internals and live in `docs/framework/`.

### Skill Reference Pattern

Skills reference LTM with explicit load directives:

```markdown
## Process

1. **Categorize Each File**

   Load categories from: `~/.meridian/core/memory/standards/commits/categories.md`
```

Skills retain a `reference/` directory for skill-specific knowledge that is NOT organizational:

```
core/components/skills/{skill-name}/
├── SKILL.md              # Skill definition (behavior embedded)
├── reference/            # Skill-specific knowledge (NOT organizational)
│   └── risks.md          # Specific to this skill's domain
└── templates/            # Output format templates
    └── {output}.md
```

### What Stays Skill-Local

| Content | Reason |
|---------|--------|
| `risks.md` (analyze-changes) | Risk patterns are skill-specific detection logic |
| `branch-patterns.md` (analyze-pr) | Branch classification is skill-specific analysis |
| `quality-rules.md` (analyze-pr) | Rule evaluation logic is skill-specific (but rule content may migrate to LTM later) |
| `branching.md` (setup-branch) | Branch naming conventions used only by this skill |
| `github-issue.md` (manage-issue) | GitHub CLI reference is tool-specific, not organizational |
| Output templates | Output format is skill behavior |

### What Moves to LTM

| Content | LTM Path | Used By |
|---------|----------|---------|
| Commit categories | `~/.meridian/core/memory/standards/commits/categories.md` | analyze-changes, analyze-pr |
| Commit quality rules | `~/.meridian/core/memory/standards/commits/quality-rules.md` | analyze-pr |
| Branch naming | `~/.meridian/core/memory/standards/git/branching.md` | repo-orchestrator, setup-branch |
| Issue templates | `~/.meridian/core/memory/formats/github-issue.md` | manage-issue |
| Architecture reference | `~/.meridian/core/memory/knowledge/architecture/evolutionary-scaling.md` | tech-designer |

## Consequences

### Positive

- **Single source of truth** — Organizational standards exist once, referenced by many skills
- **Customizable** — Adopters change LTM to teach the system their standards without touching skills
- **No drift** — Shared knowledge can't get out of sync across skills
- **Clear contract** — The skill-behavior vs organizational-knowledge distinction is explicit

### Negative

- **Runtime path dependency** — Skills depend on LTM paths existing at runtime
- **Partial reversal of ADR 007** — Skills are no longer fully self-contained

### Mitigations

- LTM paths are stable conventions, treated as API contracts
- `/sync-claude` deploys LTM content to well-known paths
- Failure is loud (file not found), not silent
- Only organizational knowledge moves to LTM; skill behavior stays embedded

## Relationship to ADR 007

This ADR **partially supersedes** ADR 007. The core principle remains: skills should not have fragile external dependencies. But the line is redrawn:

- **ADR 007 said:** All knowledge is skill-local. No runtime LTM reads.
- **ADR 009 says:** Skill behavior is local. Organizational standards come from LTM.

The deploy-time sync mechanism from ADR 007 (`core/memory/skill-overrides/`) is retired. Skills read LTM directly for organizational knowledge.

## Related ADRs

- [ADR 007: Skill-Local References](./007-skill-local-references.md) — Partially superseded
- [ADR 005: Skills as Capabilities](./005-skills-as-capabilities.md)
- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
