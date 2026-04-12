# Operations Quality Standards

Quality checks for CI/CD pipeline adequacy, monitoring and alerting coverage, and deployment and incident response readiness. These checks assess whether operational practices are correctly implemented — not which operational tools to adopt (see `knowledge/architecture/operations/` for tooling guidance).

## Files

- [cicd-quality-gates.md](cicd-quality-gates.md) — Pipeline existence, stage enforcement, and deployment automation (QP-4 indexed) | Patterns: GitHub Actions, GitLab CI, test stage, lint stage, build verification, environment promotion
- [monitoring-alerting.md](monitoring-alerting.md) — Structured logging, metrics, alerting, and observability coverage (QP-5 indexed) | Patterns: structured logging, metrics, alerting, dashboard, log aggregation, SLO, distributed tracing
- [deployment-incident-response.md](deployment-incident-response.md) — Rollback strategy, health checks, runbooks, and incident process | Patterns: rollback, health check, runbook, incident classification, post-mortem
