# IDSD — Execution Plan (Tasks)

**Version:** 2.1.0
**Date:** 2026-02-21
**Status:** In Progress — P1, P4, P11 complete
**Spec Reference:** `idsd.md`
**Verify Reference:** `idsd-verify.md`

---

## Execution Strategy

### Approach: Priority-Flat — One Recipe at a Time

Build order is flat, one recipe at a time, in user-set priority (P1 through P19). No waves. Each recipe group is self-contained: prerequisite tasks → agent tasks (if new agent needed) → skill tasks → recipe task → verify task → deploy task.

**Existing recipes (P1, P4, P11, P12):** IDD review + evolution. No full rebuild. Add intent header, structured failure, resume mode, Tether/Vanish checkpoint as needed.

**New recipes with specs (P3, P5, P6, P7, P9, P10, P14):** Build agent (if needed) → build skills → build recipe → verify → deploy.

**New recipes without specs (P2, P8, P13, P15, P16, P17, P18, P19):** Design stub first → build skills → build recipe → verify → deploy.

**Shared agents:** product-strategist serves P5–P8. validator serves P3, P10, P13, P14, P16, P18. Agent creation tasks appear once at the earliest priority that needs the agent; all later priorities reuse without rebuilding.

**Shared skills:** generate-changelog built in P15, reused by P16. generate-business-review built in P5, reused by P6, P7.

### Parallelism Notes

- Within a recipe group: agent task must be first (if new). Skills can be built in parallel once agent exists. Recipe depends on all skills. Verify depends on recipe. Deploy depends on verify.
- Across recipe groups: P2 can begin while P1 deploy is in progress. P4 can begin after P3 deploy (P4 uses validator from P3). Priority order is the sequencing rule for recipe groups, not for individual tasks within the same group.
- Cross-cutting tasks (T-900 through T-905) run only after ALL recipe groups are deployed.

---

## Agents Inventory

### New Agents (build in this plan)

| Agent | Built In | Reused By |
|-------|----------|-----------|
| product-strategist | P5 (T-040) | P6, P7, P8 |
| validator | P3 (T-020) | P10, P13, P14, P16, P18 |

### Existing Agents (no rebuild needed — IDD review only where noted)

| Agent | Used By |
|-------|---------|
| code-builder | P3, P9, P17, start-feature-planning |
| tech-designer | P4, P17, P18 |
| repo-orchestrator | P1, P9, P11, P12, P14, P15, P16 |
| project-orchestrator | P1, P11, P15 |

### Backlog Agents (not in this plan — see spec backlog)

| Agent | Used By |
|-------|---------|
| specifier | define-feature (backlog) |
| designer | design-feature (backlog) |

---

## Task Registry

Task IDs are grouped by recipe priority: T-0XX for P1, T-010 range for P2, T-020 range for P3, etc.
T-900+ are cross-cutting tasks that run after all recipe groups.

---

### P1: `start-feature` (EXISTS — Review for IDD + Resume Mode + STM) ✓ COMPLETE

> Build order: review → add resume mode → add STM → verify → deploy
> Parallelism: T-002 and T-003 can run in parallel (independent additions to same recipe)

| ID | Task | Description | Depends On | Agent | Gate | Status |
|----|------|-------------|------------|-------|------|--------|
| T-001 | Review start-feature for IDD compliance | Read `core/components/recipes/start-feature/SKILL.md`. Audit: does it have IDD intent header (intent/constraints/failure_conditions)? Does it propagate intent to agent calls? Does it use Tether/Vanish (not AskUserQuestion) for checkpoints? Produce diff of what needs to change. | — | code-builder | G-904 | ✓ Done |
| T-002 | Add IDD intent header + Tether/Vanish to start-feature | Edit `core/components/recipes/start-feature/SKILL.md` — add IDD intent header block at top of recipe. Ensure all checkpoints use Tether/Vanish pattern. Ensure intent string is propagated to each agent call. | T-001 | code-builder | G-904, G-901 | ✓ Done |
| T-003 | Add resume mode to start-feature | Edit `core/components/recipes/start-feature/SKILL.md` — add `--resume <issue-id>` argument handling. RESUME mode: resolve existing GitHub issue, checkout existing branch, verify `.meridian/{issue}/` STM directory exists, create it if missing. NEW mode (existing behavior): create issue + branch + STM directory. | T-001 | code-builder | G-904 | ✓ Done |
| T-004 | Add STM directory creation to start-feature | Edit `core/components/recipes/start-feature/SKILL.md` — ensure both NEW and RESUME modes create or verify `.meridian/{issue}/` directory structure: `spec/`, `design/`, `evidence/`, `delivery/` subdirectories. Add roadmap/epic linking step: if `.meridian/project/product/` exists, offer to link issue to a roadmap feature. | T-001 | code-builder | G-904 | ✓ Done |
| T-005 | Verify start-feature (IDD + resume + STM) | Check: IDD intent header present and valid. `--resume` argument documented. STM directory creation step present for both modes. Tether/Vanish checkpoint exists. Intent propagated to project-orchestrator and repo-orchestrator calls. No AskUserQuestion usage. | T-002, T-003, T-004 | code-builder | G-904, G-901 | ✓ Done |
| T-006 | Deploy start-feature | Run `/sync-claude` to deploy updated `start-feature` recipe to `~/.claude/skills/`. Verify file present at destination. | T-005 | code-builder | G-904 | ✓ Done |

---

### P2: `capture-learning` (NEW — Learn-2-Memory Phase)

> Build order: design skills → build skills → build recipe → verify → deploy
> Parallelism: T-011 and T-012 (skill files) can be built in parallel once design is complete
> Phase note: Learn-2-Memory includes STM→LTM promotion — issue-specific learnings from `.meridian/{issue}/` short-term memory are promoted into long-term organizational memory at `core/components/memory/`

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-010 | Design capture-learning skill contracts | Write brief design stub defining input/output contracts for: `extract-patterns` (analyze completed STM artifacts, identify reusable patterns; input: source_path; output: patterns list with type, description, context) and `draft-ltm-entry` (produce structured LTM entry from patterns; input: patterns, entry_type: practice\|standard\|template; output: ltm_entry with path, type, content). Stub can be inline notes or a short markdown file at `.claude/specs/idsd/stubs/capture-learning-skills.md`. | — | code-builder | G-901 |
| T-011 | Create extract-patterns skill | Write `core/components/skills/extract-patterns/SKILL.md` — input contract: source_path (completed STM directory or file), artifact_types (optional filter). Output contract: patterns list with name, type (architecture\|process\|testing\|tooling), description, evidence_source, reusability (high\|medium\|low). Skill reads STM artifacts (specs, evidence, ADRs, retro notes) and identifies structural or procedural patterns worth preserving in LTM. | T-010 | code-builder | G-901 |
| T-012 | Create draft-ltm-entry skill | Write `core/components/skills/draft-ltm-entry/SKILL.md` — input contract: patterns (from extract-patterns), entry_type: practice\|standard\|template, proposed_path. Output contract: ltm_entry with path, type, content_summary, conflicts_detected (boolean), conflict_details (if any). Skill produces structured LTM entry. MUST check for conflicts with existing LTM entries at proposed path. If conflict detected, returns conflict_details and does NOT overwrite — proposes merge strategy instead. | T-010 | code-builder | G-901 |
| T-013 | Create capture-learning recipe | Write `core/components/recipes/capture-learning/SKILL.md` — L1 recipe, ≤1 agent call (product-strategist or generic knowledge agent). IDD intent header. Arguments: `--source <path>` (optional, STM directory), `--type <practice\|standard\|template>` (optional), and free-form intent. Execution: (1) invoke agent → extract-patterns from source or derive from intent (including semantic overlap detection with existing LTM), (2) invoke agent → draft-ltm-entry (including conflict detection with existing LTM), (3) present proposed LTM entry for review, Tether/Vanish checkpoint, (4) on Tether: stage entry for PR-based review — NOT direct write to `core/components/memory/`. **LTM Governance**: recipe must integrate with PR-based governance workflow — project-level entries reviewed by team leads, org-level entries reviewed by engineering leaders/CTOs. See `docs/philosophy/idsd.md` LTM Governance section. Uses existing agents — repo-orchestrator or project-orchestrator if agent call needed for STM read. Note: if no agent is needed (skills invoked directly by recipe), agent count is 0. Cap: ≤1 agent call. | T-011, T-012 | code-builder | G-901, G-904 |
| T-014 | Verify capture-learning | Check: IDD intent header present. `--source` and `--type` arguments documented. extract-patterns skill referenced. draft-ltm-entry skill referenced. Conflict detection behavior documented. Tether/Vanish checkpoint present. No AskUserQuestion usage. LTM write path documented as `core/components/memory/`. | T-013 | code-builder | G-901, G-904 |
| T-015 | Deploy capture-learning | Run `/sync-claude` to deploy `capture-learning` recipe and `extract-patterns`, `draft-ltm-entry` skills. Verify all files present at `~/.claude/skills/`. | T-014 | code-builder | G-901 |

---

### P3: `implement-feature` (NEW — L2, specced)

> New agent: validator. New skills: verify-gate, run-test-suite, validate-implementation. New references: gate-patterns, quality-standards.
> Parallelism: T-021, T-022, T-023 (skills) can be built in parallel after T-020. T-025, T-026 (references) can be built in parallel after T-021/T-023.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-020 | Create validator agent | Write `core/components/agents/validator.md` — domain=quality, role=validator, model=sonnet, tools: Task, Read, Bash, Glob, Grep, Skill (NO Write — validator is read-only). Responsibilities: verify implementation against gates defined in verify.md; run tests and check coverage; validate against LTM quality standards; produce evidence artifacts per gate; return structured failure if mandatory gates fail. IDD awareness: reads intent from recipe, reads LTM quality-standards reference, reads STM verify.md and evidence/. Structured failure protocol per `~/.meridian/core/memory/practices/structured-failure-protocol.md`. Recovery: max 1 self-recovery attempt (e.g., re-run tests after obvious fix). | — | code-builder | G-300 |
| T-021 | Create verify-gate skill | Write `core/components/skills/verify-gate/SKILL.md` — input contract: gate_id, verify_path, implementation_path. Output contract: gate_result with gate_id, status (pass\|fail), steps list (each: step_text, status, evidence), evidence_path (path to `evidence/g-{NNN}-*.md`), issues list (message, severity, fix_hint). Runs all verification steps for one gate. Produces evidence file. Does NOT modify implementation — read-only. | T-020 | code-builder | G-302 |
| T-022 | Create run-test-suite skill | Write `core/components/skills/run-test-suite/SKILL.md` — input contract: test_path (optional, auto-detect if omitted), test_runner (optional, auto-detect), coverage_thresholds (statements/branches/functions/lines as %), scope (all\|changed). Output contract: test_result with total, passed, failed, skipped, coverage (statements/branches/functions/lines as %), failing_tests list (name, file, error). Uses Bash tool to run actual test commands. Reports structured YAML output. Integrates with validate-implementation for final validation. | T-020 | code-builder | G-303 |
| T-023 | Create validate-implementation skill | Write `core/components/skills/validate-implementation/SKILL.md` — input contract: spec_path, implementation_path, gate_ids (optional, default all). Output contract: implementation_validation with ready_for_delivery (boolean), gates list (gate_id, status, mandatory), overall_score (0–100), blocking_issues list, evidence_manifest path. Reads feature spec's verify.md for gate list. Reads evidence/ files to determine gate pass/fail status. If any mandatory gate not in pass status → ready_for_delivery: false. References: `reference/quality-standards.md`. | T-020 | code-builder | G-402 |
| T-024 | Create implement-feature recipe | Write `core/components/recipes/implement-feature/SKILL.md` — L2 recipe (≤5 agent calls). IDD intent header. Arguments: `--spec <path>`, `--vertical <N>` (optional), intent. Execution flow: (1) Resolve context: spec provided → run cascade-sync check_only=true, read tasks.md. If cascade-sync returns stale artifacts → halt immediately with structured failure listing stale files; instruct user to run `--phase lock` on the parent spec to regenerate. Do NOT proceed with stale bundles. Intent only → derive plan from intent + codebase + LTM (no cascade-sync needed). (2) For each vertical: invoke code-builder (backend bundle), invoke code-builder (frontend bundle), invoke validator (gates for vertical). Checkpoint after each vertical: files changed, tests, gate status. Tether/Vanish. (3) Final: invoke validator (all mandatory gates). Checkpoint: full gate summary, evidence manifest. Tether/Vanish. Agent budget: 1 code-builder backend + 1 code-builder frontend + 1 validator per-vertical + 1 validator final = ≤5 total. Intent propagated to each agent call. Sync check at start: halt if bundles stale. | T-021, T-022, T-023 | code-builder | G-301, G-304 |
| T-025 | Create gate-patterns reference | Write `core/components/skills/verify-gate/reference/gate-patterns.md` — gate structure templates, mandatory vs optional gate criteria, evidence file format (`evidence/g-{NNN}-{slug}.md`), common verification step patterns (file exists, content matches, test passes, command succeeds), failure escalation rules. | T-021 | code-builder | G-302 |
| T-026 | Create quality-standards reference | Write `core/components/skills/validate-implementation/reference/quality-standards.md` — code coverage thresholds (statements ≥80%, branches ≥70%, functions ≥80%, lines ≥80%), test quality criteria (no skipped mandatory tests, no mock-only tests for business logic), performance benchmarks (p95 response time, memory limits), security requirements (no hardcoded secrets, input validation required), accessibility standards (WCAG 2.1 AA for UI), documentation requirements (public API surface documented). | T-023 | code-builder | G-402 |
| T-027 | Verify implement-feature | Check: validator agent file exists with correct domain/role/tools (no Write tool). verify-gate, run-test-suite, validate-implementation skill files exist with input/output contracts. gate-patterns and quality-standards references exist. implement-feature recipe is L2, ≤5 agent calls, cascades sync check at start, has per-vertical checkpoints, has final validation checkpoint. Tether/Vanish used throughout. No AskUserQuestion. Intent propagated to every agent call. | T-024, T-025, T-026 | code-builder | G-300, G-301, G-302, G-303 |
| T-028 | Deploy implement-feature | Run `/sync-claude` to deploy validator agent, verify-gate skill, run-test-suite skill, validate-implementation skill, and implement-feature recipe. Verify all files present at `~/.claude/agents/` and `~/.claude/skills/`. | T-027 | code-builder | G-300 |

---

### P4: `start-feature-planning` (EXISTS as `start-planned-feature` — Review for IDD) ✓ COMPLETE

> Build order: review → refactor SKILL.md + externalize templates → agent scope fixes → verify → deploy
> Parallelism: T-031 (recipe refactor + templates) runs after T-030. T-031a and T-031b (agent scope fixes) can run in parallel with T-031.
> Design decision: Recipe embeds start-feature flow (issue + branch + STM) — does not call it separately. Plan sub-agent (Claude OOTB) stays — not replaced by tech-designer. Planning artifacts are lightweight but IDD-aware (carry intent headers forward).
> Note: Recipe renamed from `start-planned-feature` to `start-feature-planning` during execution.

| ID | Task | Description | Depends On | Agent | Gate | Status |
|----|------|-------------|------------|-------|------|--------|
| T-030 | Review start-planned-feature for IDD compliance | Read `core/components/recipes/start-planned-feature/SKILL.md`. Audit against G-103 gate criteria. Produce gap analysis: IDD frontmatter alignment, Agent Routing Table format, template externalization, recovery protocol, code-builder scope, Plan sub-agent IDD-awareness in prompt. Recipe embeds start-feature flow (confirmed design decision). Plan sub-agent stays (confirmed). | — | code-builder | G-103 | ✓ Done |
| T-031 | Refactor start-planned-feature SKILL.md + externalize templates | Rewrite recipe: (1) Update IDD frontmatter (intent: quick idea-to-PR, constraints: embeds start-feature, IDD-aware planning, code-builder CODE only). (2) Add Agent Routing Table (Domain/Agent/Intent Slice). (3) Externalize templates to `templates/` (checkpoint.md, approval-prompt.md, final-report.md). (4) Add Recovery section (structured-failure-protocol + intent-driven-recovery). (5) Add References section with template table + contracts. (6) Update Plan sub-agent prompt to produce IDD intent headers in planning artifacts. (7) Scope code-builder invocation to CODE only. (8) Condense from 535 to ~150 lines. | T-030 | code-builder | G-103 | ✓ Done |
| T-031a | Fix code-builder agent scope | Update `core/components/agents/code-builder.md` NEVER section: add explicit boundaries — no documentation generation, no markdown authoring, no config file design, no non-code artifacts. Move description-level guidance into hard NEVER boundary. | — | code-builder | G-103 | ✓ Done |
| T-031b | Fix tech-designer agent scope | Update `core/components/agents/tech-designer.md`: add explicit domain boundary in NEVER section — TECHNICAL design only (code architecture, RCA, implementation planning). NOT product design, NOT UX design, NOT documentation structure, NOT process design. | — | code-builder | G-103 | ✓ Done |
| T-033 | Verify start-planned-feature (G-103) | Run G-103 verification against refactored recipe. Check all 19 criteria. Create evidence at `.claude/specs/idsd/evidence/g-103-start-planned-feature.md`. | T-031, T-031a, T-031b | code-builder | G-103 | ✓ Done |
| T-034 | Deploy start-planned-feature | Run `/sync-claude` to deploy updated recipe, templates, and agent files. Verify all files present at `~/.claude/skills/` and `~/.claude/agents/`. | T-033 | code-builder | G-103 | ✓ Done |

---

### P5: `discover-product` (NEW — specced)

> New agent: product-strategist (shared with P6, P7, P8).
> New skills: discover-product-opportunity, draft-product-vision, validate-product-vision, generate-business-review.
> New templates: vision.md, business-review.md.
> Parallelism: T-041, T-042, T-043, T-044 (skills) can be built in parallel after T-040. T-045, T-046 (templates) can be built in parallel after T-042/T-044.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-040 | Create product-strategist agent | Write `core/components/agents/product-strategist.md` — domain=product, role=strategist, model=sonnet, tools: Task, Read, Write, Glob, Grep, Skill. Responsibilities: accept product intent from recipe; discover market context and competitive landscape; generate vision with Strategic Goals (NOT OKRs — Strategic Goals replace OKRs in v2.0.0); prioritize features and build roadmaps; decompose epics into INVEST-compliant stories. Skills available: discover-product-opportunity, draft-product-vision, validate-product-vision, prioritize-product-features, draft-product-roadmap, validate-product-roadmap, decompose-product-epic, draft-product-stories, validate-product-backlog, generate-business-review, analyze-backlog, refine-product-stories. IDD awareness: reads intent from recipe, reads LTM (spec-structure practice when available), reads STM (current project context, existing product artifacts). Structured failure if intent too vague to derive market context. Recovery and escalation sections per structured-failure-protocol. | — | code-builder | G-001 |
| T-041 | Create discover-product-opportunity skill | Write `core/components/skills/discover-product-opportunity/SKILL.md` — input contract: problem_statement, market_hints (optional: industry, geography, target segment). Output contract: market_context with problem (refined problem statement), target_users (personas list), competitors (list with name/strengths/weaknesses), market_size (TAM/SAM/SOM estimates if derivable), differentiators, risks. | T-040 | code-builder | G-003 |
| T-042 | Create draft-product-vision skill | Write `core/components/skills/draft-product-vision/SKILL.md` — input contract: market_context (from discover-product-opportunity), product_name (optional). Output contract: vision with path (vision.md path), sections list: problem_statement, target_users, value_proposition, strategic_goals, success_metrics, competitive_landscape, assumptions, out_of_scope. Strategic Goals section replaces OKRs — defines what the product aims to achieve, not OKR cascades. Template: `templates/vision.md`. | T-040 | code-builder | G-003, G-004 |
| T-043 | Create validate-product-vision skill | Write `core/components/skills/validate-product-vision/SKILL.md` — input contract: vision_path. Output contract: validation_result with ready_for_lock (boolean), completeness_score (0–100), issues list (message, field, severity: blocker\|warning\|suggestion), checklist (strategic_goals_defined, target_users_identified, success_metrics_measurable, competitive_landscape_covered, assumptions_listed). | T-040 | code-builder | G-003 |
| T-044 | Create generate-business-review skill | Write `core/components/skills/generate-business-review/SKILL.md` — input contract: artifact_path, audience (default: "Product Manager"). Output contract: business_review with path, summary, key_decisions list, risks list, next_steps list. Generates audience-appropriate business-review.md from any product artifact. Audience: Product Manager / Business Owner. Sections: what it is, why it matters, user journeys, business rules (plain language), assumptions, out of scope. MUST NOT include engineering implementation details (audience collision prevention). Template: `templates/business-review.md`. Shared across discover-product, plan-roadmap, manage-backlog. | T-040 | code-builder | G-003, G-007 |
| T-045 | Create vision.md template | Write `core/components/skills/draft-product-vision/templates/vision.md` — IDD intent header block at top, sections: Problem Statement, Target Users (persona cards), Value Proposition, Strategic Goals (what success looks like — replaces OKRs), Success Metrics, Competitive Landscape, Assumptions, Out of Scope. Storage path annotation: `.meridian/project/product/{slug}/vision.md`. Status: DRAFT (replaced by LOCKED after lock phase). | T-042 | code-builder | G-004, G-006 |
| T-046 | Create business-review.md template | Write `core/components/skills/generate-business-review/templates/business-review.md` — IDD intent header block, audience annotation: "For: Product Manager / Business Owner", sections: What It Is (plain language), Why It Matters (business value), User Journeys (narrative flows), Business Rules (plain language, no tech jargon), Assumptions, Out of Scope. Storage path annotation: `.meridian/project/product/{slug}/reviews/{artifact}-review.md`. | T-044 | code-builder | G-004, G-006, G-007 |
| T-047 | Create discover-product recipe | Write `core/components/recipes/discover-product/SKILL.md` — L1 recipe (≤2 agent calls in draft, ≤1 in validate, 0 in lock). IDD intent header. Arguments: `--phase <draft\|validate\|lock>`, `--artifact <path>` (for validate/lock), intent. DRAFT phase: invoke product-strategist (discover-product-opportunity + draft-product-vision + generate-business-review) — 2 agent calls max. Output: `.meridian/project/product/{slug}/vision.md` (DRAFT). Checkpoint: present vision summary. Tether/Vanish. VALIDATE phase: invoke product-strategist (validate-product-vision) — 1 call. Output: validation_result. If user responds Vanish at validate checkpoint → return to DRAFT with validate issues as feedback; re-invoke product-strategist with original intent + issues list. Max 2 cycle-back iterations before structured failure. LOCK phase: run cascade-sync, set LOCKED status — 0 agent calls. Intent propagated to each agent call. | T-041, T-042, T-043, T-044, T-045, T-046 | code-builder | G-002, G-005 |
| T-048 | Verify discover-product | Check: product-strategist agent file exists with correct domain/role/tools. All 4 skills exist with valid input/output contracts. vision.md template has IDD intent header and all required sections. business-review.md template has IDD intent header and no technical jargon. Recipe is L1, ≤2 draft agent calls, has all 3 phases, Tether/Vanish after draft and validate. Intent propagated to agent calls. cascade-sync called in lock phase. Strategic Goals section present in vision template (NOT OKRs). | T-047 | code-builder | G-001, G-002, G-003, G-004, G-005, G-006, G-007 |
| T-049 | Deploy discover-product | Run `/sync-claude` to deploy product-strategist agent, all 4 skills, both templates, and discover-product recipe. Verify all files present at `~/.claude/agents/` and `~/.claude/skills/`. | T-048 | code-builder | G-001 |

---

### P6: `plan-roadmap` (NEW — specced)

> Reuses product-strategist agent (built in P5).
> New skills: prioritize-product-features, draft-product-roadmap, validate-product-roadmap.
> New template: roadmap.md.
> Parallelism: T-051, T-052, T-053 can be built in parallel after T-050 (roadmap skills are independent of each other).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-050 | Create prioritize-product-features skill | Write `core/components/skills/prioritize-product-features/SKILL.md` — input contract: features list (name, description), scoring_method (RICE\|MoSCoW), strategic_goals list. Output contract: ranked_features with method used, features list (name, score, rank, strategic_alignment note, rationale). RICE: Reach × Impact × Confidence / Effort. MoSCoW: Must/Should/Could/Won't. Features must link to at least one strategic goal from vision. | T-049 | code-builder | G-003 |
| T-051 | Create draft-product-roadmap skill | Write `core/components/skills/draft-product-roadmap/SKILL.md` — input contract: ranked_features (from prioritize-product-features), time_horizon (quarters or months), capacity_hints (optional). Output contract: roadmap with path (roadmap.md path), sections list, features_count, releases_count. Accounts for feature dependencies. Aligns features to strategic goals. Template: `templates/roadmap.md`. | T-049 | code-builder | G-003, G-004 |
| T-052 | Create validate-product-roadmap skill | Write `core/components/skills/validate-product-roadmap/SKILL.md` — input contract: roadmap_path, vision_path (optional). Output contract: validation_result with ready_for_lock, feasibility_score (0–100), issues list (message, severity), checklist (features_linked_to_goals, no_circular_dependencies, time_horizon_realistic, features_have_priorities). | T-049 | code-builder | G-003 |
| T-053 | Create roadmap.md template | Write `core/components/skills/draft-product-roadmap/templates/roadmap.md` — IDD intent header block, sections: Roadmap Overview (strategic goals this roadmap serves), Feature Priority Table (ranked features with scores), Release Timeline (quarters/milestones with feature assignments), Feature Dependencies, Risks and Assumptions. Storage path annotation: `.meridian/project/product/{slug}/roadmap.md`. Status: DRAFT. | T-051 | code-builder | G-004, G-006 |
| T-054 | Create plan-roadmap recipe | Write `core/components/recipes/plan-roadmap/SKILL.md` — L1 recipe (≤2 draft calls, ≤1 validate, 0 lock). IDD intent header. Arguments: `--phase <draft\|validate\|lock>`, `--vision <path>` (optional, for enrichment — NOT required), `--artifact <path>` (for validate/lock), intent. DRAFT: invoke product-strategist (prioritize-product-features + draft-product-roadmap + generate-business-review) — 2 calls max. Output: `.meridian/project/product/{slug}/roadmap.md` (DRAFT). Checkpoint: present roadmap summary. Tether/Vanish. VALIDATE: invoke product-strategist (validate-product-roadmap) — 1 call. Cycle-back on Vanish: return to DRAFT with validation issues as feedback. Max 2 iterations before structured failure. LOCK: cascade-sync, set LOCKED. Vision is enrichment, not a blocker — recipe works from intent alone if no vision provided. | T-050, T-051, T-052, T-053 | code-builder | G-002, G-005 |
| T-055 | Verify plan-roadmap | Check: all 3 skills exist with valid contracts. roadmap.md template has IDD intent header. Recipe is L1, phases correct, intent-sufficient (vision optional not required). Tether/Vanish checkpoints. Intent propagated. No OKR references. Strategic goals alignment documented. | T-054 | code-builder | G-002, G-003, G-004, G-005, G-006 |
| T-056 | Deploy plan-roadmap | Run `/sync-claude` to deploy prioritize-product-features, draft-product-roadmap, validate-product-roadmap skills, roadmap.md template, and plan-roadmap recipe. Verify all files present at destination. | T-055 | code-builder | G-002 |

---

### P7: `manage-backlog` (NEW — specced)

> Reuses product-strategist agent (built in P5) and generate-business-review skill (built in P5).
> New skills: decompose-product-epic, draft-product-stories, validate-product-backlog.
> New template: backlog-epic.md.
> Parallelism: T-061, T-062, T-063 can be built in parallel after T-060.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-060 | Create decompose-product-epic skill | Write `core/components/skills/decompose-product-epic/SKILL.md` — input contract: feature_name, feature_description, constraints (technical or business). Output contract: epic_structure with title, story_count, stories list (id, title, type: feature\|enhancement\|fix, priority: must\|should\|could, dependencies list). Splits epic into independently deliverable chunks. INVEST-aware — each story should be Independent, Negotiable, Valuable, Estimable, Small, Testable. Flag if story_count > 15 (suggests splitting epic). | T-056 | code-builder | G-003 |
| T-061 | Create draft-product-stories skill | Write `core/components/skills/draft-product-stories/SKILL.md` — input contract: epic_structure (from decompose-product-epic), strategic_goals (optional, for enrichment), roadmap_feature (optional, for enrichment). Output contract: backlog with path (backlog/{epic}.md path), sections list, story_count, invest_compliant (boolean). Each story: as_a / i_want / so_that format, acceptance criteria (Given/When/Then), definition_of_done. Template: `templates/backlog-epic.md`. | T-056 | code-builder | G-003, G-004 |
| T-062 | Create validate-product-backlog skill | Write `core/components/skills/validate-product-backlog/SKILL.md` — input contract: backlog_path. Output contract: validation_result with ready_for_lock, invest_score (0–100), issues list, checklist (all_stories_invest_compliant, acceptance_criteria_complete, stories_independently_deliverable, epic_links_to_goals, story_count_reasonable: flag if > 15). | T-056 | code-builder | G-003 |
| T-063 | Create backlog-epic.md template | Write `core/components/skills/draft-product-stories/templates/backlog-epic.md` — IDD intent header block, sections: Epic Title, Roadmap Feature Link (optional), Strategic Goals Served, Epic Summary, User Stories table (ID, Title, As a/I want/So that, Priority), Acceptance Criteria (per story, Given/When/Then), Definition of Done (shared across epic), Engineering Notes (optional — technical constraints visible to both product and engineering). Storage path annotation: `.meridian/project/product/{slug}/backlog/{epic}.md`. Status: DRAFT. | T-061 | code-builder | G-004, G-006 |
| T-064 | Create manage-backlog recipe | Write `core/components/recipes/manage-backlog/SKILL.md` — L1 recipe (≤2 draft calls, ≤1 validate, 0 lock). IDD intent header. Arguments: `--phase <draft\|validate\|lock>`, `--roadmap <path>` (optional, for enrichment), `--artifact <path>` (for validate/lock), intent. DRAFT: invoke product-strategist (decompose-product-epic + draft-product-stories + generate-business-review) — 2 calls max. Output: `.meridian/project/product/{slug}/backlog/{epic}.md` (DRAFT). Checkpoint: present epic summary + story count. Tether/Vanish. VALIDATE: invoke product-strategist (validate-product-backlog) — 1 call. Cycle-back on Vanish: return to DRAFT with validation issues as feedback. Max 2 iterations before structured failure. LOCK: cascade-sync, set LOCKED. LOCK phase MUST output: "LOCKED backlog/{epic}.md ready. Use `/start-planned-feature` or `/implement-feature` with this epic." | T-060, T-061, T-062, T-063 | code-builder | G-002, G-005 |
| T-065 | Verify manage-backlog | Check: all 3 new skills exist with valid contracts. backlog-epic.md template has IDD intent header. Recipe is L1, phases correct, intent-sufficient (roadmap optional). LOCK phase outputs handoff message. INVEST compliance checked. story_count > 15 warning documented. Tether/Vanish checkpoints. No AskUserQuestion. | T-064 | code-builder | G-002, G-003, G-004, G-005, G-006 |
| T-066 | Deploy manage-backlog | Run `/sync-claude` to deploy decompose-product-epic, draft-product-stories, validate-product-backlog skills, backlog-epic.md template, and manage-backlog recipe. Verify all files present at destination. | T-065 | code-builder | G-002 |

---

### P8: `refine-backlog` (NEW)

> Reuses product-strategist agent (built in P5).
> New skills: analyze-backlog, refine-product-stories.
> Parallelism: T-071 and T-072 can be built in parallel after T-070.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-070 | Design refine-backlog skill contracts | Write brief design stub: `analyze-backlog` (input: backlog_path or intent describing backlog state; output: analysis with stories_needing_split list, stories_needing_reorder list, stories_missing_criteria list, estimated_refinements_count) and `refine-product-stories` (input: backlog_path, analysis from analyze-backlog, refinement_instructions; output: refined_backlog with path, changes_made list, invest_score_before, invest_score_after). Preserve all story IDs for traceability. | T-066 | code-builder | G-901 |
| T-071 | Create analyze-backlog skill | Write `core/components/skills/analyze-backlog/SKILL.md` — per stub from T-070. MUST preserve story ID format. Output flags stories that violate INVEST, are too large (>3 day estimate implied), or have incomplete acceptance criteria. | T-070 | code-builder | G-003 |
| T-072 | Create refine-product-stories skill | Write `core/components/skills/refine-product-stories/SKILL.md` — per stub from T-070. Applies refinements from analysis. Re-validates INVEST compliance after changes. MUST NOT change story IDs. New stories from splits get new IDs with parent reference (e.g., US-005a, US-005b). Returns before/after invest_score to show improvement. Flags if refinement introduces circular dependencies. | T-070 | code-builder | G-003 |
| T-073 | Create refine-backlog recipe | Write `core/components/recipes/refine-backlog/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--backlog <path>` (optional), intent. Execution: (1) invoke product-strategist (analyze-backlog) — 1 call. Present analysis. Tether/Vanish. (2) invoke product-strategist (refine-product-stories) — 1 call. Present changes summary. Tether/Vanish to accept or re-run. Output: updated `backlog/{epic}.md`. Story IDs preserved. | T-071, T-072 | code-builder | G-002, G-904 |
| T-074 | Verify refine-backlog | Check: both skills exist with valid contracts. Story ID preservation documented. INVEST re-validation after changes. Circular dependency detection present. Recipe is L1, ≤2 agent calls. Tether/Vanish at both checkpoints. intent-sufficient (backlog path optional). | T-073 | code-builder | G-002, G-003, G-904 |
| T-075 | Deploy refine-backlog | Run `/sync-claude` to deploy analyze-backlog, refine-product-stories skills and refine-backlog recipe. Verify files present at destination. | T-074 | code-builder | G-002 |

---

### P9: `build-feature` (NEW — specced)

> Reuses code-builder and repo-orchestrator agents (existing).
> No new agent needed.
> Parallelism: No skill tasks — recipe invokes existing agents directly per spec.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-080 | Create build-feature recipe | Write `core/components/recipes/build-feature/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--bundle <id>` (optional), `--spec <path>` (optional), intent. Execution: (1) Resolve context: bundle provided → load bundle (≤12K tokens); spec path provided → read tasks.md, derive bundle; intent only → derive from intent + codebase + LTM. (2) invoke code-builder (implement from bundle or intent) — 1 call. **Compartmented context:** pass bundle content ONLY to code-builder — do NOT include verify.md, gate IDs, or validation criteria in the invocation context. (3) invoke repo-orchestrator via commit-code — 1 call. Checkpoint: files changed, tests run, commit summary. Tether/Vanish. Failure condition: bundle exceeds 12K token budget → halt. No clear scope from intent → structured failure. Tests fail after implementation → structured failure. | T-075 | code-builder | G-301 |
| T-081 | Verify build-feature | Check: IDD intent header present. Bundle loading with ≤12K check documented. Spec path and intent-only modes documented. code-builder agent invoked (not direct tool use). repo-orchestrator invoked for commit (agent-first, not direct git). Checkpoint with Tether/Vanish. Structured failure conditions documented. ≤2 agent calls. | T-080 | code-builder | G-301, G-901, G-904 |
| T-082 | Deploy build-feature | Run `/sync-claude` to deploy build-feature recipe. Verify file present at `~/.claude/skills/`. | T-081 | code-builder | G-301 |

---

### P10: `verify-feature` (NEW — specced)

> Reuses validator agent (built in P3).
> No new agent or skills needed — verify-gate, run-test-suite, validate-implementation already exist from P3.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-090 | Create verify-feature recipe | Write `core/components/recipes/verify-feature/SKILL.md` — L1 recipe, ≤1 agent call. IDD intent header. Arguments: `--spec <path>` (optional), `--gate <gate_id>` (optional, check single gate), `--all` (check all mandatory gates), intent. Execution: invoke validator (verify-gate per gate, run-test-suite, validate-implementation for final summary) — 1 agent call. Compartmented context: validator receives verify.md (gates) + implementation output ONLY. Bundle contents and design specs are NOT passed — validator must evaluate implementation output independently. Generates gate evidence files in `evidence/`. Returns validation report. If no gates defined and intent too vague → structured failure. Evidence cannot be produced (no tests exist) → structured failure. Output: gate evidence at `evidence/g-{NNN}-*.md`, validation report. | T-082 | code-builder | G-302, G-303 |
| T-091 | Verify verify-feature | Check: IDD intent header present. validator agent is the only agent invoked (1 call). --spec, --gate, --all arguments documented. Evidence produced per gate. Structured failures for no-gate and no-test conditions. | T-090 | code-builder | G-302, G-303, G-901 |
| T-092 | Deploy verify-feature | Run `/sync-claude` to deploy verify-feature recipe. Verify file present at `~/.claude/skills/`. | T-091 | code-builder | G-302 |

---

### P11: `commit-code` (EXISTS — Review for IDD) ✓ COMPLETE

> Build order: review → IDD fixes → verify → deploy
> Parallelism: N/A (single recipe, single review pass)

| ID | Task | Description | Depends On | Agent | Gate | Status |
|----|------|-------------|------------|-------|------|--------|
| T-100 | Review commit-code for IDD compliance | Read `core/components/recipes/commit-code/SKILL.md`. Audit: IDD intent header? Intent propagated to repo-orchestrator and project-orchestrator calls? Tether/Vanish checkpoints? Structured failure for "no changes to commit" and "pre-commit hooks fail"? Produce diff of what needs to change. | T-092 | code-builder | G-901, G-904 | ✓ Done |
| T-101 | Add IDD intent header + structured failure to commit-code | Edit `core/components/recipes/commit-code/SKILL.md` — add IDD intent header block. Document structured failure for: no changes to commit, pre-commit hooks fail after retry. Ensure intent propagated to agent calls. Ensure Tether/Vanish used for any checkpoint (e.g., before committing ambiguous changes). | T-100 | code-builder | G-901, G-904 | ✓ Done |
| T-102 | Verify commit-code | Check: IDD intent header present. Structured failure for no-changes and hook-failure conditions. Intent propagated. Conventional commit format documented. No AskUserQuestion. | T-101 | code-builder | G-901, G-904 | ✓ Done |
| T-103 | Deploy commit-code | Run `/sync-claude` to deploy updated commit-code recipe. Verify file present at destination. | T-102 | code-builder | G-901 | ✓ Done |

---

### P12: `create-pr` (EXISTS — Review for IDD)

> Build order: review → IDD fixes → verify → deploy

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-110 | Review create-pr for IDD compliance | Read `core/components/recipes/create-pr/SKILL.md`. Audit: IDD intent header? Intent propagated to repo-orchestrator? Tether/Vanish before push? Structured failure for no-commits and branch-conflicts? Produce diff of what needs to change. | T-103 | code-builder | G-901, G-904 |
| T-111 | Add IDD intent header + structured failure to create-pr | Edit `core/components/recipes/create-pr/SKILL.md` — add IDD intent header block. Document structured failure for: no commits to push, branch conflicts with target. Ensure intent propagated to repo-orchestrator. Tether/Vanish checkpoint before push (confirm this is the right moment to push). | T-110 | code-builder | G-901, G-904 |
| T-112 | Verify create-pr | Check: IDD intent header present. Structured failure for no-commits and conflict conditions. Intent propagated to repo-orchestrator. PR body includes quality checklist and issue link. No AskUserQuestion. Tether/Vanish checkpoint present. | T-111 | code-builder | G-901, G-904 |
| T-113 | Deploy create-pr | Run `/sync-claude` to deploy updated create-pr recipe. Verify file present at destination. | T-112 | code-builder | G-901 |

---

### P13: `review-pr` (NEW)

> Reuses validator agent (built in P3) and tech-designer agent (existing).
> Reuses analyze-pr skill (EXISTS — do not rebuild).
> New skills: review-code-quality, post-review-comments.
> Parallelism: T-121 and T-122 can be built in parallel (independent skills).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-120 | Create review-code-quality skill | Write `core/components/skills/review-code-quality/SKILL.md` — input contract: pr_diff (or branch), quality_standards_path (optional, loads from LTM if omitted), focus_areas (optional: security\|architecture\|performance\|correctness). Output contract: review with findings list (area, severity: blocking\|suggestion, description, location: file+line, recommendation), summary (blocking_count, suggestion_count, overall_assessment). Checks against LTM quality standards. Produces actionable findings — not vague observations. Blocking issues must block merge. | T-113 | code-builder | G-302 |
| T-121 | Create post-review-comments skill | Write `core/components/skills/post-review-comments/SKILL.md` — input contract: pr_url (or pr_number), findings (from review-code-quality), review_summary. Output contract: post_result with comments_posted, blocking_issues_posted, overall_review_state (request_changes\|approve\|comment), pr_url. Posts findings as PR comments using GitHub API (via repo-orchestrator or Bash). Blocking findings → request_changes state. Suggestions only → comment state. | T-113 | code-builder | G-400 |
| T-122 | Create review-pr recipe | Write `core/components/recipes/review-pr/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--pr <url\|number>` (optional), `--branch <name>` (optional), intent. Execution: (1) invoke validator (analyze-pr + review-code-quality) — 1 call. Present review findings summary: blocking count, suggestion count. Tether to post / Vanish to discard. (2) invoke repo-orchestrator (post-review-comments) — 1 call. Checkpoint: post confirmation with PR URL. Note: analyze-pr skill already exists — wrap it with review-code-quality for structured review flow. Failure: PR has no diff → structured failure. Cannot access repo or PR → structured failure. | T-120, T-121 | code-builder | G-301, G-904 |
| T-123 | Verify review-pr | Check: IDD intent header present. review-code-quality skill produces actionable findings (not vague). post-review-comments skill posts to actual PR. Recipe is L1, ≤2 agent calls. Tether/Vanish after findings summary. Blocking issues cause request_changes state. No AskUserQuestion. | T-122 | code-builder | G-301, G-302, G-904 |
| T-124 | Deploy review-pr | Run `/sync-claude` to deploy review-code-quality skill, post-review-comments skill, and review-pr recipe. Verify files present at destination. | T-123 | code-builder | G-301 |

---

### P14: `deliver-feature` (NEW — L2, specced)

> Reuses validator agent (built in P3) and repo-orchestrator (existing).
> Reuses validate-implementation skill (built in P3).
> New skill: generate-delivery-report.
> New template: delivery-report.md.
> Parallelism: T-131 (template) can be built in parallel with T-130 (skill).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-130 | Create generate-delivery-report skill | Write `core/components/skills/generate-delivery-report/SKILL.md` — input contract: spec_path, evidence_path, pr_url (optional), branch. Output contract: delivery_report with feature (name), epic_link, spec_link, design_link (optional), implementation (files_changed, lines_added, lines_removed, tests_added), verification (gates_passed N/total, mandatory_gates_passed N/mandatory, overall_score), pr (url, branch), evidence_manifest (path to evidence/ directory). Report is human-readable markdown, not raw YAML. Stored at `.meridian/{issue}/delivery/delivery-report.md`. | T-124 | code-builder | G-401 |
| T-131 | Create delivery-report.md template | Write `core/components/skills/generate-delivery-report/templates/delivery-report.md` — sections: Feature Summary (name, intent, links to epic/spec/design), What Was Built (files changed, tests added), Verification Results (gate table with ID/status/mandatory), PR Details (URL, branch, target), Evidence Manifest (links to evidence/ files). Human-readable markdown. Links resolve to actual artifact paths. | T-130 | code-builder | G-401 |
| T-132 | Create deliver-feature recipe | Write `core/components/recipes/deliver-feature/SKILL.md` — L2 recipe (≤4 agent calls). IDD intent header. Arguments: `--spec <path>` (optional), `--target-branch <branch>` (optional), intent. Execution: (1) invoke validator (validate-implementation — confirm ready_for_delivery: true) — 1 call. If not ready → structured failure: list blocking issues, suggest running verify-feature. (2) invoke repo-orchestrator (create-pr with gate summary + evidence manifest + change summary) — 1 call. Checkpoint: present PR URL + summary. Tether to merge / Vanish to hold. (3) generate-delivery-report (can be skill invoked by recipe or via repo-orchestrator). (4) Optional: invoke validator (post-merge health check) — 1 call. Agent budget: ≤4 calls. Intent propagated to both validator and repo-orchestrator. | T-130, T-131 | code-builder | G-400, G-402 |
| T-133 | Verify deliver-feature | Check: IDD intent header present. Recipe is L2, ≤4 agent calls. validator called first to confirm readiness. Structured failure if mandatory gates not passed. repo-orchestrator used for PR (agent-first, not direct gh). PR body includes gate summary and evidence manifest. Tether/Vanish before merge. generate-delivery-report produces delivery-report.md. No AskUserQuestion. | T-132 | code-builder | G-400, G-401, G-402 |
| T-134 | Deploy deliver-feature | Run `/sync-claude` to deploy generate-delivery-report skill, delivery-report.md template, and deliver-feature recipe. Verify files present at destination. | T-133 | code-builder | G-400 |

---

### P15: `run-demo` (NEW)

> Reuses project-orchestrator and product-strategist agents (existing).
> New skills: generate-changelog (shared with P16), draft-demo-script.
> Parallelism: T-141 and T-142 can be built in parallel after T-140.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-140 | Create generate-changelog skill | Write `core/components/skills/generate-changelog/SKILL.md` — input contract: since_tag (optional), since_date (optional), scope (repo\|branch), format (markdown\|json). Output contract: changelog with sections (features, fixes, improvements, breaking_changes), entries list per section (title, pr_url, author, date), version_bump_hint (major\|minor\|patch based on changes). Aggregates commits/PRs since last release or given tag. Categorizes by conventional commit type. Shared skill used by both run-demo (P15) and release (P16). | T-134 | code-builder | G-002 |
| T-141 | Create draft-demo-script skill | Write `core/components/skills/draft-demo-script/SKILL.md` — input contract: changelog (from generate-changelog), closed_issues list (optional), period (sprint\|milestone). Output contract: demo_script with total_duration_minutes, sections list (section_title, duration_minutes, talking_points list, demo_steps list (step, expected_outcome)). Produces human-readable demo script with talking points per completed feature. Includes before/after metrics if available in changelog or issues. | T-134 | code-builder | G-002 |
| T-142 | Create run-demo recipe | Write `core/components/recipes/run-demo/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--since <tag\|date>` (optional), `--period <sprint\|milestone>` (optional), intent. Execution: (1) invoke project-orchestrator (generate-changelog from git log + closed issues) — 1 call. (2) invoke product-strategist (draft-demo-script from changelog) — 1 call. Checkpoint: present demo script outline. Tether/Vanish. Output: demo-script.md, changelog.md (both in `.meridian/project/` or current working dir). Failure: no completed work in period → structured failure. | T-140, T-141 | code-builder | G-002, G-904 |
| T-143 | Verify run-demo | Check: IDD intent header. generate-changelog and draft-demo-script skills exist with valid contracts. Recipe is L1, ≤2 agent calls. generate-changelog marked as shared (reused by P16). Tether/Vanish after script outline. No AskUserQuestion. | T-142 | code-builder | G-002, G-904 |
| T-144 | Deploy run-demo | Run `/sync-claude` to deploy generate-changelog skill, draft-demo-script skill, and run-demo recipe. Verify files present at destination. | T-143 | code-builder | G-002 |

---

### P16: `release` (NEW)

> Reuses repo-orchestrator and validator agents (existing, validator built in P3).
> Reuses generate-changelog skill (built in P15).
> New skills: bump-version, create-release.
> Parallelism: T-151 and T-152 can be built in parallel after T-150 (independent skills).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-150 | Create bump-version skill | Write `core/components/skills/bump-version/SKILL.md` — input contract: changelog (from generate-changelog, or manual), current_version, bump_type (major\|minor\|patch\|auto). Output contract: version_bump with old_version, new_version, bump_type, rationale (why this bump type). Auto-detect bump type from changelog: breaking_changes → major, features → minor, fixes/improvements → patch. Follows semantic versioning strictly. | T-144 | code-builder | G-002 |
| T-151 | Create create-release skill | Write `core/components/skills/create-release/SKILL.md` — input contract: new_version, changelog_sections, branch, tag_message (optional). Output contract: release_result with tag (created git tag), release_url (GitHub release URL), changelog_path (updated CHANGELOG.md). Creates git tag, GitHub release with notes from changelog. Release notes from PR descriptions and commits. | T-144 | code-builder | G-002 |
| T-152 | Create release recipe | Write `core/components/recipes/release/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--branch <name>` (optional), `--bump <major\|minor\|patch\|auto>` (optional), intent. Execution: (1) invoke repo-orchestrator (generate-changelog + bump-version) — 1 call. Present: proposed version, changelog summary. Tether/Vanish. (2) invoke repo-orchestrator (create-release + update CHANGELOG.md) — 1 call. Checkpoint: release URL. Failure: unreleased breaking changes without major bump → structured failure (warn user). Failing tests on release branch → structured failure. generate-changelog reused from P15 — do NOT rebuild. | T-150, T-151 | code-builder | G-002, G-904 |
| T-153 | Verify release | Check: IDD intent header. bump-version and create-release skills exist. generate-changelog referenced (not rebuilt). Recipe is L1, ≤2 agent calls. Tether/Vanish before create-release. Structured failures for breaking-change-without-major-bump and failing-tests. No AskUserQuestion. | T-152 | code-builder | G-002, G-904 |
| T-154 | Deploy release | Run `/sync-claude` to deploy bump-version skill, create-release skill, and release recipe. Verify files present at destination. | T-153 | code-builder | G-002 |

---

### P17: `fix-bug` (NEW — Run-2-Monitor Phase)

> Reuses tech-designer (diagnose) and code-builder (fix) agents (both existing).
> New skills: diagnose-bug, fix-and-test.
> Parallelism: T-161 and T-162 can be built in parallel (independent skills).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-160 | Create diagnose-bug skill | Write `core/components/skills/diagnose-bug/SKILL.md` — input contract: bug_description, error_logs (optional), issue_reference (optional). Output contract: rca (root_cause_analysis) with reproduction_steps, root_cause (description), affected_components list, hypothesis (what went wrong and why), fix_approach (recommended implementation strategy). Reproduces bug, traces execution, identifies root cause — not just patches symptoms. | T-154 | code-builder | G-002 |
| T-161 | Create fix-and-test skill | Write `core/components/skills/fix-and-test/SKILL.md` — input contract: rca (from diagnose-bug), implementation_path. Output contract: fix_result with files_changed list, regression_test_path (path to new test), test_result (pass\|fail), fix_summary. Implements fix per RCA strategy. MUST add regression test — not just fix the code. Commits via repo-orchestrator (agent-first). If fix introduces new test failures → structured failure. | T-154 | code-builder | G-002 |
| T-162 | Create fix-bug recipe | Write `core/components/recipes/fix-bug/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--issue <id>` (optional), `--error <log_path>` (optional), intent. Execution: (1) invoke tech-designer (diagnose-bug) — 1 call. Present RCA summary: root cause, affected components, fix approach. Tether/Vanish. (2) invoke code-builder (fix-and-test + commit via repo-orchestrator) — 1 call. Checkpoint: files changed, regression test added, commit summary. Tether/Vanish. Failure: cannot reproduce bug → structured failure. Fix introduces new test failures → structured failure. | T-160, T-161 | code-builder | G-002, G-904 |
| T-163 | Verify fix-bug | Check: IDD intent header. diagnose-bug and fix-and-test skills exist. Recipe is L1, ≤2 agent calls. tech-designer invoked for diagnosis (not code-builder — correct domain separation). code-builder invoked for fix. Regression test requirement documented in fix-and-test skill. Tether/Vanish after RCA and after fix. No AskUserQuestion. Structured failure for cannot-reproduce and new-test-failures. | T-162 | code-builder | G-002, G-904 |
| T-164 | Deploy fix-bug | Run `/sync-claude` to deploy diagnose-bug skill, fix-and-test skill, and fix-bug recipe. Verify files present at destination. | T-163 | code-builder | G-002 |

---

### P18: `review-architecture` (NEW — Audit-2-Fix Phase)

> Reuses tech-designer and validator agents (both existing; validator built in P3).
> New skills: analyze-architecture, evaluate-tech-debt.
> Parallelism: T-171 and T-172 can be built in parallel (independent skills).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-170 | Create analyze-architecture skill | Write `core/components/skills/analyze-architecture/SKILL.md` — input contract: codebase_path, focus_areas (optional: patterns\|dependencies\|coupling\|cohesion). Output contract: architecture_analysis with components_found list (name, type, responsibility, dependencies), patterns_identified list (name, usage, assessment: good\|problematic), coupling_violations list, cohesion_issues list, dependencies_summary (external, internal, circular). Reads actual code structure, not just docs. | T-164 | code-builder | G-002 |
| T-171 | Create evaluate-tech-debt skill | Write `core/components/skills/evaluate-tech-debt/SKILL.md` — input contract: architecture_analysis (from analyze-architecture), ltm_standards_path (optional). Output contract: tech_debt_report with debt_items list (description, area, severity: critical\|high\|medium\|low, estimated_remediation: days, recommended_action), total_critical, total_high, proposed_adrs list (title, context — for significant decisions needed). Checks against LTM architecture standards. Produces actionable findings with effort estimates. | T-164 | code-builder | G-002 |
| T-172 | Create review-architecture recipe | Write `core/components/recipes/review-architecture/SKILL.md` — L1 recipe, ≤2 agent calls. IDD intent header. Arguments: `--path <codebase_path>` (optional), `--focus <area>` (optional), intent. Execution: (1) invoke tech-designer (analyze-architecture + evaluate-tech-debt) — 1 call. Present: findings summary, debt items by severity, proposed ADRs list. Tether/Vanish. (2) invoke validator (produce architecture-review.md with findings and recommendations) — 1 call. Output: architecture-review.md. Failure: codebase too large for context budget → structured failure (suggest narrowing --focus). No architecture standards in LTM → warn user, proceed with general principles. | T-170, T-171 | code-builder | G-002, G-904 |
| T-173 | Verify review-architecture | Check: IDD intent header. analyze-architecture and evaluate-tech-debt skills exist. Recipe is L1, ≤2 agent calls. Reads actual code (not just docs — documented in skill). LTM architecture standards referenced. Actionable findings (not vague). Tether/Vanish after analysis. No AskUserQuestion. Context budget failure condition documented. | T-172 | code-builder | G-002, G-904 |
| T-174 | Deploy review-architecture | Run `/sync-claude` to deploy analyze-architecture skill, evaluate-tech-debt skill, and review-architecture recipe. Verify files present at destination. | T-173 | code-builder | G-002 |

---

### P19: `generate-docs` (NEW — Audit-2-Fix Phase)

> Uses tech-designer agent (existing) — specifier agent is backlog, use tech-designer as substitute per spec note.
> New skills: extract-api-surface, draft-documentation.
> Parallelism: T-181 and T-182 can be built in parallel (independent skills).

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-180 | Create extract-api-surface skill | Write `core/components/skills/extract-api-surface/SKILL.md` — input contract: codebase_path, scope (public\|all), format (rest\|graphql\|functions\|all). Output contract: api_surface with endpoints list (path, method, description, parameters, response, auth_required), types list (name, fields, description), functions list (name, signature, description, usage). Reads actual code — not comments alone. Accurate: no hallucinated APIs or parameters. Fails if no clear public API surface → structured failure. | T-174 | code-builder | G-002 |
| T-181 | Create draft-documentation skill | Write `core/components/skills/draft-documentation/SKILL.md` — input contract: api_surface (from extract-api-surface), doc_type (api\|guide\|readme\|onboarding), existing_docs_path (optional). Output contract: documentation with path, doc_type, sections list, accuracy_note (warnings about any uncertain items). Produces structured docs from extracted surface. Follows project documentation conventions from LTM if available. Must be accurate — flags any uncertainty rather than hallucinating. | T-174 | code-builder | G-002 |
| T-182 | Create generate-docs recipe | Write `core/components/recipes/generate-docs/SKILL.md` — L1 recipe, ≤1 agent call. IDD intent header. Arguments: `--path <codebase_path>` (optional), `--type <api\|guide\|readme\|onboarding>` (optional), intent. Execution: invoke tech-designer (extract-api-surface + draft-documentation) — 1 call. Checkpoint: present doc outline. Tether/Vanish. Output: documentation files at appropriate paths (README, docs/api/, etc.). Failure: code has no clear public API surface → structured failure. Generated docs contradict actual code → tech-designer flags uncertainty, presents to user. | T-180, T-181 | code-builder | G-002, G-904 |
| T-183 | Verify generate-docs | Check: IDD intent header. extract-api-surface and draft-documentation skills exist. Accuracy requirement documented (no hallucination). Recipe is L1, ≤1 agent call. tech-designer invoked (specifier is backlog — tech-designer is substitute per spec). Tether/Vanish. API surface structured failure documented. No AskUserQuestion. | T-182 | code-builder | G-002, G-904 |
| T-184 | Deploy generate-docs | Run `/sync-claude` to deploy extract-api-surface skill, draft-documentation skill, and generate-docs recipe. Verify files present at destination. | T-183 | code-builder | G-002 |

---

### Cross-Cutting Tasks

> Run ONLY after all 19 recipe groups are deployed (T-184 is the last deploy).
> T-900 through T-903 can run in parallel. T-904 depends on T-900–T-903. T-905 depends on T-904.

| ID | Task | Description | Depends On | Agent | Gate |
|----|------|-------------|------------|-------|------|
| T-900 | Verify structured failure protocol in all new agents | Check all 2 new agents (product-strategist, validator) for: structured failure output contract matching `~/.meridian/core/memory/practices/structured-failure-protocol.md`; fields: what_failed, why, domain_assessment (within_my_domain, responsible_domain, suggested_agent), context (intent_received, self_recovery_attempted, self_recovery_details), suggested_fix. Max 1 self-recovery attempt documented. No raw error returns. | T-184 | code-builder | G-900 |
| T-901 | Verify IDD intent propagation in all recipes | Check all 19 recipes for: IDD intent header present (intent/constraints/failure_conditions). Intent string propagated to each agent call (not implicit). Intent format verified: `"Intent: {verb}: {artifact_or_scope} — {context_hint}"` per idsd.md Intent Propagation Format. All recipes use this exact format — no implicit passing. Verify all EXISTING recipes updated in P1, P4, P11, P12 have intent headers added. | T-184 | code-builder | G-901 |
| T-902 | Verify Tether/Vanish checkpoint pattern in all recipes | Check all 19 recipes: all approval points use Tether/Vanish output-and-wait pattern. No AskUserQuestion tool usage in any recipe. Parse rules documented: Tether/tether → proceed, Vanish/vanish → cancel, else → clarify. | T-184 | code-builder | G-904 |
| T-903 | Verify universal precursor (start-feature always first) | Check that start-planned-feature (P4) calls start-feature as first step. Check that implement-feature (P3) recipe documents start-feature as prerequisite or calls it. Check that build-feature (P9) and fix-bug (P17) document that start-feature should precede them. Verify spec dependency graph section is accurate. | T-184 | code-builder | G-905 |
| T-904 | Full lifecycle smoke test | Trace the complete IDSD (Intent Driven Software Development) end-to-end for two tracks: (A) Strategic track: discover-product → plan-roadmap → manage-backlog (LOCKED epic) → implement-feature (gates passed) → deliver-feature (PR). (B) Fast track: start-feature → build-feature → commit-code → create-pr. For each track: verify all recipe files exist, all referenced skills exist, all referenced agents exist, handoff points are documented, no broken links in the chain. Document any gaps. All new recipes must appear in the SDLC phases diagram in spec. | T-900, T-901, T-902, T-903 | code-builder | G-905 |
| T-905 | Update CLAUDE.md with all new recipes and agents | Edit `CLAUDE.md` in the repository root — add product-strategist and validator to the domain task table under Behavioral Rules > Execution Model. Add all 15 new recipes (P2–P10, P13–P19) to relevant sections. Update storage layout section to include `.meridian/project/product/{slug}/` paths for product management artifacts. | T-904 | code-builder | G-905 |

---

### Future Backlog (Trajectory Items — Not in Current Plan)

These items are documented in the philosophy docs but are NOT in the current build plan. They are listed here for tracking and dependency awareness.

| ID | Item | Source | Status | Notes |
|----|------|--------|--------|-------|
| F-001 | Monitor-to-Design phase recipe | `docs/philosophy/idsd.md` | Concept only | Production feedback → auto-generated intent candidates. 18-24 months. Depends on memory evolution (F-003). |
| F-002 | Brownfield bootstrap recipe (`bootstrap-codebase`) | Comparison report | Concept only | "Codebase-to-LTM" for cold-start on legacy codebases. No spec. |
| F-003 | Memory Evolution — Server-based LTM (MCP) | `docs/philosophy/idsd.md` | Concept to early design | Stage 2 of memory evolution. 6-12 months. |
| F-004 | Memory Evolution — Semantic search | `docs/philosophy/idsd.md` | Concept | Stage 3 of memory evolution. 12-18 months. Depends on F-003. |
| F-005 | Memory Evolution — Org-wide federation | `docs/philosophy/idsd.md` | Vision | Stage 4 of memory evolution. 18-24 months. Depends on F-004. |
| F-006 | Tool Integration — Jira MCP server | `docs/philosophy/idsd.md` Enterprise Wrapper | Architecture supports | Incremental addition. |
| F-007 | Tool Integration — Notion/Wiki MCP server | `docs/philosophy/idsd.md` Enterprise Wrapper | Architecture supports | Incremental addition. |
| F-008 | CTO-configurable domain parameters | `docs/philosophy/idsd.md` Enterprise Wrapper | Concept | Per-project quality thresholds, mandatory gates. |
| F-009 | LTM quality/decay automation | `docs/philosophy/idsd.md` Memory Evolution | Planned, not designed | Automated freshness scoring, relevance decay, contradiction detection. |
| F-010 | Semantic conflict detection in extract-patterns | T-011 (P2) | Designed, deferred | Designed in skill contract but may not be built in v1. Depends on F-003 for full capability. |

---

## Dependency Graph

```
P1: start-feature (IDD review)
  T-001 ──→ T-002  T-003  T-004  ← parallel edits
                 └──────────────→ T-005 (verify)
                                       └──→ T-006 (deploy)

P2: capture-learning (new)
  T-010 ──→ T-011  T-012  ← parallel skills
                └──────→ T-013 (recipe)
                               └──→ T-014 (verify)
                                        └──→ T-015 (deploy)

P3: implement-feature (new L2) — creates validator agent
  T-020 (validator agent)
    └──→ T-021  T-022  T-023  ← parallel skills
                    └──────→ T-024 (recipe)
  T-021 ──→ T-025 (gate-patterns ref)
  T-023 ──→ T-026 (quality-standards ref)
  T-024 + T-025 + T-026 ──→ T-027 (verify)
                                  └──→ T-028 (deploy)

P4: start-planned-feature (IDD review)
  T-030 ──→ T-031  T-032  ← parallel edits
                └──────→ T-033 (verify)
                               └──→ T-034 (deploy)

P5: discover-product (new) — creates product-strategist agent
  T-040 (product-strategist agent)
    └──→ T-041  T-042  T-043  T-044  ← parallel skills
             T-042 ──→ T-045 (vision template)
             T-044 ──→ T-046 (business-review template)
  T-041+T-042+T-043+T-044+T-045+T-046 ──→ T-047 (recipe)
                                                └──→ T-048 (verify)
                                                         └──→ T-049 (deploy)

P6: plan-roadmap (new, reuses product-strategist)
  T-049 (P5 deploy, product-strategist available)
    └──→ T-050  T-051  T-052  ← parallel skills
             T-051 ──→ T-053 (roadmap template)
  T-050+T-051+T-052+T-053 ──→ T-054 (recipe)
                                    └──→ T-055 (verify)
                                              └──→ T-056 (deploy)

P7: manage-backlog (new, reuses product-strategist)
  T-056 (P6 deploy)
    └──→ T-060  T-061  T-062  ← parallel skills
             T-061 ──→ T-063 (backlog-epic template)
  T-060+T-061+T-062+T-063 ──→ T-064 (recipe)
                                    └──→ T-065 (verify)
                                              └──→ T-066 (deploy)

P8: refine-backlog (new, reuses product-strategist)
  T-066 (P7 deploy)
    └──→ T-070 (design stub)
             └──→ T-071  T-072  ← parallel skills
                       └──────→ T-073 (recipe)
                                     └──→ T-074 (verify)
                                               └──→ T-075 (deploy)

P9: build-feature (new, reuses existing agents)
  T-075 (P8 deploy)
    └──→ T-080 (recipe)
              └──→ T-081 (verify)
                        └──→ T-082 (deploy)

P10: verify-feature (new, reuses validator from P3)
  T-082 (P9 deploy)
    └──→ T-090 (recipe, uses validator + skills from P3)
              └──→ T-091 (verify)
                        └──→ T-092 (deploy)

P11: commit-code (IDD review)
  T-092 (P10 deploy)
    └──→ T-100 ──→ T-101 ──→ T-102 (verify) ──→ T-103 (deploy)

P12: create-pr (IDD review)
  T-103 (P11 deploy)
    └──→ T-110 ──→ T-111 ──→ T-112 (verify) ──→ T-113 (deploy)

P13: review-pr (new, reuses validator + tech-designer)
  T-113 (P12 deploy)
    └──→ T-120  T-121  ← parallel skills
               └──────→ T-122 (recipe)
                              └──→ T-123 (verify)
                                        └──→ T-124 (deploy)

P14: deliver-feature (new L2, reuses validator + repo-orchestrator)
  T-124 (P13 deploy)
    └──→ T-130  T-131  ← parallel (skill + template)
               └──────→ T-132 (recipe)
                              └──→ T-133 (verify)
                                        └──→ T-134 (deploy)

P15: run-demo (new, reuses project-orchestrator + product-strategist)
  T-134 (P14 deploy)
    └──→ T-140  T-141  ← parallel skills (generate-changelog + draft-demo-script)
               └──────→ T-142 (recipe)
                              └──→ T-143 (verify)
                                        └──→ T-144 (deploy)

P16: release (new, reuses generate-changelog from P15)
  T-144 (P15 deploy, generate-changelog available)
    └──→ T-150  T-151  ← parallel skills (bump-version + create-release)
               └──────→ T-152 (recipe)
                              └──→ T-153 (verify)
                                        └──→ T-154 (deploy)

P17: fix-bug (new, reuses tech-designer + code-builder)
  T-154 (P16 deploy)
    └──→ T-160  T-161  ← parallel skills (diagnose-bug + fix-and-test)
               └──────→ T-162 (recipe)
                              └──→ T-163 (verify)
                                        └──→ T-164 (deploy)

P18: review-architecture (new, reuses tech-designer + validator)
  T-164 (P17 deploy)
    └──→ T-170  T-171  ← parallel skills (analyze-architecture + evaluate-tech-debt)
               └──────→ T-172 (recipe)
                              └──→ T-173 (verify)
                                        └──→ T-174 (deploy)

P19: generate-docs (new, reuses tech-designer)
  T-174 (P18 deploy)
    └──→ T-180  T-181  ← parallel skills (extract-api-surface + draft-documentation)
               └──────→ T-182 (recipe)
                              └──→ T-183 (verify)
                                        └──→ T-184 (deploy)

Cross-Cutting (after T-184)
  T-184 (P19 deploy — ALL recipes deployed)
    └──→ T-900  T-901  T-902  T-903  ← parallel cross-cutting verifies
                               └──────────────────→ T-904 (smoke test)
                                                         └──→ T-905 (update CLAUDE.md)


Shared Asset Dependency Summary
================================

Agent: product-strategist
  Created: T-040 (P5)
  Reused: P6 (plan-roadmap), P7 (manage-backlog), P8 (refine-backlog), P15 (run-demo)

Agent: validator
  Created: T-020 (P3)
  Reused: P10 (verify-feature), P13 (review-pr), P14 (deliver-feature), P16 (release), P18 (review-architecture)

Skill: generate-business-review
  Created: T-044 (P5)
  Reused: P6 (plan-roadmap), P7 (manage-backlog)

Skill: generate-changelog
  Created: T-140 (P15)
  Reused: P16 (release)

Skill: verify-gate, run-test-suite, validate-implementation
  Created: T-021–T-023 (P3)
  Reused: P10 (verify-feature), P14 (deliver-feature)

Skill: analyze-pr
  EXISTS (not rebuilt)
  Used by: P13 (review-pr)
```

---

## Parallelism Notes

| Priority Group | Max Parallel Tracks | Details |
|----------------|---------------------|---------|
| P1 (start-feature review) | 3 | T-002, T-003, T-004 independent edits after T-001 |
| P2 (capture-learning) | 2 | T-011, T-012 (skills) parallel after T-010 |
| P3 (implement-feature) | 3 | T-021, T-022, T-023 (skills) parallel after T-020; T-025, T-026 (refs) parallel |
| P4 (start-planned-feature) | 2 | T-031, T-032 independent edits after T-030 |
| P5 (discover-product) | 4 | T-041, T-042, T-043, T-044 (skills) parallel after T-040; T-045, T-046 parallel after their skill |
| P6 (plan-roadmap) | 3 | T-050, T-051, T-052 parallel after T-049; T-053 parallel with T-050/T-052 |
| P7 (manage-backlog) | 3 | T-060, T-061, T-062 parallel; T-063 parallel with T-060/T-062 |
| P8 (refine-backlog) | 2 | T-071, T-072 parallel after T-070 |
| P9 (build-feature) | 1 | Single recipe, no new skills |
| P10 (verify-feature) | 1 | Single recipe, reuses P3 skills |
| P11 (commit-code review) | 1 | Sequential review edits |
| P12 (create-pr review) | 1 | Sequential review edits |
| P13 (review-pr) | 2 | T-120, T-121 parallel after T-113 |
| P14 (deliver-feature) | 2 | T-130, T-131 (skill + template) parallel |
| P15 (run-demo) | 2 | T-140, T-141 (skills) parallel |
| P16 (release) | 2 | T-150, T-151 (skills) parallel |
| P17 (fix-bug) | 2 | T-160, T-161 (skills) parallel |
| P18 (review-architecture) | 2 | T-170, T-171 (skills) parallel |
| P19 (generate-docs) | 2 | T-180, T-181 (skills) parallel |
| Cross-Cutting | 4 | T-900, T-901, T-902, T-903 parallel |

---

## Task Count Summary

| Priority | Recipe | Action | Tasks | Key Deliverables |
|----------|--------|--------|-------|-----------------|
| P1 | start-feature | IDD Review | 6 | IDD header, resume mode, STM creation |
| P2 | capture-learning | New | 6 | extract-patterns, draft-ltm-entry skills; recipe |
| P3 | implement-feature | New (L2) | 9 | validator agent, 3 skills, 2 refs, recipe |
| P4 | start-planned-feature | IDD Review | 5 | IDD header, start-feature call, structured failure |
| P5 | discover-product | New | 10 | product-strategist agent, 4 skills, 2 templates, recipe |
| P6 | plan-roadmap | New | 7 | 3 skills, 1 template, recipe |
| P7 | manage-backlog | New | 7 | 3 skills, 1 template, recipe |
| P8 | refine-backlog | New | 6 | 2 skills (stub first), recipe |
| P9 | build-feature | New | 3 | recipe only (reuses existing agents) |
| P10 | verify-feature | New | 3 | recipe only (reuses P3 agent + skills) |
| P11 | commit-code | IDD Review | 4 | IDD header, structured failure |
| P12 | create-pr | IDD Review | 4 | IDD header, structured failure |
| P13 | review-pr | New | 5 | 2 skills, recipe |
| P14 | deliver-feature | New (L2) | 5 | 1 skill, 1 template, recipe |
| P15 | run-demo | New | 5 | 2 skills (generate-changelog shared), recipe |
| P16 | release | New | 5 | 2 skills (reuses generate-changelog), recipe |
| P17 | fix-bug | New | 5 | 2 skills, recipe |
| P18 | review-architecture | New | 5 | 2 skills, recipe |
| P19 | generate-docs | New | 5 | 2 skills, recipe |
| Cross-Cutting | — | Verify + Docs | 6 | structured failure, IDD, Tether/Vanish, precursor, smoke test, CLAUDE.md |
| | | | | |
| **GRAND TOTAL** | | | **111** | |

---

## Gate Coverage Matrix

Every task maps to at least one gate from `idsd-verify.md`.

| Task Range | Gates Covered |
|------------|---------------|
| P1: T-001–T-006 | G-901, G-904 |
| P2: T-010–T-015 | G-901, G-904 |
| P3: T-020–T-028 | G-300, G-301, G-302, G-303, G-304 |
| P4: T-030–T-034 | G-901, G-904 |
| P5: T-040–T-049 | G-001, G-002, G-003, G-004, G-005, G-006, G-007 |
| P6: T-050–T-056 | G-002, G-003, G-004, G-005, G-006 |
| P7: T-060–T-066 | G-002, G-003, G-004, G-005, G-006 |
| P8: T-070–T-075 | G-002, G-003, G-904 |
| P9: T-080–T-082 | G-301, G-901, G-904 |
| P10: T-090–T-092 | G-302, G-303, G-901 |
| P11: T-100–T-103 | G-901, G-904 |
| P12: T-110–T-113 | G-901, G-904 |
| P13: T-120–T-124 | G-301, G-302, G-400, G-904 |
| P14: T-130–T-134 | G-400, G-401, G-402 |
| P15: T-140–T-144 | G-002, G-904 |
| P16: T-150–T-154 | G-002, G-904 |
| P17: T-160–T-164 | G-002, G-904 |
| P18: T-170–T-174 | G-002, G-904 |
| P19: T-180–T-184 | G-002, G-904 |
| Cross-Cutting: T-900–T-905 | G-900, G-901, G-904, G-905 |

---

*End of Execution Plan v2.1.0*
