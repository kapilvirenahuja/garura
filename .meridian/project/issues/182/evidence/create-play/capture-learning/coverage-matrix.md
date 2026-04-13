# Coverage Matrix: capture-learning

## Constraints

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | pre-flight | Pre-flight check + SE-5 halt | Pre-flight table + Step 1 Eval |
| C2 | constraint | artifact-verifiable | SE-1 | Step 2 Eval |
| C3 | constraint | artifact-verifiable | SE-2 | Step 2 Eval |
| C4 | constraint | artifact-verifiable | SE-3 | Step 2 Eval |
| C5 | constraint | structural | Agent boundary: knowledge-extractor is read-only against inputs | Agent boundary table + agent definition |
| C6 | constraint | artifact-verifiable | SE-7 | Step 4 Eval |
| C7 | constraint | artifact-verifiable | SE-8 | Step 6 Eval |
| C9 | constraint | structural | Agent boundary: knowledge-extractor synthesizes holistically | Agent definition (synthesis step) |
| C10 | constraint | artifact-verifiable | SE-10 | Step 4 Eval |
| C11 | constraint | structural | Step 5 mandatory checkpoint | Checkpoint phase (not skippable) |
| C12 | constraint | structural | Step 4 contract: knowledge-extractor extracts resolved_from=llm | Step 4 agent contract + agent definition |
| C13 | constraint | artifact-verifiable | SE-11 | Step 4 Eval |
| C14 | constraint | artifact-verifiable | SE-9 | Step 6 Eval |
| C15 | constraint | artifact-verifiable | SE-12 | Step 4 Eval |

## Failure Conditions

| Intent Item | Covered By | Location |
|-------------|------------|----------|
| F1 | SE-1 | Step 2 Eval |
| F2 | SE-2 | Step 2 Eval |
| F3 | SE-3 | Step 2 Eval |
| F4 | SE-4 | Step 2 Eval |
| F5 | SE-5 | Step 1 Eval |
| F6 | SE-6 | Step 6 Eval |
| F7 | SE-7 | Step 4 Eval |
| F8 | SE-8 | Step 6 Eval |
| F9 | SE-9 | Step 6 Eval |
| F10 | SE-10 | Step 4 Eval |
| F11 | SE-11 | Step 4 Eval |

## Scenarios

| Intent Item | Covered By | Location |
|-------------|------------|----------|
| S1 | SCE-1 | Scenario Validation |
| S2 | SCE-2 | Scenario Validation |
| S3 | SCE-3 | Scenario Validation |
| S4 | SCE-4 | Scenario Validation |
| S5 | SCE-5 | Scenario Validation |
| S6 | SCE-6 | Scenario Validation |

## Verification

- [x] Every artifact-verifiable constraint has >= 1 SE-n: C2, C3, C4, C6, C7, C10, C13, C14, C15 → SE-1, SE-2, SE-3, SE-7, SE-8, SE-10, SE-11, SE-9, SE-12
- [x] Every failure condition has >= 1 SE-n: F1-F11 → SE-1 through SE-11
- [x] Every scenario has >= 1 SCE-n: S1-S6 → SCE-1 through SCE-6
- [x] Every pre-flight constraint in pre-flight table: C1
- [x] Every structural constraint has verifiable structural element: C5 (agent boundary), C9 (agent definition), C11 (checkpoint phase), C12 (agent contract)
- [x] All required sections present: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata
- [x] Agent contracts match agent-contract.md schema: intent_path, stm_base, stm, task_id
- [x] Domain agents ≤ 5: 2 (project-orchestrator, knowledge-extractor)

## Summary

**14 constraints:** 1 pre-flight, 9 artifact-verifiable, 4 structural — all covered
**11 failure conditions:** all covered by step evals
**6 scenarios:** all covered by scenario evals
**0 gaps**
