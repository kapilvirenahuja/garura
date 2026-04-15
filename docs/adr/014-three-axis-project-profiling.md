# ADR 014: Three-Axis Project Profiling Model

## Status

Accepted

## Date

2026-03-25

## Context

Meridian previously had Product Profile (PP) and Non-Functional Requirements (NFR) definitions as knowledge-only documents — reference material stored in LTM but not wired into any play workflow. Agents could consult them, but no play stage explicitly derived, stored, or propagated profile values through the pipeline.

This created two problems:

1. **No quality measurement baseline.** Without a structured quality profile, there was no way to define what "good enough" engineering looks like for a given project, and therefore no way to measure technical debt as a gap against a target.

2. **No cascade from product character to engineering standards.** A BFSI product and a hackathon prototype have fundamentally different quality requirements, but nothing in the system connected product identity to engineering expectations.

The profiles existed as passive knowledge. What was missing was an active model that derives profiles during discovery, stores them in the product definition, and propagates them through the pipeline so downstream plays make profile-informed decisions.

## Decision

### Three-axis model with sequential cascade

Projects are characterized along three complementary axes, derived in sequence:

1. **Product Profile (PP)** — 7 dimensions characterizing *what* the product is: users, UX maturity, personas, geographic scope, integration density, delivery ambition, industry vertical. Derived first from the BRD/PRD.

2. **NFR Profile** — 7+ dimensions characterizing *how robust* the product needs to be: risk tolerance, security depth, performance targets, availability, compliance, scalability, data sensitivity. Defaults informed by PP values (e.g., BFSI industry → high security and compliance).

3. **Quality Profile (QP)** — 7 dimensions characterizing *what engineering quality practices* the product requires: testing depth, code quality standards, documentation level, CI/CD maturity, observability, accessibility, security testing. Defaults informed by PP + NFR values.

The cascade is sequential: **PP → NFR → QP**. Each subsequent profile starts with informed defaults derived from the profiles before it, not blank slates. The agent derives initial values, presents them to the user, and the user adjusts.

### All three profiles derived in discover-product

The `discover-product` play derives all three profiles as part of product discovery. Profiles are stored in `product.yaml` alongside the product vision, strategic goals, and market positioning. This co-locates the product's identity with its technical character.

### Quality Profile as technical debt reference

The Quality Profile establishes the **target quality baseline** for the project. Technical debt is defined as the measurable gap between QP targets and actual implementation state. For example, if QP-1 (Testing Depth) is Level 3 (layered testing, 60-80% coverage) but the codebase has only unit tests at 40% coverage, that gap is quantifiable debt.

### Pipeline propagation

Profiles flow through the play pipeline:

```
discover-product    → derives PP, NFR, QP → writes to product.yaml
plan-roadmap        → reads profiles       → uses for epic depth and phasing reasoning
prepare-architecture → reads profiles      → selects technology stack and quality standards
prepare-epic → reads locked architecture → implements within architecture constraints
```

## Consequences

### Positive

- **discover-product now produces profiles alongside vision** — a single play establishes both product identity and engineering character, ensuring they are always co-derived and consistent
- **plan-roadmap uses profiles for epic depth reasoning** — epic phasing and scope decisions are informed by the project's actual character rather than generic defaults
- **prepare-architecture reads profiles for technology and quality standard selection** — architecture decisions (framework choices, testing frameworks, observability stack) are grounded in the project's profile
- **prepare-epic reads locked architecture** — implementation works within architecture constraints rather than re-deriving them, ensuring consistency across epics
- **Technical debt is measurable** — the gap between QP target levels and implementation state provides a concrete, numeric debt measurement
- **Pipeline is now clearly sequenced** — discover → roadmap → architecture → implementation, with each stage reading from the previous stage's locked output

### Negative

- **discover-product is heavier** — it now produces three profiles in addition to vision and market analysis, increasing the play's scope and agent calls
- **Profile lock creates rigidity** — once profiles are locked in product.yaml, changing them requires re-running discover-product, which may cascade changes through downstream artifacts
- **Cascade coupling** — QP depends on NFR depends on PP. A change to a PP dimension may ripple through all three profiles

### Mitigations

- Profiles are "knobs, not questions" — the agent derives values automatically and the user only adjusts what's wrong, keeping the interaction lightweight despite three profiles
- Each profile dimension is independently adjustable — changing one PP dimension doesn't force re-derivation of all NFR and QP values, only the ones with explicit guidance mappings
- Profile dimensions are extensible — new dimensions can be added to any axis without breaking existing ones

## Alternatives Considered

### Profiles in a separate file

Store profiles in a dedicated `profiles.yaml` rather than inside `product.yaml`. Rejected because co-location is simpler — profiles are a property of the product, not a separate artifact. A separate file would require cross-referencing and risk staleness if one file is updated without the other.

### Quality Profile derived in plan-roadmap

Derive QP during roadmap planning rather than during discovery. Rejected because the Quality Profile derives from PP + NFR, both of which are fully known at discovery time. Deferring QP to plan-roadmap would mean roadmap planning starts without quality context, and the QP derivation would be orphaned from the PP/NFR derivation that informs it.

### All architecture decisions in prepare-epic

Keep architecture selection (tech stack, quality standards) inside prepare-epic rather than creating a separate prepare-architecture play. Rejected because architecture is product-scoped, not epic-scoped. An architecture chosen per-epic would risk inconsistency across epics. A single prepare-architecture step after roadmap ensures all epics share a coherent architecture.

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md) — Play → Agent → Skill hierarchy that these profiles flow through
- [ADR 011: STM as Inter-Skill Data Transport](./011-stm-as-inter-skill-data-transport.md) — STM mechanism used to transport profile data between play stages
