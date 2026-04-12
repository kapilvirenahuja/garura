# Separation of Concerns
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a codebase respects layer boundaries and single responsibility
**When this does NOT apply:** Proof-of-concept or throwaway scripts where coupling is intentional
**Search patterns:** layer violation, circular dependency, god class, single responsibility, import graph, cohesion, coupling
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project separates responsibilities across modules, layers, and packages — so changes in one area don't cascade unexpectedly into others.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| ARCH-01 | UI layer does not import database/persistence code directly | All | Grep import paths in UI files for DB client names | Grep, manual review |
| ARCH-02 | No circular dependencies between modules | All | Run dependency analysis tool | `madge` (JS), `pydep` (Python), `deptrac` (PHP) |
| ARCH-03 | No file exceeds 500 lines with mixed concerns | All | Count lines; verify single purpose per file | `wc -l`, manual review |
| ARCH-04 | Business logic is not embedded in route handlers or controllers | All | Check if handler files contain DB queries or domain rules | Grep, code review |
| ARCH-05 | Service layer exists and mediates between API and data layers | All | Verify directory structure has services/ or domain/ layer | `ls`, Glob |
| ARCH-06 | Test files do not import production infrastructure (DB, queue) directly | All | Check test imports for DB client or broker constructors | Grep test files |
| ARCH-07 | Config/env values are not hardcoded inside business logic | All | Grep for hardcoded URLs, ports, credentials in non-config files | Grep |
| ARCH-08 | Package/module boundaries match functional boundaries | All | Compare directory structure to stated architecture layers | Manual review |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Spaghetti imports | UI → DB → API → UI circular chains | Any change breaks unpredictably |
| Fat controller | Route handler contains business logic, DB queries, and formatting | Untestable, uncacheable, unmaintainable |
| Shared mutable globals | Global state accessed across layers without interfaces | Race conditions, hidden coupling |
| Layer skipping | Presentation calls persistence directly, bypassing domain | Domain rules not enforced consistently |

## Why It Matters

Violations compound over time. A single layer skip becomes a pattern. A pattern becomes the architecture. Identifying violations early, when they're confined to a module, is exponentially cheaper than untangling them later.

## Applicability Boundaries

**In scope:** Any codebase with more than one logical layer (API, service, persistence, UI)
**Out of scope:** Single-file scripts, glue code, pure data-transformation pipelines with no layers

## Rationale

Separation of concerns is the most frequently violated structural property in growing codebases. It is observable from file structure and imports alone — no runtime required. This makes it an ideal static quality signal.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
