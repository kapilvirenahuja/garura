---
name: validate-architecture-spec
description: Blocking validator for the six-artifact arch output contract (refined quality-profile, systems-inventory, logical-architecture, physical-architecture, tech-stack, technical-risks) plus their decision manifests. Enforces 22 checks derived from arch intent.yaml constraints and the artifact-verifiable failure conditions (F1-F12, F14-F16, F20-F23).
user-invocable: false
model: haiku
allowed-tools: Read, Write, Glob, Grep
---

# validate-architecture-spec

Called by `tech-architect` after every /arch derive skill completes. Blocking validator — any blocker violation causes `status: failed` and the calling play cycles back to the relevant stage.

This validator was rewritten for the model change in #403. The old shape enforced F1-F19 against five artifacts (logical, physical, nfr-spec, quality-vision, design-patterns). The new shape enforces against six artifacts (refined quality-profile, systems-inventory, logical, physical, tech-stack, technical-risks). The orchestrator-level failure conditions (F17 missing checkpoint, F18 whitelist bypass, F19 code emission, F24 hard-halt-on-missing-upstream) are NOT enforced here — they are play-orchestrator behaviors not artifact properties.

## Purpose

Enforce the /arch intent.yaml contract against the actual six-artifact output. Checks structural completeness, technology discipline, inventory grounding, layer model integrity, cycle absence, capability coverage, NFR delivery, pattern citation, risk shape, stage order, and decision-surfacing discipline across every artifact and every decision manifest.

## Input

Receive from the `tech-architect` agent via JSON contract. All paths resolve against `{product_base}` unless stated otherwise.

- `refined_qp_path` (path, required) — `{product_base}architecture/quality-profile.yaml`
- `inventory_dir` (path, required) — `{product_base}architecture/systems-inventory/`
- `logical_path` (path, required) — `{product_base}architecture/logical-architecture.yaml`
- `physical_path` (path, required) — `{product_base}architecture/physical-architecture.yaml`
- `tech_stack_path` (path, required) — `{product_base}architecture/tech-stack.yaml`
- `risks_path` (path, required) — `{product_base}architecture/technical-risks.yaml`
- `manifest_inventory_path` (path, required) — `{product_base}architecture/decision-manifest-derive-systems-inventory.yaml`
- `manifest_refine_qp_path` (path, required) — `{product_base}architecture/decision-manifest-refine-quality-profile.yaml`
- `manifest_logical_path` (path, required) — `{product_base}architecture/decision-manifest-derive-logical-architecture.yaml`
- `manifest_physical_path` (path, required) — `{product_base}architecture/decision-manifest-derive-physical-architecture.yaml`
- `manifest_tech_stack_path` (path, required) — `{product_base}architecture/decision-manifest-derive-tech-stack.yaml`
- `manifest_risks_path` (path, required) — `{product_base}architecture/decision-manifest-derive-technical-risks.yaml`
- `specify_qp_path` (path, required) — `{product_base}specification/quality-profile.yaml`. For delta_log integrity checks (V12).
- `scope_path` (path, required) — `{product_base}scope/scope.yaml`. For capability coverage (V4).
- `epics_dir` (path, required) — `{product_base}scope/epics/`.
- `project_profile_path` (path, required) — `{product_base}user-provided/project-profile.yaml`. For pin checks (V13).
- `kb_systems_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/systems/`. For KB-origin byte-for-byte check (V22).
- `kb_patterns_dir` (path, required) — `{ltm_base}components/memory/knowledge/arch/patterns/`. For pattern citation KB extension (V9).
- `output_path` (string, required) — `{product_base}architecture/validation-result.yaml`.

## Process

### Step 1 — Load all inputs

Parse each artifact and manifest. On any file missing or empty, record a V1 violation immediately but continue loading so the full violation set surfaces in one pass.

Load supporting context:
- `scope.selected_capabilities` — capability ID list.
- Parsed refined QP characteristics with relevance, target, delta_log.
- Parsed specify QP for delta_log diff (V12).
- All epic YAML files for failure_conditions and constraints.
- `project_profile.grounded_tools` map.
- Inventory map: glob `inventory_dir/*.md`, parse frontmatter for id, origin, capabilities_served, sub_systems[].
- KB systems catalog and KB patterns catalog: glob for indexing.

Collect all six manifests into a unified `all_decisions` list for cross-manifest checks (V14, V15, V16).

### Step 2 — V1: Artifact existence and non-emptiness (cites F1)

For each of the six canonical artifact paths:
1. Verify file exists (or, for inventory_dir, verify the directory has ≥ 1 .md file).
2. Verify primary section is non-empty:
   - `refined_qp_path` → `characteristics` map with ≥ 1 entry with `relevance != not_applicable`.
   - `inventory_dir` → ≥ 1 file with frontmatter `capabilities_served[]` non-empty.
   - `logical_path` → `components[]` length ≥ 1 AND `layer_model.layers[]` length ≥ 1.
   - `physical_path` → `components[]` length ≥ 1.
   - `tech_stack_path` → `entries[]` length ≥ 1.
   - `risks_path` → `risks[]` length ≥ 1.

Any missing or empty primary section is a **blocker**.

### Step 3 — V2: Logical purity scan (cites F2)

Scan every string in `logical_path` (component name, responsibilities, edge rationale, layer role text, capability_id text, system_ref display) against the tech-token deny-list (case-insensitive):

- Programming languages: JavaScript, TypeScript, Python, Go/Golang, Java, Kotlin, Ruby, PHP, C#, Rust, Swift, Dart, Elixir, Scala
- Runtimes: Node.js, Deno, Bun, JVM, CLR, V8, Wasm
- Frameworks/libraries: React, Vue, Angular, Svelte, Next.js, Nuxt, Express, Fastify, NestJS, FastAPI, Django, Flask, Spring, Rails, Laravel, .NET, ASP.NET
- Databases: PostgreSQL, MySQL, SQLite, MongoDB, DynamoDB, Cassandra, Redis, Memcached, Elasticsearch, Solr, Neo4j, Pinecone, Weaviate, MariaDB, Oracle
- Cloud products: AWS, Azure, GCP, Lambda, EC2, S3, RDS, ECS, EKS, GKE, AKS, Cloud Run, Cloud Functions, App Service, Cosmos DB, BigQuery, Firebase, Vercel, Netlify
- Messaging: Kafka, RabbitMQ, NATS, SQS, SNS, Pub/Sub, EventBridge, Kinesis
- Protocols: HTTPS, gRPC, GraphQL, REST, WebSocket, AMQP, MQTT, SOAP

Hit → V2 blocker with offending value and path.

### Step 4 — V3: Logical component shape (cites F3)

For every entry in `logical.components[]`:
- `system_ref` non-empty AND resolves to a file id in `inventory_dir`.
- `sub_system_ref` (when non-null) resolves to a `sub_systems[].id` inside that inventory file's frontmatter.
- `layer` non-empty AND matches a layer id in `logical.layer_model.layers[]`.
- `capability_ids[]` length ≥ 1.

Any missing/unresolved field → V3 blocker.

### Step 5 — V4: Capability coverage and end-to-end traceability (cites F4)

For every capability id in `scope.selected_capabilities`:
- At least one logical component has the capability id in `capability_ids[]`.
- At least one entry-layer component (component whose layer's `is_entry == true`) lists the capability.
- Graph traversal from each such entry-layer component along `outbound_edges[]` (ignoring `sync_mode: async` for graph purposes) reaches a component whose `system_ref` (or `sub_system_ref`) declares the capability in inventory's `capabilities_served[]`.

Orphans → V4 blocker per orphaned capability.

### Step 6 — V5: Cycle detection (cites F5)

Build directed graph from `logical.components.outbound_edges[]`, counting edges with `sync_mode: sync` and `sync_mode: hybrid`; excluding `sync_mode: async`. Run DFS, detect back-edges.

Build the same for `physical.components.comms[]`, with the same sync/hybrid-only rule.

Any cycle (logical or physical) → V5 blocker with cycle path.

### Step 7 — V6: Physical component shape (cites F6)

For every entry in `physical.components[]`:
- `logical_ref` non-empty AND matches a logical component id.
- `system_ref` non-empty AND equals the linked logical component's `system_ref` exactly.
- `layer` non-empty AND equals the linked logical component's `layer`.
- `deployment_target.kind` non-empty.
- `deployment_target.name` non-empty AND does NOT match the category-term deny-list (terms: "a database", "a relational database", "a queue", "a message queue", "an observability stack", "a frontend framework", "a CI system", "a search engine", "a cache", "a load balancer" — case-insensitive).
- `resources` block present.

Any failure → V6 blocker.

### Step 8 — V7: Mapping cardinality and layer match (cites F7)

For every `physical.components[]` entry:
- `logical_ref_cardinality` ∈ {one-to-one, many-to-one, one-to-many}.
- When `logical_ref_cardinality != one-to-one`, `cardinality_rationale` is non-empty.
- `layer` equals the linked logical component's `layer` (also checked in V6; repeated here for clarity in F7 mapping).

Any failure → V7 blocker.

### Step 9 — V8: NFR delivery coverage (cites F8)

For every characteristic in `refined_qp.characteristics` with `relevance != not_applicable`:
- At least one physical component's `nfr_delivery[]` has an entry with `nfr_characteristic` matching this characteristic, `target_reference` non-empty, `mechanism` non-empty, `rationale` non-empty.

Unmapped characteristic → V8 blocker per characteristic.

### Step 10 — V9: Pattern citation and system-level placement (cites F9)

For every `tech_stack.entries[]` with `category: pattern`:
- `pattern_citation.source` non-empty.
- `pattern_citation.reference` non-empty.
- Source matches the canonical allowlist (Gang of Four, PoEAA, DDD/Evans, Release It!/Nygard, Enterprise Integration Patterns/Hohpe-Woolf, Building Microservices/Newman, DDIA/Kleppmann, Cloud Native Patterns/Davis, microservices.io, IETF RFCs, OWASP, NIST, W3C, ISO/IEC) OR a KB pattern file exists at `{kb_patterns_dir}{pattern-id-or-name}.md` claiming the pattern.
- Source is NOT on the fabricated deny-list ("internal", "team standard", "{product_name}-pattern", "{team_name}-pattern", empty).

Verify every system-level decision (monolith, microservice, modular monolith, serverless — match by `name` against this set, case-insensitive) appears in tech-stack with `category: pattern`. If any of these names appears in a different artifact's primary content, that's a misplacement violation.

Any failure → V9 blocker.

### Step 11 — V10: Tech-stack entry shape (cites F10)

For every `tech_stack.entries[]`:
- `id` non-empty.
- `scope.kind` ∈ {components, components_in_layer, components_with_system_ref, global}.
- When `scope.kind != global`, `scope.targets[]` non-empty.
- `category` ∈ {language, runtime, framework, library, tool, pattern}.
- `name` non-empty.
- `source_type` non-empty.
- `rationale` non-empty.

Any failure → V10 blocker.

### Step 12 — V11: Technical risks shape and stage order (cites F11)

For every `risks.risks[]` entry:
- `id` non-empty.
- `risk_statement` non-empty.
- `trigger_conditions[]` length ≥ 1.
- `business_cost.kind`, `business_cost.magnitude`, `business_cost.cost_estimate`, `business_cost.rationale` all non-empty.
- `likelihood.level` ∈ {low, medium, high}; `likelihood.rationale` non-empty.
- `mitigation.action`, `mitigation.owner_role`, `mitigation.when`, `mitigation.delivery_cost` all non-empty.
- `residual_risk` non-empty AND NOT on the zero-residual deny-list (case-insensitive: empty, "none", "no residual", "fully mitigated", "eliminated", "n/a").
- `driver_refs[]` length ≥ 1; every entry has both `artifact` and `reference` non-empty AND `reference` resolves to a real path or in-artifact id.
- `discovered_by.scan` matches one of the eight defined scan kinds.

Stage order: confirm the five prior artifacts (`refined_qp_path`, `inventory_dir`, `logical_path`, `physical_path`, `tech_stack_path`) all exist before `risks_path` was written. (File mtime check: risks file's mtime must be ≥ each prior file's mtime.)

Any failure → V11 blocker.

### Step 13 — V12: Refined QP delta_log integrity (cites F12)

Read both `specify_qp_path` and `refined_qp_path`. Compute the diff per characteristic:
- For every characteristic where `target` or other content differs between specify and refined:
  - There must be a `delta_log[]` entry in refined QP citing this characteristic, with field, before, after, direction, driver.kind, driver.reference, rationale all non-empty.
  - `driver.reference` must resolve to a real artifact (inventory file, project_profile slot, epic id, regulation cite).
- For every characteristic where security target was loosened (refined target weaker than specify target) → V12 blocker (security ratchet violation).

Any failure → V12 blocker.

### Step 14 — V13: Source-type discipline across all manifests (cites F13)

Walk every entry in `all_decisions` (union of all six manifests):
- Every entry has a non-empty `grounding_source.kind`.
- No entry has `grounding_source.kind: agent_default_unilateral`.
- No entry's recommendation conflicts with a `project_profile.grounded_tools[]` pin for the same slot (cross-check: for any pin in project_profile, the corresponding decision must use the pinned value).

Any failure → V13 blocker.

### Step 15 — V14: Multi-candidate discipline (cites F14)

Walk every entry in `all_decisions`:
- When `grounding_source.kind: kb_catalog_multi_candidate_user_approved`, the citation must reference a `Q-arch-NNN` ID in `{product_base}user-provided/grounding-questions.md` OR a checkpoint ID where the user picked.
- When the citation is `Q-arch-NNN`, verify the question exists in grounding-questions.md.

Missing question or checkpoint citation → V14 blocker.

### Step 16 — V15: Decision surfacing (cites F15)

Walk every entry in `all_decisions`:
- `user_response` ∈ {accept, override, orbit, pending}.
- If `user_response: pending`, the validation result records a WARNING (not blocker) — the play orchestrator surfaces these at the next checkpoint. Validator's job is to flag them, not to block.
- If `user_response: override` or `orbit`, ensure `user_response_detail` is non-empty.

Override/orbit without detail → V15 blocker.

### Step 17 — V16: Manifest completeness (cites F16)

For each of the six manifests:
- File exists and parses cleanly.
- For each decision entry: `decision_id`, `decision_type`, `tier`, `grounding_source.kind`, `grounding_source.citation`, `recommendation`, `alternatives_considered[]` (may be empty but field present) all present.

Any missing field → V16 blocker.

### Step 18 — V20: Stage order broader check (cites F20)

File mtime ordering: refined_qp and inventory may be in either order; logical_path mtime ≥ both; physical_path ≥ logical_path; tech_stack_path ≥ physical_path; risks_path ≥ tech_stack_path.

Out-of-order → V20 blocker.

### Step 19 — V21: Layer model integrity (cites F21)

In `logical.layer_model`:
- `source` ∈ {project_profile_pin, kb_blueprint, user_authored}.
- `layers[]` length ≥ 2.
- Exactly one layer has `is_entry: true`.
- `layers[].order` values are unique positive integers.
- All layer `id` values are kebab-case (regex: `^[a-z][a-z0-9-]*$`).

In `logical.components[]`:
- Every `layer` field matches a layer id in `layer_model.layers[]`.

In `physical.components[]`:
- Every `layer` field matches the linked logical component's layer (also V6/V7 but rechecked here).

Any failure → V21 blocker.

### Step 20 — V22: Inventory provenance (cites F22)

For every file in `inventory_dir/*.md`:
- Frontmatter has `id`, `origin`, `provenance_summary`, `capabilities_served[]` non-empty.
- When `origin: kb`:
  - `kb_path`, `kb_version_sha`, `copied_at`, `editable: false` all present.
  - `kb_path` resolves to a real file under `kb_systems_dir`.
  - Computed SHA-256 of the KB file content at `kb_path` matches `kb_version_sha`.
  - The body of the inventory file (everything after the inventory frontmatter) matches the KB master byte-for-byte (after stripping the KB file's own frontmatter if any).
- When `origin: stm_research`:
  - `editable: true`.
  - All 7 required Markdown sections present (`When to Use`, `When to Avoid`, `Scale Profile`, `Capabilities Served`, `Sub-Systems`, `Tradeoffs`, `Anti-Patterns`) with non-empty body under each.

Any failure → V22 blocker.

### Step 21 — V23: Inventory grounding (cites F23)

For every `logical.components[].system_ref`:
- Resolves to a file id in inventory_dir.
- When `sub_system_ref` is non-null, the inventory file's frontmatter `sub_systems[]` contains a matching id.

For every `physical.components[].system_ref`:
- Equals the linked logical component's `system_ref` exactly.
- Resolves to inventory.

Unresolved → V23 blocker per offending component.

### Step 22 — Write result

Write `{output_path}`:

```yaml
status: passed | failed
violations:
  - id: V1 | V2 | ... | V23
    failure_bound: F1 | F2 | ...
    severity: blocker | warning
    artifact: {path}
    detail: |
      {prose description of the violation}
    offending_value: {string, when applicable}
warnings:
  - kind: pending_decision
    decision_id: ...
    detail: ...
summary:
  checks_run: 22
  blockers_count: <int>
  warnings_count: <int>
  artifacts_validated:
    - {path}
```

If `blockers_count == 0` → `status: passed`. Otherwise `status: failed`.

## Output Contract

On success (passed):

```json
{
  "status": "success",
  "skill": "validate-architecture-spec",
  "validation_status": "passed",
  "result_path": "{product_base}architecture/validation-result.yaml",
  "checks_run": 22,
  "warnings_count": <int>
}
```

On validation failure (validator ran cleanly but artifacts have blockers):

```json
{
  "status": "success",
  "skill": "validate-architecture-spec",
  "validation_status": "failed",
  "result_path": "{product_base}architecture/validation-result.yaml",
  "checks_run": 22,
  "blockers_count": <int>,
  "warnings_count": <int>,
  "first_offending_failure_bound": "F1 | F2 | ..."
}
```

On skill failure (validator itself broke):

```json
{
  "status": "failure",
  "skill": "validate-architecture-spec",
  "what_failed": "input_missing | input_unparseable | output_write_failed",
  "details": "..."
}
```

## Evals

| Eval | Check |
|------|-------|
| V1-1 | Validation result includes every blocker found, with id, failure_bound, severity, artifact path, and detail populated. |
| V1-2 | `status: passed` is only emitted when blockers_count == 0. |
| V1-3 | When any artifact is missing OR contains zero primary entries, V1 fires. |
| V1-4 | When logical contains a tech token from the deny-list, V2 fires with the offending value. |
| V1-5 | When physical's `deployment_target.name` matches the category-term deny-list, V6 fires. |
| V1-6 | When a refined-QP characteristic with `relevance != not_applicable` has no matching `nfr_delivery[]`, V8 fires per orphaned characteristic. |
| V1-7 | When any `category: pattern` entry has no `pattern_citation` or fabricated source, V9 fires. |
| V1-8 | When any inventory file lacks provenance fields OR a KB-origin file's body diverges from the KB master, V22 fires. |
| V1-9 | When any logical or physical `system_ref` does not resolve to inventory, V23 fires. |
| V1-10 | Stage-order mtime check fires when risks_path mtime < any prior artifact's mtime (V20). |

## Constraints

- Writes ONLY to `{output_path}`. Read-only on every input including KB.
- Continues past first failure so the full violation set is reported in one pass.
- A `pending` user_response is a WARNING, never a blocker — the play orchestrator surfaces them at checkpoints.
- The validator does NOT check orchestrator-level F17 (missing checkpoint), F18 (whitelist bypass), F19 (code emission), or F24 (hard-halt-on-missing-upstream) — those are play behaviors, not artifact properties.

## Failure modes (skill-level)

- `input_missing` — a required input path is absent. (Distinct from V1 which records the violation in the result file; this is when the validator can't even start.)
- `input_unparseable` — an artifact file cannot be parsed as valid YAML.
- `output_write_failed` — the validation result cannot be written.
