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

L1 recipes are **atomic units** that produce artifacts and stop at conditional checkpoints.

**Properties:**
- Human OR model invocable
- Invoke ≤2 agents
- Always produce exactly one artifact
- Conditional checkpoint: auto-approve when risk is low; require human approval when risk warrants it

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

#### Auto-Approval Logic

L1 recipes evaluate risk criteria before presenting a checkpoint. When all criteria for low risk are met, the recipe auto-approves and proceeds without halting for user input. When any high-risk signal is present, the recipe requires explicit user approval (Tether/Vanish).

**Auto-approve when ALL of:**
- Single logical group or concern
- No sensitive files (credentials, secrets, env vars)
- No breaking changes
- Clear, unambiguous operation type
- Not a hotfix branch or high-risk context

**Require user approval when ANY of:**
- Multiple logical groups requiring separate decisions
- Sensitive files present
- Breaking changes detected
- Ambiguous or mixed operation types
- Hotfix branch or high-risk context

**RESUME mode:** When a recipe is resuming existing work rather than starting new work, the checkpoint is skipped entirely — the prior approval remains valid.

This model keeps low-risk, routine operations frictionless while surfacing human judgment exactly where it is needed.

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

| Agent | Domain | Role | Responsibility | Status |
|-------|--------|------|----------------|--------|
| `code-builder` | implementation | builder | Write code, implement features, fix bugs | Implemented |
| `tech-designer` | design | designer | Technical design, RCA, architecture | Implemented |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination | Implemented |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches | Implemented |
| `quality-validator` | quality | validator | Test, review, validate, quality gates | Planned |
| `workflow-guardian` | workflow | guardian | Validates approval bypass in L2 | Planned |

### Agent Principles

1. **One agent = one domain** (not one task)
2. **Judges, not executors** — agents make decisions
3. **Context sharing** — agents build and share context
4. **Skill autonomy** — agents decide which skills to apply

### Orchestrator Tool Restrictions

Recipes are orchestrators. They coordinate workflow by delegating to agents — they never execute domain work directly.

**Forbidden in recipes:** `Bash`, `Grep`, `Glob`, direct git commands, direct gh commands, or any tool that executes domain operations.

**What recipes own directly:** checkpoint writes, approval logic, STM initialization, artifact writes, evidence reports, and final user-facing output.

**What recipes delegate to agents:**
- Git operations (branch, commit, push, status) → `repo-orchestrator`
- Issue operations (create, resolve, link) → `project-orchestrator`
- Code implementation → `code-builder`
- Technical design and RCA → `tech-designer`
- Validation and quality gates → `quality-validator`

This boundary is not a style preference — it is an architectural rule. If a recipe executes git commands directly, the agent layer is bypassed and the audit trail breaks.

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
    ├── spec/                # Specifications, requirements
    ├── design/              # Technical design, architecture
    ├── evidence/            # Implementation evidence per recipe
    │   └── {recipe-name}/
    │       └── {YYYYMMDD-HHMMSS}.md
    ├── delivery/            # Delivery artifacts (PR details, release)
    └── checkpoint/          # Recipe execution state per recipe
        └── {recipe-name}/
            └── {YYYYMMDD-HHMMSS}.md
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

## Recovery Protocol

When an agent returns a structured failure, recipes apply a defined recovery loop rather than propagating the failure immediately.

**Recovery mechanics:**
1. Agent returns a failure with `domain_assessment.responsible_domain` indicating which agent can address it
2. Recipe invokes the responsible agent with fix context + original intent + retry metadata
3. Maximum 2 retry cycles per agent. After 2 failed retries, halt with full failure context for human intervention

**Retry context added to recipe context bundle:**
```yaml
retry:
  previous_failure: "{what_failed}"
  fix_applied: "{what was done to fix it}"
  attempt: {N}
```

**Recovery calls are exempt from the agent limit.** A recipe that normally invokes ≤2 agents may invoke additional recovery calls beyond that limit without violating the L1/L2 agent count rule. Recovery calls are not counted as new agent invocations for the purpose of the constraint.

Recovery reasoning is loaded from LTM: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`. This file defines the structured-failure-protocol that agents use to format their failure responses.

### Checkpoint Artifact Status Lifecycle

Every checkpoint artifact written to `.phoenix-os/{issue}/checkpoint/{recipe}/{timestamp}.md` follows a defined status lifecycle:

| Status | Meaning |
|--------|---------|
| `PENDING_APPROVAL` | Written; awaiting user decision |
| `APPROVED` | User responded Tether (or auto-approved) |
| `REJECTED` | User responded Vanish |

Recipes update the artifact status before proceeding to the next step. This creates an auditable record of every approval decision.

## Critical Rules

| Rule | Applies To | Rationale |
|------|------------|-----------|
| **Produces artifact** | L1 Recipes | Clean checkpoint boundaries |
| **Conditional checkpoint** | L1 Recipes | Auto-approve when risk is low; require user approval when risk signals are present |
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

## Intent Primacy and Recipe Evolution

### The Core Principle

**Intent is primary. Recipes are scaffolding.**

The objective of a recipe — what it achieves — is permanent. "Submit work for peer review with quality assurance" will always be a valid objective. But the workflow that fulfills that objective — pre-flight checks, analysis, checkpoint, execution, reporting — is not inherent to the objective. It is a prescribed sequence that exists because we cannot yet trust the system to derive it autonomously.

Recipes exist today because they provide the determinism needed to build trust on the path to autonomy. They are how we teach the system to walk before it runs.

### The Constraint Migration

The key insight is that properties currently baked into recipe structure will migrate over time to declarative constraints in the intent:

```
TODAY (structural)
────────────────────────────────────────────────────
Recipe prescribes:
  Step 0: Pre-flight checks
  Step 1: Analyze
  Step 2: Checkpoint (always — PRs are externally visible)
  Step 3: Execute
  Step 4: Report with evidence

Auditability = enforced by recipe steps
Predictability = enforced by prescribed sequence
Human oversight = enforced by checkpoint placement

FUTURE (declarative)
────────────────────────────────────────────────────
Intent declares:
  goal: "Submit work for peer review with quality assurance"
  constraints:
    - "Produce auditable evidence of every decision"
    - "Halt for human approval before externally visible actions"
    - "Verify environmental preconditions before work begins"

Auditability = constraint the system satisfies however it chooses
Predictability = emergent from intent + constraints + memory
Human oversight = constraint, not a hardcoded step
```

The objective has not changed. The system still creates a PR with a quality checklist, still produces evidence, still stops for approval when actions are externally visible. What changes is **who decides the workflow**: today the recipe author prescribes it; tomorrow the system derives it from intent + constraints + accumulated memory.

### The Evolution Path

| Phase | Recipe Role | Intent Role | Trust Level |
|-------|-----------|-------------|-------------|
| **Current** | Recipes prescribe every step and agent assignment | Intent defines the objective; recipes define the how | Low — system proves reliability through prescribed execution |
| **Lighter recipes** | Recipes define checkpoints and boundaries; agents choose their own workflow within steps | Intent drives agent behavior; recipes provide guardrails | Medium — system has demonstrated consistent execution |
| **Intent-driven** | Recipes are generated at runtime from intent + constraints + memory | Intent is the primary input; workflow is emergent | High — auditability and predictability are satisfied as constraints, not as structure |

### What Makes This Possible

The migration from structural to declarative depends on three capabilities maturing together:

1. **Memory depth** — LTM must be rich enough that the system knows *how* to satisfy "produce auditable evidence" without being told the specific artifact format and location. Today, recipes encode this knowledge. Tomorrow, memory carries it.

2. **Agent maturity** — Agents must reliably produce the same quality of output when given intent + constraints as when given prescribed steps. The current recipe structure is training data for this capability — every successful recipe execution demonstrates what "good" looks like for a given intent.

3. **Constraint expressiveness** — The intent schema must be expressive enough to capture properties like "halt for human approval before externally visible actions" as first-class constraints. The `reference/intent.yaml` externalization (see `create-pr` golden standard) is a step toward this — making constraints a first-class, extensible schema that can grow to encompass workflow-level properties.

### Why This Matters Now

The architectural decisions being made today — externalizing intent to `reference/intent.yaml`, making constraint references dynamic, keeping recipe structure declarative — are not just cleanup. They are **preparing the system for the point where recipes become optional**. An intent file that fully describes the objective, constraints, and failure conditions is already 80% of what a system needs to derive its own execution plan. The remaining 20% is trust — and that is built through the deterministic recipe executions happening now.

The lighter recipes can be tested first on mechanical operations (`commit-code`, `create-pr`) where the workflow is predictable and the failure modes are well-understood. Success there builds confidence for creative operations (`build-feature`, `design-feature`) where the workflow is more variable.

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [ADR 003: Guardian Approval](../adr/003-guardian-approval.md)
- [ADR 004: Agent Naming](../adr/004-agent-naming.md)
- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 007: Skill-Local References](../adr/007-skill-local-references.md)
- [ADR 008: Issue-Centric STM and NWWI](../adr/008-issue-centric-stm-and-nwwi.md)
