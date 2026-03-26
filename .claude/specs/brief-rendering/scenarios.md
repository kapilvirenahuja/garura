# Verification Scenarios: Client-Side Brief Rendering

## VS-01: YAML-to-JSON Conversion Correctness

**Description:** Given any of the 7 YAML artifact types, when the briefs recipe converts it to JSON, the JSON file must be a lossless, isomorphic representation of the YAML content.

**Pass Criteria:**
- For each YAML file processed, a `.json` sibling exists at the same directory path
- `JSON.parse(readFile(json_path))` produces an object identical to `yaml.load(readFile(yaml_path))` — same keys, same values, same nesting, same array ordering
- No keys added, removed, renamed, or transformed during conversion
- Null/empty values in YAML are preserved as null/empty in JSON (not stripped)

**Test Method:** Convert each of the 7 sample YAMLs. Round-trip compare: `yaml.load(yaml_content)` deep-equals `JSON.parse(json_content)`.

---

## VS-02: 1:1 Section Mapping — All Sections Present

**Description:** Given a YAML artifact with all top-level keys defined (some with data, some empty), when the brief HTML is opened in a browser, every YAML top-level key has a corresponding visible HTML section.

**Pass Criteria:**
- For each YAML top-level key, a `<div id="...">` or `<section>` container exists in the rendered DOM
- Section headings are visible regardless of whether data exists
- No sections are hidden via `display:none`, `visibility:hidden`, or conditional JS removal
- The number of rendered sections equals the number of YAML top-level keys (excluding metadata: slug, status, created_at, updated_at, *_ref)

**Test Method:** Load each brief with its JSON. Query DOM for all section containers. Compare against YAML top-level keys.

---

## VS-03: 1:1 Section Mapping — Empty Sections Render Blank

**Description:** Given a YAML artifact where specific sections have empty arrays `[]`, empty objects `{}`, or null values, when the brief is rendered, those sections appear as visible but empty containers.

**Pass Criteria:**
- A section with an empty array shows the section heading and an empty container (no cards, no "No data" placeholder)
- A section with an empty object shows the section heading and an empty container (no fields)
- A section with a null value shows the section heading and an empty container
- A table section with an empty array shows the table headers row with zero data rows
- No section is skipped, hidden, or omitted due to empty data

**Test Method:** Create a test YAML for each artifact type with all sections set to empty/null. Render and verify all sections are present in DOM with zero child content elements.

---

## VS-04: No Content Beyond YAML

**Description:** Given a YAML artifact, when the brief is rendered, the content displayed comes exclusively from the JSON data. No fabricated, inferred, or hardcoded content beyond what is in the YAML.

**Pass Criteria:**
- Every text string displayed in a card, table cell, or field value traces back to a specific JSON key/value
- No "N/A", "None", "No data available", or similar fabricated placeholders appear
- No content is generated from combining fields or inferring meaning
- Static template labels (section headings, field labels, column headers) are permitted — these are template structure, not data

**Test Method:** Render brief with known JSON. Extract all text nodes from dynamic content containers. Verify each appears in the source JSON.

---

## VS-05: Rendering Primitives — renderCards

**Description:** Given an array of objects and a field map, `renderCards` produces one `.card` element per array item with correct color class and labeled fields.

**Pass Criteria:**
- `renderCards(container, [{a:1, b:2}], 'card-fire', {a:'title:', b:'Label B'})` produces exactly 1 `.card.card-fire` element
- The card contains a `.card-title` div for field mapped with `title:` prefix
- The card contains a `.card-field` div with `.card-field-label` "Label B" and `.card-field-value` "2"
- Array values within an object field render as `<ul><li>` lists
- Empty array input produces zero cards (container remains empty)
- HTML special characters in values are escaped (`<`, `>`, `&`)

**Test Method:** Call renderCards with known inputs, inspect DOM output.

---

## VS-06: Rendering Primitives — renderTable

**Description:** Given an array of objects and column definitions, `renderTable` produces a `<table>` with header row and one data row per item.

**Pass Criteria:**
- Column headers match the `label` field of each column definition
- Each data row has cells matching column `key` lookups on the source object
- Empty array input produces a table with headers and zero data rows (not "no table")
- Array values within cells render as `<ul><li>` lists
- HTML special characters are escaped

**Test Method:** Call renderTable with known inputs, inspect DOM output.

---

## VS-07: Rendering Primitives — renderFieldGroup

**Description:** Given a single object and field map, `renderFieldGroup` produces labeled field divs for each mapped key.

**Pass Criteria:**
- Each key in the field map produces a `.card-field` div with label and value
- Null/undefined values produce an empty `.card-field-value` (not omitted)
- Null object input produces zero fields (container remains empty)

**Test Method:** Call renderFieldGroup with known inputs, inspect DOM output.

---

## VS-08: Rendering Primitives — renderText

**Description:** Given a string and wrapper class, `renderText` produces a single div with the text content.

**Pass Criteria:**
- Text is HTML-escaped and placed inside a div with the specified class
- Null/empty string input produces a div with the class but no text content
- Multi-line strings preserve line structure

**Test Method:** Call renderText with known inputs, inspect DOM output.

---

## VS-09: Product Brief Renders All 12 Sections

**Description:** Given a product.json with all fields populated, the product-brief.html renders all 12 content sections correctly.

**Pass Criteria:**
- `problem` renders as text block
- `target_users` renders as fire-colored cards (one per persona)
- `competitors` renders as table with columns: Competitor, Strengths, Weaknesses, Our Advantage
- `market_size` renders as field group with TAM, SAM, SOM
- `differentiators` renders as air-colored cards
- `risks` renders as fire-colored cards
- `value_proposition` renders as highlight-box text
- `strategic_goals` renders as air-colored cards with id badge, metric, target
- `success_metrics` renders as table
- `assumptions` renders as water-colored cards
- `out_of_scope` renders as earth-colored cards
- Profiles section renders 3 tables (PP, NFR, QP)

**Test Method:** Load product-brief.html with a fully populated product.json. Verify each section's DOM structure and content.

---

## VS-10: Features Brief Renders Nested IDD

**Description:** Given a features.json with features containing nested IDD fields (intent, constraints, blast_radius, failure_conditions), the features-brief renders all nested content.

**Pass Criteria:**
- Each feature renders as a card with id, name, priority badge
- `intent.p1`, `intent.p2`, `intent.p3` render as labeled fields within the feature card
- `constraints.in_scope`, `constraints.out_of_scope`, `constraints.must_not_break` render as labeled fields
- `blast_radius` renders with its sub-fields
- `failure_conditions` renders as a list
- `identity` renders as highlight-box
- `invariants` renders as list items
- `scope.in_scope` and `scope.out_of_scope` render as separate card blocks

**Test Method:** Load features-brief.html with a features.json containing 2+ features with full IDD nesting.

---

## VS-11: Architecture Brief Cross-Document Fetch

**Description:** Given architecture.json, quality-standards.json, and product.json at expected relative paths, the architecture-brief fetches all three and renders sections from each.

**Pass Criteria:**
- Architecture sections (principles, topology, stack, etc.) render from architecture.json
- Quality standards sections render from quality-standards.json
- Profile tables render from product.json
- If quality-standards.json is missing (fetch returns 404), the quality standards section renders as empty (not error, not hidden)
- If product.json is missing, the profiles section renders as empty

**Test Method:** Load architecture-brief with all 3 JSONs present. Then remove quality-standards.json and verify graceful empty rendering.

---

## VS-12: Scenarios Brief Nested Groups

**Description:** Given a scenarios.json with multiple groups, each containing multiple scenarios, the scenarios-brief renders the nested hierarchy correctly.

**Pass Criteria:**
- Each group renders with group name heading and feature ref
- Scenarios within each group render as individual cards with id, title, given/when/then
- Feature gates render as cards with feature id/name and required scenario list
- Coverage stats render as stat grid with numeric values
- Coverage gaps render as gap items

**Test Method:** Load scenarios-brief with 2+ groups, each containing 2+ scenarios.

---

## VS-13: Plan Brief Execution Order

**Description:** Given a plan.json with prerequisites and ordered execution steps, the plan-brief renders sequence numbers, scope items, and gates correctly.

**Pass Criteria:**
- Prerequisites render with exit gate highlighted
- Each execution step shows a circular sequence number badge
- Scope items render as numbered list within each step
- Exit gate and scenario gate render within each step
- Summary table shows cumulative scenario counts

**Test Method:** Load plan-brief with 3+ execution steps.

---

## VS-14: Roadmap Brief Timeline Horizons

**Description:** Given a roadmap.json with timeline horizons (near/mid/long), the roadmap-brief groups features by horizon correctly.

**Pass Criteria:**
- Timeline section shows three horizon groups: near, mid, long
- Each horizon lists its feature refs
- Epic cards render with full IDD nesting
- Feasibility cards render with risk level badges and technical risks
- Cross-document fetch of product.json for strategic goal names works

**Test Method:** Load roadmap-brief with features distributed across 3 horizons.

---

## VS-15: Tech Brief Entity Cards

**Description:** Given a tech.json with data_model entities containing nested fields, the tech-brief renders entity cards with field rows.

**Pass Criteria:**
- Each entity renders as a card with entity name
- Each field renders as a row with field_name, field_type, and constraints/description
- Components render as cards with interfaces list and dependencies tags
- Project structure renders as preformatted directory tree
- Libraries render as table
- Feature mapping renders as table

**Test Method:** Load tech-brief with 2+ entities, each with 3+ fields.

---

## VS-16: No LLM Invocation During Brief Generation

**Description:** The entire briefs pipeline (YAML→JSON conversion, template copy, CSS inlining, hub.json generation) completes without invoking any LLM skill or agent.

**Pass Criteria:**
- No `generate-implementation-brief` skill is invoked
- No `generate-product-brief` skill is invoked
- No `draft-roadmap-brief` skill is invoked
- No `doc-builder` agent is dispatched for brief generation
- The briefs recipe uses only Bash (for YAML→JSON conversion), Read, and Write tools
- No Agent tool calls with subagent_type containing "doc-builder" or brief generation skills

**Test Method:** Run the briefs recipe. Inspect the tool call log for any LLM skill/agent invocations. Zero found = pass.

---

## VS-17: Performance — Full Pipeline Under 5 Seconds

**Description:** The briefs recipe processes all 7 artifact types (YAML→JSON + template copy) in under 5 seconds total.

**Pass Criteria:**
- Wall-clock time from recipe start to completion is < 5 seconds for 7 artifacts
- Individual artifact processing is < 1 second each
- No network calls to LLM APIs during the pipeline

**Test Method:** Time the briefs recipe execution with 7 changed YAMLs.

---

## VS-18: Deterministic Output

**Description:** Running the briefs pipeline twice on the same YAML inputs produces identical outputs.

**Pass Criteria:**
- JSON files are byte-identical across two runs for the same YAML input
- HTML template files are byte-identical across two runs (templates are static, CSS inlining is deterministic)
- hub.json is identical across two runs for the same set of artifacts (excluding `generated_at` timestamp)

**Test Method:** Run pipeline twice. `diff` all output files. Only `generated_at` timestamps may differ.

---

## VS-19: Checksum Staleness Still Works

**Description:** The existing checksum-based staleness detection continues to function, now triggering JSON conversion instead of LLM generation.

**Pass Criteria:**
- Unchanged YAMLs do not trigger JSON reconversion (checksums match → skip)
- Changed YAMLs trigger JSON reconversion (checksums differ → convert)
- New YAMLs (no stored checksum) trigger JSON conversion
- `.checksums.json` is updated after processing

**Test Method:** Run pipeline, modify one YAML, run again. Only the modified YAML's JSON is regenerated.

---

## VS-20: Hub.html Renders from hub.json

**Description:** Hub.html loads hub.json and renders the artifact index grid with correct status badges, stat counts, and links.

**Pass Criteria:**
- Hub shows one card per artifact found in hub.json
- Each card shows artifact name, status badge (draft/validated/locked), and stat count
- Cards link to their corresponding brief HTML files
- Artifacts with `has_brief: false` render as grayed out (no link)
- Epic sections show per-epic artifact cards

**Test Method:** Load hub.html with a hub.json containing product-level and epic-level artifacts with mixed statuses.

---

## VS-21: Phoenix Design System Preserved

**Description:** Rendered briefs maintain the Phoenix Design System visual appearance — colors, fonts, spacing, cards, badges, tables match the current LLM-generated output.

**Pass Criteria:**
- `brief-common.css` is correctly inlined into each template HTML
- Card color classes (card-fire, card-air, card-water, card-earth) produce correct left-border colors
- Badge classes (badge-p1, badge-draft, badge-high, etc.) produce correct styling
- Typography uses Space Grotesk (display), DM Sans (body), JetBrains Mono (code)
- Three themes (dark/light/vibrant) all function correctly via theme switcher

**Test Method:** Visual comparison of a rendered brief against the current LLM-generated version for the same data.

---

## VS-22: Inline Comment System Functional

**Description:** The inline comment system (text selection → comment → localStorage persistence → export) continues to work with client-side rendered content.

**Pass Criteria:**
- Text selection on rendered content triggers the comment popup
- Comments are saved to localStorage with key `meridian-comments-{artifact}-{slug}`
- Comments tab lists all saved comments with tab label and text excerpt
- Tether/Vanish/Orbit export buttons produce correct JSON payload
- Comments survive page reload (localStorage persistence)

**Test Method:** Load a rendered brief, select text, add a comment, reload page, verify comment persists. Test export.

---

## VS-23: Theme Switching and Navigation

**Description:** Theme switching (dark/light/vibrant) and sidebar navigation with active-on-scroll continue to work.

**Pass Criteria:**
- Theme switcher buttons change `data-theme` attribute on `<html>`
- Selected theme persists across page reload (localStorage)
- Sidebar nav links scroll to correct chapters
- Active nav item updates as user scrolls through chapters
- Mobile hamburger toggle shows/hides sidebar

**Test Method:** Load brief, switch themes, scroll through chapters, verify nav highlighting.

---

## VS-24: Self-Contained HTML

**Description:** Each rendered brief HTML is fully self-contained — no external CSS, JS, or font dependencies.

**Pass Criteria:**
- No `<link rel="stylesheet" href="...">` tags referencing external URLs
- No `<script src="...">` tags referencing external URLs (local JSON fetch is permitted)
- No `@import url(...)` in CSS referencing external URLs
- Fonts load from Google Fonts via `@import` in CSS (this is the existing pattern, acceptable)
- Brief opens and renders correctly when served from a local file system (file:// protocol) — except JSON fetch which requires a local server

**Test Method:** Grep each template HTML for external URL references. Verify only Google Fonts import exists.

---

## VS-25: Briefs Recipe Produces Complete Output

**Description:** After running the briefs recipe, the briefs/ directory contains all expected files.

**Pass Criteria:**
- For each processed YAML: `{briefs_dir}/{artifact}-brief.html` exists
- For each processed YAML: `{yaml_dir}/{artifact}.json` exists as a sibling
- `{briefs_dir}/hub.html` exists
- `{briefs_dir}/hub.json` exists
- `{briefs_dir}/.checksums.json` exists and is updated
- No orphaned HTML briefs from removed YAMLs (if applicable)

**Test Method:** Run briefs recipe with all 7 artifact types. Verify file existence.
