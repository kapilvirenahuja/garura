---
name: derive-logical-architecture
description: Read locked specify and design output and produce a technology-agnostic logical architecture: bounded contexts, components with responsibilities, data model, capability-level API surface, integration points, and an ADR log. Every boundary, entity, and grouping decision lands in a decision manifest.
version: 0.1.0
---

# derive-logical-architecture

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest-derive-logical-architecture.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `tech-architect` during `arch` Stage 1. Produces `logical-architecture.yaml` at `{product_base}architecture/logical-architecture.yaml`.

## Purpose

Transform locked specify and design artifacts into the technology-agnostic structural view of the system. This artifact is the anchor for every downstream arch skill — physical-architecture.yaml references component IDs from here, nfr-spec.yaml cites delivery mechanisms by component, and design-patterns.yaml scopes patterns by runtime tier declared here. Pure structure: no product names, no protocols, no wire formats, no programming languages.

## Input

Receive from the tech-architect agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `scope_path` (path, required) — `{product_base}scope/scope.yaml`
- `enriched_capabilities_path` (path, required) — `{product_base}scope/enriched-capabilities.yaml`
- `epics_dir` (path, required) — `{product_base}scope/epics/`
- `quality_profile_path` (path, required) — `{product_base}specification/quality-profile.yaml`
- `design_spec_path` (path, required) — `{product_base}experience/design-spec.md`
- `screens_dir` (path, required) — `{product_base}experience/screens/`
- `flows_dir` (path, required) — `{product_base}experience/flows/`
- `personas_path` (path, required) — `{product_base}experience/personas.md`
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`
- `output_path` (string, required) — `{product_base}architecture/logical-architecture.yaml`
- `decision_manifest_path` (path, required) — `{product_base}architecture/decision-manifest-derive-logical-architecture.yaml`

## Process

### 1. Read inputs

- Parse `scope.yaml` → selected capability list with IDs and names.
- Parse `enriched-capabilities.yaml` → per-capability business rules, invariants, and constraint notes.
- Glob `{epics_dir}/*.yaml` → every intent epic with `constraints`, `success_scenarios`, `failure_scenarios`, and business rules.
- Parse `quality-profile.yaml` → ISO 25010 characteristics with relevance and targets; security profile; compliance flags.
- Read `design-spec.md` → screen inventory summary, interaction patterns, user flow descriptions.
- Glob `{screens_dir}/*.md` → state counts per capability for complexity estimation.
- Glob `{flows_dir}/*.md` → user flows describing cross-component journeys.
- Read `personas.md` → functional roles and their capability interactions.
- Parse `project-profile.yaml` → compliance flags, integration requirements, data residency constraints, and any structural notes.

### 2. Validate pre-conditions

- Confirm all required input files exist and are readable. Missing input → structured failure with `what_failed: missing_input` and path.
- Confirm `scope.yaml` carries a non-empty `selected_capabilities` list. Zero capabilities → structured failure with `what_failed: empty_scope`.
- Confirm `scope.yaml` status is LOCKED (not DRAFT). DRAFT status → structured failure with `what_failed: upstream_not_locked`.
- Confirm `design-spec.md` status is LOCKED. DRAFT status → structured failure with `what_failed: upstream_not_locked`.

### 3. Enumerate logical decision slots

Before composing the primary artifact, enumerate every slot that requires an inferred structural decision:

| Slot | Decision type |
|------|---------------|
| Bounded context identification | Which capabilities cluster into the same context boundary |
| Component definition per capability | Name, responsibilities, owned state |
| Component ownership boundaries | Which data / state each component owns; where boundaries are drawn |
| Data model entities | Entities inferred from capability business rules and epic invariants |
| PII field identification | Which entity fields are PII based on compliance flags and epic data-handling rules |
| Entity relationships and invariants | Cardinality, integrity rules, TTL constraints |
| API surface grouping | Which capability operations cluster into a named API group |
| Integration point identification | Which external systems are implied by capability scope |
| Integration risk and mitigation | Vendor lock-in risk, boundary isolation strategy |
| ADR candidate identification | Decisions non-obvious enough to warrant a formal ADR |

Every slot resolved by inference — not echoed verbatim from the upstream artifacts — produces a manifest entry.

### 4. For each slot: classify grounding and build manifest entry

Walk every slot identified in Step 3:

1. **Direct echo from upstream.** If the decision is a verbatim read from an epic constraint or enriched-capabilities field (e.g., "TTL = 15 minutes idle" stated explicitly in a business rule), it is NOT an inferred decision — do not create a manifest entry. Echo it with a citation.
2. **Inferred from context.** If the decision requires synthesis across multiple upstream signals, create a manifest entry. Assign tier based on grounding:
   - `tier: high` — synthesized from explicit epic constraints, KB-grounded architectural patterns, or direct compliance flag requirements.
   - `tier: mid` — synthesized by cross-referencing multiple upstream signals without a single authoritative source; context-built.
   - `tier: low` — structural inference with no clear upstream driver. Must surface one-by-one before committing.
3. For multi-candidate structure decisions (e.g., "should capability X share a bounded context with Y or have its own?"), record both candidates, the driver that distinguishes them, and the recommendation.

### 5. Assemble logical-architecture.yaml

Compose the primary artifact with these sections:

**bounded_contexts** — named groupings of related capabilities:
```yaml
bounded_contexts:
  - id: bc-identity
    name: "Identity and Access"
    capabilities_included: [UM-F001, UM-F004]
    rationale: "These capabilities share the session and credential data model; grouping isolates auth from commerce logic per EPIC-user-login-001 constraint CTC-001."
    driver: "EPIC-user-login-001 CTC-001 / quality-profile.security relevance=critical"
```

**components** — one or more per selected capability, with tech-agnostic responsibilities:
```yaml
components:
  - id: comp-auth-service
    name: "authentication-service"
    type: service
    bounded_context: bc-identity
    capabilities_served: [UM-F001]
    responsibilities:
      - "Verify credentials and issue sessions"
      - "Enforce MFA gate per business rule UM-F001-BR-002"
      - "Expire sessions at TTL defined in enriched capabilities"
    owned_state: [session-record, credential-record]
    depends_on: [comp-user-profile-store, comp-mfa-handler]
    rationale: "Single responsibility boundary per EPIC-user-login-001; isolates session lifecycle so CTC-001 MFA enforcement is not scattered."
    driver: "EPIC-user-login-001 constraints.security"
```

**data_model** — entities, relationships, invariants. NO column types. NO storage engine. NO language-specific syntax:
```yaml
data_model:
  entities:
    - id: ent-user
      name: "User"
      primary_identifier: natural-key (email) or surrogate-key
      pii_fields: [email, phone]
      pii_source: "GDPR compliance flag in project-profile + UM-F001 business rule"
      invariants:
        - "email must be unique across all accounts"
        - "account must not be activated without verified identity"
      source: "UM-F001 enriched-capabilities business rules"
    - id: ent-session
      name: "Session"
      owner: ent-user
      ttl: "15 minutes idle, 8 hours absolute"
      ttl_source: "EPIC-user-login-001 business_rules"
  relationships:
    - from: ent-user
      to: ent-session
      cardinality: one-to-many
      invariant: "A user may hold at most 5 concurrent sessions (business rule UM-F001-BR-004)"
```

**api_surface** — capability-level operation groups. NO REST paths. NO HTTP verbs. NO GraphQL types:
```yaml
api_surface:
  - id: api-auth-ops
    name: "Authentication Operations"
    capabilities_covered: [UM-F001]
    operations:
      - "initiate-login"
      - "complete-mfa-challenge"
      - "refresh-session"
      - "terminate-session"
    consumers: [comp-web-frontend]
    rationale: "Design-exp flows show login as an entry gate for all user journeys; grouping these operations together ensures a single service boundary for session lifecycle."
    driver: "design flows/authentication-flow.md"
```

**integration_points** — external contracts. NO wire formats. NO SDK method calls:
```yaml
integration_points:
  - id: int-payment-processor
    name: "payment-processor"
    purpose: "process payment transactions and manage stored payment methods"
    capability: CM-F003
    interaction_pattern: "request-response (synchronous initiation, async confirmation)"
    boundary_isolation: "PaymentGateway abstraction component — payment processor is not called directly from any other component"
    risk: "vendor lock-in for tokenized card storage; potential PCI scope expansion"
    mitigation: "Isolate behind PaymentGateway interface; alternative processors listed in ADR"
    driver: "CM-F003 enriched-capabilities + project-profile.compliance PCI flag"
```

**component_capability_map** — explicit cross-reference satisfying C5:
```yaml
component_capability_map:
  - capability_id: UM-F001
    capability_name: "Login / Authentication"
    serving_components: [comp-auth-service, comp-mfa-handler]
    coverage: complete
  # every selected capability from scope.yaml must appear here
```

**adr_log** — starts empty; populated as architectural decisions accumulate across subsequent skills. Non-obvious decisions (≥2 viable alternatives AND narrows a future path) are recorded here:
```yaml
adr_log:
  - id: ADR-001
    title: "Single bounded context for identity and access"
    status: accepted
    date: "{ISO8601}"
    context: "UM-F001 and UM-F004 share the same session and credential model; two viable alternatives were to separate MFA into its own context or co-locate both under identity."
    alternatives:
      - "Separate MFA as its own bounded context (rejected: MFA is a sub-concern of authentication, not an independent business capability)"
    decision: "Co-locate login and MFA under a single bc-identity bounded context"
    rationale: "Avoids a distributed session check on every MFA challenge; complexity is bounded by the small capability set"
    drivers: ["EPIC-user-login-001 CTC-001", "quality-profile.security"]
    consequences:
      positive: ["Single session-ownership point; easier audit trail"]
      negative: ["Identity context grows if future capabilities are added to user management"]
```

### 6. Assemble primary artifact

Write `logical-architecture.yaml` to `{output_path}` with top-level metadata:

```yaml
slug: "<from project_profile.name>"
status: DRAFT
created_at: "<ISO-8601>"
play: arch
skill: derive-logical-architecture
upstream_artifacts:
  scope_path: <echoed>
  enriched_capabilities_path: <echoed>
  epics_dir: <echoed>
  quality_profile_path: <echoed>
  design_spec_path: <echoed>
bounded_contexts: [...]
components: [...]
data_model: [...]
api_surface: [...]
integration_points: [...]
component_capability_map: [...]
adr_log: [...]
```

### 7. Emit decision manifest

Write `decision-manifest-derive-logical-architecture.yaml` to `{decision_manifest_path}` with all entries collected in Step 4. Write the manifest BEFORE writing the primary artifact — no inferred decision may appear in the primary artifact before it is recorded here.

**Decisions to record** (decision_id prefix: `D-dla-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-dla-001` | `bounded-context-identification` | Which capabilities are grouped into the same context, and where context boundaries are drawn |
| `D-dla-002` | `component-definition` | For each capability, which components are defined, their types, and their responsibility scope |
| `D-dla-003` | `component-ownership-boundaries` | Which state each component owns and where the ownership boundary is drawn relative to neighboring components |
| `D-dla-004` | `data-model-entity-design` | Entities inferred from capability business rules — which entities are first-class vs. sub-fields, primary identifier strategy |
| `D-dla-005` | `pii-field-tagging` | Which entity fields are tagged PII and what handling obligation is inferred from compliance flags and epic rules |
| `D-dla-006` | `entity-relationship-invariants` | Cardinality choices and integrity invariants inferred from business rules and epic failure scenarios |
| `D-dla-007` | `api-surface-grouping` | Which capability operations cluster into a named API group and how group boundaries are drawn |
| `D-dla-008` | `integration-point-identification` | Which external systems are implied by the capability scope and the boundary isolation strategy chosen |
| `D-dla-009` | `integration-risk-mitigation` | For each integration, the risk identified and the boundary isolation approach |
| `D-dla-010` | `adr-candidate-identification` | Which decisions are judged non-obvious enough to warrant an ADR — the threshold applied (≥2 alternatives + future-path narrowing) |
| `D-dla-011` | `adr-rationale-synthesis` | For each ADR, which driver is the most compelling and why it outweighs the alternatives |

```yaml
schema_version: "1.0"
skill: "derive-logical-architecture"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-dla-001"
    decision_type: "bounded-context-identification"
    tier: high | mid | low
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the bounded context grouping recommended}"
    alternatives_considered:
      - alt: "{alternative grouping}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision type, with additional entries for each individual decision instance
```

### 8. Self-validation against constraints

Before returning, verify:
- C3: scan `bounded_contexts`, `components`, `data_model`, `api_surface`, `integration_points` for any product name (e.g., "PostgreSQL", "React", "AWS"), protocol identifier (e.g., "REST", "HTTP", "gRPC"), wire format token (e.g., "JSON", "Protobuf"), schema column type (e.g., "VARCHAR", "UUID", "INTEGER"), or programming language identifier (e.g., "async", "class", "interface"). If any found → halt, return structured failure with `what_failed: F3_tech_token_in_logical` and the offending token.
- C5: verify `component_capability_map` covers every capability in `scope.selected_capabilities`. Any capability with zero mapping entries → halt, return structured failure with `what_failed: F5_orphan_capability` and the capability ID.
- C4: verify every component has a non-empty `driver` field citing an upstream artifact. Any component with empty driver → structured failure with `what_failed: F4_missing_driver`.
- Decision manifest: verify every inferred decision (not verbatim-echoed fields) has a corresponding manifest entry. If any manifest entry is missing tier, grounding_source, recommendation, or alternatives_considered → structured failure with `what_failed: F19_manifest_incomplete`.

### 9. Return output contract

```yaml
logical_architecture:
  path: <written path>
  bounded_contexts_count: <int>
  components_count: <int>
  capabilities_covered: <int>  # must equal scope.selected_capabilities count
  entities_count: <int>
  api_groups_count: <int>
  integration_points_count: <int>
  adr_entries: <int>
  tech_agnostic_violations: 0  # must be 0 — any > 0 triggers F3
  orphan_capabilities: 0       # must be 0 — any > 0 triggers F5
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Outputs

```yaml
outputs:
  - path: "{product_base}architecture/logical-architecture.yaml"
    required: true
  - path: "{product_base}architecture/decision-manifest-derive-logical-architecture.yaml"
    required: true
```

## Constraints

- NEVER include any product name, protocol identifier, wire format token, schema column type, or programming language identifier in logical-architecture.yaml. This is the F3 gate — scan and halt if any implementation token is found.
- NEVER skip a capability. Every entry in `scope.selected_capabilities` must appear in `component_capability_map` with at least one serving component. Orphan capability is an F5 violation.
- NEVER cite a driver as "general best practice" or similar. Every driver must reference a specific epic ID, quality-profile field, compliance flag, or design artifact.
- NEVER write outside `{output_path}` and `{decision_manifest_path}`. This skill does not append to grounding-questions.md (no multi-candidate stack picks here — that is physical-architecture territory).
- NEVER commit an inferred decision to logical-architecture.yaml without recording it in the decision manifest first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.
- NEVER emit `source_type: agent_default_unilateral`. That tag exists only as a validator rejection target.
- ALWAYS include `alternatives_considered` with at least one entry for every manifest decision. If genuinely no alternative, state "none — only candidate" explicitly.
- ALWAYS include PII handling notes for every entity that has PII fields.
- ALWAYS populate `adr_log` with at least a placeholder structure even if no ADRs are generated at this stage — downstream skills append to it.
- ALWAYS verify tech-agnostic compliance (Step 8) before writing the primary artifact.

## DSD Compliance (C18/C19)

This skill emits a decision manifest alongside its primary artifact. Every inferred decision
(not user-provided input) lands in the manifest with tier, grounding_source, recommendation,
alternatives_considered, and user_response=null. The orchestrator walks the manifest after
this skill completes and drives the tiered surfacing flow before downstream skills read the
primary artifact. A manifest-free emission is a structural violation (F19).

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | architecture |
| Created | 2026-04-15 |
| Related | `core/components/agents/tech-architect.md`, `core/components/skills/derive-physical-architecture`, `core/components/skills/validate-architecture-spec` |
