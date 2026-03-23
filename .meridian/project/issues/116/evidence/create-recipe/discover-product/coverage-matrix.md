# Coverage Matrix: discover-product (Flattened)

**Intent hash:** sha256:46782b3716acdcde2ca1ce7c8849310e80028d87d063cd5f6a84cfb31a17b4f6

## Constraint Classification

| Constraint | Rule Summary | Category |
|---|---|---|
| C1 | Intent >5 words | pre-flight |
| C4 | Delegate to agents | structural |
| C5 | Max 5 domain dispatches | structural |
| C6 | Artifacts in product STM path | artifact-verifiable |
| C7 | Strategic Goals, no OKRs | artifact-verifiable |
| C8 | Checkpoint before user pause | artifact-verifiable |
| C9 | Max cycle-back iterations | structural |
| C10 | Brief after drafting | artifact-verifiable |
| C11 | Domain clarification | structural |
| C12 | Conditional opportunity skip | structural |
| C13 | Type field in product.yaml | artifact-verifiable |

## Full Coverage Matrix

| Intent Item | Type | Category | Covered By | Location |
|---|---|---|---|---|
| C1 | constraint | pre-flight | Pre-flight check | Pre-flight table |
| C4 | constraint | structural | Recipe structure | Agent boundary table |
| C5 | constraint | structural | Recipe structure | Agent dispatch budget |
| C6 | constraint | artifact-verifiable | SE-9, SE-10 | Step 3 Eval, Step 4 Eval |
| C7 | constraint | artifact-verifiable | SE-11 | Step 3 Eval |
| C8 | constraint | artifact-verifiable | SE-12 | Step 4 Eval |
| C9 | constraint | structural | Recipe structure | Cycle-back logic in Step 7 |
| C10 | constraint | artifact-verifiable | SE-13 | Step 4 Eval |
| C11 | constraint | structural | Recipe structure | Domain clarification in Step 2 |
| C12 | constraint | structural | Recipe structure | Intent Assessment in Step 1 |
| C13 | constraint | artifact-verifiable | SE-14 | Step 3 Eval |
| F1 | failure_condition | - | SE-1 | Step 3 Eval |
| F2 | failure_condition | - | SE-2 | Step 2 Eval |
| F3 | failure_condition | - | SE-3 | Step 3 Eval |
| F5 | failure_condition | - | SE-4 | Step 6 Eval |
| F7 | failure_condition | - | SE-5 | Pre-flight |
| F8 | failure_condition | - | SE-6 | Step 3 Eval |
| F9 | failure_condition | - | SE-7 | Step 4 Eval |
| F10 | failure_condition | - | SE-8 | Step 3 Eval |
| S1 | scenario | - | SCE-1 | Scenario Validation |
| S2 | scenario | - | SCE-2 | Scenario Validation |
| S3 | scenario | - | SCE-3 | Scenario Validation |
| S4 | scenario | - | SCE-4 | Scenario Validation |

## Coverage Summary

| Category | Total | Covered | Uncovered |
|---|---|---|---|
| Failure Conditions | 8 | 8 | 0 |
| Artifact-Verifiable Constraints | 5 (C6, C7, C8, C10, C13) | 5 | 0 |
| Pre-flight Constraints | 1 (C1) | 1 | 0 |
| Structural Constraints | 5 (C4, C5, C9, C11, C12) | 5 | 0 |
| Scenarios | 4 (S1-S4) | 4 | 0 |

**Step Evals:** 14 | **Scenario Evals:** 4 | **Total:** 18

**Verdict:** Full coverage. Zero uncovered items.
