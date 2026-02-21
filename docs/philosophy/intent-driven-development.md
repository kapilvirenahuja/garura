# Intent-Driven Development: The Paradigm

> **Scope**: Foundational Paradigm — Tool-Agnostic
> **Status**: Active
> **Last Updated**: 2026-02-21

## Overview

Intent-Driven Development (IDD) is the **paradigm** — the foundational principles for building any intent-based AI-assisted development system. IDD defines the WHY and WHAT: what elements every such system must have, and why those elements matter. IDD principles are stable, tool-agnostic, and applicable to any framework that takes human intent and converts it into governed software delivery.

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

IDD consists of eight core elements spanning three domains: human, AI, and the handshake between them.

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN DOMAIN                                               │
│                                                             │
│  Element 1: Intent Layer                                    │
│  Element 2: Signals                                         │
│  Element 3: Orchestrated Intent                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  AI DOMAIN                                                  │
│                                                             │
│  Element 4: Agents                                          │
│  Element 5: Memory                                          │
│  Element 6: Skills                                          │
│  Element 7: Context-Aware Decisions                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HANDSHAKE                                                  │
│                                                             │
│  Element 8: Generation-Verification Loops                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Ownership Model**: Elements 1-3 are where humans operate (defining intent, triggering signals, choosing autonomy level). Elements 4-7 are where AI operates (agents deciding, memory informing, skills executing, context shaping). Element 8 is where human oversight and AI execution meet.

---

### Element 1: Intent Layer

**IDD Principle**: Capture WHY — business goals, outcomes, and constraints — at a stable abstraction above specifications. Intent is expressed in business language, not technical language.

The intent layer captures the goal and high-level direction — without prescribing implementation. The intent remains stable even when requirements change; only the generated specifications downstream adapt.

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

**Example — IDD Intent**:
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
- Orchestration translates intent into structured goals with high-level steps
- Agents are responsible for translating intent into specifications (including derived success criteria)

---

### Element 2: Signals

**IDD Principle**: The system activates through event-driven triggers, not manual kickoffs. Signals detect events, package them consistently, and route them into orchestration.

Signals are the perception layer for system awareness.

> **Current State**: Signals are currently limited to user CLI invocations. The event types below represent the target architecture.

**Characteristics**:
- **Event-driven**: Triggered by external or internal events
- **Stateless**: Carry information but hold no state
- **Unidirectional**: Flow into the system, never out
- **Orchestration-bound**: Always enter through orchestration, never directly to agents

**Types**:

| Type | Source | Trigger | Example |
|------|--------|---------|---------|
| **User Prompt** | CLI, IDE | Manual command | `/fix-bug ISSUE-123` |
| **Schedule** | Cron/Timer | Time-based | Daily at 9:00 AM |
| **Webhook** | External | HTTP callback | GitHub PR review submitted |
| **File Change** | Git/Filesystem | Code push or modification | Push to `main` branch |
| **Agent Output** | Internal | One agent triggering another | Specifier completing → Builder starting |

**Rules**:
- All signals enter via orchestration
- Signals do not directly invoke agents
- Signals do not update memory directly
- Signals inform decisions without prescribing actions

---

### Element 3: Orchestrated Intent

**IDD Principle**: Orchestration bridges intent and execution. It defines the goal and high-level steps while agents determine actual execution based on context. Orchestration operates at graduated autonomy levels.

All orchestrated flows follow the AI-Native SDLC:

```
DISCOVER ──► SPECIFY ──► DESIGN ──► BUILD ──► RUN
```

Each step follows the core flow:
```
Orchestration ──► Agent ──► Skill(s) ──► Execute
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

> **Current State**: Level 1 and Level 2 are implemented. Level 3 (Autonomous Execution) is planned.

**Rules**:
- All system interactions start with orchestration
- Orchestration defines flow but never builds agent context
- Orchestration passes explicit intent and goals; agents determine execution
- The autonomy level determines the degree of human involvement, not the quality of output

---

### Element 4: Agents

**IDD Principle**: Autonomous decision-makers accept intent and determine HOW to achieve goals within their domain. Agents own outcomes, not procedures.

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
1. Accept explicit intent from orchestration
2. Read memory (STM + LTM) and build execution context
3. Decide actions based on context and rules
4. Select and invoke appropriate skills
5. Generate outputs and update STM

**Agent Non-Responsibilities**:
- ✗ Hardcoding specific tools
- ✗ Encoding rigid workflows
- ✗ Owning implementation details
- ✗ Receiving signals directly (must go through orchestration)

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
- Agents cannot receive signals directly (must go through orchestration)
- Agents own decisions, not procedures — they determine HOW based on context while orchestration defines WHAT

---

### Element 5: Memory

**IDD Principle**: Persistent organizational context across sessions solves the "anterograde amnesia" problem in LLM-based development. Memory is what makes IDD fundamentally different from both vibe coding and SDD.

Memory is the single biggest differentiator of IDD. No other approach implements structured memory. Current ad-hoc approaches rely on flat context files — these are primitive precursors to proper memory architecture.

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
│  Version controlled; governs all projects               │
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
- Memory has no awareness of agents, orchestration, or signals
- Agents may update **STM freely**
- **LTM updates require high-order agent validation**
- STM is ALWAYS created when working in a branch or Git worktree
- STM is NEVER created outside of a branch/worktree
- STM MAY be promoted to LTM
- Memory enables deterministic adaptation

---

### Element 6: Skills

**IDD Principle**: Bounded, repeatable execution capabilities that agents invoke. Skills execute work; they never decide when they run.

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

Context is assembled from LTM and STM and provided to agents before they act. Organizational standards set centrally are deployed consistently across all projects, ensuring that context-aware decisions respect enterprise governance.

**Context Assembly Flow**:
```
Agent receives intent from Orchestration
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
- Context is assembled by agents, not by orchestration
- Orchestration passes explicit intent; agents are responsible for reading memory and building context
- Context dimensions include but are not limited to: Domain, Architecture, Technology, Environment, Tools, Expertise, Time Constraints
- Context-aware decisions produce deterministic outcomes for the same context + intent combination

---

### Element 8: Generation-Verification Loops

**IDD Principle**: IDD embraces partial autonomy — humans validate outcomes while AI handles execution. Every output passes through quality gates. Trust is earned through verification, not assumed through specification.

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

## IDD Element Summary

### Element-to-Layer Mapping

| # | IDD Element | Layer | Owner |
|---|-------------|-------|-------|
| 1 | Intent Layer | Orchestration | Human |
| 2 | Signals | Perception | System |
| 3 | Orchestrated Intent | Orchestration | Human + System |
| 4 | Agents | Decision | AI |
| 5 | Memory | Cognitive | AI (read), Human (LTM governance) |
| 6 | Skills | Capability | AI |
| 7 | Context-Aware Decisions | Cognitive | AI |
| 8 | Generation-Verification Loops | Handshake | Human + AI |

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
   ┌──────────────┐
   │ ORCHESTRATION│ ◄── Elements 1 + 3: Orchestration Layer
   └──────┬───────┘     (Intent + Goal + Autonomy Level)
          │
          │    DISCOVER → SPECIFY → DESIGN → BUILD → RUN
          │
          ▼
   ┌──────────┐         ┌──────────────┐
   │  AGENT   │ ◄──────►│   MEMORY     │ ◄── Element 5: Cognitive Layer
   │          │         │  LTM + STM   │
   │          │ ◄── #4  │              │
   └────┬─────┘         └──────┬───────┘
        │                      │
        ▼                      ▼
   ┌──────────┐         ┌──────────────┐
   │ SKILLS   │ ◄── #6  │    CONTEXT   │ ◄── Element 7: Context Assembly
   │          │◄───────►│   ASSEMBLY   │
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

---

## IDD Design Principles

Governing principles for Intent-Driven Development. Every new intent, recipe, agent, and skill in any IDD-based system must be evaluated against these principles. If a design violates a principle, it must either be redesigned or the violation must be recorded with explicit rationale.

IDD sits in a narrow band between two failure modes: over-specification (which recreates SDD) and under-specification (which produces non-deterministic prompting). These principles keep systems in that band.

---

### Principle 1: Intents Declare Outcomes, Not Instructions

An intent must describe **what success looks like**, never **how to get there**. The moment an intent prescribes implementation steps, it has become a spec.

**Test:** Can the intent be satisfied by two completely different implementations? If yes, it's an intent. If only one implementation path can satisfy it, it's a spec in disguise.

**Good:**
```
Goal: All API endpoints return consistent error responses
Constraints: Must use existing error codes; must not break current clients
Failure: Any endpoint returns an unstructured error body; any 5xx leaks stack traces
```

**Bad:**
```
Goal: Wrap all controllers with ErrorHandlerMiddleware that catches exceptions and maps them to RFC 7807 responses using the ErrorMapper class
```

The bad example has already made the design decision. There is nothing left for the agent to decide, which defeats the purpose of having agents as autonomous decision-makers.

**Why this matters:** Agents exist to make domain-specific decisions about *how*. If the intent already answers *how*, the agent becomes a typist, not a judge. You lose the adaptive execution that makes IDD superior to SDD.

#### Corollary: The Agent Must Be Able to Say No

An intent must leave enough decision space that an agent can legitimately reject an approach or request clarification. In the space defined by the goal, bounded by constraints, and guarded by failure conditions — the agent must have at least two meaningfully different approaches available. If not, the intent is over-constrained.

If agents are just executors, you don't need agents — you need scripts. The entire value proposition of IDD over SDD is that intelligent agents make contextual decisions within bounded problem spaces. Protect that decision space.

#### Corollary: Intents Don't Know About Tools

An intent must never reference specific tools, CLIs, MCPs, or APIs. The intent declares what should happen; the agent decides how; the skill knows the tool.

**Test:** If you swapped the entire toolchain (GitHub to GitLab, npm to yarn, Jest to Vitest), would the intent still be valid without any changes? If not, it contains tool coupling.

Intents are stable across toolchain changes. Skills change when tools change. Agents decide which skills to use. If the intent names the tool, this entire abstraction collapses.

---

### Principle 2: Constraints Are Boundaries, Not Preferences

Constraints define the walls of the solution space. Crossing a constraint is always a failure. If crossing it is sometimes acceptable, it is a preference, not a constraint, and it belongs in LTM as a practice — not in the intent.

**Test:** If the system violates this constraint, do you reject the output unconditionally? If the answer is "it depends," it's not a constraint.

**Examples of real constraints:**
- Must not introduce new runtime dependencies
- Must maintain backward compatibility with API v2 clients
- Must not modify files outside the `src/` directory
- Response time must not exceed current p99 by more than 10%

**Examples of preferences masquerading as constraints:**
- Should use TypeScript (preference — what if the project is Java?)
- Should have test coverage above 80% (practice, belongs in LTM quality gates)
- Should follow clean architecture (standard, belongs in LTM practices)

**The trap this prevents:** Constraint lists that grow to 15+ items per intent. When everything is a constraint, nothing is. Agents cannot distinguish real boundaries from nice-to-haves, and the system drifts toward SDD's worst failure mode — an interconnected web of requirements where missing one cascades.

---

### Principle 3: Failure Conditions Must Be Observable and Binary

A failure condition must describe something that can be **detected programmatically or by inspection** and evaluated as **true or false**. Subjective, gradient, or aspirational failure conditions are not failure conditions — they are quality preferences.

**Test:** Can a validator agent determine whether this failure condition has been triggered without asking a human for an opinion? If not, it's not a failure condition.

**Observable and binary:**
- The generated code does not compile
- Tests fail or test coverage drops below the project's configured threshold
- The PR description is empty
- The commit message does not follow conventional commit format
- The API contract (OpenAPI spec) has changed without a version bump

**Not observable or not binary:**
- The code is "not clean" (subjective)
- The design is "too complex" (gradient — complex relative to what?)
- Performance is "acceptable" (unmeasured)
- The solution is "not elegant" (aesthetic judgment)

**Why this matters:** Failure conditions are the mechanism for catching bad outputs *during* execution, before they reach a checkpoint. This only works if the system can actually evaluate them. An unobservable failure condition is worse than no failure condition at all — it creates false confidence that problems will be caught.

---

### Principle 4: Each Intent Is Self-Contained; Cross-Cutting Concerns Live in LTM

An intent must not depend on another intent's internal state. If two intents need to share knowledge, that knowledge belongs in LTM (practices, standards, quality gates) or STM (issue-specific artifacts), not in the intent itself.

**Test:** Can this intent execute correctly if every other intent in the system is deleted? If not, you have a hidden dependency.

**Correct separation:**
```
LTM (practices/logging.md):     "All services use structured JSON logging via the project logger"
LTM (quality-gates/security.md): "No secrets in source; all credentials via environment variables"

Intent (for a new endpoint):
  Goal: Add a /users/export endpoint that returns CSV
  Constraints: Must authenticate via existing auth middleware
  Failure: Endpoint accessible without valid token; response not valid CSV
```

The logging and security concerns are not in the intent. They are in LTM, where they apply to all work implicitly. The intent focuses only on what is unique to this specific piece of work.

**The trap this prevents:** LTM bloat. When cross-cutting concerns accumulate in LTM unchecked, LTM becomes a shadow spec. Guard against this by applying the same discipline to LTM entries: each practice must be independently valuable, not dependent on other practices to make sense.

**LTM hygiene rule:** If LTM exceeds 20 practice files, audit for overlap, contradiction, and redundancy. Merge or remove entries. LTM should grow logarithmically with project complexity, not linearly.

---

### Principle 5: Intents Scale Horizontally, Not Vertically

When a goal is too large for a single execution step, the answer is to decompose into multiple intents — not to make the intent more detailed. Vertical scaling (adding more detail to one intent) recreates SDD. Horizontal scaling (more intents, each small and focused) preserves IDD.

**Test:** Can the goal of this intent be expressed in one sentence without conjunctions? If you need "and" to describe the goal, it's likely two intents.

**Horizontal (correct):**
```
Intent 1: Goal — Identify the root cause of the payment timeout
Intent 2: Goal — Design a fix that addresses the root cause
Intent 3: Goal — Implement the designed fix
Intent 4: Goal — Validate the fix resolves the original issue
```

**Vertical (drift toward SDD):**
```
Intent: Goal — Identify the root cause of the payment timeout, design a fix considering database connection pooling and retry logic, implement the fix using the circuit breaker pattern, and validate it resolves timeouts under load
```

The vertical version has made design decisions (connection pooling, circuit breaker) before any agent has analyzed anything. It has also chained four activities into one, making the checkpoint model meaningless.

---

### Principle 6: Verify Understanding Before Execution

Before an agent begins work on an intent, it must be able to restate the goal, constraints, and failure conditions in the context of the current codebase. If the agent's restatement reveals ambiguity, the system must checkpoint for clarification — not guess.

**Test:** Could two reasonable agents interpret this intent differently given the same codebase? If yes, the intent is ambiguous and must either be tightened or force a verification checkpoint.

**What verification looks like:**
```
Intent received:
  Goal: Refactor the payment module for better testability
  Constraints: Must not change public API signatures
  Failure: Any existing test fails after refactoring

Agent restatement (before work begins):
  "The payment module (src/payments/) has 3 classes with direct database calls
   in constructor methods, making unit testing impossible without a live DB.
   I will extract dependencies to allow injection. Public method signatures
   on PaymentService, RefundHandler, and InvoiceGenerator will not change.
   I will verify by running the existing 47 tests in payments.test.ts."
```

The restatement converts the abstract intent into a concrete plan anchored to real code. If the agent cannot produce this restatement, it doesn't understand the intent well enough to proceed.

**Why this matters:** "Clearly understood" is the most dangerous phrase in IDD. An LLM can pattern-match to something close enough and proceed with confidence down the wrong path. Forced restatement surfaces misunderstandings *before* work begins, when correction is free — not after three agent calls, when it's expensive.

**When to skip:** Intents with purely mechanical goals (commit code, create branch, open PR) where the action is unambiguous. The verification principle applies to intents where the agent must make judgment calls about *what* the codebase needs.

---

### Principle 7: Feedback Is Continuous, Failure Is Cheap

Design intents so that failures are detected as early as possible, checkpoints are meaningful, and intent health is measured over time. This principle unifies three concerns: fail-fast design, checkpoint justification, and outcome measurement.

#### Fail-Fast

Front-load risky decisions. Put analysis before design, design before build. Make the first intent in any chain produce a verifiable artifact that a human can validate before expensive work begins.

**Test:** If this intent fails, how many subsequent steps have already executed? If more than zero, consider whether the failure condition could have been checked earlier.

#### Justify Every Checkpoint

The checkpoint is where human judgment enters the system. An intent that always auto-approves is either too trivial to be an intent or has failure conditions that are too lenient. An intent that never auto-approves has constraints that are too tight or failure conditions that can't be evaluated programmatically.

**Test:** Over time, does this intent's checkpoint get approved ~70-90% of the time? If it's 100%, the checkpoint is a rubber stamp. If it's under 50%, the intent is poorly defined.

#### Measure Intent Health

A successful outcome (code shipped, PR merged) does not mean the intent was well-designed. Track these signals per intent over time:

| Signal | Healthy | Unhealthy | What It Means |
|--------|---------|-----------|---------------|
| Checkpoint approval rate | 70-90% | <50% or 100% | Intent clarity or checkpoint value |
| Agent skill selection variance | 2-4 different skill paths | Always the same path | Intent is too prescriptive or agent is stuck |
| Constraint violation frequency | Rare | Frequent | Constraints unclear or contradictory |
| Failure condition trigger rate | Occasional | Never triggered | Failure conditions may be too lenient |
| Downstream rework | Rare | Frequent rejections in later steps | Early intents not catching problems |
| LTM dependency count | 0-3 practices referenced | 10+ practices needed | Intent is underspecified, leaning on LTM as a crutch |

**Why this matters:** IDD's advantage over SDD is adaptability. But adaptability without feedback is drift. These signals tell you whether your intents are staying in the productive middle ground or drifting toward either over-specification or chaos.

---

## Anti-Patterns: How IDD Fails

### Anti-Pattern 1: The Spec Intent
An intent that is so detailed it leaves no decision space for the agent. Usually has 10+ constraints, prescribes implementation patterns, and has failure conditions that implicitly define the solution.

**Symptom:** Agents always produce identical outputs regardless of context.

### Anti-Pattern 2: The Wish Intent
An intent with a vague goal ("make it better"), no real constraints, and subjective failure conditions. The agent has unlimited decision space but no way to know when it's done.

**Symptom:** Checkpoints always require human intervention because the agent can't self-evaluate.

### Anti-Pattern 3: The Leaky Intent
An intent that works only because of implicit knowledge not captured in the intent, constraints, failure conditions, or LTM. The agent produces correct output because the LLM has seen similar patterns, not because the intent is well-defined.

**Symptom:** Works with one LLM provider, breaks when you switch models or versions.

### Anti-Pattern 4: The Shadow Spec (LTM Bloat)
Cross-cutting concerns, standards, and practices accumulate in LTM until the combined weight of LTM + intent effectively recreates a full specification document. Individual intents look clean, but they're only interpretable in the context of dozens of LTM files.

**Symptom:** Onboarding a new project requires reading all of LTM before any intent makes sense.

### Anti-Pattern 5: The Chain Lock
A composed workflow where each step's success depends on the previous step producing output in a very specific format. The intents are nominally independent, but practically they form a rigid pipeline where changing one breaks the chain.

**Symptom:** Modifying one step requires updating every downstream step in the chain.

---

## Decision Checklist: Before Adding a New Intent

Use this checklist when designing any new intent-based workflow or modifying an existing one.

| # | Question | Principle | Pass Condition |
|---|----------|-----------|----------------|
| 1 | Does the goal describe an outcome, not an implementation? | P1 | Two different implementations could satisfy it |
| 2 | Does the agent have meaningful choices to make? | P1 | At least two valid approaches exist |
| 3 | Is the intent free of tool/technology references? | P1 | Survives a complete toolchain swap |
| 4 | Is every constraint a hard boundary you'd reject on? | P2 | No "should" or "prefer" language |
| 5 | Can every failure condition be evaluated without human opinion? | P3 | A validator agent can check it |
| 6 | Does the intent work without knowledge of other intents? | P4 | Delete all other intents — does this one still make sense? |
| 7 | Can you state the goal in one sentence without "and"? | P5 | If not, decompose into multiple intents |
| 8 | Can the agent restate this intent in concrete codebase terms? | P6 | Restatement surfaces no ambiguity or forces clarification |
| 9 | Is this the earliest point this failure could be detected? | P7 | No cheaper place to catch this error |
| 10 | Will the checkpoint add value (not rubber stamp)? | P7 | Expected approval rate 70-90% |
| 11 | Can you measure this intent's health over time? | P7 | At least 3 signals from the health table are trackable |

---

## Hypotheses

> **Status:** PLACEHOLDER — To be defined.

*This section will capture testable hypotheses about IDD's impact, assumptions, and predicted outcomes. Target: 3 hypotheses.*

---

## Related Documentation

- [Philosophy](./philosophy.md) — Fluidic SDLC, Three Tenets of AI-Native SDLC
- [Design Principles](./principles.md) — Separation of Concerns, Explicit via Abstraction, Error Context Standard
- [Naming Conventions](./naming-conventions.md) — Recipe, Agent, and Skill naming patterns

---

> For how these principles are implemented in Phoenix OS, see the IDSD methodology: `docs/philosophy/idsd.md`

---

**Author**: Kapil Viren Ahuja
**Version**: 1.0.0
**Last Updated**: 2026-02-21
**Status**: Active
