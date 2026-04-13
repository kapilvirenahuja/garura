# Coverage Matrix — briefs play (rebake 2026-03-26)

## Constraint Coverage

| Constraint | Description | Step Eval | Scenario Eval | Covered |
|------------|-------------|-----------|---------------|---------|
| C1 | Context-derived epic scope, no params | Pre-flight | SCE-1 | YES |
| C2 | Checksum-only staleness detection | SE-10 | SCE-4 | YES |
| C3 | YAML->JSON + static template copy, no LLM | Step 3.1-3.6 (structural) | SCE-1, SCE-2 | YES |
| C4 | Graceful halt when no product dir | Pre-flight | SCE-3 | YES |
| C5 | All output under briefs/ subdirectory | SE-11 | SCE-1, SCE-2 | YES |
| C6 | Checksums persisted in briefs/ | SE-12 | SCE-1, SCE-4 | YES |
| C7 | Product-level always in scope with epic | SE-13 | SCE-1 | YES |
| C8 | Phoenix design system via external CSS | SE-8 | SCE-1, SCE-5 | YES |
| C9 | Hub.html multi-epic support | SE-14 | SCE-2 | YES |
| C10 | Empty YAML sections rendered, not omitted | Step 3.5 (structural) | SCE-1, SCE-2 | YES |
| C11 | Isomorphic JSON, no transformation | Step 3.1 (structural) | SCE-1, SCE-2 | YES |
| C12 | SPA chapter navigation (NEW) | SE-15 | SCE-1, SCE-5 | YES |
| C13 | Tab sub-navigation for sub-items (NEW) | SE-16 | SCE-1, SCE-5 | YES |
| C14 | Shared assets co-located with HTML (NEW) | SE-17 | SCE-1, SCE-2, SCE-5 | YES |

## Failure Condition Coverage

| FC | Description | Step Eval | Scenario Eval | Covered |
|----|-------------|-----------|---------------|---------|
| F1 | Changed YAML missing brief | SE-1 | SCE-1 | YES |
| F2 | Unchanged YAML regenerated | SE-2 | SCE-4 | YES |
| F3 | HTML outside briefs/ | SE-3 | SCE-1 | YES |
| F4 | Proceeds without product dir | Pre-flight | SCE-3 | YES |
| F5 | Hub misses briefs or has ghosts | SE-5 | SCE-2 | YES |
| F6 | Stored checksums stale | SE-6 | SCE-1 | YES |
| F7 | Unrelated epics regenerated | SE-7 | SCE-1 | YES |
| F8 | Unstyled HTML output | SE-8 | SCE-5 | YES |
| F9 | Hub misses epics | SE-9 | SCE-2 | YES |
| F10 | HTML without companion CSS/JS (NEW) | SE-18 | SCE-5 | YES |
| F11 | Broken external CSS/JS refs (NEW) | SE-19 | SCE-5 | YES |

## Scenario Coverage

| Scenario | Description | Evals Exercised |
|----------|-------------|-----------------|
| S1 | Epic branch, 2 changed YAMLs | SE-1, SE-2, SE-7, SE-10, SE-13, SE-15, SE-17 |
| S2 | Main branch, 3 epics full scan | SE-5, SE-9, SE-14, SE-17 |
| S3 | No product directory | Pre-flight (F4) |
| S4 | All checksums match | SE-2, SE-10 |
| S5 | Shared asset integrity (NEW) | SE-15, SE-16, SE-17, SE-18, SE-19 |

## Summary

- **Constraints:** 14 (was 11, +3 new: C12, C13, C14)
- **Failure Conditions:** 11 (was 9, +2 new: F10, F11)
- **Scenarios:** 5 (was 4, +1 new: S5)
- **Step Evals:** 19 (was 14, +5 new: SE-15 through SE-19)
- **Scenario Evals:** 5 (was 4, +1 new: SCE-5)
- **Coverage:** 100% — every constraint, FC, and scenario has at least one step eval and one scenario eval
