---
name: generate-business-review
description: Generate a PM-facing business review from any product artifact — plain language, no engineering details
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# generate-business-review

Model-invocable skill for generating audience-appropriate business reviews.

## Purpose

Read a product artifact (vision.md, roadmap.md, or backlog.md) and produce an audience-appropriate business review for Product Managers and Business Owners. MUST NOT include engineering implementation details — this is an audience-separation enforcement skill.

You DO create the business review. You do NOT decide what happens with it next.

Shared across discover-product, plan-roadmap, and manage-backlog recipes.

## Input

Receive from agent:
- `artifact_path` — (required) Full path to the product artifact to review
- `audience` — (optional, default: "Product Manager") Also accepts "Business Owner"
- `output_base` — (required) Base path for output, e.g., `.meridian/project/product/{slug}/reviews/`

## Process

1. **Read artifact:** Read `artifact_path`. Detect artifact type from filename and content (vision.md, roadmap.md, backlog/{epic}.md).

2. **Derive output path:** `{output_base}{artifact_filename_without_ext}-review.md`

3. **Compose business review using `templates/business-review.md`:**
   - **What It Is:** 2–3 sentence plain-language summary of what this artifact describes
   - **Why It Matters:** Business value — why this matters to the organization and customers
   - **User Journeys:** 2–3 narrative flows showing how target users will experience the product (NOT technical flows, NOT API flows)
   - **Business Rules:** Plain-language statements of constraints and decisions (e.g., "Users who have not verified email cannot access premium features") — NO code, NO SQL, NO data models
   - **Assumptions:** Key assumptions the artifact makes that the business needs to validate
   - **Out of Scope:** What the artifact explicitly excludes — business perspective

4. **Audience filter (critical):** Before writing, remove any content that is: code snippets, data models, architecture diagrams, API contracts, database schemas, infrastructure requirements, implementation patterns, technical dependencies. These MUST NOT appear in a business review.

5. **Write artifact:** Write business-review.md to output path. Status: DRAFT.

6. **Return output.**

## Output

```yaml
business_review:
  path: "{full path to review.md}"
  audience: "{audience value}"
  artifact_type: "vision|roadmap|backlog"
  summary: "{2-3 sentence plain-language summary}"
  key_decisions:
    - "{business decision documented in this artifact}"
  risks:
    - "{business-level risk}"
  next_steps:
    - "{what the business should do next}"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load template from: `templates/business-review.md`

## Constraints

- NEVER include: code snippets, data models, database schemas, API contracts, architecture patterns, infrastructure details, implementation dependencies
- NEVER write engineering-facing content — audience is product/business stakeholders only
- ALWAYS use plain language accessible to non-technical readers
- ALWAYS set Status: DRAFT in the written artifact
- ALWAYS include the IDD intent header (audience annotation: "For: Product Manager / Business Owner")

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
