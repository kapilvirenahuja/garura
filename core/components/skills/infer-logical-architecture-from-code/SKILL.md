---
name: infer-logical-architecture-from-code
description: Infer a technology-agnostic logical architecture (bounded contexts, components, data model, capability-level API surface, integration points, ADR log) from scan-index.json plus prior codify proposals, during /codify. Used exclusively by tech-architect.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-logical-architecture-from-code

Called by `tech-architect` during /codify, after `infer-scope-from-code`, `infer-enriched-capabilities-from-code`, and the features proposal have emitted. Produces `architecture/logical-architecture.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/architecture/logical-architecture.yaml`.

## Purpose

During /codify (brownfield bootstrap), the `logical-architecture.yaml` that `derive-logical-architecture` produces in /arch — bounded contexts, components with responsibilities, data model, capability-level API surface, integration points, and the ADR log — must instead be reverse-engineered from the existing codebase. This skill consumes `scan-index.json` plus the prior codify proposals (scope, enriched-capabilities, features) and emits a logical architecture proposal grounded entirely in scan-index signals plus the prior proposals. No specific product names, SDK method names, wire protocols, schema column types, or programming-language keywords may appear in the output — that material belongs in `physical-architecture.yaml`. This is the `validate-abstraction-layer` gate carried into the /codify pipeline.

Optionally, `tech-architect` may have run the pre-existing `infer-architecture` skill first to produce `architecture-inference.yaml`. When present, that artifact is consumed as a stepping stone: its `module_structure` feeds bounded-context candidates, its `design_patterns` informs component typing, its `lld_patterns` is ignored here (LLD is not logical). This skill never re-derives what `infer-architecture` already grounded; it promotes code-derived structure into the tech-agnostic logical view.

## Input

Receive from tech-architect via JSON contract.

- `scan_index_path` (path, required) — `scan-index.json` produced by scan-codebase.
- `related_proposal_paths` (list, required) — absolute paths to the already-emitted `scope.yaml`, `enriched-capabilities.yaml`, and `features.yaml` proposals. Validation halts if any is missing.
- `architecture_inference_path` (path, optional) — path to `architecture-inference.yaml` produced by `infer-architecture` if tech-architect ran that skill first. When present, consumed as a stepping stone per Step 3.
- `kb_patterns_dir` (path, required) — `core/components/memory/knowledge/arch/patterns/`. Drives R3 pattern matching.
- `stm_base` (path, required) — STM root resolved from `.garura/core/config.yaml` `stm.base-path`.
- `issue` (str, required) — issue number driving /codify.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/architecture/logical-architecture.yaml`.
- `decision_manifest_path` (path, required) — `decision-manifest-infer-logical-architecture-from-code.yaml` alongside the artifact.
- `ltm_context` (block, required) — `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol (R3-focused here).
- `resolution_trace_path` (path, required) — where `resolution-trace.yaml` is written.

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON. Confirm all three related proposal paths exist and parse. Confirm `kb_patterns_dir` exists and contains at least one `*.md` file. Create output parent directories if missing. Structured failures: `scan_index_missing`, `missing_related_proposal`, `ltm_resolution_failed`.

2. **Read related proposals.** Load `selected_capabilities[]` from `scope.yaml`, the per-capability business rules and invariants from `enriched-capabilities.yaml`, and the domain → capability → feature tree from `features.yaml`. The component and bounded-context universe is strictly bounded by selected capabilities — structure that exists in the codebase but does not serve a selected capability is listed under `unmapped_structure`, never promoted to a first-class component.

3. **Consume `architecture-inference.yaml` if present (stepping stone).** When `architecture_inference_path` is supplied, load the artifact and treat:
   - `module_structure[]` as seed candidates for bounded contexts and components (role + boundaries lift into responsibility statements after tech-agnostic scrubbing).
   - `design_patterns[]` as component-typing hints (e.g., observed Repository pattern at `src/orders/repo` → `comp-order-repository` component of type `persistence-adapter`, stated without naming the ORM).
   - `framework_conventions[]` and `lld_patterns{}` are NOT consumed here — they belong to physical architecture and LLD, not logical.

4. **Execute LTM Resolution Protocol (R3-focused)** per `core/components/memory/standards/rules/resolution.md`. R3 = consult `{kb_patterns_dir}/*.md` (modular-monolith, microservices, event-driven, cqrs-event-sourcing, serverless, frontend-component-orchestration, evolutionary-scaling). Match canonical pattern indicators against scan-index signals to pick the system-level topology claim that best fits the observed code. R1/R2/R4 remain available. Write the trace to `resolution_trace_path`.

5. **Derive bounded contexts.** Scoring inputs:

   | Signal (scan-index path) | Evidence rule |
   |--------------------------|---------------|
   | `repos[]` | Every independent repo in a multi-repo layout → one candidate bounded context. |
   | `trees[].children` at the first level under `src/`, `app/`, `packages/` | Each top-level module → candidate bounded context within its repo. |
   | `patterns.framework_idioms[]` | Idiomatic grouping (e.g., `feature-folder`, `domain-per-service`) → validates or collapses module-level candidates. |
   | `git.co_change_top[]` | **High co-change across a proposed boundary = boundary mis-drawn.** When two candidate contexts appear together in top co-change pairs, merge them into one bounded context and record the merge rationale in the decision manifest. When a candidate has near-zero co-change with every other candidate, keep it as its own context. This rule MUST be applied explicitly, not skipped. |
   | `entry_points[]` | Dedicated entry points per context anchor the boundary (e.g., a separate worker entry → its own bounded context). |

   Each context records: `id`, `name`, `capabilities_included` (IDs from scope), `repo` (from `repos[]`) when multi-repo, `source_modules` (from `trees`), `co_change_validated: true|false`, `rationale` citing the scan-index path(s).

6. **Enumerate components per bounded context.** Scoring inputs:

   | Signal | Evidence rule |
   |--------|---------------|
   | `patterns.naming_suffix_counts` | `Repository` → component type `persistence-adapter`; `Service` → `application-service`; `Controller` / `Handler` → `interface-layer`; `Gateway` / `Client` → `integration-adapter`; `UseCase` / `Interactor` → `application-service`; `Mapper` / `Transformer` → `translation`. Count >= 3 in a module → named component; count 1-2 → single component with a note. |
   | `patterns.framework_idioms[]` | Idiom match (e.g., `auth-middleware` → `comp-auth-gateway` of type `interface-layer`) → component role stated in tech-agnostic terms. |
   | `entry_points[]` | Each entry point → one `interface-layer` component (e.g., `worker` entry → `comp-{context}-job-runner`). |
   | `architecture_inference_path` when present | `design_patterns[]` observations upgrade medium-evidence components to high. |

   Each component records: `id`, `name`, `type`, `bounded_context`, `capabilities_served` (intersected with selected capabilities), `responsibilities` (technology-agnostic — derive from module role, not framework name), `depends_on`, `evidence`, and `rationale`.

7. **Build data_model.** Entity sources, in priority order:
   - Entity-named files: `*.entity.ts`, `*.entity.js`, `*.model.py`, `models.py`, `*/models/*.go`, `*.schema.ts`, `domain/*.cs`. Each distinct entity file → one entity.
   - Schema-defining ADRs in `docs.adrs[]` (titles matching `data-model`, `schema`, `entity`, `domain-model`) → promote declared entities.
   - Business-rule nouns in `enriched-capabilities.yaml` that are referenced but have no file counterpart → mark `source: enriched_capabilities_only` with `coverage: implied` (do not invent attributes).

   Each entity records: `id`, `name` (PascalCase singular), `owning_context`, `primary_identifier: natural-key | surrogate-key` (infer from file content signals; when ambiguous leave null and surface a low-tier decision), `pii_fields` (populated from compliance flags in the project-profile proposal + enriched-capabilities business rules), `invariants` (lifted verbatim from enriched-capabilities business rules with citation), `source` (evidence path). Relationships are captured from import edges or explicit foreign-key-like field names, rendered as `from → to` with `cardinality: one-to-one | one-to-many | many-to-many` and a `source` citation. **NO column types. NO storage engine names. NO nullable/unique DDL tokens. NO language type annotations.**

8. **Build api_surface.** Capability-level operation groups from:
   - `entry_points[]` (each public entry → one surface group).
   - `patterns.naming_suffix_counts` for `Controller`, `Handler`, `Resolver`, `Router` inside each bounded context → group operations by the context they serve.
   - `features.yaml` feature names → align operation phrasing to the feature vocabulary.

   Each surface group records: `id`, `name`, `bounded_context`, `capabilities_covered`, `operations` (verb-noun phrases such as `initiate-checkout`, `cancel-order`; NEVER `POST /orders` or `createOrder(OrderDto)`), `consumers` (other components or `external-client`), `evidence`.

9. **Build integration_points.** Sources:
   - `manifests[].dependencies` — third-party SDKs, payment processors, email providers, search engines, observability vendors. Each distinct external dependency of this class → one integration point.
   - `config_files` entries referencing external hostnames, webhook URLs, service account keys → one integration point per distinct external system.
   - ADRs titled with integration vocabulary (`integration`, `webhook`, `vendor`).

   Each integration point records: `id`, `name` (the external system's generic purpose, NOT its product name — e.g., `payment-processor` not `Stripe`), `purpose`, `capability`, `interaction_pattern` (`request-response` | `fire-and-forget` | `streaming` | `batch` — chosen by the evidence, never by SDK-specific semantics), `risk_category` (`vendor-lock-in` | `data-residency` | `availability-coupling` | `compliance-scope-expansion`), `boundary_isolation` (the abstraction component that contains the dependency; if absent in code → `risk: direct-call-no-isolation`), `evidence`.

10. **Build adr_log.** Walk `docs.adrs[]` from the scan index. For each ADR entry, record: `id` (normalized to `ADR-NNN`), `title` (verbatim), `status` (if scan captured it), `path` (source file), `summary` (first paragraph only when `adrs` payload provides text). Do not fabricate ADR content not present in the scan. Mark the log `derived_from: scan-index:docs.adrs` so downstream /arch can re-anchor against physical-architecture.

11. **Build component_capability_map.** Every capability in `scope.selected_capabilities` MUST appear with at least one `serving_components` entry. Uncovered capabilities → add to `coverage_gaps` with `recommended_action: user-review-at-codify-checkpoint`. Structure present in code but not mapping to a selected capability → `unmapped_structure[]` with the module path and a one-line rationale, so the human reviewer can decide whether to expand scope or accept the orphan.

12. **Apply tech-agnostic scrub (validate-abstraction-layer rules).** Before writing, scan every string field across `bounded_contexts`, `components`, `data_model`, `api_surface`, `integration_points`, `adr_log` for deny-list tokens using `validate-abstraction-layer` semantics. Deny-list categories:
    - Specific database engines (`PostgreSQL`, `MySQL`, `DynamoDB`, `Mongo`, `Redis`).
    - SDK or library method calls (`.save()`, `.publish()`, `boto3`, `stripe.Customer.create`).
    - Wire protocols and formats (`REST`, `HTTP`, `gRPC`, `GraphQL`, `WebSocket`, `JSON`, `Protobuf`).
    - Schema column types and DDL tokens (`VARCHAR`, `INTEGER`, `UUID`, `NOT NULL`, `PRIMARY KEY`).
    - Programming-language keywords and type annotations (`async`, `class`, `interface`, `struct`, `Promise<`, `List[`).
    - Specific product / framework identifiers (`Next.js`, `Spring`, `Rails`, `AWS`, `Kubernetes`).
    If any token is detected → halt, return structured failure `abstraction_layer_violation` with the offending field path and token.

13. **Assemble the artifact.** Write the `meta` block first, then the logical architecture body. `meta.evidence` lists every scan-index path consulted (deduplicated). `meta.confidence` is the min of per-section confidences; force `low` whenever `scan_status: budget_exhausted`.

14. **Write decision manifest.** One entry per inferred structural decision: bounded-context boundary, co-change merge, component-type inference, entity primary-identifier, PII tagging, integration risk classification, pattern claim from R3. Each entry: `{decision_id, decision_type, tier, grounding_source, recommendation, alternatives_considered, confidence}`. `grounding_source` is either `scan-index:<json-path>`, `kb:{patterns-file}#{section}`, or `proposal:{file}#{field}`. Low-confidence entries MUST list `alternatives_considered` with at least one alternative. Verbatim echoes from related proposals are NOT decisions — do not record those.

## Output

Primary artifact at `output_path`:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/repos"
    - "scan-index.json#/trees"
    - "scan-index.json#/patterns/framework_idioms"
    - "scan-index.json#/patterns/naming_suffix_counts"
    - "scan-index.json#/git/co_change_top"
    - "scan-index.json#/entry_points"
    - "scan-index.json#/manifests/0/dependencies"
    - "scan-index.json#/docs/adrs"
  confidence: "high" | "medium" | "low"
  learning_category: "arch"
  sub_category: "patterns"
  tier: 1
  scan_status_warning: null
  related_proposal_paths:
    - "{path to scope.yaml}"
    - "{path to enriched-capabilities.yaml}"
    - "{path to features.yaml}"
  architecture_inference_consumed: true | false
logical_architecture:
  topology_claim: "modular-monolith" | "microservices" | "event-driven" | ...  # R3 match
  bounded_contexts:
    - id: "bc-{slug}"
      name: "..."
      capabilities_included: ["..."]
      repo: "{repo-name-or-null}"
      source_modules: ["src/..."]
      co_change_validated: true | false
      rationale: "..."
      evidence: ["scan-index:..."]
  components:
    - id: "comp-{slug}"
      name: "..."
      type: "application-service" | "persistence-adapter" | "interface-layer" | "integration-adapter" | "translation"
      bounded_context: "bc-..."
      capabilities_served: ["..."]
      responsibilities: ["..."]
      depends_on: ["comp-..."]
      evidence: ["scan-index:..."]
      rationale: "..."
  data_model:
    entities:
      - id: "ent-{slug}"
        name: "User"
        owning_context: "bc-..."
        primary_identifier: "natural-key | surrogate-key | null"
        pii_fields: ["..."]
        invariants: ["..."]
        source: "..."
    relationships:
      - from: "ent-..."
        to: "ent-..."
        cardinality: "one-to-one | one-to-many | many-to-many"
        source: "..."
    pii_fields_summary: ["..."]
  api_surface:
    - id: "api-{slug}"
      name: "..."
      bounded_context: "bc-..."
      capabilities_covered: ["..."]
      operations: ["verb-noun"]
      consumers: ["comp-...", "external-client"]
      evidence: ["..."]
  integration_points:
    - id: "int-{slug}"
      name: "payment-processor"
      purpose: "..."
      capability: "..."
      interaction_pattern: "request-response | fire-and-forget | streaming | batch"
      risk_category: "vendor-lock-in | data-residency | availability-coupling | compliance-scope-expansion"
      boundary_isolation: "{component-id-or 'none'}"
      evidence: ["..."]
  adr_log:
    - id: "ADR-001"
      title: "..."
      status: "accepted | proposed | superseded | unknown"
      path: "docs/adr/..."
      summary: "..."
  component_capability_map:
    - capability_id: "..."
      serving_components: ["comp-..."]
      coverage: "complete | partial"
  coverage_gaps:
    - capability_id: "..."
      reason: "..."
      recommended_action: "user-review-at-codify-checkpoint"
  unmapped_structure:
    - module: "src/..."
      note: "present in code but not serving any selected capability"
inferences_pending_review: ["..."]
```

Decision manifest at `decision_manifest_path`:

```yaml
decisions:
  - decision_id: "D-ila-001"
    decision_type: "bounded-context-boundary | co-change-merge | component-type-inference | entity-primary-identifier | pii-field-tagging | integration-risk | topology-pattern-claim"
    tier: "high | mid | low"
    grounding_source: "scan-index:{path}" | "kb:arch/patterns/{file}.md" | "proposal:{file}#{field}"
    recommendation: "..."
    alternatives_considered:
      - alt: "..."
        why_not: "..."
    confidence: "high | medium | low"
  # one entry per inferred decision
```

Resolution trace at `resolution_trace_path` per resolution.md schema (R3 path dominant against `core/components/memory/knowledge/arch/patterns/`).

No product LTM writes. All output is under STM.

## Failure Modes

- `missing_related_proposal` — scope.yaml, enriched-capabilities.yaml, or features.yaml not present at the supplied path, or a file exists but cannot be parsed / lacks required keys.
- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `ltm_resolution_failed` — Resolution Protocol raised an error against `kb_patterns_dir`; skill halts and returns the trace path for triage.
- `insufficient_signal` — zero naming-suffix clusters AND zero module hierarchy AND zero entry points for ANY selected capability. Emit the artifact with empty `components`, every capability in `coverage_gaps`, and `meta.confidence: low`. Do NOT fabricate components.
- `abstraction_layer_violation` — Step 12 scrub detected a deny-list token in the assembled artifact. Halt and return the offending field path and token; no file is written.
- `scan_status_exhausted` — scan-index has `scan_status: budget_exhausted`; proceed but force `meta.confidence` to `low` and populate `meta.scan_status_warning`.

## Boundaries

- Read-only against the codebase. The scan-index plus the three related proposals (plus optional `architecture-inference.yaml`) are the sole inputs — this skill does NOT open source files directly.
- Capability universe is strictly `scope.selected_capabilities`. Structure that does not map to a selected capability goes to `unmapped_structure`, never to `components`.
- Technology-agnostic output is load-bearing. SDK method names, wire protocols, schema column types, product names, and programming-language keywords are forbidden in every field. Violations halt the skill (F: `abstraction_layer_violation`) — they are not warnings.
- Signals not listed in the Step 5–9 tables MUST NOT be invented. If scan-index lacks a signal, the corresponding entity / component / integration tends toward `coverage_gaps` or absence, never a confident claim.
- This skill does NOT produce `physical-architecture.yaml`, `nfr-spec.yaml`, `quality-vision.yaml`, or `design-patterns.yaml`. Those artifacts live in /arch and consume this proposal as an upstream input when /codify hands off.
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/architecture/` and the two companion files (decision manifest, resolution trace).
