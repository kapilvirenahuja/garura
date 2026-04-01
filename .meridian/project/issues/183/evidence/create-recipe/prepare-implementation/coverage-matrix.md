# Coverage Matrix — prepare-implementation

**Intent hash:** sha256:de5bb33e968d7144e5a2266530dceb919b18c5901086834785c4dd6a60449c59  
**Compiled:** 2026-03-31  
**Total constraints:** 32 | **Total failure conditions:** 23 | **Total scenarios:** 13  
**Step evals:** 31 (SE-01 through SE-31) | **Scenario evals:** 13 (SCE-01 through SCE-13)

---

## Constraint Coverage

| Constraint | Description (brief) | Eval(s) | Coverage |
|-----------|---------------------|---------|----------|
| C1 | product/roadmap nice-to-have | SE-01 (no halt on absence) | Pre-flight |
| C2 | single invocation | SE-31 | All phases |
| C3 | features.yaml no tech content | SE-14, SCE-05 | Step 11 + Scenario |
| C4 | tech.yaml aligns with architecture | SE-16, SCE-02 | Step 13 + Scenario |
| C5 | plan tasks map to file paths | SE-22, SCE-03 | Step 16 + Scenario |
| C6 | vertical slices end-to-end | SE-23, SCE-03 | Step 16 + Scenario |
| C7 | scenario completeness (pass/fail, automation) | SE-19, SCE-01 | Step 15 + Scenario |
| C8 | behavior coverage in scenarios | SE-21, SCE-01 | Step 15 + Scenario |
| C9 | compartmentalization | SE-25, SCE-04 | Step 16 + Scenario |
| C10 | five checkpoints | SE-09, SE-13, SE-15, SE-18, SE-26 | All checkpoints |
| C11 | audience separation | SE-14, SE-28, SCE-05 | Draft + Lock + Scenario |
| C12 | summary + feature gates | SE-20, SE-25, SCE-04, SCE-06 | Step 15, 16 + Scenario |
| C13 | exit gates observable | SE-24, SCE-11 | Step 16 + Scenario |
| C14 | auto-resolve issue/epic, halt on neither | SE-01 | Pre-flight |
| C15 | epic deps only with roadmap | SE-02 | Pre-flight |
| C16 | deep codebase understanding | SE-03, SE-05, SE-07 | Steps 2, 4, 7 |
| C17 | LTM findings + gaps documented | SE-07, SCE-07 | Step 6 + Scenario |
| C18 | user approval at checkpoints | SE-09, SE-13, SE-15, SE-18, SE-26 | All 5 checkpoints |
| C19 | issue-mapped STM paths | SE-30 | All phases |
| C20 | pre-lock resolution interview | SE-27, SCE-09 | Validate + Scenario |
| C21 | architecture discovery mode | SE-08, SCE-07 | Context assembly + Scenario |
| C22 | quality discovery mode | SE-08 | Context assembly |
| C23 | resolution hierarchy documented | SE-08 | Context assembly |
| C24 | blast radius before design | SE-10, SE-11, SE-13, SCE-07 | Blast radius + Checkpoint 1 |
| C25 | baseline tests for coverage gaps | SE-12, SCE-10 | Step 10 + Scenario |
| C26 | plan task DAG with depends_on | SE-22, SCE-11 | Step 16 + Scenario |
| C27 | file-level change specs in tech.yaml | SE-17, SCE-03, SCE-08 | Step 13 + Scenarios |
| C28 | three-tier scenarios | SE-19, SE-20, SCE-12 | Step 15 + Scenario |
| C29 | git history analysis | SE-06, SCE-10 | Step 5 + Scenario |
| C30 | STM storage on disk | SE-29 | Evidence phase |
| C31 | dual format for narrative artifacts | SE-03, SE-05, SE-06, SE-17, SE-22, SCE-13 | Multiple steps |
| C32 | agent separation (arch vs test) | SE-04, SE-11 | Steps 3, 9 |

**All 32 constraints covered.**

---

## Failure Condition Coverage

| FC | Description (brief) | Eval(s) | Coverage |
|----|---------------------|---------|----------|
| F1 | features.yaml contains tech content | SE-14, SCE-05 | Step 11 + Scenario |
| F2 | tech.yaml contradicts architecture | SE-16, SCE-02 | Step 13 + Scenario |
| F3 | plan slice not end-to-end | SE-23 | Step 16 |
| F4 | plan task missing file paths | SE-22, SCE-03 | Step 16 + Scenario |
| F5 | exit_gate references process not outcome | SE-24, SCE-11 | Step 16 + Scenario |
| F6 | scenario missing required fields | SE-19, SCE-12 | Step 15 + Scenario |
| F7 | product behavior without scenario | SE-21, SCE-01 | Step 15 + Scenario |
| F8 | plan contains scenario content | SE-25, SCE-04 | Step 16 + Scenario |
| F10 | fewer than 2 feature slices in DAG | SE-23 | Step 16 |
| F12 | artifacts locked without all checkpoints | SE-09, SE-13, SE-15, SE-18, SE-26 | All checkpoints |
| F13 | blast radius missed epic deps | SE-02 | Pre-flight |
| F14 | codebase understanding missed structures | SE-03, SE-05, SE-06, SCE-10 | Phase 1 steps |
| F15 | implicit codebase references in artifacts | SE-03, SE-17 | Steps 3, 13 |
| F16 | LTM not consulted or gaps not documented | SE-07 | Step 6 |
| F17 | locked with unresolved open questions | SE-27, SCE-09 | Validate + Scenario |
| F19 | no issue and no epic | SE-01 | Pre-flight |
| F20 | design before blast radius | SE-10, SE-13 | Change surface + Checkpoint 1 |
| F21 | coverage gaps without baseline tests | SE-12, SCE-10 | Step 10 + Scenario |
| F22 | plan tasks lack depends_on | SE-22, SCE-11 | Step 16 + Scenario |
| F23 | tech.yaml MODIFY lacks before/after | SE-17, SCE-08 | Step 13 + Scenario |
| F24 | baseline tests incomplete | SE-12, SCE-10 | Step 10 + Scenario |
| F25 | architecture context missing, discovery skipped | SE-08 | Context assembly |
| F26 | intermediate data through memory not disk | SE-29 | Evidence |

**All 23 failure conditions covered.**  
*(F9, F11, F18 were removed in intent redesign — not present in current intent.yaml)*

---

## Scenario Coverage

| Scenario | Persona | SCE | Coverage |
|----------|---------|-----|----------|
| S1 — feature-to-scenario traceability | Product Owner | SCE-01 | Scenario Validation |
| S2 — tech aligns with architecture context | Technical Architect | SCE-02 | Scenario Validation |
| S3 — single task is self-contained | Engineering Lead | SCE-03 | Scenario Validation |
| S4 — quality lead builds validation plan without scenario content | Quality Lead | SCE-04 | Scenario Validation |
| S5 — PM describes product without tech | Product Manager | SCE-05 | Scenario Validation |
| S6 — implementation sequence readable from summary | Technical Architect | SCE-06 | Scenario Validation |
| S7 — context assembly + blast radius sufficient for approval | Engineering Lead | SCE-07 | Scenario Validation |
| S8 — implementation agent needs only artifacts | Implementation Agent | SCE-08 | Scenario Validation |
| S9 — pre-lock resolution audit trail | Technical Architect | SCE-09 | Scenario Validation |
| S10 — blast radius fully characterized | Engineer | SCE-10 | Scenario Validation |
| S11 — DAG dependency order correct | Implementation Agent | SCE-11 | Scenario Validation |
| S12 — three-tier scenario purposes distinct | Quality Lead | SCE-12 | Scenario Validation |
| S13 — architecture-inference.md and tech.md contain diagrams | Technical Architect | SCE-13 | Scenario Validation |

**All 13 scenarios covered.**

---

## Workflow Structure

- **Structure:** A — Full checkpoint flow (5 checkpoints)
- **Maturity level:** L2 (compiled, intent-driven, deterministic)
- **Agent budget:** Exempt — heavyweight recipe, use as many dispatches as needed
- **Domain agents:** 3 (tech-architect, test-engineer, product-strategist)
- **Utility agents:** 2 (doc-builder, repo-orchestrator)
- **Total agent dispatches in compiled recipe:** 20 (Steps 2–22, not counting inline recipe steps)

---

## Agent Dispatch Summary

| Step | Agent | Type | Phase |
|------|-------|------|-------|
| Step 2 | tech-architect | domain | Context Resolution |
| Step 3 | test-engineer | domain | Context Resolution |
| Step 4 | tech-architect | domain | Context Resolution |
| Step 5 | tech-architect | domain | Context Resolution |
| Step 6 | tech-architect | domain | Context Resolution |
| Step 7 | tech-architect | domain | Context Assembly |
| Step 8 | tech-architect | domain | Blast Radius |
| Step 9 | test-engineer | domain | Blast Radius |
| Step 10 | test-engineer | domain | Blast Radius |
| Step 11 | product-strategist | domain | DRAFT Stage 1 |
| Step 12 | doc-builder | utility | DRAFT Stage 1 |
| Step 13 | tech-architect | domain | DRAFT Stage 2 |
| Step 14 | doc-builder | utility | DRAFT Stage 2 |
| Step 15 | test-engineer | domain | DRAFT Stage 3 |
| Step 16 | tech-architect | domain | DRAFT Stage 3 |
| Step 17 | doc-builder | utility | DRAFT Stage 3 |
| Step 18 | product-strategist | domain | VALIDATE |
| Step 20 | (recipe inline) | — | Auto-Lock |
| Step 21 | (recipe inline) | — | Evidence |
| Step 22 | repo-orchestrator | utility | Evidence & Close |

*Steps 0, 1, and 19 are recipe-inline (no agent dispatch).*  
*Steps 2-6 run in parallel (5 dispatches concurrent).*  
*Steps 15-16 run in parallel (2 dispatches concurrent).*
