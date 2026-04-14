---
name: derive-quality-standards
description: Translate the upstream quality-profile.yaml (ISO 25010 characteristics + targets) into concrete engineering standards with named tooling and measurable thresholds. Produces quality-standards.yaml — the handoff artifact that CI/CD gates, code review, and testing practices are built on.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# derive-quality-standards

Called by `tech-designer` during `build-arch` Stage 2. Produces `quality-standards.yaml` at `.meridian/product/arch/quality-standards.yaml`.

## Purpose

The upstream quality profile carries ISO 25010 characteristics with measurable targets ("p95 login < 500ms", "WCAG 2.1 AA minimum", "HIPAA audit trail"). The architecture team now turns those targets into concrete engineering standards: which linters to run, which test coverage thresholds to enforce, which security scans, which observability dashboards. The output is the file CI/CD pipelines, code review checklists, and on-call runbooks reference.

## Input

Receive from the tech-designer agent:
- `quality_profile_path` (path, required) — `.meridian/product/product/quality-profile.yaml`
- `architecture_path` (path, required) — `.meridian/product/arch/architecture.yaml` (from Stage 1; tells us the stack)
- `project_profile_path` (path, required) — for team size, delivery ambition, security level
- `ltm_quality_path` (path, required) — `core/components/memory/knowledge/quality/` (11 dimensions of quality standards per QP level)
- `output_path` (string, required) — `.meridian/product/arch/quality-standards.yaml`

## Process

### 1. Load inputs

- Parse `quality-profile.yaml` → each ISO 25010 characteristic with relevance, targets, and rationale.
- Parse `architecture.yaml` → stack, components, integrations (you need the stack to pick stack-appropriate tooling).
- Parse `project_profile.yaml` → QP dimensions (QP-1 Testing Depth, QP-2 Code Review, QP-3 Documentation, QP-4 CI/CD, QP-5 Observability, QP-6 Accessibility, QP-7 Security Testing, QP-8 Performance Testing, QP-9 Privacy, QP-10 Data Quality, QP-11 Tech Debt Governance).
- Read `{ltm_quality_path}/_index.md` and the relevant per-dimension files to understand what standards exist at each QP level.

### 2. Derive standards per QP dimension

For each QP dimension in the project profile, compose a block in `quality-standards.yaml`:

```yaml
qp_dimensions:
  qp_1_testing_depth:
    level: <from profile, e.g., 3 (Production)>
    level_rationale: "<echoed from profile>"
    standards:
      - category: "unit tests"
        tooling: "Jest 29 (frontend), Vitest 1 (shared utils)"
        threshold: "≥ 80% line coverage on new code; ≥ 60% on touched files"
        enforcement: "CI gate on pull requests (blocking)"
      - category: "integration tests"
        tooling: "Jest with Supertest for HTTP endpoints"
        threshold: "all critical-path endpoints (auth, payment, checkout) covered"
        enforcement: "CI gate (blocking)"
      - category: "e2e tests"
        tooling: "Playwright 1.45"
        threshold: "happy path for every user flow in design-exp flows/"
        enforcement: "CI gate (non-blocking for speed; blocks on main-branch merge)"
    drivers:
      - "quality-profile.functional_suitability target"
      - "quality-profile.reliability target"
  qp_2_code_review:
    level: 3
    standards:
      - category: "review policy"
        tooling: "GitHub branch protection"
        threshold: "2 approvals on main; 1 approval on feature branches; CODEOWNERS-required approval for /security/, /payments/, /auth/"
        enforcement: "GitHub branch protection"
      - category: "automated review"
        tooling: "ESLint 8 + eslint-plugin-security; SonarCloud for quality gates"
        threshold: "zero new-code smells of severity ≥ Major; zero security hotspots"
        enforcement: "CI gate (blocking)"
  ...
```

Every standard carries:
- **category** — what kind of standard (testing, review, security scan, observability, etc.)
- **tooling** — specific named tool + version (no "a linter", no "a coverage tool")
- **threshold** — measurable target (coverage %, response time, false-positive cap)
- **enforcement** — where the gate lives (CI, branch protection, pre-commit hook, etc.)
- **drivers** (optional but recommended) — which quality-profile targets motivated this

### 3. Derive standards per ISO 25010 characteristic (cross-reference)

In addition to the QP dimension blocks, produce a cross-reference section showing how the standards cover each characteristic from the quality profile:

```yaml
iso_25010_coverage:
  performance_efficiency:
    targets_from_profile:
      - "p95 login < 500ms (source: EPIC-user-login-001)"
    standards_covering:
      - qp_8_performance_testing.standards[0]  # k6 load test
      - qp_5_observability.standards[2]        # p95 latency dashboard + alert
    gaps: []
  security:
    targets_from_profile:
      - "NIST 800-63B AAL2"
      - "HIPAA technical safeguards"
    standards_covering:
      - qp_7_security_testing.standards[0]  # SAST
      - qp_7_security_testing.standards[1]  # dependency scanning
      - qp_7_security_testing.standards[2]  # secret scanning
    gaps: []
  ...
```

### 4. Compose and write quality-standards.yaml

```yaml
slug: <from project profile>
status: DRAFT
created_at: <ISO-8601>
upstream:
  quality_profile_path: <echoed>
  architecture_path: <echoed>
qp_dimensions:
  qp_1_testing_depth: ...
  qp_2_code_review: ...
  ...
iso_25010_coverage:
  ...
tooling_summary:
  - name: "Jest 29"
    purpose: "unit tests"
    install_via: "npm"
  - name: "Playwright 1.45"
    ...
debt_baseline:
  established_at: <ISO-8601>
  per_dimension:
    qp_1_testing_depth:
      current_level: null
      target_level: 3
    ...
```

### 5. Return output contract

```yaml
quality_standards:
  path: <written path>
  qp_dimensions_covered: <int>  # out of ~11
  iso_25010_characteristics_covered: <int>  # out of 9
  total_standards: <int>
  tooling_count: <int>
  gaps: []
```

## Constraints

- NEVER use vague language. "Use a linter" is invalid; `ESLint 8 with eslint-plugin-security` is valid.
- NEVER skip a relevant ISO 25010 characteristic from the quality profile. If the profile says `security.relevance: high`, quality-standards must cover it.
- NEVER propose tooling that contradicts the stack in architecture.yaml. If the stack is Node.js + TypeScript, don't prescribe pytest.
- NEVER omit `enforcement` — standards without enforcement are aspirations.
- ALWAYS include `drivers` for at least the security-critical and performance-critical standards — auditors expect to trace them.
- ALWAYS scope output to `{output_path}` — one file.
- Read LTM quality knowledge first; use it as the source of standards-per-level.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | architecture |
| Created | 2026-04-14 |
| Related | `core/components/agents/tech-designer.md`, `core/components/skills/derive-architecture-spec`, `core/components/memory/knowledge/quality/` |
