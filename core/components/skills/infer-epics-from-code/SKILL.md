---
name: infer-epics-from-code
description: Derive epic boundaries for a brownfield codebase by clustering capabilities from features.yaml, enriched-capabilities.yaml, scope.yaml, and domain-selection.yaml using co-change, KB domain grouping, version tags, and ADR titles. Produces one minimal intent-epic stub per derived epic. Used exclusively by product-keeper during /codify.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-epics-from-code

Called by `product-keeper` during the `/codify` play, after `infer-features-from-code`.
Produces one `scope/epics/{epic-id}.yaml` file per derived epic at
`{stm_base}/{issue}/evidence/codify/proposals/scope/epics/{epic-id}.yaml`,
plus a single decision manifest covering every epic-boundary decision.

## Purpose

`/codify` bootstraps the product LTM for a brownfield repo. Once features and
capabilities are inferred, the product trunk needs **epic boundaries** — the
user-intent bundles that group related capabilities into shippable milestones.
This skill clusters capabilities into epics using four code-resident signals:
git co-change (coupled files indicate coupled capabilities), KB domain
taxonomy (capabilities under the same domain commonly form one epic),
version tags (version-labeled milestones mark historical epic boundaries),
and ADR titles (ADRs typically correspond to epic-scope decisions).

Epics authored from code are **MINIMAL intent-epic stubs**. Fields like
`success_scenarios`, `failure_scenarios`, `hypothesis`, `intent_lock`, and
the features ledger are NOT inferable from code alone — asserting them would
be fabrication, not inference. This skill marks scenario fields with
`knowledge_gap: true` and leaves them for /enrich to surface to stakeholders.
Nothing is filled in speculatively; a gap is recorded as a gap.

Tier-2 inference with `learning_category: product` and `sub_category: null`.

## Input

Receive from the /codify play orchestrator via JSON contract. All paths absolute.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | Path to `scan-index.json` produced by `scan.py`. |
| `stm_base` | yes | STM root, resolved from `stm.base-path` in `.garura/core/config.yaml`. |
| `issue` | yes | Issue number (STM namespace). |
| `output_dir` | yes | `{stm_base}/{issue}/evidence/codify/proposals/scope/epics/`. This skill writes MULTIPLE files (one per epic), so `output_dir` is used instead of `output_path`. |
| `decision_manifest_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/scope/decision-manifest-infer-epics.yaml`. Single manifest for the whole invocation. |
| `resolution_trace_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/scope/resolution-trace-infer-epics.yaml`. |
| `ltm_context` | yes | Resolution Protocol context block from product-keeper (contains `product_base`, `kb_base`, already-resolved LTM paths). |
| `related_proposal_paths` | yes | Map with absolute paths to upstream proposals: `features_yaml`, `enriched_capabilities_yaml`, `scope_yaml`, `domain_selection_yaml`. |
| `kb_domain_dir` | yes | `core/components/memory/knowledge/domain/` — canonical domain catalog used for KB-based clustering. |

## Process

### 1. Validate inputs

- Confirm `scan_index_path` exists and is valid JSON. Missing → `scan_index_missing`.
- Confirm every path in `related_proposal_paths` exists and is valid YAML.
  Any missing → `missing_related_proposal` with `offending_path` set.
- Confirm `output_dir` exists or is creatable. Failure → `output_dir_unwritable`.

### 2. Resolution Protocol walk (write resolution-trace first)

Per `core/components/memory/standards/rules/resolution.md`. Record every probe.

- **R1 — STM.** Skipped for /codify. Record skip reason `"codify-bootstrap"`.
- **R2 — Product LTM.** Probe `{product_base}/scope/epics/`. If present and
  LOCKED, emit proposals only for epics not already covered; overlaps surface
  as `alignment_confirmed` entries. Else proceed.
- **R3 — KB.** Read `{kb_domain_dir}/*.md` to harvest canonical domain slugs
  and feature IDs — the clustering vocabulary for Step 3b.
- **R4 — Web.** Not invoked; inference is closed-universe.

### 3. Cluster capabilities into epic candidates

Read `enriched-capabilities.yaml` to get the full capability list. Apply two
clustering heuristics in order; each capability may appear in at most one
emitted epic.

**3a. Co-change clustering.** From `scan_index.git.co_change_top`, map each
file to the capability it implements (via `features.yaml` evidence paths;
else via the capability's evidence path). Capabilities whose files co-change
across ≥ 2 pairs merge into one epic candidate. Record the pairs as `evidence`.

**3b. KB domain grouping.** For capabilities not yet clustered, group by
the domain slug from `enriched-capabilities.yaml` (or derived via
`domain-selection.yaml`). Same-domain capabilities form one epic candidate
unless 3a already split them.

**3c. Version-tag and ADR reinforcement.** Read `scan_index.git.tags_recent`
and `scan_index.docs.adrs`. Tags with semantic prefixes (e.g., `v2.0-payments`)
and ADR titles containing capability or domain names reinforce existing
candidates as additional `evidence`. Neither signal creates new epics alone.

**3d. Size check.** Target 1–10 epics per codebase. If the pipeline produced
> 20 candidates, halt with `too_many_epics`. If < 1 (no capabilities at all),
halt with `insufficient_signal`.

### 4. Populate minimal intent-epic stubs

For each surviving candidate, emit one YAML file to
`{output_dir}/{epic-id}.yaml`. Epic id format:
`epic-{domain-slug}-{short-name}-001` (mirrors the convention in
`.garura/product/scope/epics/`). Populate ONLY these fields:

- `id`, `name`, `version: "0.1.0"`, `description` (≤ 3 sentences, synthesized
  from clustered capabilities).
- `related_capabilities`: capability ids in this epic.
- `constraints`: strictly evidenced. Quantified perf constraints only if a
  rate-limit, timeout, or SLO config exists in `scan_index.config_files`;
  else `[]`.
- `business_rules`: rules traceable to KB entries or code-evidenced
  invariants (e.g., enforcing middleware); else `[]`.
- `success_scenarios` / `failure_scenarios`: marked `knowledge_gap: true`
  with a `note` pointing /enrich at the gap. NEVER populated from code.
- `evidence_paths`: scan-index pointers and file paths that drove the boundary.

Do NOT emit `intent_lock`, `appetite`, `features[]` ledger, `hypothesis`,
`assumptions_requiring_validation`, `kb_source`, `epic_status` — those are
/enrich and /specify concerns.

### 5. Write artifacts, decision manifest, resolution trace

Write the decision manifest before the per-epic files so a crash mid-write
still preserves the audit trail. Every boundary decision (cluster formed,
cluster split, candidate rejected for insufficient signal, proposal
overlapping locked LTM) gets one `decisions[]` entry.

## Output

### Per-epic artifact — `{output_dir}/{epic-id}.yaml`

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "<scan-index JSON pointer or file path>"
  confidence: "high" | "medium" | "low"
  learning_category: "product"
  sub_category: null
  tier: 2
epic:
  id: "<epic-id>"
  name: "<human-readable epic name>"
  version: "0.1.0"
  description: "<≤3 sentences synthesized from clustered capabilities>"
  related_capabilities:
    - "<capability-id>"
  constraints: []        # evidenced only; empty if no rate-limit/SLO config found
  business_rules: []     # evidenced only; empty if no code-invariant or KB hit
  success_scenarios:
    knowledge_gap: true
    note: "Not inferable from code alone. Stakeholder input required at /enrich."
  failure_scenarios:
    knowledge_gap: true
    note: "Not inferable from code alone. Stakeholder input required at /enrich."
  evidence_paths:
    - "<path into scan index or repo>"
```

Comment header in every file: `# Minimal intent-epic stub. Scenarios are
knowledge gaps, not placeholders — /enrich must surface them to stakeholders.`

### Decision manifest — `decision-manifest-infer-epics.yaml`

Standard Garura shape (`schema_version`, `skill`, `generated_at`,
`decisions[]`). One entry per epic-boundary decision: cluster formed, split
resolved, candidate rejected, overlap with locked LTM, new-epic proposal.
Each decision carries `decision_id`, `decision_type`, `tier` (per Decision
Surfacing Discipline), `grounding_source`, `recommendation`, `alternatives`,
`chosen_reason`.

### Resolution trace — `resolution-trace-infer-epics.yaml`

R1..R3 probes with `source`, `path`, `outcome`, extracted payload. R4 omitted.

### Return contract (to orchestrator)

```yaml
status: success
output_dir: "<output_dir>"
epic_artifact_paths:
  - "<output_dir>/<epic-id>.yaml"
decision_manifest_path: "<decision_manifest_path>"
resolution_trace_path: "<resolution_trace_path>"
epic_count: <int>
overall_confidence: "high" | "medium" | "low"
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
- `missing_related_proposal` — one of `features_yaml`,
  `enriched_capabilities_yaml`, `scope_yaml`, `domain_selection_yaml` is
  absent or unreadable.
- `scan_index_missing` — `scan_index_path` absent or not valid JSON.
- `ltm_resolution_failed` — R2 probe errored (path escapes sandbox or
  existing epic YAML not parseable).
- `insufficient_signal` — zero capabilities to cluster, or scan index carries
  no co-change, no tags, and no ADRs.
- `too_many_epics` — > 20 candidates. Halt and report for parameter tuning;
  no partial write.
- `output_dir_unwritable` — `output_dir` cannot be created.

## Boundaries

- Read-only against `scan_index_path`, upstream proposals, and `kb_domain_dir`.
- Writes MULTIPLE files under `output_dir` plus one decision manifest and one
  resolution trace. Never writes to `.garura/product/` in place.
- Emits minimal stubs — NEVER fabricates scenario fields. Those are explicit
  knowledge gaps routed to /enrich for stakeholder input.
- Does NOT re-run `scan.py`; stale scan-index is the orchestrator's concern.
- Does NOT promote any epic to product LTM — that is /enrich's job.
