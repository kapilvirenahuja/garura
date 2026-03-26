<!-- sync: source={parent_artifact_path} hash={hash} generated={timestamp} -->
---
intent: "{business review intent — populated at generation time}"
constraints:
  - "Audience: Product Manager / Business Owner only — no engineering details"
failure_conditions:
  - "Review contains implementation or technical architecture details"
---

# Business Review: {Artifact Name}

**For:** Product Manager / Business Owner
**Source Artifact:** {artifact_path}
**Status:** DRAFT
**Created:** {YYYY-MM-DD}

---

## What It Is

{2–3 sentence plain-language summary of what this artifact describes. Avoid technical jargon. A non-technical reader should be able to understand this paragraph.}

---

## Why It Matters

{Business value — why this product direction matters to the organization, customers, and market. Focus on outcomes and opportunities, not features.}

---

## User Journeys

### Journey 1: {Journey Name}

{Narrative description of how a target user experiences this product. Written as a story, not a technical flow. Example: "Maria is a small business owner who needs to track contractor payments..."}

### Journey 2: {Journey Name}

{Second user journey}

---

## Business Rules

The following rules govern how this product works:

1. **{Rule Name}:** {Plain-language statement — e.g., "Users can only access premium features after verifying their email address"}
2. **{Rule Name}:** {Plain-language statement}
3. **{Rule Name}:** {Plain-language statement}

---

## Assumptions

The following assumptions are made and need business validation:

1. {Assumption requiring business validation}
2. {Assumption requiring business validation}

---

## Out of Scope

The following are explicitly NOT covered:

- {Out of scope item — business perspective}

---

## Next Steps

1. {What the business / product team should do next}
2. {Who needs to review and approve this}

---

*Storage path: `.meridian/product/briefs/{artifact}-review.md`*
