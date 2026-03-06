---
name: generate-product-brief
description: Generate a self-contained HTML brief from product discovery artifacts for human review with interactive feedback
user-invocable: false
model: sonnet
allowed-tools: Read, Write
category: documentation
version: 1.0.0
---

# generate-product-brief

Model-invocable skill for generating self-contained HTML brief documents from product discovery artifacts.

## Purpose

Read structured product data from STM paths (vision + market context) and produce a self-contained HTML document that a human can open in a browser to review product discovery results and provide structured feedback. The HTML includes an interactive feedback panel that generates a JSON payload the user can copy and provide back to the agent. The brief includes a Business Analysis section generated from vision + market context — no separate business-review.md artifact is needed.

You DO generate the HTML artifact. You do NOT interpret the feedback or decide what happens next.

## Input

Receive from agent:
- `product_slug` — (required) Product slug for identification
- `phase` — (required) Recipe phase that produced this brief (e.g., "DRAFT")
- `vision_path` — (required) Path to the vision.md artifact
- `market_context_path` — (required) Path to market-context.yaml
- `output_path` — (required) Full path where HTML file should be written

## Process

1. **Load template** from LTM at `standards/templates/product-brief.html`. This defines the exact HTML structure, CSS design system, JS feedback panel, and placeholder locations.

2. **Read vision artifact** at `vision_path`. Extract: product name, status, strategic goals, target users, value proposition, competitive landscape, assumptions, out of scope, success metrics.

3. **Read market context** at `market_context_path`. Extract: problem, target_users, competitors, market_size, differentiators, risks.

4. **Generate Business Analysis section** from vision + market context. This section is synthesized inline — not read from a separate file. It includes:
   - "What It Is" — plain-language product summary (from vision value proposition)
   - "Why It Matters" — business case (from market size + differentiators)
   - "User Journeys" — one narrative per persona (from vision target users)
   - "Key Decisions" — business rules derived from strategic goals
   - "Recommended Next Steps" — actionable items for product leadership
   - **Constraint: NO engineering implementation details in this section.**

5. **Populate template** — replace all placeholder variables with rendered content blocks. The resulting HTML must be fully self-contained — all CSS inline, no external dependencies, no CDN links, no JavaScript frameworks.

6. **Write HTML file** to `output_path` using the Write tool.

## HTML Structure

The document has these sections in order:

### Header
- Product name (large heading)
- Status badge (DRAFT/VALIDATED/LOCKED)
- Generation timestamp
- Phase indicator

### Section 1 — Market Opportunity
- Refined problem statement
- Target user personas (cards)
- Competitor landscape (table)
- Market size (if available)
- Differentiators (list)
- Market risks (list)

### Section 2 — Product Vision
- Value proposition (highlighted)
- Strategic Goals (numbered cards with goal + success metric per card)
- Assumptions
- Out of scope

### Section 3 — Business Analysis
- Plain-language summary ("What It Is" / "Why It Matters")
- User journeys (narrative blocks — one per persona)
- Key decisions (business rules from strategic goals)
- Recommended next steps

### Section 4 — Feedback Panel
- Per-section toggle: "Approve" / "Needs Revision" for each of the 3 sections above
- Freeform textarea (min 4 rows) for detailed feedback
- "Generate Feedback JSON" button
- On click: renders a `<pre><code>` block containing the JSON payload
- Copy button next to the code block

### Feedback JSON Schema

```json
{
  "artifact": "discover-product-brief",
  "slug": "{product_slug}",
  "phase": "{phase}",
  "timestamp": "{ISO-8601 generation time}",
  "sections": {
    "market_opportunity": "approve | revise",
    "product_vision": "approve | revise",
    "business_analysis": "approve | revise"
  },
  "feedback": "{freeform text from textarea}",
  "action": "tether | vanish"
}
```

The `action` field is set based on section verdicts:
- All sections "approve" AND no freeform feedback → `"tether"`
- Any section "revise" OR freeform feedback present → `"vanish"`

## Design System

The HTML uses the LifeOS design language. All values below must be embedded in the `<style>` block as CSS custom properties.

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

  /* Four-Element Accents */
  --color-air: #39D353;
  --color-water: #58A6FF;
  --color-earth: #8B949E;
  --color-fire: #F0A000;

  /* Status */
  --status-draft: #fbbf24;
  --status-validated: #4ade80;
  --status-locked: #58A6FF;

  /* Feedback */
  --approve: #39D353;
  --revise: #F0A000;

  /* Borders */
  --border-default: #30363d;
  --border-accent: #58A6FF;

  /* Shadows */
  --shadow-retro: 4px 4px 0 var(--bg-tertiary);
  --glow-green: 0 0 10px rgba(57, 211, 83, 0.3);
  --glow-blue: 0 0 10px rgba(88, 166, 255, 0.3);
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

code, pre, .mono {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
}

h1 { font-size: 28px; color: var(--color-water); }
h2 { font-size: 20px; color: var(--color-air); border-bottom: 1px solid var(--border-default); padding-bottom: 8px; }
h3 { font-size: 16px; color: var(--text-primary); }
```

### Layout

```css
.container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-retro);
}

.card:hover { border-color: var(--border-accent); }

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-draft { background: rgba(251, 191, 36, 0.15); color: var(--status-draft); }
.badge-validated { background: rgba(74, 222, 128, 0.15); color: var(--status-validated); }
.badge-locked { background: rgba(88, 166, 255, 0.15); color: var(--status-locked); }

table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 1px solid var(--border-default); }
td { padding: 8px 12px; border-bottom: 1px solid var(--bg-tertiary); }

.persona-card { border-left: 3px solid var(--color-fire); }
.goal-card { border-left: 3px solid var(--color-air); }
.risk-item { border-left: 3px solid var(--color-fire); padding-left: 12px; margin-bottom: 8px; }
.diff-item { border-left: 3px solid var(--color-air); padding-left: 12px; margin-bottom: 8px; }

.highlight-box {
  background: rgba(88, 166, 255, 0.08);
  border: 1px solid rgba(88, 166, 255, 0.2);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
```

### Feedback Panel Styles

```css
.feedback-panel {
  background: var(--bg-secondary);
  border: 2px solid var(--border-accent);
  border-radius: 8px;
  padding: 24px;
  margin-top: 32px;
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  margin-bottom: 8px;
}

.toggle-btn {
  padding: 4px 14px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.2s;
}

.toggle-btn.active-approve { background: rgba(57, 211, 83, 0.15); color: var(--approve); border-color: var(--approve); }
.toggle-btn.active-revise { background: rgba(240, 160, 0, 0.15); color: var(--revise); border-color: var(--revise); }

.feedback-textarea {
  width: 100%;
  min-height: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  margin-top: 16px;
}

.feedback-textarea:focus { border-color: var(--border-accent); outline: none; box-shadow: var(--glow-blue); }

.submit-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--color-water);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover { box-shadow: var(--glow-blue); }

.json-output {
  margin-top: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 16px;
  position: relative;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
}

.copy-btn:hover { color: var(--color-air); border-color: var(--color-air); }
```

### JavaScript (inline, minimal)

The only JavaScript is for the feedback panel interactivity:

```javascript
// Toggle approve/revise buttons
function toggleSection(section, value) {
  const btns = document.querySelectorAll(`[data-section="${section}"]`);
  btns.forEach(b => {
    b.classList.remove('active-approve', 'active-revise');
    if (b.dataset.value === value) {
      b.classList.add(value === 'approve' ? 'active-approve' : 'active-revise');
    }
  });
}

// Generate feedback JSON
function generateFeedback() {
  const sections = {};
  ['market_opportunity', 'product_vision', 'business_analysis'].forEach(s => {
    const active = document.querySelector(`[data-section="${s}"].active-approve, [data-section="${s}"].active-revise`);
    sections[s] = active ? active.dataset.value : 'approve';
  });
  const feedback = document.getElementById('feedback-text').value.trim();
  const allApproved = Object.values(sections).every(v => v === 'approve');
  const json = {
    artifact: 'discover-product-brief',
    slug: document.getElementById('brief-slug').value,
    phase: document.getElementById('brief-phase').value,
    timestamp: new Date().toISOString(),
    sections: sections,
    feedback: feedback,
    action: (allApproved && !feedback) ? 'tether' : 'vanish'
  };
  const output = document.getElementById('json-output');
  output.querySelector('code').textContent = JSON.stringify(json, null, 2);
  output.style.display = 'block';
}

// Copy JSON to clipboard
function copyJson() {
  const text = document.querySelector('#json-output code').textContent;
  navigator.clipboard.writeText(text);
  const btn = document.querySelector('.copy-btn');
  btn.textContent = 'Copied';
  setTimeout(() => btn.textContent = 'Copy', 1500);
}
```

## Output

```yaml
brief:
  path: "{output_path}"
  slug: "{product_slug}"
  phase: "{phase}"
  sections:
    - market_opportunity
    - product_vision
    - business_analysis
    - feedback_panel
  format: "html"
  self_contained: true
```

## Reference

Load template from LTM: `standards/templates/product-brief.html`
The template defines the exact HTML structure, CSS design system (LifeOS), JS feedback panel, and placeholder locations. Follow it precisely.

**IMPORTANT**: This skill produces an HTML artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER include external CSS, JavaScript, or font CDN links — the HTML must be self-contained
- NEVER use JavaScript frameworks or libraries — vanilla JS only for the feedback panel
- NEVER modify input artifacts — read-only
- NEVER include engineering implementation details in the brief content
- ALWAYS use the LifeOS design tokens defined above — no ad-hoc colors or fonts
- ALWAYS include the feedback panel with all 3 section toggles and the freeform textarea
- ALWAYS generate valid, well-formed HTML5
- ALWAYS include hidden inputs for slug and phase so the feedback JSON can populate them

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | documentation |
