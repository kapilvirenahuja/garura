# Recipe Review: discover-product

**Reviewed at:** 2026-03-06T20:30:00+0530
**Mode:** Review (read-only diagnostic)

## Gap Analysis Results

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | PASS | All 11 constraints (C1-C11) referenced in pre-flight checks, step evals, or recipe body. C4 (delegation) enforced structurally via Role/Forbidden section. C6 (path scope) referenced in Path Resolution section. |
| G2 FC Coverage | PASS | All 7 failure conditions (F1-F3, F5-F7, F9) covered by step evals: F1→SE-1,SE-2; F2→SE-3; F3→SE-4; F5→SE-6; F6→SE-7; F7→SE-8,SE-9,pre-flight; F9→SE-11 |
| G3 Scenario Coverage | PASS | All 3 scenarios covered: S1→SCE-1; S2→SCE-2; S3→SCE-3 |
| G4 Skill Existence | PASS | All 4 skills exist: discover-product-opportunity, draft-product-vision, validate-product-vision, generate-product-brief |
| G5 Agent Existence | PASS | All 3 agents exist: product-strategist, doc-builder, repo-orchestrator |
| G6 Skill-Agent Alignment | PASS | product-strategist declares discover-product-opportunity, draft-product-vision, validate-product-vision. doc-builder declares generate-product-brief. All recipe assignments match agent inventories. |
| G7 Contract Schema | PASS | All step contracts contain required fields: intent_path, stm_base, stm, task_id |
| G8 Template References | PASS | Both referenced templates exist: standards/templates/product-vision.md, standards/templates/product-brief.html |
| G9 Intent Hash Drift | GAP | Compiled hash: sha256:52bd10e76c70b68af3051b388829632bba6d9282ca8b9b295b791740019b5bf9 — Current hash: sha256:029c7e7f74d1765769179cf9fd6afc3293a280949df0754b33470e5f77f8299f — Intent was modified (removed C10/F4/F8, renumbered C11→C10/C12→C11, updated C5) but recipe was not recompiled. |
| G10 Required Sections | PASS | All required sections present: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow (DRAFT/VALIDATE/LOCK), Scenario Validation, Pause and Resume, Compilation Metadata |

**Summary:** 9/10 PASS, 1 GAP found

## Observations (not GAPs, but noted)

1. **Stale text — "business review" references:** Recipe header (line 10) still mentions "business review" in the operational description. Role section (line 24) Forbidden list still includes "business review generation." These are remnants from before the business-review removal and should be cleaned on rebake.

2. **C5 intent/recipe mismatch:** Intent C5 states "Maximum 2 distinct agent calls (1 product-strategist, 1 doc-builder)" but the DRAFT phase dispatches product-strategist twice (Step 1: discover-opportunity, Step 2: draft-vision) + doc-builder once = 3 dispatches total, 2 distinct agents. The parenthetical "(1 product-strategist, 1 doc-builder)" is inaccurate — should be "(2 product-strategist, 1 doc-builder)" with the max being 3 dispatches. This is an intent accuracy issue, not a recipe structural issue.

---

Run `/create-recipe --rebake discover-product` to fix identified gaps.
