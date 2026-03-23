# Coverage Matrix: discover-product (Rebaked)

**Intent hash:** sha256:5dda4876452e57e0ad8b31468c8f58bcb94c20bda4db0c954bd3e6702438c76b
**Generated:** 2026-03-23

## Constraint Classification

| Constraint | Rule Summary | Category |
|---|---|---|
| C1 | Intent >5 meaningful words | pre-flight |
| C2 | Phase must be draft/validate/lock | pre-flight |
| C3 | VALIDATE/LOCK require existing non-LOCKED artifact | pre-flight |
| C4 | All product work delegated to agents | structural |
| C5 | Max agent dispatches per phase (2 if skipped) | structural |
| C6 | Artifacts in .meridian/project/product/{slug}/ | artifact-verifiable |
| C7 | Strategic Goals terminology, no OKRs | artifact-verifiable |
| C8 | Checkpoint artifact before presenting results | artifact-verifiable |
| C9 | Max 2 re-draft cycle-back iterations | structural |
| C10 | Human-reviewable brief in DRAFT phase | artifact-verifiable |
| C11 | Ambiguous domain confirmed by user | structural |
| C12 | Opportunity discovery conditional (3 signals) | structural |
| C13 | Type field in product.yaml (product/library) | artifact-verifiable |

## Full Coverage Matrix

| Intent Item | Type | Category | Covered By | Location |
|---|---|---|---|---|
| C1 | constraint | pre-flight | Pre-flight check | Pre-flight table (word count) |
| C2 | constraint | pre-flight | Pre-flight check | Pre-flight table (phase validation) |
| C3 | constraint | pre-flight | Pre-flight check | Pre-flight table (artifact exists, not LOCKED) |
| C4 | constraint | structural | Recipe structure | Agent boundary table, Role section |
| C5 | constraint | structural | Recipe structure | Agent dispatch counts, Intent Assessment |
| C6 | constraint | artifact-verifiable | SE-10, SE-11 | Step 2 Eval, Step 3 Eval |
| C7 | constraint | artifact-verifiable | SE-12 | Step 2 Eval |
| C8 | constraint | artifact-verifiable | SE-13 | Step 3 Eval |
| C9 | constraint | structural | Recipe structure | Cycle-back logic in VALIDATE |
| C10 | constraint | artifact-verifiable | SE-14 | Step 3 Eval |
| C11 | constraint | structural | Recipe structure | Domain clarification in Step 1 |
| C12 | constraint | structural | Recipe structure | Intent Assessment section |
| C13 | constraint | artifact-verifiable | SE-15 | Step 2 Eval |
| F1 | failure_condition | - | SE-1 | Step 2 Eval |
| F2 | failure_condition | - | SE-2 | Step 1 Eval |
| F3 | failure_condition | - | SE-3 | Step 2 Eval |
| F5 | failure_condition | - | SE-4 | VALIDATE Step 1 Eval |
| F6 | failure_condition | - | SE-5 | VALIDATE Step 1 Eval |
| F7 | failure_condition | - | SE-6 | Step 2 Eval, VALIDATE |
| F8 | failure_condition | - | SE-7 | Step 2 Eval |
| F9 | failure_condition | - | SE-8 | Step 3 Eval |
| F10 | failure_condition | - | SE-9 | Step 2 Eval |
| S1 | scenario | - | SCE-1 | Scenario Validation (DRAFT) |
| S2 | scenario | - | SCE-2 | Scenario Validation (LOCK) |
| S3 | scenario | - | SCE-3 | Scenario Validation (VALIDATE) |
| S4 | scenario | - | SCE-4 | Scenario Validation (LOCK) |

## Coverage Summary

| Category | Total | Covered | Uncovered |
|---|---|---|---|
| Failure Conditions | 9 | 9 | 0 |
| Artifact-Verifiable Constraints | 5 (C6, C7, C8, C10, C13) | 5 | 0 |
| Pre-flight Constraints | 3 (C1, C2, C3) | 3 | 0 |
| Structural Constraints | 5 (C4, C5, C9, C11, C12) | 5 | 0 |
| Scenarios | 4 (S1-S4) | 4 | 0 |

**Step Evals:** 15 (SE-1 through SE-15)
**Scenario Evals:** 4 (SCE-1 through SCE-4)
**Total Evals:** 19

**Verdict:** Full coverage. Zero uncovered items across all categories.
