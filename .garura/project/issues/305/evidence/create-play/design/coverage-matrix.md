# Coverage Matrix — design (rebuild C19/C20/C21 + F18/F19 + S8/S9)

## Constraints

| ID | Classification | Coverage |
|----|----------------|----------|
| C1 | pre-flight | Pre-flight table |
| C2 | pre-flight | Pre-flight table (validate-kb-extension) |
| C3 | artifact-verifiable | SE-4 |
| C4 | artifact-verifiable | SE-5 |
| C5 | artifact-verifiable | SE-6 |
| C6 | artifact-verifiable | SE-7 |
| C7 | artifact-verifiable | SE-8, SE-9 |
| C8 | artifact-verifiable | SE-10 |
| C9 | artifact-verifiable | SE-11 |
| C10 | structural | Workflow + pre-flight + scriber boundary |
| C11 | structural | Agent boundary table |
| C12 | artifact-verifiable | SE-31 (checkpoint count) |
| C13 (revised) | structural + artifact-verifiable | SE-30 + Step 5b + Step 8 narrative |
| C14 | structural | JSON contracts (product_research_path only) |
| C15 | pre-flight + artifact-verifiable | Pre-flight + SE-16, SE-17, SE-18 |
| C16 | artifact-verifiable | SE-19, SE-20 |
| C17 | structural + artifact-verifiable | SE-21 + tiered-surfacing sub-gates |
| C18 | structural + artifact-verifiable | SE-22 + decision_manifest_path in contracts |
| C19 (NEW) | pre-flight + structural | SE-25 + pre-flight scope-resolution block |
| C20 (NEW) | pre-flight | SE-26 + pre-flight brownfield block |
| C21 (NEW) | structural + artifact-verifiable | SE-27 + Step 5b |

## Failure conditions

| ID | Coverage |
|----|----------|
| F1 | SE-1, SE-2, SE-3 |
| F2 | SE-4 |
| F3 | SE-5 |
| F4 | SE-6 |
| F5 | SE-7 |
| F6 | SE-8 |
| F7 | SE-9 |
| F8 | SE-10 |
| F9 | SE-11 |
| F10 | SE-12 |
| F11 | SE-13 |
| F12 (revised) | SE-14 |
| F13 | SE-15 |
| F14 | SE-16, SE-17, SE-18 |
| F15 | SE-19, SE-20 |
| F16 | SE-23 |
| F17 | SE-24 |
| F18 (NEW) | SE-29 |
| F19 (NEW) | SE-28 |

## Scenarios

| ID | Scenario eval |
|----|---------------|
| S1 | SCE-1 |
| S2 | SCE-2 |
| S3 | SCE-3 |
| S4 | SCE-4 |
| S5 | SCE-5 |
| S6 | SCE-6 |
| S7 | SCE-7 |
| S8 (NEW) | SCE-8 |
| S9 (NEW) | SCE-9 |

## Gaps

None. 21/21 constraints covered, 19/19 failure conditions covered, 9/9 scenarios covered.
