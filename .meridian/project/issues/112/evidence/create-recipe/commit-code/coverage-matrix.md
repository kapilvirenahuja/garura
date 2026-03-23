# commit-code Coverage Matrix

Generated: 2026-03-23 | Source: `core/components/recipes/commit-code/reference/intent.yaml`

## Constraint Classification

| Constraint | Rule | Category | Eval Coverage |
|---|---|---|---|
| C1 | Must not operate on main/master/default branch | pre-flight | Enforced by pre-flight check (no eval needed) |
| C2 | No changed files -> graceful exit | pre-flight | Enforced by pre-flight check (no eval needed) |
| C3 | Every commit must reference existing issue | artifact-verifiable | SE-9 |
| C4 | Sensitive files must never be committed | pre-flight | Enforced by pre-flight check (no eval needed) |
| C5 | Conventional commit format (types from LTM) | artifact-verifiable | SE-10 |
| C6 | Commit messages include linked issue number | artifact-verifiable | SE-11 |
| C7 | Branch pushed after commits (non-blocking) | artifact-verifiable | SE-12 |
| C9 | Human approval when mapping < high confidence | structural | Enforced by checkpoint phase structure (no eval needed) |

## Failure Condition Coverage

| FC | Condition | Step Evals |
|---|---|---|
| F1 | Single commit contains unrelated concerns | SE-1 (Step 1), SE-2 (Step 5) |
| F2 | Commit message doesn't describe actual change | SE-3 (Step 5) |
| F3 | Changed files remain uncommitted without reason | SE-4 (Step 1), SE-5 (Step 5) |
| F4 | Commit references wrong issue | SE-6 (Step 2) |
| F5 | Unresolved mapping conflict not surfaced | SE-7 (Step 2) |
| F6 | Low-confidence mapping committed without approval | SE-8 (Step 2) |

## Scenario Coverage

| Scenario | Persona | Scenario Evals |
|---|---|---|
| S1 | Code reviewer — understand changes from log, trace to issue | SCE-1, SCE-2, SCE-3 |
| S2 | Team lead — per-issue progress, mentoring reference | SCE-4, SCE-5 |

## Summary

| Metric | Count |
|---|---|
| Total constraints | 8 (C1-C7, C9) |
| Pre-flight constraints | 3 (C1, C2, C4) |
| Artifact-verifiable constraints | 4 (C3, C5, C6, C7) |
| Structural constraints | 1 (C9) |
| Failure conditions | 6 (F1-F6) |
| Scenarios | 2 (S1-S2) |
| Step evals (from FCs) | 8 (SE-1 through SE-8) |
| Step evals (from constraints) | 4 (SE-9 through SE-12) |
| Scenario evals | 5 (SCE-1 through SCE-5) |
| **Total evals** | **17** |

## Coverage Verification

- Every F-n has at least one SE-n: **PASS** (F1: 2, F2: 1, F3: 2, F4: 1, F5: 1, F6: 1)
- Every S-n has at least one SCE-n: **PASS** (S1: 3, S2: 2)
- Every artifact-verifiable C-n has at least one SE-n: **PASS** (C3: 1, C5: 1, C6: 1, C7: 1)
- No regressions from old evals: **PASS** (see validation-diff.md)
