<!-- Provenance
origin: stm_research
editable: true
created_at: 2026-04-18T00:00:00Z
updated_at: 2026-04-18T00:30:00Z
researcher: product-keeper (Stage 2 specify-product — 3-tier restructure)
research_basis: .garura/product/specification/market-brief.md + project-profile.yaml + write-evidence + distill + capture-learning
research_notes: |
  Restructure to 3 capabilities × 10 features. Audit-attribution is PARTIAL today
  (evidence & provenance ship in write-evidence); consumption-tracking is PLANNED
  v1.1 May; memory-governance is PLANNED v1.1 May (except LTM curation PARTIAL).
-->

# AI Governance

Deterministic, auditable, enterprise-grade governance over AI-assisted engineering: token consumption tracking, AI-vs-human attribution, compliance audit trails, memory governance. Garura's procurement-blocker-removal surface for enterprise sales in the Jul '26 milestone — addresses market brief Gap #2 (no AI coding tool offers deterministic, auditable workflows for enterprise compliance).

**Search patterns:** AI governance, token tracking, budget enforcement, AI attribution, audit trail, compliance reports, memory governance, LTM curation, decision provenance

---

## Capability: Consumption Tracking

**Status:** PLANNED (v1.1 May)

**Rollup notes:** No token tracking, budget enforcement, or cost attribution shipped. Agent invocations are logged structurally but no telemetry backend exists.

**gap_items rollup:** Token-event ingestion per provider, budget configuration surface, soft-warning alerts, hard-block with admin override, cost reconciliation, chargeback/showback reports.

### AG-F001: Token Tracking

**Status:** PLANNED (v1.1 May)

**What it is:** Per-agent, per-skill, per-play token consumption tracking. Not shipped today; agent invocations log structurally but token events are not captured.

**When It Matters:** Token consumption is the line-item cost of AI-assisted engineering. Enterprise procurement requires per-feature attribution for chargeback; without token tracking, AI spend is opaque and unreviewable.

**Depth Spectrum:** Basic — aggregate monthly invoice. Standard — per-project token counts. Advanced — per-agent, per-skill attribution. Enterprise — real-time dashboards.

**Signals:**
- Product idea references "token tracking", "AI spend visibility", or "consumption telemetry"
- Project profile declares `compliance.categories includes 'token-consumption-tracking'` or enterprise procurement dimension
- User statements describe opaque AI spend, inability to attribute cost to features, or procurement blocking adoption

**Tradeoffs:**
- OTEL-backed real-time telemetry vs post-hoc invoice reconciliation: per-feature granularity wins but adds telemetry pipeline operational surface
- Per-agent/per-skill attribution vs per-project rollup: chargeback fidelity wins but multiplies event volume and storage cost
- Provider-native token metadata vs estimation fallback: accuracy wins when metadata exists but fallback is mandatory when providers omit it

### Inclusion
- Default: **mandatory** for enterprise
- Mandatory when: `project_profile.compliance.categories includes 'token-consumption-tracking'`
- Conditional: never
- Exclude when: solo personal use

### Success Criteria
- Token events captured for ≥ 2 providers at launch (Anthropic, OpenAI)
- Per-feature attribution accuracy ≥ 95%
- Telemetry latency < 30s

### Failure Scenarios
- Scenario: Provider API returns no token metadata
  - Impact: Cannot attribute cost
  - Mitigation: estimation fallback + flag
- Scenario: Token events dropped under load
  - Impact: Undercounted cost
  - Mitigation: durable queue + replay

### Cross-Tree Refs
- (none yet — future CTC: `compliance.categories includes 'token-consumption-tracking' IMPLIES AG-F001`)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AG-F002: Budget Enforcement

**Status:** PLANNED (v1.2 Jul)

**What it is:** Soft and hard budget limits per project / team. Not shipped.

**When It Matters:** Token spend can runaway under autonomous execution. Budget enforcement is the safety rail that keeps AI cost bounded.

**Depth Spectrum:** Basic — post-hoc alerts. Standard — soft warnings. Advanced — hard block with admin override. Enterprise — hierarchical budgets (team → project → feature).

**Signals:**
- Product idea references "budget caps", "cost guardrails", or "runaway autonomy protection"
- Project profile declares `team_size >= 10` or `compliance.categories includes 'budget-enforcement'`
- User statements describe fear of unbounded autonomous spend or past incidents of runaway token cost

**Tradeoffs:**
- Hard block at 100% vs soft warning only: safety wins but risks cutting off incident-response work at the worst moment — needs incident-mode override with audit
- Hierarchical budgets (team → project → feature) vs flat project budget: fine-grained attribution wins but configuration complexity explodes
- Budget coupled to token tracking accuracy vs independent caps: coherence wins but a token-tracking gap causes premature blocks

### Inclusion
- Default: **mandatory** for enterprise
- Mandatory when: `team_size >= 10 or compliance.categories includes 'budget-enforcement'`
- Conditional: never
- Exclude when: solo

### Success Criteria
- Soft warning fires at 80% budget
- Hard block at 100% with override audit
- Budget config surface for admins

### Failure Scenarios
- Scenario: Hard block triggers during critical incident response
  - Impact: Incident response slowed
  - Mitigation: incident-mode override with audit
- Scenario: Budget miscounts because token tracking drops events
  - Impact: Premature block
  - Mitigation: reconciliation against provider invoice

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AG-F003: Cost Attribution

**Status:** PLANNED (v1.2 Jul)

**What it is:** Cost rollup by feature, user, team, cost-center. Not shipped.

**When It Matters:** Cost attribution is the chargeback/showback story procurement teams require. Without it, AI spend cannot be allocated against the business units that benefit.

**Depth Spectrum:** Basic — single bucket. Standard — per-project. Advanced — per-feature, per-user. Enterprise — cost-center with chargeback reports.

**Signals:**
- Product idea references "chargeback", "showback", or "cost-center accounting" for AI spend
- Project profile shows multi-team org with internal billing or cost-center dimensions
- User statements describe procurement needing to allocate AI cost against benefitting business units

**Tradeoffs:**
- Per-feature and per-user rollup vs coarse per-project bucket: chargeback fidelity wins but demands mature AG-F001 token tracking upstream
- Proportional attribution on shared capabilities vs designated-owner rule: fair allocation wins but proportional math is harder to defend in an audit
- Invoice reconciliation within 5% variance vs unchecked rollup: trust wins but variance investigation workflow is mandatory operational surface

### Inclusion
- Default: **mandatory** for enterprise
- Mandatory when: cost-center accounting
- Conditional: never
- Exclude when: solo

### Success Criteria
- Cost rollup by feature, user, team, cost-center
- Reconciliation against vendor invoices within 5% variance
- Chargeback/showback report exportable

### Failure Scenarios
- Scenario: Attribution ambiguous for shared capability
  - Impact: Cost mis-allocated
  - Mitigation: attribution rule (proportional or designated owner)
- Scenario: Invoice reconciliation fails
  - Impact: Unexplained variance
  - Mitigation: variance investigation workflow

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Audit Attribution

**Status:** PARTIAL

**Rollup notes:** Evidence artifacts with play/agent/step attribution are written to STM. Post-merge learning extraction (distill, capture-learning) exists. Full audit trail, signed attribution, and compliance exports are not shipped.

**gap_items rollup:** Commit-trailer enforcement, tamper-evident storage, decision-search CLI/portal, historical decision replay, per-feature audit bundle generator, compliance report templates (SOC2/ISO27001/GDPR).

### AG-F004: AI-vs-Human Trail

**Status:** PARTIAL

**What it is:** Evidence files record agent vs user authorship at step granularity. Commit-level AI-vs-human attribution is not enforced.

**When It Matters:** Regulated industries require unambiguous attribution — which line was human-authored, which was AI-generated, who approved. Partial attribution doesn't satisfy audit.

**Depth Spectrum:** Basic — step-level attribution in evidence. Standard — commit trailer for AI-generated commits. Advanced — line-level attribution. Enterprise — tamper-evident signed attestation.

**Signals:**
- Product idea references "AI-vs-human attribution", "authorship trail", or "regulated audit readiness"
- Project profile declares `compliance.categories includes 'ai-usage-traceability'` or regulated-industry dimension
- User statements describe auditors asking "who wrote this" and inability to answer at commit or line granularity

**Tradeoffs:**
- Commit-trailer enforcement via hook vs trust-the-author: completeness wins but every human-authored commit also pays the overhead
- Line-level attribution vs step-level only: satisfies strict auditors but storage and diff-tool complexity grow significantly
- Tamper-evident signed attestation vs plain evidence: audit integrity wins but introduces signing-key operational surface

### Inclusion
- Default: **mandatory** for enterprise
- Mandatory when: `compliance.categories includes 'ai-usage-traceability'`
- Conditional: never
- Exclude when: solo personal use

### Success Criteria
- 100% of play-produced commits carry AI-authorship trailer
- Evidence files attribute every step
- Tamper-evident storage for attribution (planned)

### Failure Scenarios
- Scenario: AI-edited commit missing trailer
  - Impact: Attribution gap breaks audit
  - Mitigation: commit hook enforcement
- Scenario: Attribution tampered post-hoc
  - Impact: Audit invalidated
  - Mitigation: tamper-evident storage

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: evidence files used daily
- Scenarios observed: step-level attribution working
- Common mistakes: missing provenance header
- Last promoted: PARTIAL

---

### AG-F005: Decision Provenance

**Status:** PARTIAL

**What it is:** Decision Surfacing Discipline (tier-batched manifests) records choices in-play. Cross-play decision search and historical provenance queries not shipped.

**When It Matters:** "Why was this built this way?" is the most common audit question. Decision provenance turns that into a queryable artifact chain.

**Depth Spectrum:** Basic — decision log per play. Standard — manifest with tier rationale (current). Advanced — cross-play decision search. Enterprise — historical replay + divergence analysis.

**Signals:**
- Product idea references "decision history", "why was this built this way", or "searchable rationale"
- Project profile declares L3+ delivery ambition or regulated-industry audit requirements
- User statements describe repeated "why did we choose X" questions with no retrievable answer

**Tradeoffs:**
- Tier-batched manifest rigor (high/mid/low confidence) vs single-tier log: Decision Surfacing Discipline wins on audit fidelity but slows authoring
- Cross-play decision search vs per-play decision log: queryable corpus wins but ranking quality determines whether the corpus is used or ignored
- Historical replay with divergence analysis vs static log: diagnostic power wins but requires every decision to carry reproducible context

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: regulated industry
- Conditional: never
- Exclude when: throwaway projects

### Success Criteria
- Every inferred decision has tier-rationale
- Decision search returns relevant prior decisions for a given context
- Historical replay reproduces decision reasoning

### Failure Scenarios
- Scenario: Decisions recorded but silently resolved without manifest
  - Impact: Audit gap
  - Mitigation: Decision Surfacing Discipline rule
- Scenario: Decision search returns irrelevant results
  - Impact: Noise; decision corpus ignored
  - Mitigation: context-aware ranking

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: tier-batched manifests used in specify-product
- Scenarios observed: daily
- Common mistakes: silent resolution without manifest
- Last promoted: PARTIAL

---

### AG-F006: Evidence Export

**Status:** PARTIAL

**What it is:** briefs skill renders product YAML to JSON + HTML hub. Per-feature audit-bundle export not shipped.

**When It Matters:** Auditors want a bundle, not a file system. Evidence export packages the per-feature decision/evidence trail into an auditor-friendly artifact.

**Depth Spectrum:** Basic — zip of STM folder. Standard — structured JSON hub (current briefs). Advanced — per-feature audit bundle. Enterprise — auditor-template adapters.

**Signals:**
- Product idea references "audit bundle", "auditor-ready export", or "one-click compliance package"
- Project profile declares compliance audit requirement (SOC2, ISO27001, GDPR)
- User statements describe auditors rejecting raw file-tree access or demanding template-conforming artifacts

**Tradeoffs:**
- Per-feature audit bundle vs whole-project zip: navigability wins for auditors but bundle generator must resolve symlinks and cross-artifact links correctly
- Auditor-template adapters (SOC2/ISO27001) vs single canonical format: acceptance wins but every framework revision forces adapter updates
- On-demand generation vs pre-built bundles: freshness wins but on-demand generation latency can block audit interviews

### Inclusion
- Default: **mandatory** for compliance
- Mandatory when: compliance audit required
- Conditional: never
- Exclude when: non-regulated

### Success Criteria
- Per-feature audit bundle generated on demand
- Bundle includes intent, scope, epics, evidence, decisions
- Auditor-template adapters for SOC2 / ISO27001

### Failure Scenarios
- Scenario: Bundle misses artifacts linked from symlinks
  - Impact: Incomplete bundle
  - Mitigation: symlink resolution policy
- Scenario: Bundle format rejected by auditor tooling
  - Impact: Manual rework
  - Mitigation: format adapters

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: briefs used for product artifacts
- Scenarios observed: HTML hub generated
- Common mistakes: relying on file-tree browsing instead of bundle
- Last promoted: PARTIAL

---

### AG-F007: Compliance Reports

**Status:** PLANNED (v1.2 Jul)

**What it is:** SOC2 / ISO27001 / GDPR report templates not shipped.

**When It Matters:** Out-of-the-box compliance reports accelerate audit prep. Without templates, every audit is a bespoke document assembly.

**Depth Spectrum:** Basic — raw evidence. Standard — SOC2 template. Advanced — ISO27001 Annex A template. Enterprise — GDPR + data-handling + bespoke frameworks.

**Signals:**
- Product idea references "SOC2", "ISO27001", "GDPR", or "out-of-the-box compliance"
- Project profile declares `compliance.frameworks includes 'SOC2' or 'ISO27001' or 'GDPR'`
- User statements describe audit prep as bespoke document assembly repeated every cycle

**Tradeoffs:**
- Framework-version tracking per template vs single-version template: rejection-risk minimized but template maintenance cost grows with every framework revision
- Pre-flight gap scan vs generate-and-discover: late surprises avoided but pre-flight adds latency to every report generation
- Shipping SOC2 + ISO27001 + GDPR at launch vs one framework first: breadth accelerates enterprise sales but dilutes quality per framework

### Inclusion
- Default: **mandatory** for regulated
- Mandatory when: `compliance.frameworks includes 'SOC2' or 'ISO27001' or 'GDPR'`
- Conditional: never
- Exclude when: non-regulated

### Success Criteria
- SOC2 Type II template at launch
- ISO27001 Annex A template within first release
- GDPR data-handling report

### Failure Scenarios
- Scenario: Template outdated vs framework revision
  - Impact: Report rejected
  - Mitigation: framework-version tracking
- Scenario: Evidence gaps surface only during report generation
  - Impact: Late surprise
  - Mitigation: pre-flight gap scan

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

## Capability: Memory Governance

**Status:** PLANNED (v1.1 May)

**Rollup notes:** Memory architecture designed (ADR 009, ADR 017). No runtime access control, retention policy enforcement, or formal promotion/demotion workflow beyond manual.

**gap_items rollup:** Promotion UI / CLI, reviewer assignment, role model for memory layers, query-layer enforcement, formal promotion proposal + review, demotion/archival automation.

### AG-F008: LTM Curation

**Status:** PARTIAL

**What it is:** distill and capture-learning plays extract learnings but explicit curation (approve/reject/promote) surface is not shipped; promotion from Project LTM to Global KB is manual.

**When It Matters:** Memory quality determines methodology quality. Without curation, LTM accumulates noise; with curation, LTM compounds signal.

**Depth Spectrum:** Basic — manual LTM edits. Standard — distill + capture-learning (current). Advanced — curation UI with approve/reject. Enterprise — reviewer assignment + SLAs.

**Signals:**
- Product idea references "knowledge curation", "shared learning across teams", or "LTM quality control"
- Project profile shows multi-team or cross-project memory sharing where noise becomes a concern
- User statements describe LTM becoming noisy or rejected proposals lacking rationale

**Tradeoffs:**
- Reviewer assignment + SLAs vs self-service promotion: quality wins but introduces bottlenecks when reviewer capacity is constrained
- Rubber-stamp risk vs rigorous review: noise-free LTM wins only if reviewer quality metric is tracked
- Explicit approve/reject surface vs implicit distill-only flow: auditability wins but authoring friction grows

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: memory is shared across teams
- Conditional: never
- Exclude when: solo

### Success Criteria
- Every proposal has reviewer assignment
- Approve/reject produces audit evidence
- Rejected proposals have rationale

### Failure Scenarios
- Scenario: Unreviewed proposals accumulate
  - Impact: Backlog erodes trust
  - Mitigation: SLA + escalation
- Scenario: Approver rubber-stamps
  - Impact: Noise promoted
  - Mitigation: reviewer quality metric

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: distill + capture-learning used
- Scenarios observed: occasional
- Common mistakes: skipping distill after merge
- Last promoted: PARTIAL

---

### AG-F009: Access Control

**Status:** PLANNED (v1.2 Jul)

**What it is:** File-system permissions only today; no role-scoped or purpose-scoped access.

**When It Matters:** Enterprise requires role-scoped memory access — interns don't see strategy LTM, contractors don't see customer data. Without access control, memory must be partitioned at the file-system level, which is brittle.

**Depth Spectrum:** Basic — file-system perms. Standard — role-scoped. Advanced — purpose-scoped. Enterprise — attribute-based access control with audit.

**Signals:**
- Product idea references "role-scoped memory", "contractor segregation", or "attribute-based access"
- Project profile shows multi-role org (interns, contractors, full-time) with differentiated data access needs
- User statements describe brittle file-system partitioning or accidental cross-role memory exposure

**Tradeoffs:**
- Attribute-based access control vs role-scoped only: fine-grained policy wins but ABAC configuration is notoriously hard to audit for correctness
- Every-query audit logging vs sampled logging: compliance wins but query-layer throughput takes a hit
- Fail-closed default vs fail-open default: safety wins but early rollout generates false-deny friction until policy matures

### Inclusion
- Default: **optional**
- Mandatory when: multi-role enterprise
- Conditional: never
- Exclude when: single-role

### Success Criteria
- Role model defined
- Query-layer enforces role
- Access decisions audited

### Failure Scenarios
- Scenario: Role model too coarse
  - Impact: Over/under-access
  - Mitigation: attribute-based extension
- Scenario: Access audit incomplete
  - Impact: Compliance gap
  - Mitigation: every query logged

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: 0
- Scenarios observed: none
- Common mistakes: n/a
- Last promoted: never

---

### AG-F010: Promotion/Demotion Workflow

**Status:** PLANNED (v1.1 May)

**What it is:** STM→LTM and LTM→KB promotion is manual; no demotion (archive/retire) workflow beyond archive-issue-stm.

**When It Matters:** Knowledge lifecycle management is the hidden cost of persistent memory. Without promotion/demotion, LTM bloats and KB ossifies.

**Depth Spectrum:** Basic — manual copy. Standard — distill proposal (current). Advanced — formal promotion review. Enterprise — demotion automation with archive policy.

**Signals:**
- Product idea references "knowledge lifecycle", "promotion workflow", or "archive/retire stale content"
- Project profile shows multi-project org where KB ossification or LTM bloat is a real operational risk
- User statements describe skipping promotion post-distill or archive-deleting content still in use

**Tradeoffs:**
- Automated demotion with archive policy vs keep-everything: navigability wins but aggressive demotion risks losing the one decision someone needed
- Soft-archive with recall vs hard-delete: safety wins but storage grows; hard-delete is cheaper but irreversible
- Formal promotion review with SLA vs frictionless promotion: KB quality wins but promotion velocity suffers when reviewer bandwidth is tight

### Inclusion
- Default: **mandatory** for L3+
- Mandatory when: multi-project org
- Conditional: never
- Exclude when: solo

### Success Criteria
- Promotion proposals reviewed within SLA
- Demotion policy configured per LTM domain
- Archive workflow automated

### Failure Scenarios
- Scenario: Promoted content later invalidated
  - Impact: Stale KB
  - Mitigation: periodic KB review + demotion
- Scenario: Archive deletes content still needed
  - Impact: Knowledge loss
  - Mitigation: soft-archive with recall

### Cross-Tree Refs
- (none yet)

### Experiential
- Usage count: archive-issue-stm used manually
- Scenarios observed: manual promotion occasional
- Common mistakes: skipping promotion post-distill
- Last promoted: PARTIAL
