# Monitoring and Alerting Quality
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a project has adequate monitoring, alerting, and log observability in production
**When this does NOT apply:** Development-only or local tooling with no production deployment
**Search patterns:** structured logging, metrics, alerting, dashboard, log aggregation, Prometheus, Datadog, SLO, distributed tracing, observability
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project can detect, diagnose, and alert on production failures. This is distinct from observability tool selection (see `knowledge/architecture/operations/observability.md`) — the focus here is on what the project actually emits and monitors.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| OPS-09 | Application logs are written to stdout/stderr (not only to files) | L2 | Grep logging config for file-only appenders; verify stdout output | Grep logging config |
| OPS-10 | Logs use structured format (JSON or key-value pairs, not free-form strings) | L3 | Sample 5 log statements; verify structured output | Grep log statements |
| OPS-11 | Metrics are collected and exposed (application-level, not just infra) | L3 | Check for metrics middleware, Prometheus endpoint, or APM SDK import | Grep imports, Glob config |
| OPS-12 | At least one alerting rule is defined for critical failure conditions (error rate, uptime) | L4 | Check alerting config files or monitoring-as-code definitions | Glob for alert rules |
| OPS-13 | A dashboard exists showing key application health signals | L4 | Verify dashboard config committed or documented link in runbook | Glob, Read docs |
| OPS-14 | Log aggregation is configured (logs ship to a searchable backend) | L4 | Check for log shipper config (Fluent Bit, Logstash, CloudWatch agent) | Glob config files |
| OPS-15 | Correlation IDs or trace IDs are included in log output | L5 | Grep log statements for `traceId`, `correlationId`, `requestId` | Grep |
| OPS-16 | Distributed tracing is instrumented and SLO-based alerts are defined | L5 | Check for OpenTelemetry or APM SDK; check for SLO alert config | Grep imports + alert config |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Free-form log strings | `console.log("Error happened: " + err)` instead of structured JSON | Logs cannot be queried, filtered, or alerted on programmatically |
| Alerts on symptoms only | Alerting on CPU/memory but not on error rate or latency | Infrastructure looks healthy while users are experiencing errors |
| No log retention policy | Logs stored indefinitely or discarded after 1 day | Compliance risk or inability to debug past incidents |
| PII in logs | User emails, tokens, or passwords logged for debugging | Privacy violation; security incident surface area |

## Why It Matters

Production incidents are inevitable. The question is whether the team discovers problems before users do — and whether they can diagnose root cause quickly. Monitoring and alerting adequacy is assessable from configuration files and code patterns alone; it does not require access to a running system.

## Applicability Boundaries

**In scope:** Any application deployed to a production or staging environment
**Out of scope:** CLI tools, batch scripts, or local-only applications with no production runtime

## Rationale

Observability gaps are invisible during development and expensive during incidents. Assessing structured logging, metric exposure, and alerting configuration from the codebase is a static check that predicts production debugging capability before deployment.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
