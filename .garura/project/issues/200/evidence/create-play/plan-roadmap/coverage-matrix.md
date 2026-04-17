# plan-roadmap Coverage Matrix (rebake)

intent_hash: sha256:ae08be9a961d2558a16d0c111355c44a64c9b6405685ec4da7b042275cf71379

## Constraint Coverage

| ID  | Type | Category | Covered By | Location |
|-----|------|----------|------------|----------|
| C1  | constraint | pre-flight | Pre-flight check (LOCKED status) | Pre-flight table |
| C5  | constraint | artifact-verifiable | SE-16 | Step 2 Eval |
| C6  | constraint | artifact-verifiable | SE-17 | Step 2 Eval |
| C7  | constraint | artifact-verifiable | SE-18 | Step 2 Eval |
| C8  | constraint | structural | Step 5 checkpoint gate (epics+feasibility approval before Step 6); SE-7 | Step 5 / Step 5 Eval |
| C11 | constraint | structural | Step 5b pre-lock resolution gate | Step 5b |
| C12 | constraint | structural | `config.profiles` passed in scope-epics + assess-feasibility contracts | Steps 2, 3 |
| C13 | constraint | artifact-verifiable | SE-19 (epics), SE-20 (roadmap) | Step 2 / Step 6 Eval |
| C14 | constraint | artifact-verifiable | SE-21 | Step 2 Eval |
| C15 | constraint | structural | Steps 2a, 2b, 6b-val context-isolation contracts | Steps 2a/2b/6b-val |
| C16 | constraint | artifact-verifiable | SE-22 | Step 2 / Step 2a Eval |
| C17 | constraint | artifact-verifiable | SE-23 | Step 2 / Step 2a Eval |

## Failure Condition Coverage

| ID  | Covered By | Location |
|-----|------------|----------|
| F1  | SE-1, SE-2 | Steps 2, 6 |
| F2  | SE-3, SE-4, SE-18 | Steps 2, 6 |
| F3  | SE-5, SE-6, SE-17 | Steps 2, 6 |
| F4  | SE-14 | Step 3 |
| F5  | SE-7 | Step 5 |
| F6  | SE-15 | Step 6b-val |
| F7  | SE-8 | Step 6 |
| F8  | SE-9 | Step 5b |
| F9  | SE-10, SE-21 | Step 2 |
| F10 | SE-11 | Step 2b |
| F11 | SE-12, SE-22 | Steps 2, 2a |
| F12 | SE-13, SE-23 | Steps 2, 2a |

## Scenario Coverage

| ID  | Covered By | Location |
|-----|------------|----------|
| S1  | SCE-1 | Scenario Validation |
| S2  | SCE-2 | Scenario Validation |
| S3  | SCE-3 | Scenario Validation |
| S4  | SCE-4 | Scenario Validation |
| S5  | SCE-5a | Scenario Validation |
| S6  | SCE-6 | Scenario Validation |
| S7  | SCE-5b | Scenario Validation |
| S8  | SCE-7 | Scenario Validation |
| S9  | SCE-8 | Scenario Validation |
| S10 | SCE-9 | Scenario Validation |

## Verification

- All 12 failure conditions covered (>=1 SE each)
- All 10 scenarios covered (>=1 SCE each)
- All artifact-verifiable constraints covered (>=1 SE each)
- All structural constraints enforced by play structure
- Pre-flight constraint C1 enforced by pre-flight table
- Zero doc-builder references in compiled SKILL.md (verified via grep)
- Zero brief generation steps in compiled SKILL.md (briefs are opt-in via /briefs)
- Compiled SKILL.md contains all required sections per ADR 013
