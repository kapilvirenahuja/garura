# Data Migrations and Schema Versioning
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing database migration practices, tooling, and rollback safety
**When this does NOT apply:** Applications with no persistent schema (stateless services, pure file storage)
**Search patterns:** migration, Flyway, Alembic, Prisma Migrate, Knex, rollback, zero-downtime migration, schema versioning, data migration, migration testing, up migration, down migration
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers migration tooling presence, rollback safety, zero-downtime patterns, and the separation of schema changes from data backfills. Universal check.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DATA-09 | A migration tool is in use and all schema changes go through it — no ad-hoc DDL in production | L2 | Check for Flyway, Alembic, Prisma Migrate, Knex, Liquibase, or equivalent; verify no manual `ALTER TABLE` in runbooks | Manual review, CI config |
| DATA-10 | Every `up` migration has a corresponding `down` migration that is tested | L3 | Inspect migration files for `down` / `rollback` implementations; check if they are tested in CI | Migration files, CI |
| DATA-11 | Migrations are sequential and conflict-free — no two branches create migrations with the same version number | L3 | Check for timestamp or sequential numbering strategy; verify CI detects conflicts | CI lint, migration tool |
| DATA-12 | Zero-downtime migration patterns used for large-table changes: expand-contract, column addition before removal | L4 | Review migrations adding/removing columns on tables > 1M rows for locking risk | Manual review |
| DATA-13 | Data migrations (backfills) separated from schema migrations — not combined in a single migration file | L3 | Review migration files for large UPDATE/INSERT statements mixed with DDL | Manual review |
| DATA-14 | Backfill migrations are batched — no single UPDATE affecting all rows of a large table at once | L4 | grep migration files for `UPDATE ... SET` without a `WHERE` clause limiting batch size | grep |
| DATA-15 | Migration history table present and committed to version control | L2 | Verify migration files are in the repo; check for `schema_migrations` or equivalent table | git log, Manual review |
| DATA-16 | Migrations are tested against a real database in CI — not skipped | L3 | Check CI pipeline for a migration run step before integration tests | CI config |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| No rollback migrations | `up` implemented but `down` is empty or throws NotImplemented | Cannot roll back a bad deploy without manual DDL |
| Rename column in one migration | `ALTER TABLE RENAME COLUMN old TO new` deployed while old column still referenced in code | Application errors until full deployment completes |
| Full-table UPDATE in a migration | `UPDATE orders SET status = 'active' WHERE status IS NULL` on 50M rows with no batch | Lock escalation, multi-hour migration, outage |
| Ad-hoc DDL outside migration tool | Schema changes applied directly to production DB without a migration file | Schema drift, irreproducible environments |
| Combined schema + data migration | DDL `ALTER TABLE` and a large data backfill in a single transaction | Long-running transaction, lock timeout |

## Why It Matters

Migration failures are the most common cause of deploy rollbacks. An untested `down` migration discovered during an incident is worse than no `down` migration — it creates false confidence. Zero-downtime patterns matter as soon as the application has SLAs.

## Applicability Boundaries

**In scope:** Any application with a relational or document database that has evolving schema
**Out of scope:** Event-sourced systems where schema evolution uses schema registry versioning (different patterns apply)

## Rationale

Migration discipline is what separates a team that can deploy confidently from one that needs maintenance windows. These checks are verifiable from migration files alone.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
