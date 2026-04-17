# ADR 007: Skill-Local References with Deployment Sync

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


> **SUPERSEDED by [ADR 009](009-skill-ltm-reads.md).** Skills now read LTM paths directly at runtime instead of relying on deployment-time copy. Do not follow this ADR.

## Status

Superseded

## Date

2026-01-24

## Context

The original memory architecture considered two approaches for skills accessing domain knowledge (practices, patterns, standards):

1. **Skills read from LTM** — Skills reference paths like `core/memory/practices/git/commits.md`
2. **Agents inject context** — Agents read LTM and pass relevant content to skills

Both approaches have problems:

**Skills reading LTM directly:**
- Path changes break skills (e.g., `categorization.md` → `commits.md`)
- Skills become coupled to LTM structure
- Skills are supposed to be "stable" but change when paths change

**Agents injecting context:**
- Agents discover skills "on the fly" based on intent
- Agents don't know ahead of time which skills they'll use
- Agents don't know what memory each skill needs
- Creates complex coupling between agents, skills, and memory

## Decision

Adopt a **skill-local references with deployment-time sync** pattern:

### Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TIME                         │
│                                                             │
│   Memory (overrides)  ──► Meridian Deploy ──► Skills (local) │
│   core/memory/            checks & syncs     embedded refs  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      RUNTIME                                │
│                                                             │
│   Agent ──► Intent ──► discovers Skills ──► Skills read     │
│                        (on the fly)         LOCAL refs only │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Rules

1. **Skills embed their own references** — All knowledge a skill needs is local to the skill (in the skill file or skill directory)

2. **Memory contains overrides** — `core/memory/` can contain updated/customized versions of skill references

3. **Deployment syncs overrides** — When Meridian is deployed, it checks if memory has better references and copies them into skill-local locations

4. **Skills always read locally** — At runtime, skills never reach out to LTM; they read from their local embedded content

### What This Pattern Covers

This pattern applies to **domain knowledge** — practices, patterns, standards, and reference content that skills use to do their work.

| Type | Examples | Where It Lives | When Loaded |
|------|----------|----------------|-------------|
| Domain knowledge | Commit categories, quality rules, branch patterns | Skill-local `reference/` | Deployment |
| Memory overrides | Org-specific rules, custom categories | `core/memory/skill-overrides/` | Deployment (synced to skills) |

### What This Pattern Does NOT Cover

**Runtime configuration** (platform, base_branch, etc.) is NOT domain knowledge. It comes from `core/config.yaml` and is injected by agents at runtime.

| Type | Examples | Where It Lives | When Loaded | Who Loads |
|------|----------|----------------|-------------|-----------|
| Runtime config | `platform: github`, `base_branch: main` | `core/config.yaml` | Runtime | Agent injects |

**Why the distinction:**
- Domain knowledge is stable and can be "compiled in" at deployment
- Runtime config varies per environment and must be read at runtime
- Skills stay fast by not searching for files — everything is local or injected

### Skill Reference Structure

```
core/components/skills/
└── {skill-name}/
    ├── SKILL.md           # Skill definition with embedded references
    └── references/        # Optional: larger reference files
        ├── categories.md
        └── patterns.md
```

### Memory Override Structure

```
core/memory/
└── skill-overrides/
    └── {skill-name}/
        └── references/
            └── categories.md  # Overrides skill's local copy
```

### Deployment Behavior

1. Meridian deployment scans `core/memory/skill-overrides/`
2. For each override, check if skill exists in `core/components/skills/`
3. If skill exists, copy override content into skill's local references
4. Run `/sync-claude` to propagate to `.claude/skills/`

### Example

**Skill with local reference:**
```markdown
# analyze-changes

## Process

1. Categorize changes using local reference:

### Commit Categories

| Type | Description |
|------|-------------|
| feat | New feature |
| fix  | Bug fix |
...
```

**Memory override (optional):**
```markdown
# core/memory/skill-overrides/analyze-changes/references/categories.md

# Custom Commit Categories (Organization Override)

| Type | Description |
|------|-------------|
| feat | New feature |
| fix  | Bug fix |
| security | Security patches (org-specific) |
...
```

## Consequences

### Positive

- **Skills are self-contained** — No runtime dependencies on external paths
- **Agents don't need context injection** — Skills work without agent pre-loading
- **Supports "on the fly" skill discovery** — Agents can invoke any skill without knowing its memory needs
- **Memory remains source of truth for overrides** — Organizations can customize without editing skills
- **Consistent with existing patterns** — `/sync-claude` already syncs `core/components/` → `.claude/`

### Negative

- **Two locations for content** — Skills have defaults, memory has overrides; potential confusion
- **Deployment step required** — Developers must run deployment/sync after memory changes
- **Drift risk** — If sync is skipped, skills use stale content

### Mitigations

- CI/CD pipeline includes deployment sync step
- `/sync-claude` validates skill-memory consistency
- Documentation clearly states: "After editing memory overrides, run `/sync-claude`"

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 005: Skills as Capabilities](./005-skills-as-capabilities.md)
