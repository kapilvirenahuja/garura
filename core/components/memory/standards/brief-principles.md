# HTML Brief Presentation Principles

Every artifact (product, roadmap, features, architecture, tech, scenarios, plan) has a corresponding `-brief.html` file for human review. This document defines the consistent presentation system all briefs must follow.

## Core Principles

1. **One YAML, one brief.** Each brief renders from exactly one `.yaml` file. If it's not in the YAML, it doesn't appear in the brief.
2. **Tabbed navigation.** Sections are tabs, not a scroll. One tab visible at a time.
3. **Inline feedback.** Select text → comment popup → persistent annotations. Like MS Word reviews.
4. **Common CSS.** One token system, one stylesheet authored once, inlined into every brief.
5. **Hub page.** A central `hub.html` links to all briefs with status and summary.

## Design System: LifeOS Dark

All briefs use the same design system. No exceptions.

### Color Tokens

```css
:root {
  /* Backgrounds */
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;

  /* Text */
  --text-primary: #e0e0e8;
  --text-secondary: #8B949E;
  --text-dimmed: #484f58;

  /* Four-element accents */
  --color-air: #39D353;       /* Green — success, approved, growth */
  --color-water: #58A6FF;     /* Blue — links, info, navigation */
  --color-earth: #8B949E;     /* Gray — neutral, secondary, muted */
  --color-fire: #F0A000;      /* Orange — warning, attention, risks */

  /* Status badges */
  --status-draft: #fbbf24;
  --status-validated: #4ade80;
  --status-locked: #58A6FF;

  /* Borders & Effects */
  --border-default: #30363d;
  --border-accent: #58A6FF;
  --shadow-retro: 4px 4px 0 rgba(33,38,45,1);

  /* Inline comments */
  --comment-highlight: rgba(240,160,0,0.2);
  --comment-highlight-hover: rgba(240,160,0,0.35);
  --comment-popup-bg: #21262D;
}
```

### Typography

```css
/* Body */
font-family: 'Arial Rounded MT Bold', 'Nunito', 'Varela Round', system-ui, sans-serif;
font-size: 15px;
line-height: 1.6;

/* Code / Monospace */
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
font-size: 13px;

/* Headings */
h1: 28px, --color-water, bottom border
h2: 20px, --color-air, bottom border
h3: 16px, --text-primary
```

### Common CSS

All styling is authored once as a common token set + component classes. Each brief inlines this CSS. When styles are updated, regenerating briefs picks up the changes.

```
~/.meridian/core/memory/standards/templates/brief-common.css
```

(Source: `core/components/memory/standards/templates/brief-common.css` — deployed via `/sync-claude` or `/sync-droids`)

This file is the single source of truth for all brief styling:
- Token definitions (:root variables) — sourced from LifeOS dashboard design system
- Layout (container, header, tabs)
- Components (cards, tables, badges, lists, epic cards, stat grid)
- Profile tables, quality standards cards, debt baseline tables
- Inline comment system (highlights, popup, comment list)
- Export panel
- Responsive rules

Individual briefs inline this CSS and add zero custom styles. HTML templates for each brief type are in the same directory.

### Constraints

- All CSS and JS inline — no CDN links, no external dependencies
- No JavaScript frameworks — vanilla JS only
- Self-contained HTML5 document — opens in any browser
- No build step required

## Layout System

### Container

```
Max-width: 900px, centered
Padding: 32px horizontal, 24px vertical
```

### Header (every brief)

```
┌─────────────────────────────────────────┐
│  {Artifact Name}          [STATUS BADGE] │
│  {slug}                                  │
│  Generated: {timestamp}                  │
│  Source: {yaml file path}                │
│  [← Hub]                                │
└─────────────────────────────────────────┘
```

- Status badge colors: DRAFT (yellow), VALIDATED (green), LOCKED (blue)
- Hub link navigates back to `hub.html`

### Tab Bar

Sections are presented as tabs. One tab visible at a time.

```
┌──────────┬──────────┬──────────┬──────────┐
│  Tab 1   │  Tab 2   │  Tab 3   │ Comments │
│ (active) │          │          │   (3)    │
└──────────┴──────────┴──────────┴──────────┘
┌─────────────────────────────────────────────┐
│                                             │
│  Tab 1 content                              │
│                                             │
└─────────────────────────────────────────────┘
```

- Active tab: `--bg-secondary` background, `--color-water` bottom border, `--text-primary` text
- Inactive tab: `--bg-primary` background, no border, `--text-secondary` text
- Last tab is always **Comments** — shows count badge, lists all inline comments
- Tab state persists via URL hash (`#tab-name`)

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: var(--shadow-retro);
  padding: 20px;
  margin-bottom: 16px;
}
.card:hover { border-color: var(--border-accent); }
```

**Colored left borders** for categorization:
- Air (green): positive — features, approved, in-scope
- Water (blue): informational — architecture, components, scenarios
- Fire (orange): attention — risks, blockers, failure conditions
- Earth (gray): neutral — deferred, out-of-scope, notes

### Tables

```css
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: var(--bg-tertiary); color: var(--text-primary); padding: 10px 12px; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); }
tr:hover { background: rgba(88,166,255,0.05); }
```

## Inline Feedback System

### How It Works

1. **Select text** anywhere in the brief content
2. **Popup appears** near the selection with a comment textarea
3. **Save comment** — selected text gets highlighted, comment is stored
4. **Persistent** — comments survive page reload (localStorage keyed by `{artifact}-{slug}`)
5. **Comments tab** — lists all comments with their highlighted text and ability to delete
6. **Export anytime** — JSON export button available in the Comments tab

### Comment Popup

```
┌─────────────────────────────┐
│  Add Comment                │
│  ┌─────────────────────────┐│
│  │ "selected text..."      ││  ← shows what was selected
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Your comment...         ││  ← textarea
│  │                         ││
│  └─────────────────────────┘│
│        [Cancel]  [Save]     │
└─────────────────────────────┘
```

- Popup positioned near the selection (above or below, viewport-aware)
- `--comment-popup-bg` background, `--border-accent` border
- Escape key or Cancel dismisses

### Comment Highlights

```css
.comment-highlight {
  background: var(--comment-highlight);
  cursor: pointer;
  border-bottom: 2px solid var(--color-fire);
}
.comment-highlight:hover {
  background: var(--comment-highlight-hover);
}
```

- Clicking a highlight opens the comment for editing
- Highlights are non-overlapping — if selections overlap, merge into one highlight

### Comments Tab

```
┌─────────────────────────────────────────────┐
│  Comments (3)                               │
│                                             │
│  1. "selected text excerpt..."              │
│     Tab: Market Context                     │
│     > Your comment here                     │
│     [Delete]                                │
│                                             │
│  2. "another selection..."                  │
│     Tab: Vision                             │
│     > Another comment                       │
│     [Delete]                                │
│                                             │
│  ──────────────────────────────────────     │
│  [Export Comments JSON]  [Copy]             │
│                                             │
│  Overall action:                            │
│  [Tether]  [Vanish]  [Orbit]               │
│                                             │
└─────────────────────────────────────────────┘
```

- Comments listed in order of appearance in the document
- Each shows: highlighted text excerpt, which tab it's on, the comment text
- Delete removes both the comment and the highlight
- Export and overall action buttons at the bottom

### Feedback JSON Schema

```json
{
  "artifact": "{artifact-name}-brief",
  "slug": "{product-slug}",
  "timestamp": "{ISO-8601}",
  "comments": [
    {
      "id": "{uuid}",
      "tab": "{tab-name}",
      "selected_text": "{the text that was highlighted}",
      "comment": "{reviewer's comment}",
      "created_at": "{ISO-8601}"
    }
  ],
  "action": "tether|vanish|orbit"
}
```

### Storage

- **localStorage key:** `meridian-comments-{artifact}-{slug}`
- **Format:** Array of comment objects (id, tab, selected_text, comment, created_at, range data)
- **Persistence:** Comments survive page reload, browser close/reopen
- **Clear:** Exporting with an action (tether/vanish/orbit) clears stored comments

### JavaScript (vanilla, inline)

Core functions in every brief:

```javascript
// Tab navigation
function switchTab(tabName) { }

// Inline comments
function handleTextSelection() { }        // detect selection, show popup
function saveComment(selectedText, comment) { }  // store + highlight
function deleteComment(commentId) { }      // remove comment + highlight
function renderComments() { }              // update Comments tab
function loadComments() { }               // restore from localStorage
function saveCommentsToStorage() { }      // persist to localStorage

// Export
function exportFeedback(action) { }       // build JSON, copy to clipboard
```

## Hub Page

### Purpose

Central navigation page linking to all briefs for a product. Shows status at a glance.

### Location

```
{artifact_base}/{slug}/hub.html
```

### Layout

```
┌─────────────────────────────────────────────┐
│  {Product Name}                  [PHASE]    │
│  {slug}                                     │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ product     │  │ roadmap     │          │
│  │ [LOCKED] ✓  │  │ [DRAFT]     │          │
│  │ 3 goals     │  │ 5 features  │          │
│  │ 0 comments  │  │ 2 comments  │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ features    │  │ architecture│          │
│  │ [DRAFT]     │  │ [—]        │          │
│  │ 4 features  │  │ not started │          │
│  │ 1 comment   │  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ tech        │  │ scenarios   │          │
│  │ [—]        │  │ [—]        │          │
│  │ not started │  │ not started │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐                            │
│  │ plan        │                            │
│  │ [—]        │                            │
│  │ not started │                            │
│  └─────────────┘                            │
│                                             │
│  Dependency: product → roadmap → features   │
│  → architecture → tech → scenarios → plan   │
│                                             │
└─────────────────────────────────────────────┘
```

### Hub Cards

Each card shows:
- Artifact name (clickable link to brief)
- Status badge (DRAFT/VALIDATED/LOCKED/— for not started)
- Summary stat (count of key items from the YAML — e.g. "3 goals", "5 features")
- Comment count (from localStorage)
- Grayed out if YAML doesn't exist yet

### Hub Generation

Hub is regenerated every time any brief is generated. It reads all existing YAMLs
in the slug directory, extracts status and summary counts, and renders the page.

## Per-Brief Tab Mapping

Each brief's sections become tabs. The last tab is always **Comments**.

### product-brief.html
Source: `product.yaml`

| Tab | Content |
|-----|---------|
| Market Context | problem, target_users, competitors, market_size, differentiators, risks. When type="library": tab named "Technical Context", skip competitors/market_size, render target_users as "Consumers" |
| Vision | value_proposition, strategic_goals (id, title, description, metric, target, measurement), success_metrics |
| Scope | assumptions, out_of_scope (category + rationale) |
| Profiles | profiles.product_profile (PP-1..7), profiles.nfr_profile (NFR-1..7), profiles.quality_profile (QP-1..7) — each as a table with dimension, level, rationale. Skip tab if profiles section absent. |
| Comments | All inline comments + export |

### roadmap-brief.html
Source: `epics.yaml` + `feasibility.yaml` + `product.yaml` (rendered BEFORE roadmap.yaml exists)

| Tab | Content |
|-----|---------|
| Strategy | thesis (synthesized from strategic_goals + epics), narrative (3-4 paragraphs), assumptions (from product.yaml), exclusions (from product.yaml out_of_scope) |
| Timeline | epics grouped by bucket (near/mid/long) with risk badges from feasibility. Summary table: Epic (E-ID), Horizon, Priority, Effort, Depends On, Reason. Epics use E-IDs (E1, E2...) not F-IDs. |
| Epics | Full IDD detail per epic (E-ID): description, intent (p1/p2/p3), constraints (in_scope/out_of_scope/must_not_break), success_scenarios (given/when/then), failure_conditions, ltm_citations. Each epic as an expandable card. |
| Feasibility | risk_summary stat cards, per-feature feasibility (risk_level, technical_risks table, blockers, sequencing_constraints, architecture_impact), critical_blockers, open_questions |
| Comments | All inline comments + export |

### features-brief.html
Source: `features.yaml`

| Tab | Content |
|-----|---------|
| Identity | identity, invariants, scope |
| Features | features list — each as a card with IDD fields (behaviors, constraints), blast_radius |
| Comments | All inline comments + export |

### architecture-brief.html
Source: `architecture.yaml` + `quality-standards.yaml` + `product.yaml` (for profiles)

| Tab | Content |
|-----|---------|
| Architecture | principles (id, principle, rationale), architecture (topology, deployment_units), nfrs (performance, scalability, security, availability, compliance — each with requirement + priority) |
| Stack & Platforms | stack (component, technology, purpose, rationale), platforms (category, platform, purpose, rationale, features_served), integrations (name, type, provider, purpose, direction, auth_method, features_served) |
| Agentic | agentic PCAM: perception (signal, source, format), cognition (agent, role, autonomy, model), action (tool, purpose, available_to), memory (approach, stm, ltm, embeddings). Skip tab if agentic section absent. |
| Quality Standards | quality-standards.yaml: per-QP-dimension standards (qp_level, strategy/tooling/coverage), debt_baseline table (dimension, target_level, current_level, gap) |
| Profiles | profiles from product.yaml via profiles_ref: PP, NFR, QP tables. Skip tab if profiles_ref absent. |
| Operations | technical_risks (risk, affected_features, severity, mitigation), deployment (service, platform, purpose), observability (tracing, metrics, logging) |
| Comments | All inline comments + export |

### tech-brief.html
Source: `tech.yaml`

| Tab | Content |
|-----|---------|
| Structure | project_structure (directories, key_files), libraries (name, version, purpose) |
| Data Model | data_model |
| Components | components (core components with interfaces, dependencies, key_files) |
| Feature Mapping | feature_mapping (which feature uses what) |
| Comments | All inline comments + export |

### scenarios-brief.html
Source: `scenarios.yaml`

| Tab | Content |
|-----|---------|
| Scenarios | groups with nested scenarios — cards per scenario |
| Feature Gates | feature_gates — which scenarios must pass per feature |
| Coverage | coverage summary, gaps |
| Comments | All inline comments + export |

### plan-brief.html
Source: `plan.yaml`

| Tab | Content |
|-----|---------|
| Prerequisites | prerequisites (phase 0 setup) |
| Execution | execution_order — feature sequence with scope, exit gates, scenario gates |
| Summary | summary table — cumulative scenario counts |
| Comments | All inline comments + export |

## Context Sections

When a brief is reviewed as part of a multi-stage recipe (e.g., `/prepare-implementation`),
previously approved artifacts may be shown as non-reviewable context within a tab.

**Context sections:**
- Rendered with reduced opacity (0.7)
- Gray h3 headers with "CONTEXT — {artifact name}" label
- Not selectable for inline comments
- Source YAML path shown for traceability

Example: When reviewing `tech-brief.html`, the features summary appears as context
at the top of the Structure tab (already approved in a prior stage).

## File Naming

```
{artifact_base}/{slug}/hub.html
{artifact_base}/{slug}/product-brief.html
{artifact_base}/{slug}/roadmap-brief.html
{artifact_base}/{slug}/features-brief.html
{artifact_base}/{slug}/architecture-brief.html
{artifact_base}/{slug}/tech-brief.html
{artifact_base}/{slug}/scenarios-brief.html
{artifact_base}/{slug}/plan-brief.html
```

No timestamps in brief filenames — each brief is the latest view of its YAML.
Hub is regenerated when any brief is generated.
