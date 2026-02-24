# IDSD — Verification Gates

**Version:** 2.1.0
**Date:** 2026-02-21
**Status:** DRAFT — Pending Review
**Tasks Reference:** `idsd-tasks.md`
**Spec Reference:** `idsd.md`

---

## How To Use This Document

Each verification gate defines:
- **Gate ID** — Unique identifier organized by recipe priority range (G-0XX cross-cutting/universal, G-1XX P1-P5, G-2XX P6-P10, G-3XX P11-P15, G-4XX P16-P19)
- **Name** — What is being verified
- **Recipe Priority / SDLC Phase** — Which prioritized recipe and SDLC phase this gate applies to
- **Mandatory** — Whether this is a hard blocker (YES) or advisory (NO)
- **Depends On** — Other gates that must pass first
- **Verification Steps** — Concrete checkable criteria with checkboxes
- **Evidence** — What artifact proves the gate passed (stored in `evidence/`)

Gates are organized by build priority order (P1 first), not by waves. Cross-cutting gates (G-0XX) apply across all recipes and are checked continuously.

---

## Cross-Cutting Gates (G-0XX)

These gates apply to all recipes and must be satisfied throughout the build.

### G-001: Structured Failure Protocol on All Agents

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all recipes |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] `product-strategist.md` includes structured failure return section with required fields: what_failed, why, domain_assessment, context, suggested_fix
- [ ] `validator.md` includes structured failure return section with all required fields
- [ ] `code-builder.md` includes structured failure return section with all required fields
- [ ] `tech-designer.md` includes structured failure return section with all required fields
- [ ] `repo-orchestrator.md` includes structured failure return section with all required fields
- [ ] `project-orchestrator.md` includes structured failure return section with all required fields
- [ ] All structured failure returns include: `within_my_domain`, `responsible_domain`, `suggested_agent`
- [ ] All agents reference `~/.meridian/core/memory/practices/structured-failure-protocol.md`
- [ ] No agent returns a raw error string — always returns structured failure YAML
- [ ] All structured failures include: `self_recovery_attempted` and `self_recovery_details` fields
- [ ] Max 1 self-recovery attempt documented per agent

**Evidence:** `evidence/g-001-structured-failure.md` — structured failure section from each agent file, protocol reference confirmation

---

### G-002: IDD Intent Propagation in All Prioritized Recipes

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — P1 through P19 |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] `start-feature` recipe passes intent string to project-orchestrator and repo-orchestrator invocations
- [ ] `capture-learning` recipe passes intent string to agent invocation
- [ ] `implement-feature` recipe passes intent string including bundle id and vertical to code-builder invocation
- [ ] `implement-feature` recipe passes intent string including gate subset to validator invocation
- [ ] `start-planned-feature` recipe passes intent string to Plan sub-agent and code-builder invocations
- [ ] `discover-product` recipe passes intent string to product-strategist invocation
- [ ] `plan-roadmap` recipe passes intent string to product-strategist invocation
- [ ] `manage-backlog` recipe passes intent string to product-strategist invocation
- [ ] `refine-backlog` recipe passes intent string to product-strategist invocation
- [ ] `build-feature` recipe passes intent string to code-builder and repo-orchestrator invocations
- [ ] `verify-feature` recipe passes intent string to validator invocation
- [ ] `commit-code` recipe passes intent string to repo-orchestrator and project-orchestrator invocations
- [ ] `create-pr` recipe passes intent string to repo-orchestrator invocation
- [ ] `review-pr` recipe passes intent string to validator and tech-designer invocations
- [ ] `deliver-feature` recipe passes intent string to validator and repo-orchestrator invocations
- [ ] `run-demo` recipe passes intent string to project-orchestrator and product-strategist invocations
- [ ] `release` recipe passes intent string to repo-orchestrator and validator invocations
- [ ] `fix-bug` recipe passes intent string to tech-designer and code-builder invocations
- [ ] `review-architecture` recipe passes intent string to tech-designer and validator invocations
- [ ] `generate-docs` recipe passes intent string to agent invocation
- [ ] Intent format in all recipes: `"Intent: {verb}: {artifact_or_scope} — {context_hint}"` (canonical format from idsd.md Intent Propagation Format section)
- [ ] Intent is passed as first line of each agent invocation context block — not implicit

**Evidence:** `evidence/g-002-intent-propagation.md` — intent string from each recipe's agent invocation blocks

---

### G-003: Tether/Vanish Checkpoint Pattern at All Approval Points

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all recipes with user-facing checkpoints |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] `start-feature` recipe has Tether/Vanish checkpoint after issue + branch creation
- [ ] `discover-product` recipe has Tether/Vanish checkpoint after draft phase, after validate phase
- [ ] `plan-roadmap` recipe has Tether/Vanish checkpoint after draft phase, after validate phase
- [ ] `manage-backlog` recipe has Tether/Vanish checkpoint after draft phase, after validate phase
- [ ] `implement-feature` recipe has Tether/Vanish checkpoint after each vertical
- [ ] `implement-feature` recipe has Tether/Vanish checkpoint after final validation
- [ ] `deliver-feature` recipe has Tether/Vanish checkpoint before merge (after PR creation)
- [ ] `build-feature` recipe has Tether/Vanish checkpoint after commit
- [ ] `fix-bug` recipe has Tether/Vanish checkpoint after RCA + fix summary
- [ ] `release` recipe has Tether/Vanish checkpoint before tagging
- [ ] `run-demo` recipe has Tether/Vanish checkpoint after demo script generation
- [ ] No recipe uses `AskUserQuestion` tool — all checkpoints are output-and-wait pattern
- [ ] Tether → proceed; Vanish → cancel; any other response → clarify

**Evidence:** `evidence/g-003-tether-vanish.md` — checkpoint blocks from each recipe, AskUserQuestion absence confirmation

---

### G-004: Context Budget Enforced Across All Agent Invocations

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — build-feature, implement-feature, verify-feature |
| SDLC Phase | Spec-2-Code, Code-2-Test |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] spec-structure LTM practice documents the context budget table: bundle ≤12K, gate subset ≤3K, task context ≤2K, total ≤17K
- [ ] bundler skill enforces 12K token limit at generation time — fails if exceeded
- [ ] cascade-sync enforces 12K token limit at regeneration time — fails if exceeded
- [ ] `implement-feature` and `build-feature` recipes load ONE bundle per agent invocation (not multiple bundles simultaneously)
- [ ] `implement-feature` recipe loads ONLY relevant gates (subset) per agent invocation
- [ ] Agent invocations for code-builder do NOT include the full technical-design.md or ux-spec.md — only the vertical bundle
- [ ] `validate-implementation` skill loads gate results from evidence files (already computed) — not re-runs full spec
- [ ] Failure condition from spec enforced: agent loads >20K tokens → halt, bundle is too fat

**Evidence:** `evidence/g-004-context-budget.md` — spec-structure LTM budget table, bundler enforcement check, recipe invocation analysis

---

### G-005: Cascade Sync Prevents Stale Artifacts

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all phase-lock flows, implement-feature |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/skills/cascade-sync/SKILL.md`
- [ ] Input contract declares: spec_path, check_only (boolean)
- [ ] Output contract includes: sync_result.status (synced|stale|error)
- [ ] Output contract includes: artifacts_checked, artifacts_stale, artifacts_regenerated
- [ ] Output contract includes: details list with artifact, source, status, source_hash, artifact_hash, action
- [ ] Skill computes hash of each Tier 1 source and compares to derived artifact sync headers
- [ ] Stale artifacts are regenerated (not just flagged) when check_only is false
- [ ] Sync headers updated in all regenerated artifacts (`<!-- sync: source={path} hash={hash} generated={timestamp} -->`)
- [ ] Rule IDs, gate IDs, and task IDs preserved across regeneration
- [ ] Skill fails when regenerated bundle exceeds 12K tokens
- [ ] cascade-sync runs as mandatory step in ALL `--phase lock` flows
- [ ] `implement-feature` recipe runs cascade-sync (check_only=true) at start to verify bundles not stale
- [ ] Reference file exists: `cascade-sync/reference/sync-rules.md`
- [ ] Anti-pattern blocked: locking Tier 1 without regenerating Tier 2 bundles
- [ ] Anti-pattern blocked: running implement-feature with stale bundles (halts with error)
- [ ] When check_only=true and stale artifacts found: recipe halts and lists stale files with regeneration instructions
- [ ] Structured failure message includes: which artifacts are stale, their source spec path, command to regenerate (run `--phase lock` on parent spec)
- [ ] Auto-regeneration does NOT happen in check_only mode — user must explicitly trigger lock phase

**Evidence:** `evidence/g-005-cascade-sync.md` — skill file structure, sync detection logic, lock flow integration, anti-pattern enforcement

---

### G-006: Three-Speeds Model Routing in Universal Precursor

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — start-feature (P1) routing |
| SDLC Phase | Universal Precursor |
| Mandatory | YES |
| Depends On | G-100 |

**Verification Steps:**
- [ ] `start-feature` recipe documentation or routing section identifies three speeds: Fast (minutes), Planned (hours), Strategic (days)
- [ ] Fast speed routes to: `build-feature` → `commit-code` → `deliver-feature`
- [ ] Planned speed routes to: `start-planned-feature` (Design-2-Code L2)
- [ ] Strategic speed routes to: full SDLC pipeline starting with `discover-product`
- [ ] Routing guidance is human-readable — describes what to do next after start-feature completes
- [ ] start-feature does NOT force a specific speed — it surfaces options and lets human decide

**Evidence:** `evidence/g-006-three-speeds.md` — start-feature routing section, three-speed documentation

---

### G-007: Artifact Lifecycle Enforcement (DRAFT → VALIDATE → LOCKED)

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — discover-product (P5), plan-roadmap (P6), manage-backlog (P7) |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-110, G-200, G-210 |

**Verification Steps:**
- [ ] `--phase draft` generates artifact with status DRAFT
- [ ] `--phase validate` reads DRAFT artifact and returns validation result
- [ ] `--phase lock` sets artifact status to LOCKED only when validation passes
- [ ] `--phase lock` is blocked when validation has blocker-severity issues
- [ ] Lock prerequisite chain is enforced: vision LOCKED before roadmap can DRAFT
- [ ] roadmap LOCKED before backlog epic can DRAFT
- [ ] backlog epic LOCKED before `define-feature` can start (backlog recipe for future use)
- [ ] Attempting to LOCK with unresolved blockers returns structured failure
- [ ] Validate-phase rejection (Vanish) cycles back to DRAFT with feedback — recipe does NOT halt
- [ ] Cycle-back passes validation issues list as `feedback` to draft agent re-invocation
- [ ] Maximum 2 cycle-back iterations before structured failure is returned
- [ ] Recipes that support cycle-back: discover-product, plan-roadmap, manage-backlog
- [ ] LOCKED artifacts cannot be directly edited without dropping to DRAFT first
- [ ] Lock prerequisite chain does NOT require OKRs — vision LOCKED is sufficient for roadmap DRAFT

**Evidence:** `evidence/g-007-lifecycle-enforcement.md` — each prerequisite step documented with recipe invocation trace

---

### G-008: Agent-First Pattern in All Recipes

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all recipes |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] No recipe performs git operations directly — all git work delegated to repo-orchestrator
- [ ] No recipe performs issue tracking directly — all issue work delegated to project-orchestrator
- [ ] No recipe performs code writing directly — all implementation delegated to code-builder
- [ ] No recipe performs validation/testing directly — all verification delegated to validator
- [ ] No recipe performs product strategy directly — all product work delegated to product-strategist
- [ ] No recipe performs architecture analysis directly — all design work delegated to tech-designer
- [ ] Agent invocations in all recipes use Task tool (not inline tool use)

**Evidence:** `evidence/g-008-agent-first.md` — each recipe's agent delegation pattern, confirmation that no recipe uses direct tool calls for domain work

---

### G-009: L1 and L2 Recipe Level Constraints

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all recipes |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] All L1 recipes declare ≤2 agent calls: start-feature, capture-learning, discover-product, plan-roadmap, manage-backlog, refine-backlog, build-feature, verify-feature, commit-code, create-pr, review-pr, run-demo, release, fix-bug, review-architecture, generate-docs
- [ ] All L2 recipes declare ≤5 agent calls: implement-feature, start-planned-feature, deliver-feature
- [ ] L1 recipes are invocable by both Human and Model
- [ ] L2 recipes are invocable by Human only
- [ ] Each recipe file explicitly declares its Level (L1 or L2) in its header
- [ ] Each recipe file explicitly declares its agent call count

**Evidence:** `evidence/g-009-recipe-level-constraints.md` — level declaration and agent call count from each recipe file

---

### G-010: Compartmented Evaluation — Builder/Validator Information Barrier

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — build-feature (P9), verify-feature (P10), implement-feature (P3) |
| SDLC Phase | Spec-2-Code, Code-2-Test |
| Mandatory | YES |
| Depends On | G-230, G-240 |

**Verification Steps:**
- [ ] `build-feature` recipe invocation context for code-builder contains ONLY: bundle content (≤12K), LTM practices, codebase context
- [ ] `build-feature` recipe does NOT pass verify.md, gate IDs, or validation criteria to code-builder
- [ ] `verify-feature` recipe invocation context for validator contains ONLY: verify.md gates, implementation output path
- [ ] `verify-feature` recipe does NOT pass bundle contents or design specs to validator
- [ ] `implement-feature` recipe constructs separate scoped context for each sub-recipe invocation (no shared context bundle)
- [ ] Agent invocation descriptions in all three recipes explicitly document what is and is not passed

**Evidence:** `evidence/g-010-compartmented-evaluation.md` — recipe invocation context blocks, scope declarations for builder and validator

---

## P1-P5 Gates (G-1XX)

### G-100: start-feature Recipe — IDD Compliance and Resume Mode

| Property | Value |
|----------|-------|
| Recipe Priority | P1 — start-feature |
| SDLC Phase | Universal Precursor |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/start-feature/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: project-orchestrator, repo-orchestrator`
- [ ] Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields
- [ ] Recipe intent states: "Create or resume a work context — issue + branch + STM directory"
- [ ] Recipe constraints include: "Must always be the first step for any work"
- [ ] Recipe failure_conditions include: "Branch already exists and has conflicts", "Issue ID not found (resume mode)"
- [ ] NEW mode: recipe creates GitHub issue via project-orchestrator
- [ ] NEW mode: recipe creates feature branch via repo-orchestrator
- [ ] NEW mode: recipe creates `.meridian/{issue}/` STM directory
- [ ] RESUME mode: recipe accepts `--resume <issue-id>` argument
- [ ] RESUME mode: recipe resolves existing issue, checkouts branch, verifies STM dir exists
- [ ] Recipe accepts `[description]` argument for NEW mode
- [ ] Recipe links to roadmap/epic if available in project context
- [ ] Recipe shows Tether/Vanish checkpoint after issue + branch creation
- [ ] Recipe propagates intent to all agent invocations

**Evidence:** `evidence/g-100-start-feature.md` — recipe file contents, IDD header fields, NEW and RESUME mode flows, checkpoint pattern

---

### G-101: capture-learning Recipe — New Recipe Exists with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P2 — capture-learning |
| SDLC Phase | Learn-2-Memory |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/capture-learning/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 1`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Promote patterns, decisions, and learnings from STM into LTM"
- [ ] Recipe failure_conditions include: "No completed work artifacts to learn from", "Proposed LTM entry contradicts existing practice without ADR justification"
- [ ] Recipe accepts `--source <path>` argument (optional)
- [ ] Recipe accepts `--type <practice|standard|template>` argument (optional)
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Recipe invokes agent (product-strategist or knowledge agent)
- [ ] File exists at `core/components/skills/extract-patterns/SKILL.md`
- [ ] File exists at `core/components/skills/draft-ltm-entry/SKILL.md`
- [ ] `extract-patterns` skill input contract declares: completed_work_path (or intent), scope (practices/standards/templates)
- [ ] `extract-patterns` skill output contract declares: patterns list with type, description, context, rationale
- [ ] `draft-ltm-entry` skill input contract declares: patterns (from extract-patterns), type (practice|standard|template)
- [ ] `draft-ltm-entry` skill output contract declares: ltm_entry with path, title, content, append_or_merge
- [ ] Generated LTM entries target `core/components/memory/` directory (not STM)
- [ ] Recipe does NOT overwrite existing LTM — output contract specifies append or propose merge
- [ ] Recipe includes STM→LTM promotion step: issue-specific learnings captured in `.meridian/{issue}/` STM are promoted into long-term organizational memory at `core/components/memory/`
- [ ] Recipe documents LTM governance workflow: generated entries staged for PR-based review, NOT written directly to `core/components/memory/`
- [ ] Recipe documents tiered review: project-level LTM → team leads review; org-level LTM → engineering leaders/CTOs review
- [ ] `extract-patterns` skill contract documents semantic overlap detection with existing LTM entries (designed capability — may not be built in v1)
- [ ] `draft-ltm-entry` skill contract documents conflict detection: checks for contradictions with existing LTM before proposing writes
- [ ] Recipe references LTM governance section in `docs/philosophy/idsd.md`

**Evidence:** `evidence/g-101-capture-learning.md` — recipe file, skill contracts, LTM output path, non-overwrite behavior

---

### G-102: implement-feature Recipe — L2 Multi-Vertical Orchestration

| Property | Value |
|----------|-------|
| Recipe Priority | P3 — implement-feature |
| SDLC Phase | Spec-2-Test (Compound L2) |
| Mandatory | YES |
| Depends On | G-020, G-021, G-022, G-023 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/implement-feature/SKILL.md`
- [ ] Recipe declares `Level: L2` and `Agent Calls: ≤5 (typical: 3-4)`
- [ ] Recipe declares `Agents: code-builder, validator, repo-orchestrator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Implement a feature end-to-end: build all verticals, verify all gates"
- [ ] Recipe failure_conditions include: "Mandatory gates fail after all build attempts", "Bundle staleness detected at start"
- [ ] Recipe accepts `--spec <path>` argument
- [ ] Recipe accepts `--vertical <N>` argument (optional, for single-vertical runs)
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Execution flow step 1 — context resolution: spec provided → runs cascade-sync (check_only=true), reads tasks.md; intent only → derives plan from intent + codebase + LTM
- [ ] Execution flow step 2 — per vertical: invokes build-feature --bundle v{N}-backend, invokes build-feature --bundle v{N}-frontend
- [ ] Execution flow step 2 — per vertical: invokes verify-feature --spec {path} --gate {vertical gates}
- [ ] Execution flow step 2 — checkpoint after each vertical (Tether/Vanish): files changed, tests, gate status
- [ ] Execution flow step 3 — final: invokes verify-feature --spec {path} --all
- [ ] Final checkpoint presents: full gate summary, evidence manifest (Tether/Vanish)
- [ ] Backend and frontend of same vertical can run in parallel per spec
- [ ] Different verticals run sequentially

**Evidence:** `evidence/g-102-implement-feature.md` — recipe file, execution flow per step, vertical handling, checkpoint pattern, agent call budget

---

### G-103: start-planned-feature Recipe — IDD Compliance Review

| Property | Value |
|----------|-------|
| Recipe Priority | P4 — start-planned-feature |
| SDLC Phase | Design-2-Code (Compound L2) |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/start-planned-feature/SKILL.md`
- [ ] Recipe declares `Level: L2` and `Agent Calls: ≤5`
- [ ] Recipe declares `Agents: project-orchestrator, Plan sub-agent (Claude OOTB), code-builder, repo-orchestrator`
- [ ] Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields
- [ ] Recipe intent captures: quick idea-to-PR with lightweight IDD-aware planning
- [ ] Recipe constraints include: embeds start-feature flow, lightweight IDD-aware planning artifacts, code-builder scoped to CODE only
- [ ] Recipe failure_conditions include: "Intent too vague to derive design", "Implementation fails tests", "User rejects plan (Vanish)"
- [ ] Recipe embeds start-feature flow: issue resolution + branch creation + STM initialization (does not call start-feature separately)
- [ ] Plan sub-agent prompt instructs IDD intent header on each planning artifact (spec.md, verify.md, tasks.md)
- [ ] Planning artifacts are lightweight: no formal gates, no bundles, no audience separation
- [ ] Planning artifacts stored at `.meridian/{issue}/planning/` (not `.meridian/{issue}/spec/`)
- [ ] code-builder invocation is scoped to CODE only (no docs, no markdown, no config)
- [ ] Recipe builds working code with tests
- [ ] Recipe commits via repo-orchestrator (agent-first — not direct git)
- [ ] Recipe has single Tether/Vanish checkpoint (after plan, before execution)
- [ ] Agent Routing Table present (Domain / Agent / Intent Slice format)
- [ ] Templates externalized to `templates/` directory (checkpoint, approval-prompt, final-report)
- [ ] Recovery section present with structured-failure-protocol + intent-driven-recovery references
- [ ] No AskUserQuestion usage — all checkpoints are output-and-wait

**Evidence:** `evidence/g-103-start-planned-feature.md` — recipe file IDD header, agent routing table, embedded start-feature flow, IDD-aware planning artifacts, code-builder scope, template externalization

---

### G-104: discover-product Recipe — New Recipe with Full Phase Handling

| Property | Value |
|----------|-------|
| Recipe Priority | P5 — discover-product |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/discover-product/SKILL.md`
- [ ] Recipe declares `Level: L1`
- [ ] Recipe declares agent calls: 2 (draft), 1 (validate), 0 (lock)
- [ ] Recipe declares `Agents: product-strategist`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Discover and document product vision, strategic goals, and market positioning"
- [ ] Recipe failure_conditions include: "Problem statement too vague to derive market context", "No clear target audience identifiable"
- [ ] Recipe accepts `--phase <draft|validate|lock>` argument
- [ ] Recipe accepts `--artifact <path>` argument for validate/lock phases
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Draft phase: invokes product-strategist → discover-product-opportunity → draft-product-vision
- [ ] Draft phase output: `.meridian/project/product/{slug}/vision.md` (status DRAFT)
- [ ] Draft phase output: vision.md includes Strategic Goals section (NOT OKRs)
- [ ] Draft phase: checkpoint presents vision summary (Tether/Vanish)
- [ ] Validate phase: invokes product-strategist → validate-product-vision; returns validation_result
- [ ] Lock phase: runs cascade-sync, sets vision.md status to LOCKED
- [ ] Skills invoked: discover-product-opportunity, draft-product-vision, validate-product-vision, generate-business-review
- [ ] Templates referenced: `templates/vision.md`, `templates/business-review.md`
- [ ] vision.md does NOT contain okrs.md reference or OKR sections

**Evidence:** `evidence/g-104-discover-product.md` — recipe file, phase handling, Strategic Goals presence, no OKR references, output paths

---

### G-105: product-strategist Agent Contract

| Property | Value |
|----------|-------|
| Recipe Priority | P5-P8 — discover-product, plan-roadmap, manage-backlog, refine-backlog |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/agents/product-strategist.md`
- [ ] Agent file declares `domain: product` and `role: strategist`
- [ ] Agent file declares `model: sonnet`
- [ ] Agent file lists required tools: Task, Read, Write, Glob, Grep, Skill
- [ ] Agent file includes IDD awareness section: reads intent from recipe, reads LTM memory
- [ ] Agent file includes structured failure protocol reference
- [ ] Agent file lists available skills: discover-product-opportunity, draft-product-vision, validate-product-vision, prioritize-product-features, draft-product-roadmap, validate-product-roadmap, decompose-product-epic, draft-product-stories, validate-product-backlog, generate-business-review
- [ ] Agent file does NOT list OKR skills: draft-product-okrs, validate-product-okrs are absent
- [ ] Agent file lists new skills needed: extract-patterns (for capture-learning), analyze-backlog, refine-product-stories (for refine-backlog)
- [ ] Agent file includes memory loading section referencing spec-structure practice
- [ ] Agent file includes recovery and escalation sections

**Evidence:** `evidence/g-105-product-strategist-agent.md` — file contents with field-by-field verification, OKR skill absence confirmed

---

### G-106: Product-2-Design Skill Contracts (P5-P8 Skills)

| Property | Value |
|----------|-------|
| Recipe Priority | P5-P8 — discover-product, plan-roadmap, manage-backlog, refine-backlog |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-105 |

**Verification Steps:**
- [ ] `core/components/skills/discover-product-opportunity/SKILL.md` exists
- [ ] `discover-product-opportunity` input contract: problem_statement, market_hints (optional)
- [ ] `discover-product-opportunity` output contract: market_context with problem, target_users, competitors, market_size, differentiators, risks
- [ ] `core/components/skills/draft-product-vision/SKILL.md` exists
- [ ] `draft-product-vision` input contract: market_context, product_name (optional)
- [ ] `draft-product-vision` output contract: vision with path, sections (including strategic_goals — NOT okrs)
- [ ] `draft-product-vision` sections list includes: problem_statement, target_users, value_proposition, strategic_goals, success_metrics, competitive_landscape, assumptions, out_of_scope
- [ ] `core/components/skills/validate-product-vision/SKILL.md` exists
- [ ] `validate-product-vision` output contract: validation_result with ready_for_lock, completeness_score, issues[], checklist[]
- [ ] `core/components/skills/prioritize-product-features/SKILL.md` exists
- [ ] `prioritize-product-features` input contract: features, scoring_method (RICE|MoSCoW), strategic_goals
- [ ] `prioritize-product-features` output contract: ranked_features with method, features[name, score, rank, strategic_alignment]
- [ ] `core/components/skills/draft-product-roadmap/SKILL.md` exists
- [ ] `draft-product-roadmap` input contract: ranked_features, time_horizon, capacity_hints (optional)
- [ ] `draft-product-roadmap` output contract: roadmap with path, sections, features_count, releases_count
- [ ] `core/components/skills/validate-product-roadmap/SKILL.md` exists
- [ ] `validate-product-roadmap` output contract: validation_result with ready_for_lock, feasibility_score, issues[], checklist[]
- [ ] `core/components/skills/decompose-product-epic/SKILL.md` exists
- [ ] `decompose-product-epic` output contract: epic_structure with title, story_count, stories[id, title, type, priority, dependencies]
- [ ] `core/components/skills/draft-product-stories/SKILL.md` exists
- [ ] `draft-product-stories` output contract: backlog with path, sections, story_count, invest_compliant
- [ ] `core/components/skills/validate-product-backlog/SKILL.md` exists
- [ ] `validate-product-backlog` output contract: validation_result with ready_for_lock, invest_score, issues[], checklist[]
- [ ] `core/components/skills/generate-business-review/SKILL.md` exists
- [ ] `generate-business-review` input contract: artifact_path, audience: "Product Manager"
- [ ] `generate-business-review` output contract: business_review with path, summary, key_decisions, risks, next_steps
- [ ] NO skills exist for draft-product-okrs or validate-product-okrs — these are removed in v2.0.0
- [ ] All validate skills return `ready_for_lock: true|false` in their output contract

**Evidence:** `evidence/g-106-product-skills.md` — each skill file path confirmed, output contract fields verified, OKR skills absent

---

### G-107: Product-2-Design Templates (vision.md, roadmap.md, backlog-epic.md, business-review.md)

| Property | Value |
|----------|-------|
| Recipe Priority | P5-P8 — discover-product, plan-roadmap, manage-backlog, refine-backlog |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-106 |

**Verification Steps:**
- [ ] Template exists at `core/components/memory/templates/vision.md` (no `-document` suffix)
- [ ] Template exists at `core/components/memory/templates/roadmap.md` (no `-document` suffix)
- [ ] Template exists at `core/components/memory/templates/backlog-epic.md` (no `-document` suffix)
- [ ] Template exists at `core/components/memory/templates/business-review.md` (no `-document` suffix)
- [ ] `vision.md` template includes IDD intent header section
- [ ] `vision.md` template includes Strategic Goals section (NOT OKRs)
- [ ] `vision.md` template does NOT reference okrs.md
- [ ] `roadmap.md` template includes IDD intent header section
- [ ] `backlog-epic.md` template includes IDD intent header section
- [ ] `backlog-epic.md` template includes story fields with INVEST checklist
- [ ] `business-review.md` template uses PM-facing language (no technical jargon in PM sections)
- [ ] `business-review.md` template audience declared: "Product Manager / Business Owner"
- [ ] Artifacts use storage path: `.meridian/project/product/{slug}/vision.md`
- [ ] Artifacts use storage path: `.meridian/project/product/{slug}/roadmap.md`
- [ ] Artifacts use storage path: `.meridian/project/product/{slug}/backlog/{epic}.md`
- [ ] Business review stored at: `.meridian/project/product/{slug}/reviews/{artifact}-review.md`
- [ ] No template references `okrs.md` path or OKR structure

**Evidence:** `evidence/g-107-product-templates.md` — template file paths, IDD header presence, OKR absence, audience declarations, storage paths

---

### G-108: IDD Intent Headers on All Product-2-Design Artifact Templates

| Property | Value |
|----------|-------|
| Recipe Priority | P5-P8 — all Product-2-Design recipes |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-107 |

**Verification Steps:**
- [ ] `vision.md` template includes `## Intent` section with Intent, Constraints, Failure Conditions fields
- [ ] `roadmap.md` template includes `## Intent` section
- [ ] `backlog-epic.md` template includes `## Intent` section
- [ ] `business-review.md` template includes `## Intent` section
- [ ] Intent header format matches spec: `**Intent:** {statement}`, `**Constraints:** {list}`, `**Failure Conditions:** {list}`
- [ ] Intent content is propagated from the parent recipe's intent into the artifact (not left blank)
- [ ] All prioritized P5-P8 recipe files themselves start with an IDD intent header in YAML block format

**Evidence:** `evidence/g-108-idd-headers-product.md` — each template's Intent section extracted and verified

---

### G-109: spec-structure LTM Practice Exists and Is Referenced

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — P5-P10 (all design/spec/code phases) |
| SDLC Phase | Product-2-Design, Spec-2-Code, Code-2-Test |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/memory/practices/spec-structure.md`
- [ ] File covers: 3-tier artifact structure (Tier 1: Human Review, Tier 2: Agent Bundles, Tier 3: Orchestration)
- [ ] File covers: audience mapping table (who reads what)
- [ ] File covers: bundle format template
- [ ] File covers: context budget constraints (≤12K per bundle, ≤17K per task)
- [ ] File covers: IDD intent header requirement
- [ ] File covers: rule ID preservation across bundles
- [ ] File covers: gate-to-task mapping requirement
- [ ] `product-strategist` agent file references spec-structure practice in its LTM loading section
- [ ] `validator` agent file references spec-structure practice in its LTM loading section
- [ ] `code-builder` agent file references spec-structure practice in its LTM loading section

**Evidence:** `evidence/g-109-spec-structure-ltm.md` — LTM file path, section coverage, agent reference verification

---

### G-110: validator Agent Contract

| Property | Value |
|----------|-------|
| Recipe Priority | P10, P14, P13, P16, P18 — verify-feature, deliver-feature, review-pr, release, review-architecture |
| SDLC Phase | Code-2-Test, Test-2-Run, Audit-2-Fix |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/agents/validator.md`
- [ ] Agent file declares `domain: quality` and `role: validator`
- [ ] Agent file declares `model: sonnet`
- [ ] Agent file lists required tools: Task, Read, Bash, Glob, Grep, Skill
- [ ] Agent file lists available skills: verify-gate, run-test-suite, validate-implementation
- [ ] Agent file includes IDD awareness section
- [ ] Agent file reads intent from recipe invocation
- [ ] Agent file reads LTM: quality standards, testing conventions
- [ ] Agent file reads STM: verify.md gates, implementation context
- [ ] Agent file produces evidence artifacts for each gate it verifies
- [ ] Agent file returns structured failure if no gates defined and intent too vague
- [ ] Agent file includes recovery and escalation sections
- [ ] Agent file does NOT include code-writing tools (Write) — validator reads, does not implement

**Evidence:** `evidence/g-110-validator-agent.md` — file contents, field-by-field verification, tool list check, Write tool absence

---

## P6-P10 Gates (G-2XX)

### G-200: plan-roadmap Recipe — New Recipe with Full Phase Handling

| Property | Value |
|----------|-------|
| Recipe Priority | P6 — plan-roadmap |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-104, G-105, G-106, G-107 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/plan-roadmap/SKILL.md`
- [ ] Recipe declares `Level: L1`
- [ ] Recipe declares agent calls: 2 (draft), 1 (validate), 0 (lock)
- [ ] Recipe declares `Agents: product-strategist`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Prioritize features and build a release timeline from strategic goals"
- [ ] Recipe failure_conditions include: "No features identified from intent or vision", "Features have circular dependencies"
- [ ] Recipe accepts `--phase <draft|validate|lock>` argument
- [ ] Recipe accepts `--artifact <path>` argument for validate/lock phases
- [ ] Recipe accepts `[intent]` free-text argument or uses vision.md as input
- [ ] Draft phase: invokes product-strategist → prioritize-product-features → draft-product-roadmap
- [ ] Draft phase: scoring method is RICE or MoSCoW (explicitly chosen or defaulted)
- [ ] Draft phase output: `.meridian/project/product/{slug}/roadmap.md` (status DRAFT)
- [ ] Validate phase: invokes product-strategist → validate-product-roadmap
- [ ] Lock phase: runs cascade-sync, sets roadmap.md to LOCKED
- [ ] Recipe works with vision.md as input OR intent alone (intent-sufficient)
- [ ] Recipe does NOT require OKRs as input

**Evidence:** `evidence/g-200-plan-roadmap.md` — recipe file, phase handling, intent-sufficiency, no OKR dependency, output path

---

### G-210: manage-backlog Recipe — New Recipe with Full Phase Handling

| Property | Value |
|----------|-------|
| Recipe Priority | P7 — manage-backlog |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-200, G-105, G-106, G-107 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/manage-backlog/SKILL.md`
- [ ] Recipe declares `Level: L1`
- [ ] Recipe declares agent calls: 2 (draft), 1 (validate), 0 (lock)
- [ ] Recipe declares `Agents: product-strategist`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Decompose a roadmap feature into an INVEST-compliant epic with user stories"
- [ ] Recipe failure_conditions include: "Epic too large to decompose (>15 stories suggests splitting)", "Stories violate INVEST principles"
- [ ] Recipe accepts `--phase <draft|validate|lock>` argument
- [ ] Recipe accepts `--artifact <path>` argument for validate/lock phases
- [ ] Recipe accepts `[intent]` or epic description as input
- [ ] Draft phase: invokes product-strategist → decompose-product-epic → draft-product-stories
- [ ] Draft phase output: `.meridian/project/product/{slug}/backlog/{epic}.md` (status DRAFT)
- [ ] Validate phase: invokes product-strategist → validate-product-backlog
- [ ] Lock phase: runs cascade-sync, sets backlog/{epic}.md to LOCKED
- [ ] Recipe works with roadmap.md as input OR intent alone (intent-sufficient)
- [ ] Each story in output has acceptance criteria
- [ ] Stories are independently deliverable per INVEST

**Evidence:** `evidence/g-210-manage-backlog.md` — recipe file, INVEST compliance checks, phase handling, output path

---

### G-220: refine-backlog Recipe — New Recipe Exists with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P8 — refine-backlog |
| SDLC Phase | Product-2-Design |
| Mandatory | YES |
| Depends On | G-210, G-105 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/refine-backlog/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: product-strategist`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Groom existing backlog — reprioritize stories, split large ones, update estimates"
- [ ] Recipe failure_conditions include: "No existing backlog to refine", "Refinement introduces circular dependencies"
- [ ] Recipe reads existing backlog/{epic}.md before modifying
- [ ] Recipe preserves story IDs for traceability
- [ ] Recipe re-validates INVEST compliance after changes
- [ ] File exists at `core/components/skills/analyze-backlog/SKILL.md`
- [ ] `analyze-backlog` input contract declares: backlog_path, focus (split|reprioritize|estimate|all)
- [ ] `analyze-backlog` output contract declares: analysis with stories_needing_attention[], recommendations[]
- [ ] File exists at `core/components/skills/refine-product-stories/SKILL.md`
- [ ] `refine-product-stories` input contract declares: backlog_path, analysis (from analyze-backlog), changes_requested
- [ ] `refine-product-stories` output contract declares: updated_backlog with path, stories_modified, stories_split, invest_score
- [ ] Story IDs preserved in output (not reassigned during refinement)

**Evidence:** `evidence/g-220-refine-backlog.md` — recipe file, skill contracts, ID preservation behavior

---

### G-230: build-feature Recipe — New Recipe with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P9 — build-feature |
| SDLC Phase | Spec-2-Code |
| Mandatory | YES |
| Depends On | G-109, G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/build-feature/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: code-builder, repo-orchestrator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Build implementation code from a spec bundle or intent"
- [ ] Recipe failure_conditions include: "Bundle exceeds 12K token budget", "No clear implementation scope derivable from intent", "Tests fail after implementation"
- [ ] Recipe accepts `--bundle <id>` argument
- [ ] Recipe accepts `--spec <path>` argument
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Context resolution: bundle provided → load bundle (≤12K tokens); spec path → read tasks.md, derive bundle; intent only → derive from intent + codebase + LTM
- [ ] Agent step 1: code-builder invoked with bundle context (≤12K tokens)
- [ ] Agent step 2: repo-orchestrator invoked via commit-code pattern
- [ ] Checkpoint: presents files changed, tests run, commit summary (Tether/Vanish)
- [ ] Implementation produces working code with unit tests
- [ ] Commits happen via repo-orchestrator (agent-first — not direct git)

**Evidence:** `evidence/g-230-build-feature.md` — recipe file, context resolution flow, agent delegation, checkpoint pattern

---

### G-240: verify-feature Recipe — New Recipe with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P10 — verify-feature |
| SDLC Phase | Code-2-Test |
| Mandatory | YES |
| Depends On | G-110, G-241, G-242, G-243 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/verify-feature/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 1`
- [ ] Recipe declares `Agents: validator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Verify implementation against quality gates"
- [ ] Recipe failure_conditions include: "No gates defined and intent too vague to derive criteria", "Evidence cannot be produced (e.g., no tests exist)"
- [ ] Recipe accepts `--spec <path>` argument
- [ ] Recipe accepts `--gate <gate-id>` argument (for single-gate verification)
- [ ] Recipe accepts `--all` flag (for full verification)
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Recipe invokes validator agent
- [ ] Recipe produces evidence artifact for each gate checked (in `evidence/` directory)
- [ ] Recipe runs test suite and reports coverage
- [ ] Recipe reports blocking issues clearly in output

**Evidence:** `evidence/g-240-verify-feature.md` — recipe file, gate evidence output pattern, test suite integration

---

### G-241: verify-gate Skill Can Verify Individual Gates with Evidence

| Property | Value |
|----------|-------|
| Recipe Priority | P10 — verify-feature (via validator agent) |
| SDLC Phase | Code-2-Test |
| Mandatory | YES |
| Depends On | G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/skills/verify-gate/SKILL.md`
- [ ] Input contract declares: gate_id, verify_path, implementation_path
- [ ] Output contract includes: gate_result.gate_id, gate_result.status (pass|fail)
- [ ] Output contract includes: steps list with step text, status, evidence
- [ ] Output contract includes: evidence_path (path to evidence file at `evidence/g-{NNN}-*.md`)
- [ ] Output contract includes: issues list with message, severity, fix_hint
- [ ] Evidence file created at `.meridian/{issue}/evidence/g-{NNN}-*.md` for each gate verified
- [ ] Reference file exists: `verify-gate/reference/gate-patterns.md`
- [ ] Skill verifies individual gates — called once per gate, not bulk
- [ ] Skill does NOT modify implementation — read-only verification

**Evidence:** `evidence/g-241-verify-gate-skill.md` — skill file, output contract, evidence path pattern, gate-patterns reference

---

### G-242: run-test-suite Skill Executes Tests and Reports Coverage

| Property | Value |
|----------|-------|
| Recipe Priority | P10 — verify-feature (via validator agent) |
| SDLC Phase | Code-2-Test |
| Mandatory | YES |
| Depends On | G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/skills/run-test-suite/SKILL.md`
- [ ] Input contract declares: test_path, test_runner (auto-detect), coverage_thresholds, scope (all|changed)
- [ ] Output contract includes: test_result.total, passed, failed, skipped
- [ ] Output contract includes: coverage.statements, branches, functions, lines (all as percentages)
- [ ] Output contract includes: failing_tests list with name, file, error
- [ ] Skill uses Bash tool to run actual test commands
- [ ] Skill reports test results in structured YAML format
- [ ] Coverage thresholds defined in skill or passed as input parameter
- [ ] Skill integrates with validate-implementation for final validation report

**Evidence:** `evidence/g-242-run-test-suite-skill.md` — skill file, output contract fields, Bash tool usage confirmed

---

### G-243: validate-implementation Skill Confirms Gate Readiness

| Property | Value |
|----------|-------|
| Recipe Priority | P10, P14 — verify-feature, deliver-feature |
| SDLC Phase | Code-2-Test, Test-2-Run |
| Mandatory | YES |
| Depends On | G-110, G-241 |

**Verification Steps:**
- [ ] File exists at `core/components/skills/validate-implementation/SKILL.md`
- [ ] Input contract declares: spec_path, implementation_path, gate_ids[] (optional)
- [ ] Output contract includes: implementation_validation.ready_for_delivery (true|false)
- [ ] Output contract includes: gates list with gate_id, status, mandatory flag
- [ ] Output contract includes: overall_score, blocking_issues list, evidence_manifest path
- [ ] Skill reads feature spec's verify.md to get the full gate list
- [ ] Skill reads evidence files in evidence/ to determine gate pass/fail status
- [ ] If any mandatory gate is not in pass status → `ready_for_delivery: false`
- [ ] `deliver-feature` recipe halts before PR creation if `ready_for_delivery: false`
- [ ] Reference file exists: `validate-implementation/reference/quality-standards.md`

**Evidence:** `evidence/g-243-validate-implementation.md` — skill file, gate list verification logic, halt-on-failure behavior

---

## P11-P15 Gates (G-3XX)

### G-300: commit-code Recipe — IDD Compliance Review

| Property | Value |
|----------|-------|
| Recipe Priority | P11 — commit-code |
| SDLC Phase | Code-2-Test |
| Mandatory | YES |
| Depends On | G-100 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/commit-code/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Distinct Agents: 2` in version table
- [ ] Recipe declares `Agents: repo-orchestrator, project-orchestrator` in agent routing table
- [ ] Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields
- [ ] Recipe intent captures: safely persist completed work as conventional commits with traceability
- [ ] Recipe constraints include: group changes by concern, conventional commit format, NWWI (every commit traces to valid issue)
- [ ] Recipe failure_conditions include: protected branch, no valid issue ID, user rejects (Vanish), working tree not clean, format validation fails
- [ ] No uncommitted changes → graceful bypass (not a failure condition)
- [ ] Recipe groups changes by concern (feature, fix, refactor) — not bulk add
- [ ] Recipe uses conventional commit format
- [ ] Agent routing table maps domains to agents with intent slices
- [ ] Recipe propagates intent to agent invocations via recipe context block
- [ ] Structured failure handling verified (recovery protocol with 2-retry limit)
- [ ] Templates externalized to `templates/` directory (checkpoint, approval-prompt, commit-summary)

**Evidence:** `evidence/g-300-commit-code.md` — recipe file IDD header, agent routing, conventional commit enforcement, template verification

---

### G-310: create-pr Recipe — IDD Compliance Review

| Property | Value |
|----------|-------|
| Recipe Priority | P12 — create-pr |
| SDLC Phase | Test-2-Run |
| Mandatory | YES |
| Depends On | G-100 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/create-pr/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 1`
- [ ] Recipe declares `Agents: repo-orchestrator`
- [ ] Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields
- [ ] Recipe intent states: "Push branch and create pull request with quality checklist"
- [ ] Recipe constraints include: "Must generate context-aware quality checklist", "Must include change summary", "Must link to issue if available"
- [ ] Recipe failure_conditions include: "No commits to push", "Branch conflicts with target"
- [ ] Recipe generates context-aware quality checklist in PR description
- [ ] Recipe includes change summary in PR
- [ ] Recipe links to GitHub issue if available
- [ ] Recipe propagates intent to repo-orchestrator
- [ ] Structured failure handling verified

**Evidence:** `evidence/g-310-create-pr.md` — recipe file IDD header, quality checklist generation, issue linking

---

### G-320: review-pr Recipe — New Recipe Exists with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P13 — review-pr |
| SDLC Phase | Code-2-Test |
| Mandatory | YES |
| Depends On | G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/review-pr/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: validator, tech-designer`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Perform structured code review — security, architecture, performance, correctness"
- [ ] Recipe failure_conditions include: "PR has no diff (empty PR)", "Cannot access repository or PR"
- [ ] Recipe accepts PR URL or branch name as input
- [ ] Recipe accepts `[intent]` describing what to review
- [ ] Recipe checks against project quality standards from LTM
- [ ] Recipe produces actionable review comments (not vague suggestions)
- [ ] Recipe flags blocking issues vs suggestions in output
- [ ] File exists at `core/components/skills/analyze-pr/SKILL.md` (existing skill, referenced)
- [ ] File exists at `core/components/skills/review-code-quality/SKILL.md`
- [ ] `review-code-quality` input contract declares: pr_diff, quality_standards_path, focus_areas (security|architecture|performance|correctness)
- [ ] `review-code-quality` output contract declares: review with blocking_issues[], suggestions[], severity_counts, overall_assessment
- [ ] File exists at `core/components/skills/post-review-comments/SKILL.md`
- [ ] `post-review-comments` input contract declares: pr_url, review (from review-code-quality), comment_format
- [ ] `post-review-comments` output contract declares: comments_posted_count, pr_review_url

**Evidence:** `evidence/g-320-review-pr.md` — recipe file, skill contracts, blocking vs suggestion separation

---

### G-330: deliver-feature Recipe — New L2 Recipe with Pre-delivery Validation

| Property | Value |
|----------|-------|
| Recipe Priority | P14 — deliver-feature |
| SDLC Phase | Test-2-Run |
| Mandatory | YES |
| Depends On | G-243, G-310, G-331 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/deliver-feature/SKILL.md`
- [ ] Recipe declares `Level: L2` and `Agent Calls: ≤4`
- [ ] Recipe declares `Agents: validator, repo-orchestrator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Ship a verified feature to the target branch via PR"
- [ ] Recipe failure_conditions include: "Mandatory gates not passed and user declines to run verify-feature", "PR creation fails"
- [ ] Recipe accepts `--spec <path>` argument
- [ ] Recipe accepts `--target-branch <branch>` argument (optional)
- [ ] Recipe accepts `[intent]` free-text argument
- [ ] Step 1: invokes validator to confirm delivery readiness (`ready_for_delivery: true`)
- [ ] Step 1 fails if any mandatory gate is not in pass status → structured failure returned
- [ ] Step 2: invokes repo-orchestrator to create PR (via create-pr) with gate summary + evidence manifest + change summary
- [ ] Checkpoint after PR creation: present PR (Tether to merge / Vanish to hold)
- [ ] Step 3 (optional): invokes validator for post-merge deployment health verification
- [ ] Agent budget: ≤4 (1 validator readiness + 1 repo-orchestrator PR + 1 validator post-merge + 1 remaining)
- [ ] PR description includes evidence manifest and gate summary
- [ ] Skills invoked: verify-gate, validate-implementation, generate-delivery-report, create-pr

**Evidence:** `evidence/g-330-deliver-feature.md` — recipe file, pre-delivery validation gate, PR creation with evidence, checkpoint pattern

---

### G-331: generate-delivery-report Skill Produces Complete Report

| Property | Value |
|----------|-------|
| Recipe Priority | P14 — deliver-feature |
| SDLC Phase | Test-2-Run |
| Mandatory | YES |
| Depends On | G-243 |

**Verification Steps:**
- [ ] File exists at `core/components/skills/generate-delivery-report/SKILL.md`
- [ ] Input contract declares: spec_path, evidence_path, pr_url, branch
- [ ] Output contract includes: delivery_report.feature
- [ ] Output contract includes: delivery_report.implementation (files_changed, lines_added, lines_removed, tests_added)
- [ ] Output contract includes: delivery_report.verification (gates_passed, mandatory_gates_passed, overall_score)
- [ ] Output contract includes: delivery_report.pr (url, branch)
- [ ] Output contract includes: delivery_report.evidence_manifest (path to evidence/)
- [ ] Delivery report template exists: `templates/delivery-report.md`
- [ ] Report stored at: `.meridian/{issue}/delivery/delivery-report.md`
- [ ] Report is human-readable markdown (not raw YAML)

**Evidence:** `evidence/g-331-delivery-report-skill.md` — skill file, output contract, template structure, report path

---

### G-340: run-demo Recipe — New Recipe Exists with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P15 — run-demo |
| SDLC Phase | Test-2-Run |
| Mandatory | YES |
| Depends On | G-105 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/run-demo/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: project-orchestrator, product-strategist`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Generate sprint review materials — changelog, demo script, metrics summary"
- [ ] Recipe failure_conditions include: "No completed work in the period"
- [ ] Recipe reads completed work from git log and closed issues (or intent describing what to demo)
- [ ] Recipe produces human-readable demo script with talking points
- [ ] Recipe includes before/after metrics if available
- [ ] Recipe has Tether/Vanish checkpoint after demo script generation
- [ ] File exists at `core/components/skills/generate-changelog/SKILL.md`
- [ ] `generate-changelog` input contract declares: since_tag_or_date, pr_descriptions (optional), commit_log
- [ ] `generate-changelog` output contract declares: changelog with categorized entries (features, fixes, improvements, breaking)
- [ ] File exists at `core/components/skills/draft-demo-script/SKILL.md`
- [ ] `draft-demo-script` input contract declares: changelog (from generate-changelog), audience, duration_minutes
- [ ] `draft-demo-script` output contract declares: demo_script with sections[title, talking_points[], screen_or_flow_ref], metrics_summary

**Evidence:** `evidence/g-340-run-demo.md` — recipe file, skill contracts, demo script output structure

---

## P16-P19 Gates (G-4XX)

### G-400: release Recipe — New Recipe Exists with Skill Contracts

| Property | Value |
|----------|-------|
| Recipe Priority | P16 — release |
| SDLC Phase | Test-2-Run |
| Mandatory | YES |
| Depends On | G-110, G-340 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/release/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: repo-orchestrator, validator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Create a release — version bump, changelog, tag, deploy"
- [ ] Recipe failure_conditions include: "Unreleased breaking changes without major version bump", "Failing tests on release branch"
- [ ] Recipe follows semantic versioning (major.minor.patch)
- [ ] Recipe aggregates all changes since last release
- [ ] Recipe produces release notes from PR descriptions and commits
- [ ] Recipe has Tether/Vanish checkpoint before tagging
- [ ] File exists at `core/components/skills/bump-version/SKILL.md`
- [ ] `bump-version` input contract declares: current_version, change_types (breaking|feature|fix|chore), bump_override (optional)
- [ ] `bump-version` output contract declares: new_version, bump_type (major|minor|patch), justification
- [ ] `generate-changelog` skill is shared with run-demo (same SKILL.md file)
- [ ] File exists at `core/components/skills/create-release/SKILL.md`
- [ ] `create-release` input contract declares: version, changelog_content, branch, target_repo
- [ ] `create-release` output contract declares: release with tag, github_release_url, assets[]

**Evidence:** `evidence/g-400-release.md` — recipe file, semantic versioning enforcement, skill contracts, changelog sharing with run-demo

---

### G-410: fix-bug Recipe — New Recipe with RCA + Regression Flow

| Property | Value |
|----------|-------|
| Recipe Priority | P17 — fix-bug |
| SDLC Phase | Run-2-Monitor |
| Mandatory | YES |
| Depends On | G-100 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/fix-bug/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: tech-designer (diagnose), code-builder (fix)`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Diagnose, fix, and verify a bug"
- [ ] Recipe constraints include: "Must diagnose root cause before fixing (not just patch symptoms)", "Must add regression test for the fix", "Must commit via repo-orchestrator (agent-first)"
- [ ] Recipe failure_conditions include: "Cannot reproduce the bug", "Fix introduces new test failures"
- [ ] Recipe accepts bug description, error logs, issue reference, or intent as input
- [ ] Step 1: invokes tech-designer for root cause analysis (not code-builder — diagnose first)
- [ ] Step 2: invokes code-builder for fix + regression test + commit
- [ ] Checkpoint: presents RCA + fix summary (Tether/Vanish)
- [ ] File exists at `core/components/skills/diagnose-bug/SKILL.md`
- [ ] `diagnose-bug` input contract declares: bug_description, error_logs (optional), issue_ref (optional), codebase_path
- [ ] `diagnose-bug` output contract declares: rca with root_cause, reproduction_steps[], affected_components[], proposed_fix_approach
- [ ] File exists at `core/components/skills/fix-and-test/SKILL.md`
- [ ] `fix-and-test` input contract declares: rca (from diagnose-bug), codebase_path
- [ ] `fix-and-test` output contract declares: fix with files_changed[], regression_test_path, test_result
- [ ] Commit happens via repo-orchestrator (agent-first)

**Evidence:** `evidence/g-410-fix-bug.md` — recipe file, diagnose-first flow, regression test requirement, skill contracts

---

### G-420: review-architecture Recipe — New Recipe with Codebase Analysis

| Property | Value |
|----------|-------|
| Recipe Priority | P18 — review-architecture |
| SDLC Phase | Audit-2-Fix |
| Mandatory | YES |
| Depends On | G-110 |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/review-architecture/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 2`
- [ ] Recipe declares `Agents: tech-designer, validator`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Evaluate system architecture health — patterns, dependencies, tech debt, scalability"
- [ ] Recipe constraints include: "Must read codebase structure, not just docs", "Must check against LTM architecture standards", "Must produce actionable findings (not vague observations)"
- [ ] Recipe failure_conditions include: "Codebase too large to analyze within context budget", "No architecture standards in LTM to review against"
- [ ] Recipe accepts codebase path, existing ADRs, or intent describing focus area
- [ ] Recipe reads actual codebase (not just docs) via tech-designer
- [ ] Recipe checks against LTM architecture standards
- [ ] Recipe produces architecture-review.md with findings, recommendations, proposed ADRs
- [ ] File exists at `core/components/skills/analyze-architecture/SKILL.md`
- [ ] `analyze-architecture` input contract declares: codebase_path, focus_areas (patterns|dependencies|tech-debt|scalability|all)
- [ ] `analyze-architecture` output contract declares: analysis with components[], dependencies[], anti_patterns[], tech_debt_items[]
- [ ] File exists at `core/components/skills/evaluate-tech-debt/SKILL.md`
- [ ] `evaluate-tech-debt` input contract declares: analysis (from analyze-architecture), severity_threshold
- [ ] `evaluate-tech-debt` output contract declares: tech_debt_report with items[description, severity, estimated_effort, priority], total_debt_score

**Evidence:** `evidence/g-420-review-architecture.md` — recipe file, codebase-reading flow (not just docs), skill contracts, actionable findings requirement

---

### G-430: generate-docs Recipe — New Recipe Exists with Accuracy Enforcement

| Property | Value |
|----------|-------|
| Recipe Priority | P19 — generate-docs |
| SDLC Phase | Audit-2-Fix |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/recipes/generate-docs/SKILL.md`
- [ ] Recipe declares `Level: L1` and `Agent Calls: 1`
- [ ] Recipe declares `Agents: specifier (or tech-designer)`
- [ ] Recipe has IDD intent header with intent, constraints, failure_conditions
- [ ] Recipe intent states: "Generate documentation from code and specs — API docs, technical docs, onboarding"
- [ ] Recipe constraints include: "Must read actual code, not just comments", "Must follow project documentation conventions (from LTM)", "Must be accurate — no hallucinated APIs or parameters"
- [ ] Recipe failure_conditions include: "Code has no clear public API surface", "Generated docs contradict actual code behavior"
- [ ] Recipe accepts codebase path + existing docs as input
- [ ] Recipe accepts `[intent]` describing what to document
- [ ] Recipe reads actual code (not just existing documentation)
- [ ] Recipe follows project documentation conventions from LTM
- [ ] File exists at `core/components/skills/extract-api-surface/SKILL.md`
- [ ] `extract-api-surface` input contract declares: codebase_path, scope (public|all), output_format (openapi|markdown|yaml)
- [ ] `extract-api-surface` output contract declares: api_surface with endpoints[], types[], functions[], schemas[]
- [ ] File exists at `core/components/skills/draft-documentation/SKILL.md`
- [ ] `draft-documentation` input contract declares: api_surface (from extract-api-surface), doc_type (api|guide|readme|onboarding), conventions_path (from LTM)
- [ ] `draft-documentation` output contract declares: documentation with path, doc_type, sections[], accuracy_check_passed

**Evidence:** `evidence/g-430-generate-docs.md` — recipe file, actual-code-reading enforcement, skill contracts, accuracy check

---

## Supporting Structure Gates

### G-500: Storage Layout Matches Spec

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all phases |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | G-100 |

**Verification Steps:**
- [ ] Product-2-Design artifacts stored at `.meridian/project/product/{slug}/vision.md`
- [ ] Product-2-Design artifacts stored at `.meridian/project/product/{slug}/roadmap.md`
- [ ] Product-2-Design artifacts stored at `.meridian/project/product/{slug}/backlog/{epic}.md`
- [ ] Product-2-Design reviews stored at `.meridian/project/product/{slug}/reviews/{artifact}-review.md`
- [ ] Per-issue STM directory created at `.meridian/{issue}/` by start-feature
- [ ] Spec artifacts stored at `.meridian/{issue}/spec/` (business-review, technical-design, ux-spec, verify, tasks, bundles/)
- [ ] Design artifacts stored at `.meridian/{issue}/design/` (architecture, ux-design)
- [ ] Evidence artifacts stored at `.meridian/{issue}/evidence/g-{NNN}-*.md`
- [ ] Delivery artifacts stored at `.meridian/{issue}/delivery/delivery-report.md`
- [ ] LTM (Learn-2-Memory output) stored at `core/components/memory/` (practices/, standards/, templates/)
- [ ] No artifacts stored at paths that include `okrs.md` or OKR-related paths

**Evidence:** `evidence/g-500-storage-layout.md` — path verification for each artifact type, OKR path absence

---

### G-501: bundler Skill Produces Bundles within 12K Token Limit

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — build-feature, implement-feature |
| SDLC Phase | Spec-2-Code |
| Mandatory | YES |
| Depends On | — |

**Verification Steps:**
- [ ] File exists at `core/components/skills/bundler/SKILL.md`
- [ ] Input contract declares: spec_path, technical_design_path, ux_spec_path, verify_path
- [ ] Output contract includes: bundles list with id, path, vertical, concern, token_estimate
- [ ] Output contract includes per bundle: entities, rules, gates, token_estimate
- [ ] Each bundle token_estimate ≤ 12,000 tokens
- [ ] Bundler fails with error when generated bundle exceeds 12K tokens
- [ ] Backend bundles derived from `technical-design.md`
- [ ] Frontend bundles derived from `ux-spec.md`
- [ ] Each bundle includes IDD intent header from parent spec
- [ ] Each bundle includes sync header: `<!-- sync: source={path} hash={hash} generated={timestamp} -->`
- [ ] Rule IDs preserved from parent spec in bundles (e.g., BIZ-001 stays BIZ-001)
- [ ] Gate IDs preserved from verify.md in bundle gate reference lists
- [ ] Domain model subset in backend bundle contains ONLY entities relevant to that vertical
- [ ] Screen list in frontend bundle contains ONLY screens relevant to that vertical
- [ ] Reference file exists: `bundler/reference/bundle-rules.md`
- [ ] Bundle template exists: `bundler/templates/bundle.md`

**Evidence:** `evidence/g-501-bundler-skill.md` — bundler skill file, bundle template structure, token estimate verification, rule ID preservation

---

### G-502: Existing Agent Files Reviewed and IDD-Compliant

| Property | Value |
|----------|-------|
| Recipe Priority | Cross-cutting — all existing agents |
| SDLC Phase | All phases |
| Mandatory | YES |
| Depends On | G-001 |

**Verification Steps:**
- [ ] `core/components/agents/code-builder.md` has IDD awareness section
- [ ] `core/components/agents/tech-designer.md` has IDD awareness section
- [ ] `core/components/agents/repo-orchestrator.md` has IDD awareness section
- [ ] `core/components/agents/project-orchestrator.md` has IDD awareness section
- [ ] Each existing agent file declares: domain, role, model, tools
- [ ] Each existing agent file has memory loading section
- [ ] Each existing agent file has recovery and escalation sections
- [ ] Each existing agent file includes structured failure protocol reference

**Evidence:** `evidence/g-502-existing-agents-idd.md` — IDD section presence in each existing agent file

---

## Gate Summary Table

| ID | Name | Recipe Priority | SDLC Phase | Mandatory | Depends On |
|----|------|-----------------|------------|-----------|------------|
| G-001 | Structured Failure Protocol on All Agents | Cross-cutting | All | YES | — |
| G-002 | IDD Intent Propagation in All Recipes | Cross-cutting | All | YES | — |
| G-003 | Tether/Vanish Checkpoint Pattern | Cross-cutting | All | YES | — |
| G-004 | Context Budget Enforced Across Agent Invocations | Cross-cutting | Spec-2-Code, Code-2-Test | YES | — |
| G-005 | Cascade Sync Prevents Stale Artifacts | Cross-cutting | All | YES | — |
| G-006 | Three-Speeds Model Routing in Universal Precursor | Cross-cutting | Universal Precursor | YES | G-100 |
| G-007 | Artifact Lifecycle Enforcement (DRAFT → VALIDATE → LOCKED) | Cross-cutting | Product-2-Design | YES | G-110, G-200, G-210 |
| G-008 | Agent-First Pattern in All Recipes | Cross-cutting | All | YES | — |
| G-009 | L1 and L2 Recipe Level Constraints | Cross-cutting | All | YES | — |
| G-010 | Compartmented Evaluation — Builder/Validator Information Barrier | Cross-cutting | Spec-2-Code, Code-2-Test | YES | G-230, G-240 |
| G-100 | start-feature IDD Compliance and Resume Mode | P1 | Universal Precursor | YES | — |
| G-101 | capture-learning Recipe and Skill Contracts | P2 | Learn-2-Memory | YES | — |
| G-102 | implement-feature L2 Multi-Vertical Orchestration | P3 | Spec-2-Test | YES | G-020, G-021, G-022, G-023 |
| G-103 | start-planned-feature IDD Compliance Review | P4 | Design-2-Code | YES | G-100 |
| G-104 | discover-product Full Phase Handling | P5 | Product-2-Design | YES | G-110 |
| G-105 | product-strategist Agent Contract | P5-P8 | Product-2-Design | YES | — |
| G-106 | Product-2-Design Skill Contracts | P5-P8 | Product-2-Design | YES | G-105 |
| G-107 | Product-2-Design Templates (no -document suffix, no OKRs) | P5-P8 | Product-2-Design | YES | G-106 |
| G-108 | IDD Intent Headers on Product-2-Design Templates | P5-P8 | Product-2-Design | YES | G-107 |
| G-109 | spec-structure LTM Practice Exists and Is Referenced | Cross-cutting | Product-2-Design, Spec-2-Code, Code-2-Test | YES | — |
| G-110 | validator Agent Contract | P10, P14, P13, P16, P18 | Code-2-Test, Test-2-Run, Audit-2-Fix | YES | — |
| G-200 | plan-roadmap Full Phase Handling | P6 | Product-2-Design | YES | G-104, G-105, G-106, G-107 |
| G-210 | manage-backlog Full Phase Handling | P7 | Product-2-Design | YES | G-200, G-105, G-106, G-107 |
| G-220 | refine-backlog Recipe and Skill Contracts | P8 | Product-2-Design | YES | G-210, G-105 |
| G-230 | build-feature Recipe and Skill Contracts | P9 | Spec-2-Code | YES | G-109, G-110 |
| G-240 | verify-feature Recipe and Skill Contracts | P10 | Code-2-Test | YES | G-110, G-241, G-242, G-243 |
| G-241 | verify-gate Skill with Evidence | P10 | Code-2-Test | YES | G-110 |
| G-242 | run-test-suite Reports Coverage | P10 | Code-2-Test | YES | G-110 |
| G-243 | validate-implementation Confirms Gate Readiness | P10, P14 | Code-2-Test, Test-2-Run | YES | G-110, G-241 |
| G-300 | commit-code IDD Compliance Review | P11 | Code-2-Test | YES | G-100 |
| G-310 | create-pr IDD Compliance Review | P12 | Test-2-Run | YES | G-100 |
| G-320 | review-pr Recipe and Skill Contracts | P13 | Code-2-Test | YES | G-110 |
| G-330 | deliver-feature L2 with Pre-delivery Validation | P14 | Test-2-Run | YES | G-243, G-310, G-331 |
| G-331 | generate-delivery-report Complete Output | P14 | Test-2-Run | YES | G-243 |
| G-340 | run-demo Recipe and Skill Contracts | P15 | Test-2-Run | YES | G-105 |
| G-400 | release Recipe and Skill Contracts | P16 | Test-2-Run | YES | G-110, G-340 |
| G-410 | fix-bug Recipe with RCA and Regression Flow | P17 | Run-2-Monitor | YES | G-100 |
| G-420 | review-architecture Recipe with Codebase Analysis | P18 | Audit-2-Fix | YES | G-110 |
| G-430 | generate-docs Recipe with Accuracy Enforcement | P19 | Audit-2-Fix | YES | — |
| G-500 | Storage Layout Matches Spec | Cross-cutting | All | YES | G-100 |
| G-501 | bundler Skill Produces Bundles ≤12K Tokens | Cross-cutting | Spec-2-Code | YES | — |
| G-502 | Existing Agent Files IDD-Compliant | Cross-cutting | All | YES | G-001 |

---

## Rule Coverage Matrix

This matrix shows which gates cover which architectural rules and principles from the spec.

| Architectural Rule / Principle | Gates That Verify It |
|-------------------------------|----------------------|
| **IDD Intent Headers** — all recipes and artifacts have intent/constraints/failure_conditions | G-002, G-100, G-103, G-104, G-108 |
| **Agent-First Pattern** — no recipe uses tools directly when an agent covers the domain | G-008, G-300, G-310 |
| **L1 Recipe Constraint** — ≤2 agent calls | G-009, G-100, G-101, G-104, G-200, G-210, G-220, G-230, G-240, G-300, G-310, G-320, G-340, G-400, G-410, G-420, G-430 |
| **L2 Recipe Constraint** — ≤5 agent calls | G-009, G-102, G-103, G-330 |
| **Context Bundles** — agents load ≤12K per vertical | G-004, G-501, G-230, G-102 |
| **Context Budget Total ≤17K per task** | G-004, G-109 |
| **Audience Separation** — one stakeholder per Tier 1 artifact | G-107, G-108, G-106 |
| **Artifact Lifecycle** — DRAFT → VALIDATE → LOCKED | G-007, G-104, G-200, G-210 |
| **Cascade Sync** — derived artifacts stay in sync with source | G-005, G-501 |
| **Lock Prerequisite Chain** — vision LOCKED → roadmap → backlog (no OKRs) | G-007, G-104, G-200, G-210 |
| **No OKRs in v2.0.0** — OKR references removed from all templates, skills, agents, prerequisite chains | G-105, G-106, G-107, G-104, G-200, G-007 |
| **start-feature as Universal Precursor** — always first step | G-100, G-006, G-103 |
| **Three-Speeds Model** — Fast / Planned / Strategic routing | G-006 |
| **Structured Failure Protocol** — no raw errors from agents | G-001, G-502 |
| **Tether/Vanish Checkpoints** — no AskUserQuestion | G-003 |
| **Intent-Sufficiency** — any recipe works from intent alone, upstream artifacts enrich not block | G-100, G-104, G-200, G-210, G-230 |
| **Non-Linear Invocation** — any recipe callable at any point if intent/constraints/failure_conditions satisfied | G-002, G-008 |
| **Rule ID Preservation** — BIZ-001 stays BIZ-001 across bundles | G-501, G-005 |
| **Gate-to-Task Mapping** — all tasks map to at least one gate | G-109 |
| **Evidence Collection** — each gate produces evidence artifact | G-241, G-243, G-330, G-331 |
| **Spec-Structure LTM** — agents load and follow spec-structure practice | G-109, G-004 |
| **Template Names** — vision.md, roadmap.md, backlog-epic.md, business-review.md (no -document suffix) | G-107 |
| **New Agents** — product-strategist, validator created | G-105, G-110 |
| **Existing Agents IDD-Compliant** — code-builder, tech-designer, repo-orchestrator, project-orchestrator reviewed | G-502, G-001 |
| **Parallel Execution** — backend/frontend of same vertical can run in parallel | G-102, G-004 |
| **Compartmented Evaluation** — builder receives bundle only; validator receives implementation output only; no shared context | G-010, G-102, G-230, G-240 |
| **Validate-Lock Cycle-Back** — Vanish at validate returns to DRAFT with feedback, not halt; max 2 iterations | G-007, G-104, G-200, G-210 |
| **Cascade Sync Staleness Halt** — stale bundles at implement-feature start halt with regeneration instructions | G-005, G-102 |
| **Cascade Sync at implement-feature Start** — check_only=true before building | G-005, G-102 |
| **Business Review Generation** — PM-facing artifact callable from any phase | G-106, G-107 |
| **capture-learning Feeds LTM** — Learn-2-Memory output goes to core/components/memory | G-101 |
| **LTM Governance** — STM→LTM promotion goes through PR-based governance with tiered review | G-101 |
| **Storage Layout** — STM per issue, project-level product artifacts, LTM in core/components/memory | G-500 |

---

*End of Verification Gates v2.1.0*
