# Coverage Matrix — meridian:report-issue

## Constraint Coverage

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | pre-flight | Pre-flight check | Pre-flight table — "Required fields present" |
| C2 | constraint | pre-flight | Pre-flight check | Pre-flight table — "Severity is valid" |
| C3 | constraint | structural | Play config | Agent contract `config.repo` field + pre-flight gh check |
| C4 | constraint | structural | Play logic | Pre-flight bash — `defect_date=$(date +%Y-%m-%d)` |
| C5 | constraint | artifact-verifiable | SE-6 | Step 1 Eval |
| C6 | constraint | artifact-verifiable | SE-7 | Step 1 Eval |
| C7 | constraint | artifact-verifiable | SE-3 | Step 3 Eval |
| C8 | constraint | artifact-verifiable | SE-8 | Step 1 Eval |
| C9 | constraint | artifact-verifiable | SE-9 | Step 2 Eval |

## Failure Condition Coverage

| Intent Item | Covered By | Location |
|-------------|------------|----------|
| F1 | SE-1 | Pre-flight validation (C1 check) + Step 1 eval |
| F2 | SE-2 | Pre-flight validation (C2 check) + Step 1 eval |
| F3 | SE-3 | Step 3 Eval (fallback path) |
| F4 | SE-4 | Step 3 Eval (fallback path) |
| F5 | SE-5 | Step 4 Eval (confirmation) |

## Scenario Coverage

| Intent Item | Covered By | Location |
|-------------|------------|----------|
| S1 | SCE-1 | Scenario Validation phase |
| S2 | SCE-2 | Scenario Validation phase |
| S3 | SCE-3 | Scenario Validation phase |
| S4 | SCE-4 | Scenario Validation phase |
| S5 | SCE-5 | Scenario Validation phase |

## Structural Verification

| Check | Status |
|-------|--------|
| All artifact-verifiable constraints have >= 1 SE-n | PASS (C5→SE-6, C6→SE-7, C7→SE-3, C8→SE-8, C9→SE-9) |
| All failure conditions have >= 1 SE-n | PASS (F1→SE-1, F2→SE-2, F3→SE-3, F4→SE-4, F5→SE-5) |
| All scenarios have >= 1 SCE-n | PASS (S1→SCE-1, S2→SCE-2, S3→SCE-3, S4→SCE-4, S5→SCE-5) |
| All pre-flight constraints in pre-flight table | PASS (C1, C2) |
| All structural constraints have structural element | PASS (C3→config.repo, C4→date generation) |
| All required SKILL.md sections present | PASS |
| Agent contracts match agent-contract.md schema | PASS |
| Skill LTM inputs covered (G11) | N/A — manage-issue has no LTM inputs |

## Summary

**9/9 constraints covered. 5/5 failure conditions covered. 5/5 scenarios covered. 0 gaps.**
