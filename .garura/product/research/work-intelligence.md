<!-- Provenance
origin: stm_research
editable: true
created_at: 2026-04-18T00:00:00Z
updated_at: 2026-04-18T00:30:00Z
researcher: product-keeper (Stage 2 specify-product — 3-tier restructure)
research_basis: .garura/product/specification/market-brief.md + project-profile.yaml + manage-issue + prepare-epic + evals-creator + fix-it
research_notes: |
  Restructure to 4 capabilities × 13 features. Intent-driven verification is PARTIAL
  (evals-creator and fix-it ship); backlog-lifecycle is PARTIAL (generate-intent-epics
  LIVE); agentic-planning and intent-anchored-triage are mostly PLANNED.
-->

# Work Intelligence

Work management where every item is a link in the intent-to-outcome chain. Garura's Work Intelligence pillar — differentiated from Linear/Jira by treating intent-anchored triage, capability-scoped planning, spec-to-test continuity, and intent-driven verification as first-class flows rather than ticket-board add-ons (market brief Gap #4).

**Search patterns:** work intelligence, intent-anchored triage, capability planning, backlog lifecycle, epic decomposition, intent-driven tests, RCA, fix-it loop, blast-radius analysis

---

## Capability: Intent-Anchored Triage

**Status:** PARTIAL

**Rollup notes:** manage-issue and scout-project skills provide intake and project context. AI routing, priority scoring, and blast-radius analysis are not shipped as first-class flows.

**gap_items rollup:** Issue-to-intent linking, owner inference, priority scoring algorithm, priority queue surface, change → capability/feature graph traversal, blast-radius visualization.

### WI-F001: Agentic Triage

**Status:** PLANNED (v1.1 May)

**What it is:** Automatic routing of incoming issues to owning agent/human based on intent artifacts. Not shipped; manage-issue handles intake structurally but routing is manual.

**When It Matters:** Most issue backlogs are stalled because nobody knows who owns what. Agentic triage turns intake into assignment based on intent content, not team guesswork.

**Depth Spectrum:** Basic — manual triage. Standard — label-based routing. Advanced — intent-based routing with owner inference (planned). Enterprise — routing with SLA-backed assignment.

**Signals:**
- Product idea references "auto-routing", "owner inference", or "triage automation for inbound issues"
- Project profile shows `team_size >= 5` or multi-capability ownership with unclear routing rules
- User statements describe stale unassigned issues, round-robin guessing, or triage-meeting toil

**Tradeoffs:**
- Intent-based routing vs label-based routing: higher accuracy wins but depends on intent artifacts existing on every inbound issue — raw bug reports may lack them
- Owner inference from capability graph vs team-declared ownership: adapts as ownership shifts but misroutes when graph is stale
- Auto-assignment vs suggest-only: fewer orphan issues wins but wrong owner is worse than no owner when it suppresses escalation

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: team_size ≥ 5
- Conditional: never
- Exclude when: solo

### Success Criteria
- Routing accuracy ≥ 80% in pilot
- Owner inference produces a single candidate owner
- Routing decisions produce evidence

### Failure Scenarios
- Scenario: Router picks wrong owner
  - Impact: Issue sits unassigned
  - Mitigation: review gate + escalation
- Scenario: No owner exists for a category
  - Impact: Default to inbox
  - Mitigation: escalation rules

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0 (planned)
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### WI-F002: Priority Scoring

**Status:** PLANNED (v1.1 May)

**What it is:** No automated priority score from constraint criticality or business impact. Planned.

**When It Matters:** Priority debates are most of a triage meeting. Automated scoring turns priority into a transparent function of constraints.

**Depth Spectrum:** Basic — manual priority. Standard — label priority. Advanced — scored priority. Enterprise — priority with SLA.

**Signals:**
- Product idea references "priority scoring", "impact-weighted backlog", or "deterministic triage order"
- User statements describe priority debates consuming triage meetings or priority-label inflation
- Project profile shows high-volume backlog or multiple stakeholders competing for the same queue

**Tradeoffs:**
- Multi-factor deterministic score vs single stakeholder-set priority: transparency and audit wins but any factor misweight spreads across the whole queue
- Constraint-criticality weighting vs business-impact weighting: spec-grounded wins for engineering trust but business may want revenue-first scoring
- Score as ranking signal vs score as hard gate: avoids political fights when advisory, enforces discipline when binding — cannot have both without a review path

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: high-volume backlog
- Conditional: never
- Exclude when: small backlog

### Success Criteria
- Priority algorithm produces deterministic score
- Priority queue surface
- Priority decisions traceable to constraints

### Failure Scenarios
- Scenario: Priority algorithm gamed
  - Impact: Hollow priority
  - Mitigation: multi-factor score
- Scenario: Priority score diverges from org perception
  - Impact: Low trust
  - Mitigation: calibration workflow

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### WI-F003: Blast-Radius Analysis

**Status:** PARTIAL

**What it is:** analyze-changes and analyze-pr skills assess change impact for PRs. Full blast-radius (which capabilities, epics, features does this change touch?) is not computed.

**When It Matters:** Blast-radius analysis is the difference between "review this PR" and "review this PR knowing it touches compliance-critical capabilities". It makes risk explicit before review.

**Depth Spectrum:** Basic — file diff. Standard — per-directory impact. Advanced — capability/feature graph traversal. Enterprise — risk-weighted blast-radius.

**Signals:**
- Product idea references "change impact", "blast-radius", or "capability-aware review"
- Project profile shows capability-scoped planning or compliance-critical capabilities where reviewer context matters
- User statements describe reviewers missing non-obvious cross-capability effects of PRs

**Tradeoffs:**
- Capability/feature graph traversal vs file-diff heuristics: catches indirect impact but only as complete as the dependency inventory it walks
- Risk-weighted scoring vs unweighted touch-list: prioritizes reviewer attention but any weight miscalibration skews the signal
- Visualization rendered on every PR vs on-demand: always-present context wins but adds noise on trivial PRs that touch one file

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: capability-scoped planning
- Conditional: never
- Exclude when: solo R&D

### Success Criteria
- analyze-changes maps to capability graph
- Blast-radius visualization per PR
- Risk-weighted scoring (planned)

### Failure Scenarios
- Scenario: Graph traversal misses indirect dependencies
  - Impact: Under-stated risk
  - Mitigation: dependency inventory kept current
- Scenario: Visualization unreadable for large PRs
  - Impact: Ignored
  - Mitigation: drill-down UX

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: analyze-pr used per PR
- Scenarios observed: basic impact analysis
- Common mistakes: n/a
- Last promoted: PARTIAL

---

## Capability: Agentic Planning

**Status:** PARTIAL

**Rollup notes:** prepare-epic produces plan.yaml, tech.yaml, scenarios.yaml. start-feature-planning resolves issues and sets up context. Release-scoped planning and agent-time blast-radius allocation are not shipped.

**gap_items rollup:** Release-scoped backlog view, cross-capability dependency resolution, release planning surface, agent-time allocation tracking, capacity estimation model, agent-budget forecast.

### WI-F004: Release Planning

**Status:** PLANNED (v1.2 Jul)

**What it is:** Release-scoped planning across capabilities — group epics into a release, walk dependencies, commit a release scope. Garura is release-based, not sprint-based; no sprint/story constructs. Not shipped.

**When It Matters:** Garura ships in releases, not sprints. Release planning is the cadence where capability-scoped scope becomes a committed deliverable. Without it, the framework has no planning cadence above the epic.

**Depth Spectrum:** Basic — per-epic planning. Standard — per-release epic aggregation. Advanced — cross-capability release dependency resolution. Enterprise — cross-product release portfolio.

**Signals:**
- Product idea references "release planning", "release-scoped scope", or explicit rejection of sprint/story ceremonies
- Project profile declares release-based delivery rhythm (not sprint/iteration cadence)
- User statements describe wanting epic aggregation into committed releases without sprint-board overhead

**Tradeoffs:**
- Release-scoped planning vs sprint-scoped: matches Garura's actual cadence but rules out adoption by teams that run SAFe/Scrum sprints
- Cross-capability dependency resolution vs per-capability local planning: catches release-blockers early but requires every capability to keep its dependency graph current
- Release commit as hard scope vs soft target: real commitment discipline wins but every unexpected defect forces a de-scope negotiation

### Inclusion
- Default: **optional** at L3
- Mandatory when: multi-capability release cadence at L4
- Conditional: never
- Exclude when: solo / single-capability

### Success Criteria
- Release view aggregates epics across capabilities
- Cross-capability dependencies surfaced
- Release commit workflow

### Failure Scenarios
- Scenario: Release view stale
  - Impact: Planning errors
  - Mitigation: auto-refresh
- Scenario: Dependencies missed
  - Impact: Release commits break mid-cycle
  - Mitigation: dependency inventory

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### WI-F005: Capability Planning

**Status:** PARTIAL

**What it is:** start-feature-planning scaffolds per-feature planning within a capability. Capability-scoped release planning with epic aggregation + commit workflow not shipped as a cohesive surface.

**When It Matters:** Capability planning is where capability-scoped scope becomes release-committed work. Unlike sprint planning (which Garura does not use), capability planning aggregates epics per capability and feeds them into release commits.

**Depth Spectrum:** Basic — per-feature plan. Standard — capability epic aggregation (planned). Advanced — capability + release rollup. Enterprise — cross-capability capability-health view.

**Signals:**
- Product idea references "capability-scoped planning" or "epic-to-release aggregation per capability"
- Project profile shows multiple capabilities each needing independent planning surfaces
- User statements describe wanting capability-health views rather than sprint burn-downs

**Tradeoffs:**
- Capability-scoped planning vs whole-product planning: clearer ownership wins but forces cross-capability coordination to live above the capability plan
- Epic aggregation per capability vs free-floating epics: release commits become tractable but demands every epic land against a capability
- Capability-health view vs sprint-burn-down: aligns with Garura's release cadence but unfamiliar to teams coming from Jira/Linear

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: multi-capability product
- Conditional: never
- Exclude when: single-capability project

### Success Criteria
- Capability planning surface
- Epic aggregation per capability
- Capability-health rollup

### Failure Scenarios
- Scenario: Capability plan over-committed
  - Impact: Release slip
  - Mitigation: capacity warning
- Scenario: Capability plan under-committed
  - Impact: Low throughput
  - Mitigation: epic-backlog suggestions

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: start-feature-planning used in this repo
- Scenarios observed: partial
- Common mistakes: skipping planning
- Last promoted: PARTIAL

---

### WI-F006: Agent-Time Allocation

**Status:** PLANNED (v1.2 Jul)

**What it is:** Blast-radius allocation of agent-time (agent budget) to candidate epics within a release — estimate agent-time per epic, match against available agent-budget envelope. Replaces traditional story-point/velocity matching. Planned.

**When It Matters:** In Garura, capacity is agent-time, not person-hours or story points. Allocating agent-time across epics by blast radius is how release commitments become defensible. Without it, agent budget is guessed and overruns silently.

**Depth Spectrum:** Basic — manual agent-time guess. Standard — per-epic agent-time estimate. Advanced — blast-radius-weighted allocation + budget match. Enterprise — multi-release agent-budget pool.

**Signals:**
- Product idea references "agent budget", "agent-time allocation", or cost/budget governance for agent runs
- Project profile declares explicit agent-budget constraints or multi-epic releases competing for shared agent time
- User statements describe agent-budget overruns or inability to commit to releases without an agent-time forecast

**Tradeoffs:**
- Agent-time allocation vs person-hour/story-point estimation: matches Garura's actual cost model but unfamiliar to teams used to capacity poker
- Blast-radius-weighted allocation vs flat per-epic estimate: captures cross-capability ripple costs but the blast-radius model must be accurate or the weighting compounds error
- Budget forecast as advisory vs hard cap: soft cap preserves delivery flexibility, hard cap enforces discipline — cannot have both without an override path

### Inclusion
- Default: **optional**
- Mandatory when: multi-epic release with shared agent budget
- Conditional: never
- Exclude when: solo / single-epic release

### Success Criteria
- Agent-time estimation model per epic
- Agent-budget forecast per release
- Blast-radius-weighted allocation recommendation

### Failure Scenarios
- Scenario: Agent-time estimation inaccurate
  - Impact: Mismatched release commitments
  - Mitigation: calibration against historical agent-runs
- Scenario: Budget forecast wrong
  - Impact: Budget overrun
  - Mitigation: budget-actual reconciliation

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Backlog Lifecycle

**Status:** PARTIAL

**Rollup notes:** resolve-issues maps change groups to GitHub issues. Epic decomposition is LIVE via generate-intent-epics. Garura is release-based and intent-anchored — no traditional sprint/story backlog lifecycle, no grooming/triage ceremonies on a story queue.

**gap_items rollup:** Capability-aware epic grooming policy, stale-epic detection, epic → implementation-unit decomposition rules.

### WI-F007: Epic Decomposition

**Status:** LIVE

**What it is:** generate-intent-epics instantiates one epic per enriched capability with full intent schema; every epic is traceable to a KB feature.

**When It Matters:** Epic decomposition from capabilities is how scope becomes work. Live today because the specify-product pipeline depends on it.

**Depth Spectrum:** Basic — hand-authored epics. Standard — template-filled. Advanced — capability-driven auto-gen (current). Enterprise — epic diff on capability change.

**Signals:**
- Product idea references "capability-to-epic", "auto-generated epics", or "KB-grounded scope artifacts"
- Project profile declares L3+ delivery ambition with locked intent schema
- User statements describe hand-authored epics drifting from capability taxonomy or missing traceability

**Tradeoffs:**
- One epic per enriched capability vs grouped epics: clean traceability wins but large scopes produce many small epics
- Auto-generation from KB vs hand-authored refinement: guaranteed field completeness wins but epic quality is capped by KB feature depth
- Schema validation as hard gate vs advisory: blocks shallow epics but delays scope lock when edge-case fields cannot be populated from KB

### Inclusion
- Default: **mandatory**
- Mandatory when: any L3+ product
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- 100% of generated epics pass validate-intent-epics
- Every epic traceable to KB feature
- Scenarios ≥ 2 success + ≥ 2 failure

### Failure Scenarios
- Scenario: Epic missing field
  - Impact: Validator blocks
  - Mitigation: template completeness
- Scenario: kb_source stale
  - Impact: Traceability broken
  - Mitigation: consistency validator

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every specify-product run
- Scenarios observed: daily
- Common mistakes: editing epics without re-validating
- Last promoted: LIVE

---

### WI-F008: Epic Grooming

**Status:** PLANNED (v1.1 May)

**What it is:** No automated grooming (stale-epic detection, capability drift flagging, kb_source re-validation) for long-lived epics. Planned. Note: Garura has no traditional feature-grooming ceremony — this is capability-aware epic hygiene, not story-backlog grooming.

**When It Matters:** Epics live across multiple releases. Without automated hygiene, they silently drift from their source capability, carry stale kb_sources, or accumulate scenarios that no longer map to current scope. Automation turns epic hygiene from a dropped chore into a background process.

**Depth Spectrum:** Basic — manual. Standard — stale-epic flagging. Advanced — capability-drift detection + kb_source re-validation. Enterprise — auto-archive on capability removal.

**Signals:**
- Product idea references "epic hygiene", "stale-work detection", or "spec-artifact drift over time"
- Project profile shows multi-release horizons where epics persist across releases
- User statements describe epics drifting from their originating capability or stale kb_sources breaking traceability

**Tradeoffs:**
- Stale-epic detection by inactivity vs by capability-drift signal: inactivity is cheap but noisy; capability-drift is precise but requires capability version tracking
- Auto-archive on capability removal vs flag-only: cleaner backlog wins but risks losing epics the user still wants
- Re-validate kb_source on every capability change vs on cadence: freshness wins but thrashes the backlog on KB churn

### Inclusion
- Default: **optional**
- Mandatory when: long-lived multi-release backlog
- Conditional: never
- Exclude when: single-release scope

### Success Criteria
- Policy engine runs weekly
- Stale epics flagged
- Grooming decisions audited

### Failure Scenarios
- Scenario: Stale detector marks active epics
  - Impact: False stales
  - Mitigation: activity signal beyond update date
- Scenario: Grooming rules outdated
  - Impact: Policy drift
  - Mitigation: rule versioning

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### WI-F009: Implementation-Unit Decomposition

**Status:** PLANNED (v1.2 Jul)

**What it is:** No automatic decomposition of an epic into implementation units (the agent-executable work packets below an epic). Garura does not use "stories" — implementation units are scoped to fit agent-time envelopes and inherit epic constraints. Planned.

**When It Matters:** Epic-to-implementation decomposition closes the gap between intent-anchored epic and agent-executable work. Without it, breakdown is always manual and inconsistent.

**Depth Spectrum:** Basic — hand-written units. Standard — decomposition schema. Advanced — epic→unit rules with agent-time sizing. Enterprise — unit diff on epic change.

**Signals:**
- Product idea references "work-packet decomposition", "agent-sized units of work", or "epic-to-execution breakdown"
- Project profile targets L3+ with locked epics feeding implementation pipelines
- User statements describe wanting deterministic decomposition rather than ad-hoc breakdown by each engineer

**Tradeoffs:**
- Deterministic decomposition rules vs author discretion: consistency wins but rule authoring is a significant upfront cost
- Agent-time-sized units vs feature-sized units: matches Garura's execution model but forces decomposition to reason about agent cost, not just scope
- Unit diff on epic change vs regenerate-from-scratch: preserves in-flight work but diff logic is complex when epic constraints tighten

### Inclusion
- Default: **optional**
- Mandatory when: epics too large for single agent-run
- Conditional: never
- Exclude when: epic-per-issue workflows

### Success Criteria
- Implementation-unit schema round-trips
- Generated units traceable to epic
- Units inherit epic intent constraints

### Failure Scenarios
- Scenario: Unit decomposition arbitrary
  - Impact: Misalignment with epic
  - Mitigation: deterministic decomposition rules
- Scenario: Unit count explodes
  - Impact: Overwhelming backlog
  - Mitigation: granularity policy

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Intent-Driven Verification

**Status:** PARTIAL

**Rollup notes:** Validators (validate-intent-epics, validate-architecture-spec, validate-screen-coverage, validate-implementation-design, validate-abstraction-layer) and evals-creator ship today. Intent-driven test generation, RCA loop, and fix-it closure are partial.

**gap_items rollup:** Intent-to-test-code synthesis, language-specific test adapters, RCA pattern library, cross-defect correlation, loop automation over repeated defects.

### WI-F010: Eval Generation

**Status:** LIVE

**What it is:** evals-creator generates step evals and scenario evals from intent.yaml and scenarios files.

**When It Matters:** Eval generation from intent is the L3 promise — test fixtures derived from the spec rather than hand-coded. Live today in every play.

**Depth Spectrum:** Basic — hand-coded evals. Standard — eval schema. Advanced — intent-driven eval gen (current). Enterprise — scenario-to-eval with mutation testing.

**Signals:**
- Product idea references "spec-derived tests", "evals from intent", or rejection of hand-coded test fixtures
- Project profile declares L3+ with locked intent schema driving verification
- User statements describe evals drifting from spec or hand-coded fixtures becoming stale silently

**Tradeoffs:**
- Intent-driven eval generation vs hand-authored evals: guaranteed spec alignment wins but eval quality is capped by intent schema depth
- Re-generation on every intent change vs manual re-gen: zero drift wins but any schema churn triggers mass eval regeneration and review
- Mutation testing (Enterprise) vs trust-the-generator: catches lenient evals but multiplies the eval run-time cost

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: any L3+ play
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- Every play has step evals
- Every capability has scenario evals
- Evals pass on canonical traces

### Failure Scenarios
- Scenario: Evals drift from intent
  - Impact: False positive passes
  - Mitigation: re-gen on intent change
- Scenario: Evals too lenient
  - Impact: Hollow signal
  - Mitigation: mutation testing

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: every /create-play run
- Scenarios observed: daily
- Common mistakes: n/a
- Last promoted: LIVE

---

### WI-F011: Test Generation

**Status:** LIVE

**What it is:** Test case generation from intent — prepare-epic, implement-epic, and validate-epic plays all produce test cases from intent.yaml + verification scenarios. Generated scenarios feed into executable test fixtures via the eval pipeline.

**When It Matters:** Intent-to-test is the holy grail of spec-driven development — tests that cannot drift from spec because they are generated from spec. Live today: every epic pipeline invocation produces test cases from the epic's intent schema.

**Depth Spectrum:** Basic — scenarios only. Standard — test skeleton. Advanced — full test synthesis. Enterprise — language-adapter ecosystem.

**Signals:**
- Product idea references "intent-to-test", "auto-generated tests from spec", or language-specific test synthesis
- Project profile shows existing test automation ready to receive synthesized tests
- User statements describe tests drifting from spec or hand-writing tests from scenarios as a bottleneck

**Tradeoffs:**
- Full test synthesis vs test skeletons: removes the hand-fill step but any synthesis error produces a passing-but-wrong test
- Language-adapter ecosystem vs single-language synthesis: broad reach wins but each adapter is a maintenance surface that lags language updates
- Scenario-rigor discipline vs author flexibility: cleanly synthesizable scenarios require structure, but over-constraining scenario authoring pushes authors to pad

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: test automation exists
- Conditional: never
- Exclude when: L1/L2

### Success Criteria
- Test synthesis for ≥ 1 language at launch
- Synthesized tests trace to scenarios
- Tests executable out-of-box

### Failure Scenarios
- Scenario: Synthesized test ambiguous
  - Impact: Manual rewrite
  - Mitigation: scenario structure discipline
- Scenario: Adapter lags language updates
  - Impact: Broken tests
  - Mitigation: adapter versioning

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: draft-verification-scenarios LIVE
- Scenarios observed: scenarios generated daily
- Common mistakes: ambiguous scenarios
- Last promoted: PARTIAL

---

### WI-F012: RCA

**Status:** LIVE

**What it is:** Root-cause analysis delivered via the fix-it and enhance plays — every defect resolution and every enhance invocation performs structured RCA before proposing a change. RCA is not a separate play; it is a first-class phase inside fix-it and enhance.

**When It Matters:** RCA at the point of change prevents symptom-fixing and makes every defect / enhancement a learning event. Live today in fix-it and enhance — no shipped RCA means RCA happens nowhere and the methodology decays.

**Depth Spectrum:** Basic — per-defect RCA. Standard — RCA template (current fix-it). Advanced — pattern library. Enterprise — cross-defect correlation.

**Signals:**
- Product idea references "root-cause analysis", "pattern recognition across defects", or systemic-cause discovery
- Project profile shows production systems where repeat defects indicate underlying patterns
- User statements describe fixing symptoms without reaching root cause, or RCAs being one-shot with no cross-defect memory

**Tradeoffs:**
- RCA template structure (5-whys) vs free-form narrative: auditability wins but structure can turn into rote fill-in when users want speed
- Pattern library as shared corpus vs per-project RCAs: cross-defect transfer wins but requires curation discipline or the library degrades into noise
- Cross-defect correlation (Enterprise) vs per-defect depth: catches systemic patterns but demands defect metadata tagging that fix-it does not require today

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: production systems
- Conditional: never
- Exclude when: non-production

### Success Criteria
- Every defect has RCA evidence
- Pattern library searchable
- Cross-defect correlation reports

### Failure Scenarios
- Scenario: RCA shallow
  - Impact: Root cause missed
  - Mitigation: 5-whys structure
- Scenario: Pattern library stale
  - Impact: No transfer across defects
  - Mitigation: curation workflow

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: fix-it used in this repo
- Scenarios observed: per-defect RCA
- Common mistakes: fixing symptom before RCA
- Last promoted: PARTIAL

---

### WI-F013: Fix-It Loop

**Status:** LIVE

**What it is:** fix-it play closes the loop from defect → RCA → fix → validate. Loop automation over repeated defects is not yet present.

**When It Matters:** The fix-it loop is the methodology's closure mechanism. Live today for one-shot defects; automation over repeats is the next step.

**Depth Spectrum:** Basic — manual. Standard — RCA-driven fix (current). Advanced — repeat-defect automation. Enterprise — fleet-wide loop.

**Signals:**
- Product idea references "defect closure loop", "regression prevention", or "repeated-failure detection"
- Project profile shows production systems with any defect-reopening history
- User statements describe defects reopening, skipped RCAs, or missing regression tests on past fixes

**Tradeoffs:**
- Mandatory regression test on every fix vs fix-first-test-later: zero reopens wins but slows the close-out step when a quick fix is obvious
- Repeated-defect automation (Advanced) vs per-defect human loop: catches patterns but automated re-open detection must not misfire on coincidental similarity
- Loop evidence preserved forever vs aged-out: full auditability wins but inflates STM/LTM over time

### Inclusion
- Default: **mandatory**
- Mandatory when: production systems
- Conditional: never
- Exclude when: never

### Success Criteria
- fix-it closes ≥ 95% of defects without reopening
- Repeated defects detected
- Loop evidence preserved

### Failure Scenarios
- Scenario: Fix validates but regresses later
  - Impact: Reopened defect
  - Mitigation: regression test mandatory
- Scenario: Repeated defect not detected
  - Impact: Pattern missed
  - Mitigation: defect-history check

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: fix-it used in this repo
- Scenarios observed: daily
- Common mistakes: skipping RCA
- Last promoted: LIVE
