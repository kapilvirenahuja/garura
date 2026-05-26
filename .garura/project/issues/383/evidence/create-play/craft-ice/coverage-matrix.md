# Coverage Matrix — craft-ice

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | artifact-verifiable | SE-1 | Step 4 eval |
| C2 | constraint | artifact-verifiable | SE-2 | Step 2 eval |
| C3 | constraint | artifact-verifiable | SE-3 | Step 4 eval |
| C4 | constraint | pre-flight | PF3 (issue anchor) + SE-4 (artifact traceability, via F4) | Pre-flight table + Step 4 eval |
| C5 | constraint | pre-flight | PF4 (scope guard) | Pre-flight table |
| C6 | constraint | structural | PF5 (config read) + Step 5 HITL branch + SE-6 (via F6) | Pre-flight table + Workflow Step 5 |
| F1 | failure_condition | — | SE-1 | Step 4 eval |
| F2 | failure_condition | — | SE-2 | Step 2 eval |
| F3 | failure_condition | — | SE-3 | Step 4 eval |
| F4 | failure_condition | — | SE-4 | Step 4 eval |
| F5 | failure_condition | — | SE-5 | Pre-flight eval |
| F6 | failure_condition | — | SE-6 | Step 5 eval |
| S1 | success_scenario | — | SCE-1 | Scenario Validation |
| S2 | success_scenario | — | SCE-2 | Scenario Validation |
| S3 | success_scenario | — | SCE-3 | Scenario Validation |
| F1→REC1 | recovery | — | REC1 (autonomous) | Recovery |
| F2→REC2 | recovery | — | REC2 (autonomous) | Recovery |
| F3→REC3 | recovery | — | REC3 (human) | Recovery |
| F4→REC4 | recovery | — | REC4 (human) | Recovery |
| F5→REC5 | recovery | — | REC5 (human) | Recovery |
| F6→REC6 | recovery | — | REC6 (human) | Recovery |

## Verification

- Every artifact-verifiable constraint (C1-C3) has ≥1 SE from evals-creator output. ✓
- Every failure condition (F1-F6) has ≥1 SE. ✓
- Every success scenario (S1-S3) has ≥1 SCE. ✓
- Every failure condition has exactly one recovery entry (G3b). ✓
- Every pre-flight constraint (C4, C5) appears in the pre-flight table. ✓
- Structural constraint (C6) has a verifiable structural element (PF5 config read + Step 5 HITL branch). ✓
- All required sections present in SKILL.md (G10): Frontmatter, Header, Compiled From, Role+Agent Boundaries, Pre-flight, Task DAG, Workflow, Scenario Validation, Recovery, Evidence & Close, Pause and Resume, Compilation Metadata. ✓
- Standard Play Close block present with exact lint anchors (G12). ✓
- intent_hash + expectation_hash recorded and match on-disk shasum (G9). ✓
- G11 (skill LTM input coverage): generate-feature-expectation `rules_path` passed in Step 4 contract; tech-designer context-loading protocol covers its LTM/research inputs; author-intent-yaml `output_base` passed in Step 2. ✓

**Result: full coverage. Compilation valid.**

## Gate summary (G1-G12)
G1 Constraint Coverage PASS · G2 FC Coverage PASS · G3 Scenario Coverage PASS ·
G3b Recovery Coverage PASS · G4 Skill Existence PASS (author-intent-yaml, scout-project,
research-domain-context, generate-feature-expectation all exist) · G5 Agent Existence
PASS (intent-crafter, tech-designer, expectation-crafter) · G6 Skill-Agent Alignment
PASS (expectation-crafter declares generate-feature-expectation; tech-designer declares
research-domain-context; intent-crafter declares author-intent-yaml. scout-project was
considered for context but dropped — not wired to any step — so no alignment gap) ·
G7 Contract Schema PASS · G8 Template References PASS · G9 Intent Hash PASS ·
G10 Required Sections PASS · G11 Skill LTM Input Coverage PASS · G12 Standard Play Close PASS.
