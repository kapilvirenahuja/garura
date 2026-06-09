---
name: aggregate-codify-proposals
description: Walk the inference-output directory under STM, read every proposal artifact each infer-*-from-code skill produced, and compose the master proposals.yaml index classified by the two-level learning taxonomy (learning_category + sub_category). This is the artifact that /garura:enrich consumes. Used exclusively by the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
deprecated: true
deprecated_note: '#434 ProductOS realignment — superseded by the command model; retained for Phase E reference, not installed'
---

# aggregate-codify-proposals

Called by the `/codify` play after all inference agents finish. Produces `proposals.yaml` — the master index that /garura:enrich reads to promote proposals into product LTM. Every inferred LTM artifact is catalogued here with its tier, taxonomy, evidence, confidence, and target LTM path.

## Purpose

Each `infer-*-from-code` skill writes one artifact under `{stm_base}/{issue}/evidence/codify/proposals/<target-path>`. Those files are the proposals themselves. This skill walks that tree, reads each file, extracts its metadata block, classifies each proposal against /reap's two-level learning taxonomy, groups by tier, and writes a single master index. The master index is what downstream consumers (the user at the checkpoint; /garura:enrich later) read.

## Input

Receive from the /codify play orchestrator via JSON contract.

- `proposals_root` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/`. Walked recursively; every file is treated as a proposal artifact.
- `scan_result_path` (path, required) — `{stm_base}/{issue}/evidence/codify/scan-result.yaml`. Used to read scan metadata (repos, frontend detection, scan status) into the master index.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals.yaml`.
- `incremental_mode` (bool, optional, default false) — when true, read `skipped_locked` from caller and include it in the master index.
- `skipped_locked` (list[path], optional) — list of target LTM paths skipped because they are LOCKED. Only populated when `incremental_mode` is true.
- `skipped_phases` (list[str], optional) — phases skipped entirely (e.g., `["experience"]` when no frontend detected, or `["scope"]` under a --target filter).
- `target_filter` (str, optional) — if /codify was invoked with `--target`, record the filter here for provenance.

## Process

### 1. Validate inputs

- Confirm `proposals_root` exists and is a directory. Missing → structured failure with `what_failed: proposals_root_missing`.
- Confirm `scan_result_path` exists and is valid YAML. Missing → structured failure with `what_failed: scan_result_missing`.
- Parse `scan_result_path`.

### 2. Walk proposals directory

Enumerate every file under `proposals_root`. For each file:

1. Determine `target_path` — the path relative to `proposals_root` with the file name preserved. This is the LTM-relative destination (e.g., `architecture/logical-architecture.yaml`, `scope/epics/epic-auth-001.yaml`).
2. Parse the file:
   - YAML (`.yaml` / `.yml`) → parse top-level `meta` block expected to contain `source_type`, `evidence`, `confidence`, `learning_category`, `sub_category`, `tier`, optional `adr_draft_path`, optional `impact`, optional `taxonomy_justification`, optional `resolution_trace_path`.
   - Markdown (`.md`) → parse YAML frontmatter for the same fields.
3. Validate the mandatory fields:
   - `source_type` MUST equal `"inferred_from_code"`.
   - `evidence` MUST be a non-empty list.
   - `confidence` MUST be one of `"high"` | `"medium"` | `"low"`.
   - `learning_category` MUST be one of `arch | domain | product | quality | standards` OR carry a `learning_category_proposed: true` flag with a complete `taxonomy_justification` block.
   - For hierarchical parents (arch, quality, standards): `sub_category` MUST be present OR `sub_category_proposed: true` with a complete `taxonomy_justification`.
   - For flat parents (domain, product): `sub_category` MUST be null or absent.
   - `tier` MUST be one of `1` | `2` | `3`.

Any validation failure produces a structured failure with `what_failed: invalid_proposal` and the offending file path. Do NOT silently drop invalid proposals.

### 3. Classify by tier (sanity-check)

Confirm each proposal's declared tier matches the /reap tier table:

| Target path | Expected tier |
|-------------|---------------|
| `user-provided/project-profile.yaml` | 1 |
| `architecture/*.yaml` | 1 |
| `specification/quality-profile.yaml` | 2 |
| `specification/domain-selection.yaml` | 2 |
| `specification/market-brief.md` | 2 |
| `scope/scope.yaml` | 2 |
| `scope/garura:enriched-capabilities.yaml` | 2 |
| `scope/features.yaml` | 2 |
| `scope/mvp-recommendation.md` | 2 |
| `scope/epics/*.yaml` | 2 |
| `research/*.md` | 2 |
| `experience/*` | 3 |

A mismatch between declared tier and expected tier for the target path is a `what_failed: tier_mismatch` failure.

### 4. Compose master index

Write `proposals.yaml` at `output_path`:

```yaml
schema_version: "1.0"
generated_at: "<ISO timestamp>"
scan:
  status: "<scan_status>"
  repos: [...]
  frontend_detected_any_repo: <bool>
  duration_seconds: <float>
incremental_mode: <bool>
target_filter: <string or null>
skipped_phases: [...]
skipped_locked: [...]
total_proposals: <int>
alignment_confirmed: <bool>   # true when total_proposals == 0
tier_counts:
  tier_1: <int>
  tier_2: <int>
  tier_3: <int>
confidence_counts:
  high: <int>
  medium: <int>
  low: <int>
learning_category_counts:
  arch: <int>
  domain: <int>
  product: <int>
  quality: <int>
  standards: <int>
proposals:
  - proposal_id: "<slug>"
    target_path: "<relative to product LTM>"
    artifact_path: "<absolute STM path to the proposal file>"
    learning_category: "<canonical value>"
    sub_category: "<canonical child or null>"
    learning_category_proposed: <bool, default false>
    sub_category_proposed: <bool, default false>
    taxonomy_justification: {...}   # only when *_proposed: true
    tier: 1 | 2 | 3
    source_type: "inferred_from_code"
    confidence: "high" | "medium" | "low"
    evidence: [...]
    resolution_trace_path: "<path or null>"
    adr_draft_path: "<path or null>"   # only when tier == 1 and conflicts with LOCKED LTM
    impact: {...}                       # only when adr_draft_path is present
    notes: "<free text>"
```

### 5. Compute proposal_id

For each proposal, derive a stable `proposal_id`:

- Strip extension from `target_path`
- Replace path separators with dashes
- Lowercase
- Suffix with `-<short-hash>` where short-hash is 8 chars of the SHA-256 of the proposal file bytes, to make re-runs stable and detect content changes

## Output

Primary artifact: `proposals.yaml` at `output_path`.

No decision manifest — this skill makes no inferred decisions. It is a deterministic aggregator over artifacts other skills produced.

## Failure Modes

```yaml
status: failure
what_failed: "<proposals_root_missing | scan_result_missing | invalid_proposal | tier_mismatch>"
detail: "<specific error string>"
evidence:
  offending_path: "<file path>"
  offending_field: "<field name, if applicable>"
```

## Notes

- Zero-proposal case is valid: if `proposals_root` is empty (e.g., fully aligned LTM in incremental mode), write `total_proposals: 0` and `alignment_confirmed: true`. Do NOT raise a failure.
- This skill enforces structural validation only. Semantic correctness of each proposal's content is the originating infer-*-from-code skill's responsibility.
- `proposals.yaml` is the single artifact /garura:enrich consumes. Treat its schema as a stable contract.
