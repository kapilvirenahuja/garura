---
name: generate-wireframes
description: Append a structured `## Wireframe` section to every existing screen Markdown file. Each wireframe describes layout, components, data placement, and interaction patterns per state — low-fidelity, NOT visual design. No generic descriptions allowed.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep, Edit
---

# generate-wireframes

> **Defect 23 — Decision Surfacing Discipline (DSD):** This skill emits a `decision-manifest.yaml` alongside its primary artifact. Every inferred decision produced during execution is recorded in the manifest with tier, grounding source, recommendation, and alternatives. The orchestrator drives the tiered surfacing flow after this skill completes.

Called by `designer` during `design` Stage 4. For every existing screen MD file, appends a `## Wireframe` section describing layout and component placement per state.

## Purpose

Wireframes are the bridge from screen specification to buildable UI. This skill takes the state enumeration from `generate-screen-inventory` and adds concrete layout decisions: where does each component sit, what's above the fold, how does the layout respond, what transitions happen between states. The output is structured text, not visual design.

## Input

Receive from the designer agent. All paths resolve against `{product_base}` supplied by the play via the JSON contract — do not hard-code `.garura/product/` or assume a working directory.

- `screens_dir` (path, required) — typically `{product_base}experience/screens/` (contains MD files from Stage 2)
- `product_research_path` (path, required) — `{product_base}research/` (the product's frozen domain library per rules/product.md Rule 15 Pull-to-Product). This skill reads UX prose + wireframe hints (from each domain's `Tradeoffs` and `Depth Spectrum` sections) from the product's research folder ONLY — never directly from `core/components/memory/knowledge/domain/`. Passing `ltm_domain_taxonomy_path` is a structural failure (design intent.yaml F13).
- `decision_manifest_path` (path, required) — path for the `decision-manifest.yaml` output, written alongside the updated screen files (e.g., `{product_base}experience/decision-manifest-generate-wireframes.yaml`). Exact path is passed by the calling agent.

## Process

Resolve each input path by substituting `{product_base}` from the incoming JSON contract; do not re-prefix with `.garura/product/` or assume a working directory.

### 1. Glob screens

Glob `{screens_dir}/*.md` and load each screen file. Parse frontmatter (id, capability, name) and body sections.

### 2. For each screen, compose TWO blocks — visual wireframe (top) and layout spec (bottom)

Read:
- The existing `## States` section (you need to know every state and its components/actions/data).
- The domain-taxonomy file for the screen's capability from `product_research_path` (pull the `Tradeoffs` prose and the `Depth Spectrum` active tier for layout hints).

The screen file's skeleton — emitted by `generate-screen-inventory` in Stage 2 — has a `## Wireframe` placeholder directly under the H1, followed by the annotation sections (Purpose, Personas, States, Navigation, Accessibility). This skill produces **two outputs per screen**:

1. **Visual wireframe content** — replaces the `## Wireframe` placeholder at the TOP of the file. This is the human-facing glance-value surface: a reader opens the file and SEES the layout before reading any prose. One Unicode/ASCII box-drawing block per state enumerated in the existing `## States` section.
2. **Layout spec content** — appended as a NEW `## Layout Spec` section at the BOTTOM of the file (after `## Accessibility`). This is the machine-facing surface: detailed layout pattern, component inventory, per-state spec, interaction patterns, data binding, accessibility notes. Downstream skills (e.g., arch) consume this section.

#### 2a. Compose the visual wireframe block (top-of-file)

One fenced code block per state using `text` as the language hint. Each block is a Unicode/ASCII box-drawing representation of the screen's layout in that state. Every component from the state's `Components:` list must be visible in the diagram (positionally) or in a single-line caption below the box. After the box, a single-line caption states the layout pattern name and one distinguishing feature.

```markdown
## Wireframe

### State: default

<fenced code block with Unicode/ASCII box-drawing — one screen layout per state.
Use box-drawing characters: `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼` and safe fills.
Keep every line under 80 columns so the block renders in narrow terminals.>

Layout: centered-card    Viewport: desktop ≥1024

### State: loading

<fenced code block>

State: loading    Components: progress-spinner, disabled-submit

### State: error

<fenced code block>

State: error-<reason>    Recovery: <retry path>

<repeat for every state the screen enumerates>
```

**Box-drawing rules:**
- Use only ASCII-safe Unicode box-drawing characters. No emoji inside the box (emoji outside the box in captions is allowed).
- Every line of the same box has identical length (pad with spaces). The box must be a rectangle.
- Form fields are drawn as nested rectangles inside the card. Buttons are drawn as filled rectangles with the label inside.
- Disabled components are marked with a parenthetical `(disabled)` tag in the line below, not by altering the drawing.
- Spinners are drawn as `⟳` or `◯` inside the button rectangle.
- State badges (success check, error warning) use `✓`, `⚠`, `✗` as single-character markers.
- Component count per screen per state should match the state's declared `Components:` list in the annotation body.
- No hex codes, no pixel/rem/em values, no font family names — the box is low-fidelity structural only.

#### 2b. Compose the layout spec block (bottom-of-file)

```markdown
## Layout Spec

### Layout pattern

<named layout pattern — e.g., "centered-card", "sidebar + main-content", "two-column with right-sticky", "full-width hero with below-fold list">

### Grid / regions

- Header: <what sits here>
- Main: <what sits here>
- Footer: <what sits here>
- (optional) Sidebar: <what sits here>
- (optional) Below-the-fold: <what sits here>

### Component inventory

| Component | Abstract name | Purpose |
|---|---|---|
| ... | `submit-button` | Commit the active form |

### Per-state spec

#### default

- Layout: <concrete placement narrative>
- Components visible (reading order): <ordered list>
- Data fields rendered: <what state the view reads>
- Actions available: <button/link names + targets>
- Transitions: <on-action → next state with indicator>

#### loading

<layout spec for loading — typically a skeleton or spinner overlay over the default layout>

#### error

<layout spec for error — where the banner sits, whether the form is still visible or replaced>

<repeat for every state>

### Interaction patterns

- Form validation: <inline vs on-submit vs toast — pick ONE and justify>
- Loading indicators: <skeleton vs spinner vs full-page — pick ONE>
- Error message placement: <inline above form / inline per field / toast / banner>
- Empty-state treatment: <illustration + CTA / blank with button / list with placeholder rows>
- Transition animations: <none / fade / slide — low-fidelity decisions only, no timing specs>

### Data binding

- Reads from: <which bounded contexts / artifacts the screen consumes>
- Writes to: <which systems the screen mutates — usually none for reader screens>
- Real-time sources: <any subscribed state>

### Accessibility wireframe notes

- Focus order: <ordered list of components the tab key visits>
- Landmark regions: <which ARIA landmarks wrap which parts>
- High-contrast considerations: <any layout choices that compact or expand in high-contrast mode>
```

### 2c. Emit decision manifest

Before rewriting any screen file, write `decision-manifest.yaml` to `{decision_manifest_path}`.

Record every inferred decision produced during Steps 2a and 2b. Assign tier at runtime based on grounding source: **high** when the decision was a direct match against a KB rule, file, or catalog entry; **mid** when context was built via web research; **low** when neither KB nor research yielded a grounding source.

**Decisions to record** (decision_id prefix: `D-gw-`):

| decision_id | decision_type | What is being decided |
|-------------|---------------|-----------------------|
| `D-gw-001` | `ascii-layout-authoring` | The ASCII/Unicode box-drawing layout structure chosen for each screen state — what components appear where, what is above the fold, how the layout reflects the screen's purpose (Step 2a) |
| `D-gw-002` | `layout-spec-prose-authoring` | The Layout Spec content authored for each screen — layout pattern name, grid regions, interaction pattern decisions (form validation style, loading indicator type, error placement, empty-state treatment, transition style), and data binding narrative (Step 2b) |

```yaml
schema_version: "1.0"
skill: "generate-wireframes"
generated_at: "{ISO8601}"
decisions:
  - decision_id: "D-gw-001"
    decision_type: "ascii-layout-authoring"
    tier: high | mid | low   # assign at runtime per grounding source
    grounding_source:
      kind: kb_path | web_citation | none
      ref: "{KB file path | URL | null}"
      excerpt: "{optional short quote when kind=kb_path}"
    recommendation: "{the layout structure chosen for the screen}"
    alternatives_considered:
      - alt: "{alternative layout approach}"
        why_not: "{one-line dismissal reason}"
    agent_reasoning_summary: "{2-3 sentence explanation}"
    user_response: null
    user_response_detail: null
  # ... one entry per decision listed above (repeat per screen for D-gw-001 and D-gw-002)
```

### 3. Rewrite the screen MD file with visual-first ordering

This skill does NOT simply append. It rewrites the file section order using the following discipline:

1. **Read** the full screen file produced by `generate-screen-inventory`.
2. **Find the `## Wireframe` placeholder** — the HTML-commented block directly under the H1.
3. **Replace the placeholder** with the visual wireframe block composed in Step 2a. The file's section order after this replacement is: frontmatter → H1 → `## Wireframe` (real ASCII) → `## Purpose` → `## Personas` → `## States` → `## Navigation` → `## Accessibility`.
4. **Append** the `## Layout Spec` block composed in Step 2b after the `## Accessibility` section.
5. **Preserve** all other content verbatim. Do not re-author the annotation sections.

Idempotent run: if the `## Wireframe` section is already populated (contains non-placeholder content) AND `## Layout Spec` is present, regenerate both from the current `## States` content and rewrite, preserving the surrounding annotation sections.

### 4. Return output contract

```yaml
wireframes:
  screens_updated: <int>
  screens_skipped: <int>  # already had wireframes and no changes needed
  total_screens: <int>
  generic_phrase_rejections: <int>  # count of wireframes that failed the specificity check
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
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
- NEVER commit an inferred decision to the primary artifacts (screen MD files) without recording it in `decision-manifest.yaml` first.
- NEVER tag a decision `tier: high` unless the `grounding_source.kind` is `kb_path` AND the referenced KB file exists.
- ALWAYS include `alternatives_considered` (≥1 entry) for every decision, even high-confidence ones.

## Version

| Field | Value |
|-------|-------|
| Version | 0.2.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/skills/generate-screen-inventory`, `core/components/skills/validate-screen-coverage` |
