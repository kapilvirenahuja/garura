---
name: draft-quality-standards
description: Create a quality-standards.yaml artifact with concrete engineering standards derived from Quality Profile dimensions
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-quality-standards

Model-invocable skill for creating quality engineering standards as structured YAML.

## Purpose

Transform Quality Profile dimensions (QP-1 through QP-7) from a product definition into a concrete `quality-standards.yaml` artifact that names specific tools, frameworks, processes, and thresholds for every quality dimension. The artifact must be specific enough that a development team can configure their engineering environment without making quality tooling decisions.

You DO create the quality-standards.yaml artifact. You do NOT validate it or decide what happens next.

## Output Schema

The output MUST conform to the `quality-standards.yaml` schema defined in `core/components/skills/draft-technical-approach/schemas/quality-standards.yaml`. Read the schema before producing output. Every field defined in the schema must be present in the output YAML. The schema is the contract — if it's in the schema, it's in the output.

## Input

Receive from agent:
- `product_yaml_path` — (required) Path to product.yaml containing `profiles.quality_profile`
- `architecture_yaml_path` — (optional) Path to architecture.yaml for stack-aware tooling alignment
- `output_base` — (required) Base path for output, e.g., `.meridian/product/architecture/`

## Process

1. **Read product definition:** Load `product_yaml_path`. Extract `profiles.quality_profile` (QP-1 through QP-7 levels), product slug, and any explicit quality requirements. If `profiles.quality_profile` is missing, return structured failure: "product.yaml missing profiles.quality_profile — run profile assignment first."

2. **Read QP dimension definitions from LTM:** Load `~/.meridian/core/memory/knowledge/project-profiling/quality-profile.md`. This is the authoritative source for what each QP dimension level means. Extract the level descriptions for each QP dimension at the product's assigned level.

3. **Read architecture context (if provided):** If `architecture_yaml_path` is provided, load and extract the technology stack. Use stack entries to align quality tooling — e.g., if the stack uses TypeScript, select TypeScript-native linters and test frameworks; if it uses Python, select Python-native equivalents.

4. **Read output schema:** Load `core/components/skills/draft-technical-approach/schemas/quality-standards.yaml`. This is the structural contract for the output artifact.

5. **Check for existing artifact:** Read `{output_base}/quality-standards.yaml`. If exists and `status: LOCKED`, return structured failure: "quality-standards.yaml is LOCKED — drop to DRAFT first." If DRAFT exists, overwrite (agent re-triggered DRAFT).

6. **Map QP levels to concrete standards:** For each QP dimension, translate the assigned level into specific, named tooling and measurable thresholds. Every entry must name real tools, not categories.

   **QP-1 (Testing Depth) → `standards.testing`:**
   - `qp_level` — the assigned QP-1 level
   - `strategy` — testing strategy description matching the level definition
   - `test_types` — specific test types enabled at this level (unit, integration, e2e, contract, performance, property-based)
   - `frameworks` — specific test frameworks (e.g., "Jest", "Pytest", "Playwright" — not "a test framework")
   - `coverage_target` — numeric percentage or descriptive target matching the level
   - `automation` — CI integration description (e.g., "Tests run on every PR via GitHub Actions")

   **QP-2 (Code Quality Standards) → `standards.code_quality`:**
   - `qp_level` — the assigned QP-2 level
   - `linter` — specific linter tool (e.g., "ESLint 9" or "Ruff")
   - `formatter` — specific formatter tool (e.g., "Prettier" or "Black")
   - `static_analysis` — specific tool or null (e.g., "SonarQube" or "CodeClimate")
   - `review_process` — PR review requirements (e.g., "1 reviewer required, checklist enforced")
   - `conventions` — coding conventions reference or description
   - `design_patterns` — required design patterns list

   **QP-3 (Documentation Level) → `standards.documentation`:**
   - `qp_level` — the assigned QP-3 level
   - `api_docs` — specific approach (e.g., "OpenAPI 3.1 auto-generated via swagger-jsdoc")
   - `architecture_docs` — specific approach (e.g., "ADRs in docs/adr/, C4 diagrams via Structurizr")
   - `runbooks` — operational runbook requirements
   - `onboarding` — developer onboarding documentation requirements

   **QP-4 (CI/CD Maturity) → `standards.ci_cd`:**
   - `qp_level` — the assigned QP-4 level
   - `pipeline` — specific CI/CD tool (e.g., "GitHub Actions" or "GitLab CI")
   - `environments` — list of environments (dev, staging, prod)
   - `deployment_strategy` — specific strategy (blue-green, rolling, canary, manual)
   - `feature_flags` — specific tool or null (e.g., "LaunchDarkly" or "Unleash")
   - `infrastructure_as_code` — specific tool or null (e.g., "Terraform" or "Pulumi")

   **QP-5 (Observability Maturity) → `standards.observability`:**
   - `qp_level` — the assigned QP-5 level
   - `logging` — specific tool + approach (e.g., "Structured JSON via Pino → Datadog Logs")
   - `monitoring` — specific tool + metrics (e.g., "Datadog APM — request latency, error rates, throughput")
   - `alerting` — specific tool + thresholds (e.g., "PagerDuty — p95 latency > 500ms, error rate > 1%")
   - `tracing` — specific tool or null (e.g., "OpenTelemetry → Jaeger")

   **QP-6 (Accessibility Standard) → `standards.accessibility`:**
   - `qp_level` — the assigned QP-6 level
   - `standard` — WCAG level or "none" (e.g., "WCAG 2.1 AA")
   - `testing` — specific automated tool or manual approach (e.g., "axe-core in CI + manual screen reader testing")
   - `audit_cadence` — frequency or "none" (e.g., "quarterly" or "annual third-party audit")

   **QP-7 (Security Testing) → `standards.security_testing`:**
   - `qp_level` — the assigned QP-7 level
   - `dependency_scanning` — specific tool (e.g., "Dependabot" or "Snyk")
   - `sast` — specific tool or null (e.g., "CodeQL" or "Semgrep")
   - `dast` — specific tool or null (e.g., "OWASP ZAP")
   - `pen_testing` — cadence or "none" (e.g., "annual third-party penetration test")
   - `secret_scanning` — specific tool or approach (e.g., "GitHub Secret Scanning + pre-commit hooks via detect-secrets")

7. **Build debt_baseline section:** For each QP dimension, record:
   - `qp_dimension` — dimension ID (QP-1 through QP-7)
   - `target_level` — the level from the quality profile (this is the quality target)
   - `current_level` — null (measured post-implementation)
   - `gap` — null (calculated post-measurement)
   - `remediation` — null (planned post-measurement)
   Set `measured_at` to the current ISO-8601 timestamp.

8. **Validate completeness:** Before writing, verify:
   - All 7 QP dimensions have corresponding standards entries
   - Every standards entry names specific tools (not categories)
   - debt_baseline has entries for all 7 dimensions
   - Target levels in debt_baseline match the QP profile values

9. **Write artifact:** Write `quality-standards.yaml` at `{output_base}/quality-standards.yaml` with `status: DRAFT`.

10. **Return output.**

## Output

```yaml
quality_standards_yaml:
  path: "{full path to quality-standards.yaml}"
  quality_standards_yaml_path: "{full path to quality-standards.yaml}"
  sections:
    - standards.testing
    - standards.code_quality
    - standards.documentation
    - standards.ci_cd
    - standards.observability
    - standards.accessibility
    - standards.security_testing
    - debt_baseline
  status: "DRAFT"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER invent QP dimensions — read from LTM (`~/.meridian/core/memory/knowledge/project-profiling/quality-profile.md`)
- ALWAYS map QP levels to CONCRETE tooling — no vague "use a linter" or "pick a test framework"
- ALWAYS include debt_baseline with target levels matching the QP profile values from product.yaml
- ALWAYS set `status: DRAFT` in the written artifact
- NEVER overwrite a LOCKED quality-standards.yaml — return structured failure
- NEVER invent quality requirements — derive all standards from the QP profile levels and their LTM definitions
- ALWAYS align tooling to the technology stack when architecture_yaml_path is provided — TypeScript projects get TypeScript-native tools, Python projects get Python-native tools
- ALWAYS read the output schema before producing the artifact — the schema is the structural contract
- ALWAYS include all 7 QP dimension entries in both standards and debt_baseline
- Audience is architects and implementers — write with precision, not marketing language

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | design |
