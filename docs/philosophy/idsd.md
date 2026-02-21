# IDSD — Intent Driven Software Development

> **Scope**: Phoenix OS Methodology
> **Status**: Active
> **Last Updated**: 2026-02-21
> **Foundation**: IDD (Intent-Driven Development) — see `intent-driven-development.md`

## Overview

IDSD (Intent Driven Software Development) is the **methodology** that operationalizes IDD principles into a complete, enterprise-grade software development lifecycle within Phoenix OS.

**Analogy**: IDD is to IDSD as Agile is to Scrum. IDD defines the principles; IDSD defines how to follow them when building software with Phoenix OS.

**One-liner**: IDD principles operationalized into a complete AI-native SDLC.

Full IDSD build specification: `.claude/specs/idsd/idsd.md`

---

## IDD → Phoenix OS Mapping

### The 8 IDD Elements in IDSD

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN DOMAIN                                               │
│                                                             │
│  Element 1: Intent Layer ──────────► Recipes                │
│  Element 2: Signals ───────────────► Signals                │
│  Element 3: Orchestrated Intent ───► Recipe Levels (L1/L2)  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  AI DOMAIN                                                  │
│                                                             │
│  Element 4: Agents ────────────────► 8 Agents               │
│  Element 5: Memory ────────────────► LTM + STM              │
│  Element 6: Skills ────────────────► Skills                  │
│  Element 7: Context-Aware Decisions► Context Bundles         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HANDSHAKE                                                  │
│                                                             │
│  Element 8: Generation-Verification► DRAFT → VALIDATE →    │
│             Loops                    LOCKED + Gates         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| # | IDD Element (Principle) | IDSD Implementation (Phoenix OS) |
|---|------------------------|----------------------------------|
| 1 | Intent Layer | Recipes — L1 (≤2 agents), L2 (≤5 agents). Every recipe has IDD intent header (intent/constraints/failure_conditions). |
| 2 | Signals | User CLI invocations (`/build-feature`, `/commit-code`). All signals enter via recipes. |
| 3 | Orchestrated Intent | Recipe Levels (L1/L2). Three speeds: Fast (minutes), Planned (hours), Strategic (days). |
| 4 | Agents | 8 agents: product-strategist, specifier, designer, validator, code-builder, tech-designer, repo-orchestrator, project-orchestrator. Agent-first pattern. |
| 5 | Memory | LTM: `core/components/memory/` (practices, standards, templates). STM: `.phoenix-os/{issue}/` (per-issue work). |
| 6 | Skills | Bounded capabilities invoked by agents. Each skill has SKILL.md with input/output contracts. |
| 7 | Context-Aware Decisions | Context bundles ≤12K tokens. Audience separation (Tier 1/2/3). Agents read LTM + STM. |
| 8 | Generation-Verification | DRAFT → VALIDATE → LOCKED lifecycle. Verification gates per recipe. Evidence artifacts. Tether/Vanish checkpoints. |

### Element-to-Component Matrix

| # | IDD Element | Phoenix OS Component | Layer | Owner |
|---|-------------|---------------------|-------|-------|
| 1 | Intent Layer | Recipes | Orchestration | Human |
| 2 | Signals | Signals | Perception | System |
| 3 | Orchestrated Intent | Recipe Levels (L1/L2) | Orchestration | Human + System |
| 4 | Agents | Sub-Agents | Decision | AI |
| 5 | Memory | LTM + STM | Cognitive | AI (read), Human (LTM governance) |
| 6 | Skills | Skills | Capability | AI |
| 7 | Context-Aware Decisions | Context Bundles + Memory Federation | Cognitive | AI |
| 8 | Generation-Verification | Quality Gates + Validator Agent | Handshake | Human + AI |

---

## Two-Layer Intent Model

IDSD operates with two distinct intent layers. This is how IDD's Intent Layer principle manifests in practice when recipes handle both business goals and lifecycle operations.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: BUSINESS INTENT                                    │
│  Authored by: User (human) or upstream recipe output         │
│  When: At invocation time                                    │
│  Language: Business outcomes, user goals, domain constraints  │
│                                                               │
│  "Add a /users/export endpoint that returns CSV.              │
│   Must use existing auth middleware.                          │
│   Fail if endpoint accessible without valid token."           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: SDLC INTENT                                        │
│  Authored by: Framework author (once, at recipe design time)  │
│  When: Baked into the recipe definition                       │
│  Language: Lifecycle operations, process constraints           │
│                                                               │
│  "Build implementation code from a spec bundle or intent.     │
│   Must produce working code with unit tests.                  │
│   Fail if bundle exceeds 12K token budget."                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Who Authors | When | Stability | Example |
|-------|------------|------|-----------|---------|
| **Business Intent** | User or upstream recipe | Every invocation | Changes per feature | "Add CSV export with auth" |
| **SDLC Intent** | Framework author | Recipe creation (once) | Stable across all features | "Build implementation from intent or spec" |
| **Artifact Intent** | Generated by agents | During execution | Derived from business intent | vision.md carries business intent forward |

**The flow:**

```
User: /build-feature "Add CSV export with auth"
        │
        ▼
┌───────────────────────────────────────┐
│ Recipe: build-feature                  │
│                                       │
│ SDLC Intent (fixed in recipe):        │
│   "Build implementation from intent"  │
│   → Tells the recipe HOW to operate   │
│                                       │
│ Business Intent (from user):          │
│   "Add CSV export with auth"          │
│   → Tells the recipe WHAT to build    │
│                                       │
│ Recipe propagates BOTH to agents:     │
│   Agent receives SDLC context         │
│   (what lifecycle step this is)       │
│   + Business context                  │
│   (what the user actually wants)      │
└───────────────────────────────────────┘
        │
        ▼
Agent → Skill → Artifact
(artifact carries business intent forward)
```

**Why two layers matter:**

1. **Business intent is what users care about.** "Add CSV export" is the real goal. The user doesn't think about committing, branching, or verifying — those are lifecycle mechanics.

2. **SDLC intent is what recipes care about.** `commit-code` needs to know it should "stage and commit changes with conventional messages" regardless of whether the user built a CSV endpoint or fixed a bug.

3. **Generated artifacts carry business intent.** When `discover-product` creates `vision.md`, that document's intent header reflects the business goal, not the SDLC step. This is how business intent survives the full lifecycle — from discovery through delivery.

4. **The framework eats its own cooking.** SDLC recipes follow the same three-element pattern (intent/constraints/failure_conditions) that they enforce on generated artifacts. This is how the framework knows when to halt, what to propagate, and how to recover from failures.

**Key principle:** The user never writes SDLC intents — they express business goals in natural language. The framework structures this into intent/constraints/failure_conditions and propagates it through recipes, agents, and generated artifacts. SDLC intents are invisible to the user; they exist so the framework itself operates with the same intent-driven discipline it demands of its outputs.

---

## SDLC Phases

IDSD defines 8 SDLC phases (+ 2 cross-cutting):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                     start-feature (universal precursor)                       │
│                  NEW → create issue + branch                                  │
│                  RESUME → resolve existing issue, prepare env                 │
└──────────────────────────┬────────────────────────────────────────────────────┘
                           │
    ┌──────────────────────┼─────────────────────────┐
    │                      │                         │
    Fast (minutes)   Planned (hours)         Strategic (days)
    build-feature    start-planned-feature   full SDLC pipeline
    │                      │                         │
    ▼                      ▼                         ▼

Product-2-Design  Design-2-Spec  Spec-2-Code  Code-2-Test  Test-2-Run
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│discover-     │ │define-     │ │build-    │ │verify-   │ │create-pr │
│product       │ │feature     │ │feature   │ │feature   │ │deliver-  │
│plan-roadmap  │ │design-     │ │          │ │commit-   │ │feature   │
│manage-       │ │feature     │ │          │ │code      │ │release   │
│backlog       │ │create-     │ │          │ │review-pr │ │run-demo  │
│refine-       │ │wireframes  │ │          │ │          │ │          │
│backlog       │ │create-adr  │ │          │ │          │ │          │
└──────────────┘ └────────────┘ └──────────┘ └──────────┘ └──────────┘

Incident-2-Fix    Audit (cross-cutting)     Run-2-Learn (cross-cutting)
┌──────────────┐ ┌──────────────┐           ┌──────────────┐
│fix-bug       │ │review-arch   │           │run-retro     │
│hotfix        │ │audit-security│           │capture-      │
│              │ │audit-perf    │           │learning      │
│              │ │audit-a11y    │           │run-standup   │
└──────────────┘ └──────────────┘           └──────────────┘
```

| Phase | Focus | Example Recipes |
|-------|-------|-----------------|
| Product-2-Design | Discovery, vision, roadmap, backlog | discover-product, plan-roadmap, manage-backlog |
| Design-2-Spec | Feature definition, wireframes, ADRs | define-feature, create-wireframes, create-adr |
| Spec-2-Code | Implementation from spec or intent | build-feature |
| Code-2-Test | Verification, commits, review | verify-feature, commit-code, review-pr |
| Test-2-Run | Delivery, demos, releases | create-pr, deliver-feature, run-demo, release |
| Incident-2-Fix | Bug diagnosis and fix | fix-bug, hotfix |
| Audit (cross-cutting) | Architecture, security, perf review | review-architecture, audit-security |
| Run-2-Learn (cross-cutting) | Retrospectives, knowledge capture | capture-learning, run-retro |
| Docs (cross-cutting) | Documentation generation | generate-docs |

### Three Execution Speeds

| Speed | Duration | Entry Point | Example |
|-------|----------|-------------|---------|
| Fast | Minutes | build-feature | One intent → working code → commit |
| Planned | Hours | start-planned-feature | Design + build in one flow |
| Strategic | Days | Full SDLC pipeline | Product discovery → delivery |

All speeds start with `start-feature` (universal precursor).

---

## Phoenix OS Architecture

### Component Hierarchy

```
Recipes (L1/L2) → Agents → Skills → Memory (LTM + STM)
```

### Agent Taxonomy (IDSD-specific)

IDSD maps the AI Squad Framework roles to 8 concrete Phoenix OS agents:

| AI Squad Role | Phoenix OS Agent(s) | IDD Element |
|---------------|--------------------|----|
| Specifier | specifier, product-strategist | Element 4 |
| Designer | designer, tech-designer | Element 4 |
| Builder | code-builder | Element 4 |
| Validator | validator | Elements 4 + 8 |
| Orchestrator | repo-orchestrator, project-orchestrator | Elements 3 + 4 |

5 roles replace 12-16 traditional roles. AI handles execution; humans steer intent.

**Full agent roster:**

| Agent | Domain | Role | SDLC Phases |
|-------|--------|------|-------------|
| product-strategist | product | strategist | Product-2-Design |
| specifier | specification | specifier | Design-2-Spec, Docs |
| designer | design | designer | Design-2-Spec |
| validator | quality | validator | Code-2-Test, Test-2-Run, Audit |
| code-builder | implementation | builder | Spec-2-Code |
| tech-designer | design | designer | Design-2-Code, Incident-2-Fix, Audit |
| repo-orchestrator | repository | orchestrator | Universal |
| project-orchestrator | project | orchestrator | Universal |

### Memory Architecture (IDSD-specific)

```
┌─────────────────────────────────────────────────────────┐
│  LONG-TERM MEMORY (LTM)                                │
│  Persistent across sessions, branches, and projects     │
│  Set by Architects, deployed to all projects            │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Domain     │  │ Architecture │  │  Technology   │  │
│  │             │  │              │  │              │  │
│  │ Business    │  │ System design│  │ Tech stack   │  │
│  │ rules       │  │ decisions    │  │ decisions    │  │
│  │ Compliance  │  │ Integration  │  │ Coding       │  │
│  │ Industry    │  │ patterns     │  │ standards    │  │
│  │ patterns    │  │ API contracts│  │ Known        │  │
│  │             │  │              │  │ pitfalls     │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐                     │
│  │  Practices   │  │    Tools     │                     │
│  │             │  │              │                     │
│  │ Workflows   │  │ Tool-specific│                     │
│  │ Quality     │  │ patterns     │                     │
│  │ gates       │  │ (GitHub,     │                     │
│  │             │  │  Jira, etc.) │                     │
│  └─────────────┘  └──────────────┘                     │
│                                                         │
│  Storage: core/components/memory/{dimension}/           │
│  Deployed to: ~/.phoenix-os/core/memory/                │
│  Version controlled via Git repository                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SHORT-TERM MEMORY (STM)                                │
│  Session and branch-specific context                    │
│                                                         │
│  • Current branch state                                 │
│  • Active failures and RCA findings                     │
│  • In-progress changes and decisions                    │
│  • Generated specs (intermediate artifacts)             │
│  • Task context and evidence                            │
│  • Design documents for current workflow                │
│                                                         │
│  Storage: .phoenix-os/{issue}/                          │
│  Lifecycle: Branch-scoped, may be promoted to LTM       │
└─────────────────────────────────────────────────────────┘
```

Storage paths:
- LTM: `core/components/memory/{dimension}/` → deployed to `~/.phoenix-os/core/memory/`
- STM: `.phoenix-os/{issue}/` — per-issue, branch-scoped

### Audience Separation

Every IDSD artifact serves exactly one audience. Three tiers:

```
Tier 1: Human Review    → business-review.md, technical-design.md, ux-spec.md
Tier 2: Agent Bundles   → v{N}-backend.md, v{N}-frontend.md (≤12K tokens each)
Tier 3: Orchestration   → tasks.md, verify.md
```

- Tier 1 reviewed by humans BEFORE Tier 2 bundles are generated
- Tier 2 bundles are self-contained — agent reads ONE bundle, not all
- Tier 3 references bundle IDs, not full content

### Context Budget

| Scope | Max Tokens |
|-------|-----------|
| Single bundle | ≤12K |
| Gate subset per task | ≤3K |
| Task context | ≤2K |
| Total per agent task | ≤17K |

---

## IDSD Development Loop

The core development loop in IDSD:

```
1. start-feature          → Create/resume work context (issue + branch + STM)
2. [Speed-appropriate recipes] → Fast / Planned / Strategic track
3. commit-code            → Persist changes with conventional commits
4. create-pr / deliver-feature → Ship to target branch
5. capture-learning       → Promote patterns to LTM
```

---

## Artifact Lifecycle

```
DRAFT → VALIDATE → LOCKED
```

- `--phase draft`: Agent generates initial artifact
- `--phase validate`: Agent runs validation, returns issues/score/checklist
- `--phase lock`: Cascade sync → re-validate → set LOCKED

**Intent-sufficiency:** Upstream artifacts enrich, never block. If intent is clear, proceed. Any recipe can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied.

### Cascade Sync

Every derived artifact includes: `<!-- sync: source={path} hash={hash} generated={timestamp} -->`

Lock phase MUST run cascade-sync before setting LOCKED status.

| Recipe Phase | Calls cascade-sync | Context |
|-------------|-------------------|---------|
| Any `--phase lock` | YES (mandatory) | `spec_path` = current artifact directory |
| `implement-feature` start | YES (check_only=true) | Verify bundles not stale before building |

---

## Enterprise Wrapper

```
┌─────────────────────────────────────────────────────────────┐
│  PHOENIX INTERFACE (Enterprise Layer)                       │
│                                                             │
│  Governance        │ Quality Gates    │ Memory Federation   │
│  Policies,         │ Validation       │ LTM deployed to     │
│  guardrails,       │ checkpoints      │ all projects from   │
│  approval          │ between SDLC     │ central standards   │
│  workflows         │ phases           │ (set by Architect)  │
│                    │                  │                     │
│  Cognitive Engine  │ MCP Integration  │ Hive Mind (Tasks)   │
│  Context assembly  │ Tool-agnostic    │ Cross-agent         │
│  from LTM + STM   │ external access  │ coordination        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [IDD Principles](./intent-driven-development.md) — The foundational paradigm (8 Elements, Three Elements of Intent, Two-Layer Intent Model)
- [Philosophy](./philosophy.md) — Three Tenets of AI-Native SDLC
- [Design Principles](./principles.md) — Separation of Concerns, Explicit via Abstraction
- [Naming Conventions](./naming-conventions.md) — Recipe, Agent, and Skill naming patterns
- [AI Squad Framework](./AI_Squad_Framework_v1.docx) — Role definitions and transition paths
- IDSD Specification — `.claude/specs/idsd/idsd.md` — Full build spec with recipes, gates, tasks

---

**Author**: Kapil Viren Ahuja
**Version**: 1.0.0
**Last Updated**: 2026-02-21
**Status**: Active
