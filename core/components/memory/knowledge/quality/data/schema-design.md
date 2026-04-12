# Data Schema Design
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing relational or document database schema design for correctness, performance, and maintainability
**When this does NOT apply:** Key-value stores with no schema, raw file storage, or event streams without a fixed schema
**Search patterns:** schema design, normalization, indexes, covering index, composite index, constraints, NOT NULL, UNIQUE, foreign key, naming conventions, snake_case, soft delete, hard delete, schema documentation
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Covers the structural quality of database schemas — normalization level, index strategy, constraint enforcement, naming consistency, and deletion patterns. Universal check.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DATA-01 | Schema is normalized to 3NF for transactional data — no obvious update anomalies | L3 | Review tables for repeated data groups or transitive dependencies | Manual review |
| DATA-02 | Indexes exist on all foreign keys and high-cardinality columns used in WHERE / JOIN clauses | L3 | Query `pg_indexes` or equivalent; cross-reference with slow query log | pg_indexes, EXPLAIN |
| DATA-03 | Composite indexes ordered by selectivity — most selective column first | L4 | Review multi-column index definitions against actual query patterns | Manual review, EXPLAIN |
| DATA-04 | NOT NULL constraints applied to required fields — nullable columns have documented intent | L2 | Inspect schema DDL for nullable columns on fields that are always present | Schema DDL, Manual review |
| DATA-05 | Foreign key constraints enforced at the database level — not only in application code | L3 | Inspect schema DDL for explicit `REFERENCES` / `FOREIGN KEY` clauses | Schema DDL |
| DATA-06 | Consistent naming convention enforced: `snake_case` for columns/tables, singular table names | L2 | grep schema migrations for camelCase columns or inconsistent table names | grep, schema linter |
| DATA-07 | Soft delete pattern documented and indexed — `deleted_at` column indexed; queries filter it consistently | L3 | Check tables using `deleted_at`; verify index exists; grep queries for missing `WHERE deleted_at IS NULL` | grep, Schema review |
| DATA-08 | Schema documented — tables and non-obvious columns have comments or a data dictionary | L4 | Check for `COMMENT ON TABLE` / `COMMENT ON COLUMN` or external data dictionary | Schema DDL, Confluence/Notion |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| JSON columns for queryable data | Storing structured, queryable attributes in a JSON blob to avoid schema changes | Index-hostile, validation-free, migration pain |
| Missing FK constraints | Referential integrity enforced only in application code | Orphaned records, data inconsistency after bugs |
| Nullable everything | All columns nullable "just in case" | Application code littered with null checks; data quality degrades |
| Soft delete without index | `deleted_at TIMESTAMP NULL` with no index | Every active-record query does a full table scan |
| Inconsistent casing | Mix of `camelCase`, `PascalCase`, `snake_case` in same schema | ORM mapping bugs, confusing joins, query errors |

## Why It Matters

Schema design decisions are among the most expensive to reverse. A missing index or absent FK constraint found in production requires a coordinated migration. Getting these right at design time costs minutes; fixing them costs hours.

## Applicability Boundaries

**In scope:** Relational databases (PostgreSQL, MySQL, SQLite, SQL Server); MongoDB document schemas with defined structure
**Out of scope:** Schemaless key-value stores, event streams, analytics columnar stores (different optimization rules)

## Rationale

Schema quality is foundational — it determines query performance, data integrity, and the cost of future migrations. These checks are reviewable at design time with no instrumentation required.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
