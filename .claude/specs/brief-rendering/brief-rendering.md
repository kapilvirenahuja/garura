# Spec: Client-Side Brief Rendering

## Problem

The current brief generation pipeline invokes Claude Sonnet (via `generate-implementation-brief`, `generate-product-brief`, and `draft-roadmap-brief` skills) to read each YAML artifact plus an HTML template reference, then generate the entire HTML document from scratch. This is slow (minutes for 7 artifacts), wasteful of LLM tokens, and produces non-deterministic output. The templates already define the complete structure, and the YAML schemas are well-defined. The LLM is performing a mechanical data-to-HTML substitution that should be deterministic code.

## Design Principle (Non-Negotiable)

**HTML must be 1:1 with YAML.** Every section in the YAML gets a section in the HTML, even if the YAML section is empty. No skipping sections. No "render what exists" logic. Empty sections render as blank/empty containers. Nothing more and nothing less than what is in the YAML.

## Desired Outcome

Brief generation completes in under 5 seconds for all 7 artifact types (down from minutes). Briefs are pixel-identical across runs for the same YAML input. No LLM is involved in brief production. All existing UX is preserved: Phoenix Design System, theme switching (dark/light/vibrant), sidebar navigation with active-on-scroll, inline comments, Tether/Vanish/Orbit export, and hub.html index.

## Architecture

```
YAML artifact (source of truth, unchanged)
    ↓ on-the-fly conversion (in briefs recipe)
JSON data file (derived artifact, written alongside YAML)
    ↓ loaded by browser
Static HTML template (with embedded JS)
    ↓ JS reads JSON, renders DOM
Rendered brief (in browser, instant)
```

### Data Flow

1. Upstream skills/recipes produce YAML artifacts (unchanged)
2. `briefs` recipe detects YAML changes via existing checksum logic (unchanged)
3. For each changed YAML: programmatic `yaml.load() → JSON.stringify() → write .json sibling` (new)
4. Copy corresponding static HTML template to briefs directory, inline CSS (new)
5. Browser opens HTML, embedded JS fetches JSON, renders all sections (new)

---

## Scope

### In Scope

1. **briefs recipe** (`core/components/recipes/briefs/SKILL.md`) — replace LLM-based generation with YAML→JSON conversion + template copy
2. **7 HTML templates** (`core/components/memory/standards/templates/`) — transform from placeholder reference documents into self-rendering templates with embedded JS
3. **Shared rendering primitives** — ~200 lines of JS shared across all 7 templates (inlined)
4. **Per-template render functions** — ~500 lines total across 7 templates
5. **hub.html** — convert to static template with JSON manifest
6. **doc-builder agent** (`core/components/agents/doc-builder.md`) — simplify or remove
7. **brief-common.css** — preserved as-is, continues to be inlined

### Out of Scope

- All upstream skills/recipes that produce YAML artifacts (no changes)
- YAML schemas (no changes)
- Phoenix Design System CSS (preserved, inlined)
- Inline comment system (preserved, already vanilla JS + localStorage)
- Theme switching, sidebar navigation, active-on-scroll (preserved)
- Tether/Vanish/Orbit export (preserved)
- Checksum-based staleness detection (preserved, still triggers conversion)

### Skills to Remove

| Skill | Location | Reason |
|-------|----------|--------|
| `generate-implementation-brief` | `core/components/skills/generate-implementation-brief/` | Replaced by client-side rendering |
| `generate-product-brief` | `core/components/skills/generate-product-brief/` | Replaced by client-side rendering |
| `draft-roadmap-brief` | `core/components/skills/draft-roadmap-brief/` | Replaced by client-side rendering |

---

## Change 1: YAML-to-JSON Conversion (briefs recipe)

### Current Behavior

The recipe delegates to `doc-builder` agent with a contract containing `briefs_requested`. Doc-builder invokes LLM skills which read YAML and produce HTML.

### New Behavior

The recipe performs conversion directly (no agent delegation needed):

1. **Check checksums** (unchanged)
2. **For each changed YAML:**
   a. Read YAML file content
   b. Parse YAML to object (`js-yaml` or shell-level tool like `yq`)
   c. Write `.json` sibling at same path (e.g., `product.yaml` → `product.json`)
   d. Read `brief-common.css` from templates directory
   e. Read corresponding HTML template from templates directory
   f. Inline CSS into template (replace marker)
   g. Write assembled HTML to `{artifact_base}/briefs/{artifact}-brief.html`
3. **Generate hub.json manifest** (replaces doc-builder hub.html generation)
4. **Copy hub.html template** to briefs directory
5. **Update checksums** (unchanged)

### JSON File Locations

JSON files are written as siblings to their YAML sources:

```
{product_base}/{slug}/
  product.yaml          (source, unchanged)
  product.json          (derived, new)
  roadmap.yaml          (source, unchanged)
  roadmap.json          (derived, new)
  epics/{epic_id}/
    features.yaml       (source, unchanged)
    features.json       (derived, new)
    architecture.yaml   (source, unchanged)
    architecture.json   (derived, new)
    ...
```

Templates need predictable relative paths to fetch data. Cross-document references (architecture needs product.json) resolve via relative paths. The briefs/ directory can be deleted with zero impact — JSON is re-derived from YAML.

---

## Change 2: Static HTML Templates with Embedded JS

### Current State

The 7 templates use `{PLACEHOLDER}` syntax as reference documents for the LLM. They already contain full Phoenix CSS, sidebar, theme switcher, and template-specific CSS.

### New State

Templates become functional self-rendering documents:

1. **Remove all `{PLACEHOLDER}` markers** — replace with empty DOM containers with `id` attributes
2. **Add shared rendering JS** (~200 lines, inlined)
3. **Add template-specific `render()` function** that fetches JSON and populates all sections
4. **Preserve all existing static elements** — sidebar, theme switcher, nav, CSS

### Template Structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <style>/* Phoenix Design System — brief-common.css inlined by recipe */</style>
  <style>/* Template-specific CSS (already present) */</style>
</head>
<body>
  <!-- Sidebar (static, unchanged) -->
  <aside class="sidebar"><!-- nav, meta, theme switcher, T/V/O --></aside>

  <!-- Main content — ALL sections pre-defined -->
  <main>
    <section class="chapter" id="chapter-1">
      <h3>Section Name</h3>
      <div id="section-name"><!-- JS populates from JSON --></div>
    </section>
    <!-- ... all chapters/sections present ... -->
  </main>

  <script>/* Shared rendering primitives (~200 lines) */</script>
  <script>/* Existing static JS: theme, sidebar, scroll, export */</script>
  <script>
    async function render() {
      const data = await fetch('./product.json').then(r => r.json());
      renderCards(document.getElementById('target-users'), data.target_users, 'card-fire', {...});
      renderTable(document.getElementById('competitors'), data.competitors, [...]);
      // ... every section populated, empty data = empty container
    }
    render();
  </script>
</body>
</html>
```

### 1:1 Section Rendering Rule

Every YAML top-level key maps to an HTML section. The template defines ALL sections statically. JS populates them. Empty YAML sections produce empty HTML sections (heading and container visible, no cards/rows/text). No conditional hiding. No "skip if empty."

If `product.yaml` has an empty `competitors` array, the Competitors heading and empty table still appear. The user sees the section exists but has no data — the correct representation of the YAML's state.

---

## Change 3: Shared Rendering Primitives

Five functions shared across all 7 templates. Inlined in each (self-contained constraint preserved).

### `renderCards(container, items, colorClass, fieldMap)`

Array of objects → `.card` elements with labeled fields.

### `renderTable(container, items, columns)`

Array of objects → `<table>` with header row. Empty array → table with headers, no rows.

### `renderFieldGroup(container, obj, fieldMap)`

Single object → labeled field divs (for `market_size`, `observability`, etc.).

### `renderText(container, text, wrapperClass)`

String → text block (paragraph, highlight-box, code-block).

### Helpers

- `esc(s)` — HTML-escape strings
- `renderValue(v)` — render scalars, arrays (as `<ul>`), or empty
- `badgeClass(status)` — map status → CSS class
- `severityBadge(severity)` — map severity → CSS class

---

## Change 4: Per-Template Render Functions

| Template | Sections | Est. JS Lines | Notes |
|----------|----------|---------------|-------|
| plan-brief | 3 (prerequisites, execution_order, summary) | ~50 | Simplest. Start here as proof of concept |
| product-brief | 12 (problem, target_users, competitors, market_size, differentiators, risks, value_proposition, strategic_goals, success_metrics, assumptions, out_of_scope, profiles) | ~60 | Well-understood, validates product-level flow |
| tech-brief | 5 (project_structure, libraries, data_model, components, feature_mapping) | ~60 | Nested entity fields |
| features-brief | 4 (identity, invariants, scope, features with nested IDD) | ~70 | Features have nested blast_radius, intent, constraints |
| scenarios-brief | 4 (groups with nested scenarios, feature_gates, coverage, gaps) | ~70 | Nested scenario cards within groups |
| roadmap-brief | ~8 (thesis, narrative, assumptions, exclusions, timeline, epics with IDD, feasibility, blockers) | ~90 | Cross-document ref to product.json |
| architecture-brief | 12+ (principles, topology, deployment_units, nfrs, stack, platforms, integrations, agentic PCAM, quality_standards, profiles, risks, deployment, observability) | ~100 | Most complex — reads 3 JSON files |

**Total: ~200 shared + ~500 template-specific ≈ 700 lines JS**

### Cross-Document References

Some templates need data from multiple YAMLs:

- **architecture-brief**: architecture.json + quality-standards.json + product.json (profiles)
- **roadmap-brief**: roadmap.json + product.json (strategic goal names)

Solution: conversion step produces all needed JSON files. Template fetches multiple:
```js
const arch = await fetch('./architecture.json').then(r => r.json());
const qs = await fetch('./quality-standards.json').then(r => r.json()).catch(() => null);
const product = await fetch('../../product.json').then(r => r.json()).catch(() => null);
```

---

## Change 5: Hub.html as Static Template

### Current

Doc-builder generates hub.html directly by globbing for YAMLs, reading status fields, and producing HTML.

### New

The `briefs` recipe produces a `hub.json` manifest:

```json
{
  "product_name": "Product Name",
  "slug": "product-slug",
  "generated_at": "2026-03-26T...",
  "product_level": [
    { "artifact": "product", "status": "draft", "has_brief": true, "brief_path": "product-brief.html", "stat_label": "Strategic Goals", "stat_value": 3 }
  ],
  "epics": [
    {
      "epic_id": "E1",
      "artifacts": [
        { "artifact": "features", "status": "validated", "has_brief": true, "brief_path": "epics/E1/features-brief.html", "stat_label": "Features", "stat_value": 5 }
      ]
    }
  ]
}
```

Hub.html template fetches `hub.json` and renders the artifact grid. Stat extraction (counts of strategic_goals, features, etc.) is done during JSON conversion since the recipe already reads the YAML.

---

## Change 6: doc-builder Agent

### Current Role

Receives contracts from briefs recipe, routes to 3 LLM skills, generates hub.html directly.

### New Role

**Removed for brief generation.** The briefs recipe handles everything:
- YAML→JSON conversion (mechanical)
- Template copy with CSS inlining (mechanical)
- hub.json manifest generation (mechanical)

No agent dispatch needed. This is Option A: remove doc-builder from the brief pipeline entirely.

### Constraint C3 Update

Current: "Brief generation delegated to doc-builder agent."
New: "Brief generation is performed by YAML→JSON conversion and static template copy. No LLM invocation for brief production."

---

## What Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| `briefs` recipe | Checksums → doc-builder → LLM skills | Checksums → YAML→JSON → template copy |
| `generate-implementation-brief` | LLM generates HTML | **Removed** |
| `generate-product-brief` | LLM generates HTML | **Removed** |
| `draft-roadmap-brief` | LLM generates HTML | **Removed** |
| `doc-builder` agent | Orchestrates LLM brief generation | **Removed from brief pipeline** |
| HTML templates | `{PLACEHOLDER}` reference docs | Self-rendering with embedded JS |
| Data format | None (LLM generates HTML directly) | `.json` siblings alongside YAMLs |

## What Does NOT Change

- All upstream skills/recipes producing YAML artifacts
- YAML schemas
- `brief-common.css` (inlined by recipe instead of LLM)
- Template-specific CSS
- Phoenix Design System visual appearance
- Theme switching, sidebar nav, active-on-scroll
- Tether/Vanish/Orbit export
- Inline comment system (localStorage-based)
- Checksum-based staleness detection
- `briefs/` directory convention
- Self-contained HTML constraint

## Performance Target

- Brief generation: **<1 second** per artifact (YAML parse + JSON write + template copy)
- Brief rendering: **instant** (browser opens static HTML, JS renders from local JSON)
- Full pipeline (7 artifacts): **<5 seconds** total (vs current minutes)

---

## Implementation Sequence

### Phase 1: Shared Rendering Primitives
Write ~200 lines of shared JS (renderCards, renderTable, renderFieldGroup, renderText, helpers). This becomes a block inlined into each template.

### Phase 2: Convert Templates (order by complexity)
1. **plan-brief.html** — simplest, proof of concept
2. **product-brief.html** — validates product-level flow
3. **tech-brief.html**
4. **features-brief.html**
5. **scenarios-brief.html**
6. **roadmap-brief.html**
7. **architecture-brief.html** — most complex, do last

For each: replace `{PLACEHOLDER}` with `<div id="...">`, add shared JS, add render(), test with sample JSON.

### Phase 3: Update briefs Recipe
Add YAML→JSON conversion, template copy + CSS inlining, hub.json generation. Remove doc-builder delegation.

### Phase 4: Remove LLM Skills
Archive the 3 brief generation skills. Simplify doc-builder agent.

### Phase 5: Hub.html
Convert to static template with JSON fetch. Add hub.json generation to recipe.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template JS bugs produce malformed HTML | Briefs unreadable | Start with plan-brief as proof of concept |
| Cross-document JSON fetch fails (wrong path) | Some sections empty | `.catch(() => null)` on cross-doc fetches; sections render empty on failure |
| Comment system conflicts with JS rendering | Comments lost | Comment system uses localStorage keyed by artifact+slug; rendering populates DOM before comment init — ensure load order |
| YAML schema changes break render function | Section renders incorrectly | Each render function explicitly maps YAML keys — schema changes require render function updates |
