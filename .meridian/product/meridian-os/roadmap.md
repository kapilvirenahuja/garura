---
intent: "This roadmap bets that the primary barrier to useful AI-assisted development is not model capability but context continuity. If an AI assistant can start every session already informed — retaining project intent, constraints, and prior decisions — teams will shift from managing AI to delegating to it."
status: DRAFT
slug: "meridian-os"
horizon: "Near → Mid → Long"
approved_brief: ".meridian/project/product/meridian-os/brief-20260304T120000.md"
created: "2026-03-04"
---

## Roadmap Summary

Everything starts with persistent context. Without a memory layer that survives session boundaries, every subsequent capability — plays, quality gates, strategy workflows — would operate on partial information. E1 (Persistent Context Engine) is the non-negotiable foundation. It must land first because every other epic reads from it and writes to it. There is no parallel path around this dependency.

Once context persists, the system needs a way to act on it repeatably. E2 (Play Execution Engine) is the second foundation investment: the play system that turns AI capabilities into auditable, deterministic workflows. E2 is the largest effort on the roadmap (XL) and gates three downstream epics. Getting E2 wrong — or delayed — cascades across the entire plan. This is the critical path.

With foundations stable, two tracks open in parallel. E4 (Strategic Planning Track) delivers the product strategy workflow — discover, vision, roadmap, engineering view — proving that audience-separated artifacts work end-to-end. E3 (Quality & Verification Layer) builds the validation system that ensures AI-generated artifacts meet quality gates. E4 can proceed alongside E3 because it only depends on E2, while E3 feeds into E5.

E5 (Feature Development Track) is the full end-to-end development pipeline: issue to ship. It requires both the play engine and the quality layer, making it the convergence point of the mid-horizon. E6 (Adoption & Onboarding) is deliberately terminal — it depends on everything else being proven before we invest in making it frictionless for new teams. You do not optimize onboarding for a system that is still finding its shape.

## What Is Not In This Roadmap

- **Multi-model support (non-Claude)** — Out of scope for v1 per vision; focus on depth with one platform before breadth
- **Enterprise features (SSO, audit, compliance)** — Deferred until adoption validates core value proposition
- **IDE plugin / GUI** — Meridian OS operates through CLI and markdown; no UI investment in this roadmap
- **Replacing project management tools** — Integrates alongside Linear/Jira, does not compete with them
- **Performance benchmarking / NFR targets** — Not included because they do not change epic sequencing or priority decisions

## Assumptions

- Claude Code remains the primary agentic AI interface for target users through the full roadmap horizon — if the market shifts to a different platform, foundation investments (E1, E2) require significant rework
- Persistent context compounds in value: teams using it for 30+ days will not revert to session-less workflows — if this does not hold, the entire roadmap thesis fails
- The two-foundation strategy (E1 then E2) is the correct critical path — if E2 can be built without E1 being fully complete, the sequencing should change
- Target users will adopt structured workflows (plays) if setup cost remains under 30 minutes — if adoption friction is higher, E6 must move earlier in the roadmap
- XL-effort epics (E2, E5) can be executed without dedicated team scaling — if effort estimates prove too large for current capacity, decomposition is required before Mid-horizon begins

## Epic Index

| ID | Name | Strategic Goal | P | Horizon | Depends On | Issue Ref | Status |
|----|------|---------------|---|---------|------------|-----------|--------|
| E1 | Persistent Context Engine | Persistent Context | P1 | Near | none | TBD | planned |
| E2 | Play Execution Engine | Structured Workflows | P1 | Near | E1 | TBD | planned |
| E4 | Strategic Planning Track | Audience-Separated Artifacts | P1 | Near | E2 | TBD | planned |
| E3 | Quality & Verification Layer | Structured Workflows | P2 | Mid | E2 | TBD | planned |
| E5 | Feature Development Track | Structured Workflows | P2 | Mid | E2, E3 | TBD | planned |
| E6 | Adoption & Onboarding | Zero-Friction Adoption | P2 | Long | E1, E2, E4, E5 | TBD | planned |

---

## E1 — Persistent Context Engine
**Strategic Goal:** Persistent Context | **P1** | **Near**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

Today, every AI session starts from zero. An engineer opens Claude Code, and the assistant has no memory of what the project is, what decisions were made yesterday, or what constraints matter. The engineer spends the first 10-15 minutes re-explaining context that was already established in a prior session. This is the single largest source of wasted time in AI-assisted development.

The Persistent Context Engine changes this. After E1 ships, an AI assistant begins every session already informed — it knows the project's intent, architectural constraints, active decisions, and prior work. Context is stored in two layers: STM (short-term, session and issue-scoped) and LTM (long-term, project-scoped). CLAUDE.md is auto-populated with project-relevant context so that the AI loads it on session start without manual intervention.

The user outcome is simple: the engineer opens a session and starts working immediately. No re-explanation. No context loss. The AI remembers.

### Constraints
- In scope: STM storage and retrieval (issue-scoped artifacts), LTM storage and retrieval (project-scoped knowledge), CLAUDE.md auto-population protocol, context loading protocol for session start, memory indexing for selective retrieval
- Out of scope: Cross-project memory sharing, memory compression or summarization algorithms, user-facing memory management UI
- Must not break: Existing manual CLAUDE.md workflows must continue to function; any project without Meridian memory must not error

### Acceptance Scenarios
- Given a project with LTM populated, when a new Claude Code session starts, then the AI loads project intent, constraints, and key decisions without the user re-stating them
- Given an issue with STM artifacts from a prior session, when the same issue is resumed, then the AI has access to all prior session artifacts (specs, designs, evidence) without re-generation
- Given a project with no Meridian memory configured, when Claude Code starts, then the session operates normally with no errors or degraded behavior
- Given new knowledge is produced during a session (e.g., a design decision), when the session ends, then the knowledge is persisted to the appropriate memory layer (STM or LTM) without manual user action

### Failure Conditions
- AI sessions still require manual context re-entry after E1 ships — the memory layer exists but is not loaded automatically
- Memory retrieval is too slow (>5 seconds) or too noisy (loads irrelevant context that confuses the AI)
- CLAUDE.md auto-population overwrites user-authored content or produces conflicts on every session start

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD

---

## E2 — Play Execution Engine
**Strategic Goal:** Structured Workflows | **P1** | **Near**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

Without a play engine, every AI-assisted workflow is ad-hoc. An engineer asks the AI to "plan a feature" and gets a different process every time — different quality, different artifacts, different levels of completeness. There is no repeatability, no auditability, and no way to enforce quality gates. Teams cannot trust the AI to execute a consistent process.

The Play Execution Engine introduces deterministic workflows. After E2 ships, common development operations — feature planning, code review, product discovery, shipping — execute as structured plays with defined steps, agent delegation, checkpoint approvals (Tether/Vanish), and artifact outputs. Atomic plays handle single-domain tasks (max 2 agent calls). High-order plays orchestrate multi-domain workflows (max 5 agent calls). Every play execution is auditable: you can trace what happened, what was approved, and what artifacts were produced.

The user outcome: an engineer invokes a play and gets a reliable, high-quality process every time. The AI follows the play, delegates to domain-expert agents, pauses for approvals at the right moments, and produces consistent artifacts. The workflow is no longer dependent on the engineer remembering the right steps.

### Constraints
- In scope: Atomic play execution (single-domain, max 2 agent calls), high-order play orchestration (multi-domain, max 5 agent calls), Tether/Vanish approval protocol at checkpoints, agent delegation framework, checkpoint and evidence artifact production, play definition format and loading
- Out of scope: Play marketplace or sharing, visual play builder, play versioning and migration, cross-project play inheritance
- Must not break: Direct Claude Code usage without plays must remain fully functional; users who never invoke plays must see no behavioral change

### Acceptance Scenarios
- Given a defined play, when the user invokes it, then the play executes its steps in order, delegates to the correct agent(s), and produces the defined output artifacts
- Given a play with a Tether/Vanish checkpoint, when the checkpoint is reached, then execution pauses and waits for explicit user approval before proceeding
- Given a user types "Vanish" at a checkpoint, then the play halts cleanly, preserves any completed artifacts, and does not execute subsequent steps
- Given a play with agent delegation, when an agent encounters a failure, then the play receives a structured failure response and can decide whether to retry, skip, or halt
- Given a play execution completes, when the user reviews the session, then checkpoint and evidence artifacts exist at the expected STM paths documenting what happened

### Failure Conditions
- Plays execute non-deterministically — the same play with the same inputs produces different step sequences or artifacts on different runs
- Agent delegation fails silently — a delegated agent errors but the play continues as if it succeeded
- Checkpoint approvals are skipped or auto-approved — the Tether/Vanish protocol is not enforced, removing human oversight
- Play execution produces no audit trail — no checkpoints, no evidence artifacts, making it impossible to trace what happened

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD

---

## E4 — Strategic Planning Track
**Strategic Goal:** Audience-Separated Artifacts | **P1** | **Near**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

Product strategy artifacts today are created manually and maintained in parallel — a PM writes a vision doc, an engineer writes a tech spec, a stakeholder gets a slide deck, and all three drift apart over time. When AI assists, it produces a single undifferentiated artifact that mixes business context with technical detail, serving neither audience well.

The Strategic Planning Track delivers a complete product strategy workflow: discover opportunity, draft vision, lock vision, scope roadmap, generate brief, approve, draft roadmap, generate engineering view. Each step produces audience-appropriate artifacts from a single source of truth (the locked vision). The PM gets a business-facing brief and roadmap. Engineering gets a technical roadmap view with no business content. Both derive from the same locked vision, so they cannot drift.

The user outcome: a product lead runs `/discover-product` and gets a validated vision. They run `/plan-roadmap` and get a brief, a roadmap, and an engineering view — three artifacts, one source of truth, zero manual duplication.

### Constraints
- In scope: discover-product play (opportunity discovery, vision drafting, vision validation, vision locking), plan-roadmap play (epic scoping, brief generation, Tether approval, roadmap drafting, engineering view generation), audience separation between product and engineering artifacts, vision lock protocol
- Out of scope: Backlog management (manage-backlog play — separate epic), sprint planning, OKR tracking, financial modeling
- Must not break: Existing vision.md files created before this track must remain readable; manual vision creation must still work

### Acceptance Scenarios
- Given a problem statement, when the user runs `/discover-product`, then the play produces a vision.md with all required sections (problem, users, value prop, strategic goals, metrics, landscape, assumptions, out of scope) and the vision reaches LOCKED status after validation
- Given a locked vision, when the user runs `/plan-roadmap`, then the play produces three distinct artifacts: a brief for PM review, a roadmap.md with full IDD epic content, and a roadmap-engineering.md with zero business content
- Given a roadmap.md and a roadmap-engineering.md, when compared side by side, then they contain no duplicated content — roadmap.md has business narrative and IDD intent; engineering view has only technical breakdown, risk, and dependencies
- Given a vision is LOCKED, when any play attempts to modify vision.md, then the modification is rejected with a structured failure indicating lock status

### Failure Conditions
- Audience separation fails — engineering view contains business narrative, or roadmap.md contains technical architecture details that belong in the engineering view
- Vision lock is bypassed — a play modifies a LOCKED vision without explicit unlock
- Artifacts drift — roadmap.md and roadmap-engineering.md contain contradictory information about the same epic

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD

---

## E3 — Quality & Verification Layer
**Strategic Goal:** Structured Workflows | **P2** | **Mid**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

AI-generated artifacts are unreliable without verification. A code-builder agent can produce implementation that passes no tests. A product-strategist agent can draft a vision missing critical sections. Without a quality layer, plays run to completion and produce artifacts that look complete but are subtly broken. The team discovers problems downstream — during code review, during production incidents, during stakeholder meetings — when the cost of fixing them is highest.

The Quality & Verification Layer introduces systematic validation into every workflow. After E3 ships, plays can invoke the quality-validator agent to check artifacts against defined quality gates before proceeding. Verification scenarios (given/when/then) are defined alongside work, executed after completion, and produce evidence artifacts that document what passed and what failed. No artifact ships without verification.

The user outcome: when a play completes, the team knows the output has been checked. Evidence files exist proving what was validated. Quality issues are caught during the workflow, not after deployment.

### Constraints
- In scope: quality-validator agent implementation, verification scenario execution framework, evidence artifact production and storage, quality gate definitions for existing artifact types (vision, roadmap, code), integration with play checkpoint system
- Out of scope: Automated test generation for application code (that is the code-builder's domain), performance or load testing, security scanning, compliance certification
- Must not break: Plays that predate the quality layer must continue to function without mandatory quality gates; quality validation must be opt-in at the play level

### Acceptance Scenarios
- Given a play with a quality gate defined, when the play reaches the quality checkpoint, then the quality-validator agent executes all defined verification scenarios and produces an evidence artifact
- Given a verification scenario fails, when the quality-validator reports results, then the play receives a structured failure with the specific scenario that failed and why, enabling targeted fix
- Given a completed play execution, when the user checks the evidence path, then evidence artifacts exist documenting every verification scenario that was executed, with pass/fail status and timestamps
- Given a play without quality gates defined, when the play executes, then it completes normally without invoking the quality-validator — quality is opt-in, not mandatory

### Failure Conditions
- Quality gates pass artifacts that are demonstrably incomplete or incorrect — false positives that erode trust in the verification system
- Evidence artifacts are not produced or are produced but contain insufficient detail to determine what was actually checked
- Quality validation adds more than 30 seconds of wall-clock time per gate — verification must not make workflows feel slow

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD

---

## E5 — Feature Development Track
**Strategic Goal:** Structured Workflows | **P2** | **Mid**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

Today, feature development with AI assistance is fragmented. An engineer creates an issue, manually briefs the AI, asks it to plan, then implement, then maybe test — each step disconnected from the last. There is no structured pipeline from "idea" to "shipped code." The AI does not know what the prior step produced, does not enforce quality between steps, and does not produce a traceable record of how the feature moved from intent to delivery.

The Feature Development Track delivers the complete end-to-end pipeline: issue creation, branch setup, technical planning (spec + design), implementation, verification, and shipping. Each step is a play invocation that builds on the prior step's artifacts. The AI assistant has full context at every stage because E1 (Persistent Context) ensures continuity, E2 (Play Engine) ensures structure, and E3 (Quality Layer) ensures verification happens before shipping.

The user outcome: an engineer runs `/start-feature-planning` with an issue number and gets a spec and design. They run `/implement` and get working code. They run `/ship` and get a verified, reviewed PR. Every step is traceable, every artifact is connected, and the AI never loses context between steps.

### Constraints
- In scope: start-feature-planning play (spec + design from issue), implement play (code from design), ship play (PR creation, verification, merge), end-to-end artifact traceability (issue -> spec -> design -> code -> PR), branch management integration via repo-orchestrator
- Out of scope: Project management (sprint planning, velocity tracking, resource allocation), release management, deployment pipelines, monitoring and alerting
- Must not break: Manual feature development workflows must remain functional; engineers who prefer to code without plays must not be blocked

### Acceptance Scenarios
- Given an issue number, when the user runs `/start-feature-planning`, then the play produces a spec and design artifact linked to the issue, stored at the correct STM path
- Given a completed design, when the user runs `/implement`, then the code-builder agent produces implementation that addresses all design requirements and the implementation is linked to the design artifact
- Given completed implementation, when the user runs `/ship`, then the play creates a PR, runs verification, and produces evidence artifacts documenting what was checked before merge
- Given the full pipeline (plan -> implement -> ship), when artifacts are reviewed, then every artifact references its predecessor — the PR links to the design, the design links to the spec, the spec links to the issue

### Failure Conditions
- Artifact traceability breaks — an implementation cannot be traced back to its design or spec, making it impossible to understand why code was written
- The pipeline requires manual context transfer between steps — the engineer must re-explain what happened in the prior step because the AI lost context
- Verification is skipped or produces false passes — code ships without meaningful quality checks

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD

---

## E6 — Adoption & Onboarding
**Strategic Goal:** Zero-Friction Adoption | **P2** | **Long**
<!-- epic-status: planned -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent

A powerful system that nobody can set up is a failed system. Today, adopting Meridian OS requires reading documentation, manually creating directory structures, populating CLAUDE.md, understanding the play system, and configuring memory — a process that takes hours and requires significant prior context. This is acceptable for the core team building the system, but it is fatal for adoption.

The Adoption & Onboarding epic delivers a setup experience that gets a new team from zero to productive in under 30 minutes. A project initialization play handles directory creation, CLAUDE.md population, starter templates, and validation. Progressive enrichment ensures teams start lightweight — no big-bang documentation upfront — and gain depth as they use the system. Setup validation confirms everything is working before the team starts their first real workflow.

The user outcome: a new team runs a single initialization command, answers a few questions about their project, and gets a working Meridian OS setup. They can immediately invoke their first play. The 30-minute promise is met.

### Constraints
- In scope: Project initialization play (`/init` or equivalent), directory structure creation, CLAUDE.md starter population, progressive enrichment templates, setup validation (confirm working state), first-run guided experience
- Out of scope: Enterprise deployment automation, CI/CD integration for Meridian OS itself, migration tooling from other frameworks, multi-project workspace management
- Must not break: Existing projects that were set up manually must not require re-initialization; the init play must detect and respect existing configurations

### Acceptance Scenarios
- Given a new project with no Meridian OS configuration, when the user runs the initialization play, then the play creates all required directory structures, populates CLAUDE.md with project-relevant context, and produces starter templates — all within 30 minutes of wall-clock time
- Given initialization is complete, when the user runs setup validation, then the validation confirms all required components are in place and the first play can be invoked successfully
- Given an existing project with manual Meridian OS configuration, when the user runs the initialization play, then the play detects existing configuration, preserves it, and only fills gaps — no overwrites
- Given a newly initialized project, when the user invokes their first play (e.g., `/discover-product`), then the play executes successfully using the initialized context without additional manual setup

### Failure Conditions
- Initialization takes longer than 30 minutes — the zero-friction promise is broken
- The init play produces a broken state — setup validation fails, or the first play invocation errors due to missing configuration
- Existing configurations are overwritten — a team with manual setup loses their customizations when running init

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD
