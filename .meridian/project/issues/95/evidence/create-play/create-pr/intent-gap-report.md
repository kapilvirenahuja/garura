# Intent Gap Report: create-pr

## Summary

The existing intent.yaml is solid. One genuine gap was identified: a missing constraint for the branch guard that the play enforces but the intent does not declare. All other constraints, failure conditions, and scenarios pass the quality gate.

## Review Method

1. Read `core/components/plays/create-pr/reference/intent.yaml` (7 constraints, 5 failure conditions, 2 scenarios)
2. Read `.meridian/project/issues/95/evidence/create-play/create-pr/play-analysis.md`
3. Read `core/components/plays/create-pr/SKILL.md` to verify intent against actual play behavior
4. Applied intent quality gate rules to every field
5. Cross-referenced with `commit-code/reference/intent.yaml` for pattern consistency

## Constraint Review

| ID | Rule Summary | Boundary? | Falsifiable? | Impl-Agnostic? | Verdict |
|----|-------------|-----------|-------------|-----------------|---------|
| C1 | Platform from config | Yes | Yes | Yes | Pass |
| C2 | Read-only play | Yes | Yes | Yes | Pass |
| C3 | All committed and pushed | Yes | Yes | Yes | Pass |
| C4 | Change-specific checklist | Yes | Yes | Yes | Pass |
| C5 | Evidence-backed checklist | Yes | Yes | Yes | Pass |
| C6 | Eval results in PR | Yes | Yes | Yes | Pass |
| C7 | Confidence-gated auto-submit | Yes | Yes | Yes | Pass |

### Gap: Missing branch guard constraint

The play's pre-flight (Stage 0) enforces "Current branch is not main/master/default" as a hard halt. This is marked "implicit" in the play -- meaning the play enforces it but the intent does not declare it.

This is a genuine gap. Creating a PR from the default branch is a nonsensical operation (you would be PRing main into main). The `commit-code` play captures an equivalent boundary as C1. The `create-pr` intent should declare it.

**Proposed addition:**

```yaml
- id: C8
  rule: >
    The play must not operate on main, master, or the repository's default branch.
    PRs are created from feature branches only.
```

**Quality gate check:**
- Boundary, not method: Yes -- says what must not happen, not how to check it
- Falsifiable: Yes -- observe which branch the PR was created from
- Implementation-agnostic: Yes -- no tools or agents referenced
- References artifacts/states: Yes -- the branch state
- Narrows solution space meaningfully: Yes -- prevents nonsensical PRs

## Failure Condition Review

| ID | Condition Summary | Observable? | State not event? | Traceable to intent? | Verdict |
|----|------------------|-------------|------------------|---------------------|---------|
| F1 | No linked issue | Yes | Yes | Yes (intent: "linked to originating issue") | Pass |
| F2 | Generic checklist items | Yes | Yes | Yes (C4) | Pass |
| F3 | Checklist items lack evidence | Yes | Yes | Yes (C5) | Pass |
| F4 | Evals pass but not in PR | Yes | Yes | Yes (C6) | Pass |
| F5 | Wrong target branch without confirm | Yes | Yes | Yes (C7) | Pass |

No missing failure conditions identified. The proposed C8 (branch guard) would not need a separate failure condition -- a PR created from the default branch would be caught at pre-flight before any artifacts exist.

## Scenario Review

| ID | Persona? | Outcome not process? | Artifact in given? | E2E? | Verdict |
|----|----------|---------------------|-------------------|------|---------|
| S1 | Code Reviewer | Yes | Yes (PR on platform) | Yes | Pass |
| S2 | Author (Developer) | Yes | Yes (PR with eval results) | Yes | Pass |

No missing scenarios. Both personas cover the two primary consumers of a PR.

## Intent Statement Review

The intent statement is implementation-agnostic. It describes:
- What: Create a pull request
- Where: On the user's configured git platform
- Linked to: The originating issue
- Contents: Dynamic quality checklist, evidence, eval results
- Behavior: Confidence-gated approval

No play names, agent names, skill names, or implementation details. Pass.

## Decision

| Category | Status | Action |
|----------|--------|--------|
| Intent statement | No gap | No change |
| Constraints | 1 gap (missing branch guard) | Add C8 |
| Failure conditions | No gap | No change |
| Scenarios | No gap | No change |

**Recommendation:** Add C8 (branch guard constraint) to intent.yaml. All other fields remain unchanged.
