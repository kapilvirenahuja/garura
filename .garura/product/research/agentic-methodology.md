<!-- Provenance
origin: stm_research
editable: true
created_at: 2026-04-18T00:00:00Z
updated_at: 2026-04-18T00:30:00Z
researcher: product-keeper (Stage 2 specify-product — 3-tier restructure)
research_basis: .garura/product/specification/market-brief.md + project-profile.yaml + core/components/ inventory
research_notes: |
  Restructure from flat feature catalog to 3-tier Domain → Capability → Feature.
  Renamed from ai-methodology-platform to agentic-methodology. Component
  Architecture capability is the ONLY one whose features point to plays/agents/
  skills/memory paths — these ARE the methodology itself. All other capabilities
  are outcome capabilities mapped to ADRs, philosophy docs, or narrow skills.
-->

# Agentic Methodology

Codification of engineering methodology as a first-class, cross-session, tool-enforceable artifact. Garura's Agentic Methodology pillar is both the component substrate (plays, agents, skills, memory) AND the ladder that climbs from L2 Spec-Driven through L5 Goal-Driven. This domain is the core differentiator the market brief identifies as Gap #1.

**Search patterns:** methodology codification, spec-driven development, intent-driven development, signal-driven, goal-driven, plays, agents, skills, persistent project memory, IDSD, maturity ladder, agentic framework

---

## Capability: Component Architecture

**Status:** LIVE

**Rollup notes:** Every feature here ships today and is dogfooded in this repository. This is the substrate that makes every other Garura capability possible — the three-layer hierarchy (Plays → Agents → Skills), the three memory layers (STM, Project LTM, Global KB), and the protocol primitives (Tether/Vanish, Evidence, three-layer hierarchy).

**gap_items rollup:** None — all nine features LIVE.

### AM-F001: Plays

**Status:** LIVE

**What it is:** Compiled, slash-invokable orchestration artifacts that drive multi-step engineering workflows. 21 plays ship today (specify-product, start-feature, ship, create-pr, merge-pr, fix-it, distill, capture-learning, etc.). Every play is the compiled output of an intent.yaml via /create-play — never hand-edited.

**When It Matters:** Plays are the user's contract with the methodology. They turn an intent ("ship this feature", "review this PR") into a deterministic, evidence-producing pipeline with agent delegation, DAG resolution, evals, and checkpoint gates.

**Depth Spectrum:** Basic — small set of plays covering core flow. Standard — full lifecycle plays (specify-product, start-feature, ship, merge-pr, distill). Advanced — meta-plays (create-play, fix-it, enhance, report-issue). Enterprise — governance and portfolio plays.

**Signals:**
- Product idea mentions "slash commands", "workflow automation", or "repeatable engineering flows"
- Project profile declares `delivery_ambition.current_level >= L2` (spec-driven and above require compiled orchestration)
- Market brief or user statements name pain around ad-hoc prompt-driven work and missing audit trails

**Tradeoffs:**
- Compiled plays vs hand-authored scripts: determinism and evidence wins, but every change requires an intent.yaml round-trip via /create-play --rebuild
- Play breadth vs depth: more plays covers more flows but dilutes quality; each play must earn its slot with measurable invocation rate
- Slash-invocable surface vs learned routing: user explicitness today vs L3/L4 intent matching later — cannot have both without versioning the play registry

### Inclusion
- Default: **mandatory** for any Garura-based product
- Mandatory when: any methodology-class product
- Conditional: never
- Exclude when: never

### Success Criteria
- ≥ 95% of engineering actions in a Garura-managed project are invoked via a play (vs ad-hoc tool use)
- 100% of plays are compiled artifacts traceable to an intent.yaml
- Play invocation success rate ≥ 90% over rolling 30 days

### Failure Scenarios
- Scenario: A user edits SKILL.md or play markdown directly instead of going through /create-play --build
  - Impact: Compiled artifacts drift from intent.yaml; subsequent rebuilds wipe the manual edits silently
  - Mitigation: Hard rule in CLAUDE.md; /create-play --rebuild detects drift and warns
- Scenario: Plays grow to >10 steps and become unreadable
  - Impact: Agent budgets blow out, evals become impossible to maintain, users stop invoking the play
  - Mitigation: Play maturity model (ADR 013) caps complexity; plays that exceed thresholds are flagged for decomposition

### Cross-Tree Refs
- (none — Component Architecture is the substrate; cross-tree constraints target outcome capabilities)

### Experiential
- Usage count: 21 plays shipped
- Scenarios observed: every issue in this repo flows through at least one play
- Common mistakes: editing compiled SKILL.md directly; skipping /create-play workflow; inlining agent logic in plays
- Last promoted: LIVE since Garura v0

---

### AM-F002: Agents

**Status:** LIVE

**What it is:** 19 domain and utility agents (product-keeper, tech-architect, code-builder, test-engineer, judge, repo-orchestrator, doc-builder, intent-crafter, scriber, etc.) — each an autonomous context-engineering specialist that invokes skills within its domain.

**When It Matters:** Agents separate domain reasoning from artifact production. A play says "delegate this to product-keeper" and the agent decides which skills to invoke, how to interpret their output, and what structured result to return — preventing play code from swelling into untestable orchestration.

**Depth Spectrum:** Basic — 1-2 utility agents. Standard — domain agents per engineering discipline (code, test, docs, repo). Advanced — crafter/validator agent pairs with evidence handoff. Enterprise — governance agents (judge, compliance-keeper).

**Signals:**
- Product idea mentions "domain specialists", "separation of concerns", or "multi-step AI workflows"
- Project profile shows multiple engineering disciplines in play (code + test + docs + repo ops)
- User statements describe orchestration bloat or untestable prompt chains

**Tradeoffs:**
- Agent-first delegation vs inline tool use: composability and testability wins but adds a dispatch hop and a JSON contract surface to maintain
- Agent proliferation vs concentration: one-agent-per-domain is cleaner but risks context-swap overhead; concentrated agents are cheaper but leak domain boundaries
- Structured JSON contract (ADR 016) vs free-form responses: determinism wins but any schema change ripples across every play that consumes the agent

### Inclusion
- Default: **mandatory**
- Mandatory when: any multi-step engineering workflow
- Conditional: never
- Exclude when: trivial single-skill invocation

### Success Criteria
- Every agent invocation returns a structured JSON contract conforming to ADR 016
- ≥ 95% of domain tasks in plays are delegated to agents (not inlined)
- Agent recovery protocol fires for ≤ 5% of invocations (most succeed first pass)

### Failure Scenarios
- Scenario: A play inlines domain work that should be delegated
  - Impact: Play becomes untestable; domain knowledge fragments; evidence becomes inconsistent
  - Mitigation: CLAUDE.md agent-first rule; /create-play compiler warns on inlined domain logic
- Scenario: Agent return contract drifts from ADR 016
  - Impact: Downstream plays cannot parse results; silent failures accumulate
  - Mitigation: Agent contract validator in /create-play compilation

### Cross-Tree Refs
- (none — substrate feature)

### Experiential
- Usage count: 19 agents
- Scenarios observed: daily invocation across every play
- Common mistakes: inlining domain logic in plays; unclear agent boundaries
- Last promoted: LIVE

---

### AM-F003: Skills

**Status:** LIVE

**What it is:** 42 skills — model-invocable, single-purpose artifact producers (configure-capabilities, generate-intent-epics, validate-intent-epics, write-evidence, check-drift, quality-check, evals-creator, etc.). Skills are orchestrated by agents; they produce structured outputs and are composable.

**When It Matters:** Skills are the atomic unit of reusable capability. They encapsulate organizational knowledge (KB schemas, domain taxonomies, validator rules) behind a stable contract so the same artifact-producing logic is used across every play that needs it.

**Depth Spectrum:** Basic — a handful of utility skills (status, sync). Standard — domain skills per lifecycle stage. Advanced — validator and orchestrator skills with evidence handoff. Enterprise — governance and export skills.

**Signals:**
- Product idea describes reusable artifact production (validators, generators, exporters)
- User pain around duplicated logic across workflows or inconsistent outputs for the same task
- Project needs a stable contract surface that survives play and agent churn

**Tradeoffs:**
- Single-purpose skill granularity vs bundled skills: reuse rate wins but increases the catalog size agents must navigate
- Model-invocable-only rule vs direct play access: preserves the three-layer hierarchy but means trivial utility work still pays the agent dispatch cost
- SKILL.md contract rigor vs iteration speed: stable contracts enable cross-play reuse but slow down skill evolution when the underlying model capabilities shift

### Inclusion
- Default: **mandatory**
- Mandatory when: any reusable artifact-producing capability
- Conditional: never
- Exclude when: one-off agent reasoning that doesn't need reuse

### Success Criteria
- 100% of skills are model-invocable only (not callable directly by plays without an agent)
- Every skill declares its inputs, outputs, and contract in SKILL.md
- Skill reuse rate: ≥ 70% of skills invoked by ≥ 2 plays

### Failure Scenarios
- Scenario: A skill's SKILL.md contract drifts from its implementation
  - Impact: Agents construct malformed invocations; silent tool errors
  - Mitigation: Skill contract validator on every sync-claude
- Scenario: Skills multiply into one-off variations instead of generalizing
  - Impact: Maintenance cost explodes; KB fragments
  - Mitigation: Pre-creation review in /create-play DAG design

### Cross-Tree Refs
- (none — substrate)

### Experiential
- Usage count: 42 skills
- Scenarios observed: every play uses ≥ 3 skills
- Common mistakes: creating narrow one-off skills; bypassing agents
- Last promoted: LIVE

---

### AM-F004: Memory — STM (Short-Term Memory)

**Status:** LIVE

**What it is:** Issue-centric short-term memory under `.garura/project/issues/{n}/` — scoped per-issue work artifacts (specs, evidence, checkpoint, context, review) with provenance headers. ADR 008 defines the issue-centric STM model and the New Work Without Issue (NWWI) fallback.

**When It Matters:** STM is where active work lives. Every play writes evidence here; every checkpoint lands here; every agent reads context from here. Without STM scoping, cross-issue context pollution destroys the auditability that every higher-level methodology feature depends on.

**Depth Spectrum:** Basic — single scratchpad. Standard — issue-scoped STM with folder whitelist. Advanced — STM + provenance + schema validation (current). Enterprise — STM with retention policy + automated archival.

**Signals:**
- Product idea references per-issue working state, audit trails, or cross-session continuity for active work
- User mentions context pollution between concurrent tasks or lost state when sessions end
- Project profile shows multi-contributor or multi-issue concurrency

**Tradeoffs:**
- Strict folder whitelist vs flexible write paths: prevents pollution but rejects novel artifact types until the whitelist is updated
- Provenance headers on every write vs write-speed: auditability wins at the cost of extra structure on every artifact
- Issue-centric scoping vs free-floating NWWI work: clarity wins for tracked work but requires a graceful fallback for genuine exploration

### Inclusion
- Default: **mandatory**
- Mandatory when: any play that writes artifacts
- Conditional: never
- Exclude when: never

### Success Criteria
- 100% of play-produced artifacts land under the correct STM folder per ADR 017
- STM folder whitelist violations: 0 in rolling 30 days
- ≥ 95% of STM artifacts carry a provenance header

### Failure Scenarios
- Scenario: A play writes outside the STM folder whitelist
  - Impact: File-system pollution; cross-issue leakage; review and archival break
  - Mitigation: Folder-whitelist rule enforcement (ADR 017); preflight validators in plays
- Scenario: STM accumulates unbounded as issues close without archival
  - Impact: Repo size grows; grep/search becomes slow; cognitive load rises
  - Mitigation: archive-issue-stm skill exists; automated promotion gap tracked in AG-F010

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: dozens of issue folders live today
- Scenarios observed: every play writes here
- Common mistakes: writing to arbitrary paths; missing provenance
- Last promoted: LIVE

---

### AM-F005: Memory — Project LTM

**Status:** PARTIAL

**What it is:** Project-scoped long-term memory under `.garura/product/` — research, specifications, scope, epics, design artifacts, architecture. Structure is locked by ADR 017; promotion workflow from STM to LTM is currently manual.

**When It Matters:** Project LTM is the decision corpus — the "why" that survives beyond a single issue. It's the substrate that makes cross-session continuity real. Without LTM, every new issue starts from zero; with LTM, every issue inherits the project's accumulated spec, scope, and rationale.

**Depth Spectrum:** Basic — a single spec folder. Standard — research + specification + scope folders. Advanced — distill/capture-learning extracting into LTM (current partial). Enterprise — automated STM→LTM promotion with reviewer assignment.

**Signals:**
- Product idea references "decision history", "project memory", or "accumulated rationale across issues"
- User statements describe every new issue starting from zero or losing the "why" behind past choices
- Project profile shows multi-month horizons where early decisions must stay retrievable

**Tradeoffs:**
- Manual STM→LTM promotion vs automated: reviewer judgment keeps LTM clean but bottlenecks the pipeline when promotion backlog grows
- Structured folder whitelist vs free-form research: navigability wins but forces odd artifacts to pick a bucket or stay in STM
- LTM growth vs retention policy: keeping everything preserves context but degrades search; policy trimming risks losing the one decision someone needed

### Inclusion
- Default: **mandatory**
- Mandatory when: any multi-issue project
- Conditional: never
- Exclude when: single-shot one-time scripts

### Success Criteria
- 100% of LTM writes conform to ADR 017 folder whitelist
- Every LTM artifact has a provenance header
- Promotion decisions are traceable (who, when, from which STM)

### Failure Scenarios
- Scenario: Manual promotion creates silent drift between STM evidence and LTM canonicalization
  - Impact: LTM loses ground truth; reviewers cannot trust LTM content
  - Mitigation: distill and capture-learning plays; AG-F010 promotion workflow gap tracked
- Scenario: LTM grows unbounded as project ages
  - Impact: Navigation collapses; search becomes noisy
  - Mitigation: Retention policy (planned); archive workflow (planned)

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: core/components/memory + .garura/product in every Garura project
- Scenarios observed: Project LTM used daily
- Common mistakes: writing STM artifacts into LTM prematurely
- Last promoted: LIVE substrate, PARTIAL workflow

---

### AM-F006: Memory — Global KB

**Status:** LIVE

**What it is:** Cross-project knowledge base at `core/components/memory/knowledge/` — domain taxonomies, quality standards, schemas, cross-tree constraints. Organizational knowledge graduated from individual projects (ADR 009).

**When It Matters:** Global KB is what lets new projects start with the accumulated taxonomy of every project that came before. Without Global KB, every new project re-invents its domain model; with it, the specify-product play starts with a structured catalog and walks constraints deterministically.

**Depth Spectrum:** Basic — a shared markdown folder. Standard — domain taxonomies with schemas (current). Advanced — cross-tree constraint engine (current). Enterprise — KB versioning, promotion review, access control.

**Signals:**
- Product idea mentions "shared taxonomy", "reusable domain knowledge", or "organizational patterns"
- Multiple Garura projects exist or are planned and should inherit accumulated domain patterns
- User statements describe reinventing domain models on every new project

**Tradeoffs:**
- Cross-project sharing vs project isolation: reuse wins but forces strict promotion gating so project-specific content doesn't leak globally
- Structured taxonomy + constraints file vs free-form knowledge: deterministic constraint walking wins but every schema addition ripples across every project using that taxonomy
- Markdown + YAML split (prose + programmatic) vs single source: lets humans edit prose and agents parse structure, but forces both to stay in the same file for consistency

### Inclusion
- Default: **mandatory**
- Mandatory when: any project-creating play
- Conditional: never
- Exclude when: never

### Success Criteria
- Every KB extension goes through validate-kb-extension
- KB schema conformance: 100%
- Cross-tree constraint file stays consistent with domain files

### Failure Scenarios
- Scenario: Project-specific knowledge leaks into Global KB prematurely
  - Impact: KB pollution; other projects pick up inapplicable rules
  - Mitigation: Promotion workflow; ADR 009 organizational-knowledge test
- Scenario: KB drifts from the cross-tree constraint file
  - Impact: Constraint walker can't resolve referenced feature IDs; specify-product fails
  - Mitigation: validate-kb-extension skill; KB consistency check

### Cross-Tree Refs
- (none — substrate)

### Experiential
- Usage count: every specify-product run reads KB
- Scenarios observed: KB used across every Garura project
- Common mistakes: forcing project-specific content into KB
- Last promoted: LIVE

---

### AM-F007: Three-Layer Hierarchy

**Status:** LIVE

**What it is:** The Plays → Agents → Skills hierarchy enforced by /create-play compilation and agent-first delegation rules (ADR 001). Non-negotiable architectural invariant.

**When It Matters:** The hierarchy is why Garura is composable. Plays orchestrate, agents reason, skills produce. Breaking this hierarchy (plays calling skills directly, agents inlined in plays) collapses separation of concerns and destroys the ability to test each layer independently.

**Depth Spectrum:** Basic — plays call tools directly. Standard — plays delegate to agents. Advanced — agents orchestrate skills (current). Enterprise — hierarchy enforced by compile-time validator.

**Signals:**
- Product idea references "separation of concerns", "layered architecture", or "composable agentic framework"
- User statements name frustration with monolithic prompt chains or untestable orchestration
- Project needs independent testability of orchestration, reasoning, and production layers

**Tradeoffs:**
- Strict layer isolation vs "just do it inline": composability and testability wins but adds friction when a fix only needs one tool call
- Compile-time enforcement vs runtime flexibility: drift is caught early but novel workflows must wait for compiler support
- Three layers vs fewer: clearer responsibilities but three coordination points (play↔agent, agent↔skill) each need contract discipline

### Inclusion
- Default: **mandatory**
- Mandatory when: any multi-layer agentic framework
- Conditional: never
- Exclude when: never

### Success Criteria
- 100% of plays delegate domain tasks to agents
- 100% of skills are invoked only via agents (no direct play → skill)
- Hierarchy violations detected at compile time

### Failure Scenarios
- Scenario: A play bypasses an agent and calls a skill directly
  - Impact: Layer isolation breaks; domain knowledge fragments across plays
  - Mitigation: /create-play validator; CLAUDE.md rule
- Scenario: An agent inlines skill logic instead of delegating
  - Impact: Skills stop being reusable; maintenance cost rises
  - Mitigation: Agent contract tests

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: enforced on every play/agent commit
- Scenarios observed: hierarchy preserved across 21 plays × 19 agents × 42 skills
- Common mistakes: inlining for "speed"
- Last promoted: LIVE

---

### AM-F008: Tether/Vanish Protocol

**Status:** LIVE

**What it is:** Explicit human-approval gates (Tether = proceed, Vanish = cancel) for commits, PRs, destructive actions, and protected-branch operations. A first-class primitive distinct from prompt-yes/no because it binds to decision artifacts.

**When It Matters:** Approvals must be unambiguous and auditable. Tether/Vanish enforces a typed response, produces a decision artifact, and gives every play a consistent checkpoint protocol — preventing accidental progression through high-blast-radius steps.

**Depth Spectrum:** Basic — y/n prompts. Standard — Tether/Vanish with audit trail (current). Advanced — policy-driven approval routing. Enterprise — approval quorum, signed attestation.

**Signals:**
- Product idea mentions "approval gates", "irreversible actions", or "audit trail on destructive operations"
- Project profile shows protected branches, production deploys, or compliance-driven approvals
- User statements describe accidental destructive actions or ambiguous yes/no responses

**Tradeoffs:**
- Typed Tether/Vanish vs raw y/n: unambiguous audit artifact wins but costs extra typing on every gate
- Hard gates on every destructive step vs proportional gating: safety wins but friction accumulates; proportional gating is cheaper but requires a reliable reversibility classifier
- Explicit literal words (Tether/Vanish) vs generic confirm: distinctive wording prevents accidental proceed but demands user familiarity with the framework's vocabulary

### Inclusion
- Default: **mandatory** at any destructive step
- Mandatory when: commits to main, PRs, protected-branch ops
- Conditional: when action is reversible under 60s
- Exclude when: trivial ops

### Success Criteria
- 100% of destructive steps use Tether/Vanish (not raw y/n)
- Every Tether decision produces an evidence artifact
- Vanish usage on high-blast-radius ops: > 0 (signals the gate is real)

### Failure Scenarios
- Scenario: A play uses AskUserQuestion instead of Tether/Vanish
  - Impact: Audit trail breaks; decision capture is inconsistent
  - Mitigation: CLAUDE.md rule; /create-play compiler check
- Scenario: User types ambiguous response and play silently proceeds
  - Impact: Unintended destructive action executes
  - Mitigation: Protocol spec requires explicit clarification round

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every commit, PR, and merge gate
- Scenarios observed: used daily across every ship and merge-pr play
- Common mistakes: falling back to raw y/n prompts
- Last promoted: LIVE

---

### AM-F009: Evidence & Checkpoint Substrate

**Status:** LIVE

**What it is:** Every play writes evidence artifacts via the write-evidence skill and stage checkpoints to STM; evidence is self-committed per ADR 012 and the L1 checkpoint model is defined in ADR 002.

**When It Matters:** Evidence and checkpoints are what make the methodology auditable. Without them, agent actions become invisible. With them, every step has a durable artifact showing what was done, by whom (agent or user), against which intent, with which inputs — the foundation for all downstream compliance and observability features.

**Depth Spectrum:** Basic — a log file. Standard — per-step evidence with provenance (current). Advanced — self-committed evidence + checkpoint rollback (current). Enterprise — tamper-evident storage, signed attestation.

**Signals:**
- Product idea references "auditability", "reproducibility", or "rollback on failure"
- User statements describe invisible agent behavior or inability to reconstruct what ran
- Project profile shows compliance, regulated industry, or mandatory after-action review

**Tradeoffs:**
- Evidence on every step vs selective evidence: complete audit trail wins but inflates STM size and commit noise
- Self-committed evidence (ADR 012) vs user-committed: guarantees durability but means evidence commits interleave with real work commits
- Checkpoint rollback granularity vs cost: finer checkpoints recover more state but multiply write volume; coarser checkpoints are cheap but force larger redo on failure

### Inclusion
- Default: **mandatory**
- Mandatory when: any multi-step play
- Conditional: never
- Exclude when: never

### Success Criteria
- 100% of play steps produce evidence
- 100% of evidence committed automatically per ADR 012
- Checkpoint rollback succeeds on ≥ 95% of failure cases

### Failure Scenarios
- Scenario: A step skips evidence writing
  - Impact: Audit trail gaps; compliance features (AG) cannot rebuild the story
  - Mitigation: write-evidence skill required in every play-step contract
- Scenario: Self-commit fails silently and evidence never reaches git
  - Impact: Evidence exists in working tree only; lost on session end
  - Mitigation: commit verification; ADR 012 post-commit hook

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every step of every play
- Scenarios observed: evidence corpus across every closed issue
- Common mistakes: writing evidence to ad-hoc paths
- Last promoted: LIVE

---

## Capability: L2 Spec-Driven

**Status:** LIVE

**Rollup notes:** L2 pipeline (specify-product → design-exp → build-arch → prepare-epic → implement-epic → validate-epic) is shipped end-to-end. Maturity ladder engine is PARTIAL (ladder defined, per-capability runtime enforcement absent); persistent memory substrate is LIVE; spec-to-test continuity is PARTIAL (validators ship, automated drift propagation gaps).

**gap_items rollup:** Per-capability level enforcement, level-up/down recommendation, automated posture measurement (AM-F010); automatic drift propagation on upstream change (AM-F012).

### AM-F010: Maturity Ladder Engine

**Status:** PARTIAL

**What it is:** Explicit engineering maturity ladder L1-L5 — Spec-Driven (L2), Intent-Driven (L3), Signal-Driven (L4), Goal-Driven (L5) — codified in `docs/philosophy/idsd.md` and referenced by `project_profile.delivery_ambition`. Per-capability climbing is declared but runtime enforcement is not yet shipped.

**When It Matters:** Teams adopt AI tooling at radically different maturity levels. A codified ladder gives teams shared vocabulary and lets tooling automatically adjust what it enforces per level. Per-capability climbing matters because a team can be L3 on its core domain and L2 on peripheral utilities; forcing whole-product uniformity kills adoption.

**Depth Spectrum:** Basic — L1/L2 self-declared. Standard — L1–L3 enforced with lock gates. Advanced — L1–L4 with signal-driven level-up recommendations. Enterprise — L1–L5 with Goal-Driven mode.

**Signals:**
- Product idea references a "maturity model", "adoption ladder", or "progressive enforcement"
- Project profile declares `delivery_ambition.current_level` and `roadmap_horizon` with a target above current
- User statements describe uneven adoption — teams/capabilities at different methodology depths

**Tradeoffs:**
- Per-capability levels vs whole-product uniform level: realistic adoption wins but posture reporting and level-up programs get harder to summarize
- Runtime lock-gate enforcement vs declared-only levels: real teeth wins but a team mid-climb can be blocked by a gate they aren't ready for
- L5 aspirational rungs vs shipping only what's proven: vision clarity wins but risks credibility if L4/L5 stay PLANNED for too long

### Inclusion
- Default: **mandatory** for methodology/DX products
- Mandatory when: `project_profile.industry == 'developer-tools' and 'methodology' in product_idea`
- Conditional: `project_profile.delivery_ambition.current_level >= 'L2-spec-driven'`
- Exclude when: `current_level == 'L1' and roadmap_horizon == 'L1'`

### Success Criteria
- ≥ 90% of active projects have a declared current level within 7 days of onboarding
- Level-up completes with zero schema-breaking changes in ≥ 95% of transitions
- Per-capability level drift stays below 10% of all capabilities

### Failure Scenarios
- Scenario: Team declares L3 but continues shipping without sealed intent artifacts
  - Impact: Lock-gate trust collapses; downstream skills accept partial intents and produce shallow outputs
  - Mitigation: Lock-gate enforcement at L3+; daily drift-check skill files a Vanish-or-fix decision
- Scenario: Per-capability state matrix becomes unreadable
  - Impact: Control Tower reports become unintelligible; level-up programs stall
  - Mitigation: Aggregate posture summary with distribution + portfolio rollup

### Cross-Tree Refs
- (none yet — future CTCs will tie to EO and AG features)

### Experiential
- Usage count: declared in project_profile for every Garura project
- Scenarios observed: L2 declared here; L3 target in roadmap
- Common mistakes: declaring target without staging artifact migrations
- Last promoted: PARTIAL

---

### AM-F011: Persistent Memory Substrate

**Status:** LIVE

**What it is:** Structured artifact tree (STM + Project LTM + KB) with schema validation, provenance headers, and git-based multi-contributor continuity. The foundation every methodology feature depends on.

**When It Matters:** Every mainstream AI coding tool as of April 2026 treats each session as a clean slate. Persistent memory is the foundation that makes "intent-driven" real; without it, intent collapses back to prompt-driven. This substrate is what differentiates Garura from Copilot/Cursor/Windsurf.

**Depth Spectrum:** Basic — a shared doc. Standard — STM + LTM + KB (current). Advanced — promotion workflow. Enterprise — access control, retention, audit.

**Signals:**
- Product idea mentions "session memory", "persistent context", or explicit dissatisfaction with clean-slate AI tools
- User pain with losing intent between sessions or with re-briefing assistants on every invocation
- Project profile targets cross-session or cross-contributor continuity

**Tradeoffs:**
- Three-layer memory (STM/LTM/KB) vs single store: clean scoping wins but forces promotion discipline between layers
- Git-based continuity vs external store: transparency and multi-contributor merge wins but ties memory evolution to repo hygiene
- Schema validation on every write vs permissive writes: integrity wins but every schema change triggers rewrites across existing artifacts

### Inclusion
- Default: **mandatory**
- Mandatory when: any cross-session AI methodology product
- Conditional: never
- Exclude when: never

### Success Criteria
- 100% of memory writes conform to folder whitelist
- Every artifact carries a provenance header
- Git history preserves full memory evolution

### Failure Scenarios
- Scenario: Writes escape the whitelist
  - Impact: File-system pollution; archival fails
  - Mitigation: ADR 017 validator
- Scenario: Provenance headers missing
  - Impact: Audit trail broken
  - Mitigation: schema validation at write time

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: in use in every Garura project
- Scenarios observed: core substrate
- Common mistakes: bypassing schema
- Last promoted: LIVE

---

### AM-F012: Spec-to-Test Continuity

**Status:** PARTIAL

**What it is:** The artifact chain intent → scope → epic → plan → implementation → scenarios → tests, enforced by validators (validate-intent-epics, validate-architecture-spec, validate-screen-coverage, check-drift). Automated propagation on upstream change is incomplete.

**When It Matters:** Without spec-to-test continuity, late-stage artifacts silently drift from early-stage intent. Teams think they're building what the spec says; reviewers think what shipped matches what was approved. Continuity enforcement catches drift at the boundary between stages.

**Depth Spectrum:** Basic — spec + ad-hoc tests. Standard — intent → epic → scenarios (current). Advanced — intent → tests with automated drift detection (current validators). Enterprise — automated propagation on upstream change.

**Signals:**
- Product idea references "spec-to-test traceability", "drift detection", or "requirements-to-verification chain"
- Project profile shows L2+ ambition where spec artifacts lock before implementation
- User statements describe tests passing against stale specs or features shipping that don't match approved intent

**Tradeoffs:**
- Strict validators at every boundary vs trust-the-engineer: catches drift early but blocks pipelines on cosmetic violations
- Automated upstream propagation (planned) vs manual re-validation: saves toil but risks mass cascade changes on small upstream edits
- Minimum scenario counts (≥2 success, ≥2 failure) vs author discretion: ensures non-cosmetic coverage but pushes authors to pad scenarios to meet counts

### Inclusion
- Default: **mandatory** for L2+ projects
- Mandatory when: `delivery_ambition.current_level >= 'L2'`
- Conditional: never
- Exclude when: L1-only projects

### Success Criteria
- 100% of intent epics validate against the schema before lock
- check-drift detects ≥ 90% of spec vs implementation drift in pilot runs
- Scenarios generated per capability: ≥ 2 success + ≥ 2 failure

### Failure Scenarios
- Scenario: Upstream intent change does not propagate to downstream scenarios
  - Impact: Tests pass against stale scenarios; drift goes undetected
  - Mitigation: check-drift scheduled run; propagation automation (planned gap)
- Scenario: Validators pass but scenarios are cosmetic
  - Impact: Epic looks complete but tests are shallow
  - Mitigation: quantification regex on constraints; minimum scenario counts

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: every specify-product/start-feature flow
- Scenarios observed: validators run daily
- Common mistakes: editing downstream artifacts without re-validating upstream
- Last promoted: PARTIAL

---

## Capability: L3 Intent-Driven

**Status:** PARTIAL

**Rollup notes:** Intent schema is formally defined; scope auto-narrowing and epic auto-generation ship today. Runtime intent inference across plays is PLANNED.

**gap_items rollup:** Cross-play intent matching; runtime intent context binding.

### AM-F013: Intent Inference

**Status:** PARTIAL

**What it is:** intent.yaml schema is defined; intent-crafter and intent-resolver agents exist. Cross-play intent matching (which play best serves this intent?) is not shipped.

**When It Matters:** Intent inference is the user-facing promise of L3 — "tell me what you want, I'll pick the right pipeline". Without it, users must know which play to invoke; with it, the framework routes intent → play automatically.

**Depth Spectrum:** Basic — user picks play. Standard — intent schema + crafter (current). Advanced — runtime cross-play matching. Enterprise — intent history + learned routing.

**Signals:**
- Product idea references "describe what you want" UX or intent-to-workflow matching
- Project profile declares `roadmap_horizon >= L3`
- User statements describe play-discovery pain or needing to memorize slash commands

**Tradeoffs:**
- Intent schema rigor (no placeholders, quantified constraints) vs authoring speed: deterministic downstream generation wins but raises the barrier to drafting a first intent
- Runtime cross-play routing vs user-explicit invocation: one-shot UX wins but a wrong auto-routed play is worse than a slow menu
- Intent-crafter + resolver pair vs single agent: clearer responsibilities but two contract surfaces instead of one

### Inclusion
- Default: **optional** until L3 is target
- Mandatory when: `delivery_ambition.roadmap_horizon >= 'L3'`
- Conditional: never
- Exclude when: L2-only

### Success Criteria
- 100% of plays compile from a valid intent.yaml
- Intent-crafter produces schema-valid output on ≥ 95% of runs
- Cross-play routing accuracy ≥ 80% in pilot (planned)

### Failure Scenarios
- Scenario: Intent schema allows placeholders that pass validation
  - Impact: Downstream plays produce hollow artifacts
  - Mitigation: quantification regex; no-TBD rule
- Scenario: User provides ambiguous intent and no play matches
  - Impact: Silent routing failure
  - Mitigation: intent-resolver escalates with clarification round

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: used in /create-play for every play
- Scenarios observed: intent schema enforced on every play build
- Common mistakes: inlining implementation details in intent
- Last promoted: PARTIAL

---

### AM-F014: Scope Auto-Narrowing

**Status:** LIVE

**What it is:** configure-capabilities skill walks KB cross-tree constraints and auto-selects capabilities based on project_profile; rejected set is recorded with rationale.

**When It Matters:** Scope auto-narrowing is how a project stops being an unbounded feature-set and becomes a specific, defensible scope. It turns project_profile declarations into a deterministic capability selection with audit trail.

**Depth Spectrum:** Basic — user hand-picks capabilities. Standard — KB-guided manual selection. Advanced — constraint-driven auto-select (current). Enterprise — multi-profile composition.

**Signals:**
- Product idea references "scope-narrowing", "deterministic capability selection", or "defensible product scope"
- User statements describe scope creep or inability to justify why a capability is in or out
- Project profile declares dimensions (industry, audience, security_level) that should drive selection

**Tradeoffs:**
- Auto-selection vs hand-picked scope: determinism and audit wins but demands a mature KB with correct cross-tree constraints
- Recording rejected capabilities with rationale vs silent exclusion: completeness of audit wins but inflates the scope artifact
- Conditional constraints based on profile fields vs static defaults: flexibility wins but each new profile dimension forces KB constraint updates

### Inclusion
- Default: **mandatory**
- Mandatory when: any specify-product run
- Conditional: never
- Exclude when: never

### Success Criteria
- 100% of specify-product runs produce a scope.yaml with constraint_trace
- Every constraint is walked and its decision recorded
- Rejected capabilities carry explicit rationale

### Failure Scenarios
- Scenario: Constraint references unknown feature ID
  - Impact: Walk fails; specify-product blocks
  - Mitigation: validate-kb-extension pre-flight
- Scenario: Auto-selection includes a capability the user did not want
  - Impact: Downstream epics generated for unwanted capability
  - Mitigation: user review gate between configure and generate

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every specify-product run
- Scenarios observed: used in Garura specify-product for this product
- Common mistakes: missing profile fields that constraints depend on
- Last promoted: LIVE

---

### AM-F015: Epic Auto-Generation

**Status:** LIVE

**What it is:** generate-intent-epics skill instantiates one intent epic per enriched capability with every mandatory field populated and every success/failure scenario traceable to KB sources.

**When It Matters:** Epic auto-generation removes the most error-prone manual step in the L3 pipeline. Hand-authored epics drift from the KB; auto-generated epics stay grounded in the capability taxonomy with full kb_source traceability.

**Depth Spectrum:** Basic — hand-author epics. Standard — template + manual fill. Advanced — auto-gen from enriched KB (current). Enterprise — epic diffing on KB updates.

**Signals:**
- Product idea references "KB-grounded epics" or "traceable requirements"
- User statements describe hand-authored epics that drift from the domain taxonomy
- Project profile targets L3 with locked intent schema and enriched capabilities

**Tradeoffs:**
- Auto-generation from KB vs hand-authored epics: traceability wins but quality is capped by KB feature content — a shallow KB produces shallow epics
- Every field KB-sourced (no placeholders) vs faster first-draft: non-hollow epics win but forces the KB to carry every detail the epic needs
- Epic per capability vs grouped epics: clean traceability wins but large scopes produce many small epics to track

### Inclusion
- Default: **mandatory**
- Mandatory when: any specify-product run at L3+
- Conditional: never
- Exclude when: L1/L2 projects without intent schema

### Success Criteria
- 100% of generated epics pass validate-intent-epics
- Every field is KB-sourced (no placeholders)
- Scenarios: ≥ 2 success + ≥ 2 failure per epic

### Failure Scenarios
- Scenario: Generated epic misses a mandatory field
  - Impact: validate-intent-epics blocks; pipeline stalls
  - Mitigation: template completeness check pre-write
- Scenario: kb_source points to stale feature ID
  - Impact: Traceability breaks
  - Mitigation: KB consistency validator

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every specify-product run
- Scenarios observed: daily use
- Common mistakes: editing generated epics without re-validating
- Last promoted: LIVE

---

## Capability: L4 Signal-Driven

**Status:** PLANNED (v1.1 May)

**Rollup notes:** No L4 signal-driven orchestration shipped. Architecture is ready (composable plays, autonomous agents) but the signal ingestion + play selector + autonomous trigger + approval gate substrate is entirely PLANNED.

**gap_items rollup:** Webhook ingestion; signal schema; signal-triggered play invocation; play-selector agent; policy-driven approval routing.

### AM-F016: Event Bus

**Status:** PLANNED (v1.1 May)

**What it is:** Signal ingestion surface for webhooks, GitHub Actions triggers, and CLI signals with metadata. Turns external events into routable Garura signals.

**When It Matters:** L4 requires a durable signal substrate. Without an event bus, plays can only be invoked by users; with one, external events (merge, alert, schedule) can trigger plays autonomously under policy control.

**Depth Spectrum:** Basic — manual CLI triggers. Standard — webhook endpoint. Advanced — signal schema + routing (planned). Enterprise — durability, replay, dead-letter.

**Signals:**
- Product idea references "webhook triggers", "event-driven workflows", or "CI/CD integration"
- Project profile declares `roadmap_horizon >= L4`
- User statements describe wanting automation on merge, alert, or schedule without manual invocation

**Tradeoffs:**
- Durable queue + replay vs fire-and-forget: no lost signals wins but adds operational surface (queue health, dead-letter handling)
- Idempotency key per signal vs best-effort dedup: no duplicate plays wins but every producer must supply a stable key
- Schema-first signal surface vs loose payloads: routable wins but every new event type requires a schema extension

### Inclusion
- Default: **optional** until L4 target
- Mandatory when: `delivery_ambition.roadmap_horizon >= 'L4'`
- Conditional: never
- Exclude when: L1-L3 only projects

### Success Criteria
- Webhook endpoint accepts ≥ 3 event types at launch (push, PR, issue)
- Signal schema round-trips with zero loss
- Signal delivery latency p95 < 5s

### Failure Scenarios
- Scenario: Duplicate signals trigger duplicate plays
  - Impact: Redundant agent runs, budget waste
  - Mitigation: idempotency key on every signal
- Scenario: Signal lost in transit
  - Impact: Play never invoked; missed automation
  - Mitigation: durable queue + replay

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0 (planned)
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F017: Signal Plays

**Status:** PLANNED (v1.1 May)

**What it is:** Plays invoked by signals rather than by user — same play contract but triggered from the event bus with a derived intent payload.

**When It Matters:** Signal plays turn event streams into automated methodology actions (PR merged → distill; alert fired → report-issue). Without them, the framework is strictly interactive.

**Depth Spectrum:** Basic — manual plays only. Standard — one webhook path per play. Advanced — signal-to-intent derivation with play selector. Enterprise — signal orchestration with SLA guarantees.

**Signals:**
- Product idea references "automated workflows on events" or "no-human-in-loop routine methodology actions"
- User statements describe wanting merge→distill or alert→report-issue automation
- Project profile targets L4 with evidence handoff from user-invoked to signal-invoked plays

**Tradeoffs:**
- Same play contract regardless of trigger vs trigger-specific variants: consistency of evidence wins but signal-derived intents must pass the same schema as user-authored
- Signal→play determinism vs flexibility: hardcoded mapping is predictable but brittle; flexible routing is powerful but requires AM-F018
- Autonomous execution vs approval gate on every signal-invoked play: speed vs safety — needs AM-F019 policy routing to balance

### Inclusion
- Default: **optional** until L4
- Mandatory when: `roadmap_horizon >= 'L4'`
- Conditional: never
- Exclude when: L1-L3 only

### Success Criteria
- ≥ 5 plays support signal invocation at launch
- Signal→play mapping deterministic for ≥ 90% of signal types
- Signal-invoked plays emit same evidence as user-invoked

### Failure Scenarios
- Scenario: Signal-invoked play produces different output than user-invoked
  - Impact: Consistency broken; evidence diverges
  - Mitigation: single play contract regardless of trigger
- Scenario: Signal intent mismatches real user intent
  - Impact: Wrong play runs on real event
  - Mitigation: policy-gated approval before execution

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F018: Autonomous Triggers

**Status:** PLANNED (v1.2 Jul)

**What it is:** Play-selector agent that chooses the right play from context + signal. Bridge between raw signal and correct play invocation.

**When It Matters:** A single signal (e.g., "PR merged") might map to distill, capture-learning, or both depending on PR content. Autonomous triggers route correctly based on context rather than hard-coded signal→play maps.

**Depth Spectrum:** Basic — hard-coded mapping. Standard — rule-based router. Advanced — context-aware selector (planned). Enterprise — learned routing with feedback.

**Signals:**
- Product idea references "context-aware routing" or "right play for the situation"
- User statements describe hard-coded signal maps becoming unmaintainable
- Project has enough signal volume and play diversity that rule-based routing breaks down

**Tradeoffs:**
- Context-aware selector vs hard-coded mapping: right play for the context wins but adds an agent reasoning hop with its own failure modes
- Learned routing (Enterprise) vs deterministic rules: adapts over time but becomes harder to audit why a specific play was chosen
- Selector autonomy vs approval gate: speed wins but selector mistakes are high-blast-radius — AM-F019 gating is mandatory

### Inclusion
- Default: **optional** until L4
- Mandatory when: `roadmap_horizon >= 'L4'`
- Conditional: never
- Exclude when: L1-L3 only

### Success Criteria
- Selector accuracy ≥ 80% on pilot signal corpus
- Selector decisions produce evidence artifacts
- Cross-play sequencing succeeds on ≥ 90% of multi-play chains

### Failure Scenarios
- Scenario: Selector picks wrong play
  - Impact: Incorrect automation on real event
  - Mitigation: approval gate before autonomous execution
- Scenario: Selector loops on ambiguous signal
  - Impact: Budget waste
  - Mitigation: loop-detection + escalation

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F019: Approval Gates

**Status:** PLANNED (v1.1 May)

**What it is:** Tether/Vanish primitive (AM-F008) is the substrate; signal-driven approval gating over autonomous actions — policy-driven routing, quorum for high-risk — is not shipped.

**When It Matters:** Autonomous execution without approval gates is reckless; approval gates without policy are unscalable. L4 requires policy-driven approval routing so the right human is asked at the right moment.

**Depth Spectrum:** Basic — every autonomous action requires Tether. Standard — policy-configurable gates. Advanced — quorum for high-risk actions. Enterprise — approval audit + signed attestation.

**Signals:**
- Product idea references "policy-driven approvals", "quorum on high-risk actions", or "routing the right approver"
- Project profile shows regulated environment, protected branches, or tiered approval hierarchy
- User statements describe approval fatigue or wrong-approver bottlenecks

**Tradeoffs:**
- Policy-configurable gates vs Tether-everything: right human at right moment wins but a misconfigured policy is worse than universal gating
- Quorum for high-risk vs single-approver: safer on irreversible actions but slows the pipeline and can deadlock when approvers are unavailable
- Fail-safe default (deny) vs fail-open (allow): safety wins but false-deny blocks routine automation until the policy catches up

### Inclusion
- Default: **mandatory** at L4+
- Mandatory when: any autonomous execution
- Conditional: never
- Exclude when: L1-L3 only

### Success Criteria
- 100% of autonomous destructive actions have approval before execution
- Policy match accuracy ≥ 95%
- Approval decisions produce audit evidence

### Failure Scenarios
- Scenario: Autonomous action bypasses approval
  - Impact: Unauthorized destructive change
  - Mitigation: compile-time check in signal play contract
- Scenario: Approval policy misconfigured and no gate fires
  - Impact: Runaway automation
  - Mitigation: fail-safe default policy

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0 (Tether/Vanish primitive LIVE, signal-gating PLANNED)
- Scenarios observed: none for signal-gating
- Common mistakes: n/a
- Last promoted: never

---

## Capability: L5 Goal-Driven

**Status:** PLANNED (post-v1)

**Rollup notes:** L5 is aspirational. No goal decomposition, self-correction loops, or autonomous completion verification shipped.

**gap_items rollup:** Goal schema; decomposition engine; self-recovery; outcome verification.

### AM-F020: Goal Decomposition

**Status:** PLANNED (post-v1)

**What it is:** Break a high-level goal (OKR, SLO, business objective) into candidate intents, rank them, and propose the intent that best advances the goal under constraint.

**When It Matters:** L5 takes business objectives as primary inputs rather than requiring humans to decompose goals into intents. Without goal decomposition, the ladder stops at L4.

**Depth Spectrum:** Basic — humans decompose. Standard — goal schema + candidate listing. Advanced — ranked candidates with constraint check. Enterprise — multi-goal tradeoff reasoning.

**Signals:**
- Product idea references "OKR-driven development", "business-objective-first", or "goal to plan automation"
- Project profile targets L5 with business-objective ingestion
- User statements describe wanting to say "improve retention by X" rather than hand-writing a plan

**Tradeoffs:**
- Auto-decomposition vs human framing: removes the hardest human step but any ranking error propagates down the whole plan
- Deterministic ranking rule vs learned ranking: auditable wins but may miss opportunities a learned ranker would catch
- Constraint check during decomposition vs post-hoc filter: fewer infeasible candidates wins but slows the decomposition step

### Inclusion
- Default: **optional** until L5
- Mandatory when: `roadmap_horizon == 'L5'`
- Conditional: never
- Exclude when: L1-L4

### Success Criteria
- Goal schema round-trips
- Decomposition produces ≥ 3 candidate intents per goal
- Candidate ranking justifiable in evidence

### Failure Scenarios
- Scenario: Decomposition produces candidates that violate project constraints
  - Impact: Wasted cycles considering infeasible intents
  - Mitigation: constraint check during decomposition
- Scenario: Ranking is non-deterministic
  - Impact: Same goal yields different plans
  - Mitigation: deterministic ranking rule

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F021: Self-Correction

**Status:** PLANNED (post-v1)

**What it is:** Cross-play self-recovery loops on failed steps. Each agent has local recovery today (per-agent Recovery sections); cross-play re-planning on repeated failure is not shipped.

**When It Matters:** At L5 the framework must handle failure without human intervention for routine cases. Self-correction turns a failed step into a re-plan rather than a human interrupt.

**Depth Spectrum:** Basic — agent-local recovery. Standard — play-level retry. Advanced — cross-play re-plan. Enterprise — failure-corpus-driven recovery.

**Signals:**
- Product idea references "autonomous recovery" or "self-healing workflows"
- User statements describe repeated-failure escalations that could be handled without a human
- Project targets L5 with long-running autonomous runs where human interrupts are impractical

**Tradeoffs:**
- Autonomous re-plan vs escalate-to-human: routine failure recovery wins but masks real problems if the retry threshold is wrong
- Failure-corpus-driven recovery (Enterprise) vs fixed recovery rules: adapts over time but depends on accumulated failure data
- Bounded retries vs unbounded optimism: budget safety wins but a too-low bound kicks out recoverable failures

### Inclusion
- Default: **optional** until L5
- Mandatory when: `roadmap_horizon == 'L5'`
- Conditional: never
- Exclude when: L1-L4

### Success Criteria
- Self-correction resolves ≥ 60% of repeated failures without human intervention
- Every self-correction produces audit evidence
- Failure-corpus aggregates across projects

### Failure Scenarios
- Scenario: Self-correction loops indefinitely
  - Impact: Budget waste
  - Mitigation: bounded retries + escalation
- Scenario: Self-correction masks a real problem
  - Impact: Root cause never surfaced
  - Mitigation: repeated-failure threshold triggers RCA

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F022: Autonomous Completion

**Status:** PLANNED (post-v1)

**What it is:** Multi-week agent autonomy with persistent goal context — the framework drives a goal to completion over long horizons with budget and safety bounds.

**When It Matters:** L5 implies the framework can own a goal across weeks, not just a session. Without autonomous completion, L5 is just L4 with better prompts.

**Depth Spectrum:** Basic — session-scoped autonomy. Standard — day-scoped. Advanced — week-scoped with checkpoint. Enterprise — quarter-scoped with budget governance.

**Signals:**
- Product idea references "multi-week autonomy", "long-horizon goal ownership", or "agent that runs for weeks"
- Project targets L5 with quarterly or multi-sprint goal horizons
- User statements describe losing autonomous progress when sessions end

**Tradeoffs:**
- Long-horizon autonomy vs session-scoped: ownership of real work wins but budget exposure and drift risk grow with horizon
- Budget tripwire + auto-pause vs unbounded runs: safety wins but can pause runs right before the finish line
- Persistent goal context substrate vs stateless re-entry: 100% fidelity wins but needs a new LTM layer to carry goal state across sessions

### Inclusion
- Default: **optional** until L5
- Mandatory when: `roadmap_horizon == 'L5'`
- Conditional: never
- Exclude when: L1-L4

### Success Criteria
- Long-running goal context preserved across sessions with 100% fidelity
- Budget adherence: spend < configured budget in ≥ 95% of runs
- Safety bounds never violated

### Failure Scenarios
- Scenario: Context lost between sessions mid-goal
  - Impact: Autonomous run restarts or goes off-goal
  - Mitigation: goal-context persistence substrate (new LTM layer)
- Scenario: Budget exhausted without goal progress
  - Impact: Runaway cost
  - Mitigation: budget tripwire + auto-pause

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AM-F023: Outcome Verification

**Status:** PLANNED (post-v1)

**What it is:** Verify that an autonomous execution actually advanced the goal — goal-outcome measurement and goal-drift detection.

**When It Matters:** Without outcome verification, "autonomous completion" is unfalsifiable — the agent claims success with no check. Outcome verification closes the L5 loop.

**Depth Spectrum:** Basic — human inspection. Standard — scripted outcome checks. Advanced — goal-specific verifier skills. Enterprise — outcome drift detection across goal history.

**Signals:**
- Product idea references "outcome measurement", "goal verification", or "did autonomy actually work"
- Project targets L5 and needs a falsifiable success claim on autonomous runs
- User statements distrust agent self-reported completion without independent verification

**Tradeoffs:**
- Multi-signal verification (metrics + tests + user sign-off) vs single-signal: avoids false success but slows the close-out step
- Scripted outcome checks vs learned verifiers: auditable wins but must be written per goal type — high upfront authoring cost
- Periodic goal reconfirmation vs set-and-forget: catches goal drift but interrupts long-horizon runs

### Inclusion
- Default: **optional** until L5
- Mandatory when: `roadmap_horizon == 'L5'`
- Conditional: never
- Exclude when: L1-L4

### Success Criteria
- Outcome verifier agrees with human judgment on ≥ 90% of completed goals
- Drift between declared and measured outcome surfaces within 24 hours
- Every outcome verification produces evidence

### Failure Scenarios
- Scenario: Verifier declares success on a goal that regressed
  - Impact: False confidence; downstream goals build on a broken base
  - Mitigation: multi-signal verification (metrics + tests + user sign-off)
- Scenario: Goal drift undetected
  - Impact: Autonomous run continues pursuing a stale goal
  - Mitigation: periodic goal reconfirmation

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never
