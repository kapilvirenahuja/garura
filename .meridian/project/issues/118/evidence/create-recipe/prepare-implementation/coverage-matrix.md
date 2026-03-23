# Coverage Matrix — prepare-implementation (rebaked)

Intent hash: `d14def0aa9dc2282179024d37abe00c33b4d273464ccfc6908bbf40cf4c1d6bf`
Generated: 2026-03-24

## 1. Failure Conditions → Step Evals

Every F-n must have at least one step eval that detects it.

| F-n | Description | Step Eval(s) | Covered |
|-----|-------------|-------------|---------|
| F1 | features.yaml contains technology names — audience collision | SE-F1, SE-F3 | YES |
| F2 | architecture.yaml uses vague technology references | SE-A1 | YES |
| F3 | execution_order entry does not deliver end-to-end capability | SE-P2 | YES |
| F4 | plan.yaml scope item lacks file path | SE-P1 | YES |
| F5 | Entry has no exit gate or exit gate references process steps | SE-P5 | YES |
| F6 | Scenario missing required fields | SE-S1 | YES |
| F7 | Product behavior has no corresponding scenario | SE-S3 | YES |
| F8 | plan.yaml contains scenario descriptions or content | SE-P3 | YES |
| F10 | plan.yaml has fewer than 2 execution_order entries | SE-P6 | YES |
| F12 | Artifacts produced without passing all human review checkpoints including dependency approval | SE-CK1, SE-CK2, SE-CK3, SE-CK4 | YES |
| F13 | Unmet epic dependencies did not block artifact generation | SE-CR3 | YES |
| F14 | Codebase scan missed technology dependencies present in repository | SE-CR1 | YES |
| F15 | Output artifacts contain implicit codebase references instead of explicit values | SE-P7 | YES |
| F16 | LTM not consulted or findings/gaps not documented | SE-CR2 | YES |

**Result: 14/14 failure conditions covered.**

## 2. Artifact-Verifiable Constraints → Step Evals

Every artifact-verifiable C-n must have at least one step eval.

| C-n | Description | Step Eval(s) | Covered |
|-----|-------------|-------------|---------|
| C3 | features.yaml defines behaviors only — no technology choices | SE-F1, SE-F2, SE-V1 | YES |
| C4 | architecture.yaml names concrete technologies | SE-A1, SE-V1 | YES |
| C5 | Every plan.yaml scope item maps to file paths | SE-T1, SE-P1, SE-V1 | YES |
| C6 | Every execution_order entry delivers end-to-end capability | SE-P2, SE-V1 | YES |
| C7 | Every scenario has description, expected_behavior, pass_criteria, automation | SE-S1, SE-S2, SE-V1 | YES |
| C8 | Every product behavior covered by at least one scenario | SE-F2, SE-S3, SE-V1 | YES |
| C9 | Scenarios compartmentalized from implementer | SE-P3, SE-V1 | YES |
| C11 | Each artifact serves distinct audience — no collision | SE-F3, SE-A2, SE-T2, SE-S4, SE-V1 | YES |
| C12 | plan.yaml summary with scenario counts; feature_gates in scenarios.yaml | SE-P4, SE-S4, SE-V1 | YES |
| C13 | Every execution_order entry has exit gate with observable outcomes | SE-P5, SE-V1 | YES |
| C19 | Prior-epic artifacts are read-only inputs, not modification targets | SE-CR5, SE-A3, SE-L1 | YES |

**Result: 11/11 artifact-verifiable constraints covered.**

## 3. Scenarios → Scenario Evals

Every S-n must have a corresponding SCE-n.

| S-n | Persona | Scenario Eval | Covered |
|-----|---------|--------------|---------|
| S1 | Product Owner — behavior-to-scenario traceability | SCE-1 | YES |
| S2 | Technical Architect — technology stack implements product behaviors | SCE-2 | YES |
| S3 | Engineering Lead — single-feature-slice implementability | SCE-3 | YES |
| S4 | Quality Lead — feature-gated validation plan | SCE-4 | YES |
| S5 | Product Manager — technology-free features.yaml | SCE-5 | YES |
| S6 | Technical Architect — plan.yaml summary and scenario accounting | SCE-6 | YES |
| S7 | Engineering Lead — dependency resolution report sufficiency | SCE-7 | YES |
| S8 | Implementation Agent — artifacts sufficient without external scanning | SCE-8 | YES |

**Result: 8/8 scenarios covered.**

## 4. Pre-flight Constraints → Pre-flight Table

Every pre-flight C-n must appear in the SKILL.md pre-flight table.

| C-n | Description | Pre-flight Check | Covered |
|-----|-------------|-----------------|---------|
| C1 | Requires locked product.yaml and locked roadmap.yaml | "Locked product.yaml exists" + "Locked roadmap.yaml exists" | YES |
| C14 | Target epic must exist in locked roadmap.yaml | "Target epic exists in locked roadmap.yaml" | YES |
| C15 | All epic dependencies must be prepared or built | "Epic dependencies resolved (prepared or built)" | YES |

**Result: 3/3 pre-flight constraints covered.**

## 5. Structural Constraints → Recipe Structure

Every structural C-n must be enforced by the recipe's workflow structure.

| C-n | Description | Structural Enforcement | Covered |
|-----|-------------|----------------------|---------|
| C2 | Single invocation per epic — no --phase flag | Recipe has no --phase argument; single flow from context resolution through lock | YES |
| C10 | Staged human review with three checkpoints + dependency approval | Steps 5, 8, 12, 16 are checkpoint steps (dependency approval + 3 artifact checkpoints) | YES |
| C16 | Codebase scan always runs — no greenfield/brownfield distinction | Step 2 always executes; no conditional skip logic | YES |
| C17 | LTM read with findings and gaps documented | Step 3 always executes after Step 2 | YES |
| C18 | Dependency resolution report requires Tether before artifact generation | Step 5 is a Tether gate; Step 6 (draft-features) depends on Step 5 Tether | YES |

**Result: 5/5 structural constraints covered.**

## 6. Summary

| Category | Total | Covered | Gaps |
|----------|-------|---------|------|
| Failure conditions (F1-F8, F10, F12-F16) | 14 | 14 | 0 |
| Artifact-verifiable constraints (C3-C9, C11-C13, C19) | 11 | 11 | 0 |
| Scenarios (S1-S8) | 8 | 8 | 0 |
| Pre-flight constraints (C1, C14, C15) | 3 | 3 | 0 |
| Structural constraints (C2, C10, C16, C17, C18) | 5 | 5 | 0 |
| **TOTAL** | **41** | **41** | **0** |

**Coverage: 41/41 — COMPLETE. No gaps detected.**
