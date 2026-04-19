<!-- Provenance
origin: stm_research
editable: true
created_at: 2026-04-18T00:00:00Z
updated_at: 2026-04-18T00:30:00Z
researcher: product-keeper (Stage 2 specify-product — 3-tier restructure)
research_basis: .garura/product/specification/market-brief.md + project-profile.yaml + core/components/skills/quality-check + check-drift
research_notes: |
  Restructure from flat 3-feature catalog to 4 capabilities × 14 features.
  Quality signals and debt signals are PARTIAL today (quality-check, check-drift ship);
  methodology posture and delivery signals are largely PLANNED for v1.1 May.
-->

# Engineering Observability

Cross-project portfolio visibility that unifies quality signals, tech-debt signals, methodology posture, and DORA-style delivery signals into a single Control Tower surface. Garura's Control Tower pillar — differentiated from Jellyfish/LinearB/Swarmia by treating methodology posture and AI consumption as first-class signals, not after-the-fact rollups (market brief Gap #3).

**Search patterns:** engineering observability, control tower, DORA metrics, methodology posture, quality signals, tech debt, spec debt, delivery signals, cross-project dashboard

---

## Capability: Quality Signals

**Status:** PARTIAL

**Rollup notes:** quality-check and quality-check-scoped skills run locally and emit structured findings. No cross-project aggregation, trend tracking, or dashboard surface.

**gap_items rollup:** Cross-project aggregation, trend tracking, coverage/lint/build/security dashboards.

### EO-F001: Test Coverage

**Status:** PARTIAL

**What it is:** Per-project coverage measurement via quality-check using the 11-explore framework. Cross-project aggregation and trend tracking are not shipped.

**When It Matters:** Test coverage at the portfolio level tells a leadership team whether quality is rising or eroding across the organization. Per-project coverage is table stakes; cross-project trend is what turns coverage into a signal.

**Depth Spectrum:** Basic — per-project coverage file. Standard — coverage threshold in CI. Advanced — cross-project aggregation + trend. Enterprise — coverage policy by capability criticality.

**Signals:**
- Product idea references "test coverage", "quality gates", or "portfolio quality visibility"
- Project profile declares `delivery_ambition.current_level >= L2` with quality-tracked capabilities
- User statements describe coverage being known per-repo but invisible at leadership/portfolio scale

**Tradeoffs:**
- Coverage percentage as leading signal vs scenario-coverage: easy to compute wins but high % can mask shallow assertions
- Cross-project aggregation vs per-project autonomy: portfolio visibility wins but forces a shared coverage-tool adapter surface
- CI-enforced thresholds vs advisory reporting: real teeth wins but blocks merges on tests the team hasn't yet written

### Inclusion
- Default: **mandatory** for L2+ projects
- Mandatory when: quality is tracked
- Conditional: never
- Exclude when: throwaway prototypes

### Success Criteria
- quality-check runs successfully on ≥ 95% of supported stacks
- Coverage deltas surfaced per PR
- Cross-project rollup available (planned)

### Failure Scenarios
- Scenario: Coverage tool output format changes and quality-check breaks
  - Impact: Missing signal on affected projects
  - Mitigation: stack-specific adapter tests
- Scenario: High coverage masks shallow tests
  - Impact: False confidence
  - Mitigation: mutation testing as supplementary signal (planned)

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: used in this repo
- Scenarios observed: quality-check runs per ship
- Common mistakes: chasing % rather than scenario coverage
- Last promoted: PARTIAL

---

### EO-F002: Lint

**Status:** PARTIAL

**What it is:** Per-project lint run by quality-check where tooling exists; no aggregation or governance layer.

**When It Matters:** Lint at the portfolio level reveals consistency drift across projects. A cross-project lint signal enforces organizational standards.

**Depth Spectrum:** Basic — local lint. Standard — CI lint gate. Advanced — cross-project aggregation. Enterprise — policy-governed lint rules.

**Signals:**
- Product idea references "code style enforcement", "consistency across repos", or "shared engineering standards"
- Project profile shows multiple repos or teams expected to share conventions
- User statements describe lint config drift or disabled rules across projects

**Tradeoffs:**
- Shared KB-governed lint config vs per-repo autonomy: consistency wins but blocks repo-specific stylistic decisions
- Strict severity (error) vs advisory (warn): real teeth wins but drives disable-comments that hide the signal
- Noise-tuning vs raw-rule output: actionable feedback wins but noise-tuning itself becomes a maintenance surface

### Inclusion
- Default: **mandatory**
- Mandatory when: any L2+ project
- Conditional: never
- Exclude when: never

### Success Criteria
- Lint runs on ≥ 95% of supported stacks
- Lint violations surfaced per PR
- Cross-project rollup available (planned)

### Failure Scenarios
- Scenario: Lint config drifts between projects
  - Impact: Inconsistent signal interpretation
  - Mitigation: shared config (KB-governed)
- Scenario: Lint-noise fatigue causes users to disable
  - Impact: Signal quality degrades
  - Mitigation: noise-tuning + severity policy

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: used in this repo
- Scenarios observed: routine
- Common mistakes: disabling lint rules instead of fixing root cause
- Last promoted: PARTIAL

---

### EO-F003: Build Health

**Status:** PLANNED (v1.1 May)

**What it is:** First-class build-health signal collection — CI build status ingestion, flaky-build detection, build-health dashboard. Not shipped.

**When It Matters:** Build health is the leading indicator of engineering velocity. A spike in flaky builds predicts cycle-time increases days later.

**Depth Spectrum:** Basic — pass/fail per project. Standard — aggregated health. Advanced — flakiness detection. Enterprise — build-health SLO.

**Signals:**
- Product idea mentions "CI observability", "flaky build detection", or "build reliability"
- Project profile shows `delivery_ambition.current_level >= L3` with CI pipelines in use
- User statements describe flaky-build pain or gut-feel build-health with no measurement

**Tradeoffs:**
- Webhook ingestion vs polling: near-real-time wins but introduces dropped-event risk without polling fallback
- Flakiness classifier with confidence scoring vs binary pass/fail: actionable signal wins but false positives create noise fatigue
- Top-3 CI platform coverage vs universal adapter: faster launch wins but leaves long-tail CI environments unobserved

### Inclusion
- Default: **optional** at L2
- Mandatory when: L3+ with CI
- Conditional: never
- Exclude when: no CI

### Success Criteria
- CI ingestion working for top 3 CI platforms
- Flaky-build detection recall ≥ 80%
- Dashboard reflects ingestion within 5 minutes

### Failure Scenarios
- Scenario: CI webhook drops events
  - Impact: Health signal gaps
  - Mitigation: polling fallback
- Scenario: Flaky-build classifier yields false positives
  - Impact: Noise fatigue
  - Mitigation: confidence scoring + operator review

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0 (planned)
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F004: Security Scans

**Status:** PARTIAL

**What it is:** Security standards exist in KB under `knowledge/quality/security/`; per-project scan execution relies on external tooling; no unified surface.

**When It Matters:** Security posture must be visible at portfolio scale for procurement and audit. A unified surface turns point-tool noise into a prioritized queue.

**Depth Spectrum:** Basic — per-project scans. Standard — aggregated CVE list. Advanced — vulnerability prioritization. Enterprise — vendor integration.

**Signals:**
- Product idea references "vulnerability management", "security posture dashboard", or "compliance reporting"
- Project profile declares a security classification or regulated-industry audience
- User statements describe scanner output firehose with no prioritization or audit-ready rollup

**Tradeoffs:**
- Unified surface aggregating multiple scanners vs single-tool deep integration: portfolio visibility wins but normalization drops some tool-specific context
- Severity-filtered queue vs full CVE list: actionable queue wins but severity ratings themselves drift between scanners
- Scan-health meta-signal vs trusting scanner silence: detects silent failures but adds another signal users must monitor

### Inclusion
- Default: **mandatory**
- Mandatory when: security is in-scope
- Conditional: never
- Exclude when: isolated R&D

### Success Criteria
- Scanner integration for ≥ 1 language ecosystem at launch
- Vulnerability aggregation with severity
- Posture dashboard per project

### Failure Scenarios
- Scenario: Scanner noise overwhelms the surface
  - Impact: Real vulnerabilities missed
  - Mitigation: severity filtering + policy baseline
- Scenario: Scan execution fails silently on some projects
  - Impact: Coverage gap
  - Mitigation: scan-health meta-signal

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: KB standards used in quality-check
- Scenarios observed: security scans out-of-band today
- Common mistakes: treating scan output as prioritization
- Last promoted: PARTIAL

---

## Capability: Debt Signals

**Status:** PARTIAL

**Rollup notes:** check-drift detects spec drift and emits a debt catalog. Tech-debt governance rules exist (Fowler quadrant). No trend dashboard or debt-driven routing.

**gap_items rollup:** Debt trend dashboard, debt-driven play routing, domain taxonomy drift, schema-version audit.

### EO-F005: Tech Debt

**Status:** PARTIAL

**What it is:** check-drift emits tech-debt catalog per project. Trend tracking and cross-project rollup not shipped.

**When It Matters:** Tech debt is the compounding tax on future velocity. Without visibility, debt accumulates invisibly until it blocks a roadmap.

**Depth Spectrum:** Basic — manual debt log. Standard — check-drift catalog. Advanced — trend dashboard. Enterprise — debt-driven routing.

**Signals:**
- Product idea references "tech debt visibility", "Fowler quadrant", or "refactor prioritization"
- Project profile shows long-lived codebases or maintenance-heavy portfolios
- User statements describe invisible debt accumulation or inability to justify refactor work to leadership

**Tradeoffs:**
- Fowler-quadrant structured catalog vs free-form debt log: analyzable classification wins but forces authors to pick a quadrant on fuzzy items
- Debt-driven play routing (auto-fix-it) vs advisory catalog: real remediation wins but routing errors pull the wrong work into sprints
- Confidence scoring on detected debt vs trust-all-findings: less catalog noise wins but genuine debt below threshold gets silently filtered

### Inclusion
- Default: **mandatory**
- Mandatory when: any L2+ project
- Conditional: never
- Exclude when: never

### Success Criteria
- check-drift runs on demand per project
- Debt catalog structured per Fowler quadrant
- Trend tracking (planned)

### Failure Scenarios
- Scenario: Debt catalog grows unbounded without repayment
  - Impact: Signal fatigue
  - Mitigation: debt-driven routing into fix-it
- Scenario: False positives pollute catalog
  - Impact: Trust erodes
  - Mitigation: confidence scoring

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: check-drift used in this repo
- Scenarios observed: drift reports reviewed manually
- Common mistakes: treating drift report as exhaustive
- Last promoted: PARTIAL

---

### EO-F006: Domain Debt

**Status:** PLANNED (v1.2 Jul)

**What it is:** First-class detection of capability-level drift and taxonomy debt. Not shipped beyond general check-drift.

**When It Matters:** Domain debt is the architectural debt that check-drift misses — blurred domain boundaries, capabilities half-implemented in two places. Surfacing this prevents architectural decay.

**Depth Spectrum:** Basic — none. Standard — manual review. Advanced — taxonomy drift detection. Enterprise — capability staleness scoring.

**Signals:**
- Product idea references "domain boundaries", "capability taxonomy health", or "architectural drift"
- Project profile shows ≥ 5 capabilities or multiple domains expected to stay distinct
- User statements describe capabilities half-implemented in two places or fuzzy domain ownership

**Tradeoffs:**
- Taxonomy-drift detector recall vs false-positive rate: catching real drift wins but confusing legitimate evolution with drift destroys trust
- Separate domain-debt catalog vs folding into tech debt: clear architectural signal wins but forces users to watch two catalogs
- Capability staleness scoring vs binary drift flag: nuanced prioritization wins but score interpretation itself becomes a contested surface

### Inclusion
- Default: **optional** until L3+
- Mandatory when: portfolio has ≥ 5 capabilities
- Conditional: never
- Exclude when: single-capability projects

### Success Criteria
- Taxonomy drift detector recall ≥ 70% in pilot
- Capability staleness scored per project
- Domain-debt catalog separate from tech-debt

### Failure Scenarios
- Scenario: Detector confuses legitimate evolution with drift
  - Impact: False positives
  - Mitigation: diff review
- Scenario: Taxonomy updates invalidate prior entries
  - Impact: Catalog inconsistency
  - Mitigation: taxonomy versioning

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F007: Spec Debt

**Status:** PARTIAL

**What it is:** Spec drift (locked spec vs implementation) detected by check-drift. Schema-debt (artifacts with outdated schema versions) not systematically measured.

**When It Matters:** Spec debt is what causes "the spec says X, the code does Y" — the most common failure mode of spec-driven development.

**Depth Spectrum:** Basic — manual inspection. Standard — check-drift (current). Advanced — schema-version audit. Enterprise — spec-drift dashboard.

**Signals:**
- Product idea references "spec-to-code traceability", "locked specs", or "drift detection"
- Project profile declares `delivery_ambition.current_level >= L2` with locked artifacts
- User statements describe code diverging from specs or schema versions going stale unnoticed

**Tradeoffs:**
- Automatic re-run on lock-change vs scheduled cadence: fresh drift signal wins but every lock edit pays a validator cost
- Severity-threshold filtering vs every-diff reporting: actionable signal wins but sub-threshold drift accumulates invisibly
- Schema-version audit as a separate dimension vs folded into spec drift: precise diagnosis wins but two audits instead of one

### Inclusion
- Default: **mandatory** at L2+
- Mandatory when: any L2+ project
- Conditional: never
- Exclude when: L1 only

### Success Criteria
- check-drift surfaces spec drift with ≥ 90% recall
- Schema-version audit detects outdated artifacts
- Dashboard surface (planned)

### Failure Scenarios
- Scenario: Locked spec updated without re-check
  - Impact: False absence of drift
  - Mitigation: lock-change triggers re-run
- Scenario: Drift report too noisy to act on
  - Impact: Ignored
  - Mitigation: severity thresholds

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: check-drift used
- Scenarios observed: periodic spec reviews
- Common mistakes: editing implementation before re-locking spec
- Last promoted: PARTIAL

---

## Capability: Methodology Posture

**Status:** PLANNED (v1.1 May)

**Rollup notes:** Three-axis project profiling exists (ADR 014). No automated posture assessment against declared ladder level or play-success telemetry.

**gap_items rollup:** Posture measurement algorithm, agent-invocation telemetry, play-outcome aggregation.

### EO-F008: Ladder Position

**Status:** PLANNED (v1.1 May)

**What it is:** Declared level lives in project_profile; measured level (actual artifact completeness vs declared) is not computed today.

**When It Matters:** Declared vs measured ladder position is the definitive signal of methodology maturity. Without it, teams self-declare L3 while shipping L1 artifacts.

**Depth Spectrum:** Basic — declared only. Standard — declared + checklist. Advanced — measured via artifact scan. Enterprise — drift dashboard.

**Signals:**
- Product idea references "methodology maturity", "declared vs actual level", or "posture measurement"
- Project profile has `delivery_ambition.current_level >= L3` with a target above current
- User statements describe teams self-declaring higher than their artifacts support

**Tradeoffs:**
- Deterministic algorithmic score vs human posture review: auditable wins but can undervalue artifacts the algorithm doesn't recognize
- Declared-vs-measured gap as a public signal vs private coaching: accountability wins but risks gaming the measurement
- Posture update latency (24h) vs real-time: cheap and stable wins but hides short-lived regressions

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: `delivery_ambition.current_level >= 'L3'`
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- Posture measurement algorithm produces deterministic score
- Drift surface flags declared-vs-measured gap
- Posture updates within 24h of artifact changes

### Failure Scenarios
- Scenario: Algorithm misses a new artifact type
  - Impact: Underestimated measured level
  - Mitigation: algorithm extension protocol
- Scenario: Drift gap is chronic
  - Impact: Signal decays
  - Mitigation: level-up coaching workflow

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F009: AI Adoption Maturity

**Status:** PLANNED (v1.2 Jul)

**What it is:** Measurement of how deeply AI agent workflow is adopted (agent-invocation rate, play-usage breadth) per project. Not shipped.

**When It Matters:** AI adoption maturity is the procurement-facing signal — "how many of our engineers actually use the AI tools we bought?".

**Depth Spectrum:** Basic — seat count. Standard — usage rate. Advanced — play breadth + depth. Enterprise — cohort analysis.

**Signals:**
- Product idea references "AI consumption metrics", "tool adoption", or "ROI on AI tooling"
- Project profile shows enterprise procurement context or seat-license model
- User statements describe seat counts disconnected from actual usage or unclear AI-tool ROI

**Tradeoffs:**
- Multi-metric composite (invocation + breadth + depth) vs single metric: harder to game wins but harder to explain to buyers
- Cohort analysis vs aggregate rate: tells the real story of who's using it but inflates dashboard complexity
- Event-durable telemetry vs lightweight sampling: accurate rate wins but collection cost grows with usage volume

### Inclusion
- Default: **optional** until L4
- Mandatory when: enterprise procurement
- Conditional: never
- Exclude when: solo projects

### Success Criteria
- Invocation telemetry captured per agent per project
- Adoption rate computed weekly
- Dashboard shows cohorts

### Failure Scenarios
- Scenario: Telemetry missing events
  - Impact: Underestimated adoption
  - Mitigation: event durability
- Scenario: Adoption metric gamed
  - Impact: Hollow signal
  - Mitigation: multi-metric composite

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F010: Play Success Rate

**Status:** PLANNED (v1.1 May)

**What it is:** Plays emit status.json files per invocation but success/failure is not aggregated into a success-rate metric.

**When It Matters:** Play success rate reveals which plays are brittle and which are stable.

**Depth Spectrum:** Basic — per-invocation status. Standard — aggregated per-play rate. Advanced — trend. Enterprise — cross-project comparison.

**Signals:**
- Product idea references "workflow reliability" or "play stability metrics"
- Project profile shows multiple plays shipped with user-facing invocation
- User statements describe some plays feeling flaky without a data-backed comparison

**Tradeoffs:**
- Compiler-guaranteed status.json write vs best-effort: complete aggregation wins but any play that skips emits a silent hole
- Shared success taxonomy vs per-play definition: comparable metrics win but forces every play to map into one taxonomy
- Low-success flagging threshold vs continuous ranking: clear "fix this" signal wins but threshold cliffs produce whiplash rankings

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: plays are user-facing
- Conditional: never
- Exclude when: never

### Success Criteria
- Per-play success rate computed weekly
- Low-success plays flagged
- Success-rate dashboard

### Failure Scenarios
- Scenario: Status files missing for some plays
  - Impact: Incomplete picture
  - Mitigation: write-status guaranteed by compiler
- Scenario: "Success" means different things across plays
  - Impact: Not comparable
  - Mitigation: shared success taxonomy

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: status files exist; no aggregation
- Scenarios observed: raw status inspected manually
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Delivery Signals

**Status:** PARTIAL

**Rollup notes:** ship, merge-pr, and validate-epic emit per-invocation status artifacts. DORA aggregation, cycle/lead time calculation, and change-fail rate dashboards are not shipped.

**gap_items rollup:** DORA calculation, cycle-time calc, lead-time calc, change-fail rate calc, delivery dashboards.

### EO-F011: DORA Metrics

**Status:** PLANNED (v1.1 May)

**What it is:** DORA Four — deployment frequency, change-fail rate, MTTR, lead time — are not computed or surfaced. Raw ship/merge events exist; aggregation layer missing.

**When It Matters:** DORA is the industry-standard delivery signal. Buyers expect it; leaders benchmark against it.

**Depth Spectrum:** Basic — manual reports. Standard — scripted rollup. Advanced — automated dashboard. Enterprise — benchmark comparison.

**Signals:**
- Product idea references "DORA", "delivery metrics", or "engineering benchmark"
- Project profile declares `delivery_ambition.current_level >= L3` or enterprise-procurement context
- User statements describe DORA asks from leadership or benchmark comparisons vs industry

**Tradeoffs:**
- Shared event taxonomy across projects vs per-project definitions: comparable DORA wins but forces every project to normalize its event emission
- On-call integration for MTTR vs self-reported resolution time: accurate MTTR wins but adds an external integration surface
- Automated dashboard vs scripted rollup: zero-toil reporting wins but owns an always-on computation surface

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: enterprise procurement
- Conditional: never
- Exclude when: solo R&D

### Success Criteria
- Deployment-frequency computed per project
- Change-failure-rate computed per project
- MTTR computed per project
- Lead-time computed per project

### Failure Scenarios
- Scenario: Event definition drifts between projects
  - Impact: DORA not comparable
  - Mitigation: shared event taxonomy
- Scenario: Missing events from on-call systems
  - Impact: MTTR undercount
  - Mitigation: on-call integration

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0 (planned)
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F012: Cycle Time

**Status:** PLANNED (v1.1 May)

**What it is:** Cycle time (first commit → merge) not computed from PR/issue events.

**When It Matters:** Short cycle time correlates with small batches, healthy review, low WIP.

**Depth Spectrum:** Basic — manual. Standard — per-feature calc. Advanced — trend. Enterprise — SLO with routing.

**Signals:**
- Product idea references "cycle time", "WIP reduction", or "batch size"
- Project profile targets L3+ with PR/issue events available for ingestion
- User statements describe long-lived branches or suspect gut-feel cycle-time claims

**Tradeoffs:**
- Deterministic "first commit" rule vs heuristic detection: reproducible metric wins but fixed rules can miss rebased or squashed histories
- Median + distribution vs mean: resilient to long-tail branches wins but harder to headline in a dashboard
- Per-feature calc vs PR-level: actionable to feature owners wins but many PRs don't map cleanly to features

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: L3+ project
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- Per-feature cycle-time computed
- Cycle-time trend surfaces
- Outlier detection for spikes

### Failure Scenarios
- Scenario: "First commit" misattributed
  - Impact: Underestimated
  - Mitigation: deterministic rule
- Scenario: Long-lived branches skew mean
  - Impact: Misleading average
  - Mitigation: use median + distribution

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F013: Lead Time

**Status:** PLANNED (v1.1 May)

**What it is:** Lead time (issue open → ship) not computed.

**When It Matters:** Lead time is the customer-facing signal — how long between request and shipped result.

**Depth Spectrum:** Basic — per-feature. Standard — trend. Advanced — SLO. Enterprise — cross-team comparison.

**Signals:**
- Product idea references "time-to-ship", "customer-facing lead time", or "request-to-delivery"
- Project profile shows enterprise procurement context or customer-facing SLO commitments
- User statements describe customers feeling slow delivery without internal measurement

**Tradeoffs:**
- Canonical "issue open" event vs first-seen ticket timestamp: consistent metric wins but requires uniform issue practices across projects
- Re-open handling (reset vs carry-forward) vs ignore: honest lead time wins but re-opens become a hot debate per team
- Cross-team comparison vs per-team private view: benchmarking wins but invites gaming by ticket splitting

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: enterprise procurement
- Conditional: never
- Exclude when: L1/L2 only

### Success Criteria
- Per-feature lead-time computed
- Trend surfaces
- Outlier detection

### Failure Scenarios
- Scenario: Issue open time unreliable
  - Impact: Lead time wrong
  - Mitigation: canonical issue event
- Scenario: Re-opened issues skew lead time
  - Impact: Misleading
  - Mitigation: re-open handling policy

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### EO-F014: Change-Fail Rate

**Status:** PLANNED (v1.1 May)

**What it is:** Change-fail rate (rollback/hotfix ratio) not computed.

**When It Matters:** Change-fail rate separates healthy velocity from reckless shipping.

**Depth Spectrum:** Basic — manual rollback log. Standard — computed ratio. Advanced — trend + alerts. Enterprise — SLO with deploy-gate feedback.

**Signals:**
- Product idea references "change-fail rate", "rollback tracking", or "deploy safety"
- Project profile declares production systems or regulated-industry deployment posture
- User statements describe unclear rollback/hotfix ratios or reckless-velocity concern

**Tradeoffs:**
- Shared hotfix taxonomy vs project-local definition: comparable rate wins but demands every project tag deploys uniformly
- Deploy-tool event capture vs self-reported rollback log: accurate rate wins but requires integration with every deploy tool in the portfolio
- SLO with deploy-gate feedback (Enterprise) vs advisory metric: real teeth wins but a bad threshold blocks legitimate emergency deploys

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: production systems
- Conditional: never
- Exclude when: non-production

### Success Criteria
- Rollback/hotfix event captured
- Change-fail rate computed per project
- Dashboard + alert

### Failure Scenarios
- Scenario: Rollback events not systematically captured
  - Impact: Undercounted
  - Mitigation: deploy-tool integration
- Scenario: Hotfix definition ambiguous
  - Impact: Not comparable
  - Mitigation: shared hotfix taxonomy

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never
