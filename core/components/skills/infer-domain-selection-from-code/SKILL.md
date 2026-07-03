---
name: infer-domain-selection-from-code
description: Infer which product domains a brownfield codebase evidences by cross-walking scan-index.json signals (framework idioms, dependencies, config, readme, CI) against Garura's canonical domain KB. Produces specification/domain-selection.yaml. Used by product-keeper during /codify.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# infer-domain-selection-from-code

Called by `product-keeper` during `/codify`. Produces `specification/domain-selection.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/specification/domain-selection.yaml`.

## Purpose

`/codify` bootstraps product LTM for a brownfield repo. This skill answers:
**which product domains does this codebase actually evidence?** It reads
`scan-index.json` (produced by `scan.py`), walks Garura's canonical domain
catalog (`core/components/memory/knowledge/domain/*.md`), scores each canonical
domain against the scan signals, and surfaces scan-only domains as proposals
for a new canonical entry (per /reap C7a).

Tier 2. `learning_category: domain`. `sub_category: null` (domain is a flat
parent).

## Input

Received from the /codify play via JSON contract. All paths absolute.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | `scan-index.json` produced by `scan.py`. |
| `stm_base` | yes | STM root, from `stm.base-path` in `.garura/core/config.yaml`. |
| `issue` | yes | Issue number (STM namespace). |
| `output_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/specification/domain-selection.yaml`. |
| `decision_manifest_path` | yes | Sibling `decision-manifest-infer-domain-selection.yaml`. |
| `ltm_context` | yes | Resolution Protocol context from product-keeper (`product_base`, `kb_base`, resolved LTM paths). |
| `resolution_trace_path` | yes | Sibling `resolution-trace-infer-domain-selection.yaml`. |
| `kb_domain_dir` | yes | `core/components/memory/knowledge/domain/`. Walked non-recursively; files starting with `_` are metadata, not domains. |

## Process

### 1. Validate inputs

- `scan_index_path` must be valid JSON with `schema_version`, `scan_status`,
  `manifests`, `patterns`, `config_files`, `docs`, `frontend_detection`.
  Missing → `scan_index_missing`.
- `kb_domain_dir` must exist and hold ≥ 1 non-underscore `.md`. Missing →
  `kb_domain_dir_missing`.
- Parent dirs of the three output paths must be creatable → else
  `output_path_unwritable`.

### 2. Resolution Protocol walk (write trace first)

Per `core/components/memory/standards/rules/resolution.md`, record every probe
in `resolution_trace_path`.

- **R1 STM** — skipped for /codify bootstrap; record reason `codify-bootstrap`.
- **R2 Product LTM** — probe `{product_base}/specification/domain-selection.yaml`.
  If present AND LOCKED: scoring still runs, but emit a proposal only if scan
  evidence conflicts (scan-only domains, or canonical domains scoring high
  that the locked artifact rejected). No conflict → `alignment_confirmed: true`
  and no proposal body. Absent (typical /codify): proceed.
- **R3 KB** — list `{kb_domain_dir}/*.md`, excluding basenames starting with
  `_`. For each, extract the slug and capture declared search patterns /
  feature IDs as the matching vocabulary for Step 3.
- **R4 Web** — not invoked. Taxonomy expansion is a deliberate human call;
  this skill only proposes via `inferred_domain_new`.

### 3. Score canonical domains from scan signals

For each R3 canonical domain compute an evidence bundle. Every hit MUST record
a concrete path (file, manifest entry, or scan-index JSON pointer) — no score
without evidence.

**Signal → domain mapping:**

- `patterns.framework_idioms` (case-insensitive substring on the idiom tag):
  - `express|nestjs|fastify|koa|fastapi|flask|django|spring|gin|echo|laravel|rails` → **backend-api**
  - `react|vue|svelte|angular|solid|nextjs|nuxt|remix` → **frontend-web**
  - `react-native|expo|flutter|swiftui|jetpack-compose` → **mobile**
  - `graphql-schema|apollo|graphql-yoga` → **graphql-api**
  - `grpc-service|protobuf` → **rpc**
  - `openapi-spec|swagger` → **api-contracts**
- `config_files.docker` (Dockerfile, docker-compose.*) → **containerization**
- `config_files.infra` (terraform, pulumi, cloudformation, cdk) → **infrastructure-as-code**
- `config_files.deploy` (helm, k8s manifests, serverless.yml) → **deployment**
- `config_files.ci` (github workflows, gitlab-ci, circle, jenkins) → **engineering-experience** (CI is that domain's anchor)
- `patterns.test_framework_signals` non-empty (jest, vitest, pytest, rspec, go test, junit) → **testing** (count feeds confidence, not just presence)
- `docs.readme_preview` whole-word case-insensitive keyword sweep:
  - `finance|banking|trading` → **finance**
  - `health|medical|patient|clinical` → **healthcare**
  - `ecommerce|checkout|catalog|cart` → **commerce**
  - `logistics|shipping|fleet|warehouse` → **logistics**
  - `cms|content|publishing` → **content-management**
  - `analytics|dashboard|metrics|bi` → **analytics**
  - `learning|course|lms|education` → **education**
  - Record matched term + line/byte offset into the preview.
- `manifests` dependency names (union across all manifests):
  - `stripe|braintree|adyen|razorpay` → **payments**
  - `next-auth|auth0|clerk|passport|keycloak-*` → **user-management**
  - `tensorflow|torch|transformers|langchain|llamaindex|openai|anthropic` → **ml-ai**
  - `elasticsearch|meilisearch|typesense|algolia` → **search**
- `git.churn_top` is NOT a domain signal (hotspot only).

**Confidence tiers per canonical domain:**
- `high` — ≥ 2 distinct signal categories, OR a strong-marker dep (payment SDK, auth lib, ML framework).
- `medium` — 1 category with ≥ 2 evidence items (e.g., two idioms in same family), OR a single strong dep.
- `low` — 1 category with 1 evidence item (e.g., readme-only hit with no code confirmation).
- Zero evidence → `rejected_domains`.

### 4. Surface scan-only domains (new-to-KB)

Any domain slug produced by the mapping that is NOT in the R3 canonical set
becomes a proposed new canonical domain: set `inferred_domain_new: true` and
`learning_category_proposed: true`; author `taxonomy_justification` with
`evidence_path` (scan-index pointer or file path), `excerpt` (≤ 200-char
literal excerpt), and `reasoning` (1–3 sentences on why this is distinct vs.
folding into an existing entry). Confidence capped at `medium`.

### 5. Compose selected / rejected

`selected_domains` = every canonical domain scoring ≥ low, plus every proposed
new domain. `rejected_domains` = every canonical R3 domain with zero evidence,
each with `source_path` (KB file) and a one-line `reason`.

### 6. Write outputs

Decision manifest is written BEFORE the primary artifact (Decision Surfacing
Discipline — a crash mid-write still leaves the audit trail). Every inferred
decision (confidence pick, new-domain proposal, locked-artifact conflict flag)
gets one manifest entry.

## Output

### Primary artifact — `specification/domain-selection.yaml`

```yaml
meta:
  source_type: "inferred_from_code"
  evidence: ["<scan-index JSON pointer or file path>", "..."]
  confidence: "high" | "medium" | "low"   # aggregate over selected_domains
  learning_category: "domain"
  sub_category: null
  tier: 2
selected_domains:
  - id: "<canonical domain slug from KB>"
    evidence:
      - signal: "framework_idiom"
        match: "express"
        path: "patterns.framework_idioms[3]"
      - signal: "manifest_dep"
        match: "stripe"
        path: "manifests[0].dependencies.stripe"
    confidence: "high" | "medium" | "low"
    inferred_domain_new: false
  - id: "<new-domain-slug>"
    inferred_domain_new: true
    learning_category_proposed: true
    taxonomy_justification:
      evidence_path: "<path>"
      excerpt: "<≤200-char literal excerpt>"
      reasoning: "<1–3 sentences>"
    evidence: [...]
    confidence: "low" | "medium"
rejected_domains:
  - id: "<canonical domain slug>"
    source_path: "core/components/memory/knowledge/domain/<slug>.md"
    reason: "<one-line rationale>"
alignment_confirmed: false   # true only when R2 hit LOCKED and no conflict
```

### Decision manifest

Standard Garura shape: `schema_version`, `skill`, `generated_at`, `decisions[]`.
One entry per inferred decision, each with `decision_id`, `decision_type`,
`tier` (high/mid/low per Decision Surfacing Discipline), `grounding_source`,
`recommendation`, `alternatives`, `chosen_reason`.

### Resolution trace

R1..R3 probes with `source`, `path`, `outcome` (`hit|miss|skipped`), and any
extracted payload. R4 omitted.

### Return contract

```yaml
status: success
artifact_path: "<output_path>"
decision_manifest_path: "<decision_manifest_path>"
resolution_trace_path: "<resolution_trace_path>"
selected_domain_count: <int>
new_domain_proposal_count: <int>
rejected_domain_count: <int>
overall_confidence: "high" | "medium" | "low"
alignment_confirmed: <bool>
```

## Failure Modes

```yaml
status: failure
what_failed: "<code>"
detail: "<specific error>"
evidence:
  offending_path: "<file path if applicable>"
  offending_field: "<field name if applicable>"
```

Codes:
- `scan_index_missing` — `scan_index_path` absent or invalid JSON.
- `kb_domain_dir_missing` — directory absent or zero non-underscore `.md`.
- `ltm_resolution_failed` — R2 hit but file is invalid YAML, or `product_base` resolves outside the repo sandbox.
- `insufficient_signal` — scan present but zero manifests, zero framework idioms, AND zero readme preview.
- `output_path_unwritable` — parent directory uncreatable.

## Boundaries

- Read-only against `scan_index_path` and `kb_domain_dir`.
- Emits proposals, not canonical KB entries. Promoting an `inferred_domain_new` domain into the KB is a human decision handled downstream by /garura:enrich.
- Does NOT re-run `scan.py`; stale `scan_index_path` is the orchestrator's concern.
- All writes land under `{stm_base}/{issue}/evidence/codify/proposals/`; never modifies `.garura/product/` in place.
