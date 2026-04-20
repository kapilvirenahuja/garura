# Coverage Matrix — garura-capture (rebuild)

Intent: `core/components/plays/garura-capture/reference/intent.yaml` v1.2.0
Intent hash: `sha256:e23184e03fc22223ef2b7a9d392edc7b0eaae5435f03be11492b6a42f1219566`

## Constraints

| ID | Category | Covered By | Location |
|----|----------|------------|----------|
| C1 | pre-flight | Pre-flight required-field check | Pre-flight table |
| C2 | pre-flight | Pre-flight type validate/infer + ambiguous handling | Pre-flight table + inference block |
| C3 | pre-flight | Pre-flight repo_slug resolution | Pre-flight bash |
| C4 | structural | Auto-date rule in play structure | Pre-flight bash (capture_date=date) |
| C5 | artifact-verifiable | SE-9 | Step 2 evals |
| C6 | artifact-verifiable | SE-10 | Step 2 evals |
| C7 | structural | Fallback behavior in Step 2 | Step 2 agent contract + fallback branch |
| C8 | artifact-verifiable | SE-11 | Step 2 evals |
| C9 | artifact-verifiable | SE-12 | Step 2 evals |
| Cbg | structural | run_in_background: true in Step 2 contract | Step 2 agent contract |
| Cconf | artifact-verifiable | SE-7 (source_type: both with F7) | Step 3 eval |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-1 | Step 1 eval |
| F2 | SE-2 | Step 1 eval |
| F3 | SE-3 | Step 1 eval |
| F4 | SE-4 | Step 2 eval |
| F5 | SE-5 | Step 2 eval |
| F6 | SE-6 | Step 2 eval |
| F7 | SE-7 | Step 3 eval |
| F8 | SE-8 | Step 1 eval |

## Scenarios

| ID | Covered By |
|----|------------|
| S1 | SCE-1 |
| S2 | SCE-2 |
| S3 | SCE-3 |
| S4 | SCE-4 |
| S5 | SCE-5 |
| S6 | SCE-6 |

## Summary

- 11/11 constraints covered by category-appropriate mechanism
- 8/8 failure conditions have ≥1 step eval
- 6/6 scenarios have ≥1 scenario eval
- Required sections: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata — all present
- Agent budget: 1 domain + 1 utility (within ≤5 domain budget)
