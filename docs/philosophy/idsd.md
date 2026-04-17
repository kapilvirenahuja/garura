# IDSD — Intent Driven Software Development

> **Scope**: Garura Methodology
> **Status**: Active
> **Last Updated**: 2026-04-15
> **Foundation**: IDD (Intent-Driven Development) — see `intent-driven-development.md`

## Overview

IDSD (Intent Driven Software Development) is the **methodology** that operationalizes IDD principles into a complete, enterprise-grade software development lifecycle within Garura.

**Analogy**: IDD is to IDSD as Agile is to Scrum. IDD defines the principles; IDSD defines how to follow them when building software with Garura.

**One-liner**: IDD principles operationalized into a complete AI-native SDLC.

Full IDSD build specification: `.claude/specs/idsd/idsd.md`

---

## IDD → Garura Mapping

### The 8 IDD Elements in IDSD

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN DOMAIN                                               │
│                                                             │
│  Element 1: Intent Layer ──────────► Plays                │
│  Element 2: Signals ───────────────► Signals                │
│  Element 3: Orchestrated Intent ───► Play Levels           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  AI DOMAIN                                                  │
│                                                             │
│  Element 4: Agents ────────────────► 19 Agents              │
│  Element 5: Memory ────────────────► KB + LTM + STM         │
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

| # | IDD Element (Principle) | IDSD Implementation (Garura) |
|---|------------------------|----------------------------------|
| 1 | Intent Layer | Plays — atomic (≤2 agents), high-order (≤5 agents). Every play has IDD intent header (intent/constraints/failure_conditions). |
| 2 | Signals | User CLI invocations (`/build-feature`, `/commit-code`). All signals enter via plays. |
| 3 | Orchestrated Intent | Play Levels. Three speeds: Fast (minutes), Planned (hours), Strategic (days). |
| 4 | Agents | 19 agents across 7 roles: code-builder, tech-designer, tech-architect, repo-orchestrator, project-orchestrator, feature-steward, quality-auditor, judge, eval-generator, engineering-manager, test-engineer, designer, doc-builder, product-keeper, market-analyst, knowledge-extractor, scriber, intent-crafter, intent-resolver. Agent-first pattern. |
| 5 | Memory | Three-layer memory: KB (`~/.garura/core/memory/`) — global org knowledge. LTM (`{product_base}`) — project-specific. STM (`{stm_base}/{issue}/`) — per-issue. Flow: KB → LTM → STM. |
| 6 | Skills | Bounded capabilities invoked by agents. Each skill has SKILL.md with input/output contracts. |
| 7 | Context-Aware Decisions | Context bundles ≤12K tokens. Audience separation (Tier 1/2/3). Agents read LTM + STM. |
| 8 | Generation-Verification | DRAFT → VALIDATE → LOCKED lifecycle. Verification gates per play. Evidence artifacts. Tether/Vanish checkpoints. |

### Element-to-Component Matrix

| # | IDD Element | Garura Component | Layer | Owner |
|---|-------------|---------------------|-------|-------|
| 1 | Intent Layer | Plays | Orchestration | Human |
| 2 | Signals | Signals | Perception | System |
| 3 | Orchestrated Intent | Play Levels | Orchestration | Human + System |
| 4 | Agents | Sub-Agents | Decision | AI |
| 5 | Memory | LTM + STM | Cognitive | AI (read), Human (LTM governance) |
| 6 | Skills | Skills | Capability | AI |
| 7 | Context-Aware Decisions | Context Bundles + Memory Federation | Cognitive | AI |
| 8 | Generation-Verification | Quality Gates + Validator Agent | Handshake | Human + AI |

---

## Two-Layer Intent Model

IDSD operates with two distinct intent layers. This is how IDD's Intent Layer principle manifests in practice when plays handle both business goals and lifecycle operations.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: BUSINESS INTENT                                    │
│  Authored by: User (human) or upstream play output         │
│  When: At invocation time                                    │
│  Language: Business outcomes, user goals, domain constraints  │
│                                                               │
│  "Add a /users/export endpoint that returns CSV.              │
│   Must use existing auth middleware.                          │
│   Fail if endpoint accessible without valid token."           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: SDLC INTENT                                        │
│  Authored by: Framework author (once, at play design time)  │
│  When: Baked into the play definition                       │
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
| **Business Intent** | User or upstream play | Every invocation | Changes per feature | "Add CSV export with auth" |
| **SDLC Intent** | Framework author | Play creation (once) | Stable across all features | "Build implementation from intent or spec" |
| **Artifact Intent** | Generated by agents | During execution | Derived from business intent | vision.md carries business intent forward |

**The flow:**

```
User: /build-feature "Add CSV export with auth"
        │
        ▼
┌───────────────────────────────────────┐
│ Play: build-feature                  │
│                                       │
│ SDLC Intent (fixed in play):        │
│   "Build implementation from intent"  │
│   → Tells the play HOW to operate   │
│                                       │
│ Business Intent (from user):          │
│   "Add CSV export with auth"          │
│   → Tells the play WHAT to build    │
│                                       │
│ Play propagates BOTH to agents:     │
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

2. **SDLC intent is what plays care about.** `commit-code` needs to know it should "stage and commit changes with conventional messages" regardless of whether the user built a CSV endpoint or fixed a bug.

3. **Generated artifacts carry business intent.** When `discover-product` creates `vision.md`, that document's intent header reflects the business goal, not the SDLC step. This is how business intent survives the full lifecycle — from discovery through delivery.

4. **The framework eats its own cooking.** SDLC plays follow the same three-element pattern (intent/constraints/failure_conditions) that they enforce on generated artifacts. This is how the framework knows when to halt, what to propagate, and how to recover from failures.

**Key principle:** The user never writes SDLC intents — they express business goals in natural language. The framework structures this into intent/constraints/failure_conditions and propagates it through plays, agents, and generated artifacts. SDLC intents are invisible to the user; they exist so the framework itself operates with the same intent-driven discipline it demands of its outputs.

---

## SDLC Phases

IDSD defines 8 phases (5 primary, 3 supporting):

```
Primary Phases (linear pipeline)
────────────────────────────────────────────────────────────────────────────────
Product-2-Spec    Spec-2-Design   Design-2-Code          Code-2-Test   Test-2-Run
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  ┌──────────┐  ┌──────────┐
│specify-     │  │design-exp   │  │  Epic Trinity    │  │commit-   │  │merge-pr  │
│product      │  │build-arch   │  │  prepare-epic    │  │code      │  │capture-  │
│             │  │             │  │  implement-epic  │  │create-pr │  │learning  │
│             │  │             │  │  validate-epic   │  │review-pr │  │          │
└─────────────┘  └─────────────┘  └──────────────────┘  └──────────┘  └──────────┘

Shortcuts:  /ship    — commit → PR → review → merge in one command
Bug path:   /fix-it  — RCA-driven defect resolution

Supporting Phases (continuous)
────────────────────────────────────────────────────────────────────────────────
Run-2-Monitor      Audit-2-Fix              Learn-2-Memory
┌──────────────┐  ┌──────────────┐          ┌──────────────┐
│fix-it        │  │quality-check │          │capture-      │
│              │  │(skill)       │          │learning      │
└──────────────┘  └──────────────┘          └──────────────┘
```

### Design-2-Code: The Epic Trinity

The Epic Trinity is the core implementation loop — three sequenced plays that carry a feature from locked design to verified code:

```
prepare-epic → implement-epic → validate-epic
     │               │                │
     ▼               ▼                ▼
LLD + plan +    TDD code +       E2E tests +
context pkg    unit tests +     QA verdict
               eval loop        ACCEPT/REJECT
```

#### Context Boundary

Each play has strict memory access rules enforced by the architecture:

| Play | Reads | Writes | Memory Constraint |
|------|-------|--------|------------------|
| `prepare-epic` | KB + LTM + STM | STM context package | Bridge layer: reads all sources, writes only to STM |
| `implement-epic` | STM ONLY | STM (code, tests, evidence) | **KB/LTM FORBIDDEN** |
| `validate-epic` | STM ONLY + deployed env | STM (QA verdict, evidence) | **KB/LTM FORBIDDEN** |

#### Dual-Level Verification

The Trinity enforces verification at two levels:

| Level | Play | Builder | Validator | Scope |
|-------|------|---------|-----------|-------|
| Unit | `implement-epic` | code-builder | judge | Unit tests, code quality, eval-driven TDD loop |
| System | `validate-epic` | implement-epic output | judge | E2E tests, scenario coverage, QA verdict (ACCEPT/REJECT) |

#### Outputs

| Play | Output Artifacts |
|------|----------------|
| `prepare-epic` | `tech.yaml` (LLD), `scenarios.yaml`, `plan.yaml`, `context/` package in STM |
| `implement-epic` | Working code, unit tests, eval evidence in STM |
| `validate-epic` | QA verdict (ACCEPT or REJECT), E2E test results, scenario coverage report |

### Planned Phase: Monitor-to-Design

> **Status**: Planned — Issue #217. Timeline: 18-24 months.

Monitor-to-Design closes the feedback loop from production back to the design phase:

```
Production monitoring signals (latency, errors, usage patterns)
        │
        ▼
Pattern correlation against KB + LTM
        │
        ▼
Auto-generated intent candidates
        │
        ▼
Human review and approval (Tether/Vanish)
        │
        ▼
Approved intents enter SDLC pipeline
```

This phase is the operational mechanism for IDD Hypothesis H1 (Memory-Driven Intent Self-Generation). It requires: production monitoring integration, pattern correlation capability, and well-formed intent generation from observed signals. None of these are currently designed.

**Why it matters**: Without Monitor-to-Design, the SDLC lifecycle is forward-only — humans author all intents. With it, the system can propose intents from production reality, moving IDSD from L3 (human-in-loop) toward L4 (spec-driven, where the system generates lightweight specs from observed patterns).

| Phase | Type | Focus | Example Plays |
|-------|------|-------|-----------------|
| Product-2-Spec | Primary | Product specification, scope, quality profile | specify-product |
| Spec-2-Design | Primary | UX design, architecture | design-exp, build-arch |
| Design-2-Code | Primary | Implementation from locked design | prepare-epic, implement-epic, validate-epic |
| Code-2-Test | Primary | Commits, PR creation, code review | commit-code, create-pr, review-pr |
| Test-2-Run | Primary | Merge, learning capture | merge-pr, capture-learning |
| Run-2-Monitor | Supporting | Post-deployment incident response | fix-it |
| Audit-2-Fix | Supporting | Quality audits | quality-check (skill) |
| Learn-2-Memory | Supporting | Knowledge capture, STM→LTM promotion | capture-learning |

### Intent Primacy

Speed is one dimension of execution. The other is **autonomy** — how much of the workflow is prescribed vs derived from intent.

Today, plays prescribe every step. This is deliberate: prescribed execution builds the trust and memory depth needed for autonomous execution. But the architecture is designed so that auditability, predictability, and human oversight — currently structural properties of plays — can migrate to declarative constraints in the intent schema over time.

The `reference/intent.yaml` externalization pattern (see `create-pr` as golden standard) is a concrete step toward this: intent as a first-class, extensible schema that can grow to encompass workflow-level properties. When the constraint schema is expressive enough and memory is deep enough, the system can derive its own execution plan from intent alone.

See [Intent Primacy and Play Evolution](./architecture.md#intent-primacy-and-play-evolution) for the full evolution path.

---

## Garura Architecture

### Component Hierarchy

```
Plays → Agents → Skills → Memory (LTM + STM)
```

### Agent Taxonomy (IDSD-specific)

IDSD maps the AI Squad Framework roles to 19 Garura agents across 7 roles — all implemented:

| Role | Garura Agent(s) | IDD Element |
|------|-------------------|----|
| Builder | code-builder | Element 4 |
| Designer | tech-designer, tech-architect, designer | Element 4 |
| Specifier | feature-steward, product-keeper | Element 4 |
| Validator | quality-auditor, judge, eval-generator, engineering-manager, test-engineer | Elements 4 + 8 |
| Orchestrator | repo-orchestrator, project-orchestrator | Elements 3 + 4 |
| Knowledge | knowledge-extractor, market-analyst, scriber | Elements 4 + 5 |
| Framework | doc-builder, intent-crafter, intent-resolver | Element 4 |

7 roles replace 12-16 traditional roles. AI handles execution; humans steer intent.

**Full agent roster:**

| Agent | Domain | Role | SDLC Phases |
|-------|--------|------|-------------|
| code-builder | implementation | builder | Design-2-Code |
| tech-designer | design | designer | Spec-2-Design, Run-2-Monitor, Audit-2-Fix |
| tech-architect | architecture | designer | Spec-2-Design |
| designer | UX | designer | Spec-2-Design |
| feature-steward | product | specifier | Product-2-Spec |
| product-keeper | product | specifier | Product-2-Spec |
| quality-auditor | quality | validator | Code-2-Test, Audit-2-Fix |
| judge | evaluation | validator | Design-2-Code (unit + system) |
| eval-generator | evaluation | validator | Design-2-Code |
| engineering-manager | quality | validator | Audit-2-Fix |
| test-engineer | testing | validator | Design-2-Code, Code-2-Test |
| repo-orchestrator | repo | orchestrator | Universal |
| project-orchestrator | project | orchestrator | Universal |
| knowledge-extractor | knowledge | knowledge | Learn-2-Memory |
| market-analyst | market | knowledge | Product-2-Spec |
| scriber | documentation | knowledge | Universal |
| doc-builder | documentation | framework | Universal |
| intent-crafter | intent | framework | Product-2-Spec |
| intent-resolver | intent | framework | Design-2-Code |

#### Compartmented Evaluation Classification

Under IDD Principle 4, agents are classified by their role in the information barrier:

| Classification | Agents | What They Receive | When Barrier Active |
|---------------|--------|-------------------|-------------------|
| **Builders** | code-builder, tech-designer | Goal + Constraints (no failure conditions) | In barrier-eligible plays |
| **Validators** | judge | Failure Conditions + Builder Output (no goal/constraints) | In barrier-eligible plays |
| **Neutral** | feature-steward, product-keeper, repo-orchestrator, project-orchestrator | Full intent (all elements) | Always — these agents perform mechanical or discovery operations |

**Dual-Level Implementation:**

| Level | Play | Builder | Validator |
|-------|------|---------|-----------|
| Unit | `implement-epic` | code-builder (generates code) | judge (evaluates against failure conditions) |
| System | `validate-epic` | implement-epic output (code under test) | judge (evaluates E2E scenarios) |

In barrier-exempt plays (commit-code, create-pr, etc.), all agents receive the full intent regardless of classification.

### Play Invocation Model Under Compartmented Evaluation

When a barrier-eligible play is invoked, the play orchestration layer splits the intent before routing to agents:

```
User invokes play with business intent
        │
        ▼
┌─────────────────────────────────────┐
│  PLAY ORCHESTRATION LAYER         │
│                                     │
│  1. Receive full intent             │
│     (goal + constraints + failure)  │
│                                     │
│  2. Classify play:                │
│     barrier-eligible? → split       │
│     barrier-exempt? → pass through  │
│                                     │
│  3. If barrier-eligible:            │
│     ┌────────────┐ ┌──────────────┐ │
│     │ Builder    │ │ Validator    │ │
│     │ gets:      │ │ gets:        │ │
│     │ goal +     │ │ failure_cond │ │
│     │ constraints│ │ + output     │ │
│     └─────┬──────┘ └──────┬───────┘ │
│           │               │         │
│           ▼               ▼         │
│     Build output → Validate →       │
│     symptom feedback loop           │
│           │                         │
│     Converge or escalate            │
└─────────────────────────────────────┘
        │
        ▼
Output (DRAFT → VALIDATE → LOCKED)
```

**Key rule:** The play orchestration layer is the ONLY component that ever sees the complete intent during barrier-eligible execution. Neither the builder nor the validator has the full picture — this is by design.

### Memory Architecture (IDSD-specific)

```
┌─────────────────────────────────────────────────────────┐
│  KNOWLEDGE BASE (KB)                                    │
│  Global org knowledge — persistent across all projects  │
│  Set by Framework authors, deployed globally            │
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
│  Deployed to: ~/.garura/core/memory/                  │
│  Version controlled via Git repository                  │
│                                                         │
│  ⛔ FORBIDDEN for implement-epic and validate-epic      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  LONG-TERM MEMORY (LTM)                                 │
│  Project-specific product artifacts                     │
│  Generated and consumed per product                     │
│                                                         │
│  • Locked product spec (specify-product)                │
│  • Locked UX design (design-exp)                        │
│  • Locked architecture (build-arch)                     │
│  • Epic context packages (prepare-epic)                 │
│                                                         │
│  Storage: {product_base} (.garura/product/)           │
│  Lifecycle: Product-scoped, grows per-epic              │
│                                                         │
│  ⛔ FORBIDDEN for implement-epic and validate-epic      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SHORT-TERM MEMORY (STM)                                │
│  Per-issue context — self-contained package             │
│                                                         │
│  • Context package assembled by prepare-epic            │
│  • Current branch state                                 │
│  • Active failures and RCA findings                     │
│  • In-progress code, tests, evidence                    │
│  • QA verdict from validate-epic                        │
│  • Task context and evidence                            │
│                                                         │
│  Storage: {stm_base}/{issue}/context/                   │
│  Lifecycle: Issue-scoped, promoted to LTM via           │
│             capture-learning                            │
└─────────────────────────────────────────────────────────┘
```

#### Context Boundary Rule

**`prepare-epic` is the boundary layer.** It is the only play in the Epic Trinity that reads from KB and LTM. It assembles a self-contained context package and writes it to STM. Once the context package exists in STM, `implement-epic` and `validate-epic` operate exclusively from it.

```
KB ──────────────────────────────────────────────────┐
                                                      ▼
LTM ─────────────────────────────────────► prepare-epic → context/ → STM
                                                      │
                                                      ▼
STM (context/) ──────────────────────────► implement-epic (STM ONLY)
                                                      │
                                                      ▼
STM (code + env) ────────────────────────► validate-epic (STM ONLY + deployed env)
```

This boundary is enforced by constraint, not convention: `implement-epic` and `validate-epic` receive STM paths only; KB and LTM paths are never passed to these plays.

#### KB Governance via Git

In IDSD, the KB is version-controlled in Git repositories. This provides natural infrastructure for governance:

**File-Level Conflict Resolution**: Competing changes to the same KB practice file surface as Git merge conflicts. Two developers capturing contradictory learnings about the same subsystem must resolve the conflict explicitly — Git's merge mechanism enforces this automatically.

**STM→KB Promotion Workflow**: Promotion follows a PR-based governance model with tiered review:

```
Developer captures learning (STM)
        │
        ▼
capture-learning play extracts pattern
        │
        ▼
draft-ltm-entry skill creates KB entry
        │
        ▼
PR created for review
        │
        ├── Project-level KB → Team leads review
        │   (e.g., "this service uses connection pooling")
        │
        └── Org-level KB → Engineering leaders / CTOs review
            (e.g., "all services use structured JSON logging")
        │
        ▼
Merged → deployed to ~/.garura/core/memory/ via /sync-claude
```

**Semantic Conflict Detection**: Git catches file-level conflicts, but not semantic contradictions (e.g., one practice says "always use retry logic" while another says "never retry inside transactions"). The `capture-learning` play is designed with an `extract-patterns` skill that should detect semantic overlap with existing KB entries — but this capability is not yet built. Current state: manual review during PR process.

**Cross-Developer Visibility**: All KB changes are visible in the Git history. All STM artifacts are committed to feature branches and visible via GitHub (issues, branches, PRs). The NWWI (No Work Without Issue) gate ensures every piece of work is trackable.

#### Memory Evolution Trajectory

> **Status**: Concept to early design. Timeline: 12-24 months.

The current Git-based KB architecture is the foundation. The evolution path:

| Stage | Storage | Access | Search | Status |
|-------|---------|--------|--------|--------|
| **Stage 1** (current) | Git repository files | File read at agent context assembly | File path + glob patterns | Implemented |
| **Stage 2** | Git + MCP server | MCP protocol | Keyword + structured query | Concept — 6-12 months |
| **Stage 3** | Server-based + semantic index | MCP + API | Semantic search (vector embeddings) | Concept — 12-18 months |
| **Stage 4** | Federated (org-wide) | MCP + API + federation protocol | Cross-project semantic search | Vision — 18-24 months |

Each stage is additive — Stage 2 does not replace Stage 1; it adds a server layer on top of the same Git-backed storage. This means the core KB format (markdown files in Git) remains the source of truth throughout evolution.

**KB Quality & Decay**: As the KB grows beyond the 20-file audit threshold (IDD P5), automated quality mechanisms become necessary:
- **Freshness scoring**: Track when each KB entry was last validated against production reality
- **Relevance decay**: Flag practices that haven't been referenced by agents in N months
- **Contradiction detection**: Semantic analysis of KB entries for conflicting guidance

Status: Planned, not designed. Currently relies on manual PR review and the P5 hygiene rule.

Storage paths:
- KB: `core/components/memory/{dimension}/` → deployed to `~/.garura/core/memory/`
- LTM: `{product_base}` (`.garura/product/`) — project-specific, product-scoped
- STM: `{stm_base}/{issue}/` — per-issue, branch-scoped

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

Token budgets are directional targets, not hard constraints. They exist to keep context focused and prevent agents from receiving irrelevant information.

| Scope | Target |
|-------|--------|
| Single bundle | ≤12K tokens |
| Gate subset per task | ≤3K tokens |
| Task context | ≤2K tokens |
| Total per agent task | ≤17K tokens |

### Play-to-Agent Context Bundle

Plays pass context to agents as a structured contract. There are two patterns in use, depending on play generation:

**JSON Contract pattern (current — plays authored after ADR 009):**

Newer plays use a JSON contract as the entire agent prompt. This is the current standard for play-driven workflows. The contract is a single JSON object that flows play → agent → skill → agent → play, growing as each agent populates artifact paths.

```json
{
  "intent_path": "<path to reference/intent.yaml>",
  "stm_base": "<base STM directory>",
  "slug": "<workflow instance identifier>",
  "stm": {
    "vision_path": "<input>",
    "epics_path": null,
    "feasibility_path": null,
    "brief_path": null,
    "approved_brief_path": null,
    "roadmap_path": null,
    "engineering_view_path": null
  },
  "checkpoints": [{ "name": "<gate>", "status": "pending" }],
  "evidence": [{ "name": "<play-name>", "location": null }],
  "notes": [],
  "step_failure": null
}
```

The JSON contract IS the entire agent prompt — no instructions, field definitions, or prose are appended. Agents read `reference/intent.yaml` at `intent_path` to understand goal, constraints, failure conditions, and scenarios. See `plan-roadmap` as the reference implementation and [Four Crafts Architecture](./architecture.md#four-crafts-architecture) for the full pattern.

**YAML context bundle pattern (earlier plays):**

Earlier plays pass a YAML context block. This pattern is still valid for plays not yet migrated to the JSON contract.

**Intent externalization:** Both patterns externalize the intent schema to `reference/intent.yaml` as a first-class file. Context bundles reference this file dynamically — agent context blocks never hardcode constraint IDs. This means adding new constraints to `intent.yaml` is automatically picked up by all agent invocations without modifying play files. See `create-pr` as a reference implementation of this pattern.

**YAML bundle structure:**
```yaml
---
Play context:
  intent: "{SDLC intent — what this play step is trying to achieve}"
  pre_flight: {all results from Step 0}      # Dynamic — passed as a set, not enumerated
  task: "{Specific task this agent invocation must perform}"
  mode: "{NEW | RESUME | null}"              # When applicable
  input: "{User input or upstream artifact}" # When applicable
  issue_number: {integer}                    # When known
  parent: {parent_issue_number or null}      # When applicable
  behavioral_constraints: {all behavioral constraints from reference/intent.yaml}  # Dynamic reference
```

**Pre-flight context (Step 0 — dynamic):**
```yaml
---
Play context:
  intent: "Verify preconditions before execution"
  task: "Read `reference/intent.yaml`. Run every check in `constraints.pre_flight`.
         Return pass/fail for each. Do NOT halt — just return results."
```

The agent reads the intent file and runs all pre-flight checks. The orchestrator validates results and halts on any failure using the constraint's `halt_message` from the intent file.

**On retries, add to either contract type:**
```yaml
  retry:
    previous_failure: "{what the agent returned that failed}"
    fix_applied: "{what was changed to address the failure}"
    attempt: {N}
```

**Rules for context bundles (both patterns):**
- Reference `reference/intent.yaml` dynamically — never hardcode constraint IDs
- Always pass `pre_flight` results so the agent knows what has already been verified
- Pass behavioral constraints as a dynamic set from `reference/intent.yaml`, not enumerated
- Agent boundaries must be enforced: pass only what the agent's domain covers

---

## Recovery Protocol

When an agent returns a structured failure during play execution, IDSD applies a defined recovery loop before surfacing the failure to the human.

### Structured Failure Protocol

Agents are expected to return failures in a structured format that enables the play to route recovery correctly:

```yaml
failure:
  type: "{error_type}"
  message: "{what went wrong}"
  domain_assessment:
    responsible_domain: "{repo-orchestrator | project-orchestrator | code-builder | ...}"
    fix_hint: "{what the responsible agent should try}"
```

The `domain_assessment.responsible_domain` field tells the play which agent to invoke for recovery.

### Recovery Loop

```
Agent returns structured failure
        │
        ▼
Play reads domain_assessment.responsible_domain
        │
        ▼
Play invokes responsible agent with:
  - fix context
  - original intent
  - retry metadata (attempt N, previous failure, fix applied)
        │
        ▼
Max 2 retry cycles per agent
        │
        ├── Success → continue workflow
        └── 2 retries exhausted → HALT with full failure context
```

### Recovery and the Agent Limit

Plays invoke ≤2 distinct agents. **Recovery calls are exempt from this limit.** A play in recovery may invoke an agent beyond the normal agent count without violating the play constraint. Recovery is a first-class mechanism, not an exception to the architecture.

### Recovery Reasoning in LTM

Recovery reasoning is loaded from: `docs/framework/intent-driven-recovery.md`

This file contains the recovery reasoning loop and domain-routing logic. Keeping this centralized — rather than embedding it in each play — allows recovery behavior to be updated without modifying individual plays. The structured failure protocol is at `docs/framework/structured-failure-protocol.md`.

---

## Intent Complexity Scoring in IDSD

ICS (defined in IDD — see `intent-driven-development.md`) is operationalized in IDSD as an agent-level assessment that runs during P7 (Verify Understanding) before any agent begins execution.

### Where ICS Runs in the Pipeline

```
Play invoked with business intent
        │
        ▼
Agent receives intent from play
        │
        ▼
┌─────────────────────────────────┐
│  ICS ASSESSMENT (agent step)    │
│                                 │
│  1. Restate intent (P7)         │
│  2. Score 6 ICS dimensions      │
│     (incl. Barrier Integrity    │
│     per P4)                     │
│  3. Determine balance profile   │
│                                 │
│  Balanced → proceed             │
│  Non-Balanced → checkpoint      │
└─────────────────────────────────┘
        │
        ▼
Agent begins execution
```

### IDSD-Specific ICS Rules

- ICS runs on **business intents**, not SDLC intents (SDLC intents are framework-authored and pre-validated)
- ICS is mandatory for agents in **Spec-2-Code** and **Design-2-Spec** phases (where intent ambiguity is most costly)
- ICS is optional for mechanical plays (`commit-code`, `create-pr`) per P7's "when to skip" guidance
- ICS results are written to STM as evidence: `.garura/{issue}/ics-assessment.md`
- Non-Balanced profiles generate a checkpoint; the human can override with Tether or request decomposition
- For barrier-eligible plays, ICS includes a 6th dimension: **Barrier Integrity** — whether the constraint-failure partition is correctly classified per P4's Classification Rule. Misclassified items trigger the "Barrier Compromised" profile.

### Future: ICS in Learn-2-Memory

As the Learn-2-Memory phase matures, ICS data becomes a training signal:

- Historical ICS profiles per author reveal growth patterns
- Frequently triggered profiles (e.g., "Intent-Heavy" on 60% of intents) surface coaching opportunities
- ICS pass rates contribute to P8 (Measure Intent Health) signals

---

## Compartmented Evaluation

Compartmented evaluation operationalizes IDD Principle 4 (Builders and Validators Must Not Share Context) in IDSD. It establishes an information barrier between builder and validator agents to prevent Goodhart's Law — where builders optimize for passing specific checks rather than genuinely solving the problem.

### The Information Barrier

The play orchestration layer splits the intent and routes each element to the correct agent:

```
┌───────────────────────────────────────────────────┐
│                PLAY (Orchestrator)                │
│                                                     │
│  Receives full intent:                              │
│    • Goal                                           │
│    • Constraints                                    │
│    • Failure Conditions                             │
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐        │
│  │                 │    │                 │        │
│  │  BUILDER AGENT  │    │ VALIDATOR AGENT │        │
│  │                 │    │                 │        │
│  │  Receives:      │    │  Receives:      │        │
│  │  • Goal         │    │  • Failure      │        │
│  │  • Constraints  │    │    Conditions   │        │
│  │  • LTM context  │    │  • Builder      │        │
│  │                 │    │    Output       │        │
│  │  Does NOT see:  │    │  • LTM context  │        │
│  │  • Failure      │    │                 │        │
│  │    Conditions   │    │  Does NOT see:  │        │
│  │                 │    │  • Goal         │        │
│  │                 │    │  • Constraints  │        │
│  └────────┬────────┘    └────────┬────────┘        │
│           │                      │                  │
│           │   Builder Output     │                  │
│           │ ────────────────────►│                  │
│           │                      │                  │
│           │  Symptom Feedback    │                  │
│           │ ◄────────────────────│                  │
│           │                      │                  │
│  Max 3 iterations, then escalate to human          │
└───────────────────────────────────────────────────┘
```

| Why It Matters | Without Barrier | With Barrier |
|----------------|----------------|--------------|
| **Builder behavior** | Optimizes for known checks (Goodhart's Law) | Optimizes for the actual goal |
| **Validator independence** | May rationalize builder's approach because it knows the goal | Evaluates output purely against failure conditions |
| **Feedback quality** | "You violated FC-3" (condition-based) | "Line 47 has a hardcoded connection string" (symptom-based) |
| **Convergence** | Fast but shallow — builder games the checks | Slower first iteration, but genuine fixes |

### Barrier-Eligible vs Barrier-Exempt Plays

Not all plays benefit from compartmented evaluation. The barrier applies to plays where the builder makes judgment calls. Mechanical plays use a single-agent model.

| Play | Barrier? | Reasoning |
|--------|----------|-----------|
| prepare-epic | ✓ Eligible | Designer makes architectural and LLD decisions |
| implement-epic | ✓ Eligible | Builder makes design and implementation decisions |
| validate-epic | ✓ Eligible | Judge evaluates implement-epic output against scenarios |
| fix-it | ✓ Eligible | Builder chooses fix strategy |
| specify-product | ✗ Exempt | Product specification — outputs are human-reviewed before implementation |
| design-exp | ✗ Exempt | UX design — outputs are human-reviewed before implementation |
| build-arch | ✗ Exempt | Architecture — outputs are human-reviewed before implementation |
| commit-code | ✗ Exempt | Mechanical — deterministic output |
| create-pr | ✗ Exempt | Mechanical — deterministic output |
| review-pr | ✗ Exempt | Review IS validation — agent is already the validator |
| merge-pr | ✗ Exempt | Mechanical — deterministic output |

### Agent Roles in Compartmented Evaluation

| Agent | Role in Barrier | Sees Goal+Constraints | Sees Failure Conditions | Notes |
|-------|----------------|----------------------|------------------------|-------|
| code-builder | Builder | ✓ | ✗ | Primary builder — implement-epic (unit level) |
| tech-designer | Builder | ✓ | ✗ | Builder for design decisions — prepare-epic |
| judge | Validator | ✗ | ✓ | Validator at both unit (implement-epic) and system (validate-epic) levels |
| feature-steward | Neutral | ✓ | ✓ | Operates at discovery level — no barrier needed |
| product-keeper | Neutral | ✓ | ✓ | Product specification — no barrier needed |
| repo-orchestrator | Neutral | ✓ | ✓ | Mechanical operations — no barrier needed |
| project-orchestrator | Neutral | ✓ | ✓ | Coordination operations — no barrier needed |

### Symptom-Based Reporting

When the validator identifies issues, it reports symptoms — what the output does wrong — not condition identifiers.

**Correct (symptom-based):**
```
"The processPayment() function does not handle the case where
 the payment gateway returns a timeout response."

"The API response for /users/export includes raw SQL column names
 instead of human-readable field labels."

"The test file imports a production database configuration
 instead of a test fixture."
```

**Incorrect (condition-based):**
```
"Failed FC-2: Error handling coverage insufficient."
"Violation of failure condition #4: Response format non-compliant."
"FC-1 triggered: Test isolation violated."
```

### Convergence Bounds

| Parameter | Default | Override Allowed? | Escalation |
|-----------|---------|------------------|------------|
| Max iterations | 3 | Yes, play can set 1-5 | After max: drop barrier, escalate to human |
| Same-symptom repeat | 2 occurrences | No | Immediate escalation — structural misunderstanding |
| Hard ceiling | 5 | No | Mandatory human intervention |
| Escalation protocol | Human receives full intent + all outputs + all feedback | — | Human sees everything; barrier is agent-only |

### Barrier in the Two-Layer Intent Model

Compartmented evaluation applies to **business intents** (Layer 1), NOT **SDLC intents** (Layer 2).

- **Business intents** are where judgment calls happen — the builder must decide HOW to achieve a business goal. The barrier prevents the builder from optimizing for validator checks.
- **SDLC intents** are framework-authored, pre-validated, and mechanical. They define lifecycle operations (commit, branch, deploy) where the output is deterministic. No barrier needed.

This alignment is natural: barrier-eligible plays are exactly those where business intent drives creative decisions, and barrier-exempt plays are exactly those where SDLC intent drives mechanical operations.

---

## IDSD Development Loop

The complete IDSD development loop:

**Product Planning (once per product):**

```
1. specify-product    → locked epics, scope, quality profile
2. design-exp         → locked UX
3. build-arch         → locked 5-artifact architecture
```

**Per Epic:**

```
4. start-feature      → issue + branch + STM directory
5. prepare-epic       → LLD, scenarios, plan, context package
                        (reads KB + LTM → writes STM)
6. implement-epic     → TDD code, unit tests, eval evidence
                        (STM ONLY — KB/LTM FORBIDDEN)
7. validate-epic      → E2E tests, QA verdict (ACCEPT/REJECT)
                        (STM ONLY + deployed env — KB/LTM FORBIDDEN)
8. /ship              → commit → PR → review → merge
9. capture-learning   → archive STM, promote patterns to LTM
```

---

## Artifact Lifecycle

```
DRAFT → VALIDATE → LOCKED
```

- `--phase draft`: Builder agent generates initial artifact from **goal + constraints** (under barrier-eligible plays, failure conditions are withheld)
- `--phase validate`: Validator agent evaluates artifact against **failure conditions** (under barrier-eligible plays, goal and constraints are withheld); returns symptom-based feedback
- `--phase lock`: Play orchestrator confirms no symptoms remain; cascade sync → re-validate → set LOCKED

**Note:** In barrier-exempt plays (commit-code, create-pr, etc.), DRAFT and VALIDATE may use a single agent with full intent visibility. The barrier only applies when the play is classified as barrier-eligible.

**Intent-sufficiency:** Upstream artifacts enrich, never block. If intent is clear, proceed. Any play can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied.

### Cascade Sync

Every derived artifact includes: `<!-- sync: source={path} hash={hash} generated={timestamp} -->`

Lock phase MUST run cascade-sync before setting LOCKED status.

| Play Phase | Calls cascade-sync | Context |
|-------------|-------------------|---------|
| Any `--phase lock` | YES (mandatory) | `spec_path` = current artifact directory |
| `implement-feature` start | YES (check_only=true) | Verify bundles not stale before building |

---

## Enterprise Wrapper

```
┌─────────────────────────────────────────────────────────────┐
│  GARURA INTERFACE (Enterprise Layer)                      │
│                                                             │
│  Governance        │ Quality Gates    │ Memory Federation   │
│  Policies,         │ Validation       │ KB deployed to      │
│  guardrails,       │ checkpoints      │ all projects from   │
│  approval          │ between SDLC     │ central standards   │
│  workflows         │ phases           │ (set by Architect)  │
│                    │                  │                     │
│  Cognitive Engine  │ MCP Integration  │ Hive Mind (Tasks)   │
│  Context assembly  │ Tool-agnostic    │ Cross-agent         │
│  from KB + LTM    │ external access  │ coordination        │
│  + STM             │                  │                     │
│                    │                  │                     │
│  Barrier Integrity │                  │                     │
│  Constraint-failure│                  │                     │
│  partition audit   │                  │                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tool Integration**: IDSD's architecture supports tool-agnostic execution through MCP (Model Context Protocol) integration. Current and planned integrations:

| Tool | Status | Integration |
|------|--------|-------------|
| GitHub (Issues, PRs, Branches) | Built | Via `gh` CLI and MCP GitHub Server |
| Git (Version Control, KB Storage) | Built | Native CLI |
| Jira | Architecture supports | MCP server — incremental addition |
| Notion / Wikis | Architecture supports | MCP server — incremental addition |
| Linear | Architecture supports | MCP server — incremental addition |
| CI/CD (GitHub Actions) | Partial | Via `gh` CLI |

Adding new tool integrations is incremental — each tool gets an MCP server; skills route through MCP; agents and plays remain unchanged. This is IDD Principle 1's corollary (Intents Don't Know About Tools) in action.

**CTO-Configurable Domain Parameters** *(concept stage)*: Enterprise governance requires per-project customization — quality thresholds, mandatory gates, approval workflows. Architecture envisions CTO-level configuration that sets domain parameters (e.g., "all fintech projects require security audit gate," "startup projects skip formal ADR gate"). Not yet designed.

**Cross-Team Intent Visibility**: GitHub infrastructure provides cross-team visibility today — issues, branches, PRs, and STM artifacts committed to branches are all visible via standard GitHub workflows. Purpose-built dashboards for intent-level visibility across teams are a trajectory item.

**Barrier Integrity Audit**: In enterprise contexts, the constraint-failure partition is a governance concern. Misclassification can either deprive builders of needed context (constraints classified as failure conditions) or compromise validation independence (failure conditions classified as constraints). Enterprise governance should periodically audit intent definitions for correct P4 classification, especially for high-risk or compliance-sensitive intents.

---

## Related Documentation

- [IDD Principles](./intent-driven-development.md) — The foundational paradigm (8 Elements, Three Elements of Intent, Two-Layer Intent Model)
- [Philosophy](./philosophy.md) — Three Tenets of AI-Native SDLC
- [Design Principles](./principles.md) — Separation of Concerns, Explicit via Abstraction
- [Naming Conventions](./naming-conventions.md) — Play, Agent, and Skill naming patterns
- [AI Squad Framework](./AI_Squad_Framework_v1.docx) — Role definitions and transition paths
- IDSD Specification — `.claude/specs/idsd/idsd.md` — Full build spec with plays, gates, tasks

---

**Author**: Kapil Viren Ahuja
**Version**: 2.0.0
**Last Updated**: 2026-04-15
**Status**: Active
