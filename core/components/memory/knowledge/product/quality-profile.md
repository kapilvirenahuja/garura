# Quality Profile

Characterizes the engineering quality practices the product requires — testing rigor, code standards, documentation, observability, and compliance automation. Established after the Product Profile and NFR Profile, informed by both.

**Search patterns:** quality profile, reliability, performance standards, security practices, usability standards, maintainability, observability, compliance practices, testing depth, code quality, documentation, linting, design patterns, technical debt

## How to Use

The agent sets initial QP values based on the Product Profile and NFR Profile (using the PP+NFR Guidance below) and any explicit quality requirements in the BRD. The agent presents the profile to the user with reasoning. The user adjusts. This profile is **extensible** — new dimensions can be added by appending sections following the same format.

Quality Profile dimensions define the **engineering quality baseline** for the project. They are the reference point for calculating technical debt — any gap between the QP target and the actual implementation state is measurable debt.

## Dimensions

### QP-1: Testing Depth

How thorough and automated is the testing strategy.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Manual / Ad Hoc | No automated tests. Manual verification of happy paths. Acceptable for throwaway prototypes. | Hackathon projects, disposable demos, spike experiments |
| 2 | Unit Basics | Unit tests for core business logic. No integration or e2e tests. Manual regression before releases. | Early MVPs, internal scripts, small utilities |
| 3 | Layered Testing | Unit + integration tests. Basic e2e for critical paths. CI runs tests on every PR. Code coverage tracked (target: 60-80%). | Production SaaS, e-commerce, content platforms |
| 4 | Comprehensive | Unit + integration + e2e + contract tests. Performance test suite. Mutation testing for critical modules. Coverage target: 80%+. Test pyramid enforced. | Enterprise SaaS, fintech, healthcare platforms |
| 5 | Exhaustive | Property-based testing, fuzzing, chaos engineering, formal verification for critical paths. Continuous testing in production (canary analysis, synthetic monitoring). | Banking core, safety-critical systems, infrastructure platforms |

### QP-2: Code Quality Standards

Linting, formatting, static analysis, design pattern enforcement, and review rigor.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | No Standards | No linter, no formatter, no review process. Individual developer discretion. | Personal projects, throwaway prototypes |
| 2 | Basic Hygiene | Linter configured (ESLint, Pylint). Formatter enforced (Prettier, Black). Basic PR review (1 reviewer). | Small teams, early-stage startups, internal tools |
| 3 | Enforced Standards | Linter + formatter + pre-commit hooks. Static analysis (SonarQube, CodeClimate). PR review with checklist. Documented coding conventions. Design pattern guidelines. | Production SaaS, growing teams, B2B platforms |
| 4 | Architecture Governance | All of Level 3 plus: architecture decision records (ADRs), dependency analysis, layering rules enforced (ArchUnit, deptry). Automated design pattern detection. Security-focused code review. | Enterprise SaaS, regulated industries, platform products |
| 5 | Formal Governance | All of Level 4 plus: formal code ownership (CODEOWNERS), mandatory architecture review for cross-cutting changes, automated conformance checks against architecture.yaml, dependency license auditing. | Large-scale platforms, heavily regulated systems, critical infrastructure |

### QP-3: Documentation Level

API documentation, architecture docs, runbooks, and knowledge management.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Minimal | Code comments where non-obvious. README with setup instructions. No other documentation. | Personal projects, hackathons, experiments |
| 2 | Functional | README + API documentation (auto-generated from code annotations). Inline code comments for complex logic. Basic deployment notes. | Small SaaS, internal tools, developer utilities |
| 3 | Comprehensive | OpenAPI/Swagger specs, architecture overview diagrams, ADRs, runbooks for common operations, onboarding guide for new developers. | Production SaaS, team-based development, B2B platforms |
| 4 | Versioned & Governed | All of Level 3 plus: versioned API docs (per release), changelog automation, architecture diagrams generated from code, documentation freshness checks in CI. | Enterprise SaaS, API-first products, platform products |
| 5 | Interactive & Auditable | All of Level 4 plus: interactive API explorer, generated architecture diagrams with drift detection, documentation coverage metrics, compliance-ready audit trails for all design decisions. | Heavily regulated industries, public API platforms, government systems |

### QP-4: CI/CD Maturity

Build, test, deploy automation depth and release confidence.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Manual Deploy | Build and deploy manually. No CI pipeline. Version control used but no automation. | Personal projects, throwaway prototypes |
| 2 | Basic CI | Automated build + test on PR. Manual deploy triggered by developer. Single environment (staging or production). | Early-stage startups, small teams, internal tools |
| 3 | Continuous Delivery | Automated build + test + deploy to staging. Production deploy via manual approval. Multiple environments (dev, staging, prod). Database migrations automated. | Production SaaS, growing teams, B2B platforms |
| 4 | Full CD | Zero-downtime deployments (blue-green or rolling). Feature flags for progressive rollout. Automated rollback on failure. Preview environments per PR. Infrastructure as code. | Enterprise SaaS, high-traffic platforms, fintech |
| 5 | GitOps / Progressive | All of Level 4 plus: GitOps (declarative desired state), canary deployments with automated analysis, multi-region deployment orchestration, compliance gates in pipeline. | Global platforms, mission-critical systems, regulated industries |

### QP-5: Observability Maturity

Logging, monitoring, alerting, tracing, and operational visibility.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Console Logging | Console.log / print statements. No structured logging. Check logs manually when issues reported. | Prototypes, personal projects, experiments |
| 2 | Structured Logging | Structured JSON logs with severity levels. Basic health check endpoint. Error tracking (Sentry, Bugsnag). | Small SaaS, internal tools, early-stage products |
| 3 | Monitored | Structured logging + application metrics (request latency, error rates, throughput). Alerting on key thresholds. Dashboard for operational visibility. | Production SaaS, e-commerce, content platforms |
| 4 | Traced | All of Level 3 plus: distributed tracing (OpenTelemetry), correlation IDs across services, SLO-based alerting, on-call runbooks, incident response process. | Microservices architectures, enterprise SaaS, fintech |
| 5 | Predictive | All of Level 4 plus: anomaly detection, predictive alerting, automated remediation for known patterns, business metrics tied to technical metrics, chaos engineering validation of observability. | Global platforms, mission-critical systems, high-frequency trading |

### QP-6: Accessibility Standard

WCAG compliance, usability testing, and inclusive design rigor.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | No Standard | No accessibility considerations. Functional for sighted mouse users. | Internal tools, admin panels, developer utilities, prototypes |
| 2 | Basic | Semantic HTML, alt text for images, keyboard navigable for primary flows. No formal testing. | Simple web apps, content sites, small SaaS |
| 3 | WCAG AA | WCAG 2.1 AA compliance. Automated accessibility testing in CI (axe, Lighthouse). Screen reader testing for critical flows. Color contrast verified. | Production SaaS, e-commerce, public-facing platforms |
| 4 | WCAG AA+ | Full WCAG 2.1 AA with select AAA criteria. Manual accessibility audits quarterly. Assistive technology testing matrix. Accessibility regression tests. | Government-adjacent, enterprise SaaS, healthcare patient portals |
| 5 | WCAG AAA / Audit Certified | WCAG 2.1 AAA where applicable. Third-party accessibility audit certification. Continuous monitoring. Accessibility champions program. VPAT documentation. | Government services, mandated accessibility, healthcare, education platforms |

### QP-7: Security Testing

Vulnerability scanning, penetration testing, and security assurance depth.

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | No Testing | No security-specific testing. Rely on framework defaults. | Prototypes, personal projects, internal experiments |
| 2 | Dependency Scanning | Automated dependency vulnerability scanning (Dependabot, Snyk). Update known vulnerabilities on a regular cadence. | Small SaaS, internal tools, early-stage products |
| 3 | SAST + Dependencies | Static application security testing (CodeQL, Semgrep) in CI. Dependency scanning. Security-focused PR review checklist. Secret scanning. | Production SaaS, B2B platforms, e-commerce |
| 4 | DAST + Pen Testing | All of Level 3 plus: dynamic application security testing, annual penetration testing by third party, vulnerability disclosure program, security incident response plan. | Enterprise SaaS, fintech, healthcare, regulated commerce |
| 5 | Continuous Security | All of Level 4 plus: continuous pen testing, red team exercises, bug bounty program, IAST in staging, security chaos engineering, formal threat modeling per feature. | Banking, government, defense, critical infrastructure |

## PP+NFR Guidance

How Product Profile and NFR Profile values suggest Quality Profile defaults. These are soft suggestions — the agent presents them as recommended starting points, not enforced values.

| Profile Condition | Suggested QP Default | Rationale |
|-------------------|---------------------|-----------|
| PP-6 = 1 (POC) | All QP dimensions default to 1 | POC doesn't need quality engineering |
| PP-6 >= 3 (Market-Ready+) | QP-1 (Testing) >= 3, QP-4 (CI/CD) >= 3 | Market-ready products need layered testing and continuous delivery |
| PP-6 >= 4 (Competitive+) | QP-2 (Code Quality) >= 3, QP-3 (Documentation) >= 3 | Competitive products need maintainable codebases |
| PP-7 >= 4 (Regulated Commerce+) | QP-7 (Security Testing) >= 3 | Regulated industries need security scanning |
| PP-7 = 5 (Heavily Regulated) | QP-7 (Security Testing) >= 4, QP-6 (Accessibility) >= 3 | BFSI/healthcare needs pen testing and accessibility compliance |
| PP-1 = 5 (Assisted/Accessibility) | QP-6 (Accessibility) >= 4 | Accessibility-first products must meet WCAG AA+ |
| PP-3 >= 4 (Role Hierarchy+) | QP-1 (Testing) >= 3 | Complex permissions need thorough testing |
| PP-5 >= 4 (Ecosystem+) | QP-3 (Documentation) >= 4, QP-4 (CI/CD) >= 3 | Ecosystem participants need versioned API docs and reliable releases |
| NFR-1 >= 4 (High Risk+) | QP-1 (Testing) >= 4, QP-5 (Observability) >= 4 | High-risk systems need comprehensive testing and observability |
| NFR-2 >= 3 (Business Grade+) | QP-7 (Security Testing) >= 3 | Business-grade security needs SAST and dependency scanning |
| NFR-2 >= 4 (Enterprise Grade+) | QP-7 (Security Testing) >= 4 | Enterprise security needs DAST and pen testing |
| NFR-3 >= 4 (Real-Time+) | QP-1 (Testing) >= 4, QP-5 (Observability) >= 4 | Real-time performance needs performance test suites and distributed tracing |
| NFR-4 >= 3 (Standard+) | QP-4 (CI/CD) >= 3, QP-5 (Observability) >= 3 | Standard availability needs automated deployment and monitoring |
| NFR-4 >= 4 (High Availability+) | QP-4 (CI/CD) >= 4, QP-5 (Observability) >= 4 | HA needs zero-downtime deploys and traced observability |
| NFR-5 >= 3 (Standard Compliance+) | QP-3 (Documentation) >= 3, QP-7 (Security Testing) >= 3 | Compliance needs comprehensive docs and security scanning |
| NFR-6 >= 4 (High Scale+) | QP-1 (Testing) >= 4, QP-5 (Observability) >= 4 | High-scale systems need comprehensive testing and predictive observability |

## Extending This Profile

To add a new QP dimension:
1. Add a new section following the format above: `### QP-N: Dimension Name` with a 5-level table
2. Each level needs: label, description, and examples
3. Consider whether any Product Profile or NFR Profile values should suggest defaults for this dimension (update PP+NFR Guidance above)
4. No other files need to change — dimensions are additive
