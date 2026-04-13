# Intent Gap Report: commit-code

**Date:** 2026-03-06
**Source intent:** `core/components/plays/commit-code/reference/intent.yaml`
**Source analysis:** `.meridian/project/issues/95/evidence/create-play/commit-code/play-analysis.md`
**Skills reviewed:** `analyze-changes`, `create-commit`, `resolve-issues`

## Summary

**Gaps found: 4** (2 missing constraints, 2 missing failure conditions, 0 missing scenarios)

The existing intent.yaml is solid on its core coverage. The gaps stem from behavioral boundaries present in skill contracts and the play's confidence-gating logic that are not reflected as intent-level constraints or failure conditions.

---

## Gap 1: No constraint on explicit file staging

**Category:** Missing constraint
**Proposed ID:** C8
**Severity:** High — directly affects commit correctness

**What's missing:** The `create-commit` skill has a hard constraint: "ONLY stage files explicitly provided. NEVER use git add . or git add -A." This boundary prevents unintended files from leaking into commits. The intent says nothing about how files are staged.

**Why it matters:** Without this constraint, an implementation could bulk-stage the working tree and satisfy all other constraints (conventional format, issue references, concern grouping) while still producing commits that contain files the analysis never examined. This is a distinct failure mode from F1 (unrelated concerns) because the extra files might share a concern but were never analyzed for risk (C4) or issue mapping (C3).

**Observable test:** Look at any commit produced by the play. Every file in the commit diff must appear in the analysis output's change groups. If a file is in the commit but not in any analyzed group, the constraint is violated.

**Proposed addition:**
```yaml
- id: C8
  rule: >
    Only files explicitly identified during change analysis may be staged
    for commit. Bulk-staging operations (e.g., staging the entire working
    tree) are not permitted.
```

---

## Gap 2: No constraint on confidence-gated approval

**Category:** Missing constraint
**Proposed ID:** C9
**Severity:** Medium — affects human oversight boundary

**What's missing:** The intent statement says "Approval is required only when confidence is low on change grouping or issue mapping." The play's checkpoint stage is skippable "when ALL issue mappings return high confidence." But no constraint codifies this boundary. Without it, an implementation could either always require approval (violating the "only when low" intent) or never require approval (missing low-confidence mappings).

**Why it matters:** The confidence threshold is a meaningful boundary on when the play proceeds autonomously versus when it pauses for human judgment. This is a core behavioral contract — the user trusts the play to self-serve on high-confidence mappings and to stop on uncertain ones. If an implementation skips approval on a `low` confidence mapping, the user loses their review opportunity. If it always asks, the play becomes unusable for routine commits.

**Observable test:** Run the play with a changeset where issue mapping returns `low` or `medium` confidence. If the play commits without presenting a brief and requesting approval, the constraint is violated. Conversely, run with all `high` confidence mappings — if the play still asks for approval, the constraint is violated.

**Proposed addition:**
```yaml
- id: C9
  rule: >
    Human approval is required before committing when any change group's
    issue mapping has less than high confidence. When all mappings are
    high confidence, the play proceeds without approval.
```

---

## Gap 3: No failure condition for unresolved mapping conflicts

**Category:** Missing failure condition
**Proposed ID:** F5
**Severity:** Medium — affects correctness of issue references

**What's missing:** The `resolve-issues` skill detects conflicts: two groups mapping to the same issue with conflicting types, or a single group with equal-strength signals pointing to different issues. If the final output contains commits where a conflict existed but was resolved by arbitrary selection (no human review), the issue reference may be wrong. F4 (wrong issue reference) partially covers this, but F4 is about the end state, not the path — a conflict that was silently resolved might produce a "correct" reference by luck, masking the fact that the conflict was never surfaced.

**Why it matters:** Conflicts are ambiguity signals. When the mapping has a conflict and it reaches the commit without human review, the play has made a judgment call it was not designed to make. Even if the final reference happens to be correct, the conflict should have been visible.

**Observable test:** Examine the issue mapping artifacts. If a conflict flag exists for a change group AND that group was committed without the conflict appearing in the approval brief, the condition is met.

**Proposed addition:**
```yaml
- id: F5
  condition: >
    A commit is created from a change group that had an unresolved
    conflict in issue mapping (multiple competing issue matches)
    without the conflict being surfaced for review.
```

---

## Gap 4: No failure condition for low-confidence mapping committed without review

**Category:** Missing failure condition
**Proposed ID:** F6
**Severity:** Medium — directly tied to proposed C9

**What's missing:** If a change group has `low` or `none` confidence in its issue mapping and proceeds to commit without human approval, the output may contain incorrect issue references. C3 covers the `none` case (halt if changes cannot be mapped). But `low` confidence is different — an issue IS mapped, just with weak signals. The play is supposed to pause for review, and if it doesn't, the commit's issue reference is suspect.

**Why it matters:** This failure condition is the observable state that makes C9 enforceable. Without it, there's no way to evaluate whether the confidence gate worked.

**Observable test:** Look at the issue mapping output for any group with confidence below `high`. If that group's commit exists and no approval checkpoint was reached, the condition is met.

**Proposed addition:**
```yaml
- id: F6
  condition: >
    A commit is created from a change group whose issue mapping had
    less than high confidence, and no human approval was obtained for
    that mapping.
```

---

## No Gaps Found

### Scenarios

S1 and S2 adequately cover the two primary consumers of commit output: the code reviewer (per-commit clarity) and the team lead (cross-branch progress tracking). No additional scenarios are needed.

The working tree cleanliness after play completion is already covered by F3 as a failure condition. Adding a scenario for "developer returns to branch and finds clean tree" would duplicate F3 without adding acceptance value.

### Existing constraints and failure conditions

C1 through C7 and F1 through F4 are well-crafted. They are falsifiable, implementation-agnostic, and traceable to the intent. No rewrites needed.

---

## Recommendation

Add C8, C9, F5, F6 to intent.yaml. These four additions close the gap between the skill-level behavioral contracts and the intent-level specification.

| ID | Type | Summary |
|----|------|---------|
| C8 | Constraint | Explicit file staging only — no bulk staging |
| C9 | Constraint | Confidence-gated approval threshold |
| F5 | Failure condition | Unresolved mapping conflicts reaching commit |
| F6 | Failure condition | Low-confidence mappings committed without review |
