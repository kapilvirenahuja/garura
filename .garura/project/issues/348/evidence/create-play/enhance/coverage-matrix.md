# Coverage Matrix — enhance play (rebuild for issue #348)

intent_hash: sha256:b914e806444c7dd3d0fac11e84207eb87e3bf880a8ae737ad000245c758f4841

## New / Changed Items Covered

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 (updated) | constraint | pre-flight (Path A) + artifact-verifiable (Path B) | SE-1 + SE-1b | Step 1 + Step 0a |
| C23 (new) | constraint | artifact-verifiable | SE-19 | Step 0a |
| F15 (new) | failure_condition | — | SE-20 | Step 0a |
| S9 (new) | scenario | — | SCE-9 | Scenario Validation |

## Existing Items Preserved (verbatim from prior compilation)

| Intent Item | Covered By | Notes |
|-------------|------------|-------|
| C2 | SE-2 | Branch guard / enhance/{issue}-{slug} |
| C3 | SE-4 | Q&A discovery |
| C4 | SE-5 | Context assembly path |
| C5 | SE-3 | product_base soft-resolve |
| C6 | SE-6 | Scope gate |
| C7, C8, C19 | SE-7 | approach.yaml schema + alternatives + risks |
| C9, C10 | SE-8 | Mid-checkpoint configurable |
| C11, F12, F13 | SE-9, SE-9b | Implementer / tester contract isolation |
| C12 | SE-11 | Fix loop bound at 3 |
| C13, F14 | SE-10, SE-10b | Tester verdict gates fix loop |
| C14, C21, F10 | SE-12 | Judge contract isolation |
| C15, F2 | SE-13 | Judge confidence gate |
| C16, F7 | SE-14 | Quality gates |
| C17, F1 | SE-15 | PR checkpoint always |
| C18 | SE-16 | Ship without further approval |
| C20, F11 | SE-17 | Approval-required risk checkpoint |
| C22 | SE-18 | Orchestrator-direct context derivation |
| F3 | SE-11 | Fix loop exhaustion |
| F4 | SE-6 | Scope gate halt |
| F5 | SE-5 | Context absence |
| F6 | SE-4 | Q&A absence |
| F8 | SE-8 | Mid-checkpoint skipped |
| F9 | SE-7 | approach.yaml missing fields |
| S1-S8 | SCE-1 through SCE-8 | Scenario evals preserved |

## Verification

- All 23 constraints covered: C1 (split SE-1 / SE-1b), C2-C22 (preserved), C23 (SE-19) ✓
- All 15 failure conditions covered: F1-F14 (preserved), F15 (SE-20) ✓
- All 9 scenarios covered: SCE-1 through SCE-8 (preserved), SCE-9 (new) ✓
- Required SKILL.md sections present: Frontmatter, Header, Compiled From, Role + Agent Boundaries, Arguments, Pre-flight, Workflow, Scenario Validation, Recovery, Pause and Resume, Compilation Metadata ✓
- Agent boundary table unchanged (no new agents) ✓
- Skill manifest: all skills existing ✓
- Workflow structure: still A ✓
- intent_hash recomputed and embedded ✓
