---
name: infer-quality-vision-from-code
description: Synthesize a quality-vision proposal for a brownfield codebase by merging the already-inferred nfr-spec, quality-profile, physical-architecture, and logical-architecture proposals, then attaching scan-index signals (ADRs, CI/lint/test config files, commit cadence) to the relevant ISO 25010 characteristics. Produces a Tier 1 proposal at architecture/quality-vision.yaml. Used exclusively by tech-architect during /codify.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-quality-vision-from-code

Called by `tech-architect` during the `/codify` play, AFTER `infer-nfr-spec-from-code`,
`infer-quality-profile-from-code` (test-engineer output), `infer-physical-architecture-from-code`,
and `infer-logical-architecture-from-code` have already written their proposals. Produces
`architecture/quality-vision.yaml` at
`{stm_base}/{issue}/evidence/codify/proposals/architecture/quality-vision.yaml`, plus a
companion decision manifest and resolution trace.

## Purpose

By the time this skill runs, four upstream proposals already describe *what* the codebase
does for quality: `quality-profile.yaml` (ISO 25010 relevance + target levels),
`nfr-spec.yaml` (per-NFR mechanisms + verification methods), `physical-architecture.yaml`
(specific named products), `logical-architecture.yaml` (component IDs + responsibilities).

This skill does **synthesis, not fresh inference**. The primary source for every vision
field is the upstream proposals; scan-index is used *only* to attach ADR references and
CI/lint/test config files to the right characteristic, and to read commit cadence for the
reliability narrative. It does NOT re-pick tools, re-set thresholds, or re-target levels.
Re-inference across boundaries is a discipline violation (see Boundaries).

Output is a Tier 1 proposal — `learning_category: quality`, `sub_category: architecture`.
Per DSD, high-confidence tier-1 entries flow through the batch-confirm surfacing stream at
the /codify checkpoint; knowledge gaps flow through the 1-by-1 stream.

## Input

Receive from the /codify play orchestrator via JSON contract. All paths absolute.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | Path to `scan-index.json` produced by `scan.py`. Secondary input — used only for ADRs, config_files, and git.commits_analyzed. |
| `stm_base` | yes | STM root, resolved from `stm.base-path` in `.garura/core/config.yaml`. |
| `issue` | yes | Issue number (STM namespace). |
| `output_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/architecture/quality-vision.yaml`. |
| `decision_manifest_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/architecture/decision-manifest-infer-quality-vision-from-code.yaml`. |
| `resolution_trace_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/architecture/resolution-trace-infer-quality-vision-from-code.yaml`. |
| `ltm_context` | yes | Resolution Protocol context block from tech-architect (`product_base`, `core_base` / `kb_base`, `query_domains`, `locked_artifacts`). |
| `related_proposal_paths` | yes | Map with absolute paths to the four upstream proposals: `nfr_spec_yaml`, `quality_profile_yaml`, `physical_architecture_yaml`, `logical_architecture_yaml`. All four are required — this skill cannot run without them. |

## Process

### 1. Validate inputs

- Confirm `scan_index_path` exists and is valid JSON. Missing → `scan_index_missing`.
- Confirm every path in `related_proposal_paths` exists and parses as YAML. Any missing
  or malformed → `missing_related_proposal` with `offending_path` set. This skill is
  synthesis-only; without the four upstream proposals it cannot produce a valid vision.
- Confirm `output_path` parent directory exists or is creatable. Failure →
  `output_parent_missing`.

### 2. Resolution Protocol walk (write resolution-trace first)

Per `core/components/memory/standards/rules/resolution.md`. Record every probe.

- **R1 — STM.** Skipped for /codify (`reason: codify-bootstrap`).
- **R2 — Product LTM.** Probe `{product_base}architecture/quality-vision.yaml`. If
  present and LOCKED, surface overlaps as `alignment_confirmed` entries. Absent → proceed.
- **R3 — KB.** Probe `{kb_base}/knowledge/quality/` (fallback
  `core/components/memory/knowledge/quality/`) for vision-narrative templates per ISO
  25010 characteristic. KB narratives seed phrasing; synthesis adapts to this product.
- **R4 — Web.** Not invoked. Closed-universe over upstream proposals + scan-index + KB.

### 3. Parse the four upstream proposals into a synthesis table

Build one row per ISO 25010 characteristic whose `quality-profile.yaml` relevance is
not `not_applicable`. For each row, pull columns directly from the proposals — never
from fresh inference:

- `target_level` ← `quality-profile.yaml:characteristics[].target` (with any adjustment
  already recorded in `nfr-spec.yaml`).
- `design_linkage.components` ← `logical-architecture.yaml:components[].id` for every
  component whose responsibilities address this characteristic (read the responsibilities
  text; no new mapping beyond what logical-architecture already states).
- `design_linkage.nfrs` ← `nfr-spec.yaml:nfrs[].id` filtered to
  `characteristic == <row>`.
- `tooling` ← named products from `physical-architecture.yaml` (library_pins, observability,
  auth_infra, ci stack) that are already identified as serving this characteristic. If
  physical-architecture named a tool, use it verbatim with its version. Do NOT re-pick.
- `thresholds` ← quantified values from `nfr-spec.yaml:nfrs[].target` and from
  `quality-profile.yaml:characteristics[].target`. These are echoed, not synthesized.
- `vision_narrative` ← a 2-5 sentence synthesis that frames *why* this characteristic
  matters for this product. Source material: (a) quality-profile `rationale`, (b) epic
  descriptions already available in `.garura/product/scope/epics/` (from earlier /codify
  stages or locked LTM), (c) KB narrative templates from R3. This is the ONE field
  genuinely authored here — everything else is echo + attach.

### 4. Attach scan-index signals — bounded to three uses only

Scan-index is a **secondary** input; it contributes attachments, not decisions.

- **`docs.adrs` → ADR references.** Match each ADR title to a characteristic by keyword
  (e.g., "ADR-0007: connection pooling" → performance_efficiency). Attach as
  `design_linkage.adrs[]`. Ambiguous titles attach to every plausible characteristic
  and record as a manifest decision.
- **`config_files` → lifecycle gates.** Lint (`eslint.config.*`, `ruff.toml`, `.flake8`),
  type (`tsconfig.json`, `mypy.ini`), test (`jest.config.*`, `vitest.config.*`,
  `pytest.ini`), and CI (`.github/workflows/*.yml`, `.gitlab-ci.yml`) map to lifecycle
  gates under maintainability and reliability. Use the scan-index excerpt (do NOT re-read
  source) to determine stage: pre-commit, PR blocking, nightly, pre-deploy.
- **`git.commits_analyzed` → reliability cadence signal.** Commit frequency + revert
  rate feeds the reliability narrative as a cadence signal. Narrative only — do NOT
  derive thresholds from commit counts.

No other scan-index fields feed this skill. `trees`, `entry_points`, `patterns`,
`manifests` are out of scope — they served upstream proposals already.

### 5. Compose the top-level vision statement

Synthesize a 3-5 sentence `vision_statement` from (a) product name (via `ltm_context` →
`project-profile.yaml`), (b) the two or three highest-relevance characteristics from
`quality-profile.yaml`, and (c) primary use cases from the MVP proposal already written
earlier in /codify. The statement names which characteristics are load-bearing and why,
in the product's own terms.

### 6. Emit per-characteristic entries

One entry per synthesis row from step 3 under `quality_vision.iso_25010` with fields
`narrative`, `target_level`, `design_linkage`, `tooling`, `thresholds`, `lifecycle_gates`.
Field shapes mirror `core/components/skills/derive-quality-vision/SKILL.md` — defer there.

**Knowledge gap handling.** If `quality-profile.yaml` marks a characteristic relevant but
`nfr-spec.yaml` has no matching NFR AND `physical-architecture.yaml` names no tool, emit
`knowledge_gap: true` with a `note` identifying the silent upstream. NEVER fabricate a
narrative or invent tooling to close the gap.

### 7. Write decision manifest

Inferred decisions here are narrow — most fields are echoed from upstream:

| decision_id prefix | decision_type | Decided |
|--------------------|---------------|---------|
| `D-iqvc-001` | `vision-narrative-framing` | Which driver (business risk, compliance, UX) leads each narrative — synthesized from quality-profile rationale + epic text + KB template. |
| `D-iqvc-002` | `adr-to-characteristic-attach` | Which characteristic(s) each `docs.adrs` entry attaches to. |
| `D-iqvc-003` | `config-file-to-lifecycle-gate` | For each config file, which characteristic + gate stage. |
| `D-iqvc-004` | `knowledge-gap-flag` | Per characteristic, whether upstream coverage is complete or a gap is recorded. |

Standard manifest shape (`schema_version`, `skill`, `generated_at`, `decisions[]`). Each
decision carries `decision_id`, `decision_type`, `tier` (per DSD), `grounding_source`
(kb_path or upstream-proposal pointer), `recommendation`, `alternatives_considered`,
`agent_reasoning_summary`. Write the manifest BEFORE the primary artifact.

### 8. Write primary artifact and return

Write `quality-vision.yaml` to `output_path`. Return the output contract to
tech-architect.

## Output

### Primary artifact — `{output_path}`

Shape mirrors `core/components/skills/derive-quality-vision/SKILL.md` (the canonical
schema) with `meta.source_type: inferred_from_code` and `tier: 1`. Top-level skeleton:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:                            # upstream proposal paths + three scan-index pointers
    - "<nfr_spec_yaml>"
    - "<quality_profile_yaml>"
    - "<physical_architecture_yaml>"
    - "<logical_architecture_yaml>"
    - "scan-index.json#/docs/adrs"
    - "scan-index.json#/config_files"
    - "scan-index.json#/git/commits_analyzed"
  confidence: "high" | "medium" | "low"
  learning_category: "quality"
  sub_category: "architecture"
  tier: 1
quality_vision:
  vision_statement: "<3-5 sentences>"
  iso_25010:
    <characteristic-key>:
      narrative: "<2-5 sentences>"
      target_level: "<echoed from quality-profile / nfr-spec>"
      design_linkage: { components: [...], nfrs: [...], adrs: [...] }
      tooling: [ { name, version, purpose } ]   # every name from physical-architecture
      thresholds: [ "<quantified value>" ]      # every value echoed, not synthesized
      lifecycle_gates: [ { gate, tool, threshold } ]
      # knowledge_gap: true + note   — when upstream is silent
  knowledge_gaps: [ { characteristic, silent_upstream, note } ]
  excluded_characteristics: [ { characteristic, reason } ]
```

### Decision manifest — `{decision_manifest_path}`

Standard Garura decision-manifest shape. See step 7 for the inferred-decision catalog.

### Resolution trace — `{resolution_trace_path}`

R1..R3 probes with `source`, `path`, `outcome` (`hit | miss | skipped`), extracted
payload where applicable. R4 omitted.

### Return contract (to tech-architect)

```yaml
status: success
output_path: "<output_path>"
decision_manifest_path: "<decision_manifest_path>"
resolution_trace_path: "<resolution_trace_path>"
characteristics_covered: <int>
characteristics_excluded: <int>
knowledge_gap_count: <int>
overall_confidence: "high" | "medium" | "low"
```

## Failure Modes

```yaml
status: failure
what_failed: "<code>"
detail: "<specific error>"
evidence:
  offending_path: "<file path if applicable>"
```

Codes:

- `missing_related_proposal` — one or more of `nfr_spec_yaml`, `quality_profile_yaml`,
  `physical_architecture_yaml`, `logical_architecture_yaml` is absent or unreadable.
  This skill cannot synthesize without all four.
- `scan_index_missing` — `scan_index_path` absent or not valid JSON.
- `insufficient_signal` — `quality-profile.yaml` declares every characteristic
  `not_applicable` (nothing to write), OR every relevant characteristic is a knowledge
  gap because upstream proposals are silent. Return with `overall_confidence: low` and
  the knowledge-gap list populated; do NOT fabricate entries.
- `ltm_resolution_failed` — R2 probe errored (existing LTM quality-vision not parseable).
- `output_parent_missing` — `output_path` parent cannot be created.

## Boundaries

- **Synthesis, not fresh inference.** Tool picks come from `physical-architecture.yaml`.
  Target levels come from `quality-profile.yaml` / `nfr-spec.yaml`. Component IDs come
  from `logical-architecture.yaml`. If this skill finds itself choosing between Jest and
  Vitest, setting a coverage threshold, or picking an observability stack — STOP. That
  is an upstream concern; re-picking is a boundary violation.
- **Scan-index is secondary.** Only `docs.adrs`, `config_files`, and
  `git.commits_analyzed` feed this skill. Other fields are out of scope.
- **Read-only against the codebase.** Source files are not opened.
- **Writes stay under `{stm_base}/{issue}/evidence/codify/proposals/architecture/`.**
  Never writes to `.garura/product/`. Promotion is /enrich's job.
- **Knowledge gaps are gaps, not placeholders.** When upstream is silent, emit
  `knowledge_gap: true` with a pointer — never fabricate to close the gap.
- **Does not re-run `scan.py`.** Stale scan-index is the orchestrator's concern.
- **Always Tier 1.** `learning_category: quality`, `sub_category: architecture` — /codify
  routes confirmations through the batch-confirm flow per DSD.
