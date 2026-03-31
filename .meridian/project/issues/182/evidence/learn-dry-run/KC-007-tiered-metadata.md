# Two-Tier Metadata for Knowledge Files
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Authoring new knowledge files, validating existing knowledge files, or implementing agents that read and interpret knowledge file metadata.
**When this does NOT apply:** Ephemeral notes, STM files, or any artifact not intended for LTM promotion.
**Search patterns:** knowledge file metadata, tier 1, tier 2, metadata template, scope annotation, decay tracking, knowledge file format
**Provenance:** Issue #182 — learn recipe dry run
**Created:** 2026-03-31

## Content

Knowledge files use a two-tier metadata structure. Tiers are additive — Tier 2 extends Tier 1, it does not replace it.

**Tier 1 (required for ALL knowledge files — both project and core):**
- `Title` — human-readable, used in index entries
- `scope annotation` — `tier=1 scope=project` or `tier=2 scope=core` in the HTML comment
- `When this applies` — one-line trigger condition for when an agent should load this file
- `When this does NOT apply` — one-line exclusion to prevent over-loading
- `Search patterns` — comma-separated keywords used for keyword-based discovery
- `Provenance` — issue number or work context that produced this knowledge
- `Created` date
- `Content` section — the actual knowledge
- `Why It Matters` section — consequence of ignoring

**Tier 2 (additionally required for core-scoped files):**
- `Applicability Boundaries` — explicit `In scope` / `Out of scope` conditions enabling cross-project applicability assessment
- `Rationale` — why this is organizational/universal knowledge rather than project-specific
- `Decay Tracking` — `Last validated`, `Confidence`, `Staleness window`, `Supersedes`

**Why the split:** Project-scoped files describe decisions that are stable as long as the project continues. They do not decay in the same way. Core-scoped files describe patterns applicable across projects — they can become stale as tools, frameworks, and practices evolve. The Tier 2 additions exist specifically to manage that cross-project lifecycle risk.

**Validation:** Before a file is promoted to LTM, all required fields for its tier must be present and non-empty. A file missing Tier 2 fields but annotated as `scope=core` fails validation.

## Why It Matters

Flat metadata (all files have the same fields) either over-burdens project files with decay tracking they don't need, or under-serves core files by omitting applicability reasoning that future readers need. The tiered approach matches metadata requirements to file purpose: project files are lightweight to author; core files carry the extra metadata that makes them safely reusable without the original author being present.

## Applicability Boundaries

**In scope:** File-based knowledge systems with both project-specific and cross-project content, where files are authored incrementally over time and consumed by automated agents.
**Out of scope:** Database-backed knowledge systems where metadata is stored separately from content; wiki systems where human readers are the primary consumers.

## Rationale

Tiered metadata is a common pattern in configuration and documentation systems (e.g., required vs optional fields in OpenAPI schemas, required vs extended attributes in CMDB records). Its application to knowledge files addresses a real tension: project files should be easy to author; core files must be rigorous enough to use across contexts. The same principle applies anywhere you have artifacts with different reuse scopes.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
