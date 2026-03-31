# Project vs Core Knowledge Classification
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any agent or human author classifying a knowledge candidate as project-scoped or core-scoped before writing it to LTM.
**When this does NOT apply:** Files that are explicitly internal ephemeral notes (STM); files that have already been classified and promoted.
**Search patterns:** scope classification, project scoped, core scoped, knowledge classification, scope reasoning, LTM scope
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

Classification rules — a file is **project-scoped** if it contains any of:
- A project name, product name, or service name specific to this organization
- Domain model concepts specific to this project (e.g., "Meridian recipe", "Phoenix brief")
- File paths or directory structures specific to this codebase
- Decisions made to resolve a project-specific constraint (e.g., "we chose Postgres because of our existing infra")
- Conventions that exist because of a project team preference with no cross-project rationale

A file is **core-scoped** if it describes:
- Technology or framework patterns applicable to any project using that technology
- Software engineering principles that hold regardless of project (SOLID, DRY, fail-fast)
- Personal or organizational conventions that should apply to all future work (naming conventions, commit style, review practices)
- Patterns discovered in this project that have been deliberately abstracted away from project specifics

**Mandatory classification reasoning:** The classifying agent must produce a one-sentence rationale:
- "Classified project: references Meridian-specific recipe structure."
- "Classified core: describes optional field pattern applicable to any multi-caller API."

**When in doubt, project:** Promoting something as core exposes it to all future projects. A mistakenly core-classified file can contaminate other projects with irrelevant constraints. Mistakenly project-classified files are contained and easily corrected.

**Reclassification:** A file can be reclassified from project to core by the learn recipe in a future cycle, once the pattern has proven stable and has been deliberately abstracted. The inverse (core to project) requires deleting the core file and creating a project-scoped replacement.

## Why It Matters

Misclassification has asymmetric consequences. A core-scoped file applied incorrectly to a future project can override correct project-specific decisions with wrong ones. An over-scoped project file is merely unused. The "when in doubt, project" default contains the downside while allowing reclassification once the pattern is validated across contexts.

## Applicability Boundaries

**In scope:** Any multi-project knowledge system where some knowledge is reusable and some is project-specific, and where automated agents consume knowledge files without distinguishing source.
**Out of scope:** Single-project repositories where all knowledge is by definition project-specific; fully flat knowledge stores with no scoping concept.

## Rationale

The project/core distinction mirrors the general principle of context-bounded knowledge. In software, this appears as "local configuration vs global defaults," "feature flags vs architecture decisions," and "project README vs engineering handbook." The classification discipline — explicit reasoning, conservative defaults — is transferable to any organizational knowledge system.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
