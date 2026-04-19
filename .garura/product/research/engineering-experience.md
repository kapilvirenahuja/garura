<!-- Provenance
origin: stm_research
editable: true
created_at: 2026-04-18T00:02:00Z
updated_at: 2026-04-18T00:30:00Z
researcher: product-keeper (Stage 2 specify-product — 3-tier restructure)
research_basis: .garura/product/specification/market-brief.md + project-profile.yaml + sync-claude + sync-droids + briefs + design-exp pipeline
research_notes: |
  Restructure to 5 capabilities × 21 features. CLI/slash commands is LIVE end-to-end;
  IDE integrations anchored by Claude Code LIVE with Copilot/Cursor/Codex PLANNED;
  engineering-portal, first-run-onboarding, and design-to-code are PARTIAL/PLANNED.
-->

# Engineering Experience

The role-aware surfaces every adopter segment touches — IDE integrations, Engineering Portal, AI chat, project creation + onboarding, CLI / slash commands, design-to-code. Garura's multi-role audience pillar (designers, PMs, engineers, leads, compliance officers, solo founders) — addresses market brief Gap #5 (no platform serves the solo-founder → squad → enterprise progression) and satisfies project_profile's progressive-feature-expansion segmentation model.

**Search patterns:** engineering experience, developer experience, IDE integration, engineering portal, role-aware UX, CLI, slash commands, first-run onboarding, design-to-code, Figma

---

## Capability: IDE Integrations

**Status:** PARTIAL

**Rollup notes:** Claude Code is the anchor integration and LIVE. Copilot, Cursor, Factory.ai, and Codex CLI are PLANNED or in early scaffolding (Factory PARTIAL via sync-droids).

**gap_items rollup:** Copilot/Cursor/Codex extension scaffolds, common-invocation-contract parity tests, state-consistency tests, governance-aware invocation.

### EE-F001: Claude Code

**Status:** LIVE

**What it is:** Every play and agent runs inside Claude Code today; sync-claude skill deploys components to ~/.claude/.

**When It Matters:** Claude Code is the reference integration — it's where Garura is developed and dogfooded. Every capability ships here first.

**Depth Spectrum:** Basic — manual copy of components. Standard — sync-claude deployment (current). Advanced — update/upgrade flow. Enterprise — multi-tenant Claude Code with governance.

**Signals:**
- Product idea names Claude Code as the primary or reference harness
- Project profile declares Anthropic Claude Code as the contributor IDE
- User statements describe dogfooding Garura inside Claude Code daily

**Tradeoffs:**
- Claude-Code-first vs multi-harness parity from day one: depth on one surface wins but every other adapter must chase parity later
- sync-claude deployment vs in-place manual edits: drift-free deployment wins but ~/.claude/ becomes read-only in practice
- Reference-integration status vs equal treatment: Claude Code ships capabilities first, which accelerates validation but risks Claude-only assumptions leaking into shared contracts

### Inclusion
- Default: **mandatory**
- Mandatory when: Garura is the product
- Conditional: never
- Exclude when: never

### Success Criteria
- sync-claude completes with zero drift on 100% of runs
- Every new component available in Claude Code after sync
- User-level install documented

### Failure Scenarios
- Scenario: Component drifts between repo and ~/.claude/
  - Impact: Stale behavior
  - Mitigation: /sync-claude pre-flight check
- Scenario: Sync overwrites local edits
  - Impact: Lost work
  - Mitigation: local-edit detection + warn

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every Garura contributor uses daily
- Scenarios observed: daily
- Common mistakes: editing ~/.claude/ directly
- Last promoted: LIVE

---

### EE-F002: Copilot

**Status:** PLANNED (v1.1 May)

**What it is:** GitHub Copilot adapter not shipped; squad milestone target.

**When It Matters:** Copilot is the largest installed base of AI coding tools. A Copilot adapter unlocks Garura for teams already on Copilot.

**Depth Spectrum:** Basic — no adapter. Standard — extension scaffold. Advanced — parity tests. Enterprise — governance-aware.

**Signals:**
- Product idea mentions reaching the Copilot installed base or enterprise GitHub customers
- User statements describe teams already standardized on Copilot who cannot switch IDE
- Market brief names Copilot parity as a prerequisite for squad or enterprise adoption

**Tradeoffs:**
- Copilot adapter vs Claude-Code-only: reach wins but every play must survive a second harness with different invocation semantics
- Extension scaffold vs full governance-aware adapter: shipping early wins but enterprise users demand governance before trusting the adapter
- Parity tests vs per-harness variants: single contract wins but adapting Garura's evidence model to Copilot's runtime is genuinely harder than Claude Code

### Inclusion
- Default: **optional**
- Mandatory when: user declares Copilot as primary IDE
- Conditional: never
- Exclude when: Copilot not in use

### Success Criteria
- Extension scaffold shipped
- Parity tests pass on core plays
- Telemetry parity with Claude Code adapter

### Failure Scenarios
- Scenario: Copilot API changes break adapter
  - Impact: Regressions
  - Mitigation: adapter-version pinning
- Scenario: State divergence vs Claude Code
  - Impact: Inconsistent behavior
  - Mitigation: state consistency tests

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F003: Cursor

**Status:** PLANNED (v1.1 May)

**What it is:** Cursor adapter not shipped.

**When It Matters:** Cursor has the fastest-growing mindshare among AI-native developers. Adapter presence is table stakes for that cohort.

**Depth Spectrum:** Basic — none. Standard — scaffold. Advanced — parity. Enterprise — governance.

**Signals:**
- Product idea targets AI-native developer cohorts who've moved off VSCode
- User statements describe wanting Garura inside Cursor
- Project profile lists Cursor in the IDE distribution for target audience

**Tradeoffs:**
- Cursor adapter vs Copilot adapter priority: AI-native cohort wins mindshare but Copilot wins volume — can't ship both at once
- Common invocation contract vs Cursor-native affordances: reuse wins but may hide Cursor-specific capabilities users expect
- Shipping a scaffold early vs waiting for governance: momentum wins but creates support load on an incomplete surface

### Inclusion
- Default: **optional**
- Mandatory when: user declares Cursor as primary IDE
- Conditional: never
- Exclude when: Cursor not in use

### Success Criteria
- Extension scaffold shipped
- Parity tests pass
- State consistency with Claude Code

### Failure Scenarios
- Scenario: Cursor API changes
  - Impact: Broken adapter
  - Mitigation: version pinning
- Scenario: Inconsistent state across adapters
  - Impact: Different outputs same intent
  - Mitigation: common contract tests

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F004: Factory.ai

**Status:** PARTIAL

**What it is:** sync-droids skill exists for Factory Droid integration. Full IDE-adapter surface not yet at parity with Claude Code.

**When It Matters:** Factory represents the autonomous-agent cohort. Parity support extends Garura governance to autonomous Droid runs.

**Depth Spectrum:** Basic — no integration. Standard — sync (current). Advanced — parity. Enterprise — governance-aware invocation.

**Signals:**
- Product idea references autonomous-agent or Droid-class execution surfaces
- User statements mention Factory Droids already running in the org
- Project profile targets governance over autonomous agent runs, not just interactive IDEs

**Tradeoffs:**
- Parity with Claude Code vs Droid-native autonomy semantics: unified contract wins but Droids run without a human-in-loop by design — Tether/Vanish has to translate
- sync-droids mirror vs independent adapter: reuse wins today but will fight Droid-specific governance requirements later
- Governance-aware invocation vs speed of autonomous runs: audit wins but every policy check adds latency the Droid cohort is sensitive to

### Inclusion
- Default: **optional**
- Mandatory when: org uses Factory Droids
- Conditional: never
- Exclude when: never

### Success Criteria
- sync-droids completes reliably
- Parity tests pass on core plays
- Governance signals flow back

### Failure Scenarios
- Scenario: Droid API changes
  - Impact: Broken sync
  - Mitigation: version pinning
- Scenario: Governance data missing from Droid runs
  - Impact: Attribution gap
  - Mitigation: invocation-context capture

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: sync-droids used
- Scenarios observed: occasional
- Common mistakes: n/a
- Last promoted: PARTIAL

---

### EE-F005: Codex CLI

**Status:** PLANNED (v1.2 Jul)

**What it is:** Codex-style CLI adapter not shipped.

**When It Matters:** Codex CLI represents script-friendly automation. Adapter presence extends Garura to headless/CI contexts.

**Depth Spectrum:** Basic — none. Standard — CLI adapter. Advanced — script-friendly contract. Enterprise — CI-grade reliability.

**Signals:**
- Product idea references CI/CD pipelines, headless automation, or scripted engineering flows
- User statements describe wanting to run plays from GitHub Actions or shell scripts
- Project profile shows CI-driven delivery ambition at L4+ where signal-triggered plays require headless invocation

**Tradeoffs:**
- Script-friendly output vs human-readable output: machine parseability wins for CI but degrades interactive UX — must support both modes
- Non-interactive CI mode vs approval gates: determinism wins in CI but mandatory Tether/Vanish gates at L3+ must translate to policy pre-approvals
- Codex CLI parity vs bespoke garura-cli: reuse wins but tying to Codex's release cadence is a risk if Codex shifts direction

### Inclusion
- Default: **optional**
- Mandatory when: CI-driven workflow
- Conditional: never
- Exclude when: interactive-only

### Success Criteria
- CLI adapter shipped
- Script-friendly output format
- CI-mode behavior deterministic

### Failure Scenarios
- Scenario: CLI output changes break scripts
  - Impact: User pipelines broken
  - Mitigation: output stability contract
- Scenario: Interactive prompts block CI
  - Impact: CI hangs
  - Mitigation: non-interactive mode

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Engineering Portal

**Status:** PARTIAL

**Rollup notes:** briefs skill renders product YAML to JSON + HTML hub. Role-aware dashboards, project browser, chat surface, and decision-trail briefs are not fully shipped.

**gap_items rollup:** Role model, per-role default dashboards, project index, cross-project filters, chat backend, decision search within briefs.

### EE-F006: Role-Aware Dashboards

**Status:** PLANNED (v1.1 May)

**What it is:** No role selector, no role-scoped dashboards. Planned.

**When It Matters:** Role-aware dashboards make the same underlying data usable for PMs, engineers, leads, and compliance officers without each role needing a separate tool.

**Depth Spectrum:** Basic — single dashboard. Standard — role selector. Advanced — per-role default. Enterprise — role + attribute-based views.

**Signals:**
- Project profile `audience.primary_roles` lists more than two distinct roles
- Product idea references "PM view", "compliance view", or role-specific dashboards
- User statements describe current tools forcing every role to use the same page and missing their context

**Tradeoffs:**
- Role-based views vs single-pane truth: tailored surfaces win adoption but multiply the artifacts a UX change must update
- Role model granularity: coarse roles are maintainable but miss attribute dimensions; fine-grained roles explode into permutations
- Per-role defaults vs universal layout: less cognitive load wins but new hires outside the defined roles hit a dead-end

### Inclusion
- Default: **optional** at L2
- Mandatory when: multi-role audience
- Conditional: never
- Exclude when: single-role

### Success Criteria
- Role model defined
- ≥ 4 roles with default dashboard
- Dashboard switches by role

### Failure Scenarios
- Scenario: Role model too coarse
  - Impact: Users see wrong data
  - Mitigation: attribute extension
- Scenario: Dashboard slow to load
  - Impact: Abandoned
  - Mitigation: caching

### Cross-Tree Refs
- (none yet — future CTC: `len(audience.primary_roles) > 2 IMPLIES EE-F006`)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F007: Project Browser

**Status:** PLANNED (v1.1 May)

**What it is:** Multi-project navigation surface not shipped.

**When It Matters:** At portfolio scale, switching between projects is a daily workflow. A browser makes that fluid.

**Depth Spectrum:** Basic — manual navigation. Standard — project index. Advanced — cross-project filters. Enterprise — hierarchical project structure.

**Signals:**
- Project profile shows multi-project or portfolio-scale context
- User statements describe daily switching between projects or losing track of which project is where
- Product idea targets squad-to-enterprise progression with shared visibility

**Tradeoffs:**
- Project index auto-refresh vs manual refresh: freshness wins but sync cost scales with project count
- Cross-project filters vs per-project deep dive: portfolio view wins but loses project-specific affordances
- Hierarchical structure vs flat list: scales to enterprise portfolios but forces every solo-founder project through unnecessary nesting

### Inclusion
- Default: **optional**
- Mandatory when: ≥ 2 projects
- Conditional: never
- Exclude when: single project

### Success Criteria
- Project index surfaces all known projects
- Cross-project filters work
- Navigation latency < 500ms

### Failure Scenarios
- Scenario: Project index stale
  - Impact: Missing projects
  - Mitigation: auto-refresh on sync
- Scenario: Filter performance poor
  - Impact: Slow UX
  - Mitigation: indexed filters

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F008: Chat

**Status:** PLANNED (v1.2 Jul)

**What it is:** Role-aware AI chat grounded in project memory not shipped.

**When It Matters:** Chat is the universal AI surface. Role-aware chat grounded in project LTM/KB turns it into a methodology assistant rather than a generic chatbot.

**Depth Spectrum:** Basic — generic chat. Standard — role-aware prompt. Advanced — memory-grounded. Enterprise — persistent session memory.

**Signals:**
- Product idea references "methodology assistant", "ask questions about the project", or grounded chat UX
- Project profile targets multi-role portal with low-friction ask-anything surface
- User statements describe needing to re-brief assistants every session or getting generic answers to project-specific questions

**Tradeoffs:**
- Memory-grounded answers vs generic chat speed: trustworthy responses win but every query pays a retrieval cost
- Role-scoped memory query vs unified corpus: prevents leakage across roles but forces every piece of LTM to carry a role tag
- Persistent session memory vs ephemeral chat: continuity wins but raises access-control surface area (a role switch must not inherit prior session context)

### Inclusion
- Default: **optional**
- Mandatory when: multi-role portal
- Conditional: never
- Exclude when: CLI-only

### Success Criteria
- Chat grounded in project memory
- Role-aware response tone + scope
- Persistent session memory

### Failure Scenarios
- Scenario: Chat hallucinates about project
  - Impact: Misinformation
  - Mitigation: memory-grounding required
- Scenario: Persistent memory leaks across roles
  - Impact: Access violation
  - Mitigation: role-scoped memory query

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F009: Decision-Trail Briefs

**Status:** PARTIAL

**What it is:** briefs skill produces hub.html aggregating product YAML. Decision-search and historical-trail navigation inside briefs is not shipped.

**When It Matters:** Decision-trail briefs are how an auditor or new hire understands "how did we get here?". Aggregation shipped; search + timeline not.

**Depth Spectrum:** Basic — raw artifacts. Standard — aggregated briefs (current). Advanced — decision search. Enterprise — timeline view + replay.

**Signals:**
- Project profile targets L3+ delivery ambition with compliance or audit requirements
- User statements describe new hires needing the "why" behind decisions or auditors asking for historical rationale
- Product idea references "decision trail", "historical record", or "how did we get here" retrieval

**Tradeoffs:**
- Auto-regenerate on YAML change vs manual regeneration: freshness wins but every YAML edit pays brief-rebuild cost
- Decision search ranking: context-aware ranking surfaces the right decision but tunes per-project; generic ranking is portable but noisy
- Timeline + replay (Enterprise) vs static aggregation: full traceability wins but storage and navigation cost grow with project age

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: compliance audit
- Conditional: never
- Exclude when: throwaway projects

### Success Criteria
- Briefs aggregate all product YAMLs
- Decision search finds relevant decisions
- Timeline view navigable

### Failure Scenarios
- Scenario: Briefs lag behind YAML changes
  - Impact: Stale briefs
  - Mitigation: auto-regenerate
- Scenario: Decision search noisy
  - Impact: Not useful
  - Mitigation: context-aware ranking

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: briefs used for this product
- Scenarios observed: hub.html generated
- Common mistakes: ignoring brief regeneration
- Last promoted: PARTIAL

---

## Capability: First-Run Onboarding

**Status:** PARTIAL

**Rollup notes:** start-feature bootstraps a work context. No interactive wizard, no multi-IDE installers, no bootcamp tutorial or demo projects. sync-claude handles contributor setup partially.

**gap_items rollup:** Greenfield wizard flow, brownfield repo scanner, package publication, end-user installer bundle, bootcamp content, demo project scaffolds.

### EE-F010: Wizard

**Status:** PLANNED (v1 Apr)

**What it is:** Three-question greenfield wizard not shipped; brownfield scanner planned later.

**When It Matters:** The first minute of onboarding determines whether a solo founder adopts Garura or abandons it. A wizard turns a cold start into a guided experience.

**Depth Spectrum:** Basic — README. Standard — three-question wizard. Advanced — wizard + brownfield scan. Enterprise — multi-profile wizard.

**Signals:**
- Product idea names solo-founder or indie-developer segment as a v1 target
- Project profile declares solo-founder audience and v1 onboarding as a critical success path
- User statements describe abandonment risk on cold start or "I don't know where to begin"

**Tradeoffs:**
- Three-question minimum vs richer profile capture: survival wins on cold start but downstream artifacts must tolerate sparse initial profile
- Greenfield wizard vs brownfield scanner: greenfield ships first but leaves brownfield users stuck; brownfield is technically harder to detect structure
- Guided default vs user review gate: friction reduction wins but wrong auto-profile on brownfield is worse than asking

### Inclusion
- Default: **mandatory**
- Mandatory when: v1 solo founder target
- Conditional: never
- Exclude when: never

### Success Criteria
- Greenfield wizard completes in < 3 minutes
- Brownfield scanner detects ≥ 80% of existing structure
- Wizard produces valid project_profile

### Failure Scenarios
- Scenario: Wizard asks too many questions
  - Impact: Abandonment
  - Mitigation: 3-question minimum
- Scenario: Brownfield scan misses critical structure
  - Impact: Incorrect profile
  - Mitigation: user review gate

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F011: npm Installer

**Status:** PLANNED (v1 Apr)

**What it is:** `npm install garura` distribution not shipped.

**When It Matters:** npm is the default distribution channel for the JS ecosystem; absence is a friction point for a solo founder evaluating Garura.

**Depth Spectrum:** Basic — manual clone. Standard — npm publish. Advanced — preflight checks. Enterprise — versioned channels.

**Signals:**
- Product idea targets JS/TS ecosystem developers where npm is the default expectation
- User statements describe "manual clone" friction or wanting one-line install
- Project profile lists public distribution as a v1 requirement

**Tradeoffs:**
- Monolithic package vs optional modules: single install wins simplicity but inflates size; modular install is smaller but fragments the first-run experience
- Exhaustive preflight vs minimal install: runtime surprises prevented but longer install time; thin preflight is fast but pushes failures to runtime
- Versioned channels (Enterprise) vs latest-only: upgrade control wins for teams but operational overhead grows with channel count

### Inclusion
- Default: **mandatory**
- Mandatory when: public distribution
- Conditional: never
- Exclude when: never

### Success Criteria
- `npm install garura` succeeds on supported Node versions
- Preflight detects missing prerequisites
- Upgrade flow documented

### Failure Scenarios
- Scenario: Package too large
  - Impact: Slow install
  - Mitigation: optional modules
- Scenario: Preflight misses critical dep
  - Impact: Install succeeds but fails at runtime
  - Mitigation: exhaustive preflight

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F012: Claude Code Installer

**Status:** PARTIAL

**What it is:** sync-claude skill deploys components to ~/.claude/ for contributors. End-user Claude Code installer experience (one-command bootstrap) is not packaged.

**When It Matters:** End-user installer is the difference between "check out the repo" and "run one command". The contributor flow works; end-user flow doesn't.

**Depth Spectrum:** Basic — manual. Standard — sync-claude (current contributor). Advanced — one-command bootstrap (planned). Enterprise — managed installer with update.

**Signals:**
- Product idea targets Claude Code as the primary end-user harness
- User statements draw the distinction between "check out the repo" (contributor) and "install Garura" (end user)
- Project profile lists one-command bootstrap as a v1 KPI

**Tradeoffs:**
- One-command bootstrap vs contributor-only sync-claude: adoption wins but every install path multiplies failure modes to support
- Conflict detection vs silent overwrite: user-data safety wins but every conflict interrupts install and demands a resolution UX
- Atomic install vs partial-success resume: guaranteed-clean state wins but atomic installs can't recover gracefully from network blips mid-install

### Inclusion
- Default: **mandatory**
- Mandatory when: Claude Code is target IDE
- Conditional: never
- Exclude when: other IDE primary

### Success Criteria
- One-command bootstrap from npm
- Sync-claude idempotent
- Upgrade flow preserves user data

### Failure Scenarios
- Scenario: Install overwrites user components
  - Impact: Lost work
  - Mitigation: conflict detection
- Scenario: Install partially succeeds
  - Impact: Broken state
  - Mitigation: atomic install

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: sync-claude used in this repo
- Scenarios observed: daily contributor sync
- Common mistakes: editing ~/.claude/ directly
- Last promoted: PARTIAL

---

### EE-F013: Bootcamp

**Status:** PLANNED (v1.1 May)

**What it is:** Guided bootcamp tutorial walking a new user through methodology ladder not shipped.

**When It Matters:** The methodology ladder is conceptually dense. A bootcamp turns reading into doing.

**Depth Spectrum:** Basic — README. Standard — video. Advanced — interactive bootcamp. Enterprise — cohort-based bootcamp with progress.

**Signals:**
- Product idea targets broader adoption beyond the early DIY cohort
- User statements describe the methodology ladder as conceptually dense or "too much to read"
- Project profile targets training cycles or cohort-based rollout

**Tradeoffs:**
- Interactive bootcamp vs video: engagement and retention win but interactive content is expensive to author and maintain
- < 60 minute target vs comprehensive coverage: completion rate wins but tradeoffs which L2 concepts get cut
- Regenerate on major release vs one-time authoring: drift-free bootcamp wins but every major release pays the regeneration cost

### Inclusion
- Default: **optional**
- Mandatory when: broader adoption target
- Conditional: never
- Exclude when: DIY users

### Success Criteria
- Bootcamp covers L2 end-to-end
- Progress tracked per user
- Completion rate ≥ 50%

### Failure Scenarios
- Scenario: Bootcamp too long
  - Impact: Abandonment
  - Mitigation: < 60 min target
- Scenario: Bootcamp drifts from actual product
  - Impact: Confused users
  - Mitigation: bootcamp regeneration on major release

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F014: Demos

**Status:** PLANNED (v1.1 May)

**What it is:** Three demo projects (solo SaaS, small-squad, enterprise pilot) not shipped.

**When It Matters:** Demos let prospects see Garura working in their own context before committing. The progressive-expansion story needs one demo per segment.

**Depth Spectrum:** Basic — screenshots. Standard — one demo. Advanced — three-segment demos. Enterprise — custom demo generator.

**Signals:**
- Product idea references the progressive-expansion story (solo → squad → enterprise)
- User statements describe wanting to see Garura running in a context like theirs before trying it
- Project profile targets sales/marketing or prospect-facing channels

**Tradeoffs:**
- Segment-targeted demos vs one generic demo: conversion wins but triples maintenance surface
- Demo-to-real-project migration path vs pure showcase: bridges the evaluation gap but forces demos to use real architecture, not shortcuts
- Demo in CI vs manual demo refresh: always-current demos win but CI cost grows with demo count and release cadence

### Inclusion
- Default: **optional**
- Mandatory when: sales/marketing
- Conditional: never
- Exclude when: OSS-only

### Success Criteria
- Three demos available
- Demos current with latest release
- Demo-to-real-project migration path

### Failure Scenarios
- Scenario: Demo broken on new release
  - Impact: First impression failure
  - Mitigation: demo in CI
- Scenario: Demo doesn't match user context
  - Impact: Low conversion
  - Mitigation: segment-targeted demos

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: CLI / Slash Commands

**Status:** LIVE

**Rollup notes:** Every play is user-invokable via slash command in Claude Code today. Status, sync, and distill are all LIVE. This is Garura's primary UX.

**gap_items rollup:** None — all features LIVE.

### EE-F015: Play Invocation

**Status:** LIVE

**What it is:** 21 plays exposed as slash commands (/specify-product, /start-feature, /ship, /create-play, /fix-it, /enhance, /create-pr, /review-pr, /merge-pr, /distill, /capture-learning, /report-issue, etc.).

**When It Matters:** Slash-command invocation is the primary user contract with Garura. Consistent, discoverable, composable.

**Depth Spectrum:** Basic — scripts. Standard — slash commands (current). Advanced — tab-complete with arg hints. Enterprise — governance-gated invocation.

**Signals:**
- Product idea names slash commands or consistent invocation surface as the user contract
- User statements describe wanting discoverable, composable commands over ad-hoc prompts
- Project profile shows Claude Code harness where slash commands are the native UX

**Tradeoffs:**
- Slash-command surface vs learned routing: explicit invocation wins audit and discoverability but asks users to memorize commands
- Command proliferation vs namespace policy: more plays covers more flows but risks collision and cognitive overload
- Governance-gated invocation (Enterprise) vs frictionless: policy wins for compliance but every gate adds latency on a common path

### Inclusion
- Default: **mandatory**
- Mandatory when: Garura
- Conditional: never
- Exclude when: never

### Success Criteria
- Every play has a slash command
- Slash commands discoverable
- Invocation latency < 1s

### Failure Scenarios
- Scenario: Command not discoverable
  - Impact: Hidden capability
  - Mitigation: /help listing
- Scenario: Command name collision
  - Impact: Ambiguity
  - Mitigation: namespace policy

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: daily
- Scenarios observed: every Garura action
- Common mistakes: forgetting the slash
- Last promoted: LIVE

---

### EE-F016: Status

**Status:** LIVE

**What it is:** Per-play status.json files at .garura/product/_status/ and per-issue status within STM.

**When It Matters:** Status is how users know whether a play succeeded, failed, or is in-flight.

**Depth Spectrum:** Basic — console output. Standard — status.json (current). Advanced — status dashboard. Enterprise — status telemetry aggregation.

**Signals:**
- Product idea references "know what happened" or auditable play outcomes
- User statements describe inability to tell whether a play succeeded, failed, or is in-flight
- Project profile requires programmatic consumption of run outcomes (CI, dashboard, telemetry)

**Tradeoffs:**
- status.json per play vs centralized status store: simple and local wins but aggregation across plays becomes a client problem
- Mandatory status write vs optional: parseability wins but every play pays the status-write cost even when outcome is trivial
- Schema validator vs lightweight conformance: downstream parsers stay safe but schema evolution triggers mass rewrites

### Inclusion
- Default: **mandatory**
- Mandatory when: any multi-step play
- Conditional: never
- Exclude when: never

### Success Criteria
- Every play produces status
- Status schema consistent
- Status survives session end

### Failure Scenarios
- Scenario: Status missing for a play
  - Impact: Users can't tell outcome
  - Mitigation: mandatory status write
- Scenario: Status schema drifts
  - Impact: Downstream parsing breaks
  - Mitigation: schema validator

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every play writes status
- Scenarios observed: daily
- Common mistakes: n/a
- Last promoted: LIVE

---

### EE-F017: Sync

**Status:** LIVE

**What it is:** sync-claude and sync-droids skills deploy components to target harnesses (Claude Code, Factory Droids).

**When It Matters:** Sync is how source-of-truth propagates. Without sync, components rot.

**Depth Spectrum:** Basic — manual copy. Standard — sync-claude (current). Advanced — sync with drift detection. Enterprise — sync with RBAC.

**Signals:**
- Product idea requires source-of-truth to propagate to one or more harnesses
- User statements describe component rot or stale deployed copies of skills/plays
- Project profile shows multi-harness distribution (Claude Code + Factory Droids)

**Tradeoffs:**
- Atomic sync vs partial-apply: consistent state wins but an atomic sync fails whole on any single error
- Customization detection vs full overwrite: preserves user work but adds conflict UX and can leave drift
- Drift detection on every sync vs periodic check: immediate feedback wins but every sync pays the scan cost

### Inclusion
- Default: **mandatory**
- Mandatory when: multi-harness deployment
- Conditional: never
- Exclude when: single harness

### Success Criteria
- Sync idempotent
- Drift detected and surfaced
- Sync < 10s

### Failure Scenarios
- Scenario: Sync overwrites user customization
  - Impact: Lost work
  - Mitigation: customization detection
- Scenario: Sync partial
  - Impact: Inconsistent state
  - Mitigation: atomic sync

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: daily
- Scenarios observed: every component update
- Common mistakes: editing deployed components instead of source
- Last promoted: LIVE

---

### EE-F018: Distill

**Status:** LIVE

**What it is:** distill play extracts post-merge learnings into Project LTM proposals.

**When It Matters:** Distill is the methodology's learning loop — it's how LTM grows from STM. Live today.

**Depth Spectrum:** Basic — manual notes. Standard — distill play (current). Advanced — auto-distill on merge. Enterprise — cross-project distill with promotion.

**Signals:**
- Project profile targets L3+ where post-merge learning extraction is required
- User statements describe losing learnings when issues close or forgetting why a decision was made
- Product idea references a "learning loop" or "LTM grows from STM" pattern

**Tradeoffs:**
- Proposal review gate vs auto-promotion: LTM stays clean but backlog grows when reviewers are slow
- Auto-distill on merge (Advanced) vs manual invocation: never-skip wins but merges that don't deserve distill pay the cost
- Cross-project distill (Enterprise) vs per-project: portfolio learning wins but risks leaking project-specific content into shared LTM

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: any L3+ project
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- distill runs post-merge
- Learnings produce LTM proposals
- Proposals reviewable

### Failure Scenarios
- Scenario: Distill skipped post-merge
  - Impact: Learning lost
  - Mitigation: distill reminder
- Scenario: Distill produces noise
  - Impact: LTM pollution
  - Mitigation: proposal review

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: distill used in this repo
- Scenarios observed: per-merge
- Common mistakes: skipping distill
- Last promoted: LIVE

---

## Capability: Design-to-Code

**Status:** PARTIAL

**Rollup notes:** design-exp pipeline (personas → screens → wireframes → design spec) is LIVE. Figma plugin integration, design tokens, and component generation from wireframes are PLANNED.

**gap_items rollup:** Figma plugin, bidirectional sync policy, token schema, Figma-code token sync, wireframe → code stub generator, design-decision → code traceability.

### EE-F019: Figma Integration

**Status:** PLANNED (v1.2 Jul)

**What it is:** Figma plugin and bidirectional sync not shipped.

**When It Matters:** Figma is where product decisions become visual. Bidirectional sync turns design into a first-class input to the methodology.

**Depth Spectrum:** Basic — screenshot import. Standard — plugin read. Advanced — bidirectional sync. Enterprise — Figma governance.

**Signals:**
- Project profile `audience.primary_roles` includes `designer`
- Product idea references Figma as the source of design truth or mentions design-to-code flow
- User statements describe design-code drift or manual screenshot-to-code translation

**Tradeoffs:**
- Bidirectional sync vs one-way (Figma→code): closes the design-code loop but demands a conflict-resolution UX on both sides
- Plugin integration vs file-export ingestion: realtime updates win but tie the feature to Figma plugin API stability
- Figma governance (Enterprise) vs no governance: prevents bad design edits propagating to code but adds approval hops that slow iteration

### Inclusion
- Default: **optional**
- Mandatory when: `'designer' in audience.primary_roles`
- Conditional: never
- Exclude when: no design surface

### Success Criteria
- Plugin ships
- Sync round-trips
- Sync conflict resolution works

### Failure Scenarios
- Scenario: Sync conflict
  - Impact: Data loss
  - Mitigation: conflict resolution UX
- Scenario: Plugin lags Figma API
  - Impact: Broken sync
  - Mitigation: version pinning

### Cross-Tree Refs
- (none yet — future CTC: `'designer' in audience.primary_roles IMPLIES EE-F019`)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F020: Design Tokens

**Status:** PLANNED (v1.2 Jul)

**What it is:** Design-token extraction and governance not shipped.

**When It Matters:** Design tokens are the contract between design and code. Automated extraction + governance eliminates manual sync errors.

**Depth Spectrum:** Basic — manual tokens. Standard — token schema. Advanced — Figma-code sync. Enterprise — token versioning.

**Signals:**
- Product idea references a design system or shared token vocabulary
- Project profile declares an existing design system the team maintains
- User statements describe UI divergence between Figma values and coded values

**Tradeoffs:**
- Automated Figma→code token sync vs manual maintenance: eliminates drift but ties build stability to Figma API reliability
- Token versioning (Enterprise) vs flat namespace: safe renames and migrations win but multiplies token catalog surface
- Token governance vs free-form token additions: prevents pollution but slows down designers adding experimental tokens

### Inclusion
- Default: **optional**
- Mandatory when: design system exists
- Conditional: never
- Exclude when: no design system

### Success Criteria
- Token schema round-trips
- Figma-to-code sync works
- Token governance (who changes what)

### Failure Scenarios
- Scenario: Token drift between Figma and code
  - Impact: UI divergence
  - Mitigation: drift detector
- Scenario: Token rename breaks code
  - Impact: Compile fail
  - Mitigation: rename migration workflow

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EE-F021: Component Generation

**Status:** PARTIAL

**What it is:** compile-design-spec and generate-wireframes skills ship. Code-component stub generation from wireframes is not.

**When It Matters:** Component generation closes the design-to-code loop. Design spec ships; wireframe → stub generation doesn't yet.

**Depth Spectrum:** Basic — hand-coded. Standard — design spec (current). Advanced — wireframe → stub. Enterprise — design-decision traceability.

**Signals:**
- Product idea names design-to-code as in-scope for the project
- User statements describe manual translation from wireframe to code component
- Project profile shows front-end or UI-heavy scope with design-exp pipeline outputs available

**Tradeoffs:**
- Wireframe→stub auto-generation vs hand-coded: removes manual translation but quality is capped by wireframe fidelity
- Design-decision traceability (Enterprise) vs stub-only output: closes the audit loop but forces every design decision to carry a stable identifier
- Quality threshold + human review vs raw stub output: prevents throwaway output but adds a review step in the design-to-code pipeline

### Inclusion
- Default: **optional**
- Mandatory when: design-to-code is in-scope
- Conditional: never
- Exclude when: backend-only

### Success Criteria
- compile-design-spec runs successfully
- Stub generator produces compilable code
- Design-decision → code traceability preserved

### Failure Scenarios
- Scenario: Generated stubs diverge from wireframes
  - Impact: Manual rework
  - Mitigation: diff on regen
- Scenario: Stub quality poor
  - Impact: Throwaway output
  - Mitigation: quality threshold + human review

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: compile-design-spec + generate-wireframes used
- Scenarios observed: per design-exp run
- Common mistakes: n/a
- Last promoted: PARTIAL
