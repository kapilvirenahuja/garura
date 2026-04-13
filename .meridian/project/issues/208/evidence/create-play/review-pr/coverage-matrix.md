# Coverage Matrix — review-pr

| Intent Item | Type | Category | Covered By | Location |
|---|---|---|---|---|
| C1 | constraint | structural | Play rule + skill diff scope invariant | Role section + quality-check-scoped contract |
| C2 | constraint | artifact-verifiable | SE-1 | Step 2 Eval |
| C3 | constraint | artifact-verifiable | SE-3 | Step 2 Eval |
| C4 | constraint | pre-flight | Pre-flight + SE-4 + SE-9 | Pre-flight table + Step 1 Eval |
| C5 | constraint | structural | Agent boundary table | Role section |
| C6 | constraint | artifact-verifiable | SE-6 | Step 4 Eval |
| C7 | constraint | artifact-verifiable | SE-7 | Step 4 Eval |
| C8 | constraint | artifact-verifiable | SE-8 | Step 5 Eval |
| C9 | constraint | structural | Confidence formula baked into Step 3 | Role + Step 3 |
| C10 | constraint | structural | Forbidden play actions | Role section |
| F1 | failure | — | SE-1 | Step 2 |
| F2 | failure | — | SE-2 | Step 2 |
| F3 | failure | — | SE-7 | Step 4 |
| F4 | failure | — | SE-6 | Step 4 |
| F5 | failure | — | SE-5, SE-8 | Steps 3, 5 |
| F6 | failure | — | SE-5, SE-8 | Steps 3, 5 |
| F7 | failure | — | SE-3 | Step 2 |
| F8 | failure | — | SE-9 | Pre-flight |
| F9 | failure | — | Agent boundary table (≤5 domain) | Role section |
| S1 | scenario | — | SCE-1 | Scenario Validation |
| S2 | scenario | — | SCE-2 | Scenario Validation |
| S3 | scenario | — | SCE-3 | Scenario Validation |
| S4 | scenario | — | SCE-4 | Scenario Validation |

**All 10 constraints, 9 failure conditions, 4 scenarios covered.** PASS.
