# Naming Conventions
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any codebase with more than one contributor or expected lifespan > 3 months
**When this does NOT apply:** Single-use scripts, notebooks, or generated files
**Search patterns:** naming, variables, functions, classes, constants, enums, file naming, camelCase, snake_case, PascalCase
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Consistent naming reduces cognitive load when reading unfamiliar code. Conventions encode the type and intent of identifiers — a reader should know whether something is a class, constant, or private field without reading its definition.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| CODE-17 | Variables and functions follow language-idiomatic case convention | L2 | ESLint `camelcase` rule (JS/TS); Pylint `C0103` naming convention check | ESLint, Pylint |
| CODE-18 | Classes and interfaces use PascalCase; files match class name | L2 | ESLint `@typescript-eslint/naming-convention`; grep `class [a-z]` for violations | ESLint |
| CODE-19 | Constants and enum values use SCREAMING_SNAKE_CASE | L3 | ESLint `@typescript-eslint/naming-convention` for `const` enums; grep `const [A-Z][a-z]` for mixed-case consts | ESLint |
| CODE-20 | File and directory names follow a documented convention (kebab-case or snake_case) | L3 | CI script: `find src/ -name '*[A-Z]*'` flags PascalCase files in a kebab-case project | custom script |
| CODE-21 | No single-letter variables outside loop indices and math | L3 | ESLint `id-length` rule (min: 2); manual review | ESLint |
| CODE-22 | Boolean variables and functions use is/has/can/should prefix | L4 | ESLint custom rule or naming-convention config; grep `function [^(]*[^s]ed\b` for ambiguous booleans | ESLint |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Abbreviation overuse | `usr`, `cfg`, `mgr`, `hdlr` as identifier names | Reader must mentally expand every identifier |
| Mixed conventions | `getUserData` next to `get_user_data` in the same file | Convention becomes noise, not signal |
| Noun functions | `function userValidation()` instead of `validateUser()` | Intent unclear; harder to find in searches |
| Misleading names | `temp`, `data`, `obj`, `thing` as production identifiers | Forces reader to read full body to understand purpose |

## Why It Matters

Studies on code reading show developers spend 70%+ of reading time on names. Consistent conventions allow pattern-matching instead of deep reading, reducing review time and onboarding cost.

## Applicability Boundaries

**In scope:** All hand-written source code — variables, functions, classes, files, modules, enums
**Out of scope:** Third-party API field names, database column names owned by another system, generated protobuf/GraphQL identifiers

## Rationale

Naming conventions are the cheapest form of documentation — they're inline, always up-to-date, and machine-enforceable. Inconsistent naming is a tax paid on every future read.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
