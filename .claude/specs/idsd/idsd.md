# IDSD — Intent Driven Software Development: Complete Lifecycle Specification

**Version:** 3.1.0
**Date:** 2026-04-13
**Status:** IN PROGRESS — Major restructure. Core plays complete. Pipeline refactor pending (#106). Recent hardening via #191, #195, #200, #206.
**Author:** Garura

---

## Intent

**Intent:** Build a complete AI-native software development lifecycle for Garura that covers the full journey from product discovery through feature delivery, operations, and learning — where humans express intent and AI agents execute with full traceability, audience separation, and context economy.

**Constraints:**
- MUST follow IDD principles — intent in, quality out
- MUST respect Garura architecture: Plays → Agents → Skills
- MUST maintain audience separation — each artifact serves ONE stakeholder
- MUST maintain context economy — agents load only what they need (≤12K tokens per task)
- MUST follow play constraints (atomic ≤2 agents, high-order ≤5 agents)
- MUST build on existing components, not replace them
- MUST use DRAFT → VALIDATE → LOCKED artifact lifecycle
- MUST be intent-sufficient — every play works from intent alone; upstream artifacts are helpful, not blocking
- MUST support non-linear invocation — any play can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied

**Failure Conditions:**
- Agent loads >20K tokens of context for a single task → halt, bundle is too fat
- Artifact serves multiple audiences without clear separation → halt, audience collision
- Play bypasses agent for domain-specific work → halt, agent-first violation
- Verification gate has no concrete checkable criteria → halt, gate is ceremonial
- Task has no gate mapping → halt, verification gap
- Derived artifact (bundle, task, gate) is out of sync with its source → halt, sync breach

---

## Progress Tracker (as of 2026-04-13)

### Architecture Change Notice

**Four Crafts architecture (#85/#86, merged 2026-03-05) supersedes the play/agent patterns described in the original spec.** All remaining work must follow the new pattern:
- Plays pass a **single JSON contract** to agents (not individual parameters)
- Templates live in **LTM** (`core/components/memory/standards/templates/`) per ADR 009
- **Intent-resolution protocol removed** — agents read JSON contract directly
- **Task-driven DAGs** — plays create task graphs before agent execution
- Plays are **compiled artifacts** — authored from `reference/intent.yaml` via `/create-play`

### Pipeline Refactor Notice

**PENDING-REFACTOR (#106):** The current pipeline will be restructured into:
```
discover-product → plan-roadmap (+ features.yaml) → design-ux + design-services + build-arch → prepare-implementation (slim) → implement-epic
```
See section "SDLC Phases" for the current diagram (marked CURRENT) and the pending restructure notes.

### Priority Status

| Priority | Play | Status | Notes |
|---|---|---|---|
| P1 | start-feature | ✅ COMPLETE | L2, compiled from intent, uses project-orchestrator + repo-orchestrator |
| P2 | capture-learning | ⚠️ NEEDS FIX | Play exists, 2 skills missing (extract-patterns, draft-ltm-entry). **Updated #195 (2026-04):** extraction broadened to multi-format evidence scanning. **2026-04-13:** flagged for further fixes |
| P3 | implement-epic (was implement-feature) | ✅ COMPLETE | L2, eval-driven TDD loop, 7 agents, context isolation, model: opus. **Updated #191 (2026-04):** sources design artifacts from issue STM instead of product epics |
| P4 | start-feature-planning | ✅ COMPLETE | Renamed from start-planned-feature, IDD refactored |
| P5 | discover-product | ✅ COMPLETE | Produces product.yaml + product-brief.html. **Updated #206 (2026-04):** brief generation made opt-in (doc-builder no longer mandatory) |
| P6 | plan-roadmap | ✅ COMPLETE | L2, reads product.yaml, produces roadmap.yaml + roadmap-brief.html. **Updated #206 (2026-04):** brief generation made opt-in; draft-roadmap/validate-roadmap no longer reference briefs |
| P7 | manage-backlog | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| P8 | refine-backlog | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| P9 | build-feature | ✅ COMPLETE | Delivered via `implement-epic` |
| P10 | verify-feature | ✅ COMPLETE | Delivered via `check-drift` |
| P11 | commit-code | ✅ COMPLETE | L2, repo-orchestrator + project-orchestrator, auto-proceed mode |
| P12 | create-pr | ✅ COMPLETE | L2, quality checklist with evidence, confidence-gated |
| P13 | review-pr | ✅ COMPLETE | L2 Structure A, diff-scoped quality review with deterministic PR severity taxonomy, weighted confidence formula, and git-history reviewer selection. 3 domain agents (tech-designer ×2, quality-auditor, repo-orchestrator-as-ranker). Replaces validator-agent dependency with `quality-auditor` + `pr-severity-taxonomy.md`. Added #208 (2026-04-13). |
| P14 | deliver-feature | ✅ COMPLETE | Delivered via `implement-epic` |
| P15 | run-demo | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| P16 | release | ❌ NOT STARTED | Needs generate-changelog — kept pending |
| P17 | fix-bug | ✅ COMPLETE | Delivered as `/fix-it` — RCA-driven defect resolution skill |
| P18 | review-architecture | ✅ COMPLETE | Delivered via `quality-check` skill (#200, 2026-04) |
| P19 | generate-docs | ❌ NOT STARTED | 2 skills missing — kept pending |
| — | ship | ✅ COMPLETE | L2 Structure C, chains commit-code → create-pr → merge-pr. **Updated #208 (2026-04-13):** adds conditional `review-pr` quality gate between create-pr and merge-pr when `review-pr.bypass=false`; halts ship on P1 finding or sub-threshold confidence. |
| — | quality-check-scoped | ✅ NEW | **Added #208 (2026-04-13):** diff-bounded single-pass evaluator used only by `review-pr`. Reuses /quality-check KB, NOT its 11-subagent execution model. Reads `pr-severity-taxonomy.md` (KB) + standards from `standards_order` config. |
| — | merge-pr | ✅ COMPLETE | L2, merge + switch to main + cleanup |
| — | prepare-implementation | ✅ COMPLETE | L2, produces features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml + 5 briefs + hub.html. **Updated #191 (2026-04):** Phase 0 STM setup added, artifact lock path fixed |
| — | prepare-architecture | ✅ COMPLETE | **Updated #206 (2026-04):** brief generation made opt-in |
| — | create-play | ✅ COMPLETE | **Updated #200 (2026-04):** removed mandatory doc-builder step before checkpoints |
| — | quality-check | ✅ NEW | **Added #200 (2026-04):** LTM-driven quality assessment framework with 11-domain KB (skill, not a play) |

### Component Inventory

| Component | Built | Notes |
|---|---|---|
| Agents | 11 | product-strategist, tech-designer, code-builder, repo-orchestrator, project-orchestrator, doc-builder, eval-generator, quality-auditor, judge, intent-crafter, intent-resolver |
| Skills | ~43 deployed | Full list via /sync-claude output. Includes new `quality-check-scoped` (#208) |
| Plays | 13 deployed | discover-product, plan-roadmap, prepare-implementation, implement-epic, start-feature, start-feature-planning, commit-code, create-pr, merge-pr, ship, capture-learning, create-play, **review-pr (#208)** |
| Verification gates | 2 confirmed passing | G-100, G-103. Others blocked or pending re-eval against new schemas |

### Dependency Blockers

```
generate-changelog (source TBD — P15 descoped) ──► P16 release (1 priority blocked)
```

**P13 unblocked 2026-04-13:** review-pr no longer depends on a validator agent — it uses the existing `quality-auditor` agent plus the deterministic `pr-severity-taxonomy.md` standard for severity classification.

---

## Foundation — IDD Principles

IDSD operationalizes **IDD (Intent-Driven Development)** — the paradigm that defines how humans express intent and AI agents execute with full traceability. IDD is to IDSD as Agile is to Scrum.

Full IDD principles: `docs/philosophy/intent-driven-development.md`

### The 8 IDD Elements → IDSD Mapping

| # | IDD Element | IDD Principle | IDSD Implementation |
|---|-------------|--------------|---------------------|
| 1 | Intent Layer | Capture WHY — business goals, outcomes, constraints — at a stable abstraction above specifications | Every play has an IDD intent header (intent/constraints/failure_conditions). Users provide business intent; plays carry SDLC intent. Two-Layer Intent Model. |
| 2 | Signals | System activates through event-driven triggers, not manual kickoffs | User CLI invocations (`/discover-product`, `/implement-epic`) are the current signal mechanism. Plays are the entry point for all signals. |
| 3 | Orchestrated Intent | Plays bridge intent and execution at graduated autonomy levels | Atomic plays (≤2 agents), high-order plays (≤5 agents). Three speeds: Fast (minutes), Planned (hours), Strategic (days). 19 prioritized plays across 8 phases (5 primary, 3 supporting). |
| 4 | Agents | Autonomous decision-makers accept intent and determine HOW within their domain | 11 agents: product-strategist, code-builder, tech-designer, eval-generator, quality-auditor, judge, repo-orchestrator, project-orchestrator, doc-builder, intent-crafter, intent-resolver. Agent-first pattern enforced. |
| 5 | Memory | Persistent organizational context across sessions | LTM (`core/components/memory/`) for practices, standards, templates. STM (`.Garura/{issue}/`) for per-issue work context. LTM governance via Git: PR-based promotion with tiered review (project-level → team, org-level → engineering leaders). Memory enables deterministic adaptation. |
| 6 | Skills | Bounded, repeatable execution capabilities that agents invoke | Skills execute work; they never decide when they run. Each play lists its skills with input/output contracts. |
| 7 | Context-Aware Decisions | Every decision accounts for full environmental context | Context bundles ≤12K tokens per agent task. Audience separation (product/architect/implementer/validator). Agents read LTM + STM to build execution context. |
| 8 | Generation-Verification Loops | Every output passes through quality gates | DRAFT → VALIDATE → LOCKED lifecycle. Verification gates per play. Evidence artifacts. Tether/Vanish checkpoints. Eval-driven TDD in implement-epic. |

### Two-Layer Intent Model

IDSD operates with two distinct intent layers:

| Layer | Who Authors | When | Example |
|-------|------------|------|---------|
| **Business Intent** | User or upstream play | Every invocation | "Add CSV export with auth" |
| **SDLC Intent** | Framework author | Play creation (once) | "Build implementation from intent or spec" |
| **Artifact Intent** | Generated by agents | During execution | product.yaml carries business intent forward |

Business intent flows THROUGH plays. SDLC intent tells plays HOW to operate. Generated artifacts carry business intent forward through the entire lifecycle.

### Intent-Sufficiency Principle

Upstream artifacts enrich, never block. If intent is clear, proceed. If critical context is missing, suggest upstream play as option — user decides. This is how IDSD supports non-linear invocation: any play can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied.

---

## SDLC Phases

**NOTE: CURRENT diagram — PENDING-REFACTOR (#106).** The pipeline will be restructured after Issue #106 is resolved. See pending refactor note below the diagram.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                     start-feature (universal precursor)                       │
│                  NEW → create issue + branch                                  │
│                  RESUME → resolve existing issue, prepare env                 │
└──────────────────────────────┬────────────────────────────────────────────────┘
                               │
    ┌──────────────────────────┼─────────────────────────┐
    │                          │                         │
    Fast (minutes)       Planned (hours)         Strategic (days)
    build-feature        start-feature-planning  full SDLC pipeline
    │                          │                         │
    ▼                          ▼                         ▼

─── PRIMARY PIPELINE (linear) ──────────────────────────────────────────────────

Product-2-Design  Prep-2-Impl    Impl          Code-2-Test   Test-2-Run
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
│discover-     │ │prepare-    │ │implement-│ │commit-   │  │create-pr │
│product       │ │implementa- │ │epic      │ │code      │  │merge-pr  │
│plan-roadmap  │ │tion        │ │          │ │          │  │ship      │
│manage-       │ │            │ │          │ │          │  │          │
│backlog       │ │            │ │          │ │          │  │          │
└──────────────┘ └────────────┘ └──────────┘ └──────────┘  └──────────┘

─── SUPPORTING (continuous) ────────────────────────────────────────────────────

Run-2-Monitor     Audit-2-Fix                  Learn-2-Memory
┌──────────────┐ ┌──────────────┐             ┌──────────────┐
│fix-bug       │ │audit-        │             │run-retro     │
│hotfix        │ │security      │             │capture-      │
│              │ │audit-perf    │             │learning      │
│              │ │audit-a11y    │             │run-standup   │
│              │ │review-arch   │             │              │
│              │ │generate-docs │             │+ STM→LTM     │
│              │ │              │             │  promotion   │
└──────────────┘ └──────────────┘             └──────────────┘

Compound L2:
  implement-epic      Prep-2-Code+Test  eval-driven TDD per feature
  start-feature-plan  Design-2-Code     plan + build, fast
  ship                Code-2-Merged     commit → PR → merge, no approvals
```

**PENDING-REFACTOR (#106):** After Issue #106 is resolved, the pipeline will restructure to:
```
discover-product → plan-roadmap (produces features.yaml here) →
  design-ux + design-services + build-arch (3 new plays) →
  prepare-implementation (slimmed: scenarios + plan + evals only) →
  implement-epic
```
This moves features.yaml authorship from prepare-implementation to plan-roadmap. The three design plays (design-ux, design-services, build-arch) do not exist yet and will be built in Issue #106.

---

## Cross-Cutting Rules

### 1. Audience Separation

```
Product Layer:       product.yaml, roadmap.yaml, features.yaml
Architecture Layer:  architecture.yaml
Implementation Layer: tech.yaml, plan.yaml
Validation Layer:    scenarios.yaml
Review Briefs:       *-brief.html (human review per artifact type)
Orchestration:       hub.html (links to all briefs for a product slug)
```

- product.yaml is reviewed by humans via product-brief.html BEFORE roadmap begins
- features.yaml is reviewed via features-brief.html BEFORE architecture begins
- architecture.yaml and tech.yaml reviewed via their briefs BEFORE scenarios + plan
- scenarios.yaml is validator-facing ONLY — never passed to code-builder
- plan.yaml is implementer-facing — references scenario IDs for gating, never scenario content

### 2. Context Bundles

- Bundle = one vertical × one concern, ≤12K tokens
- Bundle MUST include IDD intent header from parent spec
- Bundle MUST list gate IDs it must satisfy
- Rule IDs MUST be preserved from parent spec
- In implement-epic: CONTEXT.md is produced by tech-designer (Step 1) and is the ONLY thing passed to code-builder. It is <100 lines distilled from plan.yaml + architecture.yaml + tech.yaml, scoped to ONE feature only.

### 3. IDD Intent Header

Every play and every generated artifact MUST start with:

```yaml
intent: {what outcome}
constraints: [{boundaries}]
failure_conditions: [{when to halt}]
```

**Intent Propagation Format (required when invoking agents):**
```
Intent: {verb}: {artifact_or_scope} — {context_hint}

Examples:
  Intent: Draft product vision: QR-activation-feature — for B2B SaaS context
  Intent: Build epic: F1-auth — implement authentication per CONTEXT.md
  Intent: Generate evals: F1-auth — from features.yaml behaviors and scenarios
```

Plays MUST pass a JSON contract to each agent invocation. The contract carries intent implicitly via `intent_path` pointing to the play's `reference/intent.yaml`.

### 4. Artifact Lifecycle

```
DRAFT → VALIDATE → LOCKED
```

- `--phase draft`: Agent generates initial artifact
- `--phase validate`: Agent runs validation, returns issues/score/checklist
- `--phase lock`: Play sets LOCKED — no agent call needed for metadata update

**Cycle-Back on Reject:**
- If user responds Vanish at validate phase → play outputs feedback prompt, returns to draft state
- Agent re-enters draft with original context + validate phase issues as `feedback` input
- Maximum 2 cycle-back iterations before escalating to user with structured failure
- Plays supporting cycle-back: discover-product, plan-roadmap, prepare-implementation

### 5. Cascade Sync

- Every derived artifact includes: `<!-- sync: source={path} hash={hash} generated={timestamp} -->`
- `--phase lock` MUST run `cascade-sync` skill before setting LOCKED status
- Sync rules, triggers, anti-patterns, and detection logic defined in `cascade-sync` skill spec

### 6. Compartmented Evaluation

implement-epic enforces 4-way context isolation:

| Agent | Receives | Does NOT receive |
|-------|----------|-----------------|
| tech-designer (Context Builder) | plan.yaml entry, architecture.yaml, tech.yaml | Evals, scenarios, features spec |
| eval-generator | features.yaml behaviors, scenarios.yaml verification scenarios, plan exit gate | Implementation code, builder prompts, prior evals, architecture |
| code-builder (Builder) | CONTEXT.md ONLY | Evals, eval IDs, judge reports, pass criteria, scenarios, features spec |
| judge | Encrypted evals + decryption key, project location | Builder prompts, builder reasoning, eval-generator prompts, quality results |
| quality-auditor | Implemented code, quality vision gates | Evals, builder prompts, judge reports |

**Why:** Information sharing between builder and evaluator creates confirmation bias. The judge must evaluate output independently. The builder must implement from spec context — not from knowledge of how it will be tested.

**Implementation:** The orchestrator is the ONLY entity that touches multiple agent outputs. When routing judge failures to builder, the orchestrator MUST strip eval IDs, eval text, pass criteria, and raw scores — passing only: category of failure, description of what is wrong, expected behavior.

---

## Build Priority

Plays are built one at a time. Priority set by user. Existing plays marked for IDD review.

| P# | Play | Level | Status | Notes |
|----|--------|-------|--------|-------|
| 1 | `start-feature` | L2 | ✅ COMPLETE | Compiled, uses project-orchestrator + repo-orchestrator |
| 2 | `capture-learning` | L1 | ⚠️ PARTIAL | Play exists, 2 skills missing |
| 3 | `implement-epic` | L2 | ✅ COMPLETE | Was implement-feature, eval-driven TDD |
| 4 | `start-feature-planning` | L2 | ✅ COMPLETE | Was start-planned-feature |
| 5 | `discover-product` | L2 | ✅ COMPLETE | Produces product.yaml + product-brief.html |
| 6 | `plan-roadmap` | L2 | ✅ COMPLETE | Reads product.yaml, produces roadmap.yaml + roadmap-brief.html |
| 7 | `manage-backlog` | L1 | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| 8 | `refine-backlog` | L1 | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| 9 | `build-feature` | L1 | ✅ COMPLETE | Delivered via `implement-epic` |
| 10 | `verify-feature` | L1 | ✅ COMPLETE | Delivered via `check-drift` |
| 11 | `commit-code` | L2 | ✅ COMPLETE | Auto-proceed mode via ship |
| 12 | `create-pr` | L2 | ✅ COMPLETE | Confidence-gated |
| 13 | `review-pr` | L2 | ✅ COMPLETE | Structure A — diff-scoped quality review with deterministic severity taxonomy and confidence gate (#208, 2026-04-13) |
| 14 | `deliver-feature` | L2 | ✅ COMPLETE | Delivered via `implement-epic` |
| 15 | `run-demo` | L1 | 🚫 NOT NEEDED | Descoped 2026-04-13 |
| 16 | `release` | L1 | ❌ NOT STARTED | Needs generate-changelog — kept pending |
| 17 | `fix-bug` | L1 | ✅ COMPLETE | Delivered as `/fix-it` |
| 18 | `review-architecture` | L1 | ✅ COMPLETE | Delivered via `quality-check` |
| 19 | `generate-docs` | L1 | ❌ NOT STARTED | 2 skills missing — kept pending |
| — | `ship` | L2 | ✅ COMPLETE | Structure C: chains commit-code + create-pr + merge-pr |
| — | `merge-pr` | L2 | ✅ COMPLETE | Merge + switch to main + branch cleanup |
| — | `prepare-implementation` | L2 | ✅ COMPLETE | 5 YAML artifacts + 5 briefs + hub.html |

### Backlog (unprioritized)

| Play | Level | SDLC Phase | Notes |
|--------|-------|------------|-------|
| `design-ux` | L2 | Product-2-Design | **PENDING-REFACTOR (#106)** — new play |
| `design-services` | L2 | Product-2-Design | **PENDING-REFACTOR (#106)** — new play |
| `build-arch` | L2 | Product-2-Design | **PENDING-REFACTOR (#106)** — new play |
| `plan-sprint` | L1 | Product-2-Design | Sprint planning ceremony |
| `create-wireframes` | L1 | Design-2-Spec | Standalone UX design |
| `create-adr` | L1 | Design-2-Spec | Standalone ADR creation |
| `evaluate-tech` | L1 | Design-2-Spec | Spike / tech evaluation |
| `hotfix` | L1 | Run-2-Monitor | Emergency variant of fix-bug |
| `audit-security` | L1 | Audit-2-Fix | OWASP scan, dependency audit |
| `audit-performance` | L1 | Audit-2-Fix | Load testing, profiling |
| `audit-accessibility` | L1 | Audit-2-Fix | WCAG compliance |
| `run-retro` | L1 | Learn-2-Memory | Retrospective ceremony |
| `run-standup` | L1 | Learn-2-Memory | Status generation |

---

## Agent Inventory

### Active Agents (11 total)

| Agent | Domain | Used By |
|-------|--------|---------|
| `product-strategist` | Product: market analysis, vision drafting, feature scoping, roadmaps, scenarios | discover-product, plan-roadmap, prepare-implementation, implement-epic (test scenarios step) |
| `tech-designer` | Technical: architecture design, tech design, feasibility, context building | plan-roadmap, prepare-implementation, implement-epic (context builder step) |
| `code-builder` | Implementation: TDD code writing per CONTEXT.md | implement-epic, start-feature-planning |
| `eval-generator` | Eval generation: encrypted evals from specs only | implement-epic |
| `quality-auditor` | Quality: lint, test, type check, build, vision gates | implement-epic |
| `judge` | Evaluation: decrypt evals, run checks, report pass/fail | implement-epic |
| `repo-orchestrator` | Git: commits, branches, PRs, merges, evidence self-commit | start-feature, commit-code, create-pr, merge-pr, ship, implement-epic, all evidence steps |
| `project-orchestrator` | Issues: create, resolve, map, track | start-feature, commit-code, create-pr |
| `doc-builder` | Documentation: HTML brief generation, hub.html | discover-product, plan-roadmap, prepare-implementation |
| `intent-crafter` | Intent authoring: draft intent.yaml from description | create-play |
| `intent-resolver` | Intent resolution: map intent to play pattern | create-play |

### Backlog Agents (not in current plan)

| Agent | Used By |
|-------|---------|
| `validator` | verify-feature, review-pr, deliver-feature, review-architecture (P10, P13, P14, P18) |
| `specifier` | define-feature (backlog) |
| `designer` | design-feature (backlog) |

---

## Play Specs — Universal Precursor

### Play: `start-feature` (P1 — COMPLETE)

**File:** `core/components/plays/start-feature/SKILL.md`

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | 2 |
| Agents | project-orchestrator, repo-orchestrator |
| Status | COMPLETE — compiled from intent.yaml via create-play |
| Compiled At | 2026-03-06 |

**Consumes:** Issue ID, description, or no args (infers from changed files)
**Generates:** GitHub issue, feature branch (`{type}/{issue}-{slug}`), `.Garura/{issue}/` STM directory

**Arguments:**
```
/start-feature [issue-number] ["description"]

Examples:
  /start-feature "QR code activation with commission tracking"
  /start-feature 42
  /start-feature  # no args — infers from changed files
```

**Key behaviors:**
- Single flow, no modes — all three input patterns converge on same downstream
- Uncommitted changes always preserved (never lost)
- Confidence-gated — low confidence on issue mapping halts the play
- Evidence self-commit via repo-orchestrator (ADR 012)
- Pause/resume via `{stm_base}/{issue}/status/start-feature.json`

---

## Play Specs — Learn-2-Memory

### Play: `capture-learning` (P2 — PARTIAL)

**File:** `core/components/plays/capture-learning/SKILL.md`
**Recent Updates:** #195 (2026-04) — broadened extraction from resolution-trace-only to multi-format evidence scanning so capture-learning no longer returns zero knowledge when traces are absent.

```yaml
intent: "Promote patterns, decisions, and learnings from STM into LTM"
constraints:
  - Must read completed work artifacts (specs, ADRs, evidence, retro notes)
  - Must produce structured LTM entries (practices, standards, templates)
  - Must not overwrite existing LTM — append or propose merge
failure_conditions:
  - No completed work artifacts to learn from
  - Proposed LTM entry contradicts existing practice without ADR justification
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 1 |
| Agents | product-strategist (or new knowledge agent TBD) |
| Status | PARTIAL — play exists, skills extract-patterns and draft-ltm-entry missing |

**Consumes:** Completed STM artifacts OR intent
**Generates:** LTM entries in `core/components/memory/` (practices, standards, templates)

**Skills needed:**
- `extract-patterns` — analyze completed work, identify reusable patterns
- `draft-ltm-entry` — produce structured LTM entry from patterns

---

## Play Specs — Product-2-Design

### Agent: `product-strategist`

**File:** `core/components/agents/product-strategist.md`

```yaml
domain: product
role: strategist
model: sonnet
tools: [Task, Read, Write, Glob, Grep, Skill]
```

**Responsibilities:**
- Accept product intent from play via JSON contract
- Discover market context and competitive landscape
- Generate product.yaml with strategic goals (not OKRs)
- Scope IDD epics with strategic goal references (SG-IDs)
- Draft roadmap.yaml with feasibility consolidated from tech-designer
- Draft features.yaml (product identity, invariants, scope, feature IDD fields, behaviors)
- Draft verification scenarios (scenarios.yaml)

**Skills Available:**

| Skill | Purpose |
|-------|---------|
| discover-product-opportunity | Parse problem/idea, extract market context |
| draft-product-vision | Create product.yaml with Strategic Goals |
| validate-product-vision | Check completeness before lock |
| scope-roadmap-epics | Derive IDD epics from locked product.yaml |
| draft-roadmap-brief | Generate roadmap-brief.html (human-reviewable) |
| draft-roadmap | Produce roadmap.yaml from approved brief + feasibility |
| draft-product-spec | Create features.yaml (product identity, invariants, scope, behaviors) |
| draft-verification-scenarios | Create scenarios.yaml with feature back-links and feature_gates |
| validate-implementation-design | Cross-validate all 5 artifacts (V1-V14) |
| generate-product-brief | Generate product-brief.html |
| generate-implementation-brief | Generate features-brief.html, scenarios-brief.html, plan-brief.html |

**IDD Awareness:**
- Reads JSON contract from play — `intent_path` provides constraints and failure conditions
- Reads LTM: practices, standards
- Reads STM: current product artifacts at stm_base paths
- Returns `step_failure` in contract if something goes wrong — never raw errors

---

### Play: `discover-product` (P5 — COMPLETE)

**File:** `core/components/plays/discover-product/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-16)
**Recent Updates:** #206 (2026-04) — brief generation made opt-in. doc-builder step no longer mandatory before human checkpoints.

```yaml
intent: "Discover product vision, strategic goals, and market positioning"
constraints:
  - C1: Intent text required for DRAFT — >5 meaningful words
  - C6: Artifacts go to .Garura/project/product/{slug}/
  - C7: Strategic Goals, not OKRs
  - C10: Interactive HTML brief with inline comment system
failure_conditions:
  - F1: product.yaml missing >=3 strategic goals
  - F2: Domain clarification rejected by user
  - F7: Attempt to overwrite LOCKED artifact
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | 3 (product-strategist ×2, doc-builder ×1) in DRAFT; 1 in VALIDATE; 0 in LOCK |
| Agents | product-strategist, doc-builder, repo-orchestrator (evidence) |
| Status | COMPLETE — compiled from intent.yaml |
| Compiled At | 2026-03-16 |

**Consumes:** User intent (problem/idea)
**Generates:** `product.yaml` (market context + vision consolidated), `product-brief.html`, `hub.html`

**Arguments:**
```
/discover-product --phase <draft|validate|lock> [--artifact <path>] [intent]
```

**Phase: DRAFT**
```
Step 1: product-strategist → discover-product-opportunity → market context written to product.yaml
Step 2: product-strategist → draft-product-vision → full product.yaml (DRAFT)
Step 3: doc-builder → generate-product-brief → product-brief.html + hub.html
Step 4: Human checkpoint (Tether/Vanish + optional feedback JSON)
Step 5: Evidence + evidence self-commit
```

**Phase: VALIDATE**
```
Step 1: product-strategist → validate-product-vision → validation_result
Step 2: Human review — cycle-back on Vanish (max 2 iterations)
Step 3: Evidence
```

**Phase: LOCK**
```
Step 1: Play directly sets status: LOCKED (no agent call)
Step 2: Evidence
```

**Key artifact schema fields (product.yaml):**
- `strategic_goals[].id` (SG-ID references — used by plan-roadmap epics)
- `status: DRAFT | LOCKED`
- Market context + vision consolidated in single file

---

### Play: `plan-roadmap` (P6 — COMPLETE)

**File:** `core/components/plays/plan-roadmap/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-16)
**Recent Updates:** #206 (2026-04) — brief generation made opt-in; `draft-roadmap` and `validate-roadmap` skills no longer reference brief generation.

```yaml
intent: "Plan a time-phased product roadmap from a locked product definition"
constraints:
  - C1: product.yaml must be LOCKED before planning
  - C4: Brief must not contain technical content not affecting sequencing/priority/timing
  - C8: Human brief approval is mandatory before any roadmap artifacts are produced
  - C9: roadmap.yaml must align with approved brief
failure_conditions:
  - F1: Epic count outside 3-6 range
  - F2: Epic strategic_goal_ref does not match product.yaml SG-IDs
  - F3: Epic missing IDD fields (intent p1/p2/p3, constraints, success_scenarios, failure_conditions)
  - F4: Brief has C-BRIEF-2 violation (technical content)
  - F5: roadmap.yaml approved_brief_ref missing or file absent
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | 3 domain (product-strategist ×2, tech-designer ×1) + 1 utility (repo-orchestrator) |
| Agents | product-strategist, tech-designer, repo-orchestrator |
| Status | COMPLETE — compiled from intent.yaml |
| Compiled At | 2026-03-16 |

**Consumes:** `product.yaml` (must be LOCKED via `--product` argument)
**Generates:** `roadmap.yaml`, `roadmap-brief.html`, `hub.html`

**NOTE:** Engineering view (formerly in plan-roadmap output) was removed. It will move to `build-arch` in the **PENDING-REFACTOR (#106)** restructure.

**Arguments:**
```
/plan-roadmap --product <path-to-locked-product.yaml>
/plan-roadmap --resume
```

**Execution Flow:**
```
Step 1: Create task graph (6 tasks with dependencies)
Step 2: product-strategist → scope-roadmap-epics → epics with strategic_goal_ref (SG-IDs)
Step 3: tech-designer → assess-feasibility → feasibility data per epic
Step 4: product-strategist → produce-brief → roadmap-brief.html (tabs: Strategy, Timeline, Feasibility, Comments) + hub.html
Step 5: Human review (feedback loop max 3 cycles, Tether/Vanish)
Step 6: product-strategist → produce-roadmap → roadmap.yaml (consolidates epics + feasibility)
Step 7: Scenario validation (SCE-1, SCE-2, SCE-4)
Step 8: Evidence + evidence self-commit
```

**Key artifact schema fields (roadmap.yaml):**
- `strategic_goal_ref` (SG-ID, not free text) — links epics to product.yaml strategic goals
- `feasibility[]` — consolidated from tech-designer output
- `approved_brief_ref` — path to the approved roadmap-brief.html
- `thesis`, `narrative`, `timeline[]`, `critical_blockers`, `open_questions`, `risk_summary`

**RESOLVED (2026-04-13):** The prepare-implementation slim-down / features.yaml split is no longer planned — current prepare-implementation shape is final.

---

## Play Specs — Prepare-to-Implement

### Play: `prepare-implementation` (NEW — COMPLETE)

**File:** `core/components/plays/prepare-implementation/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-16)
**Recent Updates:** #191 (2026-04) — added Phase 0 STM setup and fixed artifact lock path so the play correctly initializes issue STM before drafting.

```yaml
intent: "Produce implementation-ready design artifacts from product intent"
constraints:
  - C3: features.yaml must NOT contain technology names or implementation details
  - C4: architecture.yaml technology selections must be concrete with rationale
  - C5: tech.yaml must specify project structure, key files, and library versions
  - C6: plan.yaml sequences features as vertical slices (not components)
  - C7: scenarios.yaml must have pass_criteria and automation classification per scenario
  - C8: Every behavior in features.yaml must have >=1 scenario
  - C9: plan.yaml must contain ZERO scenario descriptions or scenario text (compartmentalization)
  - C11: Audience separation — features=product stakeholders, architecture=architects, tech=implementers, scenarios=validators
  - C12: plan.yaml scenario_gate references IDs and counts only — never content
  - C13: Every execution_order entry has observable exit_gate
failure_conditions:
  - F1: features.yaml contains tech refs
  - F2: architecture.yaml tech selections vague
  - F3: execution_order entries are not vertical slices
  - F4: scope items missing file paths
  - F5: exit gates not observable
  - F6: scenarios missing pass_criteria
  - F7: behaviors without coverage
  - F8: plan.yaml contains scenario text
  - F10: execution_order has <2 entries
  - F12: revision cycles exceeded
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Domain Agents | 2 (product-strategist ×3 calls, tech-designer ×2 calls in DRAFT; product-strategist ×1 in VALIDATE) |
| Utility Agents | 2 (doc-builder ×3, repo-orchestrator — exempt from budget) |
| Status | COMPLETE — compiled from intent.yaml |
| Compiled At | 2026-03-16 |
| Output Artifacts | 5 (features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml) |
| Review Briefs | 5 (features-brief.html, architecture-brief.html, tech-brief.html, scenarios-brief.html, plan-brief.html) |
| Hub | 1 (hub.html — regenerated after each checkpoint) |

**Consumes:** Product intent + optional upstream enrichment (product.yaml, roadmap.yaml if available — non-blocking per C1)
**Generates:** 5 YAML artifacts + 5 HTML briefs + hub.html

**Arguments:**
```
/prepare-implementation --phase <draft|validate|lock> [--artifact <path>] [--slug <slug>] [intent]
```

**DRAFT Phase — 3 Stages with Human Checkpoints:**

Stage 1 (Features):
```
Step 1: product-strategist → draft-product-spec → features.yaml
Step 2: doc-builder → generate-implementation-brief → features-brief.html + hub.html
Step 3: Human Checkpoint 1 (Tether/Orbit/Vanish)
```

Stage 2 (Architecture + Tech — Steps 4 and 5 may run in parallel):
```
Step 4: tech-designer → draft-technical-approach → architecture.yaml
Step 5: tech-designer → draft-lld → tech.yaml
Step 6: doc-builder → generate-implementation-brief → architecture-brief.html + tech-brief.html + hub.html
Step 7: Human Checkpoint 2 (Tether/Orbit/Vanish)
```

Stage 3 (Scenarios + Plan — Steps 8 and 9 may run in parallel):
```
Step 8: product-strategist → draft-verification-scenarios → scenarios.yaml
       IMPORTANT: scenarios.yaml content MUST NOT be visible to Step 9 (plan compartmentalization)
Step 9: tech-designer → draft-implementation-plan → plan.yaml
       plan.yaml references scenario IDs from Step 8 for scenario_gate fields — count-level only
Step 10: doc-builder → generate-implementation-brief → scenarios-brief.html + plan-brief.html + hub.html
Step 11: Human Checkpoint 3 (Tether/Orbit/Vanish)
```

**VALIDATE Phase:**
```
Step 12: product-strategist → validate-implementation-design → 14 checks (V1-V14)
Step 13: Present results — Tether to proceed to LOCK, Vanish to halt
```

**LOCK Phase:**
```
Step 14: Play sets status: LOCKED on all 5 artifacts (no agent calls)
Step 15: Evidence + evidence self-commit
```

**Key artifact schemas:**
- `features.yaml` — product identity, invariants, scope, features with IDD fields (intent p1/p2/p3, constraints, success_scenarios, failure_conditions), behaviors, blast_radius
- `architecture.yaml` — principles, NFRs, stack, platforms, integrations, agentic PCAM, technical_risks, deployment, observability
- `tech.yaml` — project structure, libraries with versions, data models, core components with interfaces/dependencies, design decisions, feature_mapping
- `scenarios.yaml` — scenario groups with feature_ref, behavior_ref, pass_criteria, automation classification, feature_gates, coverage
- `plan.yaml` — prerequisites (Phase 0), execution_order as vertical slices (scope items with key_files, exit_gate, scenario_gate), summary table with cumulative_scenarios

**RESOLVED (2026-04-13):** prepare-implementation slim-down dropped. The play keeps its current 5-artifact shape (features, architecture, tech, scenarios, plan). Design plays (see #106) will plug in alongside it, not replace its outputs.

---

## Play Specs — Implementation

### Play: `implement-epic` (P3 — COMPLETE, was implement-feature)

**File:** `core/components/plays/implement-epic/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-17)
**Recent Updates:** #191 (2026-04) — sources design artifacts from issue STM instead of product epics, aligning execution with the per-issue preparation flow.

```yaml
intent: "Implement a feature from a locked execution plan through an eval-driven TDD loop"
constraints:
  - C1: plan.yaml must be LOCKED
  - C2: Feature must have >=1 success scenario and >=1 failure condition
  - C3: All prerequisite sequences must be complete
  - C4: eval-generator receives ONLY specs — never implementation code or prior evals
  - C5: code-builder receives ONLY CONTEXT.md — never evals, eval IDs, scenarios, or features spec
  - C6: judge receives ONLY encrypted evals + project location — never builder prompts or quality results
  - C8: Evals stored OUTSIDE repo tree (/tmp/{slug}-evals/)
  - C9: Fresh evals generated per fix iteration (old evals discarded)
  - C10: Judge failures → builder: orchestrator strips eval IDs, text, criteria — passes category+description+expected only
  - C11: Max 3 fix iterations
  - C12: Project must build successfully at pre-flight
  - C14: quality-auditor receives ONLY code + quality vision gates — not evals or judge reports
  - C16: TDD vertical story — test first (red), implement (green), next scope item
failure_conditions:
  - F1: Build fails
  - F2: First-run eval pass rate <=50% — feature scope may need restructuring
  - F3: 3 fix iterations exhausted with failures remaining
  - F7: Builder contract contains eval IDs or eval text
  - F8: plan.yaml not LOCKED
  - F9: Feature not in execution order
  - F10: eval file not discarded before fresh generation
  - F11: Test scenarios < 1 per success scenario
  - F12: Scope item without corresponding test
  - F13: Lint violations
  - F14: Type check failures
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Model | opus |
| Domain Agents | 6 (tech-designer, eval-generator, code-builder, quality-auditor, judge, product-strategist) |
| Utility Agents | 1 (repo-orchestrator — exempt from budget) |
| Domain Calls (clean run) | 6 |
| Domain Calls (max with fix loop) | 15 (clean + 3 × [fix + quality + fresh-evals + fresh-judge]) |
| Status | COMPLETE — compiled from intent.yaml |
| Compiled At | 2026-03-17 |
| New Agents | 3 (eval-generator, quality-auditor, judge) |

**Consumes:** `--epic <feature-id>` (e.g., F1) from locked plan.yaml
**Generates:** Committed implementation code, judge report, quality report, manual test scenarios

**Arguments:**
```
/implement-epic --epic <feature-id> [--issue <issue-number>]

Examples:
  /implement-epic --epic F1 --issue 1
  /implement-epic --epic F2
```

**Execution Flow:**

Phase: Preparation
```
Step 1: tech-designer (Context Builder) → CONTEXT.md (<100 lines, 6 required sections, feature-scoped only)
Step 2: orchestrator → update CLAUDE.md with ## Active Implementation pointer
Step 3: orchestrator → capture quality vision gates (detect from project config)
Step 4: eval-generator → encrypted evals at /tmp/{slug}-evals/ (OUTSIDE repo)
Step 5: orchestrator → record preparation state in status file
```

Phase: Execution
```
Step 6: code-builder (Builder, TDD) → implement scope items (red-green per item), build report
Step 7: quality-auditor → run quality vision gates (build, lint, typecheck, tests) → quality report
         (Steps 7 and 8 may run in parallel after Step 6)
Step 8: judge → decrypt evals, run checks, produce judge report with per-eval PASS/FAIL
```

Phase: Fix Loop (conditional, max 3 iterations)
```
Step 9: orchestrator → derive remediation from judge report (strip eval IDs, pass category+description+expected only)
Step 10: code-builder (Builder) → fix per remediation, update tests
Step 11: quality-auditor → re-run all quality gates
Step 12: eval-generator (NEW INSTANCE) → discard old evals, generate fresh
Step 13: judge (NEW INSTANCE) → judge fresh evals
         → if 100% pass: proceed to Finalize
         → if fail and iteration < 3: return to Step 9
         → if iteration == 3 and fail: Step 14
Step 14: orchestrator → write failure report, halt
```

Phase: Finalize
```
Step 15: product-strategist (Scenario Writer) → manual test scenarios from feature success scenarios + exit gate
Step 16: repo-orchestrator → commit and push all implementation files
Step 17: orchestrator → clean up CLAUDE.md, archive CONTEXT.md
```

Phase: Scenario Validation + Evidence
```
Step 18: Scenario evals (SCE-1 through SCE-8, context-selected)
Step 19: Write evidence, present final report, evidence self-commit
```

**Extraction Candidates (inline contracts that may become skills after 3 successful runs):**
- `build-context` (Step 1) — CONTEXT.md generation
- `build-epic` (Step 6) — TDD vertical story orchestration
- `quality-gate` (Step 7) — Quality vision gate runner
- `judge-evals` (Step 8) — Eval execution and report generation
- `test-scenarios` (Step 15) — Scenario generation from feature + exit gate

---

## Play Specs — Code-2-Test

### Play: `commit-code` (P11 — COMPLETE)

**File:** `core/components/plays/commit-code/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-06)

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agents | repo-orchestrator, project-orchestrator |
| Status | COMPLETE |
| Compiled At | 2026-03-06 |

**Consumes:** Changed files (staged, unstaged, untracked) on current feature branch
**Generates:** Conventional commits grouped by concern, pushed branch

**Key behaviors:**
- Branch guard (halts on main/master)
- Sensitive file scan before any commit
- Change group analysis via repo-orchestrator
- Issue mapping with confidence scoring via project-orchestrator
- Checkpoint SKIPPED when all mappings are high-confidence (auto-proceed)
- When invoked by `ship`, passes `approval_override: auto-proceed`

---

### Play: `create-pr` (P12 — COMPLETE)

**File:** `core/components/plays/create-pr/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-06)

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agents | repo-orchestrator, project-orchestrator |
| Status | COMPLETE |
| Compiled At | 2026-03-06 |

**Consumes:** Pushed branch with commits ahead of base
**Generates:** PR with dynamic quality checklist, change-specific evidence, embedded eval results

**Key behaviors:**
- Platform-agnostic (reads `platform:` from .Garura/core/config.yaml)
- Checklist items are change-specific (every item has trigger reason tracing to diff)
- Confidence-gated — high confidence auto-submits; low confidence requires human review
- Checkpoint SKIPPED when all confidence signals high
- When invoked by `ship`, passes `approval_override: auto-proceed`

---

## Play Specs — Delivery

### Play: `ship` (NEW — COMPLETE)

**File:** `core/components/plays/ship/SKILL.md`
**Compiled From:** `reference/intent.yaml` via create-play (2026-03-06)

```yaml
intent: "Deliver current branch work to main — commit, PR, merge, and cleanup in one command"
constraints:
  - C1: Current branch must not be main/master/default
  - C2: All decisions auto-proceed — no human approvals at any stage
  - C3: Merge uses default strategy
  - C4: main is pulled after merge
  - C5: Feature branch deleted locally and remotely after merge
  - C6: Merge conflicts are a hard stop
failure_conditions:
  - F1: Feature branch not deleted after merge
  - F2: Merge conflict detected
  - F3: Local checkout not on main after pipeline completes
  - F4: No issue reference in PR
  - F5: PR targets wrong base branch
  - F6: Changes still uncommitted after commit-code
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Workflow Structure | C (chains L2 sub-plays) |
| Sub-Plays | 3 (commit-code, create-pr, merge-pr) |
| Agent Calls | 0 direct (delegated to sub-plays) |
| Status | COMPLETE |
| Compiled At | 2026-03-06 |

**Consumes:** Uncommitted changes on a feature branch
**Generates:** Commits + merged PR + main up to date + feature branch deleted

**Sub-play chain:**
```
Step 1: commit-code (with approval_override: auto-proceed)
Step 2: create-pr (with approval_override: auto-proceed)
Step 3: merge-pr (default merge strategy, main pull, branch cleanup)
Step 4: Scenario evals (SCE-1, SCE-2)
Step 5: Evidence self-commit (lands on main)
```

---

### Play: `merge-pr` (NEW — COMPLETE)

**File:** `core/components/plays/merge-pr/SKILL.md`

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Status | COMPLETE |

**Consumes:** Open PR (reads PR number from STM written by create-pr)
**Generates:** Merged PR, local checkout on main, latest pull, feature branch deleted

---

## Artifact Schemas

All artifact schemas are defined in `.claude/specs/artifact-schemas/`. Each schema defines the required fields, status lifecycle, and audience for its artifact.

| Schema File | Artifact | Audience | Produced By |
|-------------|----------|----------|-------------|
| `product.yaml` | Product vision + market context | Product stakeholders | discover-product |
| `roadmap.yaml` | Time-phased roadmap with feasibility | Product + Engineering | plan-roadmap |
| `features.yaml` | Feature IDD definitions, behaviors, invariants | Product stakeholders | prepare-implementation |
| `architecture.yaml` | Tech stack, principles, NFRs, agentic PCAM | Architects + implementers | prepare-implementation |
| `tech.yaml` | Project structure, libraries, components, feature mapping | Implementers | prepare-implementation |
| `scenarios.yaml` | Verification scenarios, feature_gates, coverage | Validators only | prepare-implementation |
| `plan.yaml` | Execution order, scope items, exit gates, scenario gates | Engineering leads + implementers | prepare-implementation |

**Key naming conventions:**
- Feature IDs: F1, F2, F3 (not E-IDs)
- Strategic Goal IDs: SG-01, SG-02 (referenced by `strategic_goal_ref` in epics and roadmap)
- Scenario IDs: S-F1-01, S-F1-02 (feature-scoped)

**Brief design system:** All HTML briefs follow `brief-principles.md` — tabbed layout, inline comment system (text selection → popup → persistent highlights → export JSON), LifeOS design language.

---

## Cross-Cutting Patterns

### JSON Contract Flow

Every play → agent invocation uses a JSON contract:

```json
{
  "intent_path": "{play_dir}/reference/intent.yaml",
  "stm_base": ".Garura/project/product/",
  "slug": "{slug}",
  "task_id": "{task-id}",
  "stm": {
    "input": { ... },
    "output": { ... }
  },
  "config": { ... },
  "step_failure": null
}
```

The agent reads `intent_path` for constraints and failure conditions. The agent returns the enriched contract with `stm.output` populated and `step_failure` set if something went wrong.

### Pause and Resume

Every play writes a status file:
- `{stm_base}/{issue}/status/{play}.json` for issue-scoped plays
- `{stm_base}/product/{slug}/status/{play}.json` for product-scoped plays

Status file tracks per-task completion. On resume: skip completed steps, reset in_progress to pending, continue from first incomplete.

### Evidence Self-Commit (ADR 012)

Every play's final step invokes `repo-orchestrator` to self-commit evidence files. Non-blocking — failure does not halt the play. Evidence lands in `{stm_base}/{scope}/evidence/{play}/{YYYYMMDD-HHMMSS}.md`.

### Recovery Pattern

When an agent returns `step_failure` (non-null):
1. Read `step_failure.domain_assessment.responsible_domain`
2. Invoke responsible agent with current contract + retry context
3. Max 2 retries per step. After 2 failures, halt with full failure context.

Pre-flight failures are never recoverable — hard halt with clear error message.
