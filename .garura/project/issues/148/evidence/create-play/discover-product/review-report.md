# Play Review: discover-product

**Reviewed:** 2026-03-25
**Issue:** #148
**Mode:** --review (read-only diagnostic)

## Gap Analysis

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | **GAP** | C9 (cycle-back limits) — classified as structural but no explicit structural element verifies it. The cycle-back logic is described in Step 7 prose but not enforced by a step eval. C5 (domain agent budget ≤5) — structural, enforced by agent boundary table + compilation metadata listing "1 domain + 2 utility". C11 (domain clarification) — artifact-verifiable, covered by SE-2. C12 (opportunity skip) — structural, enforced by Step 1 three-signal assessment. C16 (profile derivation) — artifact-verifiable, covered by SE-19, SE-20. C17 (profile validation before brief) — artifact-verifiable, covered by SE-21. **All other constraints covered.** |
| G2 FC Coverage | **PASS** | F1→SE-1, F2→SE-2, F3→SE-3, F5→SE-4, F7→SE-5, F8→SE-6, F9→SE-7, F10→SE-8, F11→SE-17, F12→SE-18, F13→SE-19, F14→SE-20. All 12 FCs have ≥1 SE-n. |
| G3 Scenario Coverage | **PASS** | S1→SCE-1, S2→SCE-2, S3→SCE-3, S4→SCE-4, S5→SCE-5, S6→SCE-6, S7→SCE-7. All 7 scenarios have ≥1 SCE-n. |
| G4 Skill Existence | **PASS** | `discover-product-opportunity` exists at skills/discover-product-opportunity/SKILL.md. `draft-product-vision` exists at skills/draft-product-vision/SKILL.md. `validate-product-vision` exists at skills/validate-product-vision/SKILL.md. `generate-product-brief` exists at skills/generate-product-brief/SKILL.md. |
| G5 Agent Existence | **PASS** | `product-strategist` exists at agents/product-strategist.md. `doc-builder` exists at agents/doc-builder.md. `repo-orchestrator` exists at agents/repo-orchestrator.md. |
| G6 Skill-Agent Alignment | **GAP** | `product-strategist` declares skills: discover-product-opportunity, draft-product-vision, validate-product-vision. All match play assignments. `doc-builder` declares skill: generate-product-brief. Matches. **However:** `product-strategist` does NOT list `draft-product-vision` as producing profiles. The skill was updated to accept `profile_knowledge_path` and derive profiles, but the agent's skill table (line 50) still describes it as "Create vision.md with Strategic Goals" — no mention of profile derivation. The agent will still invoke it correctly (it reads the SKILL.md), but the agent's own documentation is stale. |
| G7 Contract Schema | **GAP** | Step 3 contracts (both product-type and library-type) include `intent_path`, `stm_base`, `stm`, `task_id` — PASS. Step 2 contract includes all required fields — PASS. Step 4 contract includes all required fields — PASS. Step 6 contract includes all required fields — PASS. Step 9 contract includes all required fields — PASS. **However:** Step 3 contracts use `stm_base: ".meridian/project/product/"` which is the product base path, NOT the stm base path from config.yaml (`stm.base-path: .meridian/project/issues/`). This is intentional for product-scoped STM but technically diverges from the agent-contract.md schema which says `stm_base` is "resolved from core/config.yaml stm.base-path". This is a known pattern divergence for product-scoped plays. |
| G8 Template References | **PASS** | Templates referenced: `templates/checkpoint.md`, `templates/approval-prompt.md`, `templates/final-report.md` — all exist in the play's templates/ directory. LTM template `standards/templates/product-vision.md` exists at `core/components/memory/standards/templates/product-vision.md`. |
| G9 Intent Hash Drift | **PASS** | Compiled hash: `dcfa1abd0774e544e9b49530862fcacff9a7280e3a4fc2b8a27a56918ad068a5`. Current SHA-256: `dcfa1abd0774e544e9b49530862fcacff9a7280e3a4fc2b8a27a56918ad068a5`. Match. |
| G10 Required Sections | **GAP** | Frontmatter ✓, Header ✓, Compiled From ✓, Role ✓, Pre-flight ✓, Workflow ✓, Scenario Validation ✓, Evidence & Close ✓, Recovery ✓, Pause and Resume ✓, Compilation Metadata ✓. **However:** The Pause and Resume section says "Flat 10-task status file" but the actual status file JSON shows 13 tasks (assess-intent, discover-opportunity, draft-vision, derive-profiles, validate-profiles, generate-brief, checkpoint-brief, validate-vision, checkpoint-validation, pre-lock-resolution, lock-vision, evidence-self-commit, summary). The "10 steps" header in the Workflow section also says "10 steps, single flow" but there are now 12 steps (10 original + Step 3b which has derive + validate). Cosmetic inconsistency. |

## Detailed Findings

### G1 GAP: C9 (cycle-back limits) — No step eval
C9 defines cycle-back iteration limits (1 for product, 2 for library). The logic is described in Step 7 prose and the status file tracks `iteration_count`. But no SE-n eval explicitly verifies the limit is enforced. SE-4 (F5) covers the failure condition ("blocker-severity issues still present after max iterations") but doesn't independently verify the iteration count was respected. **Recommendation:** Add an artifact-verifiable eval that checks `iteration_count` against the type-dependent limit.

### G6 GAP: Agent documentation stale
`product-strategist.md` line 50 describes `draft-product-vision` as "Create vision.md with Strategic Goals". The skill now also derives three-axis profiles (PP, NFR, QP). The agent definition should update its skill table to reflect this expanded capability. **Recommendation:** Update agents/product-strategist.md skill table entry for draft-product-vision.

### G7 GAP: stm_base divergence (known pattern)
Product-scoped plays use `.meridian/project/product/` as stm_base instead of `.meridian/project/issues/`. This is the established pattern for discover-product and plan-roadmap — intentional, not a bug. The agent-contract.md says stm_base comes from `core/config.yaml stm.base-path` but product plays use `product.base-path` instead. **Recommendation:** Document this divergence in agent-contract.md or add a `product_base` field distinction.

### G10 GAP: Step count and task count mismatch
The workflow header says "10 steps" but the play now has 12 steps (Step 3b added derive + validate as separate logical steps). The Pause and Resume header says "Flat 10-task status file" but the JSON shows 13 task entries. **Recommendation:** Update headers to reflect actual step/task counts.

### Additional Finding: Step 3b NFR dimension labels don't match LTM
Step 3b presents NFR dimensions as "Performance Tier, Availability Tier, Security Tier, Compliance Burden, Data Sensitivity, Scalability Horizon, Observability Depth" but nfr-profile.md defines them as "Risk, Security, Performance, Availability, Compliance, Scalability, Data Sensitivity". The labels in Step 3b don't match the canonical LTM definitions. Similarly, QP labels in Step 3b ("Test Coverage Depth, Code Review Rigor, Documentation Depth, API Contract Stability, Deployment Safety, Accessibility Standard, Incident Response Readiness") don't match quality-profile.md definitions ("Testing Depth, Code Quality Standards, Documentation Level, CI/CD Maturity, Observability Maturity, Accessibility Standard, Security Testing"). **Recommendation:** Fix Step 3b dimension labels to match LTM canonical definitions exactly.

**Summary:** 7/10 PASS, 3 GAPs found (G1, G6, G10) + 1 additional label mismatch finding.

Run `/create-play --rebake discover-product` to fix identified gaps.
