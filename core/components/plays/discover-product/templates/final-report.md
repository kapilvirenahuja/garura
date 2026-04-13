# Product Discovery Complete

**Phase:** {draft|validate|lock}

## Overview

| Field | Value |
|-------|-------|
| Product | {product_name} |
| Slug | {slug} |
| Phase Completed | {draft|validate|lock} |

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Product Vision | {vision_path} | {DRAFT|LOCKED} |
| Business Review | {business_review_path} | DRAFT |

## Vision Highlights (DRAFT/LOCK)

- **Problem:** {one-sentence problem statement}
- **Target Users:** {count} personas
- **Strategic Goals:** {count} goals defined
- **Competitors Mapped:** {count}

## Validation Results (VALIDATE)

- **Completeness Score:** {score}/100
- **Ready for Lock:** {Yes / No — {count} blocker issues remain}

## Next Steps

**After DRAFT:**
1. Review vision.md at {path}
2. Run `/discover-product --phase validate --artifact {vision_path}` to validate
3. Share business review at {business_review_path} with stakeholders

**After VALIDATE (passing):**
1. Run `/discover-product --phase lock --artifact {vision_path}` to lock the vision
2. Continue with `/plan-roadmap --phase draft --vision {vision_path}` to build the roadmap

**After LOCK:**
1. Vision is locked at {path}
2. Continue with `/plan-roadmap --phase draft` to build the roadmap from this vision
