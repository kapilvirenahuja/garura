---
name: draft-design-system
description: Interview a product owner/designer for visual identity inspirations (color mood, brand adjectives, font character, reference products), then author a Design System markdown artifact at {product_base}experience/design-system.md with design tokens, font recommendations, palette, and inspiration references. Use this skill whenever the /design play reaches Step 5b DS authoring or when any workflow needs a fresh product DS document.
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-design-system

Model-invocable skill that produces the product-level Design System document. Called by the Designer agent during `/design` Step 5b — between Checkpoint 2 (screen inventory review) and Step 6 (map user flows).

## Purpose

The Design System captures the visual identity of the product at the token level: color palette ranges, typography character, spacing scale guidance, and inspiration references. It is a sibling artifact to wireframes — not an input to wireframe generation. Wireframes remain structural ASCII; the DS is the visual surface consumed by downstream visual-design and implementation work.

Before this skill existed, /design produced only structural wireframes with no visual token record, leaving color, type, and brand decisions undocumented and forcing downstream implementors to re-derive them from scratch. This skill closes that gap by running a structured user interview and authoring `design-system.md` at a well-known path.

## Input

Receive from the Designer agent:

- `screens_dir` (path, required) — `{product_base}experience/screens/` directory containing the screen inventory produced by Stage 3. The skill reads screen slugs to understand the surface area (context only — not for generating pixel specs).
- `personas_path` (path, required) — `{product_base}experience/personas.md`. Read to understand user archetypes and their brand expectations.
- `scope_path` (path, required) — `.meridian/product/scope/scope.yaml`. Provides the product name and selected capabilities for context framing.
- `mvp_recommendation_path` (path, required) — `.meridian/product/scope/mvp-recommendation.md`. Informs tone and positioning of the design identity.
- `user_provided_path` (path, optional) — `{product_base}user-provided/`. When present, the skill scans for any existing brand hints (project-brief.md, grounding-questions.md, or any *.md file that mentions color, font, or brand) before opening the interview. Prevents re-asking questions the user already answered during PM-interview.
- `design_system_path` (path, required) — target write path for `design-system.md`, typically `{product_base}experience/design-system.md`.
- `decision_manifest_path` (path, required) — target write path for `decision-manifest-draft-design-system.yaml`, written alongside the DS artifact.

## Output

Return to caller:

- `design_system_path` — absolute path to the written `design-system.md`.
- `decision_manifest_path` — absolute path to the written `decision-manifest-draft-design-system.yaml`.
- `decisions_recorded` — integer count of decision entries in the manifest. Must be ≥ 1 when any token was inferred (F2 fires otherwise).

## Process

### 1. Load context

Read `scope_path` to extract the product name and selected capabilities.
Read `personas_path` to understand user archetypes.
Read `mvp_recommendation_path` to understand primary use cases and intended positioning.

### 2. Scan user-provided/ for existing inspirations

If `user_provided_path` is supplied, read all *.md files under it. Extract any brand signals already present:

- Color mentions (mood words, example brands, industry palette references)
- Font mentions (serif vs. sans, characteristics like "clean", "warm", "technical")
- Brand adjectives (e.g., "trustworthy", "playful", "enterprise-grade")
- Reference products or design systems the user has already named

Mark each pre-seeded item as `source: user-provided` in the manifest. Do NOT ask the user to re-specify anything that was already found in user-provided/.

### 3. Interview user on visual identity

Open a structured interview for any dimensions not already seeded from user-provided/. Ask only the questions whose answers were not pre-seeded. Cover all four dimensions:

**Color mood** — "What feeling should the primary color convey? (e.g., calm and trustworthy, energetic, clinical, warm, bold)" — record the mood word(s) and any reference brands or palettes named.

**Brand adjectives** — "List 3–5 adjectives that describe the product's personality." — record verbatim.

**Font character** — "What character should the typography have? (e.g., clean sans-serif for readability, humanist for warmth, technical mono for precision, editorial serif)" — record the character descriptor and any reference typefaces named.

**Reference products** — "Name 1–3 products or apps whose visual style you admire." — record the names and, if the user explains, what specifically they like.

For each answer received, record a decision entry with tier=`mid` and grounding_source=`user-interview`.

### 4. Author design-system.md

Write `design-system_path` with the following sections:

```
# Design System — {product_name}

## Palette

Color ranges and mood grounding (no specific hex codes unless the user named an inspiration source). Example: "Primary — calm mid-blue range (inspired by {reference_product}); Accent — warm amber range".

## Typography

Font character and category recommendations. Name the character descriptor and, if the user named reference typefaces, list them as inspirations. No specific font file names required — character and category are sufficient at this stage.

## Tokens

Named token stubs for spacing scale, radius, and elevation. Values are ranges or descriptors, not fixed rem/px values. Example: "spacing-sm: tight (suited for dense data views); spacing-md: comfortable (primary content rhythm); radius-card: soft (rounded corners, not pill-shaped)".

## Inspirations

Reference products and brands named by the user during the interview or found in user-provided/. Include what specifically was admired when the user provided that context.

## Open Questions

Any visual identity dimension that the interview did not resolve — surfaces for the orchestrator's decision-surfacing flow. Format: numbered list of unanswered questions.
```

Do NOT include:
- Specific hex codes (palette ranges and mood descriptors only, unless a reference product was named and the color is an inspiration citation, not a spec)
- CSS variable names or rem/px values anywhere in the file
- Font-family declarations or specific typeface file names
- Spacing grid in pixels or rem

### 5. Write the decision manifest

Write `decision_manifest_path`. Each entry:

```yaml
decisions:
  - id: D-ds-<n>
    dimension: "palette" | "typography" | "tokens" | "inspirations"
    decision: "<what was decided>"
    tier: "high" | "mid" | "low"
    grounding_source: "user-provided" | "user-interview" | "no source"
    recommendation: "<brief rationale>"
    alternatives_considered: [<string>, ...]
```

Record an entry for every inferred or interview-derived token. Pre-seeded items from user-provided/ use tier=`high`, grounding_source=`user-provided`. Interview responses use tier=`mid`, grounding_source=`user-interview`. Any dimension that produced a recommendation without a user response uses tier=`low`, grounding_source=`no source` and appears in the DS under Open Questions.

## Constraints

**C1: No pixel-level specs — token ranges only.** Do not write specific hex codes (outside Inspirations section citation), rem values, px values, CSS variable names, or specific font-family declarations. Token ranges and descriptors are the correct fidelity. Implementation-level specs belong to downstream implementation plays, not to /design.

**C2: DS does NOT flow into wireframe ASCII.** The Design System artifact is a sibling to the screen files, not an input to wireframe generation. Screen ASCII blocks remain structural (layout, hierarchy, placement). No color, typography, or spacing token from the DS is embedded in wireframe blocks.

**C3: User-invocable=false — model-invocable only.** This skill is called exclusively from the Designer agent during /design Step 5b. Direct user invocation is a protocol violation.

## Failure Conditions

**F1: design-system.md absent or empty.** The primary artifact must exist and have non-empty content in all five sections (Palette, Typography, Tokens, Inspirations, Open Questions) when the skill completes.

**F2: DS contains pixel-level or implementation-level specs.** Specific CSS variable names, specific rem/px values, or specific hex codes outside the Inspirations section are blocking failures. Token-range descriptors and mood words are the correct level.

## Success Scenarios

**S1: Fresh product, no prior DS — interview fills DS from scratch.**

Given: `user_provided_path` is absent or contains no brand hints. The user answers all four interview dimensions.
Then: The skill produces a `design-system.md` with all five sections populated from interview responses. All manifest entries carry `grounding_source: user-interview`, tier=`mid`. No Open Questions remain. `decisions_recorded` ≥ 4.

**S2: Existing user-provided brief with brand hints — inspirations pre-populated, interview fills gaps.**

Given: `user_provided_path` contains a project-brief.md that mentions "trustworthy blue tones" (color mood), "professional and approachable" (brand adjectives), and "Linear, Notion" (reference products). Font character is not mentioned.
Then: The skill pre-seeds Palette, Inspirations, and Brand Adjectives from the brief (grounding_source=`user-provided`, tier=`high`). The interview asks only about font character. The DS is complete after the single interview exchange. `decisions_recorded` ≥ 4 (3 pre-seeded + 1 interview).

## References

- User-provided source files: `{product_base}user-provided/` — scanned in Step 2 for pre-seeding.
- Sibling skill: `compile-design-spec` — consumes `design_system_path` as a required input in Step 9 of /design.
- Intent source (source of truth): `core/components/skills/draft-design-system/reference/intent.yaml`. Change behaviour there, not in SKILL.md.
