# Quality-Check Subagent Prompts

11 prompt templates for explore subagents. Each prompt is injected with runtime values:
- `{repo_path}` — target repository path
- `{qp_levels}` — project's Quality Profile levels (from quality-standards.yaml `standards.*`)
- `{kb_base}` — resolved KB path (Project LTM or global KB)

## JSON Output Schema (shared by all subagents)

```json
{
  "category": "string",
  "qp_level": "number|null",
  "findings": [
    {
      "id": "string",
      "check_item": "string",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "string",
      "notes": "string"
    }
  ],
  "summary": "string",
  "score": "number 0.0-1.0"
}
```

**Status values:**
- `done` — check item is fully satisfied, evidence confirms it
- `ongoing` — check item is partially satisfied or in transition
- `not_done` — check item is required at this QP level but not satisfied
- `n_a` — check item does not apply to this project (wrong stack, no frontend/backend, etc.)

**Score:** Ratio of `done` + (`ongoing` × 0.5) over total applicable (non-`n_a`) check items. Round to 2 decimal places.

---

## Batch 1 (Subagents 1–4)

---

### Subagent 1: Code Quality

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/code/linting-formatting.md`
- `{kb_base}/quality/code/complexity-structure.md`
- `{kb_base}/quality/code/naming-conventions.md`
- `{kb_base}/quality/code/error-handling-patterns.md`

**QP Dimension:** `code_quality` — Level: `{qp_levels.code_quality}`

**Prompt:**
```
You are assessing code quality for the project at {repo_path}.

Quality Profile Level for code_quality: {qp_levels.code_quality} (1–5 scale)

Your KB standards are loaded above (linting-formatting.md, complexity-structure.md,
naming-conventions.md, error-handling-patterns.md). Each file contains an Assessment
Checklist with columns: ID, Check Item, QP Level, Measurement, Tool Reference.

FILTERING RULE: Only assess check items where the check item's QP Level <= {qp_levels.code_quality}.
Skip items above this level entirely — do not mark them not_done, omit them from findings.
Exception: items marked "All" are always assessed regardless of QP level.

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Search the codebase at {repo_path} for evidence (read files, grep patterns)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "code_quality",
  "qp_level": {qp_levels.code_quality},
  "findings": [
    {
      "id": "CODE-01",
      "check_item": "Linter is configured with a rule set (not defaults)",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context or anti-patterns observed"
    }
  ],
  "summary": "One paragraph assessment of code quality for this project at QP level {qp_levels.code_quality}. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 2: Testing

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/testing/unit-testing.md`
- `{kb_base}/quality/testing/integration-e2e-testing.md`
- `{kb_base}/quality/testing/coverage-test-patterns.md`

**QP Dimension:** `testing` — Level: `{qp_levels.testing}`

**Prompt:**
```
You are assessing testing quality for the project at {repo_path}.

Quality Profile Level for testing: {qp_levels.testing} (1–5 scale)

Your KB standards are loaded above (unit-testing.md, integration-e2e-testing.md,
coverage-test-patterns.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

FILTERING RULE: Only assess check items where the check item's QP Level <= {qp_levels.testing}.
Skip items above this level entirely — do not mark them not_done, omit them from findings.
Exception: items marked "All" are always assessed regardless of QP level.

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Search the codebase at {repo_path} for evidence (read test files, check coverage config,
   examine CI pipeline config for test commands)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Look for test files adjacent to source files, in __tests__ directories, or in a top-level
tests/ folder. Check CI configuration for test execution commands and coverage thresholds.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "testing",
  "qp_level": {qp_levels.testing},
  "findings": [
    {
      "id": "TEST-01",
      "check_item": "Tests exist for all business logic functions",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context about test coverage gaps or patterns"
    }
  ],
  "summary": "One paragraph assessment of test quality for this project at QP level {qp_levels.testing}. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 3: Security

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/security/auth-data-protection.md`
- `{kb_base}/quality/security/owasp-secure-coding.md`
- `{kb_base}/quality/security/secrets-vulnerability-mgmt.md`

**QP Dimension:** `security_testing` — Level: `{qp_levels.security_testing}`

**Prompt:**
```
You are assessing security quality for the project at {repo_path}.

Quality Profile Level for security_testing: {qp_levels.security_testing} (1–5 scale)

Your KB standards are loaded above (auth-data-protection.md, owasp-secure-coding.md,
secrets-vulnerability-mgmt.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

FILTERING RULE: Only assess check items where the check item's QP Level <= {qp_levels.security_testing}.
Skip items above this level entirely — do not mark them not_done, omit them from findings.
Exception: items marked "All" are always assessed regardless of QP level.

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Search the codebase at {repo_path} for evidence (grep for patterns, read auth
   implementations, check dependency files for vulnerability scanning config)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

IMPORTANT: You are doing a static code analysis, not a live penetration test. Do not
attempt to exploit vulnerabilities. Assess presence/absence of secure patterns only.
If you find a hardcoded secret or credential in the source code, report it as not_done
with evidence but do not output the secret value itself.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "security",
  "qp_level": {qp_levels.security_testing},
  "findings": [
    {
      "id": "SEC-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context, do not include secret values"
    }
  ],
  "summary": "One paragraph assessment of security posture for this project at QP level {qp_levels.security_testing}. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 4: Architecture

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/architecture/separation-of-concerns.md`
- `{kb_base}/quality/architecture/dependency-management.md`
- `{kb_base}/quality/architecture/api-design-scalability.md`

**QP Dimension:** Universal (no QP filtering — assess all check items)

**Prompt:**
```
You are assessing architecture quality for the project at {repo_path}.

This is a Universal domain — QP level filtering does NOT apply. Assess ALL check items
from all three KB files regardless of any QP level markings. The only exception is
items you determine are genuinely n_a for this specific project's stack or context.

Your KB standards are loaded above (separation-of-concerns.md, dependency-management.md,
api-design-scalability.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

For each check item:
1. Use the Measurement column as your search/inspection method
2. Examine the codebase at {repo_path} for structural evidence (read directory structure,
   module organization, dependency files, route definitions, API layer separation)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line or directory-level evidence for your finding

Start by reading the top-level directory structure to understand the project layout before
drilling into individual files.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "architecture",
  "qp_level": null,
  "findings": [
    {
      "id": "ARCH-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line or src/domain/ — description of what was found",
      "notes": "optional context about architectural patterns or deviations"
    }
  ],
  "summary": "One paragraph assessment of architecture quality for this project. Describe the architectural style detected and name specific strengths and gaps.",
  "score": 0.0
}
```

---

## Batch 2 (Subagents 5–8)

---

### Subagent 5: Documentation

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/documentation/api-architecture-docs.md`
- `{kb_base}/quality/documentation/developer-onboarding.md`

**QP Dimension:** `documentation` — Level: `{qp_levels.documentation}`

**Prompt:**
```
You are assessing documentation quality for the project at {repo_path}.

Quality Profile Level for documentation: {qp_levels.documentation} (1–5 scale)

Your KB standards are loaded above (api-architecture-docs.md, developer-onboarding.md).
Each file contains an Assessment Checklist with columns: ID, Check Item, QP Level,
Measurement, Tool Reference.

FILTERING RULE: Only assess check items where the check item's QP Level <= {qp_levels.documentation}.
Skip items above this level entirely — do not mark them not_done, omit them from findings.
Exception: items marked "All" are always assessed regardless of QP level.

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Search the codebase at {repo_path} for documentation evidence (glob for README,
   OpenAPI specs, ADRs, architecture diagrams, runbooks, onboarding guides)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file paths as evidence (documentation is file-based, not line-based)

Check for documentation in: README.md, docs/, .github/, openapi.yaml, swagger.json,
*.oas.yaml, docs/adr/, docs/architecture/, CONTRIBUTING.md.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "documentation",
  "qp_level": {qp_levels.documentation},
  "findings": [
    {
      "id": "DOC-01",
      "check_item": "README exists at repo root",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "README.md — present, covers setup and usage",
      "notes": "optional context about documentation quality or gaps"
    }
  ],
  "summary": "One paragraph assessment of documentation quality for this project at QP level {qp_levels.documentation}. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 6: Operations

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/operations/cicd-quality-gates.md`
- `{kb_base}/quality/operations/deployment-incident-response.md`
- `{kb_base}/quality/operations/monitoring-alerting.md`

**QP Dimensions:** `ci_cd` (Level: `{qp_levels.ci_cd}`) and `observability` (Level: `{qp_levels.observability}`)

**Prompt:**
```
You are assessing operations quality for the project at {repo_path}.

This domain covers two QP dimensions with separate levels:
- CI/CD quality gates (cicd-quality-gates.md): QP level = {qp_levels.ci_cd}
- Deployment and incident response (deployment-incident-response.md): QP level = {qp_levels.ci_cd}
- Monitoring and alerting (monitoring-alerting.md): QP level = {qp_levels.observability}

Your KB standards are loaded above. Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

FILTERING RULE per file:
- For cicd-quality-gates.md and deployment-incident-response.md: assess check items where
  QP Level <= {qp_levels.ci_cd}
- For monitoring-alerting.md: assess check items where QP Level <= {qp_levels.observability}
- Items marked "All" are always assessed regardless of QP level in all three files

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Examine the codebase at {repo_path} for evidence (read CI pipeline config files,
   deployment scripts, monitoring config, runbooks)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Look for CI config in: .github/workflows/, .gitlab-ci.yml, Jenkinsfile, .circleci/,
.buildkite/. Look for monitoring config in: monitoring/, observability/, prometheus.yml,
alertmanager.yml, datadog.yaml, or equivalent.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "operations",
  "qp_level": null,
  "findings": [
    {
      "id": "OPS-01",
      "check_item": "Pipeline configuration file exists and is committed",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context"
    }
  ],
  "summary": "One paragraph assessment of operations quality for this project covering CI/CD (QP {qp_levels.ci_cd}) and observability (QP {qp_levels.observability}). Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 7: Frontend

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/frontend/accessibility-performance.md`
- `{kb_base}/quality/frontend/component-architecture.md`
- `{kb_base}/quality/frontend/state-management-patterns.md`

**QP Dimension:** `accessibility` — Level: `{qp_levels.accessibility}`

**Prompt:**
```
You are assessing frontend quality for the project at {repo_path}.

Quality Profile Level for accessibility: {qp_levels.accessibility} (1–5 scale)
This level applies to accessibility check items. Component architecture and state
management check items use their own QP Level markings from the KB.

Your KB standards are loaded above (accessibility-performance.md, component-architecture.md,
state-management-patterns.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

FIRST: Detect whether this project has a frontend. Look for:
- Frontend frameworks: React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, SvelteKit
- Frontend directories: src/components/, src/pages/, src/views/, app/, pages/
- Build config: vite.config.*, webpack.config.*, next.config.*, angular.json
- Package dependencies: react, vue, @angular/core, svelte in package.json

IF NO FRONTEND IS DETECTED: Return all findings as n_a with note "No frontend detected"
and score 0.0. Do not fabricate findings.

IF FRONTEND IS DETECTED: Proceed with assessment.

FILTERING RULE: For accessibility-performance.md items, assess where QP Level <= {qp_levels.accessibility}.
For component-architecture.md and state-management-patterns.md items, assess where QP Level
matches the check item's QP Level marking against the overall project context.
Exception: items marked "All" are always assessed regardless of QP level.

For each applicable check item:
1. Use the Measurement column as your search/inspection method
2. Examine frontend source files at {repo_path} for evidence
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "frontend",
  "qp_level": {qp_levels.accessibility},
  "findings": [
    {
      "id": "FE-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context"
    }
  ],
  "summary": "One paragraph assessment of frontend quality for this project. If no frontend detected, state that explicitly. Otherwise name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 8: Backend

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/backend/api-design-validation.md`
- `{kb_base}/quality/backend/async-error-handling.md`
- `{kb_base}/quality/backend/database-caching.md`

**QP Dimension:** Universal (no QP filtering — assess all check items)

**Prompt:**
```
You are assessing backend quality for the project at {repo_path}.

This is a Universal domain — QP level filtering does NOT apply. Assess ALL check items
from all three KB files regardless of any QP level markings. The only exception is
items you determine are genuinely n_a for this specific project's stack or context.

Your KB standards are loaded above (api-design-validation.md, async-error-handling.md,
database-caching.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

FIRST: Detect whether this project has a backend. Look for:
- Backend frameworks: Express, Fastify, NestJS, FastAPI, Django, Rails, Spring, Go net/http
- Backend directories: src/api/, src/routes/, src/controllers/, server/, app/
- Backend indicators: package.json with express/fastapi/etc., requirements.txt, go.mod with server deps
- Database config files: prisma/schema.prisma, alembic.ini, *.migration.*, database.yml

IF NO BACKEND IS DETECTED: Return all findings as n_a with note "No backend detected"
and score 0.0. Do not fabricate findings.

IF BACKEND IS DETECTED: Proceed with assessment of all applicable check items.

For each check item:
1. Use the Measurement column as your search/inspection method
2. Examine backend source files at {repo_path} for evidence (read route handlers,
   middleware, validation schemas, error handlers, database access patterns)
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "backend",
  "qp_level": null,
  "findings": [
    {
      "id": "BE-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context"
    }
  ],
  "summary": "One paragraph assessment of backend quality for this project. If no backend detected, state that explicitly. Otherwise name specific strengths and gaps.",
  "score": 0.0
}
```

---

## Batch 3 (Subagents 9–11)

---

### Subagent 9: Data & Privacy

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/data/migrations-versioning.md`
- `{kb_base}/quality/data/privacy-compliance.md`
- `{kb_base}/quality/data/schema-design.md`

**QP Dimension:** Universal (no QP filtering — assess all check items)

**Prompt:**
```
You are assessing data quality and privacy compliance for the project at {repo_path}.

This is a Universal domain — QP level filtering does NOT apply. Assess ALL check items
from all three KB files regardless of any QP level markings. The only exception is
items you determine are genuinely n_a for this specific project's stack or context
(e.g., migration checks are n_a if no database is detected).

Your KB standards are loaded above (migrations-versioning.md, privacy-compliance.md,
schema-design.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

For each check item:
1. Use the Measurement column as your search/inspection method
2. Examine the codebase at {repo_path} for evidence:
   - Database: check for migration tool config, schema files, ORM models
   - Privacy: look for PII handling, consent mechanisms, data retention policies
   - Schema design: read ORM model definitions, migration files, schema files
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Look for: prisma/schema.prisma, migrations/, alembic/, models.py, *.entity.ts,
schema.rb, GDPR-related docs, privacy policy, cookie consent implementations.

IMPORTANT: If you encounter PII data structures (SSN fields, medical data, payment data),
report the schema pattern only — do not output any actual data values.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "data_privacy",
  "qp_level": null,
  "findings": [
    {
      "id": "DATA-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context"
    }
  ],
  "summary": "One paragraph assessment of data quality and privacy compliance for this project. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 10: Performance

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/performance/load-testing-profiling.md`
- `{kb_base}/quality/performance/resource-optimization.md`
- `{kb_base}/quality/performance/slos-reliability.md`

**QP Dimension:** Universal (no QP filtering — assess all check items)

**Prompt:**
```
You are assessing performance quality for the project at {repo_path}.

This is a Universal domain — QP level filtering does NOT apply. Assess ALL check items
from all three KB files regardless of any QP level markings. The only exception is
items you determine are genuinely n_a for this specific project's stack or context.

Your KB standards are loaded above (load-testing-profiling.md, resource-optimization.md,
slos-reliability.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

For each check item:
1. Use the Measurement column as your search/inspection method
2. Examine the codebase at {repo_path} for evidence:
   - Load testing: look for k6, Artillery, JMeter, Locust scripts or config
   - Resource optimization: check for caching patterns, N+1 query patterns, bundle config
   - SLOs: look for SLO definitions, reliability targets, error budget documentation
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

Look for: k6 scripts (*.k6.js, load-test.js), artillery.yml, locustfile.py,
SLO definitions in docs/ or monitoring config, cache configuration, CDN config.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "performance",
  "qp_level": null,
  "findings": [
    {
      "id": "PERF-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context"
    }
  ],
  "summary": "One paragraph assessment of performance quality for this project. Name specific strengths and gaps.",
  "score": 0.0
}
```

---

### Subagent 11: Tech Debt

**Type:** explore
**KB Files to Load:**
- `{kb_base}/quality/tech-debt/fowler-quadrant.md`
- `{kb_base}/quality/tech-debt/debt-register-governance.md`
- `{kb_base}/quality/tech-debt/accepted-vs-unaccepted.md`

**QP Dimension:** Universal (no QP filtering — assess all check items)

**Prompt:**
```
You are assessing technical debt for the project at {repo_path}.

This is a Universal domain — QP level filtering does NOT apply. Assess ALL check items
from all three KB files regardless of any QP level markings.

Your KB standards are loaded above (fowler-quadrant.md, debt-register-governance.md,
accepted-vs-unaccepted.md). Each file contains an Assessment Checklist with columns:
ID, Check Item, QP Level, Measurement, Tool Reference.

For each check item:
1. Use the Measurement column as your search/inspection method
2. Examine the codebase at {repo_path} for evidence:
   - Debt register: look for DEBT.md, tech-debt.md, debt-register.yaml, or ADR entries
   - Governance: check for debt review processes, ownership assignments, timelines
   - Accepted vs unaccepted: identify debt items with and without explicit acceptance
3. Determine status: done | ongoing | not_done | n_a
4. Record specific file:line evidence for your finding

FOWLER QUADRANT CLASSIFICATION (REQUIRED):
For every piece of tech debt you discover in the codebase — whether documented or observed
through code patterns — you MUST classify it into one of the four Fowler quadrants:

| Quadrant | Definition |
|----------|-----------|
| deliberate-prudent | Team knew better, chose shortcut consciously with a plan to fix later ("We must ship now and deal with it") |
| deliberate-reckless | Team knew better, chose shortcut without a plan ("We don't have time for design") |
| inadvertent-prudent | Team didn't know better at the time, discovered the issue after ("Now we know how we should have done it") |
| inadvertent-reckless | Team didn't know better and still doesn't ("What's layering?") |

Add a `quadrant` field to each debt-related finding. Check items about debt governance
(register presence, ownership, timelines) do not need a quadrant — set quadrant to null.

Return JSON only — no markdown, no prose outside the JSON object:
{
  "category": "tech_debt",
  "qp_level": null,
  "findings": [
    {
      "id": "DEBT-01",
      "check_item": "...",
      "status": "done|ongoing|not_done|n_a",
      "evidence": "path/to/file:line — description of what was found",
      "notes": "optional context",
      "quadrant": "deliberate-prudent|deliberate-reckless|inadvertent-prudent|inadvertent-reckless|null"
    }
  ],
  "debt_items_observed": [
    {
      "description": "Brief description of the specific debt item observed in code",
      "location": "path/to/file:line",
      "quadrant": "deliberate-prudent|deliberate-reckless|inadvertent-prudent|inadvertent-reckless",
      "quadrant_reasoning": "Why this quadrant — what signals indicate intentionality and awareness"
    }
  ],
  "summary": "One paragraph assessment of tech debt posture for this project. Describe the dominant quadrants observed, governance maturity, and overall debt burden.",
  "score": 0.0
}
```

---

## Summary Table

| # | Domain | KB Files | QP Dimension | QP Field | Batch |
|---|--------|----------|--------------|----------|-------|
| 1 | Code Quality | quality/code/ (4 files) | QP-2 | `qp_levels.code_quality` | 1 |
| 2 | Testing | quality/testing/ (3 files) | QP-1 | `qp_levels.testing` | 1 |
| 3 | Security | quality/security/ (3 files) | QP-7 | `qp_levels.security_testing` | 1 |
| 4 | Architecture | quality/architecture/ (3 files) | Universal | null | 1 |
| 5 | Documentation | quality/documentation/ (2 files) | QP-3 | `qp_levels.documentation` | 2 |
| 6 | Operations | quality/operations/ (3 files) | QP-4 + QP-5 | `qp_levels.ci_cd` + `qp_levels.observability` | 2 |
| 7 | Frontend | quality/frontend/ (3 files) | QP-6 | `qp_levels.accessibility` | 2 |
| 8 | Backend | quality/backend/ (3 files) | Universal | null | 2 |
| 9 | Data & Privacy | quality/data/ (3 files) | Universal | null | 3 |
| 10 | Performance | quality/performance/ (3 files) | Universal | null | 3 |
| 11 | Tech Debt | quality/tech-debt/ (3 files) | Universal | null | 3 |

## Runtime Injection Notes

The skill runner must replace these variables before dispatching each subagent:
- `{repo_path}` — absolute path to the target repository
- `{kb_base}` — absolute path to the resolved KB root (e.g., `~/.garura/core/memory/knowledge`)
- `{qp_levels.code_quality}` — from `quality-standards.yaml` → `standards.code_quality.qp_level`
- `{qp_levels.testing}` — from `quality-standards.yaml` → `standards.testing.qp_level`
- `{qp_levels.documentation}` — from `quality-standards.yaml` → `standards.documentation.qp_level`
- `{qp_levels.ci_cd}` — from `quality-standards.yaml` → `standards.ci_cd.qp_level`
- `{qp_levels.observability}` — from `quality-standards.yaml` → `standards.observability.qp_level`
- `{qp_levels.accessibility}` — from `quality-standards.yaml` → `standards.accessibility.qp_level`
- `{qp_levels.security_testing}` — from `quality-standards.yaml` → `standards.security_testing.qp_level`
