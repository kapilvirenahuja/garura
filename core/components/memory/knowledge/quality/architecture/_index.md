# Architecture Quality Standards

Structural quality checks for codebase organization, dependency hygiene, and API design. These checks assess whether the project uses sound architectural patterns correctly — not which patterns to choose (see `knowledge/architecture/` for selection guidance).

## Files

- [separation-of-concerns.md](separation-of-concerns.md) — Layer violation and coupling detection | Patterns: layer violation, circular dependency, god class, import graph
- [dependency-management.md](dependency-management.md) — Dependency security, currency, and compliance | Patterns: npm audit, lock file, CVE, license, outdated dependencies
- [api-design-scalability.md](api-design-scalability.md) — REST conventions, versioning, and scaling posture | Patterns: REST, versioning, pagination, rate limiting, error response
