# Phoenix OS Architecture

This document describes the core architecture philosophy of Phoenix OS.

## Overview

Phoenix OS implements Fluidic SDLC through a **three-layer hierarchy** that separates workflow orchestration from activity execution and learned capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                        RECIPES                              │
│  Defined workflows, human invocable                         │
│  NEVER FORKED — steps/order to follow                       │
├─────────────────────────────────────────────────────────────┤
│  L1: ≤2 agent calls, human OR model invocable               │
│  L2: ≤5 agent calls (ideal 3), human only, with gates       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invoke
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        AGENTS                               │
│  Autonomous decision-makers                                 │
│  Read LTM for config/context                                │
│  Invoke skills to do work                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invoke
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SKILLS                               │
│  Model invocable only (via agents)                          │
│  Self-contained with local references                       │
│  Stable — don't change over time                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ produce
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MEMORY                               │
│  LTM: Practices, config (core/memory/, core/config.yaml)    │
│  STM: Artifacts per issue (.phoenix-os/{issue}/)            │
└─────────────────────────────────────────────────────────────┘
```

**Flow:** `Recipes → Agents → Skills → Artifacts`

## Three-Layer Hierarchy

### L2 Recipes (High-Order Workflows)

L2 recipes represent **user intent** and chain multiple L1 recipes together.

**Properties:**
- Human invocable only
- Chain ≤5 L1 recipes (ideal 3)
- Include guardian agent for approval decisions
- Enable non-stop work mode

**Examples:** `fix-bug`, `code-microservice`, `create-feature`

**Flow:**
```
L2: fix-bug
    │
    ├── L1: analyze-bug → [Guardian: skip?] →
    ├── L1: design-fix → [Guardian: skip?] →
    ├── L1: implement-fix → [Guardian: skip?] →
    ├── L1: validate-fix → [Guardian: skip?] →
    └── L1: create-pr
```

### L1 Recipes (Atomic Activities)

L1 recipes are **atomic units** that produce artifacts and stop at checkpoints.

**Properties:**
- Human OR model invocable
- Invoke ≤2 agents
- Always produce exactly one artifact
- Always stop at checkpoint for approval

**Examples:** `analyze-bug`, `design-fix`, `commit-code`

**Flow:**
```
L1 Recipe: analyze-bug
    │
    └── Invokes agent: tech-designer
              │
              └── Agent uses skills: do-rca-analysis
              │
              └── Agent produces: .phoenix-os/{issue}/docs/rca.md
    │
    └── CHECKPOINT: Present RCA for approval
```

### Skills (Learned Capabilities)

Skills are **technology/methodology-specific knowledge** that agents possess.

**Properties:**
- Model invocable only (via agents)
- NOT forked — share agent context
- Reusable across workflows
- Stable over time
- **Self-contained** — embed their own references locally

**Examples:** `write-java-code`, `create-jest-tests`, `do-rca-analysis`

### Skill-Memory Relationship

Skills use a **local references with deployment sync** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TIME                         │
│                                                             │
│   Memory (overrides)  ──► Phoenix Deploy ──► Skills (local) │
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

**Key principles:**

1. **Skills embed references locally** — All knowledge a skill needs is in the skill file or skill directory
2. **Memory contains overrides** — Organizations can customize skill behavior via `core/memory/skill-overrides/`
3. **Deployment syncs overrides** — Phoenix deployment copies memory overrides into skill-local locations
4. **Skills never read LTM at runtime** — Skills are self-contained; no external path dependencies

**Why this pattern:**

- Agents discover skills "on the fly" based on intent
- Agents don't know ahead of time which skills they'll use
- Agents shouldn't need to know what memory each skill needs
- Skills remain stable and self-contained

See [ADR 007: Skill-Local References](../adr/007-skill-local-references.md) for details.

## Agents

Agents are **autonomous decision-makers** with domain expertise.

### Agent Naming: `{domain}-{role}`

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `code-builder` | code | builder | Write code, implement features, fix bugs |
| `quality-validator` | quality | validator | Test, review, validate, quality gates |
| `tech-designer` | tech | designer | Technical design, RCA, architecture |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |
| `workflow-guardian` | workflow | guardian | Validates approval bypass in L2 |

### Agent Principles

1. **One agent = one domain** (not one task)
2. **Judges, not executors** — agents make decisions
3. **Context sharing** — agents build and share context
4. **Skill autonomy** — agents decide which skills to apply

## Memory Architecture

Phoenix OS uses a **dual memory system**:

### Long-Term Memory (LTM)

**Location:** `core/memory/`

**Contains:**
- Practices and standards
- Templates for artifacts
- Tool-specific patterns
- Architecture guidelines

**Lifecycle:** Project setup → persists indefinitely

### Short-Term Memory (STM)

**Location:** `.phoenix-os/{issue_number}/`

**Contains:**
- Documentation (specs, designs, RCA)
- Evidence (tests, validation)
- Checkpoints (recipe execution state for approval and resumption)

**Lifecycle:** Persists forever (version controlled audit trail)

**Principle:** NWWI (No Work Without an Issue) — all checkpoint-producing work must be associated with an issue. Enforcement point is `commit-code`: no commit without an issue ID.

### STM Folder Structure

```
.phoenix-os/
├── _pending/                # Temporary, pre-issue (two-phase write)
│   └── {timestamp}/
└── {issue_number}/
    ├── docs/                # Specs, designs, plans
    │   ├── spec.md
    │   ├── tech-design.md
    │   └── rca.md
    ├── evidence/            # Implementation evidence
    │   ├── changes.md
    │   ├── tests.md
    │   └── validation.md
    └── checkpoint/          # Recipe execution state
        └── {recipe-name}/
            └── {timestamp}.md
```

### Memory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LTM (Long-Term Memory)                   │
│  Created: At project setup                                  │
│  Contains: Practices, standards, skill overrides            │
│  Location: core/memory/                                     │
│  Role: Source of truth for organizational customizations    │
└─────────────────────────────────────────────────────────────┘
              │                               ▲
              │ Deployment sync               │
              │ (overrides → skills)          │ Skill: persist (STM → LTM)
              ▼                               │ (converts critical learnings)
┌─────────────────────────────────────────────────────────────┐
│                    SKILLS (Local References)                │
│  Contains: Embedded practices, patterns, standards          │
│  Location: core/components/skills/{skill}/                  │
│  Role: Self-contained at runtime                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    Skills produce artifacts
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STM (Short-Term Memory)                  │
│  Created: When recipe starts                                │
│  Contains: Artifacts (docs, evidence, checkpoint) per issue │
│  Location: .phoenix-os/{issue_number}/                      │
│  Lifecycle: Persists forever (audit trail)                  │
└─────────────────────────────────────────────────────────────┘
```

## Critical Rules

| Rule | Applies To | Rationale |
|------|------------|-----------|
| **Produces artifact** | L1 Recipes | Clean checkpoint boundaries |
| **Chains L1s** | L2 Recipes | Workflow = sequence of atomic activities |
| **Guardian validates** | L2 Recipes | Decides if human approval can be skipped |
| **Agent produces** | Artifacts | Agent does work, recipe orchestrates |
| **Learned capabilities** | Skills | Technology/methodology specific knowledge |
| **Never forked** | Recipes & Skills | Recipes are steps; skills share context |
| **NWWI** | Recipes | No Work Without an Issue — commit-code is the hard gate |

## Why This Architecture?

### Problem Solved

Traditional AI copilots are non-deterministic — same prompt, different results. This makes them unsuitable for enterprise use where:
- Consistency matters
- Quality must be predictable
- Human oversight is required
- Workflows must be auditable

### Phoenix OS Solution

1. **Deterministic workflows** — Recipes define exact steps
2. **Checkpoint model** — Human review at defined points
3. **Guardian bypass** — Non-stop work when safe
4. **Clear boundaries** — Artifacts mark completion
5. **Audit trail** — STM captures all decisions

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [ADR 003: Guardian Approval](../adr/003-guardian-approval.md)
- [ADR 004: Agent Naming](../adr/004-agent-naming.md)
- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 007: Skill-Local References](../adr/007-skill-local-references.md)
- [ADR 008: Issue-Centric STM and NWWI](../adr/008-issue-centric-stm-and-nwwi.md)
