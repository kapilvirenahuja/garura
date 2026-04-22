---
name: infer-quality-profile-from-code
description: Infer the product's ISO 25010:2023 quality-profile.yaml (characteristic-level targets, security profile, risk register) from scan-index.json during /codify, grounding every characteristic level and every risk entry in concrete scan-index signals and tagging source_type=inferred_from_code. Used exclusively by test-engineer in the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-quality-profile-from-code

Called by `test-engineer` during /codify. Produces `specification/quality-profile.yaml` at `{stm_base}/{issue}/evidence/codify/proposals/specification/quality-profile.yaml`.

## Purpose

During /codify (brownfield bootstrap), the quality-profile artifact that /specify normally derives from intent epics must be reverse-engineered from the existing codebase's tooling posture. This skill consumes `scan-index.json` (produced by `scan-codebase`) and emits a proposal quality-profile whose ISO 25010:2023 characteristic levels, security profile, and risk register are all grounded in scan-index signals. The greenfield peer for this artifact is `derive-quality-profile-from-epics` (specify Stage 6). The output schema MUST round-trip with that peer: it uses ISO 25010:2023 (9 characteristics — `functional_suitability`, `performance_efficiency`, `compatibility`, `interaction_capability`, `reliability`, `security`, `maintainability`, `flexibility`, `safety`) and the reference instance at `.garura/product/specification/quality-profile.yaml` is the shape-of-record.

The task-brief signal list names `usability` and `portability` (ISO 25010:2011 nomenclature); this skill maps `usability → interaction_capability` and `portability → flexibility`, and adds a `safety` bucket whose relevance is inferred from the code (default: `low`, matching the reference, unless safety-critical signals surface).

## Input

Receive from test-engineer via JSON contract.

- `scan_index_path` (path, required) — `scan-index.json` produced by scan-codebase.
- `stm_base` (path, required) — STM root resolved from `.garura/core/config.yaml` `stm.base-path`.
- `issue` (str, required) — issue number driving /codify.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/specification/quality-profile.yaml`.
- `decision_manifest_path` (path, required) — `decision-manifest-infer-quality-profile-from-code.yaml` alongside the artifact.
- `ltm_context` (block, required) — `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol.
- `resolution_trace_path` (path, required) — where `resolution-trace.yaml` is written.

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON. Confirm `stm_base` exists. Confirm output parent directories exist or create them. Missing scan-index → structured failure `scan_index_missing`.

2. **Check scan status.** Read `scan_status`. If `budget_exhausted`, proceed but cap every characteristic's `confidence` at `low` and record a top-level `meta.scan_status_warning`.

3. **Execute LTM Resolution Protocol** per `core/components/memory/standards/rules/resolution.md` (R1 → R2 → R3 → R4). R3 domains: `quality`, `testing`, `iso-25010`, `security-posture`, `reliability-patterns`. R3 MUST consult `core/components/memory/` for the canonical ISO 25010:2023 taxonomy reference. Write the trace to `resolution_trace_path`. R3 failure → structured failure `ltm_resolution_failed`.

4. **Score each ISO 25010 characteristic.** For each characteristic, resolve a `target_level` (integer 1-5) and a `relevance` (`low`/`mid`/`high`) using the deterministic rubric in the "Signal → Level Rubric" section below. Record, per characteristic, the scan-index JSON paths consulted as `evidence`.

5. **Build the risk register.** Map known tool-posture gaps to risk entries per the "Risk Inference Rules" section. Each risk cites the scan-index path(s) that surfaced it and a severity (high/medium/low) fixed by the rule, not by epic-citation count (that's the greenfield aggregator's job).

6. **Compose `security_profile`** from security-related scan signals per the "Security Profile Derivation" section.

7. **Emit decision manifest first** (DSD). One entry per inferred decision: one per characteristic (`D-iqpc-char-<name>`), one per risk (`D-iqpc-risk-<n>`), one per security_profile slot (`D-iqpc-sec-<slot>`). `grounding_source.kind` is `scan_index | kb_path | none`; `ref` is `scan-index.json#/<path>` or `ltm:<file>`. `tier` is `high` only when the rubric row was matched by a direct scan-index path AND the R3 KB reference resolved; `mid` when only one source held; `low` when neither was conclusive. Every decision carries ≥1 `alternatives_considered` entry.

8. **Write the artifact.** Meta block first, then `quality_profile` body. Meta `evidence` is the deduplicated union of every scan-index path cited across all characteristics, risks, and security slots. Meta `confidence` is the floor of per-characteristic confidence values.

## Signal → Level Rubric

Each row maps scan-index paths to a deterministic `(target_level, relevance)`. Ties break toward the lower level. If every path in a row is empty, score `level: 1, relevance: low` and flag the characteristic `insufficient_signal` in the decision manifest.

- `functional_suitability`
  - paths: `patterns.framework_idioms`, `entry_points`, `manifests[*].dependencies`
  - rule: framework_idiom count + entry_point count; ≥3 frameworks and ≥2 entry points → level 4 / high; 1 framework + entry points → level 3 / high; entry points only → level 2 / mid; no idioms and no entry points → level 1 / low.

- `performance_efficiency`
  - paths: `manifests[*].dependencies`, `config_files.infra`, `config_files.deploy`
  - rule: rate-limit middleware OR caching lib (`redis`, `memcached`, `ioredis`, `cache-manager`) OR CDN/edge config in infra → level 4 / mid; any performance-adjacent dep (`compression`, `etag`) only → level 3 / mid; nothing → level 2 / low.

- `compatibility`
  - paths: `config_files.docker`, `config_files.ci`, `manifests[*].engines`
  - rule: multiple Dockerfile variants OR CI platform/runtime matrix (`strategy.matrix` in workflows) → level 4 / mid; single Dockerfile OR single CI workflow → level 3 / mid; none → level 2 / low.

- `interaction_capability` (maps task's `usability`)
  - paths: `frontend_detection`, `manifests[*].dependencies`
  - rule: frontend present AND a11y deps (`@axe-core/*`, `eslint-plugin-jsx-a11y`, `aria-*`, `react-aria`) → level 4 / high; frontend present without a11y deps → level 2 / mid; no frontend → `relevance: low`, level 1 (non-applicable).

- `reliability`
  - paths: `config_files.ci`, `config_files.test`, `manifests[*].dependencies`, `patterns.test_framework_signals`
  - rule: CI with mandatory test stage AND retry/circuit-breaker libs (`p-retry`, `axios-retry`, `opossum`, `resilience4j`, `tenacity`) AND error-monitoring dep (`sentry`, `datadog`, `rollbar`, `bugsnag`) → level 5 / high; CI with mandatory tests → level 4 / high; tests present but not wired in CI → level 2 / mid; no tests → level 1 / low.

- `security`
  - paths: `manifests[*].dependencies`, `config_files.ci`, `config_files.lint`
  - rule: auth lib (`passport`, `next-auth`, `authlib`, `devise`, `omniauth`) AND (`helmet` OR CSRF middleware) AND secret-scanner in CI (`gitleaks`, `trufflehog`, `detect-secrets`) → level 5 / high; auth lib + one hardening signal → level 4 / high; auth lib only OR hardening only → level 3 / mid; none → level 2 / low.

- `maintainability`
  - paths: `config_files.lint`, `config_files.type`, `config_files.test`, `patterns.naming_suffix_counts`
  - rule: type-checker config with strict mode (`tsconfig.json strict:true`, `mypy strict`, `pyright strict`) AND lint config AND test config → level 5 / high; type + lint present → level 4 / high; lint only → level 3 / mid; none → level 1 / low.

- `flexibility` (maps task's `portability`)
  - paths: `config_files.docker`, `manifests[*]`, `config_files.infra`
  - rule: container present AND env-driven config pattern (`.env.example`, `dotenv` dep, `config_files.infra` with env templating) → level 4 / mid; container only → level 3 / mid; none → level 2 / low.

- `safety`
  - paths: `manifests[*].dependencies`, `docs.readme_preview`, `config_files.ci`
  - rule: safety-critical libs (`iec-61508`, medical/automotive keywords in readme) OR explicit hazard docs → level 3 / mid; otherwise → level 1 / `relevance: low` (matches reference baseline for developer-tooling products).

## Risk Inference Rules

Fixed severity per rule (greenfield derives severity from epic-citation counts; /codify has no epics, so severity is rule-assigned).

| risk_id | trigger (scan-index) | description | severity |
|---------|----------------------|-------------|----------|
| RISK-001 | `config_files.test` empty AND `patterns.test_framework_signals` empty | No test framework detected — reliability/regression risk | high |
| RISK-002 | `config_files.ci` empty | No CI detected — quality gates cannot enforce pre-merge | high |
| RISK-003 | `config_files.lint` empty | No lint configuration — maintainability/style drift risk | medium |
| RISK-004 | `config_files.type` empty on a typed-language manifest (TS/Py/Go) | Type-checker not configured on a typed stack — maintainability risk | medium |
| RISK-005 | auth lib absent AND `frontend_detection` non-empty | User-facing surface with no auth library — security risk | high |
| RISK-006 | secret-scanner absent from CI | No secrets-in-CI guard — credential exposure risk | medium |
| RISK-007 | `manifests[*].dependencies` empty OR malformed | Degenerate manifest — broad signal gap | low |
| RISK-008 | `config_files.docker` empty AND `config_files.deploy` empty | No container or deploy config — portability/flexibility risk | low |

Walk each rule; emit a risk entry only when the trigger fires. Each entry cites the scan-index path that surfaced it under `evidence`.

## Security Profile Derivation

- `authentication.method`: from detected auth lib; else `not_detected`.
- `authorization.model`: `flat` by default; upgrade to `rbac` if `casbin`, `casl`, `oso`, or role-schema files present.
- `data_at_rest.encryption`: `not_detected_v1` unless KMS/crypto libs (`aws-sdk/kms`, `cryptography`, `@aws-crypto/*`) found.
- `data_in_transit.encryption`: `TLS` if any HTTPS-enforcing middleware or ingress TLS config surfaces in `config_files.infra`; else `not_explicitly_mandated`.
- `secrets_management.approach`: `environment-variables` if `.env` / dotenv dep present; `secrets-manager` if `@aws-sdk/client-secrets-manager`, `hashicorp/vault`, or GCP secret-manager deps; else `not_detected`.
- `audit_trail.coverage`: `none` unless monitoring/logging libs present (`winston`, `pino`, `bunyan`, `structlog`) — then `basic`.
- `compliance_mandates`: keyword-scan `docs.readme_preview` + `docs.adrs` for HIPAA/PCI/GDPR/SOC2/ISO-27001/FedRAMP; each hit → entry with `status: declared_in_docs`, `enforcement: not_verified_from_code`.

## Output

Primary artifact at `output_path`:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/config_files/ci"
    - "scan-index.json#/config_files/lint"
    - "scan-index.json#/config_files/type"
    - "scan-index.json#/config_files/test"
    - "scan-index.json#/manifests"
    - "scan-index.json#/patterns/framework_idioms"
    - "scan-index.json#/frontend_detection"
  confidence: "high" | "medium" | "low"
  learning_category: "quality"
  sub_category: "testing"
  tier: 2
  scan_status_warning: null
quality_profile:
  slug: "{product-slug}"
  status: DRAFT
  iso_25010:
    functional_suitability: { level: <1-5>, relevance: low|mid|high, evidence: [...], confidence: high|medium|low }
    performance_efficiency: { ... }
    compatibility: { ... }
    interaction_capability: { ... }
    reliability: { ... }
    security: { ... }
    maintainability: { ... }
    flexibility: { ... }
    safety: { ... }
  security_profile:
    authentication: { method, rationale }
    authorization: { model, rationale }
    data_at_rest: { encryption, rationale }
    data_in_transit: { encryption, coverage }
    secrets_management: { approach, rationale }
    audit_trail: { coverage, mechanisms }
    compliance_mandates: [ { category, status, enforcement, source } ]
  compliance_flags: [ "HIPAA" | "PCI" | "GDPR" | "SOC2" | "ISO-27001" | "FedRAMP" ]
  risk_register:
    - id: RISK-001
      description: "{from rule table}"
      evidence: [ "scan-index.json#/<path>" ]
      severity: high | medium | low
      mitigation: "{standard mitigation per risk rule}"
```

Decision manifest at `decision_manifest_path` (DSD-compliant, `D-iqpc-` prefix):

```yaml
schema_version: "1.0"
skill: "infer-quality-profile-from-code"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-iqpc-char-reliability"
    decision_type: "characteristic-level-inference"
    tier: high | mid | low
    grounding_source: { kind: scan_index | kb_path | none, ref: "...", excerpt: "..." }
    recommendation: "{level + relevance with rubric-row citation}"
    alternatives_considered: [ { alt: "...", why_not: "..." } ]
    agent_reasoning_summary: "..."
    user_response: null
    user_response_detail: null
  # one per characteristic; one per risk (D-iqpc-risk-<n>); one per security slot (D-iqpc-sec-<slot>)
```

Resolution trace at `resolution_trace_path` per resolution.md schema.

No product LTM writes. All output is under STM.

## Failure Modes

- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `scan_status_exhausted` — scan-index has `scan_status: budget_exhausted`; skill proceeds, caps confidence at `low`, records `meta.scan_status_warning`.
- `ltm_resolution_failed` — Resolution Protocol R3 raised an error; skill halts and returns the trace path for triage.
- `insufficient_signal` — `config_files` completely empty AND `manifests` empty (degenerate repo); emit the artifact with every characteristic at `level: 1, relevance: low`, `meta.confidence: "low"`, and risk_register populated only with RISK-007.
- `output_parent_missing` — `output_path` parent cannot be created; return structured failure.

## Boundaries

- Read-only against the codebase. The scan-index is the sole input — this skill does NOT open source files directly.
- Signals not listed in the Signal → Level Rubric or Risk Inference Rules MUST NOT be invented; absence of a signal lowers confidence, never fabricates a value.
- Severity in /codify risk register is rule-assigned, NOT epic-citation-aggregated (that is the greenfield peer's job).
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/specification/` and the two companion files (decision manifest, resolution trace).
- Never commit a characteristic level or risk entry to the primary artifact without a matching decision-manifest entry written first (DSD).
