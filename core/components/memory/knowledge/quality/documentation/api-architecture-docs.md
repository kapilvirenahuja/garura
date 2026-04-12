# API and Architecture Documentation
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a project's API contracts and architectural decisions are formally documented
**When this does NOT apply:** Internal tooling or scripts not consumed by other teams or systems
**Search patterns:** OpenAPI, Swagger, ADR, architecture diagram, C4, deployment docs, API changelog, API spec
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses the presence and completeness of technical documentation that enables teams to understand, consume, and evolve APIs and system architecture without relying on tribal knowledge.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DOC-01 | README exists at repo root | L2 | `test -f README.md` | Glob |
| DOC-02 | OpenAPI or Swagger spec file is present | L3 | Glob for `openapi.yaml`, `swagger.json`, `*.oas.yaml` | Glob |
| DOC-03 | OpenAPI spec covers all public endpoints (not just a subset) | L4 | Compare spec paths to actual route definitions | Grep + manual diff |
| DOC-04 | At least one Architecture Decision Record (ADR) exists | L3 | Glob for `docs/adr/`, `docs/decisions/`, or `*.adr.md` | Glob |
| DOC-05 | ADRs cover major technology choices (framework, DB, auth strategy) | L4 | Check ADR count and titles against known architectural choices | Read ADR index |
| DOC-06 | System architecture diagram exists (C4 context or container level) | L4 | Glob for `docs/architecture/`, `.drawio`, `.mmd`, `.puml` | Glob |
| DOC-07 | Deployment documentation describes environments and deployment process | L4 | Check for deployment guide in docs/ or README | Read docs |
| DOC-08 | API changelog or version history documents breaking and non-breaking changes | L5 | Check for `CHANGELOG.md` or API-specific changelog | Glob |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| README as only doc | All API and architecture knowledge lives in the README | New team members can't onboard; API consumers can't integrate |
| Stale OpenAPI spec | Spec committed once and never updated as routes change | Consumers trust wrong contracts |
| ADRs without rationale | Decision recorded but "why" omitted — just records what was chosen | Future teams can't evaluate whether the constraint still applies |
| Architecture diagram without date | Diagram exists but no indication of when it was last verified | May describe a system that no longer exists |

## Why It Matters

API consumers need contracts to build against. Undocumented APIs require reading source code to understand behavior. Undocumented architecture decisions get revisited repeatedly, wasting time and sometimes reversing correct decisions because the original reasoning was lost.

## Applicability Boundaries

**In scope:** Projects with external or inter-service APIs; any project with multiple contributors or that outlasts the founding team
**Out of scope:** Throwaway scripts, personal utilities, single-use migration tools

## Rationale

Documentation debt is invisible until someone needs it. API documentation and ADRs are the two highest-leverage forms: one serves consumers, the other preserves institutional memory. Both are assessable by file presence and basic completeness review.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
