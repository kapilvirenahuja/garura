# Data Quality Standards

Quality checks for data layers covering schema design, migration safety, and privacy compliance.

## Files

- [schema-design.md](schema-design.md) — Normalization, index strategy, constraint enforcement, naming conventions, soft delete patterns, and schema documentation | Patterns: schema design, normalization, indexes, constraints, NOT NULL, UNIQUE, foreign key, snake_case, soft delete
- [migrations-versioning.md](migrations-versioning.md) — Migration tooling, rollback safety, zero-downtime patterns, data migration separation, and migration testing | Patterns: migration, Flyway, Alembic, Prisma Migrate, rollback, zero-downtime, schema versioning, backfill
- [privacy-compliance.md](privacy-compliance.md) — GDPR compliance, PII classification, encryption, data masking, retention policies, consent, and right to erasure | Patterns: GDPR, privacy, PII, encryption at rest, data masking, consent, right to erasure, unencrypted email/phone/SSN
