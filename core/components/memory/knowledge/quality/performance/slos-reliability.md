# SLOs and Reliability Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any production service with availability or latency commitments to users or downstream systems
**When this does NOT apply:** Development environments, preview deployments, or internal tools with no on-call coverage
**Search patterns:** SLO, SLI, error budget, availability target, MTTR, MTTD, incident classification, reliability review, alerting
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

SLOs translate business reliability expectations into measurable engineering targets. Without defined SLOs, incident response is reactive and improvement is directionless.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| PERF-09 | SLI definitions documented: what is measured for each SLO | L2 | Check runbook/docs for explicit SLI definitions (e.g., "successful HTTP responses / total requests") | Docs, ADR |
| PERF-10 | SLO targets documented with numeric thresholds (e.g., 99.9% availability over 30 days) | L2 | Verify numeric SLO in docs, service contract, or config; no vague "high availability" | Docs, service contract |
| PERF-11 | Error budget defined and calculated from SLO | L3 | Check for error budget policy: budget = (1 - SLO) × window; verify it drives release decisions | SRE runbook |
| PERF-12 | Availability alerts fire before error budget is exhausted | L3 | Verify alerting thresholds trigger at ≥50% budget burn rate, not at SLO breach | Prometheus, Datadog, PagerDuty |
| PERF-13 | Incident classification scheme defined (P0/P1/P2 or equivalent) | L3 | Check runbook for incident severity definitions with response time SLA per level | Runbook |
| PERF-14 | MTTR tracked per incident severity level | L4 | Verify incident postmortems include MTTR; check dashboard or tracker for trend | PagerDuty, Opsgenie, Jira |
| PERF-15 | MTTD tracked: time from incident start to detection | L4 | Verify monitoring captures incident start time; postmortems record detection lag | Monitoring dashboard |
| PERF-16 | Reliability review conducted quarterly: SLO attainment vs target reviewed | L5 | Check for quarterly review artifact (doc, meeting note) with SLO trend analysis | Quarterly review doc |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| SLO defined but no alert on budget burn | SLO exists in docs but no system fires before breach | Teams learn about violations from customers, not dashboards |
| Error budget never spent | No mechanism to deploy when budget is green; budget has no decision power | SLO becomes a vanity metric with no engineering consequence |
| MTTR measured from alert, not incident start | Detection lag excluded from MTTR; metric looks better than reality | Improvement focus misaligned; detection problems go unaddressed |
| Incident classification by feel, not criteria | Severity assigned by responder's judgment with no written criteria | Inconsistent response; P1 varies by who is on-call |

## Why It Matters

SLOs make reliability a first-class engineering concern with measurable outcomes. Error budgets create a shared language between product and engineering for release vs stability trade-offs.

## Applicability Boundaries

**In scope:** Production services, customer-facing APIs, internal platform services with downstream dependents
**Out of scope:** Staging environments, developer preview branches, experimental features behind feature flags with <1% traffic

## Rationale

Without SLOs, every outage is a surprise and every reliability conversation is subjective. SLOs convert "the system should be reliable" into a falsifiable claim.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
