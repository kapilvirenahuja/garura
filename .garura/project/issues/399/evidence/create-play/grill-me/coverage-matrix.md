# Coverage Matrix — grill-me

## Constraints

| ID | Category | Covered By | Location |
|----|----------|------------|----------|
| C1 | artifact-verifiable | SE-1 | Step 3 Evals |
| C2 | artifact-verifiable | SE-2 | Step 3 Evals |
| C3 | artifact-verifiable | SE-3 | Step 3 Evals |
| C4 | artifact-verifiable | SE-4 | Step 3 Evals |
| C5 | pre-flight | PF4, PF5 | Pre-flight table |
| C6 | artifact-verifiable | SE-5 | Step 2 Evals |
| C7 | artifact-verifiable | SE-10 | Step 6 Evals |
| C8 | artifact-verifiable | SE-7 | Step 6 Evals |
| C9 | artifact-verifiable | SE-8 | Step 3 Evals |
| C10 | artifact-verifiable | SE-15 | Step 3 Evals |
| C11 | structural | Agent Boundary Table | Role section — table excludes specify/design/arch/craft-ice; no invocations of those plays anywhere in workflow |
| C12 | artifact-verifiable | SE-12 | Step 6 Evals |
| C13 | artifact-verifiable | SE-13 | Step 6 Evals |
| C14 | artifact-verifiable | SE-14 | Step 6 Evals |

## Failure Conditions

| ID | Covered By | Location |
|----|------------|----------|
| F1 | SE-1 | Step 3 Evals |
| F2 | SE-2 | Step 3 Evals |
| F3 | SE-3 | Step 3 Evals |
| F4 | SE-4 | Step 3 Evals |
| F5 | SE-5 | Step 2 Evals |
| F6 | SE-6 | Step 3 Evals |
| F7 | SE-7 | Step 6 Evals |
| F8 | SE-8 | Step 3 Evals |
| F9 | SE-9 | Step 3 Evals |
| F10 | SE-10 | Step 6 Evals |
| F11 | SE-11 | Step 2 Evals |
| F12 | SE-12 | Step 6 Evals |
| F13 | SE-13 | Step 6 Evals |
| F14 | SE-14 | Step 6 Evals |

## Success Scenarios

| ID | Covered By | Location |
|----|------------|----------|
| S1 | SCE-1 | Scenario Validation |
| S2 | SCE-2 | Scenario Validation |
| S3 | SCE-3 | Scenario Validation |
| S4 | SCE-4 | Scenario Validation |
| S5 | SCE-5 | Scenario Validation |
| S6 | SCE-6 | Scenario Validation |
| S7 | SCE-7 | Scenario Validation |
| S8 | SCE-8 | Scenario Validation |
| S9 | SCE-9 | Scenario Validation |
| S10 | SCE-10 | Scenario Validation |

## Recovery Entries

| ID | For Failure | Embedded |
|----|-------------|----------|
| REC1–REC14 | F1–F14 (1:1) | Recovery section |

## Required Sections (G10)

| Section | Present |
|---------|---------|
| Frontmatter | ✓ |
| Header | ✓ |
| Compiled From + Hash Guard | ✓ |
| Role + Agent Boundaries | ✓ |
| Pre-flight | ✓ |
| Task DAG | ✓ |
| Workflow | ✓ |
| Scenario Validation | ✓ |
| Recovery | ✓ |
| Evidence & Close (Standard Play Close block, lint anchors present) | ✓ |
| Pause and Resume | ✓ |
| Compilation Metadata | ✓ |

## Skill LTM Input Coverage (G11)

| Skill | Required Inputs | Discovery instruction in play step |
|-------|-----------------|-----------------------------------|
| resolve-grill-anchor | anchor_kind, anchor_target, product_base, stm_base, issue, output paths | Step 2 JSON contract names all of them |
| check-grill-tensions | anchor_lock_path, round_synthesis_text, round_id, prior_tensions_resolved, output_path | Step 3 sub-loop JSON contract names all of them |
| apply-shape-changes | anchor_lock, touchpoints, session_state, product_base, locked_shape, bundle_preview, phase, issue, branch, approval_decision (phase 2) | Steps 4 + 6 JSON contracts name all of them |
| manage-issue | (called inside apply-shape-changes) | covered by apply-shape-changes skill |

## Verdict

- All 14 failure conditions covered by step evals.
- All 12 artifact-verifiable constraints (out of 14 total) covered by step evals.
- C5 (pre-flight) covered by PF4 + PF5.
- C11 (structural) covered by the agent boundary table and the absence of any downstream-play invocation.
- All 10 success scenarios covered by scenario evals.
- All 14 recovery entries embedded.
- All 12 required sections present.
- Standard Play Close lint anchors present (opener + closer).
- Every skill's required LTM inputs are supplied via play-step JSON contracts.

**Compilation passes coverage. SKILL.md is shippable.**
