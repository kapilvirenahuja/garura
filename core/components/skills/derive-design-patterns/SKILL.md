---
name: derive-design-patterns
description: Read logical architecture, physical architecture, and nfr-spec to produce design-patterns.yaml — the pattern catalog applied to this product at every applicable layer: system-level, layer-level, component-level (per runtime tier), and cross-cutting. Every pattern carries applicability scope, a cited driver, alternatives considered, and source_type.
version: 0.1.0
---

# derive-design-patterns

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest-derive-design-patterns.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `tech-architect` during `arch` Stage 5. Produces `design-patterns.yaml` at `{product_base}architecture/design-patterns.yaml`.

## Purpose

Turn the structural (logical) and technology (physical) decisions into a pattern catalog that governs how the codebase is built. A new developer reading design-patterns.yaml must understand the structural rules of the codebase before reading a single file. Pattern coverage is validated by layer: missing a layer is F9. Every pattern pick is a decision — source_type applies (C16) and every decision lands in the manifest.

This skill also resolves forward references from nfr-spec.yaml: any NFR whose `delivery_mechanism` was tagged `status: forward_ref_pending_design_patterns` must be satisfied by a pattern in this file. After this skill completes, the orchestrator updates those NFR entries to `resolved: true`.

## Input

Receive from the tech-architect agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `logical_architecture_path` (path, required) — `{product_base}architecture/logical-architecture.yaml` (component list, bounded contexts, runtime tier types declared in components)
- `physical_architecture_path` (path, required) — `{product_base}architecture/physical-architecture.yaml` (stack picks, deployment_topology.runtime_tiers — each tier type here must have a component-level pattern entry)
- `nfr_spec_path` (path, required) — `{product_base}architecture/nfr-spec.yaml` (NFRs naming resilience, idempotency, or consistency as drivers trigger required cross-cutting patterns; forward references must be resolved)
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml` (team_size, delivery_ambition, compliance flags)
- `grounding_questions_path` (path, required) — `{product_base}user-provided/grounding-questions.md` (append target for multi-candidate ambiguities; read at start)
- `ltm_architecture_path` (path, required) — `{ltm_base}knowledge/arch/` (KB pattern catalog: `arch/patterns/`)
- `output_path` (string, required) — `{product_base}architecture/design-patterns.yaml`
- `decision_manifest_path` (path, required) — `{product_base}architecture/decision-manifest-derive-design-patterns.yaml`

## Process

### 1. Read inputs

- Parse `logical-architecture.yaml` → component list (IDs, types, bounded contexts). Identify runtime tier types (web, api, worker, data) from the component types.
- Parse `physical-architecture.yaml` → `deployment_topology.runtime_tiers` (the authoritative list of runtime tiers for this product) + stack picks (these constrain which patterns apply; a pure frontend has no backend layer patterns).
- Parse `nfr-spec.yaml` → scan all NFR entries for `characteristic` values. Specifically check if any NFR has `characteristic` in (`reliability`, `security`, `integrity`) and if `delivery_mechanism.description` or `verification_method.scenario` mentions resilience, idempotency, retry, consistency, or outbox. Collect these as **cross-cutting triggers**.
- Also collect any `forward_ref_pending_design_patterns` entries from nfr-spec.yaml — these are pattern IDs that must be satisfied by this skill's output.
- Parse `project-profile.yaml` → team_size, delivery_ambition, complexity flags.
- Read `{grounding_questions_path}` to reuse prior answers.
- Read `{ltm_architecture_path}/_index.md` and `arch/patterns/*.md` — enumerate all pattern candidates per layer.

### 2. Validate pre-conditions

- Confirm `logical-architecture.yaml` is present with a non-empty `components` section. Missing → structured failure with `what_failed: missing_logical_architecture`.
- Confirm `physical-architecture.yaml` is present with a non-empty `deployment_topology.runtime_tiers` section. Missing → structured failure with `what_failed: missing_physical_architecture`.
- Confirm `nfr-spec.yaml` is present. Missing → structured failure with `what_failed: missing_nfr_spec`.
- Determine whether the product has a backend: if `deployment_topology.runtime_tiers` contains at least one entry with `type: api` or `type: worker`, the product has a backend. Record as `has_backend: true|false`.

### 3. Enumerate pattern slots and layer coverage requirements

**Required layers per C9/F9:**

| Layer | Required when |
|-------|---------------|
| `system_level` | Always — at least one entry required |
| `layer_level` | When `has_backend = true` — at least one entry required |
| `component_level` | At least one entry per declared runtime tier (web, api, worker, data) from `physical-architecture.yaml:deployment_topology.runtime_tiers` |
| `cross_cutting` | When any NFR names resilience, idempotency, or consistency as a driver (cross-cutting triggers from Step 1) |

An empty layer is F9. "We didn't pick any pattern" is not a valid answer at arch time.

### 4. For each slot: check grounded_tools → KB catalog → multi-candidate resolution

Use the same decision tree as physical-architecture (C15/C16 apply equally here):

1. **grounded_tools_pin check.** Is there a `project-profile.grounded_tools` entry for this pattern slot? If yes → use it. Tag `source_type: grounded_tools_pin`. Cite the slot key.
2. **KB candidate enumeration.** Read `arch/patterns/*.md` for the relevant layer and filter against project-profile dimensions (team_size, delivery_ambition, scale, has_backend, compliance, runtime tier count). Produce legitimate candidates.
3. **Single candidate?** Pick it. Tag `source_type: kb_catalog_single_candidate`. Cite the KB file and dimensions. Create manifest entry as `tier: high`.
4. **Multiple candidates?** Append Q-arch-NNN to grounding-questions.md. Mark slot `pending_user_approval`. After user answers → `source_type: kb_catalog_multi_candidate_user_approved`, cite Q-arch-NNN.
5. **Zero candidates / outside KB.** Propose default with rationale. Mark `pending_user_approval`. After approval → `source_type: agent_default_with_user_approval`.
6. **NEVER emit `source_type: agent_default_unilateral`.** F15.

### 5. Assemble design-patterns.yaml

**system_level** — one entry minimum:
```yaml
system_level:
  - id: pat-sys-001
    layer: system_level
    pattern: "modular_monolith"
    applicability_scope: "All components in logical-architecture.yaml within the same deployment unit"
    rationale_driver: "team_size=4, delivery_ambition=MVP — microservices overhead exceeds ops capacity; monolith-first with clear bounded contexts enables future extraction per EPIC-scale-001 trigger"
    alternatives_considered:
      - alt: "microservices"
        why_not: "Requires independent deployment, service mesh, distributed tracing, and inter-service auth — prohibitive for team_size=4 at MVP"
      - alt: "serverless-first"
        why_not: "Cold start latency conflicts with p95 ≤ 500ms NFR-001; stateful session management complicates function-per-request model"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/system-patterns.md — filter on team_size≤6, delivery_ambition=MVP yielded one candidate"
```

**layer_level** — one entry minimum when `has_backend = true`. Omit this section entirely when `has_backend = false`:
```yaml
layer_level:
  - id: pat-lay-001
    layer: layer_level
    pattern: "hexagonal"
    applicability_scope: "Backend API and worker components (comp-auth-service, comp-api-gateway, comp-notification-worker)"
    rationale_driver: "NFR-004 requires independently deployable components with zero cross-context imports; hexagonal ports enforce this boundary by making the domain core ignorant of delivery mechanism"
    alternatives_considered:
      - alt: "layered (n-tier)"
        why_not: "Layered allows cross-layer imports via passing references; dependency-cruiser enforcement is weaker without port abstractions"
      - alt: "clean_architecture"
        why_not: "Clean architecture is hexagonal with additional naming conventions; the extra ceremony is not justified for team_size=4 — hexagonal with ports is sufficient"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/layer-patterns.md — filter on NFR-004 + compliance=PCI yielded hexagonal as the dominant isolating pattern"
```

**component_level** — one entry per declared runtime tier:
```yaml
component_level:
  - id: pat-comp-web-001
    layer: component_level
    runtime_tier: web
    pattern: "component_with_hooks"
    applicability_scope: "React components in the frontend (comp-web-frontend, tier-web)"
    rationale_driver: "Next.js 14 App Router is the frontend stack; React's component model with hooks is the canonical pattern for stateful UI in this stack"
    alternatives_considered:
      - alt: "MVVM"
        why_not: "MVVM requires a ViewModel layer separate from the component; in Next.js App Router with server components, the server component itself acts as the ViewModel — a separate layer adds ceremony"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/component-patterns.md — filter on frontend_stack=Next.js 14"

  - id: pat-comp-api-001
    layer: component_level
    runtime_tier: api
    pattern: "repository"
    applicability_scope: "Data access layer in all backend API components (comp-auth-service, comp-api-gateway)"
    rationale_driver: "Prisma 5 (library_pins) provides the ORM; repository pattern wraps ORM calls behind an interface so the domain logic does not import Prisma directly — enables testability without a real database and fits hexagonal ports"
    alternatives_considered:
      - alt: "active_record"
        why_not: "Active Record couples domain objects to the ORM; incompatible with hexagonal layer pattern pat-lay-001 — domain core would import Prisma"
      - alt: "CQRS"
        why_not: "CQRS introduces a command/query split beneficial at high read:write ratio; current scale (team_size=4, delivery_ambition=MVP) does not justify the command bus overhead"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/component-patterns.md — filter on backend_stack=Node.js+Fastify + layer_pattern=hexagonal"

  - id: pat-comp-worker-001
    layer: component_level
    runtime_tier: worker
    pattern: "job_processor"
    applicability_scope: "Background worker components (comp-notification-worker)"
    rationale_driver: "BullMQ (queue in physical-architecture) uses a job processor model; pattern governs worker concurrency, error handling, and retry configuration"
    alternatives_considered:
      - alt: "event_sourcing"
        why_not: "Event sourcing requires an append-only event store and event replay infrastructure; notification use case is fire-and-forget, not audit-log-dependent"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/component-patterns.md — filter on queue=BullMQ + worker scope"

  - id: pat-comp-data-001
    layer: component_level
    runtime_tier: data
    pattern: "unit_of_work"
    applicability_scope: "Data tier components (comp-user-profile-store, comp-order-store) using PostgreSQL via Prisma"
    rationale_driver: "Prisma's transaction API implements unit-of-work; explicit use of this pattern ensures multi-entity operations either commit fully or roll back — required by NFR-002 reliability target and EPIC-payment-001 BR-004 atomicity invariant"
    alternatives_considered:
      - alt: "none (individual queries)"
        why_not: "Individual queries without unit-of-work break atomicity; EPIC-payment-001 business rule BR-004 requires atomic order + payment state update"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/component-patterns.md — filter on data_store=PostgreSQL + framework=Prisma"
```

**cross_cutting** — required when any NFR names resilience, idempotency, or consistency. Omit only when no such NFR exists:
```yaml
cross_cutting:
  - id: pat-cc-001
    layer: cross_cutting
    pattern: "retry_with_exponential_backoff"
    applicability_scope: "All outbound calls from backend components to external integration points (int-payment-processor, int-email-provider)"
    rationale_driver: "NFR-002 availability target requires transient failure recovery; integration_points in logical-architecture carry a risk of transient network failure — retry with backoff is the baseline resilience pattern"
    alternatives_considered:
      - alt: "retry_with_fixed_delay"
        why_not: "Fixed delay can cause thundering herd under load; exponential backoff with jitter prevents synchronous retry storms"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/cross-cutting-patterns.md — filter on NFR.reliability + integration_count > 1"

  - id: pat-cc-002
    layer: cross_cutting
    pattern: "idempotency_key"
    applicability_scope: "Payment initiation endpoint and any state-mutating external API call (int-payment-processor)"
    rationale_driver: "EPIC-payment-001 business rule BR-004 requires atomic payment state; duplicate payment processing (from client retry on timeout) must not create double charges — idempotency key per request prevents this"
    alternatives_considered:
      - alt: "client-side deduplication only"
        why_not: "Client-side deduplication is not enforceable across sessions and network failures; server-side idempotency key is the only reliable mechanism"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/cross-cutting-patterns.md — filter on NFR.integrity + payment integration"

  - id: pat-cc-003
    layer: cross_cutting
    pattern: "circuit_breaker"
    applicability_scope: "Calls to int-payment-processor and any external service with hard SLA dependency"
    rationale_driver: "NFR-002 availability target (99.5%) requires that a degraded external service does not cascade into total system failure; circuit breaker opens on threshold and returns a safe fallback"
    alternatives_considered:
      - alt: "timeout_only"
        why_not: "Timeout without circuit breaker allows continuous slow retry against a degraded service; circuit breaker adds the open/half-open state that prevents cascade"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/patterns/cross-cutting-patterns.md — filter on NFR.reliability + external_dependencies > 0"
```

### 6. Forward reference resolution

After assembling all patterns, scan `nfr-spec.yaml` for entries with `delivery_mechanism.status = forward_ref_pending_design_patterns`. For each:
- Find the matching pattern in the output (by `expected_pattern` field).
- Confirm the pattern exists and its `applicability_scope` covers the NFR's context.
- If confirmed → record the resolution in the output contract as `forward_references_resolved`.
- If no matching pattern was emitted → structured failure with `what_failed: F6_forward_ref_unresolved` and the NFR ID.

### 7. Emit decision manifest

Write `decision-manifest-derive-design-patterns.yaml` to `{decision_manifest_path}` BEFORE writing the primary artifact.

**Decisions to record** (decision_id prefix: `D-ddp-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-ddp-001` | `system-level-pattern-selection` | Which system-level architectural pattern is selected (modular_monolith, microservices, serverless, event-driven) and the profile driver |
| `D-ddp-002` | `layer-level-pattern-selection` | Which layer-level pattern is selected for the backend (hexagonal, clean, layered, onion) — recorded only when has_backend=true |
| `D-ddp-003` | `component-level-pattern-selection` | For each runtime tier, which component pattern is selected (MVC, MVVM, repository, CQRS, event-sourcing, job_processor) and why it fits the stack |
| `D-ddp-004` | `cross-cutting-pattern-selection` | For each cross-cutting pattern emitted, which NFR driver triggered it and which alternatives were considered |
| `D-ddp-005` | `layer-coverage-determination` | How the layer coverage requirement is determined — which tiers exist, whether a backend exists, which cross-cutting triggers fired |
| `D-ddp-006` | `multi-candidate-question-generation` | For each slot with multiple KB candidates: the candidates, the dimension ambiguity, the Q-arch-NNN generated |
| `D-ddp-007` | `forward-reference-resolution` | For each forward reference from nfr-spec.yaml, which pattern in this file resolves it and whether the resolution is complete |

```yaml
schema_version: "1.0"
skill: "derive-design-patterns"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-ddp-001"
    decision_type: "system-level-pattern-selection"
    tier: high | mid | low
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the pattern selected and the primary driver}"
    alternatives_considered:
      - alt: "{alternative pattern}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision type, with additional entries per individual instance
```

### 8. Write primary artifact

Write `design-patterns.yaml` to `{output_path}`:

```yaml
slug: "<from project_profile.name>"
status: DRAFT
created_at: "<ISO-8601>"
play: arch
skill: derive-design-patterns
upstream_artifacts:
  logical_architecture_path: <echoed>
  physical_architecture_path: <echoed>
  nfr_spec_path: <echoed>
has_backend: true | false
runtime_tiers_covered: [web, api, worker, data]   # from physical-architecture deployment_topology
cross_cutting_triggered_by: [NFR-002, NFR-004]    # NFR IDs that triggered cross-cutting patterns
system_level: [...]
layer_level: [...]       # omit section entirely if has_backend = false
component_level: [...]
cross_cutting: [...]     # omit section entirely if no cross-cutting triggers fired
```

### 9. Self-validation against constraints

Before returning:
- C9/F9: verify `system_level` has at least one entry. Missing → structured failure with `what_failed: F9_missing_system_level`.
- C9/F9: if `has_backend = true`, verify `layer_level` has at least one entry. Missing → structured failure with `what_failed: F9_missing_layer_level`.
- C9/F9: for every `runtime_tier` in `physical-architecture.yaml:deployment_topology.runtime_tiers`, verify `component_level` has at least one entry with matching `runtime_tier`. Any uncovered tier → structured failure with `what_failed: F9_missing_component_level_tier` and the tier name.
- C9/F9: if any cross-cutting trigger fired, verify `cross_cutting` has at least one entry. Missing → structured failure with `what_failed: F9_missing_cross_cutting`.
- C16: verify every pattern entry carries a `source_type` field. Missing → structured failure with `what_failed: F15_missing_source_type`.
- F15: verify no `source_type: agent_default_unilateral` appears. If found → structured failure.
- Forward references: verify all `forward_ref_pending_design_patterns` entries from nfr-spec.yaml are resolved by a pattern in this file. Any unresolved → F6.
- F19: verify manifest has tier, grounding_source, recommendation, and alternatives_considered for every decision.

### 9. Return output contract

```yaml
design_patterns:
  path: <written path>
  has_backend: true | false
  system_level_count: <int>
  layer_level_count: <int>    # 0 if has_backend=false
  component_level_count: <int>
  runtime_tiers_covered: [<tier names>]
  cross_cutting_count: <int>
  cross_cutting_triggered: true | false
  forward_references_resolved: <int>
  forward_references_unresolved: 0    # must be 0 — any > 0 triggers F6
  layer_coverage_gaps: []            # must be empty — any entry triggers F9
  unresolved_slots:
    - slot: <pattern slot>
      question_id: <Q-arch-NNN>
      status: pending_user_approval
  grounding_questions_appended: <int>
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```

## Outputs

```yaml
outputs:
  - path: "{product_base}architecture/design-patterns.yaml"
    required: true
  - path: "{product_base}architecture/decision-manifest-derive-design-patterns.yaml"
    required: true
```

## Constraints

- NEVER leave a runtime tier without a component-level pattern entry. Every tier declared in `physical-architecture.yaml:deployment_topology.runtime_tiers` must have coverage. This is F9.
- NEVER omit a system-level pattern. At least one entry is always required. F9.
- NEVER omit a layer-level pattern when `has_backend = true`. At least one entry required. F9.
- NEVER omit cross-cutting patterns when any NFR names resilience, idempotency, or consistency as a driver. F9.
- NEVER commit a pattern slot to a single choice when the KB offered multiple legitimate candidates AND `grounded_tools` did not pin AND the user has not answered the Q-arch question. Walk the decision tree.
- NEVER override a `project-profile.grounded_tools` pin. F16.
- NEVER emit `source_type: agent_default_unilateral`. F15.
- ALWAYS tag every pattern with `source_type` and `source_citation`. Missing source_type is a C16 violation.
- ALWAYS resolve every `forward_ref_pending_design_patterns` from nfr-spec.yaml. Unresolved forward refs leave NFR-spec in an incomplete state (F6).
- ALWAYS include `alternatives_considered` with at least one entry per pattern. If truly no alternative, state "none — only candidate" explicitly.
- ALWAYS record rationale_driver by citing a specific upstream artifact: an NFR ID, an epic constraint, a quality-profile target, or a logical-architecture component ID. "Good practice" is not a valid driver.
- ALWAYS ground pattern choices in LTM architecture knowledge first. Use WebSearch only when LTM has no coverage for the slot.
- NEVER commit an inferred decision to design-patterns.yaml without recording it in the decision manifest first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.

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
| Related | `core/components/agents/tech-architect.md`, `core/components/skills/derive-logical-architecture`, `core/components/skills/derive-physical-architecture`, `core/components/skills/derive-nfr-spec`, `core/components/memory/knowledge/arch/patterns/` |
