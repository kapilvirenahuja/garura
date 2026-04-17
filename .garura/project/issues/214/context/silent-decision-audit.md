# Silent Decision Point Audit

Three plays audited for inference decisions made without user presentation. The scope is to identify where agent/skill reasoning generates outputs without explicit user grounding, per Decision Surfacing Discipline Rule 11 (Auditable Inference Constraint).

---

## Play 1: specify-product

### Intent
Transform product idea + project profile into fully scoped, enriched intent epics. Shallow output is structurally impossible (validation gates).

### Invoked Skills & Decision Points

| Where | What | Source | Tag | Confidence | Notes |
|-------|------|--------|-----|-----------|-------|
| `configure-capabilities` Step 1b | Within-domain coverage gap analysis: match implied needs from project brief against KB feature catalog | Project brief language parsed against domain file `When It Matters` sections | `silent-LLM-reasoning` | mid | LLM classifies "full/partial/missing"; lists proposed actions (extend-existing, add-new, research). User sees gaps at checkpoint but decisions about classification origin silently. |
| `configure-capabilities` Step 1c | Vertical-vs-component classification: signal-based rules determine if feature is user-observable or subsystem | Feature name patterns, KB prose ("When It Matters", Depth Spectrum), cross-tree refs | `batch-derived-confirmed` | high | Rules in Step 1c are deterministic heuristics (name ends in "Agent", "Pipeline", etc.). Deterministic but inference still happens without user direction. |
| `configure-capabilities` Step 1d | Provenance tagging: classify feature source as brief_explicit, brief_inferred, rule_derived, assumption | Human reads brief text against feature description | `silent-LLM-reasoning` | medium | LLM judges whether brief "directly names" vs "implies via concrete language"; distinguishes between assumption and research_supplemental. Checkpoint surfaces assumption-sourced, but inference origin is silent. |
| `configure-capabilities` Step 1e | Inferences written to grounding-questions.md: decide which within-domain gaps, kb_defaults, assumptions warrant grounding questions | Gaps from 1b, source classifications from 1d, numeric values from rules | `silent-deterministic` | high | Deterministic rule: gaps with coverage="partial" or "missing" → question entry. But user never sees question-generation logic itself, only the output questions. |
| `enrich-capabilities` | Security/compliance ratchet-up: rules applied with upward enforcement (security_level=critical → NIST 800-63B AAL3) | Project profile security_level, compliance flags; business rules from KB | `batch-derived-confirmed` | high | Ratchet rules are deterministic (team_size=solo → qp_2_code_review=1). But which rules exist and where they are applied is silently reasoned. |
| `generate-intent-epics` Step 3 | Epic field population: problem_statement derived from market brief competitive gap + profile-specific constraint | Market brief prose + profile dimension + KB Failure Scenarios | `silent-LLM-reasoning` | medium | LLM synthesizes specific problem statement; choice of which competitive gap + which KB warning to weave is reasoned, not grounded. |
| `generate-intent-epics` Step 3 | Intent phrasing: convert success criteria to one-sentence measurable end-state | Success criteria from KB or derived from constraints | `silent-LLM-reasoning` | medium | LLM picks highest-impact success metric and phrases it. Choice of metric prioritization is silent. |
| `generate-intent-epics` Step 3 | Appetite computation: derive from project profile appetite or timeline + capability count | Profile appetite or (timeline / epic_count) heuristic | `silent-deterministic` | medium | Fallback heuristic is deterministic but user never sees derivation choice. |
| `generate-intent-epics` Step 2b | Component-to-parent merge: decide what rolls_up_into entry means; find parent in enriched list | Feature type classification from Step 1c; rolls_up_into field from KB | `batch-derived-confirmed` | high | Merge logic is deterministic (type="component" → find rolls_up_into target). User sees merged output but not merge decision origin. |
| `generate-intent-epics` Step 3 | Success scenario phrasing: map enriched Success Criteria to observable-outcome language (forbid "should", "smooth", "intuitive") | Success Criteria text + rule enforcer | `batch-derived-confirmed` | high | Forbidden-word list is deterministic. But LLM phrasing of scenario is reasoned inference. |
| `generate-intent-epics` Step 3 | Hypothesis format: "We believe {action} for {persona} will result in {outcome}..." | Epic intent, persona from success scenario, success metric | `silent-deterministic` | high | Template-filling is deterministic. Choice of persona and metric is silent. |
| `derive-quality-profile-from-epics` Step 3 | Constraint aggregation: pick strictest performance target when multiple epics cite different p95 budgets | Epics' constraints.performance fields | `silent-deterministic` | high | Deterministic (min function). But selection of "strictest wins" logic is silent. |
| `derive-quality-profile-from-epics` Step 3 | Security characteristic derivation: NIST standard "ratchets up" when any epic names a higher level | Epic constraints + profile security_level | `batch-derived-confirmed` | high | Ratchet rule is deterministic. But user never sees which epic drove the ratchet. |
| `derive-quality-profile-from-epics` Step 4 | Risk severity inference: severity=high when 3+ epics cite the same experiential warning | Warning count threshold | `silent-deterministic` | high | Threshold is deterministic (3+). But choice of threshold itself is silent. |
| `derive-quality-profile-from-epics` Step 5 | Security profile derivation: derive auth method from business_rules, encryption from compliance+rules | Epic business_rules, compliance constraints | `silent-LLM-reasoning` | medium | LLM infers "password vs MFA vs SSO" from rules prose; inference is not grounded. |

### Subtotal specify-product

- **Total decision points:** 15
- **user-asked:** 0
- **batch-derived-confirmed:** 6
- **silent-LLM-reasoning:** 6
- **silent-deterministic:** 3

---

## Play 2: design-exp

### Intent
Transform specify-product output (intent epics + scope + quality profile) into complete experience design: JTBD personas, screen inventory with state coverage, user flows, wireframes, design spec.

### Invoked Skills & Decision Points

| Where | What | Source | Tag | Confidence | Notes |
|-------|------|--------|-----|-----------|-------|
| `synthesize-personas` Step 2 | User-type candidate extraction: deduplicate roles from epic scenarios | Epic success_scenarios and failure_scenarios text | `silent-LLM-reasoning` | medium | LLM reads scenario descriptions and extracts implicit user roles. Deduplication ("End user in B2C" vs "consumer shopper" → one persona) is reasoned without grounding. |
| `synthesize-personas` Step 3 | JTBD job story synthesis: extract situation/motivation/outcome from epic scenarios and intent | Epic intent field + success_scenarios outcomes | `silent-LLM-reasoning` | medium | LLM synthesizes natural-language job story. Choice of which outcome to amplify and which scenario to use is reasoned, not grounded. |
| `synthesize-personas` Step 3 | Persona name selection: functional role name (end-user, admin, power-user) | Implied role from scenarios + KB domain hints | `silent-LLM-reasoning` | medium | LLM chooses name from inferred role. Name choice is reasoned. |
| `generate-screen-inventory` Step 2 | Screen derivation from capability: decide whether one or N screens needed | Capability depth, success scenario count, business rules | `silent-LLM-reasoning` | medium | LLM judges "does this capability warrant 1 primary + supporting screens or 1 only?" No grounded rule provided. |
| `generate-screen-inventory` Step 2 | Supporting screen decision: error recovery, confirmation, step-by-step flow determination | Failure scenarios, business rules mentioning multi-step | `silent-LLM-reasoning` | medium | LLM infers recovery screens from failure scenario prose. No explicit rule for "when to add a supporting screen". |
| `generate-screen-inventory` Step 2 | Admin screen decision: whether to generate separate admin-facing screens | Persona mapping (admin role), business rules mentioning "admin-level" | `silent-LLM-reasoning` | medium | LLM infers admin surfaces from rules prose and persona presence. No grounded rule. |
| `generate-screen-inventory` Step 3 | State enumeration per screen: pick from {default, loading, empty, error, populated, success, lockout, mfa_challenge} | Capability type, business rules, complexity | `silent-LLM-reasoning` | medium | LLM reasons "what state makes sense for THIS capability?" No deterministic rule provided; rule says "pick thoughtfully, don't pad". |
| `generate-screen-inventory` Step 3 | State description writing: craft per-state description text | Capability function + state semantics | `silent-LLM-reasoning` | low | LLM invents descriptions. Pure prose generation without grounding source. |
| `generate-screen-inventory` Step 3 | Component naming: pick component names (email-input, password-input, etc.) | Screen purpose + interaction requirements | `silent-LLM-reasoning` | low | LLM generates component list and names. No explicit KB or user input guiding component choice. |
| `generate-screen-inventory` Step 3 | Layout pattern assignment (centered-card, sidebar-content, two-column) | Screen complexity, screen count, design-spec hints | `silent-LLM-reasoning` | medium | LLM infers layout from design-spec and capability complexity. No grounded rule. |
| `generate-screen-inventory` Step 4 | Capability classification (user_surface vs substrate vs admin_only) | Capability type (vertical vs component), persona mapping | `batch-derived-confirmed` | high | Classification rule exists (user_surface is default; substrate/admin_only only when explicitly marked). But decision to mark a screen substrate is reasoned. |
| `map-user-flows` Step 2 | Flow graph construction: resolve screen navigation edges (entry/exit point matching) | Screen frontmatter entry_points ↔ exit_points | `batch-derived-confirmed` | high | Graph construction is deterministic (match exit of screen A to entry of screen B). User sees graph but not matching logic. |
| `map-user-flows` Step 3 | Persona→scenario assignment: which persona drives THIS success scenario? | Scenario text vs persona job story | `silent-LLM-reasoning` | medium | LLM judges "does this scenario belong to persona A or B?" based on text similarity. No explicit mapping rule. |
| `map-user-flows` Step 3 | Screen sequence for scenario: trace path from entry screen through completion | Screen entry/exit points + scenario outcome description | `silent-LLM-reasoning` | medium | LLM infers screen sequence from scenario outcome. No explicit path-tracing rule provided. |
| `map-user-flows` Step 3 | Recovery path design: from error screen, derive recovery steps | Failure scenario + mitigation field (if present) | `silent-LLM-reasoning` | medium | LLM invents recovery sequence if mitigation is vague. If mitigation names specific path, that's used — but LLM still infers intermediate screens. |
| `generate-wireframes` | Wireframe ASCII generation: design ASCII box-drawing per screen state | Screen description + component list + layout pattern | `silent-LLM-reasoning` | low | LLM generates ASCII layout. Pure stylistic generation without KB rule guidance. |
| `generate-wireframes` | Layout Spec authoring: turn wireframe + state description into structured layout section | Wireframe + state description + components | `silent-LLM-reasoning` | low | LLM authors Layout Spec prose. Pure inference. |
| `compile-design-spec` | Design-spec assembly and consolidation: decide section order, what to embed vs reference | Personas + screens + flows + wireframes | `batch-derived-confirmed` | high | Section order is deterministic (defined in intent C13). Assembly logic is deterministic. But page order and emphasis choices are reasoned. |

### Subtotal design-exp

- **Total decision points:** 18
- **user-asked:** 0
- **batch-derived-confirmed:** 3
- **silent-LLM-reasoning:** 14
- **silent-deterministic:** 1

---

## Play 3: build-arch

### Intent
Transform locked specify-product + design-exp output into architecture specification (architecture.yaml) + quality standards (quality-standards.yaml). Every technology is named; every decision cites upstream driver.

### Invoked Skills & Decision Points

| Where | What | Source | Tag | Confidence | Notes |
|-------|------|--------|-----|-----------|-------|
| `derive-architecture-spec` Step 2 | LTM knowledge loading: decide which LTM files to read and parse | `core/components/memory/knowledge/arch/` listing | `batch-derived-confirmed` | high | Skill reads all LTM files. Deterministic enumeration. But user never sees which files exist or how they're indexed. |
| `derive-architecture-spec` Step 3 (per slot) | Single-candidate KB selection: filter KB candidates against profile dimensions | KB file `When to Choose` / `When to Avoid` prose vs profile (team_size, delivery_ambition, budget, etc.) | `silent-LLM-reasoning` | medium | LLM parses KB prose and filters against profile dimensions. Filter criteria selection and prose interpretation are reasoned. |
| `derive-architecture-spec` Step 3 (per slot) | Multi-candidate question generation: decide which candidates to surface, format of Q-arch-NNN | Candidates from KB filter, dimension ambiguity | `silent-LLM-reasoning` | medium | LLM summarizes candidates and selects "default if forced". Choice of default and presentation order are reasoned. |
| `derive-architecture-spec` Step 3 (per slot) | Zero-candidate default proposal: invent a recommended technology when no KB candidate fits | Profile + drivers from epics/quality-profile/design-spec | `silent-LLM-reasoning` | low | LLM proposes default (e.g., "use gRPC" when KB has no messaging reference). Pure inference, no KB grounding. User approval required (good), but default was silent. |
| `derive-architecture-spec` Step 4 | Problem statement for architecture: synthesize drivers from epics + quality-profile + design-spec | Epic constraints, QP targets, screen state counts | `silent-LLM-reasoning` | medium | LLM writes rationale entries citing drivers. Prose writing is reasoned synthesis. |
| `derive-architecture-spec` Step 4 | Stack choice rationale: decide which driver is primary (performance, team_size, ecosystem) | Epic constraints + profile + quality-profile | `silent-LLM-reasoning` | medium | LLM prioritizes drivers (e.g., "performance budget dominates" vs "team_size dominates"). Priority choice is silent. |
| `derive-architecture-spec` Step 4 | Component inventory: decide which components to define per capability | Capability complexity, business rules, deployment model | `silent-LLM-reasoning` | medium | LLM infers "is this capability simple enough to be a single service or does it need sub-components?" No explicit rule. |
| `derive-architecture-spec` Step 4 | Component ownership (owns: [...] fields): decide what data/state a component owns | Business rules, data model hints from capability | `silent-LLM-reasoning` | medium | LLM infers responsibility boundaries. No explicit ownership rule provided. |
| `derive-architecture-spec` Step 4 | Data model entity design: decide which entities, which PKs, which relationships | Capability scope, business rules, feature interactions | `silent-LLM-reasoning` | medium | LLM designs relational shape. Pure inference from capability and rules. |
| `derive-architecture-spec` Step 4 | PII field tagging and encryption decisions | Capability scope, compliance flags from profile | `silent-LLM-reasoning` | medium | LLM infers "is this field PII?" and "does this field need encryption?" No explicit tagging rule. |
| `derive-architecture-spec` Step 4 | API endpoint design: decide endpoint granularity and grouping | Screen actions + capability scope | `silent-LLM-reasoning` | medium | LLM infers REST endpoints from screens. Grouping and grain decisions are reasoned. |
| `derive-architecture-spec` Step 4 | Deployment model selection (monolith vs microservices vs serverless): pick primary shape | Project profile team_size, timeline, complexity, NFR | `silent-LLM-reasoning` | medium | LLM reasons "monolith fits team_size=4" but no explicit rule gate. Multi-candidate KB file exists but LLM still reasons selection. |
| `derive-architecture-spec` Step 4 | Integration point risk/mitigation definition | Integration vendor lock-in, data loss, vendor roadmap | `silent-LLM-reasoning` | low | LLM identifies risk and proposes mitigation (e.g., "isolate Stripe behind PaymentGateway interface"). Pure reasoning. |
| `derive-architecture-spec` Step 4 | ADR creation: decide which decisions are "non-obvious" enough to warrant ADR | Decision uniqueness, number of viable alternatives, future-path narrowing | `silent-LLM-reasoning` | medium | LLM judges "is this an ADR-worthy decision?" (at least 2 alternatives + narrows future). No explicit threshold. |
| `derive-architecture-spec` Step 4 | ADR rationale synthesis: pick the most compelling driver from list of alternatives | Competing drivers from profile/epics/quality/design | `silent-LLM-reasoning` | medium | LLM selects and prioritizes drivers in ADR rationale. Choice of emphasis is reasoned. |
| `derive-quality-standards` Step 2 | QP dimension standard recommendation: per QP level (1-4), select tooling and thresholds | LTM quality-standards per dimension + level | `batch-derived-confirmed` | high | LTM files define standards per level. Selection is deterministic (read level 3 → pick level 3 standards). But which tooling variant (Jest vs Vitest) is reasoned when multiple are listed. |
| `derive-quality-standards` Step 2 | Threshold setting: "≥80% line coverage" vs "≥75%" choice | Project profile risk appetite, epic failure scenarios | `silent-LLM-reasoning` | medium | LLM adjusts LTM threshold based on profile/epics. Adjustment logic is reasoned. |
| `derive-quality-standards` Step 2 | Enforcement venue selection: "CI gate (blocking)" vs "CI gate (non-blocking)" vs "pre-commit" | Standard criticality, team preferences (inferred), timing | `silent-LLM-reasoning` | medium | LLM decides enforcement venue. No rule provided; reasoning is silent. |
| `derive-quality-standards` Step 3 | ISO 25010 coverage mapping: decide which standards cover which characteristics | Standard descriptions + characteristic definitions | `silent-LLM-reasoning` | medium | LLM maps tooling → characteristic (e.g., "k6 load test covers performance_efficiency"). Mapping is reasoned. |
| `derive-quality-standards` Step 3 | Gap identification: detect characteristics from quality-profile that have no standards | Profile characteristics + standards list | `batch-derived-confirmed` | high | Gap detection is deterministic (set difference). But decision that "no gap exists" is final without user review. |

### Subtotal build-arch

- **Total decision points:** 20
- **user-asked:** 0
- **batch-derived-confirmed:** 3
- **silent-LLM-reasoning:** 15
- **silent-deterministic:** 2

---

## Summary

### Aggregate Counts

| Category | Count |
|----------|-------|
| **Total decision points audited** | 53 |
| **user-asked** | 0 |
| **batch-derived-confirmed** | 12 |
| **silent-LLM-reasoning** | 35 |
| **silent-deterministic** | 6 |

### Fix Surface (Decision Surfacing Discipline)

**Primary gap:** `silent-LLM-reasoning` accounts for 66% of inferences (35/53). These are moments where the skill/agent reads KB prose, rules, or user inputs and makes a judgment call without explicit user review or KB rule grounding. Examples:

- Feature classification (vertical vs component) — rule-based but user never sees the signal matching process
- Persona synthesis — LLM extracts roles from epic scenarios and designs JTBD language without grounding
- Screen state enumeration — LLM judges "what states make sense?" with no deterministic rule
- Architecture slot resolution — LLM filters KB candidates using profile dimensions; filter interpretation is reasoned
- Quality-standard thresholds — LLM adjusts baseline thresholds per project risk without explicit decision rule

**Secondary gap:** `silent-deterministic` (6/53) — deterministic derivations that are not exposed to user at all:
- Inferences appended to grounding-questions.md without user visibility into question-generation logic
- Constraint aggregation (pick strictest target) — logic is silent even though deterministic
- Risk severity inference (3+ epics = high severity) — threshold choice is silent

### Proposed Tier Allocation (for Decision Surfacing Discipline)

| Decision Class | Proposed Tier | Rationale |
|----------------|---------------|-----------|
| `silent-LLM-reasoning` (feature classification, persona synthesis, screen states, component ownership, API design, risk identification) | **HIGH** | Reasoning happens over KB/user prose; user should see the inferred classification before it propagates. Recommend grounding questions for all tier-2+ decisions. |
| `silent-deterministic` (question generation, constraint aggregation, risk severity, threshold ratchets) | **MID** | Deterministic but operation is hidden. Recommend audit-trail or summary at checkpoints. |
| `batch-derived-confirmed` (component merge, graph construction, section ordering) | **LOW** | Already deterministic rules in code; user has checkpoint gates. Lower priority. |

---

## Defect Linkage

This audit informs:
- **Defect 11 (D11 Phase A):** `derive-architecture-spec` silent multi-candidate handling. Spec now requires Q-arch-NNN grounding questions; unilateral defaults blocked. Partial fix in place.
- **Defect 12 (D12):** `configure-capabilities` within-domain gap analysis (Step 1b) produces gaps without showing classification logic. User sees gaps at checkpoint but not how gaps were identified.
- **Defect 14 (D14):** `synthesize-personas` and `generate-screen-inventory` produce JTBD personas and screen inventories via LLM reasoning with no KB rule reference. User sees output but not inference origin.
- **Rules/Product.md Rule 11:** Auditable Inference Constraint. This audit quantifies the gap and prioritizes fixes.

