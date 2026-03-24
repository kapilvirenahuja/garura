---
name: draft-roadmap-brief
description: Render roadmap-brief.html from intermediate epic and feasibility data — tabbed layout with LifeOS Dark design and inline comments
user-invocable: false
model: sonnet
allowed-tools: Read, Write
version: 4.0.0
---

# draft-roadmap-brief

Model-invocable skill for rendering the human review brief from intermediate epic and feasibility data.

## Purpose

Render `roadmap-brief.html` from scoped epics and feasibility data — produced BEFORE `roadmap.yaml` exists. This is the review checkpoint: the brief is presented to the human for Tether/Vanish approval, and `roadmap.yaml` is produced only after approval. This skill reads `epics.yaml`, `feasibility.yaml`, and `product.yaml` and renders a preview brief using the LifeOS Dark design system with tabbed navigation and an inline text selection comment system.

You DO render the brief document. You do NOT regenerate hub.html (that is owned by the doc-builder agent), generate roadmap content, invent data, validate feasibility, or decide what happens next.

## Input

Receive from agent:
- `epics_path` — (required) Path to the scoped epics artifact in STM, e.g. `.meridian/project/product/{slug}/epics.yaml`
- `feasibility_path` — (required) Path to the feasibility artifact in STM, e.g. `.meridian/project/product/{slug}/feasibility.yaml`
- `product_yaml_path` — (required) Path to product.yaml, e.g. `.meridian/project/product/{slug}/product.yaml`
- `output_path` — (required) Full path where the brief should be written (e.g., `.meridian/project/product/{slug}/briefs/roadmap-brief.html`). Computed by the calling doc-builder agent.
- `slug` — (required) Product slug

## Process

1. **Read epics.yaml** at `epics_path` using the Read tool. Extract all epic entries: bucket (horizon), priority, effort, depends_on, foundation_investment, intent, constraints, success_scenarios, failure_conditions, and the linked strategic_goal for each epic.

2. **Read feasibility.yaml** at `feasibility_path` using the Read tool. Extract per-feature feasibility data: risk_level, technical_risks, blockers, sequencing_constraints, architecture_impact, critical_blockers, open_questions, risk_summary.

3. **Read product.yaml** at `product_yaml_path` using the Read tool. Extract product name (from value_proposition or strategic_goals title) for the brief header. Also extract assumptions and out_of_scope (used as exclusions).

4. **Compose roadmap-brief.html** as a fully self-contained HTML5 document. All CSS and JS must be inline — no CDN links, no external dependencies. Apply the LifeOS Dark design system as specified in `brief-principles.md`. All content is derived from the intermediate epics and feasibility data read above — do NOT invent or assume content.

### Design System (LifeOS Dark)

Use these CSS tokens inline:

```css
:root {
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;
  --text-primary: #e0e0e8;
  --text-secondary: #8B949E;
  --text-dimmed: #484f58;
  --color-air: #39D353;
  --color-water: #58A6FF;
  --color-earth: #8B949E;
  --color-fire: #F0A000;
  --status-draft: #fbbf24;
  --status-validated: #4ade80;
  --status-locked: #58A6FF;
  --border-default: #30363d;
  --border-accent: #58A6FF;
  --shadow-retro: 4px 4px 0 rgba(33,38,45,1);
  --comment-highlight: rgba(240,160,0,0.2);
  --comment-highlight-hover: rgba(240,160,0,0.35);
  --comment-popup-bg: #21262D;
}
```

Typography: body font `'Arial Rounded MT Bold', 'Nunito', 'Varela Round', system-ui, sans-serif` at 15px/1.6. Code font `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace` at 13px.

Container: max-width 900px, centered, padding 32px horizontal / 24px vertical.

### Header

Render at the top of the page:
```
┌─────────────────────────────────────────┐
│  Roadmap Brief            [STATUS BADGE] │
│  {slug}                                  │
│  Generated: {current timestamp}          │
│  Source: {product_yaml_path}             │
│  [← Hub]                                │
└─────────────────────────────────────────┘
```
Status badge: always DRAFT at this stage (brief is a preview — roadmap.yaml does not exist yet).
Status badge colors: DRAFT = `--status-draft` (yellow), APPROVED = `--status-validated` (green), LOCKED = `--status-locked` (blue).

### Tab Structure

Four tabs in this order:

```
┌────────────┬────────────┬─────────────┬───────────────┐
│  Strategy  │  Timeline  │ Feasibility │  Comments (N) │
└────────────┴────────────┴─────────────┴───────────────┘
```

Active tab: `--bg-secondary` background, `--color-water` bottom border 2px, `--text-primary` text.
Inactive tab: `--bg-primary` background, no bottom border, `--text-secondary` text.
Tab state persists via URL hash (e.g. `#strategy`, `#timeline`, `#feasibility`, `#comments`).

#### Tab 1 — Strategy

Content derived from `product.yaml` and `epics.yaml`:
- **The Bet** card: synthesize a thesis statement from the product's `strategic_goals` and the set of epics derived. Use Air (green) left border to signal directional commitment.
- **The Story** card: synthesize a 3–4 paragraph narrative that connects the strategic goals to the epics and the intended outcomes. Use Water (blue) left border.
- **Assumptions** card: render `assumptions` from product.yaml as a `<ul>` list. Use Earth (gray) left border.
- **Exclusions** card: render `out_of_scope` from product.yaml as a `<ul>` list. Use Earth (gray) left border.

#### Tab 2 — Timeline

Content from `epics.yaml` `bucket` field and `feasibility.yaml`:
- Group epics by their `bucket` value (near/mid/long), render a `.timeline-phase` section with label and feature cards
- Each feature card shows: feature ID (F1, F2...), epic name, and corresponding risk_level badge from feasibility.yaml (green = low, orange = medium, red = high)
- Phase labels: near → "MVP", mid → "MVP-Beyond", long → "Future"
- Features within a phase display as a horizontal row or stacked cards depending on count
- Assign F-IDs (F1, F2, F3...) to epics in the order they appear in epics.yaml — this mapping must be consistent throughout the brief and will carry forward to roadmap.yaml

#### Tab 3 — Feasibility

Content from `feasibility.yaml` — `feasibility`, `critical_blockers`, `open_questions`, `risk_summary` sections:

- **Risk Summary** section: render `risk_summary` as stat cards — total features, high risk count, medium risk count, blocker count. Use Fire (orange) for high risk counts > 0.
- **Per-Feature Feasibility** section: for each entry in `feasibility`, render a card with:
  - Feature ref (F-ID) as heading
  - Risk level badge (low/medium/high) with Fire color for high
  - Technical risks as a table: Risk | Severity | Affected Systems | Mitigation
  - Blockers list (if any) with Fire left border
  - Sequencing constraints as text
  - Architecture impact as text
- **Critical Blockers** section: render `critical_blockers` as Fire-bordered cards — blocker description, severity badge, affected features, resolution status
- **Open Questions** section: render `open_questions` as a list — each question with affected features

#### Tab 4 — Comments

Comments management tab (always last):
- Lists all inline comments in document order
- Each comment shows: highlighted text excerpt, which tab it was made on, comment text, Delete button
- Export Comments JSON button
- Copy button
- Overall action buttons: **[Tether]** [Vanish] [Orbit]

### Inline Comment System

Implement in vanilla JavaScript, inline:

1. **Text selection** — on `mouseup`, detect if user selected text within the brief content area
2. **Popup** — show a floating popup near the selection:
   ```
   ┌─────────────────────────────┐
   │  Add Comment                │
   │  ┌─────────────────────────┐│
   │  │ "selected text..."      ││
   │  └─────────────────────────┘│
   │  ┌─────────────────────────┐│
   │  │ Your comment...         ││
   │  └─────────────────────────┘│
   │        [Cancel]  [Save]     │
   └─────────────────────────────┘
   ```
   Popup positioned viewport-aware (above or below selection). Background `--comment-popup-bg`, border `--border-accent`.
3. **Save** — wrap selected text in `<span class="comment-highlight">`, store comment in localStorage
4. **Highlights** — `.comment-highlight` uses `--comment-highlight` background and 2px bottom border in `--color-fire`. Hover uses `--comment-highlight-hover`.
5. **Persistence** — localStorage key: `meridian-comments-roadmap-{slug}`
6. **Comments tab** — render all stored comments with tab label, selected text excerpt, comment text, Delete button. Delete removes both comment and highlight span.
7. **Export** — build JSON per feedback schema, copy to clipboard. Clear storage after Tether/Vanish/Orbit action.

Required JS functions:
```javascript
function switchTab(tabName) { }
function handleTextSelection() { }
function saveComment(selectedText, comment, tabName) { }
function deleteComment(commentId) { }
function renderComments() { }
function loadComments() { }
function saveCommentsToStorage() { }
function exportFeedback(action) { }
```

5. **Write roadmap-brief.html** to `output_path` using the Write tool. Hub link in the header should point to `hub.html` (relative — hub lives in the same briefs/ directory).

6. **Return output contract.**

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after:

```yaml
brief:
  roadmap_brief_path: "{output_path}"
  slug: "{slug}"
  tabs_present: ["strategy", "timeline", "feasibility", "comments"]
  feature_count: {integer}
  critical_blocker_count: {integer}
  inline_comments_enabled: true
```

## Constraints

- NEVER read from roadmap.yaml — it does not exist yet at this stage; all data comes from epics.yaml, feasibility.yaml, and product.yaml
- NEVER use CDN links or external dependencies — all CSS and JS must be inline
- NEVER use JavaScript frameworks — vanilla JS only
- ALWAYS use LifeOS Dark design system — no custom color schemes
- ALWAYS produce exactly four tabs: Strategy, Timeline, Feasibility, Comments
- ALWAYS implement the inline text selection comment system
- NEVER regenerate hub.html — that is owned by the doc-builder agent
- ALWAYS write to the `output_path` provided by the calling agent
- ALWAYS read epics.yaml, feasibility.yaml, and product.yaml using the Read tool — do NOT rely on memory
- ALWAYS assign F-IDs to epics consistently throughout the brief — this mapping carries forward to roadmap.yaml
- `user-invocable: false`

## Version

| Field | Value |
|-------|-------|
| Version | 4.0.0 |
| Category | strategy |
