# Plan: Garura Architecture — Philosophy & ADRs

## Status: In Progress

### Implementation Progress
- [x] **Phase 0**: Create GitHub issues (7 stories) — PR N/A
- [x] **Phase 1**: Story 1 - Philosophy Update — PR #315
- [ ] **Phase 2**: Stories 2, 4, 5, 6, 7 (Parallel) — Pending PR #315 merge
- [ ] **Phase 3**: Story 3 - L2 fix-bug — Pending Phase 2

### Key Decisions Confirmed
1. **Deprecate specialist pattern** — Use SDLC roles (designer, builder) instead of bug-analyzer, bug-implementer
2. **Optional skill qualifiers** — Use qualifier only when multiple types exist (design-tech, design-ux)

## Objective

Update Garura philosophy documents, core architecture, and ADRs. **No implementation** — purely documentation.

---

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Philosophy documents | Play implementation |
| Core architecture definition | Skill implementation |
| ADRs | Code changes |
| Component-level documentation | Folder restructuring |

---

## Naming Convention Analysis (CLAUDE.md Conflicts)

### Current State Problem

CLAUDE.md documents one pattern but uses inconsistent examples:

| Documented Pattern | `{domain}-keeper` |
|--------------------|-------------------|
| Follows Pattern | `project-keeper`, `repo-keeper`, `deploy-keeper` |
| **Breaks Pattern** | `bug-analyzer`, `bug-implementer` ← uses `-analyzer`, `-implementer` |

### Three Patterns Were In Use (Too Many)

| Pattern | Type | Examples | Status |
|---------|------|----------|--------|
| `{domain}-keeper` | Domain Stewards | `project-keeper` | **KEEP** |
| `{role}` | SDLC Roles | `builder`, `validator` | **KEEP** |
| `{domain}-{action}er` | Specialists | `bug-analyzer` | **DEPRECATE** |

### Recommendations

1. **Consolidate to TWO patterns** (keepers + roles)
2. **Deprecate specialist pattern** — use SDLC roles instead
3. **Clear separation**: Keepers for external APIs, Roles for workflow execution
4. **Update CLAUDE.md** to fix inconsistency
5. **Skill qualifiers optional** — use when multiple types exist

### Migration

| Old (Deprecated) | New (SDLC Role) | Reason |
|------------------|-----------------|--------|
| `bug-analyzer` | `designer` | RCA is design work |
| `bug-implementer` | `builder` | Implementation is building |
| `test-keeper` | `validator` | Testing is validation |
| `grooming-keeper` | `orchestrator` | Refinement is coordination |

---

## Core Architecture

### Folder Structure (Proposed)

```
core/
├── plays/          # Was: commands/ — source plays (L1, L2, L3)
├── agents/           # Agent definitions (5 SDLC roles)
├── skills/           # True skills (model invocable)
└── memory/           # LTM — includes templates, practices, standards
    ├── practices/
    ├── templates/    # Output templates (skills read from here)
    └── tools/
```

**Note**: `core/commands/` → `core/plays/`. Templates moved into memory.

---

### Three-Layer Hierarchy

```
L2 Plays (High-Order)     User intent: fix-bug, code-microservice
        ↓
L1 Plays (Activities)     Atomic units: analyze-bug, design-fix, implement-fix
        ↓
Skills (Learned Capabilities)   Agent knowledge: write-java-code, create-selenium-tests
```

| Layer | Purpose | Invocability | Examples |
|-------|---------|--------------|----------|
| **L2 Plays** | Workflow chaining L1s | Human only | `fix-bug`, `code-microservice` |
| **L1 Plays** | Atomic activity → artifact → checkpoint | Human OR Model | `analyze-bug`, `design-fix` |
| **Skills** | Learned capabilities agents use | Model only (via agent) | `write-java-code`, `do-rca-analysis` |

### L1 Play Behavior

Every L1 play:
1. **Calls agent(s)** — agent does the work
2. **Agent produces artifact** — tangible output (RCA doc, code, test)
3. **Stops at checkpoint** — waits for human approval
4. **Clean boundary** — ready to chain into L2

```
L1 Play: analyze-bug
    │
    └── Invokes agent: tech-designer
              │
              └── Agent uses skills: do-rca-analysis
              │
              └── Agent produces: .garura/{issue}/docs/rca.md
    │
    └── CHECKPOINT: Present RCA for approval
```

### L2 Play Behavior

L2 plays chain L1 plays:
1. **Workflow** — sequences L1 plays
2. **Guardian agent** — validates if human approval can be skipped
3. **Hooks** — show progression between steps
4. **Non-stop work** — bypasses checkpoints when safe

```
L2 Play: fix-bug
    │
    ├── L1: analyze-bug → [Guardian: skip approval?] →
    ├── L1: design-fix → [Guardian: skip approval?] →
    ├── L1: implement-fix → [Guardian: skip approval?] →
    ├── L1: validate-fix → [Guardian: skip approval?] →
    └── L1: create-pr
```

### Critical Rules

| Rule | Applies To | Rationale |
|------|------------|-----------|
| **Produces artifact** | L1 Plays | Clean checkpoint boundaries |
| **Chains L1s** | L2 Plays | Workflow = sequence of atomic activities |
| **Guardian validates** | L2 Plays | Decides if human approval can be skipped |
| **Agent produces** | Artifacts | Agent does work, play orchestrates |
| **Learned capabilities** | Skills | Technology/methodology specific knowledge |

---

### Naming Conventions

| Component | Pattern | Examples |
|-----------|---------|----------|
| **L2 Plays** | `{action}-{object}` (high-order) | `fix-bug`, `code-microservice`, `create-feature` |
| **L1 Plays** | `{action}-{object}` (activity) | `analyze-bug`, `design-fix`, `implement-fix` |
| **Skills** | `{action}-{technology/methodology}` | `write-java-code`, `create-selenium-tests`, `do-rca-analysis` |
| **Agents** | `{domain}-{role}` | `code-builder`, `quality-validator`, `project-orchestrator` |

#### Play Naming (High-Order & Activities)

**L2 (High-Order)** — User intent, workflow:
- `fix-bug`, `code-microservice`, `create-feature`, `review-pr`

**L1 (Activities)** — Atomic units, produce artifacts:
- `analyze-bug`, `design-fix`, `implement-fix`, `validate-fix`, `create-pr`

#### Skill Naming (Learned Capabilities)

Skills = what agents LEARN (technology/methodology specific):

| Pattern | Examples |
|---------|----------|
| `{action}-{technology}-code` | `write-java-code`, `write-dotnet-code`, `write-python-code` |
| `{action}-{framework}-tests` | `create-selenium-tests`, `create-jest-tests`, `create-pytest-tests` |
| `do-{methodology}-analysis` | `do-rca-analysis`, `do-impact-analysis`, `do-dependency-analysis` |
| `apply-{pattern}` | `apply-tdd-pattern`, `apply-clean-architecture` |

**Key distinction:**
- Plays = activities (what to do)
- Skills = capabilities (how to do it)

#### Agent Naming — `{domain}-{role}` Pattern

All agents use `{domain}-{role}` pattern. 1 agent = 1 thing done perfectly.

| Domain | Role | Agent Name | Responsibility |
|--------|------|------------|----------------|
| code | builder | `code-builder` | Implements code, writes code |
| quality | validator | `quality-validator` | Validates, tests, reviews |
| tech | designer | `tech-designer` | Technical design, RCA, architecture |
| project | orchestrator | `project-orchestrator` | Project coordination, issues, tracking |
| repo | orchestrator | `repo-orchestrator` | Git operations, commits, branches |

**Guardian Agent:**
| Agent | Purpose |
|-------|---------|
| `workflow-guardian` | Validates if human approval can be skipped in L2 |

#### Right Granularity

| Too Narrow | Too Granular | Right Level |
|------------|--------------|-------------|
| `builder` | `bug-analyzer` | `code-builder` |
| `designer` | `bug-implementer` | `tech-designer` |
| `validator` | `test-writer` | `quality-validator` |

**Principle**: 1 agent = 1 domain expertise, not 1 task.

### Agent Roles (Domain-Specific)

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `code-builder` | code | builder | Write code, implement features, fix bugs |
| `quality-validator` | quality | validator | Test, review, validate, quality gates |
| `tech-designer` | tech | designer | Technical design, RCA, architecture decisions |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches, worktrees |
| `workflow-guardian` | workflow | guardian | Validates if human approval can be skipped |

**6 agents total** — each owns 1 domain perfectly.

---

## Memory Architecture

### Two Memory Types

| Type | Lifecycle | Purpose | Location |
|------|-----------|---------|----------|
| **LTM (Long-Term Memory)** | Project setup → persists | Practices, standards, templates | `core/memory/` |
| **STM (Short-Term Memory)** | Play start → play end | Artifacts created during play | `.garura/{issue_number}/` |

### STM Folder Structure

```
.garura/
└── {issue_number}/
    ├── docs/           # Specs, designs, plans created during play
    │   ├── spec.md
    │   ├── tech-design.md
    │   └── rca.md
    └── evidence/       # Implementation evidence
        ├── changes.md
        ├── tests.md
        └── validation.md
```

### Memory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LTM (Long-Term Memory)                   │
│  Created: At project setup                                  │
│  Contains: Practices, standards, templates, tech-stack      │
│  Location: core/memory/                                     │
│  Includes: Templates that skills read                       │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    Skill: persist (STM → LTM)
                    (converts critical learnings)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    STM (Short-Term Memory)                  │
│  Created: When play starts                                │
│  Contains: Artifacts (docs, evidence) for this issue        │
│  Location: .garura/{issue_number}/                      │
│  Lifecycle: Play execution                                │
└─────────────────────────────────────────────────────────────┘
```

### STM → LTM Persistence

When play finishes, `persist` skill converts critical parts to LTM:
- Successful patterns discovered
- New learnings about codebase
- Reusable solutions
- Updated best practices

```
Play completes
    │
    └── Skill: persist
          │
          ├── Analyze STM artifacts for reusable knowledge
          ├── Extract patterns, learnings
          └── Update LTM (core/memory/) with critical parts
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PLAYS                                │
│  Defined in skills, human invocable                         │
│  NEVER FORKED — steps/order to follow                       │
├─────────────────────────────────────────────────────────────┤
│  L1: ≤2 skill calls, human OR model invocable (simple)      │
│  L2: ≤5 agent calls (ideal 3), human only, with gates       │
│  L3: [Placeholder — not designed]                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    L1 → calls skills
                    L2 → invokes agents (with checkpoints)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      TRUE SKILLS                            │
│  Model invocable only                                       │
│  NOT forked — share agent context                           │
│  Reusable units with practices knowledge                    │
│  Stable — don't change over time                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    called by L1 plays OR agents
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        AGENTS                               │
│  Truly agentic — make ALL decisions                         │
│  Judges, not executors                                      │
│  Have context that needs sharing                            │
│  Called by L2 plays                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MEMORY                               │
│  Project contextual information                             │
│  Changes per project                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow Examples

### L1 Play Flow (Simple)
```
User invokes /commit (L1 Play)
    │
    └── Play calls ≤2 True Skills
              │
              └── Skills execute (model invocable, share context)
```

### L2 Play Flow (Complex)
```
User invokes /fix-bug (L2 Play)
    │
    ├── Play invokes Agent 1 (analyst)
    │         └── Agent makes decisions, calls true skills as needed
    │
    ├── ═══ HUMAN CHECKPOINT ═══
    │
    ├── Play invokes Agent 2 (implementer)
    │         └── Agent makes decisions, calls true skills as needed
    │
    ├── Play invokes Agent 3 (guardian)
    │         └── Agent reviews, makes judgment
    │
    └── ═══ HUMAN CHECKPOINT ═══
```

---

## GitHub Stories (7)

| # | Story | Issue | PR | Status |
|---|-------|-------|----|----|
| 1 | Update Garura philosophy to use skills | #308 | #315 | Complete |
| 2 | Create L1 play: commit-code | #309 | — | Pending |
| 3 | Create L2 play: fix-bug | #310 | — | Pending |
| 4 | Create L1 play: start-work (refactor) | #311 | — | Pending |
| 5 | Create L1 plays: GitHub issue ops (refactor) | #312 | — | Pending |
| 6 | Create meta-skills: Garura builder | #313 | — | Pending |
| 7 | Create meta-skill: Code review | #314 | — | Pending |

---

## Files to Create/Update (35 Total)

### Updates (2)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 1 | `README.md` | 3-layer hierarchy, new agent naming | Story 1 |
| 2 | `CLAUDE.md` | L1/L2 model, {domain}-{role} agents | Story 1 |

### Philosophy & Component Docs (5)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 3 | `docs/philosophy/architecture.md` | 3-layer hierarchy, guardian model | Story 1 |
| 4 | `docs/components/plays.md` | L1/L2 plays, chaining model | Story 1 |
| 5 | `docs/components/agents.md` | {domain}-{role} pattern, 6 agents | Story 1 |
| 6 | `docs/components/skills.md` | Learned capabilities, skill catalog | Story 1 |
| 7 | `docs/components/memory.md` | STM/LTM dual system | Story 1 |

### L1 Play Definitions (10)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 8 | `core/commands/garura/l1/analyze-bug.md` | Analyze bug, produce RCA | Story 3 |
| 9 | `core/commands/garura/l1/design-fix.md` | Create technical design | Story 3 |
| 10 | `core/commands/garura/l1/implement-fix.md` | Implement with tests | Story 3 |
| 11 | `core/commands/garura/l1/validate-fix.md` | Validate against quality gates | Story 3 |
| 12 | `core/commands/garura/l1/create-pr.md` | Create PR | Story 3 |
| 13 | `core/commands/garura/l1/commit-code.md` | Commit changes | Story 2 |
| 14 | `core/commands/garura/l1/start-work.md` | Start work on issue (refactor) | Story 4 |
| 15 | `core/commands/garura/l1/fetch-issue.md` | Fetch issue details (refactor) | Story 5 |
| 16 | `core/commands/garura/l1/record-issue.md` | Create/update GitHub issue (refactor) | Story 5 |
| 17 | `core/commands/garura/l1/record-subtasks.md` | Create subtasks for issue (refactor) | Story 5 |

### L2 Play Definitions (1)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 18 | `core/commands/garura/l2/fix-bug.md` | Chain L1s with guardian | Story 3 |

### Agent Definitions (6)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 19 | `core/agents/code-builder.md` | Code building agent | Story 1 |
| 20 | `core/agents/quality-validator.md` | Quality validation agent | Story 1 |
| 21 | `core/agents/tech-designer.md` | Technical design agent | Story 1 |
| 22 | `core/agents/project-orchestrator.md` | Project coordination agent | Story 1 |
| 23 | `core/agents/repo-orchestrator.md` | Repository operations agent | Story 1 |
| 24 | `core/agents/workflow-guardian.md` | Approval bypass guardian | Story 1 |

### Meta-Skills (5)
| # | File | Purpose | Story |
|---|------|---------|-------|
| 25 | `core/commands/garura/meta/mrd-create-play.md` | Create L1/L2 play | Story 6 |
| 26 | `core/commands/garura/meta/mrd-create-agent.md` | Create agent definition | Story 6 |
| 27 | `core/commands/garura/meta/mrd-create-skill.md` | Create skill definition | Story 6 |
| 28 | `core/commands/garura/meta/mrd-create-memory.md` | Create memory entry | Story 6 |
| 29 | `core/commands/garura/meta/mrd-review-code.md` | Garura code review | Story 7 |

### ADRs (6)
| # | File | Decision | Story |
|---|------|----------|-------|
| 30 | `docs/adr/001-three-layer-hierarchy.md` | L2 → L1 → Skills | Story 1 |
| 31 | `docs/adr/002-l1-checkpoint-model.md` | L1 = artifact + checkpoint | Story 1 |
| 32 | `docs/adr/003-guardian-approval.md` | Guardian validates approval bypass | Story 1 |
| 33 | `docs/adr/004-agent-naming.md` | {domain}-{role} pattern | Story 1 |
| 34 | `docs/adr/005-skills-as-capabilities.md` | Skills = learned tech/methodology | Story 1 |
| 35 | `docs/adr/006-memory-architecture.md` | STM/LTM dual system | Story 1 |

---

## Verification

### Documentation Checklist
After updates:
1. [x] README.md clearly explains architecture overview
2. [x] CLAUDE.md provides operational guidance (naming conventions fixed)
3. [x] Philosophy doc serves as detailed reference
4. [x] Component docs explain each component in detail
5. [ ] Play docs explain fix-bug (L2) and commit-code (L1)
6. [x] ADRs document all key decisions with rationale
7. [x] All documents consistent in terminology

### Consistency Checks
- [x] No references to deprecated `bug-analyzer`, `bug-implementer` in new docs
- [x] Agent naming follows TWO patterns only (keepers + roles)
- [ ] Skill names use optional qualifiers correctly
- [ ] Play names follow `{action}-{object}` pattern
- [x] All docs reference `core/commands/` (not `core/plays/`)

### Cross-Reference Validation
- [x] README.md ↔ CLAUDE.md use same terminology
- [x] ADRs reference component docs
- [ ] Play docs reference skill/agent docs

---

# Fix-Bug Play Design (L2)

## Overview

L2 play = workflow that chains L1 plays. Guardian validates if human approval can be skipped at each checkpoint.

## Play Metadata

```yaml
---
name: fix-bug
level: L2
invocable: human
description: Chains L1 plays for end-to-end bug fixing
l1-plays:
  - analyze-bug
  - design-fix
  - implement-fix
  - validate-fix
  - create-pr
---
```

## L2 Flow (Chained L1 Plays)

```
L2: fix-bug
    │
    ├── L1: analyze-bug ──────────────────────────┐
    │       Agent: tech-designer                  │
    │       Artifact: rca.md                      │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    │                          │
    │                          NO → STOP for human approval
    │
    ├── L1: design-fix ───────────────────────────┐
    │       Agent: tech-designer                  │
    │       Artifact: tech-design.md              │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    │
    ├── L1: implement-fix ────────────────────────┐
    │       Agent: code-builder                   │
    │       Artifact: code changes + tests        │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    │
    ├── L1: validate-fix ─────────────────────────┐
    │       Agent: quality-validator              │
    │       Artifact: validation-report.md        │
    │       └── CHECKPOINT ◄──────────────────────┤
    │                          │                  │
    │              [Guardian: skip?] ─── YES ─────┘
    │
    └── L1: create-pr
            Agent: repo-orchestrator
            Artifact: PR created
            └── DONE
```

## Guardian Logic

```
workflow-guardian evaluates at each checkpoint:
    │
    ├── Artifact quality meets threshold?
    ├── No security/breaking concerns?
    ├── Within risk tolerance?
    │
    └── ALL YES → Skip human approval
        ANY NO  → Stop for human approval
```

---

## L1 Play Definitions

### L1: analyze-bug

```yaml
---
name: analyze-bug
level: L1
invocable: human OR model
description: Analyze bug, produce RCA and solution options
agent: tech-designer
artifact: .garura/{issue}/docs/rca.md
---
```

**Flow:**
```
Input: issue_number
    │
    └── Agent: tech-designer
              │
              ├── Skill: do-rca-analysis
              │     - Investigate symptoms
              │     - Trace code paths
              │     - Identify root cause
              │
              └── Produces artifact:
                    - rca.md (root cause, evidence, solution options)
    │
    └── CHECKPOINT: Present RCA for approval
```

---

### L1: design-fix

```yaml
---
name: design-fix
level: L1
invocable: human OR model
description: Create technical design for the fix
agent: tech-designer
artifact: .garura/{issue}/docs/tech-design.md
requires: analyze-bug (RCA approved)
---
```

**Flow:**
```
Input: approved RCA
    │
    └── Agent: tech-designer
              │
              ├── Skill: apply-clean-architecture
              │     - Read architecture from LTM
              │     - Design fix approach
              │     - Define files to modify
              │
              └── Produces artifact:
                    - tech-design.md (approach, files, tasks)
    │
    └── CHECKPOINT: Present design for approval
```

---

### L1: implement-fix

```yaml
---
name: implement-fix
level: L1
invocable: human OR model
description: Implement the fix with tests
agent: code-builder
artifact: .garura/{issue}/evidence/implementation.md
requires: design-fix (design approved)
---
```

**Flow:**
```
Input: approved tech-design
    │
    └── Agent: code-builder
              │
              ├── Skills (based on tech stack):
              │     - write-java-code OR write-typescript-code
              │     - create-jest-tests OR create-pytest-tests
              │
              └── Produces artifact:
                    - implementation.md (files changed, tests added)
                    - Actual code changes
    │
    └── CHECKPOINT: Present implementation for approval
```

---

### L1: validate-fix

```yaml
---
name: validate-fix
level: L1
invocable: human OR model
description: Validate implementation against quality gates
agent: quality-validator
artifact: .garura/{issue}/evidence/validation.md
requires: implement-fix
---
```

**Flow:**
```
Input: implementation
    │
    └── Agent: quality-validator
              │
              ├── Skills:
              │     - run-tests
              │     - check-quality-gates
              │     - do-security-scan
              │
              └── Produces artifact:
                    - validation.md (test results, quality metrics)
    │
    └── CHECKPOINT: Present validation for approval
```

---

### L1: create-pr

```yaml
---
name: create-pr
level: L1
invocable: human OR model
description: Create PR with proper documentation
agent: repo-orchestrator
artifact: PR URL
requires: validate-fix (validation passed)
---
```

**Flow:**
```
Input: validated implementation
    │
    └── Agent: repo-orchestrator
              │
              ├── Actions:
              │     - Stage changes
              │     - Create commit(s)
              │     - Push branch
              │     - Create PR
              │
              └── Produces artifact:
                    - PR created and linked to issue
    │
    └── DONE (no checkpoint needed - PR is final deliverable)
```

---

## Agent Summary (5 SDLC Roles)

| Agent | SDLC Role | When Used |
|-------|-----------|-----------|
| **specifier** | Specifier | Fetch details, define requirements |
| **designer** | Designer | RCA, solution proposal, tech design |
| **builder** | Builder | Implementation, tests, docs |
| **validator** | Validator | Triage, quality gates, review |
| **orchestrator** | Orchestrator | Task breakdown, coordination |

**Total Agents: 5 (matches L2 limit)**

---

## Call Matrix: L2 → L1 → Agent → Skills

### Fix-Bug (L2) Call Matrix

| L1 Play | Agent | Skills Used |
|-----------|-------|-------------|
| **analyze-bug** | tech-designer | `do-rca-analysis`, `do-impact-analysis` |
| **design-fix** | tech-designer | `apply-clean-architecture` |
| **implement-fix** | code-builder | `write-{lang}-code`, `create-{framework}-tests`, `apply-tdd-pattern` |
| **validate-fix** | quality-validator | `run-tests`, `check-quality-gates`, `check-security-scan` |
| **create-pr** | repo-orchestrator | (git operations, not skills) |

### Commit-Code (L1) Call Matrix

| L1 Play | Agent | Skills Used |
|-----------|-------|-------------|
| **commit-code** | repo-orchestrator | (git operations, not skills) |

### Agent → Skills Ownership

| Agent | Domain | Skills |
|-------|--------|--------|
| **code-builder** | code | `write-java-code`, `write-typescript-code`, `apply-tdd-pattern` |
| **quality-validator** | quality | `run-tests`, `check-quality-gates`, `do-code-review` |
| **tech-designer** | tech | `do-rca-analysis`, `apply-clean-architecture` |
| **project-orchestrator** | project | (external APIs - GitHub, Azure DevOps) |
| **repo-orchestrator** | repo | (git operations) |
| **workflow-guardian** | workflow | (validation logic, not skills) |

---

## Skills (Learned Capabilities)

Skills = what agents LEARN. Technology/methodology specific knowledge.

### Skill Categories

| Category | Pattern | Examples |
|----------|---------|----------|
| **Coding** | `write-{language}-code` | `write-java-code`, `write-typescript-code`, `write-python-code` |
| **Testing** | `create-{framework}-tests` | `create-jest-tests`, `create-pytest-tests`, `create-selenium-tests` |
| **Analysis** | `do-{type}-analysis` | `do-rca-analysis`, `do-impact-analysis`, `do-dependency-analysis` |
| **Patterns** | `apply-{pattern}` | `apply-tdd-pattern`, `apply-clean-architecture`, `apply-solid-principles` |
| **Quality** | `check-{type}` | `check-quality-gates`, `check-security-scan`, `check-performance` |
| **Operations** | `run-{operation}` | `run-tests`, `run-build`, `run-lint` |

### Skills by Agent

| Agent | Skills |
|-------|--------|
| **code-builder** | `write-java-code`, `write-typescript-code`, `write-python-code`, `apply-tdd-pattern` |
| **quality-validator** | `run-tests`, `check-quality-gates`, `check-security-scan`, `do-code-review` |
| **tech-designer** | `do-rca-analysis`, `do-impact-analysis`, `apply-clean-architecture` |
| **project-orchestrator** | (uses external APIs, not skills) |
| **repo-orchestrator** | (uses git operations, not skills) |

### Key Distinction: Skills vs Actions

| Type | What It Is | Examples |
|------|------------|----------|
| **Skills** | Learned capability (how) | `write-java-code`, `do-rca-analysis` |
| **Actions** | Operation to perform (what) | Fetch issue, commit code, create PR |

**Agents use skills to perform actions.**

Example:
```
Agent: code-builder
Action: Implement the fix
Skills used: write-typescript-code, apply-tdd-pattern
```

---

## Memory Dependencies

| Memory Path | Used For |
|-------------|----------|
| `tools/github/issue-operations` | Bug tracker config |
| `practices/architecture/` | Tech design principles |
| `practices/tech-stack/` | Framework guidance |
| `practices/best-practices/` | Quality standards |
| `practices/bug-fixing/rca-guidelines` | RCA methodology |
| `practices/implementation/quality-gates` | Validation criteria |

---

## Validation Strategy

### Per-Step Validation
Every step has defined validation:
- Inputs validated before execution
- Outputs validated after execution
- Guardian validates implementation steps

### Checkpoint Validation
At each USER GATE:
- Completeness check
- Quality check
- User approval required

### Final Validation
Before PR creation:
- All tasks validated
- Self-review completed
- Guardian final review passed
- Evidence documented

---

## Full Completion Criteria

Play is complete only when:
1. RCA approved by user
2. Solution approved by user
3. All tasks implemented
4. All task validations passed
5. Evidence documented
6. Self-review completed
7. Guardian final review passed
8. PR created and linked to issue

---

# Commit-Code Play Design (L1)

## Overview

L1 play that intelligently commits uncommitted changes. Produces artifact (commit summary) and stops at checkpoint.

## Play Metadata

```yaml
---
name: commit-code
level: L1
invocable: human OR model
description: Analyze changes, group logically, create commits
agent: repo-orchestrator
artifact: .garura/{issue}/evidence/commits.md
---
```

## Flow

```
Input: uncommitted changes
    │
    └── Agent: repo-orchestrator
              │
              ├── Analyze changes:
              │     - Read uncommitted files (git status)
              │     - Find logical groupings
              │     - Read commit template from LTM
              │
              ├── Decision point:
              │     - Trivial? → Auto-commit
              │     - Complex? → CHECKPOINT for user review
              │
              └── Create commits:
                    - Generate messages per group
                    - Stage and commit each group
    │
    └── Produces artifact:
          - commits.md (commit hashes, messages, files)
    │
    └── CHECKPOINT: Present commit summary
```

## Agent Decision Matrix

| Condition | Action |
|-----------|--------|
| Single group, ≤5 files, no breaking changes | Auto-commit |
| Multiple groups | CHECKPOINT |
| >5 files | CHECKPOINT |
| Breaking changes detected | CHECKPOINT |
| Config/security files | CHECKPOINT |

## Completion Criteria

Play complete when:
1. All changes analyzed
2. Logical groupings determined
3. Commits created with proper messages
4. Artifact produced

---

# Implementation Workflow

## Phase 0: Create GitHub Stories

Before implementation, create 7 stories in GitHub. Each story = independent branch + worktree.

| # | Story | Description | Scope |
|---|-------|-------------|-------|
| 1 | **Update Garura philosophy to use skills** | ADRs, philosophy docs, component docs, agent definitions | Foundation |
| 2 | **Create L1 play: commit-code** | L1 play definition + agent integration | Standalone L1 |
| 3 | **Create L2 play: fix-bug** | L2 play + L1 plays it chains | Full workflow |
| 4 | **Create L1 play: start-work** | Refactor existing command to L1 model | Migration |
| 5 | **Create L1 plays: GitHub issue operations** | Refactor issue commands to L1 plays | Migration |
| 6 | **Create meta-skills: Garura builder** | Skills for building plays, agents, skills, memory | Meta |
| 7 | **Create meta-skill: Garura code review** | Code review skill for Garura patterns | Meta |

---

## Phase 1: Story Implementation Workflow

For EACH story, follow this workflow:

```
1. Create GitHub Issue (story)
       │
       ▼
2. Create branch from main
       │ Branch: feature/issue-{number}
       ▼
3. Create worktree
       │ worktree: ../worktrees/garura/issue-{number}
       ▼
4. Implement in worktree
       │
       ▼
5. Run code review
       │
       ▼
6. Create PR → Merge
       │
       ▼
7. Clean up worktree
```

---

## Implementation Order

| Order | Story | Dependencies |
|-------|-------|--------------|
| 1 | Philosophy update | None (foundation) |
| 2 | L1: commit-code | Story 1 (needs agent definitions) |
| 3 | L1: start-work | Story 1 (needs agent definitions) |
| 4 | L1: GitHub issue ops | Story 1 (needs agent definitions) |
| 5 | L2: fix-bug | Stories 1-4 (needs foundation + L1 patterns) |
| 6 | Meta: Garura builder | Story 1 (needs philosophy docs) |
| 7 | Meta: Code review | Story 1 (needs philosophy docs) |

**Parallelization:**
- Stories 2, 3, 4 can run in parallel after Story 1
- Stories 6, 7 can run in parallel after Story 1
- Story 5 (L2: fix-bug) waits for all L1 plays

---

## Task Dependency Graph

```
Phase 0: Create Issues (T0.1-T0.7) — All parallel
         │
         ▼
Phase 1: Story 1 (T1.1 → T1.25) — Foundation
         │
         ├─────────┬─────────┬─────────┬─────────┐
         ▼         ▼         ▼         ▼         ▼
Phase 2: Story 2   Story 4   Story 5   Story 6   Story 7
         (T2.1-7)  (T4.1-7)  (T5.1-9)  (T6.1-10) (T7.1-7)
         │         │         │
         └─────────┴─────────┘
                   │
                   ▼
Phase 3: Story 3 (T3.1 → T3.12) — L2 fix-bug
```

---

## Total Tasks: 67

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | 7 | Create GitHub issues |
| 1 | 25 | Philosophy update (foundation) |
| 2 | 34 | Parallel stories (2, 4, 5, 6, 7) |
| 3 | 12 | L2 fix-bug |

---

## Revision History

| Date | Change | By |
|------|--------|----|
| 2026-01-23 | Initial plan created | Claude |
| 2026-01-23 | Phase 0 complete: 7 GitHub issues created (#308-#314) | Claude |
| 2026-01-23 | Phase 1 complete: Story 1 implemented, PR #315 created | Claude |
