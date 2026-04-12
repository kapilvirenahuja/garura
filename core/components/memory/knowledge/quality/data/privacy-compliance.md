# Data Privacy and Compliance
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing systems that collect, store, or process personal data (PII, health, financial)
**When this does NOT apply:** Systems with no user data — internal analytics on anonymized metrics only
**Search patterns:** GDPR, privacy, PII, personal data, data masking, encryption at rest, encryption in transit, data retention, consent, right to erasure, data subject, email, phone, SSN, unencrypted PII
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers PII identification, encryption, masking in non-production environments, consent, retention policies, and the right to erasure. Universal check — applies to any system storing personal data.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DATA-17 | PII fields identified and classified in data dictionary or schema comments (name, email, phone, address, SSN, DOB) | L3 | Check schema documentation or `COMMENT ON COLUMN` for PII classification | Schema review, data dictionary |
| DATA-18 | PII columns encrypted at rest or stored as hash where lookup is not required | L4 | grep schema for `email`, `phone`, `ssn`, `tax_id`, `dob` columns; verify column type is not plain `VARCHAR` storing raw value | grep, Schema DDL |
| DATA-19 | Data in transit encrypted — TLS enforced on all API connections, database connections, and inter-service calls | L3 | Check database connection string for `sslmode=require`; verify API gateway enforces HTTPS | Config review, grep `sslmode` |
| DATA-20 | Non-production environments use masked or synthetic data — no production PII in staging/dev | L3 | Check seeding scripts and restore procedures for data masking step | Manual review, seed scripts |
| DATA-21 | Data retention policy documented and enforced — records deleted or anonymized after defined period | L4 | Verify retention schedule exists; check for scheduled jobs purging expired records | Manual review, cron/scheduler |
| DATA-22 | Consent records stored with timestamp and version of policy accepted | L3 | Check consent table schema for `consented_at` and `policy_version` columns | Schema review |
| DATA-23 | Right to erasure implemented — user deletion flow removes or anonymizes all PII across all stores | L4 | Trace user deletion code path across primary DB, analytics, search index, cache, backups | Manual review, code trace |
| DATA-24 | Audit log of PII access events retained — who accessed which record and when | L4 | Check for access logging middleware or DB audit logging; verify logs are queryable | Manual review, DB audit config |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Email/phone stored as plain text without encryption | `email VARCHAR(255)` storing `alice@example.com` without column-level encryption | Breach exposes all PII in plaintext |
| Production dump restored to staging without masking | DB restore script copies prod data directly to staging environment | Developers have unrestricted access to user PII |
| Soft delete as erasure | `deleted_at = NOW()` used to satisfy right-to-erasure requests | PII still present in DB, backups, and analytics exports |
| Consent without versioning | Consent recorded as a boolean flag with no policy version or timestamp | Cannot demonstrate which terms user consented to |
| Unencrypted PII in logs | `logger.info('Processing user', { email, phone })` | Log aggregation systems become PII stores |

## Why It Matters

GDPR fines are up to 4% of global annual turnover. Beyond regulatory exposure, a PII breach destroys user trust. These checks are preventive controls — the cost of implementing them is a fraction of the cost of a breach or investigation.

## Applicability Boundaries

**In scope:** Any system storing personal data about individuals — B2C products, SaaS platforms, healthcare, fintech
**Out of scope:** Internal systems with no user data; anonymized analytics pipelines with no linkage to individuals

## Rationale

Privacy compliance is not optional in jurisdictions with GDPR, CCPA, HIPAA, or equivalent regulations. These checks are concrete enough to be verified in a code review and specific enough to detect common violations.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
