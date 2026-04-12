# Complexity and Structure Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any production codebase subject to ongoing maintenance
**When this does NOT apply:** Proof-of-concept code or isolated scripts not entering the main codebase
**Search patterns:** cyclomatic complexity, function length, class size, nesting depth, SOLID, SonarQube, cognitive complexity
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Structural complexity is the primary driver of defect density and maintenance cost. High cyclomatic complexity, deep nesting, and oversized classes are leading indicators that code will be hard to test, hard to change, and prone to bugs.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| CODE-09 | Cyclomatic complexity per function ≤ 10 | L2 | Run `lizard` / `radon cc` / SonarQube; count functions exceeding threshold | lizard, radon, SonarQube |
| CODE-10 | Function length ≤ 50 lines (excluding blank lines and comments) | L2 | `wc -l` per function via `lizard --CCN`; flag outliers | lizard |
| CODE-11 | Nesting depth ≤ 4 levels in any function | L3 | ESLint `max-depth` rule set to 4; SonarQube cognitive complexity | ESLint, SonarQube |
| CODE-12 | Class/module size ≤ 300 lines | L3 | `wc -l` per file; CI script flags files above threshold | custom script |
| CODE-13 | Single Responsibility: each class/module has one clear purpose | L3 | Manual review gate in PR template; SonarQube class coupling metric | SonarQube |
| CODE-14 | No circular dependencies between modules | L4 | `madge --circular src/` (JS/TS); `import-cycles` (Go) exits 0 | madge, import-cycles |
| CODE-15 | Cognitive complexity per function ≤ 15 (SonarQube metric) | L4 | SonarQube quality gate: cognitive complexity threshold enforced | SonarQube |
| CODE-16 | SonarQube quality gate blocks merge on complexity regression | L5 | SonarQube project quality gate configured; CI step fails on gate failure | SonarQube |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| God class | Single class with 1000+ lines handling multiple concerns | Impossible to test; changes ripple everywhere |
| Arrow code | 5+ levels of nested if/else/for | Cognitive overload; impossible to follow control flow |
| Function flag arguments | Boolean parameter controls two divergent behaviors | Hidden complexity; violates SRP; untestable branches |
| Deep inheritance chains | 5+ levels of class inheritance | Fragile base class problem; changes break subclasses |

## Why It Matters

Every 1-unit increase in cyclomatic complexity corresponds to approximately 1 additional test case needed for full branch coverage. High complexity compounds — a 20-complexity function with 3 callers creates exponential test burden.

## Applicability Boundaries

**In scope:** All hand-written production code in service, library, and application layers
**Out of scope:** Generated code (GraphQL resolvers, ORM migrations), data transformation pipelines with inherently linear logic

## Rationale

Complexity limits encode hard-won engineering experience. Teams that skip them pay the debt in defects and slow delivery 6-18 months later.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
