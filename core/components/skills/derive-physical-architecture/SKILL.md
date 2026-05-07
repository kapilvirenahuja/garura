---
name: derive-physical-architecture
description: Read logical-architecture.yaml and project-profile grounded tools to produce physical-architecture.yaml — every stack pick, deployment topology, data store, cache, queue, observability stack, auth infrastructure, and scaling strategy. Every slot names a specific product, never a category. Every decision carries source_type.
version: 0.1.0
user-invocable: false
---

# derive-physical-architecture

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest-derive-physical-architecture.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `tech-architect` during `arch` Stage 2. Produces `physical-architecture.yaml` at `{product_base}architecture/physical-architecture.yaml`.

## Purpose

Fill every "where it runs" slot with a specific, named product. logical-architecture.yaml is the structural anchor; this skill maps every component, context, and integration point onto real technology. Every slot must carry `source_type` to document how the selection was made — grounded tool pin, single KB candidate, multi-candidate user-approved, or agent default with user approval. `agent_default_unilateral` is a blocking failure.

## Input

Receive from the tech-architect agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `logical_architecture_path` (path, required) — `{product_base}architecture/logical-architecture.yaml` (from Stage 1; components, bounded contexts, integration points, and data model entities are the anchor)
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml` (carries `grounded_tools` pins + PP/NFR dimensions: team_size, delivery_ambition, budget_sensitivity, timeline, compliance, nfr_*)
- `quality_profile_path` (path, required) — `{product_base}specification/quality-profile.yaml` (NFR targets inform stack selection)
- `epics_dir` (path, required) — `{product_base}scope/epics/` (performance constraints in epics drive tier selection)
- `grounding_questions_path` (path, required) — `{product_base}user-provided/grounding-questions.md` (append target for multi-candidate ambiguities; read at start to re-use prior answers)
- `ltm_architecture_path` (path, required) — `{ltm_base}knowledge/arch/` (KB candidate catalog for every slot)
- `output_path` (string, required) — `{product_base}architecture/physical-architecture.yaml`
- `decision_manifest_path` (path, required) — `{product_base}architecture/decision-manifest-derive-physical-architecture.yaml`

## Process

### 1. Read inputs

- Parse `logical-architecture.yaml` → component list (IDs, types, responsibilities, depends_on), bounded contexts, integration points, data model entities.
- Parse `project-profile.yaml` → `grounded_tools` map (authoritative pins), PP dimensions (team_size, delivery_ambition, budget_sensitivity, timeline), compliance flags, NFR numeric targets.
- Parse `quality-profile.yaml` → performance targets, security level, observability depth, accessibility targets.
- Glob `{epics_dir}/*.yaml` → per-epic performance constraints and scaling requirements.
- Read `{grounding_questions_path}` at start — reuse any prior answers before generating new questions.
- Read `{ltm_architecture_path}/_index.md` and the relevant per-category files. LTM is the primary candidate source; web research is a fallback only when no LTM file covers the slot.

### 2. Validate pre-conditions

- Confirm `logical-architecture.yaml` is present and has a non-empty `components` section. Missing or empty → structured failure with `what_failed: missing_logical_architecture`.
- Confirm `project-profile.yaml` is readable. Missing → structured failure.
- Confirm `grounding-questions.md` is readable or creatable (may not exist yet — create if absent with header).

### 3. Enumerate physical slots and resolve via decision tree

Before composing the artifact, enumerate every slot that must be filled. For each slot, walk the decision tree in order:

**Slots to resolve:**

| Slot | KB directory |
|------|--------------|
| system-level pattern | `arch/patterns/` |
| frontend stack | `arch/stacks/frontend-*.md` |
| backend stack | `arch/stacks/backend-*.md` |
| data primary | `arch/data/relational.md`, `arch/data/nosql-*.md` |
| data cache | `arch/data/nosql-keyvalue.md` |
| message queue | `arch/data/messaging-queues.md` |
| search | `arch/data/search-engines.md` |
| vector store | `arch/data/vector-databases.md` (only if agentic/RAG in scope) |
| observability | `arch/operations/observability.md` |
| CI/CD | `arch/operations/ci-cd.md` |
| containerization | `arch/operations/containerization.md` |
| auth infrastructure | `arch/operations/security-infrastructure.md` |
| platform / hosting | `arch/platforms/` |
| deployment topology (environments, networks, runtime tiers) | derived from platform + components |
| scaling strategy | derived from NFR targets + platform selection |
| library pins | `arch/stacks/` per-stack library files |

**Decision tree for every slot:**

1. **grounded_tools_pin check.** Is there an entry in `project-profile.grounded_tools` that names this slot? If yes → use that exact value. Tag `source_type: grounded_tools_pin`. Cite `project-profile.grounded_tools.{slot_key}`. Done. This is the authoritative path — never override it.
2. **KB candidate enumeration.** Open the relevant KB directory. Read every file's `When to Choose` / `When to Avoid` prose. Filter against project-profile dimensions (team_size, delivery_ambition, budget_sensitivity, timeline, compliance, nfr_*). Produce the legitimate candidate set.
3. **Single candidate?** If filtering yields exactly one candidate → pick it. Tag `source_type: kb_catalog_single_candidate`. Cite the KB file and the dimensions that narrowed it. Create a manifest entry as `tier: high` (this is the D11 Phase A gap closure — single-candidate selections are NOT silently committed; they are recorded and surfaced as a batch-confirm flow). Done.
4. **Multiple candidates?** Do NOT pick silently. Append a question to `{grounding_questions_path}` using the Q-arch-NNN format. The question lists the candidates, the dimension ambiguity, and the default you would pick if forced. Mark the slot `status: pending_user_approval`. The orchestrator surfaces unresolved questions at the next checkpoint. Once the user answers, tag the chosen candidate `source_type: kb_catalog_multi_candidate_user_approved` and cite the Q-arch-NNN id.
5. **Zero candidates / slot outside KB catalog** (e.g., specific library or version pin). Propose a default with rationale and mark `pending_user_approval`. After user approval, tag `source_type: agent_default_with_user_approval`. NEVER commit this class unilaterally.
6. **NEVER emit `source_type: agent_default_unilateral`.** Writing it is a blocking failure (F15).

**Question format for `grounding-questions.md`:**

```markdown
### Q-arch-NNN — {slot name}

**Context:** {one-sentence driver — which epic/quality-target/profile dimension forced this slot}
**Candidates (from KB):**
- {candidate A} — {one-line why it survives the filter}
- {candidate B} — {one-line why it survives the filter}
**Default if forced:** {candidate + rationale}
**Blocking:** arch slot `{slot name}` — physical-architecture.yaml cannot ship until this is answered.
```

Append with a stable id (`Q-arch-001`, `Q-arch-002`, …) — never overwrite existing questions. Increment the counter from the last Q-arch-NNN already in the file.

**Halt behaviour.** When any slot has `pending_user_approval` or an unanswered Q-arch-NNN, still write a draft `physical-architecture.yaml` with each unresolved decision marked `status: pending_user_approval`, and return a non-empty `unresolved_slots` list in the output contract. Do not fabricate a pick to make the unresolved list empty.

### 4. Compose physical-architecture.yaml sections

**frontend_stack** — specific framework, version, and rendering strategy:
```yaml
frontend_stack:
  choice: "Next.js 14 App Router"
  version: "14.x"
  source_type: kb_catalog_single_candidate
  source_citation: "arch/stacks/frontend-react-nextjs.md — filter on team_size=4, delivery_ambition=MVP, nfr_performance=4 yielded one candidate"
  rationale: "SSR + ISR covers p95 page load target; App Router co-located routing fits screen count from design"
  drivers:
    - "EPIC-commerce-catalog constraint: performance"
    - "design-spec screen count: 45 screens / 3-5 states"
  logical_components_served: [comp-web-frontend]
```

**backend_stack** — specific runtime, language version, framework:
```yaml
backend_stack:
  choice: "Node.js 22 + Fastify 4"
  source_type: grounded_tools_pin
  source_citation: "project-profile.grounded_tools.backend_runtime"
  rationale: "Pinned by project profile — team expertise and ecosystem continuity"
  logical_components_served: [comp-auth-service, comp-api-gateway]
```

**data_stores** — one entry per data entity group, specific product and version:
```yaml
data_stores:
  - id: ds-primary
    purpose: "primary relational store for user, session, and order entities"
    choice: "PostgreSQL 16"
    hosting: "Neon (serverless Postgres)"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/data/relational.md — filter on budget_sensitivity=medium, compliance=PCI yielded one candidate"
    rationale: "ACID guarantees required by EPIC-payment-001 business rule BR-004; Neon removes ops overhead for team_size=4"
    drivers: ["EPIC-payment-001 BR-004", "project-profile.team_size=4"]
    logical_entities_served: [ent-user, ent-session, ent-order]
```

**cache** — specific product, version, and eviction policy:
```yaml
cache:
  choice: "Redis 7 via Upstash"
  source_type: kb_catalog_single_candidate
  source_citation: "arch/data/nosql-keyvalue.md — single serverless Redis offering for team_size≤6"
  rationale: "Session cache for MFA state and rate limiting per quality-profile.reliability target"
  drivers: ["quality-profile.performance_efficiency target p95<500ms"]
  logical_components_served: [comp-auth-service, comp-rate-limiter]
```

**queue** — specific product (omit if no async coupling justified):
```yaml
queue:
  choice: "BullMQ 5 on Redis"
  source_type: kb_catalog_single_candidate
  source_citation: "arch/data/messaging-queues.md — filter on scale=small yielded BullMQ as lightweight embedded option"
  rationale: "Email notification jobs and background data processing — EPIC-notification-001"
  drivers: ["EPIC-notification-001 async_dispatch requirement"]
```

**observability** — logging, metrics, tracing as named products:
```yaml
observability:
  logs:
    choice: "structured JSON to stdout → Axiom ingest"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/operations/observability.md"
    rationale: "Managed log aggregation with zero self-hosted ops; team_size=4"
  metrics:
    choice: "Prometheus exposition format + Grafana Cloud"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/operations/observability.md"
  traces:
    choice: "OpenTelemetry SDK + Jaeger (self-hosted dev) → Grafana Tempo (prod)"
    source_type: agent_default_with_user_approval
    source_citation: "checkpoint:1 — user approved Grafana stack at Stage 1 checkpoint"
```

**auth_infra** — specific auth product and protocol implementation:
```yaml
auth_infra:
  choice: "NextAuth.js 5 (Auth.js) with OAuth2 providers + TOTP MFA"
  source_type: kb_catalog_single_candidate
  source_citation: "arch/operations/security-infrastructure.md"
  rationale: "MFA required by CTC-001; TOTP via speakeasy library; OAuth2 for social login per EPIC-user-login-001"
  drivers: ["CTC-001 MFA mandate", "EPIC-user-login-001 OAuth2 requirement"]
```

**platform_hosts** — per-environment hosting products:
```yaml
platform_hosts:
  frontend: "Vercel"
  backend: "Railway"
  data: "Neon (serverless Postgres) + Upstash (Redis)"
  source_type: kb_catalog_single_candidate
  source_citation: "arch/platforms/managed-platforms.md — team_size≤6, delivery_ambition=MVP"
```

**deployment_topology** — environments, network tiers, runtime components:
```yaml
deployment_topology:
  environments:
    - name: development
      description: "local Docker Compose for backend; local Next.js dev server; Neon dev branch"
    - name: preview
      description: "per-PR Vercel preview deploy + Railway ephemeral environment + Neon branch"
    - name: production
      description: "Vercel prod + Railway prod + Neon prod + Upstash prod"
  runtime_tiers:
    - id: tier-web
      type: web
      logical_components: [comp-web-frontend]
      host: Vercel
    - id: tier-api
      type: api
      logical_components: [comp-auth-service, comp-api-gateway]
      host: Railway
    - id: tier-worker
      type: worker
      logical_components: [comp-notification-worker]
      host: Railway
    - id: tier-data
      type: data
      logical_components: [comp-user-profile-store, comp-order-store]
      host: Neon + Upstash
  networks:
    - "Frontend (Vercel edge) → API (Railway) over HTTPS"
    - "API → Data stores over private Railway network"
```

**scaling_strategy** — named approach per runtime tier:
```yaml
scaling_strategy:
  web: "Vercel automatic edge scaling — no config required"
  api: "Railway horizontal scaling; autoscale to 3 replicas when CPU > 70%"
  worker: "Railway min=1 max=3; queue depth-based autoscale"
  data: "Neon autoscaling 0.25–4 CUs; Upstash per-request serverless"
  rationale: "NFR: p99 availability=99.5% from quality-profile; autoscale covers burst without over-provisioning for team_size=4"
  drivers: ["quality-profile.reliability target=99.5%", "project-profile.budget_sensitivity=medium"]
```

**library_pins** — named libraries with versions per stack layer:
```yaml
library_pins:
  - name: "Prisma 5"
    layer: backend
    purpose: "ORM and migration management for PostgreSQL data model"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/stacks/backend-nodejs.md"
  - name: "Zod 3"
    layer: backend
    purpose: "runtime schema validation at API boundary"
    source_type: kb_catalog_single_candidate
    source_citation: "arch/stacks/backend-nodejs.md"
```

### 5. Multi-candidate slot handling

For every slot that produced multiple KB candidates and a Q-arch-NNN question:
- Write the slot into the primary artifact with `status: pending_user_approval` and `question_id: Q-arch-NNN`.
- Do not write a product name for unresolved slots — write `"{Q-arch-NNN}: awaiting user selection"`.
- Append the question to `grounding-questions.md`.
- Record the multi-candidate decision in the manifest as a `D-dpa-003` entry type.

### 6. Assemble primary artifact

Write `physical-architecture.yaml` to `{output_path}`:

```yaml
slug: "<from project_profile.name>"
status: DRAFT
created_at: "<ISO-8601>"
play: arch
skill: derive-physical-architecture
upstream_artifacts:
  logical_architecture_path: <echoed>
  project_profile_path: <echoed>
  quality_profile_path: <echoed>
frontend_stack: ...
backend_stack: ...
data_stores: [...]
cache: ...
queue: ...
observability: ...
auth_infra: ...
platform_hosts: ...
deployment_topology: ...
scaling_strategy: ...
library_pins: [...]
```

### 7. Emit decision manifest

Write `decision-manifest-derive-physical-architecture.yaml` to `{decision_manifest_path}` BEFORE writing the primary artifact.

**Decisions to record** (decision_id prefix: `D-dpa-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-dpa-001` | `ltm-knowledge-loading` | Which LTM files are enumerated and read as the architecture candidate catalog for this run |
| `D-dpa-002` | `single-candidate-kb-selection` | For each slot where KB filtering yielded exactly one candidate: the specific candidate chosen, the dimensions that narrowed the filter, and why other candidates were eliminated. Always `tier: high`. |
| `D-dpa-003` | `multi-candidate-question-generation` | For each slot with multiple KB candidates: the candidates presented, the default proposed if forced, and the dimension ambiguity that prevented silent resolution. Records the Q-arch-NNN generated. |
| `D-dpa-004` | `zero-candidate-default-proposal` | For each slot outside the KB catalog: the default proposed, the rationale, and that it is `pending_user_approval`. |
| `D-dpa-005` | `grounded-tools-pin-application` | For each slot resolved by a grounded_tools pin: the pin value used, the slot key, and confirmation it matches the logical component. |
| `D-dpa-006` | `stack-rationale-driver-pick` | Which driver (performance, team_size, ecosystem, compliance, cost) is the primary selection driver for each stack component. |
| `D-dpa-007` | `deployment-topology-design` | Environment structure, network topology, and runtime tier assignment inferred from component types and platform selection. |
| `D-dpa-008` | `scaling-strategy-selection` | The scaling approach for each runtime tier and the NFR/profile driver that justifies it. |
| `D-dpa-009` | `library-pin-selection` | Which libraries are pinned per stack layer and the KB source or rationale. |
| `D-dpa-010` | `observability-stack-composition` | Which logging, metrics, and tracing products are selected and how they compose into the observability tier. |
| `D-dpa-011` | `auth-infra-selection` | The specific auth product, MFA mechanism, and OAuth2 provider configuration. |
| `D-dpa-012` | `data-store-product-selection` | For each entity group, the specific data store product, version, and hosting choice. |
| `D-dpa-013` | `cache-selection` | The cache product selected and the use cases it covers (session, rate limiting, hot-path, etc.). |
| `D-dpa-014` | `queue-selection` | The queue product selected and the async use cases it covers. |
| `D-dpa-015` | `platform-hosting-selection` | The managed hosting products selected per tier and the team-profile driver (team_size, budget, ops overhead). |

```yaml
schema_version: "1.0"
skill: "derive-physical-architecture"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-dpa-002"
    decision_type: "single-candidate-kb-selection"
    tier: high   # always high — KB direct match with narrowing dimensions
    grounding_source:
      kind: kb_path
      ref: "{KB file path that survived the filter}"
      excerpt: "{When to Choose clause or filter dimension that selected this candidate}"
    recommendation: "{the single surviving candidate and the slot it fills}"
    alternatives_considered:
      - alt: "{eliminated candidate}"
        why_not: "{dimension that eliminated it}"
    agent_reasoning_summary: "{2-3 sentence description of the filtering process}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision type, with additional entries per instance
```

### 8. Self-validation against constraints

Before returning:
- C3: verify every stack choice names a specific product with a version — no category terms. Any category term → structured failure with `what_failed: F2_category_term` and the offending slot.
- C16: verify every decision entry in the manifest carries a `source_type` field. Missing source_type → structured failure with `what_failed: F15_missing_source_type`.
- F15: verify no `source_type: agent_default_unilateral` appears anywhere in the artifact or manifest. If found → structured failure.
- F16: verify no decision conflicts with a grounded_tools pin. If a slot covered by `project-profile.grounded_tools` uses a different value → structured failure with `what_failed: F16_grounded_tools_conflict`.
- F17: verify no decision tagged `source_type: kb_catalog_single_candidate` where the KB actually offered multiple valid candidates. Requires re-checking the candidate filter.
- F19: verify manifest has entries for all inferred decisions, with tier, grounding_source, recommendation, and alternatives_considered populated.

### 9. Return output contract

```yaml
physical_architecture:
  path: <written path>
  slots_filled: <int>
  slots_resolved_grounded_tools_pin: <int>
  slots_resolved_kb_single: <int>
  slots_resolved_kb_multi_user_approved: <int>
  slots_resolved_agent_default_user_approved: <int>
  unresolved_slots:
    - slot: <slot name>
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
  - path: "{product_base}architecture/physical-architecture.yaml"
    required: true
  - path: "{product_base}architecture/decision-manifest-derive-physical-architecture.yaml"
    required: true
```

## Constraints

- NEVER use category terms. Every technology is a named product with a version. "a relational database" is invalid; "PostgreSQL 16 on Neon" is valid.
- NEVER commit a slot to a single product name when the KB catalog offered more than one legitimate candidate AND `grounded_tools` did not pin it AND the user has not answered the Q-arch question. Walk the decision tree in Step 3.
- NEVER override a `project-profile.grounded_tools` pin. Pins are authoritative. Overriding is F16.
- NEVER emit `source_type: agent_default_unilateral`. That tag is the validator's rejection target; writing it is F15.
- NEVER silently commit a `kb_catalog_single_candidate` selection. Record in the manifest as `tier: high` and surface via the orchestrator's batch-confirm flow before physical-architecture.yaml is consumed downstream.
- ALWAYS tag every decision with `source_type` and `source_citation`. A decision without these fields is a schema violation (C16).
- ALWAYS ground technology choices in LTM architecture knowledge first. Use WebSearch only when LTM is silent on the slot.
- ALWAYS reference logical component IDs when specifying which components a stack or data store serves. Physical is mapped to logical — logical is the anchor.
- ALWAYS include `alternatives_considered` with at least one entry for every decision. If truly no alternative, state "none — only candidate" explicitly.
- NEVER commit an inferred decision to physical-architecture.yaml without recording it in the decision manifest first.
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
| Related | `core/components/agents/tech-architect.md`, `core/components/skills/derive-logical-architecture`, `core/components/skills/derive-nfr-spec`, `core/components/skills/validate-architecture-spec` |
