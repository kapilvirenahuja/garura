---
name: generate-wireframes
description: Append a structured `## Wireframe` section to every existing screen Markdown file. Each wireframe describes layout, components, data placement, and interaction patterns per state — low-fidelity, NOT visual design. No generic descriptions allowed.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep, Edit
---

# generate-wireframes

Called by `designer` during `design-exp` Stage 4. For every existing screen MD file, appends a `## Wireframe` section describing layout and component placement per state.

## Purpose

Wireframes are the bridge from screen specification to buildable UI. This skill takes the state enumeration from `generate-screen-inventory` and adds concrete layout decisions: where does each component sit, what's above the fold, how does the layout respond, what transitions happen between states. The output is structured text, not visual design.

## Input

Receive from the designer agent:
- `screens_dir` (path, required) — `.meridian/product/ux/screens/` (contains MD files from Stage 2)
- `ltm_domain_taxonomy_path` (path, required) — for KB UX prose + wireframe hints (from the `Tradeoffs` and `Depth Spectrum` sections)

## Process

### 1. Glob screens

Glob `{screens_dir}/*.md` and load each screen file. Parse frontmatter (id, capability, name) and body sections.

### 2. For each screen, compose the Wireframe section

Read:
- The existing `## States` section (you need to know every state and its components/actions/data).
- The KB feature block for the screen's `capability` (grep the domain-taxonomy file and pull the `Tradeoffs` prose — it often hints at component priorities and layout).
- The KB feature block's `Inclusion` and `Depth Spectrum` sections to know which depth level is active.

Compose a `## Wireframe` section with these subsections:

```markdown
## Wireframe

### Layout pattern

<named layout pattern — e.g., "centered-card", "sidebar + main-content", "two-column with right-sticky", "full-width hero with below-fold list">

### Grid / regions

- Header: <what sits here>
- Main: <what sits here>
- Footer: <what sits here>
- (optional) Sidebar: <what sits here>
- (optional) Below-the-fold: <what sits here>

### Per-state wireframe

#### default

<free-form but specific layout description for the default state>

Visible components (in reading order):
1. <component 1 — where it sits>
2. <component 2 — where it sits>
3. ...

Interactive affordances:
- <action 1 — mapped to a visible component>
- <action 2>

Transition rules:
- On `<action>` → transition to `<next state>` with `<loading indicator type>`
- On error → show `<error-state component>` at `<position>`

#### loading

<layout description for the loading state — typically a skeleton or spinner overlay over the default layout>

#### error

<layout description for the error state — where the error banner sits, whether the form is still visible or replaced>

<repeat for every state the screen enumerates>

### Interaction patterns

- Form validation: <inline vs on-submit vs toast — pick ONE and justify>
- Loading indicators: <skeleton vs spinner vs full-page — pick ONE>
- Error message placement: <inline above form / inline per field / toast / banner>
- Empty-state treatment: <illustration + CTA / blank with button / list with placeholder rows>
- Transition animations: <none / fade / slide — low-fidelity decisions only, no timing specs>

### Accessibility wireframe notes

- Focus order: <ordered list of components the tab key visits>
- Landmark regions: <which ARIA landmarks wrap which parts>
- High-contrast considerations: <any layout choices that compact or expand in high-contrast mode>
```

### 3. Append to the existing screen MD file

Use the `Edit` tool to append the `## Wireframe` section after the existing `## Accessibility` section. Do NOT rewrite the file from scratch — only add the new section.

If a `## Wireframe` section already exists (idempotent run or retry), REPLACE it rather than duplicating.

### 4. Return output contract

```yaml
wireframes:
  screens_updated: <int>
  screens_skipped: <int>  # already had wireframes and no changes needed
  total_screens: <int>
  generic_phrase_rejections: <int>  # count of wireframes that failed the specificity check
```

## Constraints

- NEVER produce generic layout descriptions. "A form", "a page", "generic dashboard" — all blocking violations. Every layout is a named pattern or a specific composition.
- NEVER name components with vague terms. "A button" is invalid; `submit-button` or `cancel-button` is valid.
- NEVER invent new states. The wireframe section must cover exactly the states enumerated in the existing `## States` section.
- NEVER add visual design elements: colors, typography stacks, spacing in pixels, brand assets. Those are downstream visual-design concerns.
- NEVER write a new screen file. This skill only appends to existing files from `generate-screen-inventory`.
- ALWAYS pick concrete transition rules. "On click, transition to loading" is valid; "usually transitions" is not.
- ALWAYS keep the interaction pattern decision consistent across states for the same screen.
- ALWAYS read the KB feature block's `Tradeoffs` section for layout hints — that prose often captures industry-standard placement.
- Read screens and KB selectively via grep.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-screen-inventory`, `core/components/skills/validate-screen-coverage` |
