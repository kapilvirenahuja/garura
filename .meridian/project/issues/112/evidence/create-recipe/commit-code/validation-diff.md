# commit-code Validation Diff

Generated: 2026-03-23

Comparison of OLD hand-authored evals (from existing SKILL.md) vs NEW generated evals (from constraint classification + evals-creator logic).

## Old Evals (Baseline)

```
SE-1 (F1): Each change group contains only files sharing the same concern. No group mixes unrelated file sets.
SE-4 (F3): Every file from git status appears in at least one change group. No file silently dropped.
SE-6 (F4): Each mapped issue is semantically related to its change group. Reasoning substantiates the connection.
SE-7 (F5): Mapping conflicts (multiple competing issues for a group) are explicitly flagged, not silently resolved.
SE-8 (F6): Every mapping includes a confidence level. Mappings below high confidence are identifiable for approval gating.
SE-2 (F1): Each commit stages only files from a single change group. No cross-group contamination.
SE-3 (F2): Each commit message subject describes the specific change, not a generic issue reference.
SE-5 (F3): After all commits, no previously changed files remain uncommitted without a stated exclusion reason.
C7: Local HEAD matches remote HEAD after push.

SCE-1 (S1): Each commit has a conventional type, meaningful scope, and descriptive subject.
SCE-2 (S1): Every commit contains a traceable issue reference to an existing issue.
SCE-3 (S1): Each commit contains only files related to a single concern.
SCE-4 (S2): Commits can be filtered by issue number for per-issue progress reporting.
SCE-5 (S2): All commits consistently follow conventional format.
```

**Old total: 9 step evals (SE-1..SE-8 + C7) + 5 scenario evals (SCE-1..SCE-5) = 14**

## New Evals (Generated)

**Step evals from failure conditions (unchanged):**
- SE-1 (F1): Each change group contains only files sharing the same concern. **RETAINED**
- SE-2 (F1): Each commit stages only files from a single change group. **RETAINED**
- SE-3 (F2): Each commit message subject describes the specific change. **RETAINED**
- SE-4 (F3): Every file from git status appears in at least one change group. **RETAINED**
- SE-5 (F3): After all commits, no previously changed files remain uncommitted. **RETAINED**
- SE-6 (F4): Each mapped issue is semantically related to its change group. **RETAINED**
- SE-7 (F5): Mapping conflicts explicitly flagged, not silently resolved. **RETAINED**
- SE-8 (F6): Every mapping includes a confidence level. **RETAINED**

**Step evals from artifact-verifiable constraints (NEW):**
- SE-9 (C3): Every commit references an existing issue. **ADDED**
- SE-10 (C5): Commit messages follow conventional commit format. **ADDED**
- SE-11 (C6): Commit messages include the linked issue number. **ADDED**
- SE-12 (C7): Branch pushed after commits; push failure non-blocking. **PROMOTED** (was standalone "C7" eval, now formally numbered as SE-12)

**Scenario evals (unchanged):**
- SCE-1 (S1): Conventional type, meaningful scope, descriptive subject. **RETAINED**
- SCE-2 (S1): Traceable issue reference. **RETAINED**
- SCE-3 (S1): Single concern per commit. **RETAINED**
- SCE-4 (S2): Filterable by issue number. **RETAINED**
- SCE-5 (S2): Consistent conventional format. **RETAINED**

**New total: 12 step evals (SE-1..SE-12) + 5 scenario evals (SCE-1..SCE-5) = 17**

## Diff Summary

| Change Type | Count | Details |
|---|---|---|
| Retained (no change) | 13 | SE-1..SE-8, SCE-1..SCE-5 |
| Promoted (renumbered) | 1 | C7 -> SE-12 (C7) — now has formal SE-n ID and artifact reference |
| Added | 3 | SE-9 (C3), SE-10 (C5), SE-11 (C6) — new constraint-driven evals |
| Removed | 0 | No regressions |

## Analysis

### What changed and why

The old eval set covered all 6 failure conditions and both scenarios. However, it only had a single informal constraint eval (the "C7" push check) — none of the other artifact-verifiable constraints had eval coverage.

The new eval set adds formal step evals for three artifact-verifiable constraints:

1. **SE-9 (C3)** — "Every commit must reference an existing issue." Previously only covered indirectly by SCE-2 (scenario eval). Now has a step eval that checks the commits.yaml artifact directly.

2. **SE-10 (C5)** — "Commit messages must follow conventional commit format." Previously only covered by SCE-1/SCE-5 (scenario evals). Now has a step eval that checks against the commit record.

3. **SE-11 (C6)** — "Commit messages must include the linked issue number." Previously only covered indirectly by SCE-2. Now has a dedicated step eval.

4. **SE-12 (C7)** — The old "C7" eval was an informal entry without an SE-n ID. Now formally numbered and integrated into the step eval sequence.

### Constraints NOT generating evals (correct exclusions)

- **C1** (pre-flight): Branch guard — enforced before domain work, no artifact to check.
- **C2** (pre-flight): No changes -> graceful exit — enforced before domain work.
- **C4** (pre-flight): Sensitive file scan — enforced before domain work.
- **C9** (structural): Approval gating — enforced by recipe checkpoint phase structure, not by artifact inspection.

### Regression check

All 14 old evals are preserved in the new set (13 retained as-is, 1 promoted with formal ID). **Zero regressions.**
