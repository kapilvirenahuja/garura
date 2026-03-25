---
name: draft-roadmap-brief
description: Render roadmap-brief.html from intermediate epic and feasibility data — tabbed layout with Phoenix design and inline comments
user-invocable: false
model: sonnet
allowed-tools: Read, Write
version: 4.0.0
---

# draft-roadmap-brief

Model-invocable skill for rendering the human review brief from intermediate epic and feasibility data.

## Purpose

Render `roadmap-brief.html` from scoped epics and feasibility data — produced BEFORE `roadmap.yaml` exists. This is the review checkpoint: the brief is presented to the human for Tether/Vanish approval, and `roadmap.yaml` is produced only after approval. This skill reads `epics.yaml`, `feasibility.yaml`, and `product.yaml` and renders a preview brief using the Phoenix design system with tabbed navigation and an inline text selection comment system.

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

4. **Compose roadmap-brief.html** using the LTM template at `~/.meridian/core/memory/standards/templates/roadmap-brief.html` as the structural reference, and `~/.meridian/core/memory/standards/templates/brief-common.css` for the design system. All CSS and JS must be inline — no CDN links, no external dependencies. Replace all `{PLACEHOLDER}` values with actual data from the sources read above. All content is derived from the intermediate epics, feasibility, and product data — do NOT invent or assume content.

### Design System (Phoenix)

Use these CSS tokens inline:

```css
:root {
  --bg-primary: #1A2332;
  --bg-secondary: #212D3B;
  --bg-tertiary: #2A3645;
  --text-primary: #E8EDF2;
  --text-secondary: #94A3B8;
  --text-dimmed: #64748B;
  --color-air: #00D26A;
  --color-water: #00D4FF;
  --color-earth: #94A3B8;
  --color-fire: #E8731A;
  --status-draft: #fbbf24;
  --status-validated: #00D26A;
  --status-locked: #00D4FF;
  --border-default: #2E3D4F;
  --border-accent: #00D4FF;
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
  --comment-highlight: rgba(255,60,172,0.2);
  --comment-highlight-hover: rgba(255,60,172,0.35);
  --comment-popup-bg: #2A3645;
}
```

Typography: body font `'DM Sans', 'Space Grotesk', -apple-system, sans-serif` at 15px/1.6. Code font `'JetBrains Mono', monospace` at 13px.

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

Five tabs in this order:

```
┌────────────┬────────────┬────────┬─────────────┬───────────────┐
│  Strategy  │  Timeline  │ Epics  │ Feasibility │  Comments (N) │
└────────────┴────────────┴────────┴─────────────┴───────────────┘
```

Active tab: `--bg-secondary` background, `--color-water` bottom border 2px, `--text-primary` text.
Inactive tab: `--bg-primary` background, no bottom border, `--text-secondary` text.
Tab state persists via URL hash (e.g. `#strategy`, `#timeline`, `#feasibility`, `#comments`).

#### Tab 1 — Strategy

Content derived from `product.yaml` and `epics.yaml`:
- **The Bet** card: synthesize a thesis statement from the product's `strategic_goals` and the set of epics derived. Use Air (green) left border to signal directional commitment.
- **The Story** card: synthesize a 3–4 paragraph narrative that connects the strategic goals to the epics and the intended outcomes. Use Water (blue) left border.
- **Assumptions** card: render `assumptions` from product.yaml as a `<ul>` list. Use Water (blue) left border.
- **Exclusions** card: render `out_of_scope` from product.yaml as a `<ul>` list. Use Earth (gray) left border.

#### Tab 2 — Timeline

Content from `epics.yaml` `bucket` field and `feasibility.yaml`:
- Group epics by their `bucket` value (near/mid/long), render a `.timeline-phase` section with label and epic cards
- Each epic card shows: epic ID (E1, E2...), epic name, and corresponding risk_level badge from feasibility.yaml (green = low, orange = medium, red = high)
- Phase labels: near → "MVP", mid → "MVP-Beyond", long → "Future"
- Epics within a phase display as a horizontal row or stacked cards depending on count
- Epics use E-IDs (E1, E2, E3...) as defined in epics.yaml — this mapping must be consistent throughout the brief and will carry forward to roadmap.yaml

#### Tab 3 — Epics

Full IDD detail per epic. Content from `epics.yaml`:

For each epic, render an `.epic-card` with:
- **Header**: E-ID + epic name + badges (bucket as `.badge-near`/`.badge-mid`/`.badge-long`, priority as `.badge-p1`/`.badge-p2`/`.badge-p3`, effort)
- **Description**: 2-3 sentence description
- **Strategic Goal**: `strategic_goal_ref` (SG-ID)
- **Depends On**: list of E-IDs or "None"
- **Foundation Investment**: boolean flag (show only if true)
- **Intent** (`.idd-section`):
  - `.idd-label` "PROBLEM TODAY" → `intent.p1` as `.idd-paragraph`
  - `.idd-label` "OUTCOME AFTER" → `intent.p2` as `.idd-paragraph`
  - `.idd-label` "STRATEGIC CONNECTION" → `intent.p3` as `.idd-paragraph`
- **Constraints** (`.idd-section`):
  - `.idd-label` "IN SCOPE" → `constraints.in_scope` as `.idd-paragraph`
  - `.idd-label` "OUT OF SCOPE" → `constraints.out_of_scope` as `.idd-paragraph`
  - `.idd-label` "MUST NOT BREAK" → `constraints.must_not_break` as `.idd-paragraph`
- **Success Scenarios** (`.idd-section`):
  - `.idd-label` "SUCCESS SCENARIOS" → each scenario as a `.scenario-item` div
- **Failure Conditions** (`.idd-section`):
  - `.idd-label` "FAILURE CONDITIONS" → each condition as a `.failure-item` div

#### Tab 4 — Feasibility

Content from `feasibility.yaml` — `feasibility`, `critical_blockers`, `open_questions`, `risk_summary` sections:

- **Risk Summary** section: render `risk_summary` as stat cards — total features, high risk count, medium risk count, blocker count. Use Fire (orange) for high risk counts > 0.
- **Per-Feature Feasibility** section: for each entry in `feasibility`, render a card with:
  - Epic ref (E-ID) as heading
  - Risk level badge (low/medium/high) with Fire color for high
  - Technical risks as a table: Risk | Severity | Affected Systems | Mitigation
  - Blockers list (if any) with Fire left border
  - Sequencing constraints as text
  - Architecture impact as text
- **Critical Blockers** section: render `critical_blockers` as Fire-bordered cards — blocker description, severity badge, affected features, resolution status
- **Open Questions** section: render `open_questions` as a list — each question with affected features

#### Tab 5 — Comments

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
  tabs_present: ["strategy", "timeline", "epics", "feasibility", "comments"]
  feature_count: {integer}
  critical_blocker_count: {integer}
  inline_comments_enabled: true
```

## Constraints

- NEVER read from roadmap.yaml — it does not exist yet at this stage; all data comes from epics.yaml, feasibility.yaml, and product.yaml
- NEVER use CDN links or external dependencies — all CSS and JS must be inline
- NEVER use JavaScript frameworks — vanilla JS only
- ALWAYS use Phoenix design system — no custom color schemes
- ALWAYS produce exactly five tabs: Strategy, Timeline, Epics, Feasibility, Comments
- ALWAYS implement the inline text selection comment system
- NEVER regenerate hub.html — that is owned by the doc-builder agent
- ALWAYS write to the `output_path` provided by the calling agent
- ALWAYS read epics.yaml, feasibility.yaml, and product.yaml using the Read tool — do NOT rely on memory
- ALWAYS use E-IDs from epics.yaml consistently throughout the brief — this mapping carries forward to roadmap.yaml
- `user-invocable: false`

## Version

| Field | Value |
|-------|-------|
| Version | 4.0.0 |
| Category | strategy |
