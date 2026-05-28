---
name: derive-physical-architecture
description: Stage 4 skill of /arch. Builds the runtime physical architecture by mapping every logical component to one or more physical components, inheriting system_ref grounding from the inventory, picking specific deployment targets and resources, wiring comms with retry/idempotency stance, and naming a delivery mechanism for every NFR target in the refined quality profile. Mapping cardinality (1:1, N:1, 1:N) is recorded per physical component with rationale for non-trivial cases.
version: 1.0.0
user-invocable: false
---

# derive-physical-architecture

> **Decision Surfacing Discipline:** This skill emits a `decision-manifest-derive-physical-architecture.yaml` alongside its primary artifact. Every inferred decision — cardinality choice, deployment_target pick, resource sizing, comms protocol, retry/idempotency stance, NFR mechanism — is recorded with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `tech-architect` during `arch` Stage 4. Produces `physical-architecture.yaml` at `{product_base}architecture/physical-architecture.yaml` plus a decision manifest.

## Purpose

Build the runtime shape of the product. For every logical component, decide how it runs — where, on what resources, talking to whom, and with what mechanisms delivering the NFRs the refined quality profile describes. Physical components are NOT invented at physical-time; each is a runtime realization of an existing logical component and inherits its `system_ref` (and `sub_system_ref`) from the inventory grounding. The inventory-grounding chain — physical → logical → inventory — is the load-bearing trace that prevents architectural drift.

**Differences from the prior version (model change in #403):**
- `system_ref` now inherited from logical. Physical components NEVER invent systems.
- New `logical_ref_cardinality` field per physical component (`one-to-one | many-to-one | one-to-many`) with required rationale for non-trivial mappings.
- New `nfr_delivery[]` block per component — every refined-QP characteristic whose delivery falls in this component's scope appears here with mechanism. The prior separate `nfr-spec` artifact is gone; this block replaces it.
- `comms[]` now carries `retry` and `idempotency` stance per outbound edge.
- Cycle detection on the runtime graph: sync-only cycles forbidden, async edges break.
- `layer` on each physical component MUST equal the linked logical component's layer.

## Input

Receive from the `tech-architect` agent. All paths resolve against `{product_base}` and `{ltm_base}` supplied by the play via JSON contract.

- `logical_path` (path, required) — `{product_base}architecture/logical-architecture.yaml`. Stage 3 output.
- `refined_qp_path` (path, required) — `{product_base}architecture/quality-profile.yaml`. Stage 2 output.
- `inventory_dir` (path, required) — `{product_base}architecture/systems-inventory/`. Read for system Scale Profile and Tradeoffs to inform resource sizing and mechanism choice.
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`. `grounded_tools.physical[]` pins are authoritative; `compliance[]` flags constrain region/residency.
- `kb_platforms_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/platforms/`. Cloud and on-prem platform candidates.
- `kb_data_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/data/`. Data store candidates.
- `kb_operations_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/operations/`. Observability, CI/CD, IaC, security infrastructure catalogs.
- `flows_dir` (path, optional) — `{product_base}experience/flows/`. Traffic context for resource sizing.
- `output_path` (string, required) — `{product_base}architecture/physical-architecture.yaml`.
- `decision_manifest_path` (string, required) — `{product_base}architecture/decision-manifest-derive-physical-architecture.yaml`.
- `grounding_questions_path` (string, required) — `{product_base}user-provided/grounding-questions.md`. Append-only for multi-candidate halts.

## Output

### Physical architecture

YAML at `{output_path}`.

```yaml
components:
  - id: order-orchestrator-fn               # kebab-case, unique within components[]
    logical_ref: order-orchestrator         # MUST match a logical component id
    logical_ref_cardinality: one-to-one | many-to-one | one-to-many
    cardinality_rationale: |                # REQUIRED when cardinality != one-to-one; cites driver
      {prose — e.g. "1:N for HA replication driven by refined QP reliability 99.9% target"}
    system_ref: shopify-functions           # inherited from the linked logical component; MUST match inventory
    sub_system_ref: null                    # inherited from logical when present
    layer: process                          # MUST equal the linked logical component's layer
    deployment_target:
      kind: cloud-service | on-prem-class | saas | hybrid
      name: AWS Lambda (Node.js 20 runtime, ARM64)   # SPECIFIC product, never a category
      region: us-east-1
      availability: multi-az | single-az | global-edge | on-prem-dc
      source_type: project_profile_pin | kb_catalog_single_candidate | kb_catalog_multi_candidate_user_approved | agent_default_with_user_approval
      source_citation: {pin slot | kb file path | grounding-question id | checkpoint id}
    resources:
      compute: { vcpu: 0.5, memory_mb: 512 }
      storage: { kind: ephemeral | persistent, size_gb: 0.5 }
      scaling:
        kind: autoscale | fixed | scheduled
        min: 0
        max: 200
        signal: concurrent-requests | cpu | rps | queue-depth | manual
        rationale: {one line — citing QP target}
    comms:
      - to: inventory-api-svc               # another physical component id
        protocol: HTTPS/1.1 | HTTPS/2 | gRPC | AMQP-0.9.1 | Kafka-protocol | S3-SigV4 | ...   # named specifically
        sync_mode: sync | async | hybrid    # inherited from logical edge by default
        retry:
          policy: none | linear | exponential-backoff | dead-letter-queue
          max_attempts: <int>
          backoff_ms: <int>                 # initial; doubles per attempt for exponential
        idempotency:
          stance: not-required | required | conditional
          key_header: {name when stance = required}
          rationale: {one line — citing QP target or QP characteristic}
    nfr_delivery:
      - nfr_characteristic: reliability     # MUST match a characteristic in refined QP
        target_reference: |                 # short citation of the refined QP target this mechanism delivers
          {quote or paraphrase of refined QP characteristic.target}
        mechanism: |                        # the specific mechanism — named, not abstract
          AWS Lambda multi-AZ with provisioned concurrency 10, dead-letter SQS,
          and async retry policy 3x exponential
        rationale: |                        # how this mechanism delivers the target
          {2-4 lines of prose}
        source_type: ...
        source_citation: ...
      - nfr_characteristic: security
        target_reference: "OWASP ASVS Level 2 per refined QP"
        mechanism: |
          IAM execution role with least-privilege policy; KMS-encrypted environment;
          ALB WAF with OWASP managed rule set; VPC-only invocation
        rationale: ...
```

**Validation rules baked into the schema:**
- Every component's `logical_ref` matches a component id in `logical-architecture.yaml`.
- Every component's `system_ref` matches the linked logical component's `system_ref` (and `sub_system_ref` if present).
- Every component's `layer` equals the linked logical component's `layer`.
- `logical_ref_cardinality` is one of the three values; `cardinality_rationale` is required when value is not `one-to-one`.
- `deployment_target.name` is not a category term (deny-list check).
- Every comms.to references a real physical component id.
- Every nfr_delivery.nfr_characteristic matches a characteristic in the refined QP.

### Decision manifest

One YAML file at `{decision_manifest_path}` with entries for every inferred decision. Decision types: `cardinality`, `deployment_target`, `resources`, `comms_protocol`, `retry_policy`, `idempotency_stance`, `nfr_mechanism`.

```yaml
manifest:
  skill: derive-physical-architecture
  written_at: {ISO 8601 timestamp}
  decisions:
    - decision_id: PA-001
      decision_type: cardinality | deployment_target | resources | comms_protocol | retry_policy | idempotency_stance | nfr_mechanism
      component_id: order-orchestrator-fn
      tier: high | mid | low
      grounding_source:
        kind: project_profile_pin | kb_catalog_single_candidate | kb_catalog_multi_candidate_user_approved | inventory_constraint | refined_qp_target | upstream_artifact | agent_default_with_user_approval
        citation: {pin slot | kb file path | inventory file path | refined QP characteristic | grounding-question id | checkpoint id}
      recommendation: {summarized decision}
      alternatives_considered:
        - option: {alt}
          why_rejected: {one line}
      agent_reasoning_summary: |
        {2-4 line prose}
      non_obvious: true | false
      user_response: accept | override | orbit | pending
      user_response_detail: {free text — null when pending}
```

## Process

### 1. Read inputs

- Parse `logical_path` → list of logical components with id, layer, system_ref, sub_system_ref, capability_ids, inbound_edges, outbound_edges (with sync_mode).
- Parse `refined_qp_path` → characteristics with targets and relevance.
- Glob `inventory_dir/*.md` → parse frontmatter for each referenced system; read Scale Profile and Tradeoffs sections for resource and mechanism context.
- Parse `project_profile_path` → `grounded_tools.physical[]`, `compliance[]`, `region_constraints[]`.
- Glob `kb_platforms_dir`, `kb_data_dir`, `kb_operations_dir` → KB candidate sets per slot type.

### 2. Validate pre-conditions

- `logical_path` exists and parses cleanly.
- `refined_qp_path` exists.
- Every logical component's `system_ref` resolves to an inventory file. If any does NOT, halt with `what_failed: logical_system_ref_unresolved` — Stage 3 must re-run.
- Required inputs exist OR documented stand-in exists.

### 3. Decide cardinality per logical component

For each logical component, decide how many physical components implement it:

- **one-to-one** by default. The simplest correct shape.
- **one-to-many** when a refined-QP target forces replication, sharding, or tiered placement. Examples:
  - Reliability target requires multi-region active-active → split into per-region physical components.
  - Performance target requires read-replica fanout → one writer + N readers.
  - Compliance requires data-residency partitioning → per-region physical components for the same logical role.
- **many-to-one** when multiple logical components collapse into a single deployed surface. Justified only when:
  - The logical components share transactional boundaries that span the collapse (a transactional commit must touch both).
  - Operational simplicity at a tier where the QP targets do NOT require independent failure domains.
  - A latency budget makes a network hop infeasible and the logical edge is sync.
  - The collapsing components all share the same `system_ref` (you cannot collapse components grounded in different systems — that's an inventory boundary).

Every cardinality decision is recorded in the manifest with `decision_type: cardinality`. When cardinality != one-to-one, `cardinality_rationale` MUST cite an architectural driver (refined-QP target, project-profile pin, or inventory constraint).

### 4. Pick deployment_target per physical component

For each physical component:

1. **Pin check.** If `project_profile.grounded_tools.physical[]` carries an entry for the system_ref OR for the logical_ref id, use the pinned deployment_target. Decision tier `high`, source_type `project_profile_pin`.
2. **KB candidate query.** Walk `kb_platforms_dir` and inventory's Scale Profile for candidates that fit the system_ref's hosting model (SaaS systems have only one deployment_target — the vendor's; self-hosted systems offer cloud / on-prem / hybrid choices).
3. **Resolve by candidate count:**
   - Single → use it, tier `high`, source_type `kb_catalog_single_candidate`.
   - Multiple → halt the slot per C20: append `Q-arch-NNN` to grounding-questions or surface at the Stage 4 checkpoint. user_response pending. tier `mid`, source_type `kb_catalog_multi_candidate_user_approved`.
   - Zero → enter agent-default mode, surface one-by-one per C19 LOW tier with explicit alternatives and rationale.

`deployment_target.name` MUST be a specific product or class (AWS Lambda, AWS ECS Fargate, GCP Cloud Run, Azure App Service, Kubernetes 1.29 on EKS, on-prem VMware vSphere cluster, Salesforce SaaS, Stripe SaaS, etc.). Category terms ("a relational database", "a serverless platform") are a structural violation enforced at Step 9.

### 5. Size resources

For each physical component, derive `resources.compute`, `resources.storage`, `resources.scaling`:

- Read refined QP performance characteristic targets (p95 latency, throughput RPS, concurrent users).
- Read inventory system's Scale Profile section for the sweet-spot ranges.
- Read flows (when available) for traffic shape.
- Propose:
  - Compute size aligned to per-instance throughput needed to meet the QP target at expected concurrency.
  - Storage kind: `ephemeral` for stateless compute; `persistent` for data-bearing roles.
  - Scaling: `autoscale` with signal aligned to the dominant load axis (rps, queue-depth, cpu) and bounds derived from QP scale target and budget pins.

Record one manifest entry per component with `decision_type: resources`. Tier:
- `high` when the QP target is quantified and the KB Scale Profile maps cleanly.
- `mid` when QP target requires interpretation (e.g., qualitative reliability without numbers).
- `low` when neither — agent default; user must approve.

### 6. Wire comms per logical edge

For each outbound edge from the linked logical component, create one entry in this physical component's `comms[]`:

1. `to` = the physical component id implementing the logical edge's target. (When the target logical component has cardinality one-to-many, the physical edge fans out to all targets unless flows indicate a single-target affinity.)
2. `protocol` — choose specifically. Inherit hints from the logical edge's sync_mode (sync → request-response protocols: HTTPS, gRPC; async → messaging or event protocols: AMQP, Kafka-protocol, SNS-SQS; hybrid → typically sync RPC + async event).
3. `sync_mode` — carry forward from the logical edge.
4. `retry`:
   - When QP reliability target demands resilience: `exponential-backoff`, max_attempts 3-5.
   - When the callee is idempotent and ops-cost matters: `dead-letter-queue` for failed messages.
   - When neither: `none`.
5. `idempotency.stance`:
   - `required` whenever retry is non-`none` AND the operation is mutating.
   - `conditional` when the operation is read-only or naturally idempotent (GETs, snapshot queries).
   - `not-required` when neither.

Record one manifest entry per comms decision (`decision_type: comms_protocol`, `retry_policy`, `idempotency_stance`).

### 7. Name NFR delivery mechanisms

For each characteristic in the refined QP with `relevance != not_applicable`:

1. Determine which physical component(s) own delivery of this characteristic. Heuristics:
   - **Performance** → entry-layer + process-layer components.
   - **Reliability** → every layer; mechanisms specific to component role.
   - **Security** → entry-layer (WAF, TLS termination, auth), process-layer (authz, input validation), data-layer (encryption-at-rest, KMS).
   - **Maintainability / observability** → every component (logs, metrics, traces).
   - **Compatibility / portability** → process-layer and integration boundaries.
2. For each owning component, add one entry to `nfr_delivery[]`:
   - `nfr_characteristic` matches the refined QP characteristic.
   - `target_reference` quotes or paraphrases the refined QP target.
   - `mechanism` names the specific architectural device delivering the target (e.g., "AWS Lambda multi-AZ with provisioned concurrency 10, dead-letter SQS, and async retry policy 3x exponential", NOT "use a resilient runtime").
   - `rationale` ties mechanism to target.

Every refined-QP characteristic with `relevance != not_applicable` MUST appear in at least one component's `nfr_delivery[]`. An unmapped target halts with `what_failed: nfr_target_unmapped`.

### 8. Cycle detection on the runtime graph

Build a directed graph from `comms[]`. Apply the same async-break rule as logical: a cycle that includes at least one edge with `sync_mode: async` is acceptable; a sync-only cycle is forbidden.

When a sync-only cycle is detected, halt with `what_failed: runtime_sync_cycle` and structured details (cycle path, candidate breaks).

### 9. Validate output

Before returning:
- Schema rules from the Output section all hold.
- Every component's `system_ref` matches the linked logical component's `system_ref` exactly. Mismatch → `what_failed: inventory_grounding_break`.
- Every component's `layer` equals the linked logical component's `layer`.
- `deployment_target.name` does NOT match the category-term deny-list (terms like "a database", "a queue", "an observability stack", "a frontend framework", "a CI system"). Hit → `what_failed: category_term_in_physical`.
- Every refined-QP characteristic with relevance != not_applicable appears in at least one `nfr_delivery[]`. Miss → `what_failed: nfr_target_unmapped`.
- Decision manifest complete with one entry per inferred decision.

## Output Contract

On success:

```json
{
  "status": "success",
  "skill": "derive-physical-architecture",
  "outputs": {
    "physical_path": "{product_base}architecture/physical-architecture.yaml",
    "decision_manifest_path": "{product_base}architecture/decision-manifest-derive-physical-architecture.yaml",
    "component_count": <int>,
    "comms_count": <int>,
    "nfr_delivery_count": <int>,
    "decisions_count": <int>,
    "halted_slots": [
      { "kind": "deployment_target | resources | comms_protocol | nfr_mechanism", "component_id": "...", "grounding_question_id": "Q-arch-NNN" }
    ]
  }
}
```

On failure:

```json
{
  "status": "failure",
  "skill": "derive-physical-architecture",
  "what_failed": "missing_input | logical_system_ref_unresolved | inventory_grounding_break | category_term_in_physical | runtime_sync_cycle | nfr_target_unmapped | cardinality_without_rationale | layer_mismatch | manifest_incomplete",
  "details": "..."
}
```

## Evals

| Eval | Failure Bound | Check |
|------|---------------|-------|
| PA-1 | F6 (physical missing fields / uses category) | Every component has logical_ref, system_ref, layer, deployment_target.kind, deployment_target.name; no name matches the category-term deny-list. |
| PA-2 | F23 (physical system_ref not in inventory) | Every physical component's system_ref matches the linked logical component's system_ref exactly AND resolves to an inventory file id. |
| PA-3 | F7 (cardinality without rationale or layer mismatch) | Every component with `logical_ref_cardinality != one-to-one` has a non-empty `cardinality_rationale`; every component's `layer` equals the linked logical component's `layer`. |
| PA-4 | F8 (NFR without delivery mechanism) | Every refined-QP characteristic with `relevance != not_applicable` appears in at least one component's `nfr_delivery[]` with mechanism and rationale. |
| PA-5 | F5 (runtime sync cycle) | The directed graph of `comms[]` edges, ignoring `sync_mode: async` edges, is acyclic. |
| PA-6 | F16 (manifest missing/malformed) | Decision manifest exists with one entry per inferred decision; every entry has decision_id, decision_type, component_id, tier, grounding_source, recommendation, alternatives_considered. |
| PA-7 | F13 (source_type discipline) | No decision has `grounding_source.kind: agent_default_unilateral`. |
| PA-8 | C16 (KB read-only) | The skill wrote NO file under `kb_platforms_dir`, `kb_data_dir`, or `kb_operations_dir`. |

## Constraints

- Writes ONLY to `{output_path}`, `{decision_manifest_path}`, and (for multi-candidate halts) appends to `{grounding_questions_path}`.
- Read-only on `logical_path`, `refined_qp_path`, `inventory_dir`, `project_profile_path`, every KB directory.
- NEVER invents a system. `system_ref` inherited from logical; mismatch is structural violation.
- NEVER changes the layer assigned in logical. Layer mismatch is structural violation.
- NEVER names a category term in `deployment_target.name`, `comms.protocol`, or `nfr_delivery.mechanism`. Specific products only.
- NEVER duplicates the refined-QP target text — references it via `target_reference` citation.
- Respects C18/C19 surfacing tiers and C20 multi-candidate halt.

## Failure modes

- `missing_input` — required input path absent and no stand-in.
- `logical_system_ref_unresolved` — a logical component's system_ref does not resolve to inventory. Stage 3 must re-run.
- `inventory_grounding_break` — a physical component's system_ref does not match the linked logical component's system_ref.
- `category_term_in_physical` — deployment_target name, comms protocol, or nfr_delivery mechanism uses a category term instead of a specific product.
- `runtime_sync_cycle` — directed comms graph (ignoring async edges) has a cycle.
- `nfr_target_unmapped` — a refined-QP characteristic with `relevance != not_applicable` has no mapped nfr_delivery entry.
- `cardinality_without_rationale` — a component with `logical_ref_cardinality != one-to-one` lacks `cardinality_rationale`.
- `layer_mismatch` — a physical component's layer differs from the linked logical component's layer.
- `manifest_incomplete` — decision manifest missing or any entry lacks required fields.
