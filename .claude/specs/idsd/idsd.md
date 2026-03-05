# IDSD — Intent Driven Software Development: Complete Lifecycle Specification

**Version:** 2.2.0
**Date:** 2026-03-05 (updated from 2026-02-21)
**Status:** IN PROGRESS — 4/19 complete (P1, P4, P5, P11). Four Crafts architecture (#85) supersedes original recipe/agent patterns.
**Author:** Meridian

---

## Intent

**Intent:** Build a complete AI-native software development lifecycle for Meridian that covers the full journey from product discovery through feature delivery, operations, and learning — where humans express intent and AI agents execute with full traceability, audience separation, and context economy.

**Constraints:**
- MUST follow IDD principles — intent in, quality out
- MUST respect Meridian architecture: Recipes → Agents → Skills
- MUST maintain audience separation — each artifact serves ONE stakeholder
- MUST maintain context economy — agents load only what they need (≤12K tokens per task)
- MUST follow L1/L2 recipe constraints (L1 ≤2 agents, L2 ≤5 agents)
- MUST build on existing components, not replace them
- MUST use DRAFT → VALIDATE → LOCKED artifact lifecycle
- MUST be intent-sufficient — every recipe works from intent alone; upstream artifacts are helpful, not blocking
- MUST support non-linear invocation — any recipe can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied

**Failure Conditions:**
- Agent loads >20K tokens of context for a single task → halt, bundle is too fat
- Artifact serves multiple audiences without clear separation → halt, audience collision
- Recipe bypasses agent for domain-specific work → halt, agent-first violation
- Verification gate has no concrete checkable criteria → halt, gate is ceremonial
- Task has no gate mapping → halt, verification gap
- Derived artifact (bundle, task, gate) is out of sync with its source → halt, sync breach

---

## Progress Tracker (as of 2026-03-05)

### Architecture Change Notice

**Four Crafts architecture (#85/#86, merged 2026-03-05) supersedes the recipe/agent patterns described in this spec.** All remaining work must follow the new pattern:
- Recipes pass a **single JSON contract** to agents (not individual parameters)
- Templates live in **LTM** (`core/components/memory/standards/templates/`) per ADR 009
- **Intent-resolution protocol removed** — agents read JSON contract directly
- **Task-driven DAGs** — recipes create task graphs before agent execution

### Priority Status

| Priority | Recipe | Status | Notes |
|---|---|---|---|
| P1 | start-feature | ✅ COMPLETE | IDD headers, resume mode, STM support |
| P2 | capture-learning | ⚠️ PARTIAL | Recipe exists, 2 skills missing (extract-patterns, draft-ltm-entry) |
| P3 | implement-feature | ❌ NOT STARTED | **Critical blocker** — validator agent + 3 skills needed. Blocks P10, P13, P14, P18 |
| P4 | start-feature-planning | ✅ COMPLETE | Renamed from start-planned-feature, IDD refactored |
| P5 | discover-product | ✅ COMPLETE | All 4 skills + recipe + product-strategist agent built |
| P6 | plan-roadmap | ⚠️ PARTIAL | Recipe works with Four Crafts (JSON contract, task DAG). Spec'd skills (prioritize-product-features, draft-product-roadmap, validate-product-roadmap) replaced by scope-roadmap-epics, assess-feasibility, draft-roadmap-brief, draft-roadmap, generate-engineering-view |
| P7 | manage-backlog | ❌ NOT STARTED | 3 skills missing |
| P8 | refine-backlog | ❌ NOT STARTED | 1 of 2 skills exists (analyze-backlog) |
| P9 | build-feature | ❌ NOT STARTED | Recipe missing |
| P10 | verify-feature | ❌ NOT STARTED | Blocked by P3 (needs validator) |
| P11 | commit-code | ✅ COMPLETE | IDD headers, structured failure |
| P12 | create-pr | ⚠️ INCOMPLETE | Exists but needs IDD compliance (T-110–T-113) |
| P13 | review-pr | ❌ NOT STARTED | Blocked by P3 (needs validator) |
| P14 | deliver-feature | ❌ NOT STARTED | Blocked by P3 (needs validator) |
| P15 | run-demo | ❌ NOT STARTED | 2 skills missing |
| P16 | release | ❌ NOT STARTED | Blocked by P15 (needs generate-changelog) |
| P17 | fix-bug | ❌ NOT STARTED | 2 skills missing |
| P18 | review-architecture | ❌ NOT STARTED | Blocked by P3 (needs validator) |
| P19 | generate-docs | ❌ NOT STARTED | 2 skills missing |

### Component Inventory

| Component | Built | Missing | Notes |
|---|---|---|---|
| Agents | 5 | 1 (validator) | validator blocks 5 priorities |
| Skills | 18 | ~16 | P5 skills complete, P6 skills diverged |
| Recipes | 8 | 11 | 4 complete, 2 partial, 2 incomplete |
| Verification gates | 2 pass | ~53 blocked | G-100, G-103 pass |

### Dependency Blockers

```
P3 (validator agent) ──► P10, P13, P14, P18 (5 priorities blocked)
P15 (generate-changelog) ──► P16 (1 priority blocked)
```

---

## Foundation — IDD Principles

IDSD operationalizes **IDD (Intent-Driven Development)** — the paradigm that defines how humans express intent and AI agents execute with full traceability. IDD is to IDSD as Agile is to Scrum.

Full IDD principles: `docs/philosophy/intent-driven-development.md`

### The 8 IDD Elements → IDSD Mapping

| # | IDD Element | IDD Principle | IDSD Implementation |
|---|-------------|--------------|---------------------|
| 1 | Intent Layer | Capture WHY — business goals, outcomes, constraints — at a stable abstraction above specifications | Every recipe has an IDD intent header (intent/constraints/failure_conditions). Users provide business intent; recipes carry SDLC intent. Two-Layer Intent Model. |
| 2 | Signals | System activates through event-driven triggers, not manual kickoffs | User CLI invocations (`/build-feature`, `/commit-code`) are the current signal mechanism. Recipes are the entry point for all signals. |
| 3 | Orchestrated Intent | Recipes bridge intent and execution at graduated autonomy levels | L1 recipes (≤2 agents), L2 recipes (≤5 agents). Three speeds: Fast (minutes), Planned (hours), Strategic (days). 19 prioritized recipes across 8 phases (5 primary, 3 supporting). |
| 4 | Agents | Autonomous decision-makers accept intent and determine HOW within their domain | 8 agents: product-strategist, specifier, designer, validator, code-builder, tech-designer, repo-orchestrator, project-orchestrator. Agent-first pattern enforced. |
| 5 | Memory | Persistent organizational context across sessions | LTM (`core/components/memory/`) for practices, standards, templates. STM (`.meridian/{issue}/`) for per-issue work context. LTM governance via Git: PR-based promotion with tiered review (project-level → team, org-level → engineering leaders). Memory enables deterministic adaptation. |
| 6 | Skills | Bounded, repeatable execution capabilities that agents invoke | Skills execute work; they never decide when they run. Each recipe lists its skills with input/output contracts. |
| 7 | Context-Aware Decisions | Every decision accounts for full environmental context | Context bundles ≤12K tokens per agent task. Audience separation (Tier 1/2/3). Agents read LTM + STM to build execution context. |
| 8 | Generation-Verification Loops | Every output passes through quality gates | DRAFT → VALIDATE → LOCKED lifecycle. Verification gates per recipe. Evidence artifacts. Tether/Vanish checkpoints. |

### Two-Layer Intent Model

IDSD operates with two distinct intent layers:

| Layer | Who Authors | When | Example |
|-------|------------|------|---------|
| **Business Intent** | User or upstream recipe | Every invocation | "Add CSV export with auth" |
| **SDLC Intent** | Framework author | Recipe creation (once) | "Build implementation from intent or spec" |
| **Artifact Intent** | Generated by agents | During execution | vision.md carries business intent forward |

Business intent flows THROUGH recipes. SDLC intent tells recipes HOW to operate. Generated artifacts carry business intent forward through the entire lifecycle.

### Intent-Sufficiency Principle

Upstream artifacts enrich, never block. If intent is clear, proceed. If critical context is missing, suggest upstream recipe as option — user decides. This is how IDSD supports non-linear invocation: any recipe can be called at any point if the three elements of intent (intent, constraints, failure conditions) are satisfied.

---

## SDLC Phases

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
    build-feature        start-planned-feature   full SDLC pipeline
    │                          │                         │
    ▼                          ▼                         ▼

─── PRIMARY PIPELINE (linear) ──────────────────────────────────────────────────

Product-2-Design  Design-2-Spec  Spec-2-Code  Code-2-Test   Test-2-Run
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
│discover-     │ │define-     │ │build-    │ │verify-   │  │create-pr │
│product       │ │feature     │ │feature   │ │feature   │  │deliver-  │
│plan-roadmap  │ │design-     │ │          │ │commit-   │  │feature   │
│manage-       │ │feature     │ │          │ │code      │  │release   │
│backlog       │ │create-     │ │          │ │review-pr │  │run-demo  │
│refine-       │ │wireframes  │ │          │ │          │  │          │
│backlog       │ │create-adr  │ │          │ │          │  │          │
│plan-sprint   │ │evaluate-   │ │          │ │          │  │          │
│              │ │tech        │ │          │ │          │  │          │
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
  implement-feature    Spec-2-Test     build → verify per vertical
  start-planned-feature Design-2-Code  plan + build, fast
```

---

## Cross-Cutting Rules

### 1. Audience Separation

```
Tier 1: Human Review    → business-review.md, technical-design.md, ux-spec.md
Tier 2: Agent Bundles   → v{N}-backend.md, v{N}-frontend.md, v{N}-integration.md
Tier 3: Orchestration   → tasks.md, verify.md
```

- Tier 1 reviewed by humans BEFORE Tier 2 bundles are generated
- Tier 2 bundles are self-contained — agent reads ONE bundle, not all
- Tier 3 references bundle IDs, not full content

### 2. Context Bundles

- Bundle = one vertical × one concern, ≤12K tokens
- Bundle MUST include IDD intent header from parent spec
- Bundle MUST list gate IDs it must satisfy
- Rule IDs MUST be preserved from parent spec
- Bundle structure, generation flow, and context budgets defined in `bundler` skill spec

### 3. IDD Intent Header

Every recipe and every generated artifact MUST start with:

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
  Intent: Build backend: v1-backend bundle — implement CSV export endpoint
  Intent: Verify gates: verify.md gate-subset G-041,G-042 — post-vertical-1 check
```

Recipes MUST pass this formatted intent string as the first line of each agent invocation context block. Do not pass intent implicitly via recipe context alone.

### 4. Artifact Lifecycle

```
DRAFT → VALIDATE → LOCKED
```

- `--phase draft`: Agent generates initial artifact
- `--phase validate`: Agent runs validation, returns issues/score/checklist
- `--phase lock`: Cascade sync → re-validate → set LOCKED

**Cycle-Back on Reject:**
- If user responds Vanish at validate phase → recipe outputs feedback prompt, returns to draft state
- Agent re-enters draft with original context + validate phase issues as `feedback` input
- Maximum 2 cycle-back iterations before escalating to user with structured failure
- Recipes supporting cycle-back: discover-product, plan-roadmap, manage-backlog

### 6. Compartmented Evaluation

Build-phase and verify-phase agents operate under an information barrier — they must NOT share context:

| Agent | Receives | Does NOT receive |
|-------|----------|-----------------|
| code-builder (build-feature) | Bundle context (≤12K) + LTM practices | verify.md, gate IDs, validation criteria |
| validator (verify-feature) | Implementation output + verify.md gates | Bundle contents, builder's internal reasoning |

**Why:** Information sharing between builder and validator creates confirmation bias. The validator must evaluate output independently — if it knows what the builder tried to do, it grades effort instead of outcome.

**Implementation:** Recipes must construct agent invocations with scoped context. `build-feature` passes bundle ONLY. `verify-feature` passes implementation path + verify.md path ONLY.

### 5. Cascade Sync

- Every derived artifact includes: `<!-- sync: source={path} hash={hash} generated={timestamp} -->`
- `--phase lock` MUST run `cascade-sync` skill before setting LOCKED status
- Sync rules, triggers, anti-patterns, and detection logic defined in `cascade-sync` skill spec

**Cascade sync invocation:**

| Recipe Phase | Calls cascade-sync | Context |
|-------------|-------------------|---------|
| Any `--phase lock` | YES (mandatory) | `spec_path` = current artifact directory |
| `implement-feature` start | YES (check_only=true) | Verify bundles not stale before building. If stale → halt with structured failure: list stale artifacts, suggest running `--phase lock` on parent spec to regenerate. Do NOT auto-regenerate in check_only mode. |

---

## Build Priority

Recipes are built one at a time. Priority set by user. Existing recipes marked for IDD review.

| P# | Recipe | Level | SDLC Phase | Status | Action |
|----|--------|-------|------------|--------|--------|
| 1 | `start-feature` | L1 | Universal Precursor | EXISTS | Review for IDD + add resume mode |
| 2 | `capture-learning` | L1 | Learn-2-Memory | NEW | Build |
| 3 | `implement-feature` | L2 | Spec-2-Test | NEW (specced) | Build |
| 4 | `start-planned-feature` | L2 | Design-2-Code | EXISTS | Review for IDD |
| 5 | `discover-product` | L1 | Product-2-Design | NEW (specced) | Build |
| 6 | `plan-roadmap` | L1 | Product-2-Design | NEW (specced) | Build |
| 7 | `manage-backlog` | L1 | Product-2-Design | NEW (specced) | Build |
| 8 | `refine-backlog` | L1 | Product-2-Design | NEW | Build |
| 9 | `build-feature` | L1 | Spec-2-Code | NEW (specced) | Build |
| 10 | `verify-feature` | L1 | Code-2-Test | NEW (specced) | Build |
| 11 | `commit-code` | L1 | Code-2-Test | EXISTS | Review for IDD |
| 12 | `create-pr` | L1 | Test-2-Run | EXISTS | Review for IDD |
| 13 | `review-pr` | L1 | Code-2-Test | NEW | Build |
| 14 | `deliver-feature` | L2 | Test-2-Run | NEW (specced) | Build |
| 15 | `run-demo` | L1 | Test-2-Run | NEW | Build |
| 16 | `release` | L1 | Test-2-Run | NEW | Build |
| 17 | `fix-bug` | L1 | Run-2-Monitor | NEW | Build |
| 18 | `review-architecture` | L1 | Audit-2-Fix | NEW | Build |
| 19 | `generate-docs` | L1 | Audit-2-Fix | NEW | Build |

### Backlog (unprioritized)

| Recipe | Level | SDLC Phase | Notes |
|--------|-------|------------|-------|
| `define-feature` | L1 | Design-2-Spec | Full spec exists — strategic pipeline |
| `design-feature` | L1 | Design-2-Spec | Full spec exists — strategic pipeline |
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

## Recipe Specs — Universal Precursor

### Recipe: `start-feature` (P1 — EXISTS, review for IDD)

**File:** `core/components/recipes/start-feature/SKILL.md` (existing, evolve)

```yaml
intent: "Create or resume a work context — issue + branch + STM directory"
constraints:
  - Must always be the first step for any work
  - NEW mode: create GitHub issue + feature branch + STM dir
  - RESUME mode: resolve existing issue, checkout branch, prepare environment
  - Must link to roadmap/epic if available (accountability)
failure_conditions:
  - Branch already exists and has conflicts
  - Issue ID not found (resume mode)
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | project-orchestrator, repo-orchestrator |
| Status | EXISTS — needs resume mode + IDD intent header |

**Consumes:** Issue ID or description
**Generates:** GitHub issue, feature branch, `.meridian/{issue}/` STM directory

**Arguments:**
```
/start-feature [--resume <issue-id>] [description]

Examples:
  /start-feature "QR code activation with commission tracking"
  /start-feature --resume 42
```

**Evolution needed:**
- Add IDD intent header (intent/constraints/failure_conditions)
- Add `--resume` mode: resolve issue, checkout branch, verify STM dir exists
- Add STM directory creation: `.meridian/{issue}/`
- Add roadmap/epic linking if available

---

## Recipe Specs — Learn-2-Memory

**Phase intent:** Learn-2-Memory closes the feedback loop by capturing what was learned during delivery and promoting it into long-term organizational memory. This includes retrospectives, standup summaries, and — critically — STM→LTM promotion: the process of taking issue-specific learnings from short-term memory (`.meridian/{issue}/`) and promoting them into long-term memory (`core/components/memory/`) so they benefit future work.

### Recipe: `capture-learning` (P2 — NEW)

**File:** `core/components/skills/capture-learning/SKILL.md`

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

**Consumes:** Completed STM artifacts (specs, evidence, ADRs, retro notes) OR intent
**Generates:** LTM entries in `core/components/memory/` (practices, standards, templates)

**Arguments:**
```
/capture-learning [--source <path>] [--type <practice|standard|template>] [intent]

Examples:
  /capture-learning --source .meridian/42/ --type practice
  /capture-learning "We learned that QR validation needs offline fallback"
```

**Skills needed:**
- `extract-patterns` — analyze completed work, identify reusable patterns
- `draft-ltm-entry` — produce structured LTM entry from patterns

**LTM Governance Integration:**

The capture-learning recipe is the primary mechanism for STM→LTM promotion. It must integrate with the LTM governance workflow documented in `docs/philosophy/idsd.md`:

- Generated LTM entries are NOT directly written to `core/components/memory/`. Instead, they are staged for PR-based review.
- Project-level LTM entries are reviewed by team leads and senior developers.
- Org-level LTM entries are reviewed by engineering leaders and CTOs.
- The `extract-patterns` skill should detect semantic overlap with existing LTM entries (designed, not yet built in v1).
- The `draft-ltm-entry` skill must check for conflicts with existing LTM entries before proposing writes.

This governance workflow ensures that bad practices (e.g., "always add retry logic" applied blindly inside transactions) cannot poison LTM without human review proportional to blast radius.

---

## Recipe Specs — Spec-2-Test (Compound L2)

### Recipe: `implement-feature` (P3 — NEW, specced)

**File:** `core/components/recipes/implement-feature/SKILL.md`

```yaml
intent: "Implement a feature end-to-end: build all verticals, verify all gates"
constraints:
  - Must invoke build-feature per vertical (L1 sub-recipe)
  - Must invoke verify-feature after each vertical and at the end (L1 sub-recipe)
  - Backend and frontend of same vertical can run in parallel
  - Different verticals run sequentially (dependencies)
failure_conditions:
  - Mandatory gates fail after all build attempts
  - Bundle staleness detected at start (cascade-sync check_only)
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | ≤5 (typical: 3-4) |
| Agents | code-builder, validator, repo-orchestrator |
| Checkpoint | After each vertical + final validation |

**Consumes:** spec bundles, tasks.md, verify.md, OR intent
**Generates:** implementation code, commits, gate evidence, validation report

**Arguments:**
```
/implement-feature [--spec <path>] [--vertical <N>] [intent]

Examples:
  /implement-feature --spec .meridian/{issue}/spec/
  /implement-feature --spec .meridian/{issue}/spec/ --vertical 1
  /implement-feature "Implement QR activation feature end to end"
```

**Execution Flow:**
```
1. Resolve context:
   ├── Spec provided → Run cascade-sync (check_only=true), read tasks.md
   └── Intent only  → Derive plan from intent + codebase + LTM

2. For each vertical (or specified vertical):
   a. Invoke: build-feature --bundle v{N}-backend
   b. Invoke: build-feature --bundle v{N}-frontend
   c. Invoke: verify-feature --spec {path} --gate {vertical gates}
   Checkpoint: files changed, tests, gates status
   User: Tether / Vanish

3. Final: verify-feature --spec {path} --all
   Checkpoint: full gate summary, evidence manifest
   User: Tether (ready for delivery) / Vanish (fix issues)
```

---

## Recipe Specs — Design-2-Code (Compound L2)

### Recipe: `start-planned-feature` (P4 — EXISTS, review for IDD)

**File:** `core/components/recipes/start-planned-feature/SKILL.md` (existing, evolve)

```yaml
intent: "Quick idea-to-PR: create issue, plan with IDD principles, build, and deliver — lightweight planning without full spec ceremony"
constraints:
  - Embeds start-feature flow (issue + branch + STM) — does not call it separately
  - Plan sub-agent produces lightweight IDD-aware planning artifacts (intent header, not full gates/bundles)
  - Planning artifacts are thin but intent-driven: every artifact carries intent/constraints/failure_conditions forward
  - Must build working code with tests (code-builder scoped to CODE only)
  - Must commit via repo-orchestrator (agent-first)
  - Single approval gate (Tether/Vanish at plan review) — execution is autonomous after
failure_conditions:
  - Intent too vague to derive design (Plan sub-agent cannot produce meaningful spec)
  - User rejects plan at approval gate (Vanish)
  - Implementation fails tests
  - Branch creation fails on origin
  - PR creation fails after commits
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | ≤5 |
| Agents | project-orchestrator, Plan sub-agent (Claude OOTB), code-builder, repo-orchestrator |
| Status | EXISTS — IDD review: frontmatter, agent routing, templates, recovery |

**Consumes:** Issue ID, description, or intent
**Generates:** Lightweight planning artifacts (spec.md, verify.md, tasks.md in `.meridian/{issue}/planning/`), implementation code, commits, PR

**Planning Artifacts (IDD-aware but lightweight):**
```
.meridian/{issue}/planning/
├── spec.md      # IDD intent header + summary, approach, risks (NOT audience-separated)
├── verify.md    # IDD intent header + acceptance criteria, verification steps (NOT formal gates)
└── tasks.md     # IDD intent header + execution steps (NOT dependency graph)
```

**Evolution needed:**
- Update IDD frontmatter to match recipe's actual purpose
- Add Agent Routing Table (Domain / Agent / Intent Slice)
- Externalize templates to `templates/` directory
- Add Recovery section (structured-failure-protocol + intent-driven-recovery)
- Scope code-builder invocation to CODE only (no docs, no markdown)
- Update Plan sub-agent prompt to produce IDD intent headers in planning artifacts

---

## Recipe Specs — Product-2-Design

### Agent: `product-strategist`

**File:** `core/components/agents/product-strategist.md`

```yaml
domain: product
role: strategist
model: sonnet
tools: [Task, Read, Write, Glob, Grep, Skill]
```

**Responsibilities:**
- Accept product intent from recipe
- Discover market context and competitive landscape
- Generate vision with strategic goals
- Prioritize features and build roadmaps
- Decompose epics into INVEST-compliant stories

**Skills Available:**

| Skill | Purpose |
|-------|---------|
| discover-product-opportunity | Parse problem/idea, extract market context |
| draft-product-vision | Create vision document with Strategic Goals |
| validate-product-vision | Check completeness before lock |
| prioritize-product-features | Score and rank features (RICE/MoSCoW) |
| draft-product-roadmap | Generate timeline with dependencies |
| validate-product-roadmap | Check feasibility, dependencies |
| decompose-product-epic | Split epic into manageable chunks |
| draft-product-stories | INVEST-compliant stories with AC |
| validate-product-backlog | Check INVEST, acceptance criteria |
| generate-business-review | PM-facing business review from any artifact |

**IDD Awareness:**
- Reads intent from recipe invocation
- Reads LTM: spec-structure practice (when available), domain conventions
- Reads STM: current project context, existing product artifacts
- Returns structured failure if intent is too vague to derive market context

---

### Recipe: `discover-product` (P5 — NEW, specced)

**File:** `core/components/recipes/discover-product/SKILL.md`

```yaml
intent: "Discover and document product vision, strategic goals, and market positioning"
constraints:
  - Must produce audience-appropriate vision document
  - Must include Strategic Goals section (replaces OKRs)
  - Must identify target users and competitive landscape
failure_conditions:
  - Problem statement too vague to derive market context
  - No clear target audience identifiable
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 (draft) / 1 (validate) / 0 (lock) |
| Agents | product-strategist |

**Consumes:** User intent (problem/idea)
**Generates:** vision.md (incl. Strategic Goals), business-review

**Arguments:**
```
/discover-product --phase <draft|validate|lock> [--artifact <path>] [intent]
```

**Phase: DRAFT**
```
Agent → product-strategist
  → discover-product-opportunity
  → draft-product-vision

Output: .meridian/project/product/{slug}/vision.md (DRAFT)
Checkpoint: Present vision summary
```

**Phase: VALIDATE**
```
Agent → product-strategist → validate-product-vision
Output: validation_result
```

**Phase: LOCK**
```
Run cascade-sync → Set LOCKED
```

**Skills:** discover-product-opportunity, draft-product-vision, validate-product-vision, generate-business-review
**Templates:** `templates/vision.md`, `templates/business-review.md`

---

### Recipe: `plan-roadmap` (P6 — NEW, specced)

**File:** `core/components/recipes/plan-roadmap/SKILL.md`

```yaml
intent: "Prioritize features and build a release timeline from strategic goals"
constraints:
  - Must use RICE or MoSCoW scoring
  - Must account for feature dependencies
  - Must align features to strategic goals from vision
failure_conditions:
  - No features identified from intent or vision
  - Features have circular dependencies
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 (draft) / 1 (validate) / 0 (lock) |
| Agents | product-strategist |

**Consumes:** vision.md OR intent + features list
**Generates:** roadmap.md, business-review

**Skills:** prioritize-product-features, draft-product-roadmap, validate-product-roadmap, generate-business-review
**Templates:** `templates/roadmap.md`, `templates/business-review.md`

---

### Recipe: `manage-backlog` (P7 — NEW, specced)

**File:** `core/components/recipes/manage-backlog/SKILL.md`

```yaml
intent: "Decompose a roadmap feature into an INVEST-compliant epic with user stories"
constraints:
  - Each story must have acceptance criteria
  - Stories must be independently deliverable
  - Epic must link to strategic goals and roadmap feature
failure_conditions:
  - Epic too large to decompose (>15 stories suggests splitting)
  - Stories violate INVEST principles
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 (draft) / 1 (validate) / 0 (lock) |
| Agents | product-strategist |

**Consumes:** roadmap.md OR intent + epic description
**Generates:** backlog/{epic}.md, business-review

**Skills:** decompose-product-epic, draft-product-stories, validate-product-backlog, generate-business-review
**Templates:** `templates/backlog-epic.md`, `templates/business-review.md`

---

### Recipe: `refine-backlog` (P8 — NEW)

**File:** `core/components/recipes/refine-backlog/SKILL.md`

```yaml
intent: "Groom existing backlog — reprioritize stories, split large ones, update estimates"
constraints:
  - Must read existing backlog epic(s)
  - Must preserve story IDs for traceability
  - Must re-validate INVEST compliance after changes
failure_conditions:
  - No existing backlog to refine
  - Refinement introduces circular dependencies
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | product-strategist |

**Consumes:** Existing backlog/{epic}.md OR intent describing what to refine
**Generates:** Updated backlog/{epic}.md, refinement summary

**Skills needed:**
- `analyze-backlog` — identify stories needing splitting, reprioritization, or estimation
- `refine-product-stories` — apply refinements, maintain INVEST compliance

---

## Recipe Specs — Spec-2-Code

### Recipe: `build-feature` (P9 — NEW, specced)

**File:** `core/components/recipes/build-feature/SKILL.md`

```yaml
intent: "Build implementation code from a spec bundle or intent"
constraints:
  - Must produce working code with unit tests
  - Must commit via repo-orchestrator (agent-first)
  - Must load ≤12K tokens of bundle context per task
failure_conditions:
  - Bundle exceeds 12K token budget
  - No clear implementation scope derivable from intent
  - Tests fail after implementation
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | code-builder, repo-orchestrator |

**Consumes:** spec bundle (v{N}-backend/frontend), OR intent + codebase context
**Generates:** implementation code, unit tests, commit

**Arguments:**
```
/build-feature [--bundle <id>] [--spec <path>] [intent]
```

**Execution Flow:**
```
1. Resolve context:
   ├── Bundle provided? → Load bundle (≤12K tokens)
   ├── Spec path provided? → Read tasks.md, derive bundle
   └── Intent only? → Derive from intent + codebase + LTM

2. Agent → code-builder
3. Agent → repo-orchestrator (via commit-code)

Checkpoint: files changed, tests run, commit summary
```

---

## Recipe Specs — Code-2-Test

### Agent: `validator`

**File:** `core/components/agents/validator.md`

```yaml
domain: quality
role: validator
model: sonnet
tools: [Task, Read, Bash, Glob, Grep, Skill]
```

**Responsibilities:**
- Verify implementation against gates defined in verify.md
- Run tests and check coverage
- Validate against LTM quality standards
- Produce evidence artifacts for each gate

**Skills Available:**

| Skill | Purpose |
|-------|---------|
| verify-gate | Run verification steps for a specific gate |
| run-test-suite | Execute tests and report coverage |
| validate-implementation | Full implementation validation against spec |

**IDD Awareness:**
- Reads intent from recipe invocation
- Reads LTM: quality standards, testing conventions
- Reads STM: verify.md gates, implementation context
- Returns structured failure if no gates defined and intent too vague

---

### Recipe: `verify-feature` (P10 — NEW, specced)

**File:** `core/components/recipes/verify-feature/SKILL.md`

```yaml
intent: "Verify implementation against quality gates"
constraints:
  - Must produce evidence artifact for each gate checked
  - Must run test suite and report coverage
  - Must report blocking issues clearly
failure_conditions:
  - No gates defined and intent too vague to derive criteria
  - Evidence cannot be produced (e.g., no tests exist)
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 1 |
| Agents | validator |

**Consumes:** verify.md + implementation code, OR intent
**Generates:** gate evidence, test results, validation report (in evidence/)

---

### Recipe: `commit-code` (P11 — EXISTS, review for IDD)

**File:** `core/components/recipes/commit-code/SKILL.md` (existing)

```yaml
intent: "Stage and commit code changes with conventional commit messages"
constraints:
  - Must group changes by concern (feature, fix, refactor)
  - Must use conventional commit format
  - Must run pre-commit hooks
failure_conditions:
  - No changes to commit
  - Pre-commit hooks fail after retry
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | repo-orchestrator, project-orchestrator |
| Status | EXISTS — review for IDD intent header |

---

### Recipe: `review-pr` (P13 — NEW)

**File:** `core/components/recipes/review-pr/SKILL.md`

```yaml
intent: "Perform structured code review — security, architecture, performance, correctness"
constraints:
  - Must check against project quality standards (from LTM)
  - Must produce actionable review comments (not vague suggestions)
  - Must flag blocking issues vs suggestions
failure_conditions:
  - PR has no diff (empty PR)
  - Cannot access repository or PR
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | validator, tech-designer |

**Consumes:** PR URL or branch name, OR intent describing what to review
**Generates:** Review comments on PR, review summary

**Skills needed:**
- `analyze-pr` (EXISTS) — analyze branch, generate quality checklist
- `review-code-quality` — structured review against LTM standards
- `post-review-comments` — post findings as PR comments

**Note:** `analyze-pr` skill already exists. This recipe wraps it with structured review flow.

---

## Recipe Specs — Test-2-Run

### Recipe: `create-pr` (P12 — EXISTS, review for IDD)

**File:** `core/components/recipes/create-pr/SKILL.md` (existing)

```yaml
intent: "Push branch and create pull request with quality checklist"
constraints:
  - Must generate context-aware quality checklist
  - Must include change summary
  - Must link to issue if available
failure_conditions:
  - No commits to push
  - Branch conflicts with target
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 1 |
| Agents | repo-orchestrator |
| Status | EXISTS — review for IDD intent header |

---

### Recipe: `deliver-feature` (P14 — NEW, specced)

**File:** `core/components/recipes/deliver-feature/SKILL.md`

```yaml
intent: "Ship a verified feature to the target branch via PR"
constraints:
  - Must verify all mandatory gates pass before PR creation
  - Must generate delivery report with evidence manifest
  - Must use repo-orchestrator for PR (agent-first)
failure_conditions:
  - Mandatory gates not passed and user declines to run verify-feature
  - PR creation fails
```

| Attribute | Value |
|-----------|-------|
| Level | L2 |
| Agent Calls | ≤4 |
| Agents | validator, repo-orchestrator |

**Consumes:** gate evidence, verify.md, OR intent
**Generates:** delivery-report.md, PR

**Execution Flow:**
```
1. Agent → validator (confirm delivery readiness)
2. Agent → repo-orchestrator (create PR via create-pr)
3. Checkpoint: Present PR
4. Agent → validator (optional post-merge health check)
```

**Skills:** verify-gate, validate-implementation, generate-delivery-report, create-pr
**Templates:** `templates/delivery-report.md`

---

### Recipe: `run-demo` (P15 — NEW)

**File:** `core/components/recipes/run-demo/SKILL.md`

```yaml
intent: "Generate sprint review materials — changelog, demo script, metrics summary"
constraints:
  - Must read completed work from git log and closed issues
  - Must produce human-readable demo script with talking points
  - Must include before/after metrics if available
failure_conditions:
  - No completed work in the period
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | project-orchestrator, product-strategist |

**Consumes:** Git log + closed issues for a period, OR intent describing what to demo
**Generates:** demo-script.md, changelog.md

**Skills needed:**
- `generate-changelog` — aggregate commits/PRs into categorized changelog
- `draft-demo-script` — produce talking points from completed features

---

### Recipe: `release` (P16 — NEW)

**File:** `core/components/recipes/release/SKILL.md`

```yaml
intent: "Create a release — version bump, changelog, tag, deploy"
constraints:
  - Must follow semantic versioning
  - Must aggregate all changes since last release
  - Must produce release notes from PR descriptions and commits
failure_conditions:
  - Unreleased breaking changes without major version bump
  - Failing tests on release branch
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | repo-orchestrator, validator |

**Consumes:** Branch with merged features, OR intent describing release scope
**Generates:** version bump, CHANGELOG.md update, git tag, GitHub release

**Skills needed:**
- `generate-changelog` (shared with run-demo)
- `bump-version` — semantic version bump based on change types
- `create-release` — tag + GitHub release with notes

---

## Recipe Specs — Run-2-Monitor

### Recipe: `fix-bug` (P17 — NEW)

**File:** `core/components/recipes/fix-bug/SKILL.md`

```yaml
intent: "Diagnose, fix, and verify a bug"
constraints:
  - Must diagnose root cause before fixing (not just patch symptoms)
  - Must add regression test for the fix
  - Must commit via repo-orchestrator (agent-first)
failure_conditions:
  - Cannot reproduce the bug
  - Fix introduces new test failures
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | tech-designer (diagnose), code-builder (fix) |

**Consumes:** Bug description, error logs, issue reference, OR intent
**Generates:** Root cause analysis, fix + regression test, commit

**Skills needed:**
- `diagnose-bug` — reproduce, trace, identify root cause
- `fix-and-test` — implement fix + regression test

**Flow:**
```
1. Agent → tech-designer (diagnose root cause)
2. Agent → code-builder (fix + regression test + commit)
Checkpoint: Present RCA + fix summary
```

---

## Recipe Specs — Audit-2-Fix

### Recipe: `review-architecture` (P18 — NEW)

**File:** `core/components/recipes/review-architecture/SKILL.md`

```yaml
intent: "Evaluate system architecture health — patterns, dependencies, tech debt, scalability"
constraints:
  - Must read codebase structure, not just docs
  - Must check against LTM architecture standards
  - Must produce actionable findings (not vague observations)
failure_conditions:
  - Codebase too large to analyze within context budget
  - No architecture standards in LTM to review against
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 2 |
| Agents | tech-designer, validator |

**Consumes:** Codebase path, existing ADRs, OR intent describing focus area
**Generates:** architecture-review.md with findings, recommendations, proposed ADRs

**Skills needed:**
- `analyze-architecture` — scan codebase structure, dependencies, patterns
- `evaluate-tech-debt` — identify debt, categorize, estimate remediation

---

## Recipe Specs — Audit-2-Fix

### Recipe: `generate-docs` (P19 — NEW)

**File:** `core/components/recipes/generate-docs/SKILL.md`

```yaml
intent: "Generate documentation from code and specs — API docs, technical docs, onboarding"
constraints:
  - Must read actual code, not just comments
  - Must follow project documentation conventions (from LTM)
  - Must be accurate — no hallucinated APIs or parameters
failure_conditions:
  - Code has no clear public API surface
  - Generated docs contradict actual code behavior
```

| Attribute | Value |
|-----------|-------|
| Level | L1 |
| Agent Calls | 1 |
| Agents | specifier (or tech-designer) |

**Consumes:** Codebase path + existing docs, OR intent describing what to document
**Generates:** Documentation files (API docs, guides, README updates)

**Skills needed:**
- `extract-api-surface` — scan code for public APIs, endpoints, types
- `draft-documentation` — produce structured docs from extracted surface

---

## Skill Contracts (detailed)

Detailed input/output contracts for skills referenced by prioritized recipes. These contracts define what the builder must implement.

### Product-2-Design Skills

#### `discover-product-opportunity`

**File:** `core/components/skills/discover-product-opportunity/SKILL.md`

**Input:**
```yaml
problem_statement: {user's problem or idea description}
market_hints: {optional — industry, geography, target segment}
```

**Output Contract:**
```yaml
market_context:
  problem: {refined problem statement}
  target_users: [{persona 1}, {persona 2}]
  competitors: [{name, strengths, weaknesses}]
  market_size: {TAM/SAM/SOM estimates if derivable}
  differentiators: [{what makes this unique}]
  risks: [{market risks identified}]
```

#### `draft-product-vision`

**File:** `core/components/skills/draft-product-vision/SKILL.md`

**Input:**
```yaml
market_context: {from discover-product-opportunity}
product_name: {optional}
```

**Output Contract:**
```yaml
vision:
  path: {path to vision.md}
  sections: [problem_statement, target_users, value_proposition, strategic_goals, success_metrics, competitive_landscape, assumptions, out_of_scope]
```

**Templates:** `templates/vision.md`

#### `validate-product-vision`

**Input:** `vision_path: {path}`
**Output:** `validation_result` with `ready_for_lock`, `completeness_score`, `issues[]`, `checklist[]`

#### `prioritize-product-features`

**Input:**
```yaml
features: [{name, description}]
scoring_method: RICE|MoSCoW
strategic_goals: [{goal}]
```

**Output:** `ranked_features` with `method`, `features[{name, score, rank, strategic_alignment}]`

#### `draft-product-roadmap`

**Input:**
```yaml
ranked_features: {from prioritize}
time_horizon: {quarters or months}
capacity_hints: {optional}
```

**Output:** `roadmap` with `path`, `sections`, `features_count`, `releases_count`
**Templates:** `templates/roadmap.md`

#### `validate-product-roadmap`

**Input:** `roadmap_path`, `vision_path` (optional)
**Output:** `validation_result` with `ready_for_lock`, `feasibility_score`, `issues[]`, `checklist[]`

#### `decompose-product-epic`

**Input:**
```yaml
feature_name: {from roadmap or intent}
feature_description: {scope and context}
constraints: {technical or business}
```

**Output:** `epic_structure` with `title`, `story_count`, `stories[{id, title, type, priority, dependencies}]`

#### `draft-product-stories`

**Input:** `epic_structure`, `strategic_goals` (optional), `roadmap_feature` (optional)
**Output:** `backlog` with `path`, `sections`, `story_count`, `invest_compliant`
**Templates:** `templates/backlog-epic.md`

#### `validate-product-backlog`

**Input:** `backlog_path`
**Output:** `validation_result` with `ready_for_lock`, `invest_score`, `issues[]`, `checklist[]`

#### `generate-business-review`

**Input:** `artifact_path`, `audience: "Product Manager"`
**Output:** `business_review` with `path`, `summary`, `key_decisions`, `risks`, `next_steps`
**Templates:** `templates/business-review.md`

### Code-2-Test Skills

#### `verify-gate`

**Input:** `gate_id`, `verify_path`, `implementation_path`
**Output:** `gate_result` with `gate_id`, `status`, `steps[]`, `evidence_path`, `issues[]`
**References:** `reference/gate-patterns.md`

#### `run-test-suite`

**Input:** `test_path`, `test_runner` (auto-detect), `coverage_thresholds`, `scope` (all|changed)
**Output:** `test_result` with `total`, `passed`, `failed`, `skipped`, `coverage{}`, `failing_tests[]`

#### `validate-implementation`

**Input:** `spec_path`, `implementation_path`, `gate_ids[]` (optional)
**Output:** `implementation_validation` with `ready_for_delivery`, `gates[]`, `overall_score`, `blocking_issues[]`
**References:** `reference/quality-standards.md`

### Cross-Cutting Skills

#### `cascade-sync`

**Input:** `spec_path`, `check_only: false`
**Output:** `sync_result` with `status`, `artifacts_checked`, `artifacts_stale`, `artifacts_regenerated`, `details[]`
**References:** `reference/sync-rules.md`

#### `bundler`

**Input:** `spec_path`, `technical_design_path`, `ux_spec_path`, `verify_path`
**Output:** `bundles[]` with `id`, `path`, `vertical`, `concern`, `entities/screens`, `gates[]`, `token_estimate`
**References:** `reference/bundle-rules.md`
**Templates:** `templates/bundle.md`

#### `generate-delivery-report`

**Input:** `spec_path`, `evidence_path`, `pr_url`, `branch`
**Output:** `delivery_report` with `feature`, links, `implementation{}`, `verification{}`, `pr{}`, `evidence_manifest`
**Templates:** `templates/delivery-report.md`

---

## Agents

### New Agents (4)

| Agent | Domain | Role | Model | Used By |
|-------|--------|------|-------|---------|
| product-strategist | product | strategist | sonnet | discover-product, plan-roadmap, manage-backlog, refine-backlog |
| specifier | specification | specifier | sonnet | define-feature (backlog), generate-docs |
| designer | design | designer | sonnet | design-feature (backlog), create-wireframes (backlog) |
| validator | quality | validator | sonnet | verify-feature, deliver-feature, review-pr, review-architecture, release |

### Existing Agents (4, unchanged)

| Agent | Domain | Role | Used By |
|-------|--------|------|---------|
| code-builder | implementation | builder | build-feature, implement-feature, start-planned-feature, fix-bug |
| tech-designer | design | designer | start-planned-feature, fix-bug, review-architecture |
| repo-orchestrator | repository | orchestrator | start-feature, build-feature, create-pr, deliver-feature, commit-code, release |
| project-orchestrator | project | orchestrator | start-feature, commit-code, run-demo |

---

## Storage Layout

```
.meridian/
├── project/
│   └── product/{slug}/              # Product-2-Design artifacts
│       ├── vision.md
│       ├── roadmap.md
│       ├── backlog/{epic}.md
│       └── reviews/{artifact}-review.md
│
└── {issue}/                          # Per-issue STM (all other phases)
    ├── spec/                         # Design-2-Spec output
    │   ├── business-review.md
    │   ├── technical-design.md
    │   ├── ux-spec.md
    │   ├── verify.md
    │   ├── tasks.md
    │   └── bundles/
    ├── design/                       # Design-2-Spec output
    │   ├── architecture.md
    │   └── ux-design.md
    ├── evidence/                     # Code-2-Test output
    │   └── g-{NNN}-*.md
    └── delivery/                     # Test-2-Run output
        └── delivery-report.md

core/components/memory/               # LTM (Learn-2-Memory output)
├── practices/
├── standards/
└── templates/
```

---

## Dependency Graph

```
start-feature (universal — always first)
  │  NEW: create issue + branch
  │  RESUME: resolve issue, prepare env
  │
  ├─── Strategic Track (days) ─────────────────────────────────────┐
  │  Product-2-Design:                                             │
  │    discover-product → plan-roadmap → manage-backlog            │
  │         │ enriches ▼                                           │
  │  Design-2-Spec: define-feature → design-feature                │
  │         │ enriches ▼                                           │
  │  Spec-2-Code: build-feature                                    │
  │         │ enriches ▼                                           │
  │  Code-2-Test: verify-feature → commit-code                     │
  │         │ enriches ▼                                           │
  │  Test-2-Run: deliver-feature → create-pr                       │
  │                                                                │
  ├─── Operative Fast (minutes) ───────────────────────────────────┤
  │     build-feature → commit-code → deliver-feature              │
  │                                                                │
  ├─── Operative Planned (hours) ──────────────────────────────────┤
  │     start-planned-feature (Design-2-Code L2)                   │
  │                                                                │
  ├─── Bug Fix ────────────────────────────────────────────────────┤
  │     fix-bug → commit-code → create-pr                          │
  │                                                                │
  │  Cross-cutting (any time):                                     │
  │    review-pr, review-architecture, release, run-demo           │
  │    generate-docs, capture-learning, refine-backlog             │
  │                                                                │
  │  Spec-2-Test L2: implement-feature (build → verify)            │
  │                                                                │
  ▼                                                                │
DONE ──→ capture-learning (Learn-2-Memory, feeds back to LTM)        │
```

---

## Future Extensions (Backlog — unprioritized)

| Recipe | Level | SDLC Phase | Notes |
|--------|-------|------------|-------|
| `define-feature` | L1 | Design-2-Spec | Full spec exists — audience-separated spec + bundles |
| `design-feature` | L1 | Design-2-Spec | Full spec exists — architecture + UX + ADRs |
| `plan-sprint` | L1 | Product-2-Design | Sprint planning — capacity, goal, commitment |
| `create-wireframes` | L1 | Design-2-Spec | Standalone UX — screens, flows, prototypes |
| `create-adr` | L1 | Design-2-Spec | Standalone architecture decision record |
| `evaluate-tech` | L1 | Design-2-Spec | Spike / tech evaluation → produces ADR |
| `hotfix` | L1 | Run-2-Monitor | Emergency variant of fix-bug, bypass normal flow |
| `audit-security` | L1 | Audit-2-Fix | OWASP scan, dependency audit, secrets detection |
| `audit-performance` | L1 | Audit-2-Fix | Load testing, profiling, bottleneck identification |
| `audit-accessibility` | L1 | Audit-2-Fix | WCAG compliance check |
| `run-retro` | L1 | Learn-2-Memory | Retrospective — capture what worked/didn't |
| `run-standup` | L1 | Learn-2-Memory | Generate status from git/issues, surface blockers |
| `monitor-to-design` | L1 | Monitor-2-Design (planned) | Production feedback → auto-generated intent candidates. Concept only — see `docs/philosophy/idsd.md` Monitor-to-Design section. 18-24 months. |
| `bootstrap-codebase` | L1 | Learn-2-Memory | Brownfield bootstrap — "codebase-to-LTM" for cold-start on legacy codebases. Concept only. |
| Memory Evolution (infrastructure) | — | Infrastructure | Server-based LTM (MCP), semantic search, org-wide federation. See `docs/philosophy/idsd.md` Memory Evolution Trajectory. 12-24 months. |
| Tool Integration (MCP) | — | Infrastructure | Jira, Notion, Linear MCP server integrations. Architecture supports — incremental addition. See Enterprise Wrapper in `docs/philosophy/idsd.md`. |
| CTO Domain Parameters | — | Infrastructure | Per-project quality thresholds, mandatory gates, approval workflows. Concept stage. |
| LTM Quality/Decay Automation | — | Learn-2-Memory | Automated freshness scoring, relevance decay, contradiction detection for LTM. Planned, not designed. |
