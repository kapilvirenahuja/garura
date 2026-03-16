---
name: generate-implementation-brief
description: Generate per-artifact self-contained HTML briefs from YAML implementation artifacts for human review with inline text selection comment system
user-invocable: false
model: sonnet
allowed-tools: Read, Write
category: documentation
version: 2.0.0
---

# generate-implementation-brief

Model-invocable skill for generating per-artifact, self-contained HTML brief documents from YAML implementation artifacts.

## Purpose

Read a YAML artifact from STM and produce a self-contained HTML brief that a human can open in a browser to review its contents. Each brief uses a tabbed layout, the LifeOS Dark design system, and an inline text selection comment system (not section toggles). After generating any brief, always regenerate hub.html.

You DO generate the HTML artifact(s). You do NOT interpret feedback or decide what happens next.

## Input

Receive from agent:
- `artifacts` — (required) List of artifact names to generate briefs for. Valid values: `features`, `architecture`, `tech`, `scenarios`, `plan`. Pass `all` to generate all five.
- `artifact_base` — (required) Base path where YAML artifacts live (e.g., `.meridian/project/product/{slug}/`)
- `slug` — (required) Product slug for display

## Artifact Resolution

YAML file paths are derived from `artifact_base/{artifact}.yaml`.
Brief output paths are `artifact_base/{artifact}-brief.html`.
Hub output path is `artifact_base/hub.html`.

| Artifact | Source YAML | Output Brief |
|----------|-------------|--------------|
| features | `features.yaml` | `features-brief.html` |
| architecture | `architecture.yaml` | `architecture-brief.html` |
| tech | `tech.yaml` | `tech-brief.html` |
| scenarios | `scenarios.yaml` | `scenarios-brief.html` |
| plan | `plan.yaml` | `plan-brief.html` |

Also always read and use any of the following that exist, for hub regeneration:
- `product.yaml`
- `roadmap.yaml`

## Process

For each artifact in the `artifacts` list:

1. **Read the source YAML.** If the YAML is missing, report the missing file and skip that artifact — do not halt; continue generating other requested briefs.

2. **Parse YAML content.** Extract fields needed for the tabs defined in the tab mapping below.

3. **Render the brief.** Construct the HTML document using the structure, design system, and tab mapping defined below.

4. **Write the brief** to `artifact_base/{artifact}-brief.html` using the Write tool.

After all requested briefs are written:

5. **Regenerate hub.html.** Read all existing YAML files in `artifact_base` (product.yaml, roadmap.yaml, features.yaml, architecture.yaml, tech.yaml, scenarios.yaml, plan.yaml — skip any that don't exist). Extract status and summary stats from each. Write hub.html to `artifact_base/hub.html`.

## Tab Mapping

Each brief's tabs are defined by its source YAML. The last tab is always **Comments**. Tab names correspond to the sections specified in brief-principles.md.

### features-brief.html

| Tab | Content |
|-----|---------|
| Identity | `identity`, `invariants`, `scope` |
| Features | `features` list — each as a card with IDD fields, `blast_radius` |
| Comments | All inline comments + export |

### architecture-brief.html

| Tab | Content |
|-----|---------|
| Architecture | `principles`, `architecture`, `nfrs` |
| Stack & Platforms | `stack`, `platforms`, `integrations` |
| Agentic | `agentic` (PCAM: perception, cognition, action, memory) |
| Operations | `technical_risks`, `deployment`, `observability` |
| Comments | All inline comments + export |

### tech-brief.html

| Tab | Content |
|-----|---------|
| Structure | `project_structure`, `libraries` |
| Data Model | `data_model` |
| Components | `components` (core components with interfaces, dependencies) |
| Feature Mapping | `feature_mapping` |
| Comments | All inline comments + export |

### scenarios-brief.html

| Tab | Content |
|-----|---------|
| Scenarios | `groups` with nested scenarios — cards per scenario |
| Feature Gates | `feature_gates` — which scenarios must pass per feature |
| Coverage | `coverage` summary and gaps |
| Comments | All inline comments + export |

### plan-brief.html

| Tab | Content |
|-----|---------|
| Prerequisites | `prerequisites` (phase 0 setup) |
| Execution | `execution_order` — feature sequence with scope, exit gates, scenario gates |
| Summary | `summary` table — cumulative scenario counts |
| Comments | All inline comments + export |

## HTML Structure

Every brief is a self-contained HTML5 document. All CSS and JS are inline. No external dependencies.

### Document Head

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Artifact Name} — {slug}</title>
  <style>
    /* LifeOS Dark design system — all tokens and component classes inline */
  </style>
</head>
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

- Status badge colors: DRAFT (yellow `--status-draft`), VALIDATED (green `--status-validated`), LOCKED (blue `--status-locked`)
- Hub link navigates to `hub.html`

### Tab Bar

```
┌──────────┬──────────┬──────────┬──────────┐
│  Tab 1   │  Tab 2   │  Tab 3   │ Comments │
│ (active) │          │          │   (3)    │
└──────────┴──────────┴──────────┴──────────┘
```

- Active tab: `--bg-secondary` background, `--color-water` bottom border, `--text-primary` text
- Inactive tab: `--bg-primary` background, no border, `--text-secondary` text
- Comments tab shows count badge from localStorage
- Tab state persists via URL hash (e.g., `#identity`, `#features`, `#comments`)

## Design System: LifeOS Dark

All CSS is inlined in every brief. No external stylesheets.

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
  --color-air: #39D353;
  --color-water: #58A6FF;
  --color-earth: #8B949E;
  --color-fire: #F0A000;

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
body {
  font-family: 'Arial Rounded MT Bold', 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  margin: 0;
}
code, pre, .mono {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
}
h1 { font-size: 28px; color: var(--color-water); border-bottom: 1px solid var(--border-default); padding-bottom: 8px; }
h2 { font-size: 20px; color: var(--color-air); border-bottom: 1px solid var(--border-default); padding-bottom: 8px; }
h3 { font-size: 16px; color: var(--text-primary); }
```

### Layout

```css
.container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
```

### Card Component

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

/* Colored left borders for categorization */
.card-air   { border-left: 4px solid var(--color-air); }   /* features, approved, in-scope */
.card-water { border-left: 4px solid var(--color-water); } /* architecture, components, scenarios */
.card-fire  { border-left: 4px solid var(--color-fire); }  /* risks, blockers, failure conditions */
.card-earth { border-left: 4px solid var(--color-earth); } /* deferred, out-of-scope, notes */
```

### Badge Component

```css
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-draft     { background: rgba(251,191,36,0.15); color: var(--status-draft); }
.badge-validated { background: rgba(74,222,128,0.15); color: var(--status-validated); }
.badge-locked    { background: rgba(88,166,255,0.15); color: var(--status-locked); }
.badge-count     { background: var(--bg-tertiary); color: var(--text-secondary); margin-left: 4px; }
```

### Table Component

```css
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: var(--bg-tertiary); color: var(--text-primary); padding: 10px 12px; text-align: left; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); }
tr:hover { background: rgba(88,166,255,0.05); }
```

### Tab Navigation

```css
.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 24px;
  gap: 4px;
}
.tab-btn {
  padding: 10px 18px;
  background: var(--bg-primary);
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.15s;
}
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active {
  background: var(--bg-secondary);
  border-bottom-color: var(--color-water);
  color: var(--text-primary);
}
.tab-content { display: none; }
.tab-content.active { display: block; }
```

### Hub Link

```css
.hub-link {
  display: inline-block;
  color: var(--color-water);
  text-decoration: none;
  font-size: 13px;
  margin-bottom: 16px;
}
.hub-link:hover { text-decoration: underline; }
```

## Inline Comment System

All content areas are selectable for inline comments. The system is implemented entirely in vanilla JS, stored in localStorage.

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

Popup CSS:
```css
.comment-popup {
  position: fixed;
  background: var(--comment-popup-bg);
  border: 1px solid var(--border-accent);
  border-radius: 8px;
  padding: 16px;
  min-width: 280px;
  max-width: 360px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  display: none;
}
.comment-popup.visible { display: block; }
.comment-selected-text {
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  max-height: 60px;
  overflow: hidden;
  font-style: italic;
}
.comment-textarea {
  width: 100%;
  min-height: 80px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  padding: 8px;
  resize: vertical;
  box-sizing: border-box;
}
.comment-textarea:focus { border-color: var(--border-accent); outline: none; }
.comment-popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
.comment-btn {
  padding: 5px 14px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}
.comment-btn-save {
  background: var(--color-water);
  color: var(--bg-primary);
  border-color: var(--color-water);
  font-weight: bold;
}
```

### Highlight Styles

```css
.comment-highlight {
  background: var(--comment-highlight);
  cursor: pointer;
  border-bottom: 2px solid var(--color-fire);
  border-radius: 2px;
}
.comment-highlight:hover {
  background: var(--comment-highlight-hover);
}
```

### Comments Tab Layout

```
┌─────────────────────────────────────────────┐
│  Comments (3)                               │
│                                             │
│  1. "selected text excerpt..."              │
│     Tab: Identity                           │
│     > Your comment here                     │
│     [Delete]                                │
│                                             │
│  ──────────────────────────────────────     │
│  [Export Comments JSON]                     │
│                                             │
│  Overall action:                            │
│  [Tether]  [Vanish]  [Orbit]               │
│                                             │
└─────────────────────────────────────────────┘
```

Comments tab CSS:
```css
.comment-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.comment-excerpt {
  font-style: italic;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 2px solid var(--color-fire);
}
.comment-tab-label {
  font-size: 11px;
  color: var(--text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.comment-body {
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 10px;
}
.comment-delete-btn {
  padding: 3px 10px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: transparent;
  color: var(--color-fire);
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
}
.export-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-default);
}
.action-btns {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.action-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.action-btn-tether { border-color: var(--color-air); color: var(--color-air); }
.action-btn-tether:hover { background: rgba(57,211,83,0.1); }
.action-btn-vanish { border-color: var(--color-fire); color: var(--color-fire); }
.action-btn-vanish:hover { background: rgba(240,160,0,0.1); }
.action-btn-orbit  { border-color: var(--color-water); color: var(--color-water); }
.action-btn-orbit:hover  { background: rgba(88,166,255,0.1); }
```

### JavaScript (vanilla, inline)

```javascript
// Storage key: meridian-comments-{artifact}-{slug}
const STORAGE_KEY = 'meridian-comments-{artifact}-{slug}';
let comments = [];
let pendingRange = null;
let currentTabName = '';

// --- Tab navigation ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
  currentTabName = tabName;
  window.location.hash = tabName;
  if (tabName === 'comments') renderComments();
}

function initTabs() {
  const hash = window.location.hash.replace('#', '');
  const tabs = document.querySelectorAll('.tab-btn');
  if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
    switchTab(hash);
  } else if (tabs.length > 0) {
    switchTab(tabs[0].dataset.tab);
  }
}

// --- Text selection + popup ---
document.addEventListener('mouseup', function(e) {
  if (e.target.closest('.comment-popup')) return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
    hidePopup();
    return;
  }
  const range = selection.getRangeAt(0);
  const activeTab = document.querySelector('.tab-content.active');
  if (!activeTab || activeTab.id === 'tab-comments') return;
  const selectedText = selection.toString().trim();
  pendingRange = range.cloneRange();
  showPopup(e.clientX, e.clientY, selectedText);
});

function showPopup(x, y, selectedText) {
  const popup = document.getElementById('comment-popup');
  popup.querySelector('.comment-selected-text').textContent = `"${selectedText.substring(0, 80)}${selectedText.length > 80 ? '...' : ''}"`;
  popup.querySelector('.comment-textarea').value = '';
  popup.classList.add('visible');
  // Position viewport-aware
  const pw = 360, ph = 200;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = x + 12, top = y + 12;
  if (left + pw > vw) left = x - pw - 12;
  if (top + ph > vh) top = y - ph - 12;
  popup.style.left = Math.max(8, left) + 'px';
  popup.style.top = Math.max(8, top) + 'px';
}

function hidePopup() {
  document.getElementById('comment-popup').classList.remove('visible');
  pendingRange = null;
}

function saveComment() {
  const popup = document.getElementById('comment-popup');
  const commentText = popup.querySelector('.comment-textarea').value.trim();
  if (!commentText) { hidePopup(); return; }

  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';

  const comment = {
    id: 'c-' + Date.now(),
    tab: currentTabName,
    selected_text: selectedText,
    comment: commentText,
    created_at: new Date().toISOString()
  };

  if (pendingRange) {
    const mark = document.createElement('mark');
    mark.className = 'comment-highlight';
    mark.dataset.commentId = comment.id;
    mark.addEventListener('click', () => openCommentEdit(comment.id));
    try {
      pendingRange.surroundContents(mark);
    } catch(e) {
      // Range spans multiple elements — wrap with span instead
      const span = document.createElement('span');
      span.className = 'comment-highlight';
      span.dataset.commentId = comment.id;
      pendingRange.insertNode(span);
    }
  }

  comments.push(comment);
  saveCommentsToStorage();
  updateCommentCount();
  hidePopup();
  window.getSelection().removeAllRanges();
}

function openCommentEdit(commentId) {
  const comment = comments.find(c => c.id === commentId);
  if (!comment) return;
  const popup = document.getElementById('comment-popup');
  popup.querySelector('.comment-selected-text').textContent = `"${comment.selected_text.substring(0, 80)}..."`;
  const ta = popup.querySelector('.comment-textarea');
  ta.value = comment.comment;
  popup.classList.add('visible');
  popup.style.left = '50%';
  popup.style.top = '30%';
  popup.style.transform = 'translateX(-50%)';
  const saveBtn = popup.querySelector('.comment-btn-save');
  saveBtn.onclick = () => {
    comment.comment = ta.value.trim();
    saveCommentsToStorage();
    hidePopup();
    renderComments();
  };
}

function deleteComment(commentId) {
  comments = comments.filter(c => c.id !== commentId);
  const mark = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (mark) {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  }
  saveCommentsToStorage();
  renderComments();
  updateCommentCount();
}

function renderComments() {
  const list = document.getElementById('comments-list');
  if (!list) return;
  if (comments.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dimmed);font-style:italic;">No comments yet. Select text anywhere to add a comment.</p>';
    return;
  }
  list.innerHTML = comments.map((c, i) => `
    <div class="comment-item">
      <div class="comment-tab-label">Tab: ${c.tab}</div>
      <div class="comment-excerpt">${c.selected_text.substring(0, 100)}${c.selected_text.length > 100 ? '...' : ''}</div>
      <div class="comment-body">${c.comment}</div>
      <button class="comment-delete-btn" onclick="deleteComment('${c.id}')">Delete</button>
    </div>
  `).join('');
}

function updateCommentCount() {
  const badge = document.getElementById('comments-count-badge');
  if (badge) badge.textContent = comments.length > 0 ? comments.length : '';
}

function loadComments() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) comments = JSON.parse(stored);
  } catch(e) { comments = []; }
  updateCommentCount();
}

function saveCommentsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function exportFeedback(action) {
  const payload = {
    artifact: '{artifact}-brief',
    slug: '{slug}',
    timestamp: new Date().toISOString(),
    comments: comments,
    action: action
  };
  const json = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(json).catch(() => {});
  if (action !== 'orbit') {
    comments = [];
    saveCommentsToStorage();
    renderComments();
    updateCommentCount();
  }
  // Show confirmation
  const msg = document.getElementById('export-msg');
  if (msg) {
    msg.textContent = `Exported (${action}). JSON copied to clipboard.`;
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  loadComments();
  initTabs();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hidePopup();
});
```

## Hub Page

Hub is regenerated on every invocation of this skill, regardless of which briefs were requested.

### Hub Structure

```html
{artifact_base}/hub.html
```

For each of the 7 artifacts (product, roadmap, features, architecture, tech, scenarios, plan):
- Read the YAML if it exists, extract: `status`, and key summary stat
- Render a card that links to `{artifact}-brief.html`
- If YAML doesn't exist, render card in grayed-out "not started" state

### Hub Summary Stats

| Artifact | Summary Stat |
|----------|--------------|
| product | count of `strategic_goals` |
| roadmap | count of `timeline` feature refs total |
| features | count of `features` |
| architecture | count of `stack` items |
| tech | count of `components` |
| scenarios | `coverage.total_scenarios` |
| plan | count of `execution_order` items |

### Hub Layout

```
┌─────────────────────────────────────────────┐
│  {Product Name or slug}                     │
│  Generated: {timestamp}                     │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ product     │  │ roadmap     │          │
│  │ [STATUS]    │  │ [STATUS]    │          │
│  │ N goals     │  │ N features  │          │
│  └─────────────┘  └─────────────┘          │
│  ... (architecture, tech, scenarios, plan) │
│                                             │
│  product → roadmap → features →            │
│  architecture → tech → scenarios → plan    │
└─────────────────────────────────────────────┘
```

Hub card CSS matches the same design system tokens. Cards link to `{artifact}-brief.html`. Cards for missing YAMLs render with `opacity: 0.4` and no link.

## Context Sections

When rendering a brief that shows a previously-approved artifact as context (e.g., tech-brief shows features summary), render context sections with:

```css
.context-section {
  opacity: 0.7;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  pointer-events: none;  /* not selectable for inline comments */
}
.context-section h3 {
  color: var(--text-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.context-label {
  font-size: 11px;
  color: var(--text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
```

Context sections show "CONTEXT — {artifact name}" as a label, cite the source YAML path, and are non-selectable (cannot receive inline comments).

## Output

```yaml
brief_generation:
  status: "completed"
  briefs_generated:
    - artifact: "{artifact}"
      brief_path: "{output_path}"
      source_yaml: "{yaml_path}"
      status: "generated|skipped_missing_yaml"
  hub_path: "{artifact_base}/hub.html"
  hub_status: "generated"
  missing_yamls:
    - "{yaml path if any}"
```

Return this structure to the calling agent.

## Constraints

- NEVER include external CSS, JavaScript, or font CDN links — the HTML must be self-contained
- NEVER use JavaScript frameworks or libraries — vanilla JS only
- NEVER modify input YAML artifacts — read-only
- NEVER use section toggles (Approve/Revise) — this version uses inline text selection comments only
- ALWAYS use the LifeOS Dark design tokens — no ad-hoc colors or fonts
- ALWAYS regenerate hub.html on every invocation, regardless of which briefs were requested
- ALWAYS generate valid, well-formed HTML5
- ALWAYS use localStorage key `meridian-comments-{artifact}-{slug}` for comment persistence
- ALWAYS render the Comments tab as the last tab with count badge
- ALWAYS skip (not halt) if a requested artifact's YAML is missing — report it in output
- ALWAYS apply `pointer-events: none` to context sections so they cannot receive inline comments

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | documentation |
