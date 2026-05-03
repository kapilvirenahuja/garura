---
name: aggregate-decode-proposals
description: Walk the /decode proposals tree (behaviors/, flows/, aspects/, generated-tests/) plus per-unit test-run reports and citation-integrity reports, then produce a master proposals.yaml — the single artifact /garura:enrich consumes to promote /decode output to product LTM. Pattern matches aggregate-codify-proposals. Deterministic — no LLM reasoning.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# aggregate-decode-proposals

Called by the `/decode` play after all units have completed extraction, test generation, test execution, and citation-integrity verification. Produces the master index.

## Purpose

Each extracted unit (feature, flow, aspect) writes its spec under `proposals/scope/{stream}/{unit-id}.yaml` and its generated tests under `proposals/generated-tests/{tier}/`. Verification artifacts land under `test-run-reports/` and `citation-integrity-reports/`. This skill walks that tree, joins every unit's spec with its verification outcomes, classifies each proposal against the /reap two-level taxonomy, and writes `proposals.yaml` — the single artifact /garura:enrich reads when promoting /decode output to product LTM.

## Input

Receive from the `/decode` play orchestrator via JSON contract.

- `proposals_root` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals/`.
- `test_run_reports_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/test-run-reports/`.
- `citation_integrity_reports_dir` (path, required) — `{stm_base}/{issue}/evidence/decode/citation-integrity-reports/`.
- `features_yaml_path` (path, required) — resolved features.yaml (LTM or --features-from). Used for tier classification (Tier 2 vs Tier 3).
- `product_base` (path, required) — for checking whether behaviors/flows/aspects already exist in LTM.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/decode/proposals.yaml`.
- `skipped_units` (list, optional) — units deferred or excluded, with reasons (per C12 or user decisions at Phase 1).

## Process

### 1. Validate inputs

- Confirm `proposals_root` exists and is a directory.
- Confirm `features_yaml_path` exists and parses.
- Confirm `output_path` parent directory exists.

### 2. Walk proposals

For each of `proposals_root/scope/behaviors/*.yaml`, `proposals_root/scope/flows/*.yaml`, `proposals_root/scope/aspects/*.yaml`:

1. Determine `stream` from the parent directory.
2. Load the spec, parse its `meta` block. Mandatory fields: `source_type` (must be `extracted_from_code`), `confidence`, `evidence[]`, `learning_category` (must be `product`), `sub_category` (must be `null`), `tier`, and the unit-specific identifier (`feature_ref`, `flow_id`, or `aspect_id`).
3. Extract aggregate counts from the spec: `rules_count`, `scenarios_count`, `ambiguity_count`, `knowledge_gap_count`, `file_surface_loc`, `generated_tests_ref[]`.

Any spec failing `meta`-block validation is a structural failure: `what_failed: invalid_proposal` with the offending path.

### 3. Join with test-run reports

For each unit, look up its test-run report at `{test_run_reports_dir}/{unit-id}-*.yaml`. Extract `summary.total`, `summary.passed`, `summary.failed`, `summary.skipped`. Compute `baseline_green`:
- `true` — all tests pass (`failed == 0 && skipped == 0`) AND `total >= 1`
- `false` — any test failed, OR `total == 0` (unit has no tests — invalid per C23/F9)
- `deferred` — unit appears in `skipped_units` with status `deferred` per C12

Any unit with no test-run report AND not in `skipped_units` is a structural failure per F24 (status-disk disagreement).

### 4. Join with citation-integrity reports

For each unit, look up its citation-integrity report at `{citation_integrity_reports_dir}/{unit-id}.yaml`. Extract `summary.integrity_status`. Record `citation_integrity_status`.

Any unit whose report is missing (and unit is not deferred) is a structural failure.

### 5. Classify tier

Tier is assigned by presence in product LTM:
- `Tier 2` (enrichment) — the unit has a matching entry in `{product_base}/scope/{stream}/{unit-id}.*` already (or is a feature whose entry exists in `features.yaml`, same test for behaviors). The behavior-spec enriches an existing LTM record.
- `Tier 3` (addition) — the unit exists only in STM features.yaml (from a prior /codify run) or is a new flow/aspect with no LTM entry. /garura:enrich promotes the feature and its behavior spec together.

### 6. Compute proposal_id

For each proposal, derive a stable `proposal_id`:
- Strip extension from `spec_path`
- Replace path separators with dashes
- Lowercase
- Append `-<8-char SHA-256 of spec file bytes>`

### 7. Emit proposals.yaml

Write at `output_path`:

```yaml
schema_version: "1.0"
generated_at: "{ISO timestamp}"
decode_run:
  issue: "<issue-number>"
  features_yaml_path: "{features_yaml_path}"
  total_units: <int>
  streams:
    behaviors: <int>
    flows: <int>
    aspects: <int>
  tests_generated:
    tier_a_contract: <int>
    tier_b_flow: <int>
    tier_c_unit_pure: <int>
    cited_existing: <int>
  baseline_green:
    pass: <int>
    fail: <int>
    deferred: <int>
tier_counts:
  tier_2: <int>
  tier_3: <int>
confidence_counts:
  high: <int>
  medium: <int>
  low: <int>
skipped_units: [...]
proposals:
  - proposal_id: "<slug>-<hash>"
    stream: "behaviors | flows | aspects"
    unit_id: "<id>"
    spec_path: "<relative to proposals_root>"
    target_path: "scope/{stream}/{unit-id}.yaml"   # destination under product_base post-/garura:enrich
    generated_tests_refs:
      - tier: "contract"
        file: "proposals/generated-tests/contract/..."
    overall_confidence: "high | medium | low"
    rules_count: <int>
    scenarios_count: <int>
    ambiguity_count: <int>
    knowledge_gap_count: <int>
    file_surface_loc: <int>
    tier: 2 | 3
    source_type: "extracted_from_code"
    learning_category: "product"
    sub_category: null
    citation_integrity_status: "pass | fail"
    baseline_green: true | false | deferred
    notes: ""
alignment_confirmed: <bool>   # true when total_units == 0
```

## Output

Primary artifact: `proposals.yaml` at `output_path`.

No decision manifest — aggregation is deterministic.

## Failure Modes

```yaml
status: failure
what_failed: "proposals_root_missing | invalid_proposal | missing_test_run_report | missing_integrity_report | tier_resolution_failed"
detail: "<specific>"
evidence: { offending_path: "<path>", offending_field: "<field>" }
```

## Notes

- Zero-unit case (total_units: 0) is valid per /decode C15. Emits an empty proposals list with alignment_confirmed: true.
- The aggregator enforces structural validation only. Semantic correctness of each spec is the authoring skill's responsibility; baseline-green is the test-runner's responsibility; citation integrity is its own skill's responsibility. This skill joins their outputs, not re-runs their logic.
- `source_type` is uniformly `extracted_from_code` — distinct from /codify's `inferred_from_code` so /garura:enrich routes behavior output through its own consumption path.
- The skill does not mutate any input artifact — it is strictly a reader + writer for its own output.
