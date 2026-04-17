# Coverage Matrix — enhance play recompilation

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | pre-flight | Pre-flight check | Pre-flight table |
| C2 | constraint | pre-flight | Pre-flight check | Pre-flight table |
| C3 | constraint | artifact-verifiable | SE-4 | Step 3 Eval |
| C4 | constraint | artifact-verifiable | SE-5 | Step 4 Eval |
| C5 | constraint | pre-flight | Pre-flight check | Pre-flight table |
| C6 | constraint | artifact-verifiable | SE-6 | Step 5 Eval |
| C7 | constraint | artifact-verifiable | SE-7 | Step 6 Eval |
| C8 | constraint | artifact-verifiable | SE-7 | Step 6 Eval |
| C9 | constraint | structural | Step 7 condition | Workflow structure |
| C10 | constraint | structural | Step 7 Vanish | Workflow structure |
| C11 | constraint | structural | Step 8 contract | Agent boundary |
| C12 | constraint | structural | Step 9a max | Workflow structure |
| C13 | constraint | artifact-verifiable | SE-10 | Step 9 Eval |
| C14 | constraint | structural | Step 10 contract | Agent boundary |
| C15 | constraint | structural | Step 10a gate | Workflow structure |
| C16 | constraint | artifact-verifiable | SE-14 | Step 11 Eval |
| C17 | constraint | structural | Step 14 always | Workflow structure |
| C18 | constraint | structural | Step 15 no approval | Workflow structure |
| C19 | constraint | artifact-verifiable | SE-7 | Step 6 Eval (risk schema) |
| C20 | constraint | structural | SE-17 | Step 7a (risk checkpoint) |
| F1 | failure | — | SE-15 | Step 14 Eval |
| F2 | failure | — | SE-13 | Step 10a Eval |
| F3 | failure | — | SE-11 | Step 9a Eval |
| F4 | failure | — | SE-6 | Step 5 Eval |
| F5 | failure | — | SE-5 | Step 4 Eval |
| F6 | failure | — | SE-4 | Step 3 Eval |
| F7 | failure | — | SE-14 | Step 11 Eval |
| F8 | failure | — | SE-8 | Step 7 Eval |
| F9 | failure | — | SE-7 | Step 6 Eval |
| F10 | failure | — | SE-12 | Step 10 Eval |
| F11 | failure | — | SE-17 | Step 7a Eval |
| S1 | scenario | — | SCE-1 | Scenario Validation |
| S2 | scenario | — | SCE-2 | Scenario Validation |
| S3 | scenario | — | SCE-3 | Scenario Validation |
| S4 | scenario | — | SCE-4 | Scenario Validation |
| S5 | scenario | — | SCE-5 | Scenario Validation |
| S6 | scenario | — | SCE-6 | Scenario Validation |
| S7 | scenario | — | SCE-7 | Scenario Validation |
| S8 | scenario | — | SCE-8 | Scenario Validation |

**Result:** 20/20 constraints covered, 11/11 failure conditions covered, 8/8 scenarios covered. Zero gaps.
