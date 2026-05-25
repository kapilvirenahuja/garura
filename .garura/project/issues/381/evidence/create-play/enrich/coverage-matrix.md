# Coverage matrix — enrich rebuild (#381)

intent_hash: ae7803972a491e676818550edaf28518e2ce87c4d0f227900740c8e2f315013a
expectation_hash: 30bcf25710f676d014bcc2bcc3296eddc9405f1f8a7f428d16eb59dc78f38ae1

## Constraints

| Constraint | Category | Covered by | Location |
|-----------|----------|-----------|----------|
| C1 | artifact-verifiable | SE-10 | Step 4 evals |
| C2 | artifact-verifiable | SE-11 | Step 4 evals |
| C3 | artifact-verifiable | SE-12 | Step 2/4 evals |
| C4 | structural | Step 3 approval gate + checkpoint flow | Step 3 gate |
| C5 | artifact-verifiable | SE-13 | Step 4 evals |
| C6 | artifact-verifiable | SE-14 | Step 5 evals |
| C7 | structural | Two-mode pre-flight (single/sweep) | Pre-flight + agent table |
| C8 | artifact-verifiable | SE-15 | Step 4 evals |
| C9 | structural | Scope statement (no taxonomy promotion) | Constraints/role |
| C10 | structural | Evidence & Close (C1 slot, non-blocking commit) | Evidence & Close |
| C11 (NEW) | artifact-verifiable | SE-16 | Step 5 archive gate |

## Failure conditions (each ≥1 SE, each exactly one recovery)

| FC | SE | Recovery |
|----|----|----------|
| F1 | SE-1, SE-11 | REC1 (human) |
| F2 | SE-2, SE-10 | REC2 (human) |
| F3 | SE-3, SE-14 | REC3 (human) |
| F4 | SE-4 | REC4 (human) |
| F5 | SE-5, SE-13 | REC5 (autonomous) |
| F6 | SE-6 | REC6 (autonomous) |
| F7 (SHARPENED) | SE-7 (archive-time) | REC7 (autonomous, trigger re-worded) |
| F8 | SE-8, SE-15 | REC8 (human) |
| F9 | SE-9 | REC9 (autonomous) |

## Scenarios (each ≥1 SCE)

| Scenario | SCE |
|----------|-----|
| S1 | SCE-1 |
| S2 | SCE-2 |
| S3 | SCE-3 |
| S4 | SCE-4 |
| S5 | SCE-5 |
| S6 | SCE-6 |
| S7 (NEW) | SCE-7 |

## Verification

- Every artifact-verifiable constraint has ≥1 SE: PASS (C1,C2,C3,C5,C6,C8,C11)
- Every failure condition has ≥1 SE: PASS (F1-F9)
- Every failure condition has exactly one recovery: PASS (REC1-REC9)
- Every scenario has ≥1 SCE: PASS (S1-S7)
- Structural constraints have structural elements: PASS (C4,C7,C9,C10)
- Hash guard + metadata updated to new hashes: PASS
- Old narrow archive gate (verification_failed-only) removed: PASS
- Standard Play Close anchors intact: PASS

## Pre-existing observations (not addressed — orthogonal to #381)
- G6: repo-orchestrator's skill table omits archive-issue-stm (play assigns it). Pre-existing.
- apply-ltm-enrichment writes[].status enum omits "failed" though it produces it. Pre-existing contract-doc gap.
