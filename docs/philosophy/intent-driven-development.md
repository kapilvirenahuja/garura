# Intent-Driven Development: Principles & Framework Mapping

> **Scope**: PhoenixOS Framework — Foundational Principle
> **Status**: Active
> **Last Updated**: 2026-02-18

## Overview

Intent-Driven Development (IDD) is the foundational paradigm of Phoenix OS. It defines how humans and AI agents collaborate to deliver enterprise-grade software — where humans express **what** outcome they want, organizational memory provides **context**, and AI agents determine **how** to achieve it with full traceability.

IDD occupies a distinct position in the AI-assisted development landscape — more structured than unstructured "vibe coding," less burdensome than documentation-heavy spec-driven development (SDD). It is not an incremental improvement on either; it is a separate paradigm.

**Core Belief**: The bottleneck in AI-assisted development is not implementation speed — it is the ability to articulate intent clearly and maintain organizational context across sessions.

**IDD Mission**: Enable enterprise teams to leverage AI-assisted development with full governance and traceability — without the upfront documentation burden that slows traditional approaches.

**One-liner**: Intent in → Quality out.

---

## Why Intent-Driven Development

### The Industry Problem

The AI-assisted development landscape has bifurcated into two camps, each with fundamental limitations:

```
VIBE CODING                          SPEC-DRIVEN DEVELOPMENT
(Cursor, Copilot, Claude Code)       (GitHub Spec Kit, AWS Kiro, Tessl)
                                    
✓ Fast                               ✓ Structured
✓ Low friction                       ✓ Governed
✗ No organizational memory           ✗ Massive documentation overhead
✗ Quality inconsistency at scale     ✗ Brownfield projects struggle
✗ No governance for enterprise       ✗ Change-resistant (spec rewrites)
✗ No traceability                    ✗ 3-6 month productivity lag
```

**The Gap**: Organizations need production-quality AI-assisted development WITHOUT the specification burden. IDD fills this gap.

### Why Spec-Driven Falls Short

| Limitation | Evidence | Impact |
|------------|----------|--------|
| **Waterfall 2.0** | Recreates Big Design Up Front that Agile eliminated | Delays feedback and validation |
| **Documentation Overhead** | GitHub Spec Kit: 8 files, 1,300+ lines for a simple feature. AWS Kiro: 5,000+ lines for an 800-line tool | Double review burden: review specs, THEN review implementation |
| **Brownfield Failure** | Large codebases hit context window limits; specs miss existing patterns | Mostly unusable for existing enterprise applications |
| **Change Resistance** | Any requirement change requires spec rewrites before implementation | Slows iteration, blocks agile response |
| **False Security** | Agents don't always follow specs despite large context windows | "Agent marked 'verify implementation' done without writing tests" |
| **Adoption Friction** | 67% of teams experience extra debugging during learning; 3-6 months before gains | Requires mastery of BA + Dev + Spec Writing simultaneously |
| **Exploration Blocked** | Complete spec required before any code is generated | Fails for prototyping, research, rapidly changing requirements |

### What IDD Changes

| Dimension | Spec-Driven (SDD) | Intent-Driven (IDD) |
|-----------|-------------------|---------------------|
| **Primary Focus** | WHAT + HOW (requirements & technical specs) | WHY (goals, rationale, outcomes) |
| **Source of Truth** | Markdown files, YAML, spec documents | Business outcomes, constraints & failure conditions |
| **Direction** | Bottom-up (specs → code) | Top-down (intent → specs → code) |
| **Change Handling** | Requires spec rewrites; change-resistant | Intent stable; specs regenerated |
| **Documentation** | Heavy upfront; 8× increase typical | Minimal at intent layer; specs generated as intermediate artifacts |
| **Brownfield Support** | Struggles; context window limits | Intent describes outcomes; memory captures existing architecture |
| **Skill Requirement** | BA + Dev + Spec writing | Business language; AI generates specs |
| **Exploration** | Blocked (complete spec required first) | Enabled (multiple approaches from same intent) |
| **Spec Ownership** | Human-authored input | AI-generated intermediate |

**Key Insight**: In SDD, the spec is the **input** that a human writes. In IDD, the spec is a **generated intermediate** that the system produces from intent and organizational memory. Same information, fundamentally different ownership model.

---

## The Eight Elements of IDD

IDD consists of eight core elements. Each maps directly to a Phoenix OS component.

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN DOMAIN                                               │
│                                                             │
│  Element 1: Intent Layer ──────────► Recipes                │
│  Element 2: Signals ───────────────► Signals                │
│  Element 3: Orchestrated Intent ───► Recipe Levels (1/2/3)  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  AI DOMAIN                                                  │
│                                                             │
│  Element 4: Agents ────────────────► Sub-Agents             │
│  Element 5: Memory ────────────────► LTM + STM              │
│  Element 6: Skills ────────────────► Skills                  │
│  Element 7: Context-Aware Decisions► Cognitive Engine        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HANDSHAKE                                                  │
│                                                             │
│  Element 8: Generation-Verification► Quality Gates +        │
│             Loops                    Validator Agent         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Ownership Model**: Elements 1-3 are where humans operate (defining intent, triggering signals, choosing autonomy level). Elements 4-7 are where AI operates (agents deciding, memory informing, skills executing, context shaping). Element 8 is where human oversight and AI execution meet.

---

### Element 1: Intent Layer

**IDD Principle**: Capture WHY — business goals, outcomes, and constraints — at a stable abstraction above specifications. Intent is expressed in business language, not technical language.

**Phoenix OS Component**: **Recipes**

Recipes capture the intent — the goal and high-level steps — without prescribing implementation. The intent remains stable even when requirements change; only the generated specifications downstream adapt.

#### The Three Elements of Intent

Every well-formed intent consists of exactly three elements:

| Element | What It Captures | Why It Can't Be Generated |
|---------|-----------------|--------------------------|
| **Intent** | The positive space — what outcome we want | It's the root input; everything derives from it |
| **Constraints** | The boundaries — what the solution must respect | Business decisions, compliance, risk tolerance — only humans know these |
| **Failure Conditions** | The halt signals — when to abort execution | Risk appetite is a human judgment; agents can't infer when "enough is enough" |

**Why not Success Criteria?** In IDD, the intent itself defines success — achieving the stated outcome IS success. Success criteria are an **operationalized decomposition** of intent (e.g., "registration completes in < 2s, works on mobile, sends confirmation email"). That operationalization is the Specifier agent's job, informed by organizational memory and context. Success criteria belong in the **generated spec layer**, not the human-authored intent layer. Adding them to intent does the Specifier's work for it — which is exactly the SDD pattern IDD rejects.

**The three elements create a complete decision space for agents:**
- Am I moving toward the intent? → continue
- Am I within constraints? → continue
- Have I hit a failure condition? → halt
- Have I achieved the intent? → done (success is implicit in intent)

**Intent quality rule**: An intent must be clear enough that success is self-evident from its statement. If you cannot tell whether the intent has been achieved, the intent is poorly formed — the fix is upstream (sharpen the intent), not downstream (bolt on success criteria).

**What Makes Intent Different from a Spec**:

| Aspect | Specification (SDD) | Intent (IDD) |
|--------|---------------------|--------------|
| Abstraction | Implementation-level detail | Business outcome-level |
| Language | Technical (APIs, schemas, file structures) | Business (goals, constraints, failure conditions) |
| Stability | Brittle — changes with every requirement shift | Stable — survives requirement changes |
| Authorship | Human-written, human-maintained | Human-defined, machine-consumed |
| Volume | 1,300+ lines for simple features | Concise: intent + constraints + failure conditions |

**Example — SDD Spec**:
```
Build a REST endpoint at /api/users with GET/POST methods.
Validate email with regex pattern X.
Return 201 on success with JSON body { id, email, created_at }.
Use PostgreSQL schema: users(id UUID PK, email VARCHAR(255) UNIQUE, ...).
File: src/controllers/userController.ts
```

**Example — IDD Intent (Recipe)**:
```
Intent: Users need to register and manage their profiles.
Constraints: Must support SSO. Must comply with GDPR. Must work with existing identity provider.
Failure Conditions: Registration fails silently. PII is logged to stdout. User data persists after deletion request.
```

**Rules**:
- Intent captures WHY and WHAT outcome, never HOW
- Intent is authored in business language accessible to non-technical stakeholders
- Intent remains stable across implementation changes
- Every intent must have all three elements: intent, constraints, failure conditions
- Success criteria are generated intermediates — they belong in specs, not intents
- An intent that requires success criteria to be understood is a poorly formed intent
- Recipes translate intent into structured goals with high-level steps
- Agents are responsible for translating intent into specifications (including derived success criteria)

---

### Element 2: Signals

**IDD Principle**: The system activates through event-driven triggers, not manual kickoffs. Signals detect events, package them consistently, and route them into recipes.

**Phoenix OS Component**: **Signals**

This is a 1:1 mapping. Signals are the perception layer for system awareness.

> **Current State**: Signals are currently limited to user CLI invocations (e.g., `/fix-bug`, `/start-feature`). The event types below represent the target architecture.

**Characteristics**:
- **Event-driven**: Triggered by external or internal events
- **Stateless**: Carry information but hold no state
- **Unidirectional**: Flow into the system, never out
- **Recipe-bound**: Always enter through recipes, never directly to agents

**Types**:

| Type | Source | Trigger | Example |
|------|--------|---------|---------|
| **User Prompt** | CLI, IDE | Manual command | `/fix-bug ISSUE-123` |
| **Schedule** | Cron/Timer | Time-based | Daily at 9:00 AM |
| **Webhook** | External | HTTP callback | GitHub PR review submitted |
| **File Change** | Git/Filesystem | Code push or modification | Push to `main` branch |
| **Agent Output** | Internal | One agent triggering another | Specifier completing → Builder starting |

**Rules**:
- All signals enter via recipes
- Signals do not directly invoke agents
- Signals do not update memory directly
- Signals inform decisions without prescribing actions

---

### Element 3: Orchestrated Intent

**IDD Principle**: Recipes bridge intent and execution. They define the goal and high-level steps while agents determine actual execution based on context. Recipes operate at graduated autonomy levels.

**Phoenix OS Component**: **Recipes (Level 1, Level 2, Level 3)**

All recipes follow the AI-Native SDLC:

```
DISCOVER ──► SPECIFY ──► DESIGN ──► BUILD ──► RUN
```

Each step follows the core flow:
```
Recipe ──► Sub-Agent ──► Skill(s) ──► Execute
               │
               ▼
         Read Memory (LTM + STM)
               │
               ▼
         Build Context ──► Output ──► Write STM
```

**Autonomy Levels**:

| Level | Name | Description | Human Involvement | Example |
|-------|------|-------------|-------------------|---------|
| **Level 1** | One-Shot Flows | Simple, single-task executions | Direct input → output | Generate a unit test, commit code |
| **Level 2** | Composed Workflows | Multi-task workflows combining several steps | Human-in-the-loop | Implement a story with review checkpoints |
| **Level 3** | Autonomous Execution | Goal-driven, runs to completion | Approval gates only | End-to-end bug fix → PR → deploy |

> **Current State**: Level 1 and Level 2 recipes are implemented. Level 3 (Autonomous Execution) is planned.

**Recipe Examples**:

| Recipe | Goal | SDLC Flow |
|--------|------|-----------|
| `fix-bug` | Resolve a reported defect | Discover (RCA) → Specify (fix strategy) → Design (approach) → Build (TDD fix) → Run (deploy) |
| `implement-react-component` | Build a UI component | Discover (prototype) → Specify (requirements) → Design (UX + tech) → Build (TDD) → Run (deploy) |
| `product-feature-definition` | Define a new feature | Discover (intake) → Specify (PRD) → Design (feasibility) → Build (backlog) → Run (tracking) |

**Rules**:
- All system interactions start with a recipe
- Recipes orchestrate flow but never build agent context
- Recipes pass explicit intent and goals; agents determine execution
- The autonomy level determines the degree of human involvement, not the quality of output

---

### Element 4: Agents

**IDD Principle**: Autonomous decision-makers accept intent and determine HOW to achieve goals within their domain. Agents own outcomes, not procedures.

**Phoenix OS Component**: **Sub-Agents**

Agents follow the principle of **Explicit via Abstraction**: the task and expected outcome are explicit (deterministic); the tool selection, storage mechanisms, and execution methods are abstracted. This means the same agent produces identical logical outcomes whether the underlying platform is GitHub, Jira, or Linear.

**Agent Taxonomy**:

| Type | Naming Style | Purpose | Memory Access |
|------|-------------|---------|---------------|
| **Domain Stewards** | Domain-scoped with role suffix | Continuous stewardship of a domain | STM only |
| **SDLC Roles** | Standard SDLC position names | Standard SDLC positions | STM only |
| **Specialists** | Domain-scoped with action suffix | Specialized operations | STM only |
| **High-Order** | Domain-scoped with governance suffix | Governance and LTM evolution | STM + LTM |

**AI Squad Framework Mapping**:

| AI Squad Role | Agent Category | Traditional Roles Replaced |
|---------------|---------------|---------------------------|
| **Specifier** | Specification agents | Business Analyst, Product Manager |
| **Designer** | Design and architecture agents | UX Designer, Solution Architect |
| **Builder** | Implementation agents | Frontend/Backend/Full Stack Dev |
| **Validator** | Quality agents | QA Engineer, QA Lead |
| **Orchestrator** | Orchestration agents | Scrum Master, Project Manager |

5 roles replace 12-16 traditional roles. AI handles execution; humans steer intent.

**Agent Responsibilities**:
1. Accept explicit intent from recipes
2. Read memory (STM + LTM) and build execution context
3. Decide actions based on context and rules
4. Select and invoke appropriate skills
5. Generate outputs and update STM

**Agent Non-Responsibilities**:
- ✗ Hardcoding specific tools
- ✗ Encoding rigid workflows
- ✗ Owning implementation details
- ✗ Receiving signals directly (must go through recipes)

**Context Dimensions Agents Evaluate**:
- **Domain**: Business rules, compliance requirements, industry patterns
- **Architecture**: Monolith, microservices, serverless, event-driven patterns
- **Technology**: Tech stack, frameworks, language versions, dependencies
- **Environment**: Development, staging, production
- **Tools Available**: CLI, API, MCP, manual
- **User Expertise**: Beginner, intermediate, expert
- **Time Constraints**: Quick fix vs. comprehensive solution

**Rules**:
- Standard agents may update STM freely
- Only high-order agents may update LTM
- Agents cannot receive signals directly (must go through recipes)
- Agents own decisions, not procedures — they determine HOW based on context while recipes define WHAT

---

### Element 5: Memory

**IDD Principle**: Persistent organizational context across sessions solves the "anterograde amnesia" problem in LLM-based development. Memory is what makes IDD fundamentally different from both vibe coding and SDD.

**Phoenix OS Component**: **LTM (Long-Term Memory) + STM (Short-Term Memory)**

This is the single biggest differentiator of IDD. No other CLI harness implements structured memory. Current approaches rely on flat `CLAUDE.md` or `AGENTS.md` files — Phoenix OS views these as primitive precursors to proper memory architecture.

**Memory Architecture**:

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
│  Storage: core/memory/{dimension}/                      │
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
│  Created: When working in a branch or Git worktree      │
│  Lifecycle: Branch-scoped, may be promoted to LTM       │
└─────────────────────────────────────────────────────────┘
```

**How Memory Enables IDD**:

| SDD Approach | IDD + Memory Approach |
|-------------|----------------------|
| Write specs from scratch for every project | LTM carries architecture standards, tech stack conventions, coding patterns across all projects |
| Specs can't capture existing codebase context | LTM stores existing architecture decisions; STM captures current branch state |
| Every session starts from zero | STM persists task context; LTM persists organizational knowledge |
| Change requires spec rewrites | Intent stays stable; agents regenerate specs from memory + new context |

**Memory Rules**:
- Memory contains **knowledge, not process**
- Memory has no awareness of agents, recipes, or signals
- Agents may update **STM freely**
- **LTM updates require high-order agent validation**
- STM is ALWAYS created when working in a branch or Git worktree
- STM is NEVER created outside of a branch/worktree
- STM MAY be promoted to LTM
- Memory enables deterministic adaptation

---

### Element 6: Skills

**IDD Principle**: Bounded, repeatable execution capabilities that agents invoke. Skills execute work; they never decide when they run.

**Phoenix OS Component**: **Skills**

Skills are the lowest-level building blocks — reusable capabilities that execute based on command intent, context, and memory patterns. They are tool-agnostic, following a primary → secondary → fallback execution pattern.

**Skill Invocation Pattern**:

Skills follow an action-oriented naming pattern scoped by capability domain. They are invoked by name and execute a single bounded operation. The naming communicates intent clearly: what capability area the skill belongs to and what action it performs.

**Tool-Agnostic Execution**:
```
Intent: Create a pull request for the current branch

Primary Method:   GitHub CLI (gh pr create)
Secondary Method: MCP GitHub Server
Fallback:         Direct GitHub API call

Result: Same PR created regardless of method selected
```

**Skill Categories**:

| Domain | Capability Coverage | Typical Agent Consumer |
|--------|--------------------|-----------------------|
| **Planning** | Issue tracking, backlog management, task decomposition | Orchestration agents |
| **Implementation** | Code generation, commit management, pull request lifecycle | Implementation agents |
| **Defect** | Root cause analysis, fix application, regression detection | Specialist agents |
| **Testing** | Unit tests, integration tests, validation checks | Quality agents |
| **Deployment** | Release management, rollback, environment promotion | Deployment agents |
| **Review** | Code review, feedback generation, compliance checks | Quality agents |

**Rules**:
- Skills never decide when they run — agents invoke them
- Skills are stateless and deterministic
- Skills are trusted because they are **bounded and repeatable**, not because they are intelligent
- Skills cannot invoke other skills
- Skills cannot update memory directly
- Skills cannot bypass agents

---

### Element 7: Context-Aware Decision Making

**IDD Principle**: Every decision accounts for the full environmental context. The same intent produces different execution paths for different projects because context shapes implementation.

**Phoenix OS Component**: **Cognitive Engine + Memory Federation**

> **Current State**: Context assembly is currently handled by agents reading LTM and STM directly. The Cognitive Engine and Memory Federation described below represent the target architecture.

The Cognitive Engine assembles context from LTM + STM and provides it to agents. Memory Federation ensures that LTM standards set by the Architect are deployed consistently across all projects.

**Context Assembly Flow**:
```
Agent receives intent from Recipe
        │
        ▼
Read LTM (organizational standards)
        │
        ▼
Read STM (current task context)
        │
        ▼
Evaluate 7 context dimensions
        │
        ▼
Build execution context
        │
        ▼
Decide actions + Select skills
```

**How Context Changes Execution**:

| Same Intent | Context A | Context B |
|------------|-----------|-----------|
| "Implement user authentication" | Monolith, Java, Jenkins, SOC2 compliant | Microservices, Node.js, GitHub Actions, startup |
| Agents select | Spring Security, JUnit, enterprise patterns | Passport.js, Jest, lightweight patterns |
| Memory provides | Corporate auth standards, Java conventions | Startup patterns, rapid iteration norms |
| Output | Enterprise-grade auth with full compliance audit | Lean auth with extensibility hooks |

**Same intent, same quality gates, different implementation — determined by context, not by rewriting specs.**

**Rules**:
- Context is assembled by agents, not by recipes
- Recipes pass explicit intent; agents are responsible for reading memory and building context
- Context dimensions include but are not limited to: Domain, Architecture, Technology, Environment, Tools, Expertise, Time Constraints
- Context-aware decisions produce deterministic outcomes for the same context + intent combination

---

### Element 8: Generation-Verification Loops

**IDD Principle**: IDD embraces partial autonomy — humans validate outcomes while AI handles execution. Every output passes through quality gates. Trust is earned through verification, not assumed through specification.

**Phoenix OS Component**: **Quality Gates + Validator Agent + SDLC Phases**

This is the **handshake** between human oversight and AI execution. It maps directly to the Software 3.0 paradigm: partial autonomy with human oversight, not full automation.

**Verification at Each SDLC Phase**:

| Phase | What AI Generates | What Gets Validated | Gate |
|-------|-------------------|---------------------|------|
| **Discover** | Prototypes, research synthesis | Concept viability, stakeholder alignment | Discovery Review |
| **Specify** | Functional requirements, NFRs, validation criteria | Completeness, correctness, testability | Specification Gate |
| **Design** | UX design, technical architecture | Feasibility, pattern compliance, security | Design Review |
| **Build** | Code, tests, documentation, PRs | Quality, coverage, standards compliance | Build Gate (CI/CD) |
| **Run** | Deployment, monitoring, alerts | Health, performance, incident response | Production Gate |

**Autonomy Level Controls Verification Depth**:

| Level | Verification Model | When to Use |
|-------|-------------------|-------------|
| **Level 1** (One-Shot) | Output reviewed directly by human | Simple, low-risk tasks |
| **Level 2** (Composed) | Human-in-the-loop at key checkpoints | Standard feature work |
| **Level 3** (Autonomous) | Approval gates only at configured points | Established patterns, high-trust workflows |

**Validator Agent Role**:
- Owns quality gates and compliance
- Reviews outputs against LTM standards
- Verifies test coverage, security patterns, accessibility compliance
- Operates at gates between SDLC phases
- Can be shared across pods (1 Validator per 2-3 teams)

**Rules**:
- Every SDLC phase has a quality gate before the next phase begins
- The autonomy level determines how much human oversight is applied, not the quality of output
- Validators access LTM standards to ensure organizational compliance
- Generation-verification is a loop, not a pipeline — failures cycle back to the appropriate phase

---

## Complete IDD → PhoenixOS Mapping

### Element-to-Component Matrix

| # | IDD Element | Phoenix OS Component | Layer | Owner |
|---|-------------|---------------------|-------|-------|
| 1 | Intent Layer | Recipes | Orchestration | Human |
| 2 | Signals | Signals | Perception | System |
| 3 | Orchestrated Intent | Recipe Levels (1/2/3) | Orchestration | Human + System |
| 4 | Agents | Sub-Agents | Decision | AI |
| 5 | Memory | LTM + STM | Cognitive | AI (read), Human (LTM governance) |
| 6 | Skills | Skills | Capability | AI |
| 7 | Context-Aware Decisions | Cognitive Engine + Memory Federation | Cognitive | AI |
| 8 | Generation-Verification | Quality Gates + Validator Agent | Handshake | Human + AI |

### Execution Flow

```
HUMAN DEFINES INTENT
        │
        ▼
   ┌─────────┐
   │ SIGNAL  │ ◄── Element 2: Perception Layer
   └────┬────┘     (User prompt, git event, webhook, schedule, agent output)
        │
        ▼
   ┌─────────┐
   │ RECIPE  │ ◄── Elements 1 + 3: Orchestration Layer
   └────┬────┘     (Intent + Goal + Autonomy Level)
        │
        │    DISCOVER → SPECIFY → DESIGN → BUILD → RUN
        │
        ▼
   ┌──────────┐         ┌──────────────┐
   │ SUB-     │ ◄──────►│   MEMORY     │ ◄── Element 5: Cognitive Layer
   │ AGENT    │         │  LTM + STM   │
   │          │ ◄── #4  │              │
   └────┬─────┘         └──────┬───────┘
        │                      │
        ▼                      ▼
   ┌──────────┐         ┌──────────────┐
   │ SKILLS   │ ◄── #6  │  COGNITIVE   │ ◄── Element 7: Context Assembly
   │          │◄───────►│  ENGINE      │
   └────┬─────┘         └──────────────┘
        │
        ▼
   ┌──────────────┐
   │ QUALITY GATE │ ◄── Element 8: Verification
   │ (Validator)  │
   └──────┬───────┘
          │
          ▼
   OUTPUT → Write STM → Next SDLC Phase (or loop back on failure)
```

### Enterprise Wrapper

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

- [Philosophy](./philosophy.md) — Fluidic SDLC, Three Tenets of AI-Native SDLC
- [Design Principles](./principles.md) — Separation of Concerns, Explicit via Abstraction, Error Context Standard
- [Naming Conventions](./naming-conventions.md) — Recipe, Agent, and Skill naming patterns
- [AI Squad Framework](./AI_Squad_Framework_v1.docx) — Role definitions and transition paths
- [Strategic Positioning](./phoenixos-positioning-executive-summary.md) — Competitive landscape and messaging

---

**Author**: Kapil Viren Ahuja
**Version**: 1.0.0
**Last Updated**: 2026-02-18
**Status**: Active
