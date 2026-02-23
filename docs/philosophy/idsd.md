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

IDSD defines 8 phases (5 primary, 3 supporting):

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

Primary Phases (linear pipeline)
────────────────────────────────────────────────────────────────────────────────
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

Supporting Phases (continuous)
────────────────────────────────────────────────────────────────────────────────
Run-2-Monitor     Audit-2-Fix                Learn-2-Memory
┌──────────────┐ ┌──────────────┐           ┌──────────────┐
│fix-bug       │ │review-arch   │           │run-retro     │
│hotfix        │ │audit-security│           │capture-      │
│              │ │audit-perf    │           │learning      │
│              │ │audit-a11y    │           │run-standup   │
│              │ │generate-docs │           │              │
└──────────────┘ └──────────────┘           └──────────────┘
```

#### Planned Phase: Monitor-to-Design

> **Status**: Concept only — not specified, not on near-term roadmap. Timeline: 18-24 months.

Monitor-to-Design closes the feedback loop from production back to the design phase:

```
Production monitoring signals (latency, errors, usage patterns)
        │
        ▼
Pattern correlation against LTM
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

| Phase | Type | Focus | Example Recipes |
|-------|------|-------|-----------------|
| Product-2-Design | Primary | Discovery, vision, roadmap, backlog | discover-product, plan-roadmap, manage-backlog |
| Design-2-Spec | Primary | Feature definition, wireframes, ADRs | define-feature, create-wireframes, create-adr |
| Spec-2-Code | Primary | Implementation from spec or intent | build-feature |
| Code-2-Test | Primary | Verification, commits, review | verify-feature, commit-code, review-pr |
| Test-2-Run | Primary | Delivery, demos, releases | create-pr, deliver-feature, run-demo, release |
| Run-2-Monitor | Supporting | Post-deployment monitoring and incident response | fix-bug, hotfix |
| Audit-2-Fix | Supporting | Quality audits and documentation | audit-security, audit-perf, audit-a11y, review-arch, generate-docs |
| Learn-2-Memory | Supporting | Retrospectives, knowledge capture, STM→LTM promotion | capture-learning, run-retro, run-standup |

### Three Execution Speeds

| Speed | Duration | Entry Point | Example |
|-------|----------|-------------|---------|
| Fast | Minutes | build-feature | One intent → working code → commit |
| Planned | Hours | start-planned-feature | Design + build in one flow |
| Strategic | Days | Full SDLC pipeline | Product discovery → delivery |

All speeds start with `start-feature` (universal precursor).

### Intent Primacy

Speed is one dimension of execution. The other is **autonomy** — how much of the workflow is prescribed vs derived from intent.

Today, recipes prescribe every step. This is deliberate: prescribed execution builds the trust and memory depth needed for autonomous execution. But the architecture is designed so that auditability, predictability, and human oversight — currently structural properties of recipes — can migrate to declarative constraints in the intent schema over time.

The `reference/intent.yaml` externalization pattern (see `create-pr` as golden standard) is a concrete step toward this: intent as a first-class, extensible schema that can grow to encompass workflow-level properties. When the constraint schema is expressive enough and memory is deep enough, the system can derive its own execution plan from intent alone.

See [Intent Primacy and Recipe Evolution](./architecture.md#intent-primacy-and-recipe-evolution) for the full evolution path.

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
| specifier | specification | specifier | Design-2-Spec, Audit-2-Fix |
| designer | design | designer | Design-2-Spec |
| validator | quality | validator | Code-2-Test, Test-2-Run, Audit-2-Fix |
| code-builder | implementation | builder | Spec-2-Code |
| tech-designer | design | designer | Design-2-Code, Run-2-Monitor, Audit-2-Fix |
| repo-orchestrator | repository | orchestrator | Universal |
| project-orchestrator | project | orchestrator | Universal |

#### Compartmented Evaluation Classification

Under IDD Principle 4, agents are classified by their role in the information barrier:

| Classification | Agents | What They Receive | When Barrier Active |
|---------------|--------|-------------------|-------------------|
| **Builders** | code-builder, tech-designer, specifier, designer | Goal + Constraints (no failure conditions) | In barrier-eligible recipes |
| **Validators** | validator | Failure Conditions + Builder Output (no goal/constraints) | In barrier-eligible recipes |
| **Neutral** | product-strategist, repo-orchestrator, project-orchestrator | Full intent (all elements) | Always — these agents perform mechanical or discovery operations |

In barrier-exempt recipes (commit-code, create-pr, etc.), all agents receive the full intent regardless of classification.

### Recipe Invocation Model Under Compartmented Evaluation

When a barrier-eligible recipe is invoked, the recipe orchestration layer splits the intent before routing to agents:

```
User invokes recipe with business intent
        │
        ▼
┌─────────────────────────────────────┐
│  RECIPE ORCHESTRATION LAYER         │
│                                     │
│  1. Receive full intent             │
│     (goal + constraints + failure)  │
│                                     │
│  2. Classify recipe:                │
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

**Key rule:** The recipe orchestration layer is the ONLY component that ever sees the complete intent during barrier-eligible execution. Neither the builder nor the validator has the full picture — this is by design.

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

#### LTM Governance via Git

In IDSD, LTM is version-controlled in Git repositories. This provides natural infrastructure for governance:

**File-Level Conflict Resolution**: Competing changes to the same LTM practice file surface as Git merge conflicts. Two developers capturing contradictory learnings about the same subsystem must resolve the conflict explicitly — Git's merge mechanism enforces this automatically.

**STM→LTM Promotion Workflow**: Promotion follows a PR-based governance model with tiered review:

```
Developer captures learning (STM)
        │
        ▼
capture-learning recipe extracts pattern
        │
        ▼
draft-ltm-entry skill creates LTM file
        │
        ▼
PR created for review
        │
        ├── Project-level LTM → Team leads review
        │   (e.g., "this service uses connection pooling")
        │
        └── Org-level LTM → Engineering leaders / CTOs review
            (e.g., "all services use structured JSON logging")
        │
        ▼
Merged → deployed to ~/.phoenix-os/core/memory/ via /sync-claude
```

**Semantic Conflict Detection**: Git catches file-level conflicts, but not semantic contradictions (e.g., one practice says "always use retry logic" while another says "never retry inside transactions"). The `capture-learning` recipe is designed with an `extract-patterns` skill that should detect semantic overlap with existing LTM entries — but this capability is not yet built. Current state: manual review during PR process.

**Cross-Developer Visibility**: All LTM changes are visible in the Git history. All STM artifacts are committed to feature branches and visible via GitHub (issues, branches, PRs). The NWWI (No Work Without Issue) gate ensures every piece of work is trackable.

#### Memory Evolution Trajectory

> **Status**: Concept to early design. Timeline: 12-24 months.

The current Git-based memory architecture is the foundation. The evolution path:

| Stage | Storage | Access | Search | Status |
|-------|---------|--------|--------|--------|
| **Stage 1** (current) | Git repository files | File read at agent context assembly | File path + glob patterns | Implemented |
| **Stage 2** | Git + MCP server | MCP protocol | Keyword + structured query | Concept — 6-12 months |
| **Stage 3** | Server-based + semantic index | MCP + API | Semantic search (vector embeddings) | Concept — 12-18 months |
| **Stage 4** | Federated (org-wide) | MCP + API + federation protocol | Cross-project semantic search | Vision — 18-24 months |

Each stage is additive — Stage 2 does not replace Stage 1; it adds a server layer on top of the same Git-backed storage. This means the core memory format (markdown files in Git) remains the source of truth throughout evolution.

**LTM Quality & Decay**: As LTM grows beyond the 20-file audit threshold (IDD P5), automated quality mechanisms become necessary:
- **Freshness scoring**: Track when each LTM entry was last validated against production reality
- **Relevance decay**: Flag practices that haven't been referenced by agents in N months
- **Contradiction detection**: Semantic analysis of LTM entries for conflicting guidance

Status: Planned, not designed. Currently relies on manual PR review and the P5 hygiene rule.

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

Token budgets are directional targets, not hard constraints. They exist to keep context focused and prevent agents from receiving irrelevant information.

| Scope | Target |
|-------|--------|
| Single bundle | ≤12K tokens |
| Gate subset per task | ≤3K tokens |
| Task context | ≤2K tokens |
| Total per agent task | ≤17K tokens |

### Recipe-to-Agent Context Bundle

Every recipe invocation passes a structured YAML context bundle to the agent. This is the contract between the recipe (orchestrator) and the agent (domain executor).

**Intent externalization:** Recipes externalize their intent schema to `reference/intent.yaml` as a first-class file. Context bundles reference this file dynamically — agent context blocks never hardcode constraint IDs. This means adding new constraints to `intent.yaml` is automatically picked up by all agent invocations without modifying SKILL.md. See `create-pr` as the golden standard implementation.

**Standard bundle structure:**
```yaml
---
Recipe context:
  intent: "{SDLC intent — what this recipe step is trying to achieve}"
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
Recipe context:
  intent: "Verify preconditions before execution"
  task: "Read `reference/intent.yaml`. Run every check in `constraints.pre_flight`.
         Return pass/fail for each. Do NOT halt — just return results."
```

The agent reads the intent file and runs all pre-flight checks. The orchestrator validates results and halts on any failure using the constraint's `halt_message` from the intent file. This design means pre-flight checks can grow in `intent.yaml` without any recipe changes.

**On retries, add:**
```yaml
  retry:
    previous_failure: "{what the agent returned that failed}"
    fix_applied: "{what was changed to address the failure}"
    attempt: {N}
```

**Rules for context bundles:**
- Reference `reference/intent.yaml` dynamically — never hardcode constraint IDs in context blocks
- Always pass `pre_flight` results so the agent knows what has already been verified
- Pass behavioral constraints as a dynamic set from `reference/intent.yaml`, not enumerated
- The `task` field must be a single, specific directive — not a general description
- Agent boundaries must be enforced: pass only what the agent's domain covers

---

## Recovery Protocol

When an agent returns a structured failure during recipe execution, IDSD applies a defined recovery loop before surfacing the failure to the human.

### Structured Failure Protocol

Agents are expected to return failures in a structured format that enables the recipe to route recovery correctly:

```yaml
failure:
  type: "{error_type}"
  message: "{what went wrong}"
  domain_assessment:
    responsible_domain: "{repo-orchestrator | project-orchestrator | code-builder | ...}"
    fix_hint: "{what the responsible agent should try}"
```

The `domain_assessment.responsible_domain` field tells the recipe which agent to invoke for recovery.

### Recovery Loop

```
Agent returns structured failure
        │
        ▼
Recipe reads domain_assessment.responsible_domain
        │
        ▼
Recipe invokes responsible agent with:
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

L1 recipes invoke ≤2 distinct agents. **Recovery calls are exempt from this limit.** A recipe in recovery may invoke an agent beyond the normal agent count without violating the L1 constraint. Recovery is a first-class mechanism, not an exception to the architecture.

### Recovery Reasoning in LTM

Recovery reasoning is loaded from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

This LTM file contains the structured-failure-protocol definition and domain-routing logic. Keeping this in LTM — rather than embedding it in each recipe — allows recovery behavior to be updated centrally without modifying individual recipes.

---

## Intent Complexity Scoring in IDSD

ICS (defined in IDD — see `intent-driven-development.md`) is operationalized in IDSD as an agent-level assessment that runs during P7 (Verify Understanding) before any agent begins execution.

### Where ICS Runs in the Pipeline

```
Recipe invoked with business intent
        │
        ▼
Agent receives intent from recipe
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
- ICS is optional for mechanical recipes (`commit-code`, `create-pr`) per P7's "when to skip" guidance
- ICS results are written to STM as evidence: `.phoenix-os/{issue}/ics-assessment.md`
- Non-Balanced profiles generate a checkpoint; the human can override with Tether or request decomposition
- For barrier-eligible recipes, ICS includes a 6th dimension: **Barrier Integrity** — whether the constraint-failure partition is correctly classified per P4's Classification Rule. Misclassified items trigger the "Barrier Compromised" profile.

### Future: ICS in Learn-2-Memory

As the Learn-2-Memory phase matures, ICS data becomes a training signal:

- Historical ICS profiles per author reveal growth patterns
- Frequently triggered profiles (e.g., "Intent-Heavy" on 60% of intents) surface coaching opportunities
- ICS pass rates contribute to P8 (Measure Intent Health) signals

---

## Compartmented Evaluation

Compartmented evaluation operationalizes IDD Principle 4 (Builders and Validators Must Not Share Context) in IDSD. It establishes an information barrier between builder and validator agents to prevent Goodhart's Law — where builders optimize for passing specific checks rather than genuinely solving the problem.

### The Information Barrier

The recipe orchestration layer splits the intent and routes each element to the correct agent:

```
┌───────────────────────────────────────────────────┐
│                RECIPE (Orchestrator)                │
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

### Barrier-Eligible vs Barrier-Exempt Recipes

Not all recipes benefit from compartmented evaluation. The barrier applies to recipes where the builder makes judgment calls. Mechanical recipes use a single-agent model.

| Recipe | Barrier? | Reasoning |
|--------|----------|-----------|
| build-feature | ✓ Eligible | Builder makes design and implementation decisions |
| define-feature | ✓ Eligible | Specifier makes scoping and requirements decisions |
| design-feature | ✓ Eligible | Designer makes architectural decisions |
| fix-bug | ✓ Eligible | Builder chooses fix strategy |
| commit-code | ✗ Exempt | Mechanical — deterministic output |
| create-pr | ✗ Exempt | Mechanical — deterministic output |
| create-branch | ✗ Exempt | Mechanical — deterministic output |
| generate-docs | ✗ Exempt | Descriptive — output determined by input |
| audit-security | ✗ Exempt | Audit IS validation — agent is already the validator |
| review-pr | ✗ Exempt | Review IS validation — agent is already the validator |

### Agent Roles in Compartmented Evaluation

| Agent | Role in Barrier | Sees Goal+Constraints | Sees Failure Conditions | Notes |
|-------|----------------|----------------------|------------------------|-------|
| code-builder | Builder | ✓ | ✗ | Primary builder for Spec-2-Code |
| tech-designer | Builder | ✓ | ✗ | Builder for design decisions |
| specifier | Builder | ✓ | ✗ | Builder for specification generation |
| designer | Builder | ✓ | ✗ | Builder for UX/design decisions |
| validator | Validator | ✗ | ✓ | Primary validator across all phases |
| product-strategist | Neutral | ✓ | ✓ | Operates at discovery level — no barrier needed |
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
| Max iterations | 3 | Yes, recipe can set 1-5 | After max: drop barrier, escalate to human |
| Same-symptom repeat | 2 occurrences | No | Immediate escalation — structural misunderstanding |
| Hard ceiling | 5 | No | Mandatory human intervention |
| Escalation protocol | Human receives full intent + all outputs + all feedback | — | Human sees everything; barrier is agent-only |

### Barrier in the Two-Layer Intent Model

Compartmented evaluation applies to **business intents** (Layer 1), NOT **SDLC intents** (Layer 2).

- **Business intents** are where judgment calls happen — the builder must decide HOW to achieve a business goal. The barrier prevents the builder from optimizing for validator checks.
- **SDLC intents** are framework-authored, pre-validated, and mechanical. They define lifecycle operations (commit, branch, deploy) where the output is deterministic. No barrier needed.

This alignment is natural: barrier-eligible recipes are exactly those where business intent drives creative decisions, and barrier-exempt recipes are exactly those where SDLC intent drives mechanical operations.

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

- `--phase draft`: Builder agent generates initial artifact from **goal + constraints** (under barrier-eligible recipes, failure conditions are withheld)
- `--phase validate`: Validator agent evaluates artifact against **failure conditions** (under barrier-eligible recipes, goal and constraints are withheld); returns symptom-based feedback
- `--phase lock`: Recipe orchestrator confirms no symptoms remain; cascade sync → re-validate → set LOCKED

**Note:** In barrier-exempt recipes (commit-code, create-pr, etc.), DRAFT and VALIDATE may use a single agent with full intent visibility. The barrier only applies when the recipe is classified as barrier-eligible.

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
| Git (Version Control, LTM Storage) | Built | Native CLI |
| Jira | Architecture supports | MCP server — incremental addition |
| Notion / Wikis | Architecture supports | MCP server — incremental addition |
| Linear | Architecture supports | MCP server — incremental addition |
| CI/CD (GitHub Actions) | Partial | Via `gh` CLI |

Adding new tool integrations is incremental — each tool gets an MCP server; skills route through MCP; agents and recipes remain unchanged. This is IDD Principle 1's corollary (Intents Don't Know About Tools) in action.

**CTO-Configurable Domain Parameters** *(concept stage)*: Enterprise governance requires per-project customization — quality thresholds, mandatory gates, approval workflows. Architecture envisions CTO-level configuration that sets domain parameters (e.g., "all fintech projects require security audit gate," "startup projects skip formal ADR gate"). Not yet designed.

**Cross-Team Intent Visibility**: GitHub infrastructure provides cross-team visibility today — issues, branches, PRs, and STM artifacts committed to branches are all visible via standard GitHub workflows. Purpose-built dashboards for intent-level visibility across teams are a trajectory item.

**Barrier Integrity Audit**: In enterprise contexts, the constraint-failure partition is a governance concern. Misclassification can either deprive builders of needed context (constraints classified as failure conditions) or compromise validation independence (failure conditions classified as constraints). Enterprise governance should periodically audit intent definitions for correct P4 classification, especially for high-risk or compliance-sensitive intents.

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
