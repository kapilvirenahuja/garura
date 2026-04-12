# Accepted vs Unaccepted Debt Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any decision to accept technical debt — deferred work, known shortcuts, or incomplete implementations shipped intentionally
**When this does NOT apply:** Retrospective analysis of already-shipped debt where acceptance already occurred
**Search patterns:** debt acceptance, invariant violation, security debt, data integrity, acceptance protocol, debt audit, blast radius, decision trace
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Not all debt acceptance is equal. Some debt is structurally acceptable with proper protocol. Some debt is never acceptable regardless of timeline pressure. This file defines the boundary.

### Debt Invariants — NEVER Acceptable

These categories of debt must never be accepted. Shipping with these in place is a high-severity quality violation regardless of business pressure:

1. **Security holes with known exploit paths** — Unpatched vulnerabilities with public CVEs, hardcoded credentials, or unauthenticated access to sensitive endpoints
2. **Data corruption risks** — Logic that can silently corrupt user data, double-write transactions, or delete records without audit trail
3. **Compliance violations** — Code paths that violate GDPR, HIPAA, PCI-DSS, or equivalent regulations applicable to the product
4. **Cascading failure amplifiers** — Missing circuit breakers or retry storms that will take down downstream services under load

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DEBT-17 | Each accepted debt item has an explicit acceptance record (not implied by shipping) | L2 | Verify register entry or ADR comment created at time of acceptance; retroactive entries flagged | Debt register, ADR |
| DEBT-18 | Acceptance record includes: timeline, owner, blast radius, and review date | L2 | Audit acceptance records for all four fields; missing fields = incomplete acceptance | Debt register audit |
| DEBT-19 | No accepted debt falls into invariant violation categories (security, data, compliance, cascading) | L1 | Classify each open debt item against four invariants; flag matches as immediate escalation | Debt register + security review |
| DEBT-20 | Deliberate-prudent acceptance protocol followed: decision captured at time of trade-off | L3 | Check git history and issue tracker for acceptance record created within 24h of debt being incurred | Git log, issue tracker |
| DEBT-21 | Debt acceptance has an approval record: who approved and when | L3 | Verify acceptance entries show approver (tech lead, architect, or equivalent); anonymous acceptances flagged | Debt register |
| DEBT-22 | Decision audit trail exists: can you trace WHY each debt item was accepted | L3 | Each acceptance record must include a one-sentence rationale linking to business or technical constraint | Debt register review |
| DEBT-23 | Unaccepted debt indicators absent: no open debt with zero owner, zero timeline, zero blast radius | L4 | Query register for items missing all three fields; these are unaccepted-by-default | Debt register query |
| DEBT-24 | Accepted debt reviewed at repayment timeline: either resolved or explicitly extended with new rationale | L4 | Check items past their target date; verify resolution or extension note with new timeline | Debt register + calendar |

### Acceptance Protocol (Deliberate-Prudent)

When a team accepts deliberate-prudent debt, the following must be recorded at time of decision:

1. **What** — One-sentence description of the shortcut or deferred work
2. **Why** — The business or technical constraint that made it necessary (e.g., "pagination deferred to ship by Q2 deadline")
3. **Timeline** — Target quarter or milestone for repayment (e.g., "repay in Q3 Sprint 2")
4. **Blast radius** — What breaks or degrades if never fixed (e.g., "query performance degrades beyond 10k records")
5. **Owner** — Named individual or team responsible for repayment
6. **Approver** — Tech lead or architect who signed off

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Debt accepted by silence | Team ships shortcut; no record created; acceptance implied by merge | Unaccepted debt accumulates; ownership unclear; impossible to audit |
| Security debt accepted with "we'll fix it soon" | CVE or auth gap accepted without invariant check or escalation | High-severity vulnerability deferred indefinitely; exploited in production |
| Blast radius assessed as "low" for deferred pagination | Risk minimized to avoid pushback; real blast radius hidden | Decision made on false data; repayment deprioritized; outage when record count grows |
| Extension without rationale | Timeline missed; new date set with no explanation | Debt never repays; extensions become the norm; register loses credibility |

## Why It Matters

Debt without acceptance protocol is debt without accountability. The acceptance record converts a shortcut into a managed obligation with an owner and a deadline.

## Applicability Boundaries

**In scope:** All deliberate debt decisions in production codebases; any trade-off made under time or resource pressure
**Out of scope:** Inadvertent debt discovered retrospectively (use fowler-quadrant.md capture process instead)

## Rationale

The acceptance/unacceptance distinction protects teams from two failure modes: accepting debt that should never be accepted, and treating all accepted debt as equivalent regardless of protocol quality.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
