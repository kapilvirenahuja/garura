# Rules

Canonical rules for every recipe-producing domain. Each file holds the single source of truth for "how must artifacts of this type look" or "what operational rules apply to this surface". Skills reference these files instead of inlining constraints in their own prose.

Agents and skills query this category when they need to know: **"What rules must this artifact or surface follow?"**

## Contents

### Artifact rules (product planning → design → architecture pipeline)

| Path | Description | Consumers |
|------|-------------|-----------|
| `epics.md` | Epic structure rules — vertical slice delivery, single module scope, mocks as phased delivery, scope boundaries (in_scope / anti_goals / must_not_break), success verifiability, dependency discipline (no cycles), foundation investments | `generate-intent-epics`, `validate-intent-epics`, `prepare-epic`, `feature-steward`, `tech-designer` |
| `features.md` | Intent-epic content rules — mandatory fields, quantification regex, placeholder detection, hypothesis format, KB traceability, problem-statement specificity | `generate-intent-epics`, `validate-intent-epics`, `feature-steward` |
| `product.md` | Product-planning rules — KB-grounded capability selection, constraint traceability, no silent inclusions / exclusions, security ratchet-up, provisional STM sourcing, quality profile aggregation, three-layer hierarchy | `configure-capabilities`, `enrich-capabilities`, `derive-quality-profile-from-epics`, `product-keeper` |
| `design.md` | Design-exp rules — JTBD personas, capability ↔ persona coverage, screen state minimums, flow ↔ scenario traceability, explicit wireframes (no generic descriptors), no visual-design language, WCAG per interactive screen, one-decision-per-pattern | `synthesize-personas`, `generate-screen-inventory`, `validate-screen-coverage`, `map-user-flows`, `generate-wireframes`, `compile-design-spec`, `designer` |
| `architecture.md` | Build-arch rules — decisions cite drivers (epics / quality attributes / constraints), technology-agnostic logical layer, source-type discipline, per-NFR delivery mechanism, ISO 25010 quality vision, design-patterns at system/layer/component/cross-cutting layers, failure-scenario coverage, security-ratchet-up | `derive-logical-architecture`, `derive-physical-architecture`, `derive-nfr-spec`, `derive-quality-vision`, `derive-design-patterns`, `validate-architecture-spec`, `tech-architect`, `tech-designer` |
| `scenarios.md` | Scenario content rules — given/when/then format, binary testable outcomes (no should/smooth/intuitive), success evidence required, failure impact and mitigation required, minimum count per epic, flow ↔ scenario reference | `generate-intent-epics`, `validate-intent-epics`, `map-user-flows`, `test-engineer` |

### Knowledge rules

| Path | Description | Consumers |
|------|-------------|-----------|
| `kb-extension.md` | KB domain-taxonomy file shape — the 9-section feature contract (4 prose: When It Matters, Depth Spectrum, Signals, Tradeoffs; 5 structured: Inclusion, Success Criteria, Failure Scenarios, Cross-Tree Refs, Experiential). Governs both LTM catalog and STM research files. | `validate-kb-extension`, `configure-capabilities`, `enrich-capabilities`, `knowledge-extractor` |
| `resolution.md` | R1-R4 LTM resolution protocol — LTM hierarchy enforcement, authority semantics (LOCKED / DRAFT), resolution trace schema, context isolation exemptions | `tech-designer`, `feature-steward`, `repo-orchestrator`, every agent that reads LTM |

### Operational rules (git and commits)

| Path | Description | Consumers |
|------|-------------|-----------|
| `commits.md` | Commit categorization (feat / fix / refactor / etc.), conventional-format quality rules, subject / body rules, scope validation, large-file thresholds, secret detection | `analyze-changes`, `analyze-pr`, `create-commit`, `commit-code`, `repo-orchestrator` |
| `git.md` | Branch naming conventions (feature/, fix/, hotfix/, etc.) and how branch patterns map to quality-gate priorities | `repo-orchestrator`, `setup-branch`, `start-feature-planning` |
| `pr.md` | PR severity taxonomy — deterministic mapping from quality standard IDs (SEC, ARCH, BE, CODE, FE, TEST, DOC, OPS, PERF, DATA, DEBT) to P1–P4 severity buckets with grep / path match rules. No LLM judgment. | `review-pr`, `quality-check-scoped`, `analyze-pr` |

## Deferred follow-ups

These rule files are named in issue #210 but are not yet authored. They should be created when the corresponding plays / skills are built or rebuilt:

- `roadmap.md` — rules for roadmap structure (buckets, bets, circuit breakers)
- `plan.md` — rules for execution plans (DAG, file-level changes, tests)

## When to Add Here

A file belongs in `rules/` if:
- It answers "how must this artifact / surface be structured?"
- It is enforced by at least one skill (validator, generator, orchestrator)
- It is the single source of truth for the domain — not a copy of skill prose

A file does NOT belong here if:
- It is an output template (those go in `templates/`)
- It is a YAML schema contract (those go in `schemas/`)
- It is resolvable from the code itself (those stay in the code)
