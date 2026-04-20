# Coverage Matrix — enhance play

**Intent hash:** sha256:2bc05173e8632daddfa6fdaa20128d36bab96e3fe170ba25a4be1903e6d87269
**Compiled at:** 2026-04-21

## Constraints

| ID | Category | Covered By | Location |
|----|----------|------------|----------|
| C1 | pre-flight + artifact-verifiable | Pre-flight table + SE-1 | Pre-flight, Step 1 |
| C2 | pre-flight + artifact-verifiable | Pre-flight table + SE-2 | Pre-flight, Step 2 |
| C3 | artifact-verifiable | SE-4 | Step 3 |
| C4 | artifact-verifiable | SE-5 | Step 4 |
| C5 | artifact-verifiable | SE-3 | Step 4 |
| C6 | artifact-verifiable | SE-6 | Step 5 |
| C7 | artifact-verifiable | SE-7 | Step 6 |
| C8 | artifact-verifiable | SE-7 | Step 6 |
| C9 | artifact-verifiable | SE-8 | Step 7 |
| C10 | structural | Step 7 HALT branch | Step 7 |
| C11 | artifact-verifiable | SE-9, SE-9b | Steps 8, 9 |
| C12 | artifact-verifiable | SE-11 | Step 9a |
| C13 | artifact-verifiable | SE-10 | Step 9 |
| C14 | artifact-verifiable | SE-12 | Step 10 |
| C15 | artifact-verifiable | SE-13 | Step 10a |
| C16 | artifact-verifiable | SE-14 | Step 11 |
| C17 | artifact-verifiable | SE-15 | Step 14 |
| C18 | artifact-verifiable | SE-16 | Step 15 |
| C19 | artifact-verifiable | SE-7 | Step 6 |
| C20 | artifact-verifiable | SE-17 | Step 7a |
| C21 | artifact-verifiable | SE-12 | Step 10 |
| C22 | artifact-verifiable | SE-18 | Step 7b |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-15 | Step 14 |
| F2 | SE-13 | Step 10a |
| F3 | SE-11 | Step 9a |
| F4 | SE-6 | Step 5 |
| F5 | SE-5 | Step 4 |
| F6 | SE-4 | Step 3 |
| F7 | SE-14 | Step 11 |
| F8 | SE-8 | Step 7 |
| F9 | SE-7 | Step 6 |
| F10 | SE-12 | Step 10 |
| F11 | SE-17 | Step 7a |
| F12 | SE-9 | Step 8 |
| F13 | SE-9b | Step 9 |
| F14 | SE-10b | Step 9 |

## Scenarios

| ID | Covered By | Location |
|----|------------|----------|
| S1 | SCE-1 | Step 16 |
| S2 | SCE-2 | Step 16 |
| S3 | SCE-3 | Step 16 |
| S4 | SCE-4 | Step 16 |
| S5 | SCE-5 | Step 16 |
| S6 | SCE-6 | Step 16 |
| S7 | SCE-7 | Step 16 |
| S8 | SCE-8 | Step 16 |

## Summary

- Constraints covered: 22 / 22 (C1-C22)
- Failure conditions covered: 14 / 14 (F1-F14)
- Scenarios covered: 8 / 8 (S1-S8)
- Step evals: 20 (SE-1..SE-18, including SE-9b and SE-10b)
- Scenario evals: 8 (SCE-1..SCE-8)

**Result:** PASS — no uncovered intent items, no warnings.
