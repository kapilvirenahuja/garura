# Spec: Flatten discover-product

## Problem

discover-product requires 3 separate invocations (draft, validate, lock) for what is a single decision: "I've reviewed this, it's good, lock it."

## Desired Outcome

Single invocation: `/discover-product "intent text"` → draft → brief → checkpoint → validate → lock → done.

## Changes

### intent.yaml

**Remove:** C2 (phase argument), C3 (artifact path for validate/lock)
**Remove:** F6 (artifact path doesn't exist)

**Modify:**
- C5: Max 5 domain dispatches per invocation (3 base + up to 2 cycle-back). 2 base when opportunity skipped. Doc-builder/repo-orchestrator exempt.
- C8: Checkpoint before each user-facing pause (brief review, validation review if blockers)
- C9: Max 1 re-draft for product type (budget constraint), 2 for library type
- C10: Brief produced after vision drafting (not "during DRAFT phase")
- F5: Blockers after max iterations (1 product, 2 library)
- F7: Pre-flight halt if product.yaml exists and is LOCKED
- S1: "after vision drafting" not "by DRAFT phase"
- S3: "shown inline before lock" not "from VALIDATE phase"

**Keep unchanged:** C1, C4, C6, C7, C11, C12, C13, F1, F2, F3, F8, F9, F10, S2, S4

### Workflow (10 steps, single flow)

1. **Assess Intent** — C12 signals, C13 type (play, no agent)
2. **Discover Opportunity** — conditional skip per C12 (product-strategist)
3. **Draft Vision** — writes product.yaml DRAFT (product-strategist)
4. **Generate Brief** — writes product-brief.html (doc-builder, utility)
5. **Checkpoint: Brief Review** — Tether/Vanish (C8, C10)
6. **Validate Vision** — run checklist (product-strategist)
7. **Checkpoint: Validation** — skip if clean, show issues if blockers (cycle-back per C9)
8. **Lock** — status DRAFT → LOCKED (play, no agent)
9. **Evidence** — write + self-commit
10. **Summary** — "Continue with /plan-roadmap"

### No skill changes needed

All 4 skills are stateless and phase-unaware.

### Status file

Remove `active_phase`. Flat 10-task sequence. Resume works identically.

## Execution

1. Update intent.yaml
2. `/create-play --build discover-product`
3. `/sync-claude`
