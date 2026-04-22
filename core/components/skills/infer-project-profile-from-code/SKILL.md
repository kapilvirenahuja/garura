---
name: infer-project-profile-from-code
description: Infer the foundational project-profile.yaml (product identity, team shape, technology posture, compliance hints, platform targets, delivery maturity) from scan-index.json during /codify, with every field grounded in concrete scan-index evidence and tagged source_type=inferred_from_code. Used exclusively by product-keeper in the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-project-profile-from-code

Called by `product-keeper` during /codify. Produces `user-provided/project-profile.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/user-provided/project-profile.yaml`.

## Purpose

During /codify (brownfield bootstrap), the product-profile artifact that /specify normally collects via a user interview must be reverse-engineered from the existing codebase. This skill consumes `scan-index.json` (produced by `scan-codebase`) and emits a proposal project-profile grounded entirely in signals already captured by the scan.

Signals this skill extracts from scan-index:

- **primary language** — which ecosystem in `manifests` is most numerous/central (node | python | go | rust | jvm | ruby | dotnet | elixir | dart | swift | php). Break ties by file count reported in `repos[*].file_count` restricted to that ecosystem's files.
- **frameworks** — parse `patterns.framework_idioms`, map the top hit(s) to declared framework names (e.g., `react`, `nextjs`, `fastapi`, `django`, `gin`, `rails`, `spring`).
- **runtime version** — manifest `engines` field for node; `go_version` for go; `python_requires` when present; analogous fields for rust/ruby/jvm/dotnet.
- **team_size** — bucket `git.contributors` count: `solo-dev` (1), `small` (2-5), `medium` (6-20), `large` (21+).
- **contributor_count** — raw length of `git.contributors`.
- **delivery maturity** — presence/richness of `config_files.ci`, `config_files.docker`, `config_files.type` (type-checker configs), `config_files.lint`, `config_files.test`.
- **compliance hints** — keyword scan of `docs.readme_preview` and `docs.adrs` for HIPAA, PCI, GDPR, SOC2, ISO-27001, FedRAMP.
- **platform targets** — derive from `frontend_detection` (web), presence of mobile toolchain manifests (ios/android/react-native/flutter), CLI bin entries in node `scripts`, or server-only signals (no frontend, no mobile).
- **product name** — prefer the primary manifest `name` field (node `package.json`, python `pyproject.toml` name, go module last segment). Fall back to the top-level `repos[0].label`.
- **product short_description** — first paragraph of `docs.readme_preview` (primary repo). Truncate to ~200 chars on sentence boundary.
- **org type guess** — combine contributor count + `git.contributors` email-domain diversity (if captured) to bucket: `solo-founder` | `small-squad` | `multi-team`.

Any signal unavailable in scan-index is recorded as `null` with an `evidence: []` entry in the decision manifest flagged `confidence: low` so the user sees the gap at the checkpoint.

## Input

Receive from product-keeper via JSON contract.

- `scan_index_path` (path, required) — `scan-index.json` produced by scan-codebase.
- `stm_base` (path, required) — STM root resolved from `.garura/core/config.yaml` `stm.base-path`.
- `issue` (str, required) — issue number driving /codify.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/user-provided/project-profile.yaml`.
- `decision_manifest_path` (path, required) — `decision-manifest-infer-project-profile-from-code.yaml` alongside the artifact.
- `ltm_context` (block, required) — `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol.
- `resolution_trace_path` (path, required) — where `resolution-trace.yaml` is written.

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON. Confirm `stm_base` exists. Confirm output parent directories exist or create them. If scan-index is missing or malformed → structured failure `scan_index_missing`.

2. **Check scan status.** Read `scan_status`. If `budget_exhausted`, proceed but mark every inferred field `confidence: low` in the manifest and record a top-level warning in the artifact meta (`scan_status_warning: "scan truncated — signals may be partial"`).

3. **Execute LTM Resolution Protocol** per `core/components/memory/standards/rules/resolution.md` (R1 → R2 → R3 → R4). Domains to query: `product`, `team-shape`, `compliance`, `delivery-maturity`, `platform-targets`. Write the trace to `resolution_trace_path`.

4. **Extract signals.** Walk scan-index keys exactly per the Purpose signal list. Record, for each signal, the scan-index JSON path(s) consulted (e.g., `manifests[0].dependencies`, `patterns.framework_idioms`, `git.contributors`, `docs.readme_preview`). These paths become the `evidence` list in the meta block.

5. **Infer each profile field** grounded in the extracted signals plus any LOCKED LTM resolved in Step 3. Never invent a value without a cited scan-index evidence path. Fields with no signal available → `null` + `confidence: low` in the manifest.

6. **Compose the artifact YAML.** Write `meta` block first, then `profile` body. Meta lists every scan-index evidence path consulted across all fields (deduplicated).

7. **Write decision manifest.** One entry per inferred decision: `{field, tier, grounding_source, recommendation, alternatives_considered, confidence}`. `grounding_source` is either `scan-index:<json-path>` or `ltm:<resolved-file>`. For low-confidence fields, `alternatives_considered` MUST be non-empty.

## Output

Primary artifact at `output_path`:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/manifests/0/name"
    - "scan-index.json#/docs/readme_preview"
    - "scan-index.json#/git/contributors"
    - "scan-index.json#/patterns/framework_idioms"
    - "scan-index.json#/config_files/ci"
  confidence: "high" | "medium" | "low"
  learning_category: "product"
  sub_category: null
  tier: 1
  scan_status_warning: null  # or message string when scan_status == budget_exhausted
profile:
  product:
    name: "{manifest-name or repo-label}"
    short_description: "{readme first paragraph, truncated}"
  team:
    team_size: "solo-dev | small | medium | large"
    contributor_count: {int}
    org_type_guess: "solo-founder | small-squad | multi-team"
  technology:
    primary_language: "node | python | go | rust | jvm | ruby | dotnet | elixir | dart | swift | php"
    frameworks: [ "{name}", ... ]
    runtime_version: "{engines or go_version or python_requires or null}"
  delivery:
    ci_maturity: "none | basic | mature"   # none=no CI, basic=1 workflow, mature=multi-stage with matrix/lint/test
    containerized: true | false
    type_checked: true | false
    lint_configured: true | false
    test_configured: true | false
  compliance_hints: [ "HIPAA" | "PCI" | "GDPR" | "SOC2" | "ISO-27001" | "FedRAMP" ]
  platform_targets: [ "web" | "mobile-ios" | "mobile-android" | "cli" | "server-api" | "desktop" ]
```

Decision manifest at `decision_manifest_path`:

```yaml
decisions:
  - field: "profile.product.name"
    tier: 1
    grounding_source: "scan-index:manifests[0].name"
    recommendation: "{value}"
    alternatives_considered: [ ... ]
    confidence: "high"
  # one entry per inferred field
```

Resolution trace at `resolution_trace_path` per resolution.md schema.

No product LTM writes. All output is under STM.

## Failure Modes

- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `scan_status_exhausted` — scan-index has `scan_status: budget_exhausted`; skill proceeds but lowers confidence across all fields and records a meta-level warning.
- `ltm_resolution_failed` — Resolution Protocol raised an error; skill halts and returns the trace path for triage.
- `insufficient_signal` — no manifests, no readme preview, no git history. Emit the artifact with `profile` fields all `null` and `meta.confidence: "low"`; do NOT fabricate values.
- `output_parent_missing` — `output_path` parent cannot be created; return structured failure.

## Boundaries

- Read-only against the codebase. The scan-index is the sole input — this skill does NOT open source files directly.
- Signals not listed in the Purpose section MUST NOT be invented; if scan-index lacks a signal, the field is `null`.
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/user-provided/` and the two companion files (decision manifest, resolution trace).
