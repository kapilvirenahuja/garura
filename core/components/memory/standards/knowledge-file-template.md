# Knowledge File Template

This is the canonical template for all knowledge files written by the
`learn` recipe. Existing files are grandfathered. New files must conform
from day one.

Two tiers of metadata exist:
- **Tier 1** — Required for ALL knowledge files (project-scoped and core-scoped)
- **Tier 2** — Additionally required for CORE-SCOPED files only

## Tier 1 Template (Required for All Files)

```markdown
# {Title}
<!-- knowledge-file: tier=1 scope=project|core -->

**When this applies:** {one-line trigger condition — when should an agent use this?}
**When this does NOT apply:** {one-line exclusion condition — when should this be ignored?}
**Search patterns:** {comma-separated keywords agents match against domain topics}
**Provenance:** {issue number or work context that produced this knowledge}
**Created:** {YYYY-MM-DD}

## Content

{The knowledge itself — decisions made, patterns, standards, conventions.
Written at the level of a concise decision record, not a tutorial.}

## Why It Matters

{The rationale — what goes wrong if an agent does not have this knowledge
and relies on general reasoning instead?}
```

## Tier 2 Extension (Additionally Required for Core-Scoped Files)

Append these sections after "Why It Matters" for core-scoped files:

```markdown
## Applicability Boundaries

**In scope:** {conditions under which this knowledge applies}
**Out of scope:** {conditions where this knowledge must NOT be used}

## Rationale

{Why this is organizational knowledge rather than project-specific convention.
What makes it reusable across projects?}

## Decay Tracking

**Last validated:** {YYYY-MM-DD}
**Confidence:** high | medium | low
**Staleness window:** {e.g., 90 days, 180 days}
**Supersedes:** {path to prior file, or null}
```

## Staleness Rule

A core-scoped file is flagged stale when:
`(current_date - last_validated) > staleness_window`

Staleness appears as a warning in resolution traces when the file is used
as a source. Stale files are NOT auto-rejected — they remain advisory.
Operators see the staleness flag and can decide to re-validate or replace.

## Index Registration

Every new knowledge file MUST have an entry in the appropriate category
index. Index file location: `{scope_base}/{category}/_index.md`

Index entry format:
```markdown
- [{Title}]({filename}) — {one-line summary} | Patterns: {search patterns}
```

## Validation Checklist

Before a file is considered complete:

Tier 1 checks (all files):
- [ ] Title is present and non-empty
- [ ] scope annotation is set (project or core)
- [ ] When this applies is present
- [ ] When this does NOT apply is present
- [ ] Search patterns field has at least 2 patterns
- [ ] Provenance references an issue or work context
- [ ] Created date is present
- [ ] Content section is non-empty
- [ ] Why It Matters section is present

Tier 2 checks (core-scoped files only):
- [ ] Applicability Boundaries section present with both In scope and Out of scope
- [ ] Rationale section explains cross-project applicability
- [ ] Decay Tracking section present with all four fields

Index checks:
- [ ] Entry added to appropriate _index.md

## Pattern Knowledge Variant

When the knowledge being captured is a **reusable pattern** (decision guidance for future agent reasoning), use this enhanced structure instead of the generic template above. This matches the structure used by existing architecture knowledge files.

### Pattern Template

```markdown
# {Pattern Name}

{One-line description of what this pattern enables}

**Search patterns:** {comma-separated keywords for agent discovery}

## When to Choose

{Conditions and signals indicating this pattern is the right approach. Be specific — name project characteristics, scale ranges, team contexts, and technical signals that point toward this pattern.}

## When to Avoid

{Conditions where this pattern is wrong, premature, or counterproductive. Include common situations where it seems right but isn't.}

## Scale Profile (optional)

| Dimension | Range |
|-----------|-------|
| {relevant dimension} | {appropriate range} |

## Key Components

{The essential building blocks of the pattern. What you must have for it to work. List each component with a brief description of its role.}

## Reference Implementation (optional)

{A concrete example of the pattern applied, with enough detail to understand the shape but not so much that it becomes a tutorial.}

## Evolution Paths

| From | To | When |
|------|----|------|
| {simpler approach} | {this pattern} | {trigger for adoption} |
| {this pattern} | {more complex approach} | {trigger for evolution} |

## Tradeoffs

| Gain | Cost |
|------|------|
| {what you get} | {what it costs} |

## Anti-Patterns

{Common mistakes when applying this pattern. What looks right but breaks under pressure.}

## Metadata

| Field | Value |
|-------|-------|
| scope | {universal / platform-specific / framework-specific} |
| confidence | {high / medium / low} |
| captured | {YYYY-MM-DD} |
| last_validated | {YYYY-MM-DD} |
| supersedes | {path or "none"} |
| tags | {comma-separated} |
```

### When to Use Pattern vs Generic Template

| Signal | Use Pattern Template | Use Generic Template |
|--------|---------------------|---------------------|
| Answers "should we choose X?" | Yes | No |
| Has tradeoffs between approaches | Yes | No |
| Describes a workflow or standard | No | Yes |
| Documents a convention or rule | No | Yes |
| Synthesized from multiple decisions | Yes | No |
| Records a single fact or definition | No | Yes |
