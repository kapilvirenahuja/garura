---
name: generate-product-brief
description: Generate product-brief.html with tabbed layout and inline comment system from product.yaml
user-invocable: false
model: sonnet
allowed-tools: Read, Write
category: documentation
version: 2.0.0
---

# generate-product-brief

Model-invocable skill for generating a self-contained HTML brief from product.yaml with tabbed layout and inline text selection comments.

## Purpose

Read product.yaml from STM and produce a self-contained `product-brief.html` document that a human can open in a browser to review product discovery results and provide inline feedback via text selection. Also regenerates `hub.html`. The brief uses the LifeOS Dark design system with tabbed navigation and an inline comment system (select text to annotate).

You DO generate the HTML artifact and regenerate hub.html. You do NOT interpret feedback or decide what happens next.

## Output Schema

Produces two HTML files (not YAML). Output metadata returned to the calling agent:

| Field | Type | Description |
|-------|------|-------------|
| `brief.path` | string | Full path to the generated `product-brief.html` |
| `brief.hub_path` | string | Full path to the regenerated `hub.html` |
| `brief.slug` | string | Product slug used in localStorage key and export payload |
| `brief.tabs` | list | `[market_context, vision, scope, comments]` when type = "product"; `[technical_context, vision, scope, comments]` when type = "library" |
| `brief.format` | string | Always `"html"` |
| `brief.self_contained` | boolean | Always `true` — no external CSS, JS, or font dependencies |

HTML design system and structure are defined in this skill's `## Design System` and `## HTML Structure` sections. See also `core/components/memory/brief-principles.md` for the LifeOS Dark design language and interaction patterns this skill implements.

## Input

Receive from agent:
- `product_slug` — (required) Product slug for identification
- `product_yaml_path` — (required) Path to the product.yaml artifact
- `artifact_base` — (required) Base path, e.g., `.meridian/project/product/`

## Process

1. **Read product.yaml** at `product_yaml_path`. Extract all fields: slug, status, type, problem, target_users, competitors, market_size, differentiators, risks, value_proposition, strategic_goals, success_metrics, assumptions, out_of_scope.

   **Read `type` field from product.yaml. Default to "product" if absent.**

   **When type = "product" (existing behavior):**
   - Tab 1: "Market Context" — renders all market fields
   - Tab 2: "Vision" — unchanged
   - Tab 3: "Scope" — unchanged
   - Tab 4: "Comments" — unchanged

   **When type = "library":**
   - Tab 1: "Technical Context" — renders only non-empty fields from the market section:
     - Problem → renders as "Purpose" heading
     - Target Users → renders as "Consumers" if non-empty, skipped if empty
     - Competitors → skipped entirely
     - Market Size → skipped entirely
     - Differentiators → renders as "Technical Differentiators" if non-empty
     - Risks → renders as "Technical Risks" if non-empty
   - Tab 2: "Vision" — unchanged
   - Tab 3: "Scope" — unchanged
   - Tab 4: "Comments" — unchanged

   **Key rule:** Render what exists. Skip empty sections. Do not render empty cards or "No data" placeholders.

2. **Determine output path:** `{artifact_base}{product_slug}/product-brief.html` (no timestamp in filename).

3. **Build product-brief.html** as a fully self-contained HTML5 document following the structure and design system defined in this skill. All CSS and JS inline — no external dependencies.

4. **Regenerate hub.html** at `{artifact_base}{product_slug}/hub.html`. Read all existing YAML files in the slug directory to extract status and summary counts for each artifact card.

5. **Write both files** using the Write tool.

## HTML Structure: product-brief.html

### Document Layout

```
Header: Product name, [STATUS BADGE], slug, Generated timestamp, Source: product.yaml, [← Hub]
Tab bar: [Market Context | Technical Context] [Vision] [Scope] [Comments (N)]
Tab content panel
```

Tab 1 label is "Market Context" when type = "product" and "Technical Context" when type = "library".

### Tab 1 — Market Context

Renders from: `problem`, `target_users`, `competitors`, `market_size`, `differentiators`, `risks`

Content blocks:
- **Problem** — plain text paragraph
- **Target Users** — one card per user with fire-color left border, showing `persona`, `goal`, `frustration`, `context`
- **Competitors** — table with columns: Competitor, Strengths, Weaknesses, Our Advantage
- **Market Size** — card with TAM / SAM / SOM and derivation note (skip if all null)
- **Differentiators** — list with air-color left borders
- **Market Risks** — list with fire-color left borders

### Tab 2 — Vision

Renders from: `value_proposition`, `strategic_goals`, `success_metrics`

Content blocks:
- **Value Proposition** — highlighted box (`rgba(88,166,255,0.08)` background, blue border)
- **Strategic Goals** — numbered cards with air-color left border; each shows: id, title, description, metric, target, measurement
- **Success Metrics** — table with columns: Goal Ref, Metric, Target, Measurement Method

### Tab 3 — Scope

Renders from: `assumptions`, `out_of_scope`

Content blocks:
- **Assumptions** — list items, each as a card with water-color left border
- **Out of Scope** — one card per entry with earth-color left border, showing `category` and `rationale`

### Tab 4 — Comments

Shows all inline comments collected via text selection. See Inline Comment System below.

## Design System

Use the LifeOS Dark design system. All values embedded inline in the `<style>` block.

### Color Tokens

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

### Typography

```css
body {
  font-family: 'Arial Rounded MT Bold', 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
}
code, pre, .mono { font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; font-size: 13px; }
h1 { font-size: 28px; color: var(--color-water); border-bottom: 1px solid var(--border-default); padding-bottom: 8px; }
h2 { font-size: 20px; color: var(--color-air); border-bottom: 1px solid var(--border-default); padding-bottom: 8px; }
h3 { font-size: 16px; color: var(--text-primary); }
```

### Layout

```css
.container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
.header { margin-bottom: 24px; }
.hub-link { color: var(--color-water); text-decoration: none; font-size: 13px; }
.hub-link:hover { text-decoration: underline; }
.source-path { font-size: 12px; color: var(--text-dimmed); font-family: monospace; margin-top: 4px; }

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: var(--shadow-retro);
  padding: 20px;
  margin-bottom: 16px;
}
.card:hover { border-color: var(--border-accent); }

.card-air   { border-left: 3px solid var(--color-air); }
.card-water { border-left: 3px solid var(--color-water); }
.card-earth { border-left: 3px solid var(--color-earth); }
.card-fire  { border-left: 3px solid var(--color-fire); }

.highlight-box {
  background: rgba(88,166,255,0.08);
  border: 1px solid rgba(88,166,255,0.2);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-draft     { background: rgba(251,191,36,0.15); color: var(--status-draft); }
.badge-validated { background: rgba(74,222,128,0.15); color: var(--status-validated); }
.badge-locked    { background: rgba(88,166,255,0.15); color: var(--status-locked); }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: var(--bg-tertiary); color: var(--text-primary); padding: 10px 12px; text-align: left; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border-default); color: var(--text-secondary); }
tr:hover { background: rgba(88,166,255,0.05); }
```

### Tab Bar

```css
.tab-bar { display: flex; border-bottom: 1px solid var(--border-default); margin-bottom: 24px; }
.tab-btn {
  padding: 10px 20px;
  background: var(--bg-primary);
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
}
.tab-btn.active {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--color-water);
  color: var(--text-primary);
}
.tab-btn:hover:not(.active) { color: var(--text-primary); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
.comment-count-badge {
  display: inline-block;
  margin-left: 6px;
  background: var(--color-fire);
  color: var(--bg-primary);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: bold;
}
```

## Inline Comment System

### How It Works

1. User selects text anywhere in tabs 1–3
2. A popup appears near the selection with a comment textarea
3. User saves — selected text is highlighted, comment is stored in localStorage
4. Comments tab shows count badge and lists all comments
5. Comments persist across page reloads via localStorage keyed by `meridian-comments-product-{slug}`
6. Export JSON button available in the Comments tab

### Comment Popup HTML

```html
<div id="comment-popup" style="display:none; position:fixed; z-index:1000; background:var(--comment-popup-bg); border:1px solid var(--border-accent); border-radius:8px; padding:16px; max-width:320px; box-shadow:0 4px 20px rgba(0,0,0,0.5);">
  <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">Add Comment</div>
  <div id="popup-selected-text" style="font-size:12px; color:var(--text-dimmed); background:var(--bg-primary); padding:6px 8px; border-radius:4px; margin-bottom:8px; max-height:60px; overflow:hidden; font-style:italic;"></div>
  <textarea id="popup-comment-input" placeholder="Your comment..." style="width:100%; min-height:80px; background:var(--bg-primary); border:1px solid var(--border-default); border-radius:4px; color:var(--text-primary); font-family:inherit; font-size:13px; padding:8px; resize:vertical;"></textarea>
  <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
    <button onclick="cancelComment()" style="padding:5px 14px; background:transparent; border:1px solid var(--border-default); border-radius:4px; color:var(--text-secondary); cursor:pointer; font-family:inherit;">Cancel</button>
    <button onclick="saveComment()" style="padding:5px 14px; background:var(--color-water); border:none; border-radius:4px; color:var(--bg-primary); cursor:pointer; font-family:inherit; font-weight:bold;">Save</button>
  </div>
</div>
```

### Comment Highlight CSS

```css
.comment-highlight {
  background: var(--comment-highlight);
  cursor: pointer;
  border-bottom: 2px solid var(--color-fire);
}
.comment-highlight:hover { background: var(--comment-highlight-hover); }
```

### Comments Tab Content

```html
<div id="tab-comments" class="tab-panel">
  <h2>Comments</h2>
  <div id="comments-list"><!-- populated by renderComments() --></div>
  <div style="margin-top:24px; border-top:1px solid var(--border-default); padding-top:16px;">
    <button onclick="exportFeedback('tether')" class="action-btn" style="background:rgba(57,211,83,0.15); color:var(--color-air); border:1px solid var(--color-air);">Tether</button>
    <button onclick="exportFeedback('vanish')" class="action-btn" style="background:rgba(240,160,0,0.15); color:var(--color-fire); border:1px solid var(--color-fire);">Vanish</button>
    <button onclick="exportFeedback('orbit')" class="action-btn" style="background:rgba(88,166,255,0.15); color:var(--color-water); border:1px solid var(--color-water);">Orbit</button>
    <button onclick="exportFeedback(null)" class="action-btn" style="background:var(--bg-tertiary); color:var(--text-secondary); border:1px solid var(--border-default);">Export JSON</button>
  </div>
</div>
```

Each comment in the list shows:
- Highlighted text excerpt (italic, dimmed)
- Which tab it's on
- The comment text
- Delete button

### JavaScript (inline, vanilla only)

```javascript
// State
let pendingSelection = null;
const STORAGE_KEY = 'meridian-comments-product-{slug}';
let comments = [];

// Tab navigation
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
  if (tabName === 'comments') renderComments();
  window.location.hash = tabName;
}

// Text selection → popup
function handleTextSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
  const range = sel.getRangeAt(0);
  // Only allow in tabs 1-3 content panels
  const panel = range.commonAncestorContainer.parentElement.closest('.tab-panel');
  if (!panel || panel.id === 'tab-comments') return;
  const rect = range.getBoundingClientRect();
  pendingSelection = { text: sel.toString().trim(), range: range, tab: panel.id.replace('tab-', '') };
  const popup = document.getElementById('comment-popup');
  document.getElementById('popup-selected-text').textContent = '"' + pendingSelection.text.slice(0, 100) + (pendingSelection.text.length > 100 ? '...' : '') + '"';
  document.getElementById('popup-comment-input').value = '';
  popup.style.display = 'block';
  const top = Math.min(rect.top + window.scrollY - popup.offsetHeight - 10, window.scrollY + window.innerHeight - 350);
  popup.style.top = Math.max(window.scrollY + 10, top) + 'px';
  popup.style.left = Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - 340) + 'px';
}

function cancelComment() {
  document.getElementById('comment-popup').style.display = 'none';
  pendingSelection = null;
  window.getSelection().removeAllRanges();
}

function saveComment() {
  if (!pendingSelection) return;
  const text = document.getElementById('popup-comment-input').value.trim();
  if (!text) return;
  const id = 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
  const comment = { id, tab: pendingSelection.tab, selected_text: pendingSelection.text, comment: text, created_at: new Date().toISOString() };
  // Wrap selection in highlight span
  try {
    const span = document.createElement('span');
    span.className = 'comment-highlight';
    span.dataset.commentId = id;
    span.onclick = () => showCommentDetail(id);
    pendingSelection.range.surroundContents(span);
  } catch(e) { /* overlapping ranges — skip wrapping */ }
  comments.push(comment);
  saveCommentsToStorage();
  updateCommentBadge();
  document.getElementById('comment-popup').style.display = 'none';
  pendingSelection = null;
  window.getSelection().removeAllRanges();
}

function deleteComment(id) {
  comments = comments.filter(c => c.id !== id);
  const span = document.querySelector(`[data-comment-id="${id}"]`);
  if (span) { span.replaceWith(span.textContent); }
  saveCommentsToStorage();
  updateCommentBadge();
  renderComments();
}

function renderComments() {
  const list = document.getElementById('comments-list');
  if (comments.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dimmed)">No comments yet. Select text in any tab to add a comment.</p>';
    return;
  }
  list.innerHTML = comments.map((c, i) => `
    <div class="card" style="margin-bottom:12px;">
      <div style="font-size:12px; color:var(--text-dimmed); margin-bottom:6px;">${i+1}. Tab: ${c.tab}</div>
      <div style="font-size:13px; color:var(--text-secondary); font-style:italic; margin-bottom:8px;">"${c.selected_text.slice(0,120)}${c.selected_text.length>120?'...':''}"</div>
      <div style="font-size:14px; color:var(--text-primary); margin-bottom:10px;">${c.comment}</div>
      <button onclick="deleteComment('${c.id}')" style="font-size:12px; padding:3px 10px; background:transparent; border:1px solid var(--color-fire); color:var(--color-fire); border-radius:4px; cursor:pointer;">Delete</button>
    </div>
  `).join('');
}

function updateCommentBadge() {
  const badge = document.getElementById('comment-tab-badge');
  if (badge) badge.textContent = comments.length || '';
  badge.style.display = comments.length ? 'inline-block' : 'none';
}

function loadComments() {
  try { comments = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e) { comments = []; }
  updateCommentBadge();
}

function saveCommentsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function exportFeedback(action) {
  const payload = {
    artifact: 'product-brief',
    slug: '{slug}',
    timestamp: new Date().toISOString(),
    comments: comments,
    action: action
  };
  const json = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(json).catch(() => {});
  if (action) {
    localStorage.removeItem(STORAGE_KEY);
    comments = [];
    updateCommentBadge();
    renderComments();
  }
  alert('Feedback copied to clipboard.');
}

// Init
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelComment(); });
window.addEventListener('load', () => {
  loadComments();
  const hash = window.location.hash.replace('#', '');
  if (hash) switchTab(hash); else switchTab('market-context');
});
```

## hub.html Structure

Hub is always regenerated when product-brief.html is generated.

```html
<!-- Hub layout -->
<div class="container">
  <h1>{Product Name} <span class="badge badge-{status}">{STATUS}</span></h1>
  <p style="color:var(--text-dimmed)">{slug}</p>
  <div class="artifact-grid">
    <!-- One card per artifact: product, roadmap, features, architecture, tech, scenarios, plan -->
    <!-- Card shows: artifact name (link), status badge, summary stat, comment count -->
    <!-- Grayed out if YAML doesn't exist yet -->
  </div>
  <p style="font-size:12px; color:var(--text-dimmed); margin-top:24px;">Dependency: product → roadmap → features → architecture → tech → scenarios → plan</p>
</div>
```

Hub card for each artifact:
- Reads YAML if it exists, extracts `status` and summary count (strategic_goals count for product, etc.)
- Reads localStorage for comment count per artifact
- Links to `{artifact}-brief.html` if YAML exists, otherwise grayed out

## Output

```yaml
# type=product
brief:
  path: "{artifact_base}{slug}/product-brief.html"
  hub_path: "{artifact_base}{slug}/hub.html"
  slug: "{product_slug}"
  tabs:
    - market_context
    - vision
    - scope
    - comments
  format: "html"
  self_contained: true

# type=library
brief:
  path: "{artifact_base}{slug}/product-brief.html"
  hub_path: "{artifact_base}{slug}/hub.html"
  slug: "{product_slug}"
  tabs:
    - technical_context
    - vision
    - scope
    - comments
  format: "html"
  self_contained: true
```

**IMPORTANT**: This skill produces HTML artifacts and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER include external CSS, JavaScript, or font CDN links — HTML must be fully self-contained
- NEVER use JavaScript frameworks or libraries — vanilla JS only
- NEVER modify input artifacts — read-only
- NEVER include engineering implementation details in any tab content
- ALWAYS use the LifeOS Dark design tokens defined in this skill
- ALWAYS implement the four-tab layout: Market Context, Vision, Scope, Comments
- ALWAYS implement the inline text selection comment system (not section toggles)
- ALWAYS regenerate hub.html alongside product-brief.html
- ALWAYS use filename `product-brief.html` with no timestamp
- ALWAYS generate valid, well-formed HTML5
- ALWAYS persist comments to localStorage keyed by `meridian-comments-product-{slug}`
- ALWAYS read type field from product.yaml before determining tab layout
- NEVER render empty sections or "No data" placeholders — skip them entirely
- ALWAYS use "Technical Context" as Tab 1 name when type is "library"

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | documentation |
