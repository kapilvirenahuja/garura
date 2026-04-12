# Deployment and Incident Response Readiness
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a project can recover from deployment failures and production incidents with defined processes
**When this does NOT apply:** Prototype or experimental repositories with no SLA expectations
**Search patterns:** rollback strategy, health check endpoint, runbook, incident classification, post-mortem, deployment readiness, incident response
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project has the operational artifacts and practices needed to respond to production incidents — rollback capability, health checks, runbooks, and a post-mortem process.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| OPS-17 | A health check endpoint exists (`/health`, `/healthz`, or equivalent) | All | Grep route definitions for health check path | Grep routes |
| OPS-18 | Health check endpoint returns meaningful status (not just 200 OK, but checks DB/dependency connectivity) | All | Read health check handler; verify it checks at least one dependency | Read handler code |
| OPS-19 | Rollback strategy is documented (revert commit, re-deploy previous image, feature flag off) | All | Check runbook, README, or deployment docs for rollback procedure | Read docs |
| OPS-20 | Deployment process is idempotent (re-running the same deploy does not corrupt state) | All | Review migration and deployment scripts for idempotency | Code review |
| OPS-21 | At least one runbook exists for the most critical failure scenario | All | Glob for `docs/runbooks/`, `runbook.md`, or equivalent | Glob |
| OPS-22 | Incident severity classification is defined (P0/P1/P2 or equivalent) | All | Check incident response docs or CONTRIBUTING for severity definitions | Read docs |
| OPS-23 | Post-mortem or incident review process is documented | All | Check for `docs/incidents/`, post-mortem template, or incident process in CONTRIBUTING | Glob, Read |
| OPS-24 | Database migrations are backwards-compatible or have a tested rollback path | All | Review recent migration files for destructive operations without rollback | Read migration files |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Health endpoint returns 200 unconditionally | Load balancer marks unhealthy instance as healthy | Requests routed to broken instances; silent failure |
| No rollback procedure | Incident response requires improvisation | Recovery time multiplied; cascading failures during improvised rollback |
| Destructive migrations without rollback | `DROP COLUMN` deployed with no reverse migration | Rollback is impossible without data loss |
| No runbooks | On-call engineer must read source code during an incident | Mean time to recovery (MTTR) increases dramatically under pressure |

## Why It Matters

Incidents are not exceptional — they are expected. A project's incident response quality determines whether an outage lasts 10 minutes or 4 hours. Rollback capability, health checks, and runbooks are the minimum artifacts that convert "incident" from a crisis into a recoverable operational event.

## Applicability Boundaries

**In scope:** Any project with a production deployment and availability expectations
**Out of scope:** Tooling used only in development, one-shot migration scripts, internal dashboards with no SLA

## Rationale

Deployment and incident response readiness is assessable from documentation and code artifacts before an incident occurs. The cost of creating a runbook is hours; the cost of not having one during a P0 is measured in revenue and customer trust. This is the highest-leverage operational documentation investment.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
