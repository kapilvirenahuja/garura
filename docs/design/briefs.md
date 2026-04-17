# HTML Brief Presentation Principles

Every artifact (product, roadmap, features, architecture, tech, scenarios, plan) has a corresponding `-brief.html` file for human review. This document defines the consistent presentation system all briefs must follow.

## Core Principles

1. **One YAML, one brief.** Each brief renders from exactly one `.yaml` file. If it's not in the YAML, it doesn't appear in the brief.
2. **Tabbed navigation.** Sections are tabs, not a scroll. One tab visible at a time.
3. **Inline feedback.** Select text → comment popup → persistent annotations. Like MS Word reviews.
4. **Common CSS.** One token system, one stylesheet authored once, inlined into every brief.
5. **Hub page.** A central `hub.html` links to all briefs with status and summary.

## Design System: Phoenix

All briefs use the Phoenix Design System v2.0. No exceptions.

Source: `Phoenix Design System.md` in the design-system artifacts directory.
Theme: Dark-first, warm slate backgrounds, cyan primary, phoenix orange secondary.

### Design Principles

1. **Dark-First** — Warm slate backgrounds (`#1A2332`), not pure black.
2. **Cyan Primary** — Cyan `#00D4FF` is the primary UI accent — headings, nav, active states, borders.
3. **Phoenix Orange Secondary** — Orange `#E8731A` for warmth, attention, risks. NOT the primary UI color.
4. **Magenta Interactive** — Magenta `#FF3CAC` for interactive elements — comment highlights, callout badges.
5. **Dark text on bright backgrounds** — When text sits on cyan/magenta backgrounds, use dark `#0D0D0D`, not white.
6. **Technical Typography** — Space Grotesk for headings/UI, DM Sans for body, JetBrains Mono for code.

### Color Tokens

```css
:root {
  /* Backgrounds (Warm Slate — NOT pure black, NOT blue-navy) */
  --bg-primary: #1A2332;
  --bg-secondary: #212D3B;
  --bg-tertiary: #2A3645;

  /* Text */
  --text-primary: #E8EDF2;
  --text-secondary: #94A3B8;
  --text-dimmed: #64748B;
  --text-muted: #64748B;

  /* Four-element accents (Phoenix-mapped) */
  --color-air: #00D26A;       /* Green — success, approved, growth */
  --color-water: #00D4FF;     /* Cyan — primary UI accent, links, info, navigation */
  --color-earth: #94A3B8;     /* Muted — neutral, secondary, deferred */
  --color-fire: #E8731A;      /* Phoenix orange — attention, risks, warmth */
  --color-magenta: #FF3CAC;   /* Magenta — interactive highlights, callouts */

  /* Status badges */
  --status-draft: #FBBF24;
  --status-validated: #00D26A;
  --status-locked: #00D4FF;

  /* Borders & Effects */
  --border-default: #2E3D4F;
  --border-accent: #00D4FF;
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
  --glow: rgba(0,212,255,0.2);

  /* Inline comments (magenta interactive — Phoenix principle #4) */
  --comment-highlight: rgba(255,60,172,0.2);
  --comment-highlight-hover: rgba(255,60,172,0.35);
  --comment-popup-bg: #2A3645;
}
```

### Typography

```css
/* Headings / UI (Space Grotesk) */
font-family: 'Space Grotesk', -apple-system, sans-serif;

/* Body text (DM Sans) */
font-family: 'DM Sans', 'Space Grotesk', -apple-system, sans-serif;
font-size: 15px;
line-height: 1.6;

/* Code / Monospace (JetBrains Mono) */
font-family: 'JetBrains Mono', monospace;
font-size: 13px;

/* Headings */
h1: 28px, --color-water (cyan), bottom border
h2: 20px, --color-water (cyan), bottom border
h3: 16px, --text-primary
```

### Common CSS

All styling is authored once as a common token set + component classes. Each brief inlines this CSS. When styles are updated, regenerating briefs picks up the changes.

```
~/.claude/skills/briefs/templates/brief-common.css
```

(Source: `core/components/plays/briefs/templates/brief-common.css` — deployed via `/sync-claude` or `/sync-droids`)

This file is the single source of truth for all brief styling:
- Token definitions (:root variables) — sourced from Phoenix Design System v2.0
- Layout (container, header, tabs)
- Components (cards, tables, badges, lists, epic cards, stat grid)
- Profile tables, quality standards cards, debt baseline tables
- Inline comment system (magenta highlights, popup, comment list)
- Export panel
- Responsive rules

Individual briefs inline this CSS and add zero custom styles. HTML templates for each brief type are in the same directory.

### Constraints

- All CSS and JS inline — no CDN links, no external dependencies
- No JavaScript frameworks — vanilla JS only
- Self-contained HTML5 document — opens in any browser
- No build step required
- Fonts declared in font-family stack with system fallbacks (no Google Fonts CDN import)

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
  box-shadow: var(--shadow);
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
}
.card:hover { border-color: var(--border-accent); box-shadow: 0 0 20px var(--glow); }
```

**Colored left borders** for categorization:
- Air (green `#00D26A`): positive — features, approved, in-scope
- Water (cyan `#00D4FF`): informational — architecture, components, scenarios
- Fire (phoenix orange `#E8731A`): attention — risks, blockers, failure conditions
- Earth (muted `#94A3B8`): neutral — deferred, out-of-scope, notes

### Tables

```css
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: var(--bg-tertiary); color: var(--text-primary); padding: 10px 12px; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); }
tr:hover { background: rgba(0,212,255,0.05); }
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
  border-bottom: 2px solid var(--color-magenta);
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

- **localStorage key:** `garura-comments-{artifact}-{slug}`
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
.garura/product/briefs/hub.html
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
Source: `roadmap/epics.yaml` + `roadmap/feasibility.yaml` + `discovery/product.yaml` (rendered BEFORE roadmap.yaml exists)

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

When a brief is reviewed as part of a multi-stage play (e.g., `/prepare-epic`),
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
.garura/product/briefs/hub.html
.garura/product/briefs/product-brief.html
.garura/product/briefs/roadmap-brief.html
.garura/product/briefs/features-brief.html
.garura/product/briefs/architecture-brief.html
.garura/product/briefs/tech-brief.html
.garura/product/briefs/scenarios-brief.html
.garura/product/briefs/plan-brief.html
```

No timestamps in brief filenames — each brief is the latest view of its YAML.
Hub is regenerated when any brief is generated.
