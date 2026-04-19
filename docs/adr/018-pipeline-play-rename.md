# ADR 018 — Core Pipeline Play Rename to Short Invocation Names

## Status

Accepted

## Date

2026-04-19

## Context

The six core pipeline plays were named with verbose, hyphenated identifiers inherited from early development:

| Old Name | Description |
|----------|-------------|
| `specify-product` | Product specification pipeline |
| `design-exp` | Experience design pipeline |
| `build-arch` | Architecture derivation pipeline |
| `prepare-epic` | Epic preparation pipeline |
| `implement-epic` | Epic implementation pipeline |
| `validate-epic` | Epic validation pipeline |

These names caused friction at the invocation layer:

1. **Typing overhead.** Developers invoke plays daily with `/specify-product`, `/design-exp`, etc. The verbosity slows invocation and increases typo risk.
2. **Inconsistency with short plays.** Utility plays (`ship`, `fix-it`, `enhance`) use short names. The pipeline plays were outliers.
3. **Redundant suffixes.** `-product` in `specify-product` and `-exp` in `design-exp` carry no disambiguation value — there is only one specify play and one design play.
4. **Confusing `-epic` suffix.** `prepare-epic`, `implement-epic`, and `validate-epic` were named after their relationship to epics, but the `-epic` suffix implies they are epic-scoped objects rather than plays.

## Decision

Rename all six core pipeline plays to short, bare invocation names. The `name:` frontmatter field uses the `garura:` prefix; all other references (paths, invocation examples, narrative) use the bare short name.

| Old Name | New Directory | New `name:` Field |
|----------|--------------|-------------------|
| `specify-product` | `specify/` | `garura:specify` |
| `design-exp` | `design/` | `garura:design` |
| `build-arch` | `arch/` | `garura:arch` |
| `prepare-epic` | `prepare/` | `garura:prepare` |
| `implement-epic` | `implement/` | `garura:implement` |
| `validate-epic` | `validate/` | `garura:validate` |

Git history is preserved via `git mv` (not copy-and-delete).

All cross-references in SKILL.md files, intent.yaml files, evals.yaml files, skill files, agent files, memory standards, grounding, and documentation are updated in the same atomic change.

## Consequences

### Positive

- Invocation is simpler: `/specify`, `/design`, `/arch`, `/prepare`, `/implement`, `/validate`.
- Consistent with short utility plays (`ship`, `fix-it`, `enhance`, `distill`).
- Pipeline sequence is cleaner to read: `specify → design → arch → prepare → implement → validate`.
- Removes the ambiguous `-epic` suffix from three plays.

### Negative

- One-time migration cost to update all cross-references (~130 files).
- In-flight epics referencing old evidence paths would be broken (mitigated: no in-flight epics existed at migration time, verified by pre-flight check).
- External documentation or bookmarks using old names require manual update.

### Neutral

- `garura:` prefix in `name:` field is unchanged — the prefixing convention (ADR 006) is unaffected.
- Checkpoint and status file paths change (`_status/prepare-epic.json` → `_status/prepare.json`). Any interrupted plays would need to be restarted.

## Alternatives Considered

| Option | Reason Rejected |
|--------|-----------------|
| Keep old names | Continued typing overhead; inconsistency with utility plays |
| Rename only the `-epic` trio | Partial fix; `specify-product` and `design-exp` would remain inconsistent |
| Add aliases without renaming | Complexity without removing old names; two paths to same play |
