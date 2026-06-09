---
name: infer-design-patterns-from-code
description: Infer the design-patterns catalogue (architecture/design-patterns.yaml) from scan-index.json during /codify by mapping naming suffixes, framework idioms, and layered directory trees to named patterns — each scoped as system/layer/component/cross-cutting, cited to a driver, with alternatives considered and source_type tagged. Called by tech-architect after logical-architecture and physical-architecture proposals exist.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# infer-design-patterns-from-code

Called by `tech-architect` during `/codify`, after logical-architecture
and physical-architecture proposals have been written. Produces
`{stm_base}/{issue}/evidence/codify/proposals/architecture/design-patterns.yaml`.

## Purpose

Brownfield projects already encode their design patterns in directory
layout, naming conventions, and framework idioms — a `Repository`-suffix
cluster proves the Repository pattern; a `src/domain` + `src/application` +
`src/infrastructure` tree proves Hexagonal / Clean Architecture; a queue
dep plus listener files prove Pub/Sub. The `/codify` bootstrap must lift
that knowledge out of code so the pattern catalogue matches reality before
a human edits it.

This skill reads `scan-index.json` plus the sibling logical and physical
architecture proposals, applies a deterministic signal → pattern mapping
table, scopes every detected pattern (system / layer / component /
cross-cutting), cites a concrete driver, lists ≥ 1 alternative, and tags
every entry `source_type: inferred_from_code`.

Tier-1 inference. `learning_category: arch`. `sub_category: patterns`.

## Input

Receive from `tech-architect` via JSON contract. All paths absolute.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | `scan-index.json` produced by `scan.py`. |
| `stm_base` | yes | STM root (`stm.base-path` in `.garura/core/config.yaml`). |
| `issue` | yes | Issue number (STM namespace). |
| `output_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/architecture/design-patterns.yaml`. |
| `decision_manifest_path` | yes | `{…}/architecture/decision-manifest-infer-design-patterns.yaml`. |
| `resolution_trace_path` | yes | `{…}/architecture/resolution-trace-infer-design-patterns.yaml`. |
| `related_proposal_paths` | yes | Block with `logical_architecture_path`, `physical_architecture_path`. |
| `ltm_context` | yes | `{product_base, core_base, query_domains: ["arch/patterns"], locked_artifacts}`. |

## Process

### 1. Validate inputs

- `scan_index_path` parses as JSON with keys `repos`, `manifests`, `trees`,
  `entry_points`, `docs`, `config_files`, `frontend_detection`, `patterns`,
  `git`. Missing any key or invalid JSON → `what_failed: scan_index_missing`.
- Both files in `related_proposal_paths` exist and parse as YAML. Missing or
  unreadable → `what_failed: missing_related_proposal`.
- Parent directory of every output path exists or is creatable.

### 2. Resolution Protocol R3 walk

Per `core/components/memory/standards/rules/resolution.md`, record every
probe in `resolution_trace_path`.

- **R1 — STM.** Skipped (codify bootstrap). Reason `"codify-bootstrap"`.
- **R2 — Product LTM.** Probe `{product_base}/architecture/design-patterns.yaml`.
  If present, read **informationally only** — prior IDs and scopes land in
  the trace. Emit a fresh proposal; never short-circuit to
  `alignment_confirmed`. Conflicts surface as manifest entries at `tier=mid`.
- **R3 — KB.** Load `{core_base}/memory/knowledge/arch/patterns/_index.md`
  plus `arch/patterns/*.md` for every pattern in the mapping table below.
  KB entries supply the canonical name, scope template, and sibling
  alternatives. Every lookup lands in the trace.
- **R4 — Web.** Skipped unless a detected idiom has no KB entry; record the
  gap as a manifest observation — do NOT author a web-sourced recommendation.

### 3. Read related proposals

- From `logical-architecture.yaml`: component IDs and bounded contexts —
  citeable drivers for layer-level and component-level patterns.
- From `physical-architecture.yaml`: `deployment_topology.runtime_tiers`
  (web / api / worker / data — the tiers a component-level pattern must
  anchor to) and queue / cache / data-store picks (feed cross-cutting
  triggers).

A component-level pattern without a matching tier in physical-architecture
is suppressed; a tier without any detected pattern is recorded as a
coverage gap (non-fatal in `/codify`; raised via the manifest).

### 4. Apply direct-detection signal → pattern mapping

The full mapping table — first match wins per signal lane; a pattern may
fire from multiple lanes (evidence is merged, not duplicated):

| Signal source | Signal value | Pattern inferred | Default scope |
|---------------|--------------|------------------|---------------|
| `patterns.naming_suffix_counts` | `*Repository` ≥ 3 | Repository | component_level (runtime_tier: api or data) |
| `patterns.naming_suffix_counts` | `*Service` ≥ 3 | Service Layer | layer_level |
| `patterns.naming_suffix_counts` | `*Factory` ≥ 2 | Factory | component_level |
| `patterns.naming_suffix_counts` | `*Builder` ≥ 2 | Builder | component_level |
| `patterns.naming_suffix_counts` | `*Provider` / `*Context` ≥ 2 | React Context / IoC Container | component_level (runtime_tier: web) |
| `patterns.naming_suffix_counts` | `*Middleware` ≥ 2 | Chain of Responsibility / Middleware | cross_cutting |
| `patterns.naming_suffix_counts` | `*Handler` + `*Controller` + `*Router` all present | MVC / Layered | layer_level |
| `patterns.naming_suffix_counts` | `*Strategy` / `*Policy` ≥ 2 | Strategy | component_level |
| `patterns.naming_suffix_counts` | `*Adapter` / `*Gateway` ≥ 2 | Adapter / Gateway | cross_cutting |
| `patterns.naming_suffix_counts` | `*UseCase` / `*Interactor` ≥ 2 | Use-Case / Clean Architecture | layer_level |
| `patterns.framework_idioms` | `express-middleware` or `koa-middleware` | Chain of Responsibility + DI | cross_cutting |
| `patterns.framework_idioms` | `nestjs-decorators` | Dependency Injection + Decorator | layer_level |
| `patterns.framework_idioms` | `graphql-schema` | Facade + Resolver | layer_level |
| `patterns.framework_idioms` | `grpc-service` | RPC | system_level |
| `patterns.framework_idioms` | `spring-boot` + `@Repository`/`@Service` | Repository + Service Layer + DI | layer_level + component_level |
| `trees` layering | `src/domain` + `src/application` + `src/infrastructure` | Hexagonal / Clean Architecture | system_level |
| `trees` layering | `src/models` + `src/views` + `src/controllers` | MVC | system_level |
| `trees` layering | `features/*` top-level directories (≥ 3) | Feature-Sliced Design | system_level |
| `trees` layering | `packages/*` + root workspace manifest | Monorepo / Modular Monolith | system_level |
| `manifests` + listener files | Queue dep (`bullmq`, `rabbitmq`, `kafkajs`, `celery`, `sidekiq`) + files matching `*listener*` / `*subscriber*` / `*consumer*` | Pub/Sub | cross_cutting |
| `manifests` + listener files | Queue dep AND file/folder names include `event-store` / `eventstore` / `append-log` | Event Sourcing | system_level |
| `manifests` | State-machine libs (`xstate`, `stately`, `transitions`, `statelib`) | State Machine | component_level |
| `manifests` | Circuit-breaker libs (`opossum`, `resilience4j`, `pybreaker`) | Circuit Breaker | cross_cutting |
| `manifests` | Retry libs (`p-retry`, `tenacity`, `retry4j`) OR `patterns.framework_idioms` includes `retry-decorator` | Retry with Backoff | cross_cutting |
| `patterns.framework_idioms` | `idempotency-key` middleware or `@idempotent` decorator | Idempotency Key | cross_cutting |

Rules enforced over the table:

1. **Evidence required.** Each firing records the scan-index pointer plus
   ≥ 1 concrete file path from `trees` or listener enumeration.
2. **Scope dedup.** A pattern firing at multiple scopes keeps the highest
   scope; evidence merges. Do NOT double-count.
3. **Tier cross-check.** A component_level pattern must have its
   `runtime_tier` present in `physical-architecture.yaml:deployment_topology.runtime_tiers`.
   Missing → downgrade to layer_level or drop with a manifest note.
4. **Confidence.** `high` — ≥ 2 independent lanes agree and KB matches.
   `medium` — 1 strong lane (idiom or tree layout) with KB match.
   `low` — suffix-only below threshold, or no KB match.

### 5. Group by scope and dedupe

Assemble four lists: `system_level`, `layer_level`, `component_level`
(keyed on runtime_tier), `cross_cutting`. Dedupe by
`(pattern, applicability_scope)` — same pattern at same scope collapses,
evidence merges. Same pattern at a higher AND a genuinely narrower lower
scope keeps both with distinct `applicability_scope` strings; otherwise
collapse to the higher scope.

### 6. Cite drivers and author alternatives

Every emitted entry carries:

- `name` — canonical pattern name from the KB catalogue (never a synonym).
- `applicability` — scope string anchored to logical-architecture component
  IDs or physical-architecture tier names.
- `driver` — specific citation: component ID (`comp-…`), tier (`tier-api`),
  manifest dep (`bullmq@^5`), or tree path (`src/domain/`). Generic drivers
  like "good practice" are forbidden.
- `alternatives_considered` — 1–2 entries of `{alt, why_not}`. When no
  alternative is meaningful: `alt: "none — only candidate from code"`,
  `why_not` citing the empty KB sibling list.
- `source_type: inferred_from_code`.
- `evidence` — scan-index pointers plus repo-relative paths.
- `confidence` — from Step 4 rule 4.

### 7. Write trace, manifest, primary artifact

Write in order (manifests before artifact so a mid-write failure still
leaves an audit trail): `resolution_trace_path` → `decision_manifest_path`
→ `output_path`. Decision manifest carries one entry per pattern emitted
plus one per scope ambiguity (`decision_id` prefix `D-idpfc-`), with
`tier`, `grounding_source`, `recommendation`, `alternatives_considered`,
`agent_reasoning_summary`, `user_response: null`.

## Output

### Primary artifact — `architecture/design-patterns.yaml`

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/patterns/naming_suffix_counts"
    - "scan-index.json#/patterns/framework_idioms"
    - "scan-index.json#/trees"
    - "scan-index.json#/manifests"
  confidence: "high" | "medium" | "low"
  learning_category: "arch"
  sub_category: "patterns"
  tier: 1
upstream_artifacts:
  logical_architecture_path: "<echoed>"
  physical_architecture_path: "<echoed>"
summary:
  system_level_count: <int>
  layer_level_count: <int>
  component_level_count: <int>
  cross_cutting_count: <int>
  runtime_tiers_covered: [web, api, worker, data]
design_patterns:
  system_level:
    - name: "<canonical pattern name>"
      description: "<1–2 sentences from KB entry>"
      applicability: "<scope anchored to components or tiers>"
      driver: "<component ID | tier | manifest dep | tree path>"
      alternatives_considered:
        - alt: "<alternative pattern>"
          why_not: "<one-line rejection reason>"
      source_type: "inferred_from_code"
      evidence: ["<scan-index pointer>", "<repo-relative path>"]
      confidence: "high | medium | low"
  layer_level: [ ...same shape... ]
  component_level:
    - name: "<pattern>"
      runtime_tier: "web | api | worker | data"
      # remaining fields as above
  cross_cutting: [ ...same shape... ]
```

### Decision manifest — `decision-manifest-infer-design-patterns.yaml`

Standard Garura shape (`schema_version`, `skill`, `generated_at`,
`decisions[]`) as produced in Step 7.

### Return contract

```yaml
status: success
artifact_path: "<output_path>"
decision_manifest_path: "<decision_manifest_path>"
resolution_trace_path: "<resolution_trace_path>"
counts:
  system_level: <int>
  layer_level: <int>
  component_level: <int>
  cross_cutting: <int>
runtime_tiers_covered: [<tier names>]
uncovered_tiers: [<tier names>]   # physical-arch tiers with no component_level pattern
overall_confidence: "high" | "medium" | "low"
```

## Failure Modes

- `missing_related_proposal` — `logical-architecture.yaml` or
  `physical-architecture.yaml` absent or unparseable.
- `scan_index_missing` — `scan_index_path` absent or not valid JSON.
- `insufficient_signal` — scan present but zero naming-suffix hits above
  threshold AND zero `framework_idioms` entries AND no layered tree
  structure detected. No pattern can be inferred; tech-architect falls back
  to human input for the full catalogue.
- `ltm_resolution_failed` — R2 errored (existing design-patterns.yaml not
  valid YAML, or product_base resolves outside the repo sandbox).

## Boundaries

- Read-only against `scan_index_path`, `related_proposal_paths`, product
  LTM, and core KB. Never rescans the repo.
- Emits a proposal, NOT canonical product LTM. Writing to
  `.garura/product/architecture/design-patterns.yaml` is a downstream
  `/garura:enrich` action.
- Does NOT invent patterns absent from both the mapping table and the KB
  catalogue — an unnamed structural observation is recorded in the manifest
  as an open question, never promoted into `design_patterns`.
- Does NOT re-derive logical or physical architecture — consumes them.
- Does NOT resolve multi-candidate scope disputes unilaterally — surfaces
  them through the manifest at `tier=mid`.
