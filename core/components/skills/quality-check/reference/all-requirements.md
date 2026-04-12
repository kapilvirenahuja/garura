# Quality Assessment Requirements Index

All check items across 11 quality domains. This is the WHAT; the KB knowledge files are the HOW.

**Total:** 268 check items across 11 categories

## Requirements

| Category | ID | Check Item | QP Level | KB Source |
|----------|----|------------|----------|-----------|
| Code Quality | CODE-01 | Linter is configured with a rule set (not defaults) | L2 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-02 | Formatter is configured and matches team convention | L2 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-03 | Linter runs without warnings on the main branch | L3 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-04 | Formatter produces zero diff on committed code | L3 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-05 | Pre-commit hooks block unformatted commits locally | L3 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-06 | `.editorconfig` is present and consistent with formatter config | L3 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-07 | Linter rules are pinned (not floating `latest`) | L4 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-08 | Custom lint rules enforce project-specific patterns | L5 | `quality/code/linting-formatting.md` |
| Code Quality | CODE-09 | Cyclomatic complexity per function ≤ 10 | L2 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-10 | Function length ≤ 50 lines (excluding blank lines and comments) | L2 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-11 | Nesting depth ≤ 4 levels in any function | L3 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-12 | Class/module size ≤ 300 lines | L3 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-13 | Single Responsibility: each class/module has one clear purpose | L3 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-14 | No circular dependencies between modules | L4 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-15 | Cognitive complexity per function ≤ 15 (SonarQube metric) | L4 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-16 | SonarQube quality gate blocks merge on complexity regression | L5 | `quality/code/complexity-structure.md` |
| Code Quality | CODE-17 | Variables and functions follow language-idiomatic case convention | L2 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-18 | Classes and interfaces use PascalCase; files match class name | L2 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-19 | Constants and enum values use SCREAMING_SNAKE_CASE | L3 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-20 | File and directory names follow a documented convention (kebab-case or snake_case) | L3 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-21 | No single-letter variables outside loop indices and math | L3 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-22 | Boolean variables and functions use is/has/can/should prefix | L4 | `quality/code/naming-conventions.md` |
| Code Quality | CODE-23 | Custom error types defined for domain errors (not raw `Error` or `Exception`) | L2 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-24 | Errors are never silently swallowed (empty catch blocks) | L2 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-25 | Errors are logged with context (stack trace + relevant identifiers) | L3 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-26 | User-facing error messages never expose stack traces or internal details | L3 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-27 | Error recovery is explicit: retry with backoff, fallback, or circuit breaker | L4 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-28 | Error boundaries present at service entry points (API handlers, queue consumers) | L4 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-29 | Result/Either types used for expected failures instead of exceptions | L4 | `quality/code/error-handling-patterns.md` |
| Code Quality | CODE-30 | Error handling coverage enforced: error paths have explicit tests | L5 | `quality/code/error-handling-patterns.md` |
| Testing | TEST-01 | Tests exist for all business logic functions | L2 | `quality/testing/unit-testing.md` |
| Testing | TEST-02 | Test structure follows Arrange-Act-Assert pattern | L2 | `quality/testing/unit-testing.md` |
| Testing | TEST-03 | Each test asserts exactly one behavior | L2 | `quality/testing/unit-testing.md` |
| Testing | TEST-04 | Mocks are used for external dependencies only (DB, HTTP, filesystem) | L3 | `quality/testing/unit-testing.md` |
| Testing | TEST-05 | Test names describe behavior, not implementation | L3 | `quality/testing/unit-testing.md` |
| Testing | TEST-06 | Tests are isolated: no shared mutable state between tests | L3 | `quality/testing/unit-testing.md` |
| Testing | TEST-07 | Test suite runs in under 30 seconds locally | L3 | `quality/testing/unit-testing.md` |
| Testing | TEST-08 | Assertion libraries used (not bare `if` checks) | L3 | `quality/testing/unit-testing.md` |
| Testing | TEST-09 | Snapshot tests are used sparingly and reviewed on change | L4 | `quality/testing/unit-testing.md` |
| Testing | TEST-10 | Mutation testing score ≥ 70% | L5 | `quality/testing/unit-testing.md` |
| Testing | TEST-11 | API endpoints have integration tests with real HTTP (not mocked router) | L3 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-12 | Database integration tests run against a real DB (test container or test schema) | L3 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-13 | E2E tests cover the top 3 critical user journeys | L3 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-14 | Contract tests defined for all inter-service API dependencies | L4 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-15 | E2E tests run in CI on every PR (not just nightly) | L4 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-16 | Integration tests clean up state after each run | L4 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-17 | Browser E2E tests run across 2+ browsers in CI | L5 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-18 | API contract breaking changes detected automatically | L5 | `quality/testing/integration-e2e-testing.md` |
| Testing | TEST-19 | Line coverage ≥ 60% on business logic modules | L2 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-20 | Branch coverage ≥ 50% on business logic modules | L2 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-21 | CI enforces coverage threshold — build fails on regression | L3 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-22 | Test pyramid ratio: unit > integration > E2E | L3 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-23 | Line coverage ≥ 80% on business logic modules | L4 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-24 | Flaky tests are tracked and resolved within 5 business days | L4 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-25 | Mutation testing score ≥ 60% | L5 | `quality/testing/coverage-test-patterns.md` |
| Testing | TEST-26 | Test execution time is monitored and regressed tests are flagged | L5 | `quality/testing/coverage-test-patterns.md` |
| Security | SEC-01 | No string concatenation in SQL queries — parameterized queries only | L2 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-02 | No `innerHTML`, `document.write`, or `dangerouslySetInnerHTML` without explicit sanitization | L2 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-03 | CSRF protection enabled for all state-mutating endpoints | L3 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-04 | All user inputs validated and sanitized before use | L3 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-05 | Security headers set: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` | L3 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-06 | File upload validation: type, size, content checked server-side | L4 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-07 | XML/JSON deserialization does not allow type instantiation from user input | L4 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-08 | Static analysis security scanner runs in CI (SAST) | L4 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-09 | OWASP ZAP or equivalent DAST scan runs against staging environment | L5 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-10 | Penetration test conducted annually by external party | L5 | `quality/security/owasp-secure-coding.md` |
| Security | SEC-11 | JWT tokens have explicit expiry ≤ 1 hour for access tokens | L3 | `quality/security/auth-data-protection.md` |
| Security | SEC-12 | JWT refresh tokens are rotated on use and invalidated on logout | L3 | `quality/security/auth-data-protection.md` |
| Security | SEC-13 | Passwords hashed with bcrypt (cost ≥ 12) or argon2 | L3 | `quality/security/auth-data-protection.md` |
| Security | SEC-14 | RBAC or ABAC enforced at the service layer, not only the UI | L3 | `quality/security/auth-data-protection.md` |
| Security | SEC-15 | Sensitive data encrypted at rest (PII, financial data, credentials) | L4 | `quality/security/auth-data-protection.md` |
| Security | SEC-16 | All data in transit uses TLS 1.2+ (no HTTP, no TLS 1.0/1.1) | L4 | `quality/security/auth-data-protection.md` |
| Security | SEC-17 | Session tokens stored in HttpOnly, Secure, SameSite=Strict cookies | L4 | `quality/security/auth-data-protection.md` |
| Security | SEC-18 | Privilege escalation paths tested: low-privilege user cannot access high-privilege resources | L5 | `quality/security/auth-data-protection.md` |
| Security | SEC-19 | No hardcoded API keys, secrets, or passwords in source code | L2 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-20 | `.env` files are gitignored; `.env.example` contains no real values | L2 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-21 | Secrets scanner (trufflehog or gitleaks) runs in CI pre-merge | L3 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-22 | Dependency vulnerability audit runs in CI (`npm audit --audit-level=high`) | L3 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-23 | Production secrets stored in Vault, AWS Secrets Manager, or equivalent | L4 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-24 | Dependency updates automated via Dependabot or Renovate | L4 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-25 | SBOM (Software Bill of Materials) generated per release | L5 | `quality/security/secrets-vulnerability-mgmt.md` |
| Security | SEC-26 | Critical CVEs patched within 72 hours of disclosure; high CVEs within 7 days | L5 | `quality/security/secrets-vulnerability-mgmt.md` |
| Architecture | ARCH-01 | UI layer does not import database/persistence code directly | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-02 | No circular dependencies between modules | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-03 | No file exceeds 500 lines with mixed concerns | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-04 | Business logic is not embedded in route handlers or controllers | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-05 | Service layer exists and mediates between API and data layers | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-06 | Test files do not import production infrastructure (DB, queue) directly | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-07 | Config/env values are not hardcoded inside business logic | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-08 | Package/module boundaries match functional boundaries | All | `quality/architecture/separation-of-concerns.md` |
| Architecture | ARCH-09 | Lock file is present and committed | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-10 | Lock file is not stale (committed alongside manifest changes) | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-11 | Zero known critical/high vulnerabilities in direct dependencies | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-12 | Outdated direct dependencies are below 20% of total | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-13 | All licenses are compatible with project's distribution model | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-14 | No unused dependencies declared in manifest | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-15 | Dependency count is proportional to project scope | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-16 | Provenance or integrity verification enabled for critical packages | All | `quality/architecture/dependency-management.md` |
| Architecture | ARCH-17 | HTTP methods match semantic intent (GET reads, POST creates, PUT/PATCH updates, DELETE removes) | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-18 | HTTP status codes are used consistently and correctly (200/201/204/400/401/403/404/422/500) | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-19 | API versioning strategy is defined and applied (URL prefix, header, or content negotiation) | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-20 | Error responses follow a consistent schema across all endpoints | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-21 | List endpoints implement pagination (cursor or offset) | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-22 | Rate limiting is implemented or documented as a known gap | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-23 | Scaling considerations are documented (stateless design, horizontal scalability, session handling) | All | `quality/architecture/api-design-scalability.md` |
| Architecture | ARCH-24 | Breaking vs non-breaking change policy exists (deprecation headers, changelog, or versioning increment rule) | All | `quality/architecture/api-design-scalability.md` |
| Documentation | DOC-01 | README exists at repo root | L2 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-02 | OpenAPI or Swagger spec file is present | L3 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-03 | OpenAPI spec covers all public endpoints (not just a subset) | L4 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-04 | At least one Architecture Decision Record (ADR) exists | L3 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-05 | ADRs cover major technology choices (framework, DB, auth strategy) | L4 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-06 | System architecture diagram exists (C4 context or container level) | L4 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-07 | Deployment documentation describes environments and deployment process | L4 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-08 | API changelog or version history documents breaking and non-breaking changes | L5 | `quality/documentation/api-architecture-docs.md` |
| Documentation | DOC-09 | README includes project description, tech stack, and purpose | L2 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-10 | README includes local setup instructions (install, configure, run) | L2 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-11 | All required environment variables are documented | L3 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-12 | `.env.example` or equivalent template file is committed | L3 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-13 | `CONTRIBUTING.md` exists and describes branch, PR, and review conventions | L3 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-14 | Local development setup can be completed following the docs without external help | L4 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-15 | Troubleshooting section covers at least 3 common setup failures | L4 | `quality/documentation/developer-onboarding.md` |
| Documentation | DOC-16 | Architecture overview in README or docs/ explains major components in < 5 minutes of reading | L5 | `quality/documentation/developer-onboarding.md` |
| Operations | OPS-01 | Pipeline configuration file exists and is committed | L2 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-02 | Pipeline runs on every pull request or merge request | L2 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-03 | Test stage is defined and required to pass before merge | L3 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-04 | Lint or static analysis stage is defined and required to pass | L3 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-05 | Build verification step exists (compile, bundle, or image build) | L3 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-06 | Deployment to staging is automated on merge to main | L4 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-07 | Environment promotion strategy is defined (staging → production gate) | L4 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-08 | Full CD pipeline with canary, blue/green, or feature-flag-gated rollout | L5 | `quality/operations/cicd-quality-gates.md` |
| Operations | OPS-09 | Application logs are written to stdout/stderr (not only to files) | L2 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-10 | Logs use structured format (JSON or key-value pairs, not free-form strings) | L3 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-11 | Metrics are collected and exposed (application-level, not just infra) | L3 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-12 | At least one alerting rule is defined for critical failure conditions (error rate, uptime) | L4 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-13 | A dashboard exists showing key application health signals | L4 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-14 | Log aggregation is configured (logs ship to a searchable backend) | L4 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-15 | Correlation IDs or trace IDs are included in log output | L5 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-16 | Distributed tracing is instrumented and SLO-based alerts are defined | L5 | `quality/operations/monitoring-alerting.md` |
| Operations | OPS-17 | A health check endpoint exists (`/health`, `/healthz`, or equivalent) | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-18 | Health check endpoint returns meaningful status (not just 200 OK, but checks DB/dependency connectivity) | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-19 | Rollback strategy is documented (revert commit, re-deploy previous image, feature flag off) | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-20 | Deployment process is idempotent (re-running the same deploy does not corrupt state) | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-21 | At least one runbook exists for the most critical failure scenario | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-22 | Incident severity classification is defined (P0/P1/P2 or equivalent) | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-23 | Post-mortem or incident review process is documented | All | `quality/operations/deployment-incident-response.md` |
| Operations | OPS-24 | Database migrations are backwards-compatible or have a tested rollback path | All | `quality/operations/deployment-incident-response.md` |
| Frontend | FE-01 | All `<img>` elements have meaningful `alt` text (empty `alt=""` for decorative) | L2 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-02 | Interactive elements are keyboard-reachable and have visible focus indicators | L3 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-03 | Color contrast ratio meets AA (4.5:1 for normal text, 3:1 for large text) | L3 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-04 | ARIA roles, states, and properties are used correctly and not overriding native semantics | L4 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-05 | Semantic HTML elements used (`<nav>`, `<main>`, `<header>`, `<button>` vs `<div>`) | L2 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-06 | Largest Contentful Paint (LCP) < 2.5s on median device | L3 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-07 | Cumulative Layout Shift (CLS) < 0.1 — no layout shifts without user interaction | L3 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-08 | JavaScript bundle size per route < 200KB (compressed) | L4 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-09 | Images served in modern formats (WebP/AVIF), with `width` and `height` set | L3 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-10 | Automated accessibility tests run in CI (at minimum axe-core smoke tests) | L5 | `quality/frontend/accessibility-performance.md` |
| Frontend | FE-11 | Component files follow a consistent structure (imports, types, component, exports) | L2 | `quality/frontend/component-architecture.md` |
| Frontend | FE-12 | No prop drilling beyond 2 levels — context, store, or composition used instead | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-13 | Components are single-responsibility — one primary concern per component | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-14 | Reusable components extracted to shared library or `components/` folder; not duplicated | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-15 | Design system tokens used for color, spacing, and typography (no hardcoded hex/px values) | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-16 | Design system components used where available instead of custom re-implementations | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-17 | Components have usage documentation (Storybook stories, JSDoc, or README) | L4 | `quality/frontend/component-architecture.md` |
| Frontend | FE-18 | Container/presentational split maintained — data fetching not mixed into display components | L3 | `quality/frontend/component-architecture.md` |
| Frontend | FE-19 | Server state managed via a dedicated caching library (React Query, SWR, Apollo Client) — not stored manually in Redux/Zustand | L3 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-20 | Global state contains only truly shared state — no per-component ephemeral state promoted to global | L3 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-21 | Form state managed by a form library (React Hook Form, Formik, VeeValidate) — not manual `useState` per field | L3 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-22 | Shareable/bookmarkable UI state (filters, search, pagination) reflected in URL | L3 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-23 | Normalized state shape for relational data — no duplicate object graphs in store | L4 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-24 | Optimistic updates implemented for user-visible mutations (create, delete, toggle) | L4 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-25 | No stale closure bugs — event handlers and effects reference current state via refs or dependency arrays | L3 | `quality/frontend/state-management-patterns.md` |
| Frontend | FE-26 | Cache invalidation strategy defined — stale data doesn't persist after mutations | L3 | `quality/frontend/state-management-patterns.md` |
| Backend | BE-01 | RESTful conventions followed: nouns for resources, HTTP methods match semantics (GET=read, POST=create, PUT/PATCH=update, DELETE=remove) | L2 | `quality/backend/api-design-validation.md` |
| Backend | BE-02 | All request inputs validated at the controller/handler boundary before use (Zod, Joi, Pydantic, class-validator) | L3 | `quality/backend/api-design-validation.md` |
| Backend | BE-03 | Validation errors return structured 400 responses with field-level details — not raw stack traces | L3 | `quality/backend/api-design-validation.md` |
| Backend | BE-04 | Rate limiting applied to public/authenticated endpoints (not just unauthenticated ones) | L3 | `quality/backend/api-design-validation.md` |
| Backend | BE-05 | All list endpoints support pagination — no unbounded queries returning full table scans | L3 | `quality/backend/api-design-validation.md` |
| Backend | BE-06 | Consistent error response format across all endpoints: `{ error: { code, message, details? } }` | L3 | `quality/backend/api-design-validation.md` |
| Backend | BE-07 | API versioning strategy present: URL prefix (`/v1/`), header, or content negotiation — documented | L4 | `quality/backend/api-design-validation.md` |
| Backend | BE-08 | No sensitive data in URL paths or query strings (tokens, passwords, PII) | L2 | `quality/backend/api-design-validation.md` |
| Backend | BE-09 | No empty catch blocks — all catches either rethrow, log with context, or handle explicitly | L2 | `quality/backend/async-error-handling.md` |
| Backend | BE-10 | No fire-and-forget promises — every `async` call either awaited or `.catch()` attached | L3 | `quality/backend/async-error-handling.md` |
| Backend | BE-11 | Queue consumers implement dead letter queue (DLQ) routing after N failed retries | L3 | `quality/backend/async-error-handling.md` |
| Backend | BE-12 | External service calls have explicit timeout configuration — no infinite waits | L3 | `quality/backend/async-error-handling.md` |
| Backend | BE-13 | Retry logic uses exponential backoff with jitter — not fixed intervals | L4 | `quality/backend/async-error-handling.md` |
| Backend | BE-14 | Graceful shutdown handler registered — in-flight requests drain before process exit | L3 | `quality/backend/async-error-handling.md` |
| Backend | BE-15 | Async errors in Express/Fastify route handlers forwarded to error middleware via `next(err)` or async error plugin | L3 | `quality/backend/async-error-handling.md` |
| Backend | BE-16 | Process-level unhandled rejection handler present and logs with full context | L2 | `quality/backend/async-error-handling.md` |
| Backend | BE-17 | No N+1 query patterns — related entities loaded with joins or batch loads, not in loops | L3 | `quality/backend/database-caching.md` |
| Backend | BE-18 | No `SELECT *` in production queries — explicit column selection used | L2 | `quality/backend/database-caching.md` |
| Backend | BE-19 | Slow queries identified via EXPLAIN ANALYZE — queries on large tables have supporting indexes | L4 | `quality/backend/database-caching.md` |
| Backend | BE-20 | Database migrations are zero-downtime compatible — no blocking locks on large tables | L4 | `quality/backend/database-caching.md` |
| Backend | BE-21 | Connection pool configured and sized — not using default (usually too small) | L3 | `quality/backend/database-caching.md` |
| Backend | BE-22 | Cache invalidation strategy explicit — cache entries evicted on write, not just TTL-expired | L3 | `quality/backend/database-caching.md` |
| Backend | BE-23 | Cache stampede prevention in place for high-traffic keys (mutex lock or probabilistic early expiry) | L4 | `quality/backend/database-caching.md` |
| Backend | BE-24 | Raw SQL in application code validated — parameterized queries used, no string concatenation | L2 | `quality/backend/database-caching.md` |
| Data & Privacy | DATA-01 | Schema is normalized to 3NF for transactional data — no obvious update anomalies | L3 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-02 | Indexes exist on all foreign keys and high-cardinality columns used in WHERE / JOIN clauses | L3 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-03 | Composite indexes ordered by selectivity — most selective column first | L4 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-04 | NOT NULL constraints applied to required fields — nullable columns have documented intent | L2 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-05 | Foreign key constraints enforced at the database level — not only in application code | L3 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-06 | Consistent naming convention enforced: `snake_case` for columns/tables, singular table names | L2 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-07 | Soft delete pattern documented and indexed — `deleted_at` column indexed; queries filter it consistently | L3 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-08 | Schema documented — tables and non-obvious columns have comments or a data dictionary | L4 | `quality/data/schema-design.md` |
| Data & Privacy | DATA-09 | A migration tool is in use and all schema changes go through it — no ad-hoc DDL in production | L2 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-10 | Every `up` migration has a corresponding `down` migration that is tested | L3 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-11 | Migrations are sequential and conflict-free — no two branches create migrations with the same version number | L3 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-12 | Zero-downtime migration patterns used for large-table changes: expand-contract, column addition before removal | L4 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-13 | Data migrations (backfills) separated from schema migrations — not combined in a single migration file | L3 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-14 | Backfill migrations are batched — no single UPDATE affecting all rows of a large table at once | L4 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-15 | Migration history table present and committed to version control | L2 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-16 | Migrations are tested against a real database in CI — not skipped | L3 | `quality/data/migrations-versioning.md` |
| Data & Privacy | DATA-17 | PII fields identified and classified in data dictionary or schema comments (name, email, phone, address, SSN, DOB) | L3 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-18 | PII columns encrypted at rest or stored as hash where lookup is not required | L4 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-19 | Data in transit encrypted — TLS enforced on all API connections, database connections, and inter-service calls | L3 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-20 | Non-production environments use masked or synthetic data — no production PII in staging/dev | L3 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-21 | Data retention policy documented and enforced — records deleted or anonymized after defined period | L4 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-22 | Consent records stored with timestamp and version of policy accepted | L3 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-23 | Right to erasure implemented — user deletion flow removes or anonymizes all PII across all stores | L4 | `quality/data/privacy-compliance.md` |
| Data & Privacy | DATA-24 | Audit log of PII access events retained — who accessed which record and when | L4 | `quality/data/privacy-compliance.md` |
| Performance | PERF-01 | Load testing tool present in repo or CI pipeline | L1 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-02 | At least one load test scenario covers the critical user path | L2 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-03 | Performance budget defined: p95 latency target documented per endpoint | L2 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-04 | Flame graph or CPU profiling evidence exists for hot paths | L3 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-05 | Memory profiling performed: no unbounded growth under sustained load | L3 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-06 | Benchmark suite exists for performance-critical functions | L3 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-07 | Load tests run in CI pipeline on PR merge to main | L4 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-08 | Baseline performance metrics documented and version-pinned | L4 | `quality/performance/load-testing-profiling.md` |
| Performance | PERF-09 | SLI definitions documented: what is measured for each SLO | L2 | `quality/performance/slos-reliability.md` |
| Performance | PERF-10 | SLO targets documented with numeric thresholds (e.g., 99.9% availability over 30 days) | L2 | `quality/performance/slos-reliability.md` |
| Performance | PERF-11 | Error budget defined and calculated from SLO | L3 | `quality/performance/slos-reliability.md` |
| Performance | PERF-12 | Availability alerts fire before error budget is exhausted | L3 | `quality/performance/slos-reliability.md` |
| Performance | PERF-13 | Incident classification scheme defined (P0/P1/P2 or equivalent) | L3 | `quality/performance/slos-reliability.md` |
| Performance | PERF-14 | MTTR tracked per incident severity level | L4 | `quality/performance/slos-reliability.md` |
| Performance | PERF-15 | MTTD tracked: time from incident start to detection | L4 | `quality/performance/slos-reliability.md` |
| Performance | PERF-16 | Reliability review conducted quarterly: SLO attainment vs target reviewed | L5 | `quality/performance/slos-reliability.md` |
| Performance | PERF-17 | Memory leak detection: load test with heap sampling; no unbounded growth over 30-minute run | L3 | `quality/performance/resource-optimization.md` |
| Performance | PERF-18 | Connection pooling configured for all database and external service clients | L2 | `quality/performance/resource-optimization.md` |
| Performance | PERF-19 | Caching strategy documented: what is cached, TTL, invalidation mechanism | L3 | `quality/performance/resource-optimization.md` |
| Performance | PERF-20 | CDN configured for all static assets (JS, CSS, images, fonts) | L2 | `quality/performance/resource-optimization.md` |
| Performance | PERF-21 | Frontend: lazy loading and code splitting applied; initial bundle ≤ 200KB gzipped | L3 | `quality/performance/resource-optimization.md` |
| Performance | PERF-22 | Database queries reviewed for N+1 patterns; ORM eager loading configured where needed | L3 | `quality/performance/resource-optimization.md` |
| Performance | PERF-23 | Database indexes exist for all high-cardinality columns used in WHERE/JOIN/ORDER BY | L3 | `quality/performance/resource-optimization.md` |
| Performance | PERF-24 | Bundle size tracked in CI: build fails if initial bundle exceeds defined threshold | L4 | `quality/performance/resource-optimization.md` |
| Tech Debt | DEBT-01 | All debt decisions are explicitly recorded (not only as TODO comments in code) | L2 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-02 | Each recorded debt item can be classified into one of the four quadrant cells | L3 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-03 | Deliberate-reckless debt proportion is tracked and trending down | L3 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-04 | Deliberate-prudent debt has a recorded repayment timeline at time of acceptance | L2 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-05 | Inadvertent debts discovered during development are captured immediately | L3 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-06 | Classification heuristic applied consistently: quadrant assignment reviewed in debt sessions | L4 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-07 | No deliberate-reckless debt older than 90 days exists without an escalation record | L4 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-08 | Team can articulate the quadrant for any top-5 debt item on request | L5 | `quality/tech-debt/fowler-quadrant.md` |
| Tech Debt | DEBT-09 | Debt register exists as a structured tracking artifact (issue tracker, spreadsheet, ADR section) | L1 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-10 | Each debt item has an owner (team member or team name, not "TBD") | L2 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-11 | Each debt item has a repayment timeline (target quarter or milestone) | L2 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-12 | Each debt item has a blast radius assessment (what breaks if this is never fixed) | L3 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-13 | Debt decay detection: items marked "temporary" or with initial timeline now > 6 months old are flagged | L3 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-14 | Debt-to-feature ratio tracked per sprint or milestone | L4 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-15 | Repayment velocity tracked: debts resolved per quarter | L4 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-16 | Debt review cadence: register reviewed at minimum quarterly | L4 | `quality/tech-debt/debt-register-governance.md` |
| Tech Debt | DEBT-17 | Each accepted debt item has an explicit acceptance record (not implied by shipping) | L2 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-18 | Acceptance record includes: timeline, owner, blast radius, and review date | L2 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-19 | No accepted debt falls into invariant violation categories (security, data, compliance, cascading) | L1 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-20 | Deliberate-prudent acceptance protocol followed: decision captured at time of trade-off | L3 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-21 | Debt acceptance has an approval record: who approved and when | L3 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-22 | Decision audit trail exists: can you trace WHY each debt item was accepted | L3 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-23 | Unaccepted debt indicators absent: no open debt with zero owner, zero timeline, zero blast radius | L4 | `quality/tech-debt/accepted-vs-unaccepted.md` |
| Tech Debt | DEBT-24 | Accepted debt reviewed at repayment timeline: either resolved or explicitly extended with new rationale | L4 | `quality/tech-debt/accepted-vs-unaccepted.md` |
