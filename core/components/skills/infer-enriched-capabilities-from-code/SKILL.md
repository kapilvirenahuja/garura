---
name: infer-enriched-capabilities-from-code
description: Infer per-capability enrichment (business rules, depth spectrum cap, experiential warnings) during /codify by merging KB base values from core/components/memory/knowledge/domain/{domain}.md with project-specific overrides evidenced in scan-index.json. Produces scope/enriched-capabilities.yaml. Used exclusively by product-keeper in the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-enriched-capabilities-from-code

Called by `product-keeper` during /codify after `infer-scope-from-code`. Produces `scope/enriched-capabilities.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/scope/enriched-capabilities.yaml`.

## Purpose

During /codify (brownfield bootstrap), the enriched-capabilities artifact that /specify normally assembles through `enrich-capabilities` (KB + frozen project-profile interview) must be reverse-engineered from the existing codebase. This skill consumes the upstream proposals produced earlier in /codify — `scope.yaml`, `domain-selection.yaml`, `project-profile.yaml` — together with `scan-index.json`, and emits per-capability enrichment where every override against the KB base is grounded in a concrete scan-index evidence path or source file.

The KB carries generic capability definitions per domain (base business rules, a four-level depth spectrum, experiential warnings). The code carries the project's actual posture: what middleware is wired, what test coverage thresholds are declared, which modules churn the most, what naming conventions dominate. This skill merges the two so downstream intent-epic generation in /codify has a single enriched source per selected capability — no downstream step re-reads the KB or re-parses the scan.

## Input

Receive from `product-keeper` via JSON contract.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | `scan-index.json` produced by scan-codebase. |
| `stm_base` | yes | STM root resolved from `.garura/core/config.yaml` `stm.base-path`. |
| `issue` | yes | Issue number driving /codify. |
| `related_proposal_paths` | yes | List of upstream proposal paths — MUST include the codify proposals for `scope.yaml`, `domain-selection.yaml`, `project-profile.yaml`. |
| `kb_domain_dir` | yes | `core/components/memory/knowledge/domain/` — the canonical per-domain capability KB. |
| `output_path` | yes | `{stm_base}/{issue}/evidence/codify/proposals/scope/enriched-capabilities.yaml`. |
| `decision_manifest_path` | yes | `decision-manifest-infer-enriched-capabilities-from-code.yaml` alongside the artifact. |
| `ltm_context` | yes | `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol. |
| `resolution_trace_path` | yes | Where `resolution-trace.yaml` is written. |

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON; confirm each path in `related_proposal_paths` exists and is readable; confirm `kb_domain_dir` exists and contains at least one `{domain}.md`. If any mandatory proposal is missing → structured failure `missing_related_proposal`. If `kb_domain_dir` is absent → `kb_domain_dir_missing`. If the scan index is unreadable → `scan_index_missing`.

2. **Parse related proposals.** Load `scope.yaml` → extract `selected_capabilities` (each entry has `id`, `domain`, and any `depth_cap` from cross-tree constraints). Load `domain-selection.yaml` → confirm each capability's `domain` appears in the selected-domain set. Load `project-profile.yaml` → capture `security_level`, `compliance_hints`, `team_size`, `delivery` maturity markers for override logic.

3. **Execute LTM Resolution Protocol** per `core/components/memory/standards/rules/resolution.md` (R1 → R2 → R3 → R4). R3 reads the per-capability KB detail block from `{kb_domain_dir}/{domain}.md`. Domains to query are derived from the union of `scope.selected_capabilities[*].domain`. Write the trace to `resolution_trace_path`. If the protocol raises an unrecoverable error → `ltm_resolution_failed`.

4. **Per capability — extract the KB base block.** Use Grep to isolate each feature block in `{domain}.md` (e.g., `grep -A 200 "^### UM-F001" user-management.md` stopping at the next `###`). Parse the five structured sections: `Inclusion`, `Success Criteria`, `Failure Scenarios`, `Cross-Tree Refs`, `Experiential`, plus the Depth Spectrum. If a `selected_capability.id` has no matching KB block → record the capability with `kb_source: null`, `confidence: low`, and an entry in the decision manifest explaining the gap; do NOT fabricate base values.

5. **Per capability — extract code-evidenced overrides from scan-index.** Walk these scan-index keys, each a potential override signal:
   - `patterns.framework_idioms` scoped to the capability's module paths — e.g., rate-limit middleware, CSRF tokens, retry/circuit-breaker wrappers, RBAC guards. Each idiom hit attaches a business-rule override (e.g., "rate-limited per IP" when rate-limit middleware is present on an auth module).
   - `config_files.test` and `config_files.lint` — if a coverage threshold is declared (e.g., jest `coverageThreshold.global.lines >= 0.9`), cap `depth_spectrum_cap` at `deep`; a 70–89% target caps at `standard`; no coverage config caps at `mvp`.
   - `patterns.naming_suffix_counts` restricted to the capability's modules — high density of `*Service`/`*Repository`/`*Controller`/`*Policy` suffixes indicates layered maturity (push cap toward `deep`); flat `*.js` files with few suffixes keep cap at `mvp`.
   - `patterns.test_framework_signals` scoped to capability modules — presence of integration/e2e suites pushes cap toward `standard`+; unit-only tests cap at `mvp`/`standard`.
   - `git.churn_top` intersected with capability module paths — high churn across recent windows adds experiential warnings (e.g., "module has churned N times in last 90 days — treat as volatile") and caps depth down if the module is also under-tested.
   - `config_files.ci` — presence of security scans (SAST/dependency audit) adds security-ratchet business rules for auth/identity capabilities.
   - `docs.adrs` — any ADR whose preview names the capability contributes override rules quoted verbatim (with ADR path as evidence).

   For each override captured: record the exact rule text, the `kb_base` value it replaces or augments (if any), the `code_override` value, and the evidence path (scan-index JSON path or file path).

6. **Per capability — compute `depth_spectrum_cap`.** Combine the three caps derived in Step 5 (naming-suffix density, test coverage config, churn) by taking the minimum. Any KB cross-tree constraint carried via `scope.selected_capabilities[*].depth_cap` clamps the result further. The final cap is one of `mvp | standard | deep`. Record the cap inputs in the decision manifest.

7. **Per capability — assemble experiential warnings.** Start from the KB Experiential section ("Common mistakes" list). Extend with code-derived warnings:
   - High-churn modules → "volatility warning".
   - Auth/identity capabilities without rate-limit middleware in `patterns.framework_idioms` → "rate-limit missing".
   - Payment capabilities without idempotency-key patterns in code → "idempotency missing".
   Every added warning carries its scan-index evidence path.

8. **Compose the artifact YAML.** Write `meta` block first, then `enriched_capabilities` array. Meta lists the deduplicated union of every scan-index evidence path and every KB block path consulted across all capabilities.

9. **Write decision manifest.** One entry per override decision, plus one per `depth_spectrum_cap` decision, plus one per experiential warning added from code. Each entry: `{capability_id, field, tier, grounding_source, recommendation, alternatives_considered, confidence}`. `grounding_source` is `scan-index:<json-path>`, `kb:<file-path>#<feature-id>`, or `ltm:<resolved-file>`. Every override MUST carry ≥1 `alternatives_considered`.

## Output

Primary artifact at `output_path`:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/patterns/framework_idioms"
    - "scan-index.json#/config_files/test"
    - "scan-index.json#/patterns/naming_suffix_counts"
    - "scan-index.json#/git/churn_top"
    - "core/components/memory/knowledge/domain/user-management.md#UM-F001"
  confidence: "high" | "medium" | "low"
  learning_category: "product"
  sub_category: null
  tier: 2
enriched_capabilities:
  - id: "<capability-id>"            # e.g., UM-F001
    domain: "<domain-id>"            # e.g., user-management
    business_rules:                  # KB base merged with code-evidenced overrides
      - "..."
    depth_spectrum_cap: "mvp" | "standard" | "deep"
    experiential_warnings:
      - "..."
    code_evidence_paths:
      - "scan-index.json#/patterns/framework_idioms"
      - "src/auth/rate-limit.ts"
    overrides:
      - rule: "rate-limited per IP on login endpoint"
        kb_base: "generic auth throttling recommended"
        code_override: "express-rate-limit middleware wired in src/auth/router.ts"
        evidence: "scan-index.json#/patterns/framework_idioms[express-rate-limit]"
    kb_source:
      file: "core/components/memory/knowledge/domain/user-management.md"
      feature_id: "UM-F001"
```

Decision manifest at `decision_manifest_path`:

```yaml
decisions:
  - capability_id: "UM-F001"
    field: "business_rules[rate-limit]"
    tier: 2
    grounding_source: "scan-index:patterns.framework_idioms[express-rate-limit]"
    recommendation: "add 'rate-limited per IP' override onto KB base"
    alternatives_considered:
      - alt: "leave KB default throttling wording"
        why_not: "code evidences concrete middleware — specific wording beats generic"
    confidence: "high"
  # one entry per override, per depth-cap input, per code-derived warning
```

Resolution trace at `resolution_trace_path` per `resolution.md` schema.

No product LTM writes. All output is under STM.

## Failure Modes

- `missing_related_proposal` — one of `scope.yaml`, `domain-selection.yaml`, `project-profile.yaml` is absent from `related_proposal_paths` or unreadable.
- `kb_domain_dir_missing` — `kb_domain_dir` does not exist or is empty.
- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `ltm_resolution_failed` — Resolution Protocol raised an error; skill halts and returns the trace path for triage.
- `kb_feature_block_missing` — a `selected_capability.id` has no matching block in its domain KB file. The skill does NOT fail the run; it emits the capability with `kb_source: null`, `confidence: low`, and an explanatory manifest entry. Only if >50% of selected capabilities are missing KB blocks does this escalate to a structured failure.
- `insufficient_signal` — scan-index has no framework idioms, no config files, no churn, no naming suffixes. Emit enriched records with base KB values only, `confidence: low`, and every override list empty.
- `output_parent_missing` — `output_path` parent cannot be created; return structured failure.

## Boundaries

- Read-only against the codebase. The scan-index and the KB domain files are the sole inputs — this skill does NOT open source files directly except where a scan-index evidence path names one for citation.
- NEVER invent business rules, depth caps, or experiential warnings not derivable from the KB block, the scan-index, or the upstream proposals. When evidence is absent, the field stays at its KB base or is marked `null` — never fabricated.
- NEVER modify the KB catalog — read-only on `kb_domain_dir`.
- ALWAYS honor depth caps from `scope.selected_capabilities[*].depth_cap` — cross-tree constraints clamp, they never relax.
- ALWAYS ratchet security/compliance business rules UP when `project-profile.security_level` or `compliance_hints` demand it, even when the computed `depth_spectrum_cap` is lower.
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/scope/` and the two companion files (decision manifest, resolution trace).
