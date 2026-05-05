# Integration Test RERUN: discover-product Play (DRAFT phase)

**Date:** 2026-02-25
**Type:** Regression test after DEFECT-1 and DEFECT-2 fixes
**Play:** discover-product --phase draft
**Test Prompt:** "AI-powered commission tracking and dispute resolution platform for B2B SaaS marketplaces connecting sellers and buyers with transparent revenue sharing"

---

## Defect Fixes Under Test

| Defect | Fix Applied | File Changed |
|--------|-------------|--------------|
| DEFECT-1: STM at global path | Added path resolution rule to play, updated C6 to say "relative to project root" | `discover-product/SKILL.md`, `reference/intent.yaml` |
| DEFECT-2: Multi-intent incomplete | Explicit `Intents:` block with `intent_count` + `dependency` in play Step 2. Strengthened agent multi-intent recognition with detection signals and "completing only first intent is a failure" rule | `discover-product/SKILL.md`, `product-strategist.md` |

---

## Test Execution Trace

### Step 0: Pre-flight
- **Result:** PASS (same as first run)

### Step 1: Discover Opportunity (product-strategist call 1/2)
- **Result:** PASS
- **Domain identification:** B2B SaaS / Marketplace Revenue Infrastructure (high confidence)
- **market_context returned:** 3 personas, 5 competitors, TAM/SAM/SOM, 4 differentiators, 5 risks
- **Duration:** ~57s

### Step 2: Draft Vision + Business Review (product-strategist call 2/2)
- **Result:** PASS — BOTH intents completed in single invocation
- **DEFECT-2 VERIFIED FIXED:**
  - Agent received explicit `Intents:` block with `intent_count: 2` and `dependency` field
  - Agent executed intent 1 (draft-product-vision) → wrote vision.md (11.3KB)
  - Agent executed intent 2 (generate-business-review) → wrote vision-review.md (11.3KB)
  - Both artifacts written before returning to caller
  - No resume required
- **Duration:** ~219s (both skills in single call)

### Step 2 Path Verification:
- **DEFECT-1 VERIFIED FIXED:**
  - vision.md at: `{project_root}/.Garura/project/product/ai-commission-tracking-b2b-saas/vision.md` ✓
  - vision-review.md at: `{project_root}/.Garura/project/product/ai-commission-tracking-b2b-saas/reviews/vision-review.md` ✓
  - Global `~/.Garura/project/product/ai-commission-tracking-b2b-saas/`: DOES NOT EXIST ✓
  - Artifacts are project-local, not global

---

## Artifacts Produced

| Artifact | Path (project-local) | Size | Status |
|----------|---------------------|------|--------|
| vision.md | `.Garura/project/product/ai-commission-tracking-b2b-saas/vision.md` | 11.3KB | DRAFT |
| vision-review.md | `.Garura/project/product/ai-commission-tracking-b2b-saas/reviews/vision-review.md` | 11.3KB | DRAFT |

---

## Constraint Compliance (retest)

| Constraint | Result | Notes |
|------------|--------|-------|
| C1: Intent >5 words | PASS | 21 words |
| C2: Valid phase | PASS | draft |
| C4: Delegate to product-strategist | PASS | 2 agent calls |
| C5: Max 2 agent calls | PASS | 2 used, no resume needed |
| C6: Artifact path project-relative | **PASS** | Previously FAIL — now fixed |
| C7: Strategic Goals, no OKRs | PASS | Vision uses "Strategic Goals" |
| C10: No engineering in review | PASS | Business review is plain language |
| C11: Intent string first line | PASS | Both calls start with Intent/Intents |
| C12: Domain classification | PASS | High confidence, no clarification needed |

---

## Comparison: First Run vs Rerun

| Check | First Run | Rerun |
|-------|-----------|-------|
| Artifact path | FAIL (global ~/.Garura/) | PASS (project-local .Garura/) |
| Multi-intent completion | FAIL (only vision, required resume) | PASS (both artifacts in single call) |
| Agent calls used | 2 + 1 resume | 2 (clean) |
| Total constraint compliance | 9/10 | 10/10 |

---

## Test Verdict

**PASS — both defects verified fixed**

- DEFECT-1 (path resolution): Artifacts created at project-local `.Garura/`, not global `~/.Garura/`
- DEFECT-2 (multi-intent): Both skills executed in single agent call with no resume needed
