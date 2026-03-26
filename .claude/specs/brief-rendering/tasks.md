# Execution Tasks: Client-Side Brief Rendering

## Task DAG

```
T1: Write shared rendering primitives JS
    ↓
T2: Convert plan-brief.html (proof of concept)  ←── T1
T3: Create sample plan.json fixture              (parallel with T2)
    ↓
T4: Verify plan-brief (VS-08, VS-13)            ←── T2, T3
    ↓
T5: Convert product-brief.html                   ←── T1 (can start after T1, parallel with T2-T4)
T6: Convert tech-brief.html                      ←── T1
T7: Convert features-brief.html                  ←── T1
T8: Convert scenarios-brief.html                 ←── T1
T9: Convert roadmap-brief.html                   ←── T1
T10: Convert architecture-brief.html             ←── T1
T11: Create sample JSON fixtures (all 7 types)   (parallel with T5-T10)
    ↓
T12: Verify all 7 templates render correctly     ←── T5-T11 (VS-02,03,04,09-15)
    ↓
T13: Convert hub.html to static template          ←── T1
T14: Verify hub.html renders from hub.json       ←── T13 (VS-20)
    ↓
T15: Update briefs recipe (YAML→JSON + template copy) ←── T12, T14
T16: Verify recipe pipeline (VS-16,17,18,19,25) ←── T15
    ↓
T17: Verify UX preservation (VS-21,22,23,24)    ←── T16
    ↓
T18: Archive removed skills                      ←── T17
T19: Update doc-builder agent                    ←── T17
T20: Final integration verification              ←── T18, T19
```

## Tasks

### T1: Write Shared Rendering Primitives JS
**Agent:** code-builder
**Description:** Create `core/components/memory/standards/templates/brief-render.js` containing the shared rendering functions (~200 lines):
- `esc(s)` — HTML-escape
- `renderValue(v)` — scalar/array/null → HTML
- `badgeClass(status)` — status → CSS class map
- `severityBadge(severity)` — severity → CSS class map
- `priorityBadge(priority)` — P1/P2/P3 → CSS class map
- `renderCards(container, items, colorClass, fieldMap)` — array → .card elements
- `renderTable(container, items, columns)` — array → table
- `renderFieldGroup(container, obj, fieldMap)` — object → labeled fields
- `renderText(container, text, wrapperClass)` — string → div
- `renderList(container, items, wrapperClass)` — array of strings → ul/li

This file is the single source — it gets inlined into each template during assembly.
**Blocked by:** nothing
**Parallel:** can run with T3, T11

### T2: Convert plan-brief.html (Proof of Concept)
**Agent:** code-builder
**Description:** Transform `core/components/memory/standards/templates/plan-brief.html` from placeholder reference to self-rendering template:
1. Replace all `{PLACEHOLDER}` markers with `<div id="...">` containers
2. Inline the shared JS from T1
3. Add `render()` function that fetches `plan.json` and populates:
   - prerequisites section (cards with exit gates)
   - execution_order section (cards with sequence numbers, scope items, gates)
   - summary section (table)
4. Preserve all existing static JS (theme, sidebar, scroll, export)
5. All sections present in DOM regardless of data
**Blocked by:** T1

### T3: Create Sample JSON Fixtures
**Agent:** code-builder
**Description:** Create `core/components/memory/standards/templates/fixtures/` with sample JSON files for testing:
- `plan.json` — 2 prerequisites, 3 execution steps, summary
- `product.json` — all 12 sections populated, some empty
- `features.json` — 3 features with full IDD nesting
- `architecture.json` + `quality-standards.json` — all sections
- `tech.json` — 2 entities, 3 components
- `scenarios.json` — 2 groups with 3 scenarios each
- `roadmap.json` — 3 horizons, 2 epics
- `hub.json` — manifest with product + 1 epic
- `product-empty.json` — all sections empty/null (for VS-03 testing)

Each fixture must be a valid JSON representation of the corresponding YAML schema.
**Blocked by:** nothing
**Parallel:** can run with T1, T2

### T4: Verify Plan Brief (Proof of Concept)
**Agent:** quality-auditor
**Description:** Open plan-brief.html with plan.json fixture and verify:
- VS-08: renderText works correctly
- VS-13: All 3 sections render (prerequisites, execution_order, summary)
- VS-02: All sections present in DOM
- VS-03: Empty data sections render as blank containers
- VS-04: No content beyond what's in JSON
- VS-24: Self-contained HTML (no external deps)
**Blocked by:** T2, T3

### T5: Convert product-brief.html
**Agent:** code-builder
**Description:** Transform product-brief.html to self-rendering template. 12 sections: problem (text), target_users (fire cards), competitors (table), market_size (field group), differentiators (air cards), risks (fire cards), value_proposition (highlight-box), strategic_goals (air cards), success_metrics (table), assumptions (water cards), out_of_scope (earth cards), profiles (3 tables).
**Blocked by:** T1

### T6: Convert tech-brief.html
**Agent:** code-builder
**Description:** Transform tech-brief.html. 5 sections: project_structure (dir-tree code block), libraries (table), data_model (entity cards with nested field rows), components (cards with interfaces/dependencies), feature_mapping (table).
**Blocked by:** T1

### T7: Convert features-brief.html
**Agent:** code-builder
**Description:** Transform features-brief.html. 4 sections: identity (highlight-box), invariants (list), scope (in/out cards), features (cards with nested IDD: intent p1/p2/p3, constraints, blast_radius, failure_conditions, priority badge, MVP badge).
**Blocked by:** T1

### T8: Convert scenarios-brief.html
**Agent:** code-builder
**Description:** Transform scenarios-brief.html. 4 sections: groups (nested — group header + scenario cards with given/when/then), feature_gates (gate cards with scenario lists), coverage stats (stat grid), coverage_gaps (gap items).
**Blocked by:** T1

### T9: Convert roadmap-brief.html
**Agent:** code-builder
**Description:** Transform roadmap-brief.html. ~8 sections: thesis (air card), narrative (water card), assumptions (water list), exclusions (earth list), timeline (horizon groups with feature cards), epics (full IDD cards), feasibility (risk cards + tables), blockers (fire cards), open_questions (list). Cross-document: fetches product.json for strategic goal names.
**Blocked by:** T1

### T10: Convert architecture-brief.html
**Agent:** code-builder
**Description:** Transform architecture-brief.html. 12+ sections across 6 chapters. Cross-document: fetches architecture.json, quality-standards.json, product.json. Sections: principles (water cards), topology (code block), deployment_units (cards), nfrs (per-category tables), stack (table), platforms (table), integrations (table), agentic PCAM (4 sub-sections), quality_standards (dimension cards + debt table), profiles (3 tables), technical_risks (fire cards), deployment (table), observability (field group). Most complex template.
**Blocked by:** T1

### T11: (Merged into T3)

### T12: Verify All 7 Templates Render
**Agent:** quality-auditor
**Description:** For each of the 7 converted templates, load with corresponding fixture JSON and verify:
- VS-02: All sections present
- VS-03: Empty sections render blank (use product-empty.json for product-brief)
- VS-04: No fabricated content
- VS-05: renderCards works
- VS-06: renderTable works
- VS-07: renderFieldGroup works
- VS-09: product-brief 12 sections
- VS-10: features-brief nested IDD
- VS-11: architecture-brief cross-document fetch
- VS-12: scenarios-brief nested groups
- VS-13: plan-brief execution order
- VS-14: roadmap-brief timeline horizons
- VS-15: tech-brief entity cards
**Blocked by:** T2, T5, T6, T7, T8, T9, T10, T3

### T13: Convert hub.html to Static Template
**Agent:** code-builder
**Description:** Create `core/components/memory/standards/templates/hub.html` as a self-rendering template:
1. Fetches `hub.json` manifest
2. Renders product name + status
3. Renders artifact grid cards (one per artifact with status badge, stat count, link)
4. Renders per-epic sections
5. Grays out artifacts with `has_brief: false`
6. Preserves Phoenix Design System styling
**Blocked by:** T1

### T14: Verify Hub.html
**Agent:** quality-auditor
**Description:** Load hub.html with hub.json fixture and verify:
- VS-20: All artifacts render as cards with correct status/stats/links
- Grayed out cards for missing briefs
- Per-epic sections render correctly
**Blocked by:** T13, T3

### T15: Update Briefs Recipe
**Agent:** code-builder
**Description:** Rewrite `core/components/recipes/briefs/SKILL.md` to replace LLM-based generation with:
1. Pre-flight and context resolution — unchanged
2. Checksum comparison — unchanged
3. For each changed YAML:
   a. Convert YAML→JSON (using `yq` or python one-liner: `python3 -c "import sys,yaml,json; json.dump(yaml.safe_load(open(sys.argv[1])),open(sys.argv[2],'w'),indent=2)" file.yaml file.json`)
   b. Read template from `~/.meridian/core/memory/standards/templates/{artifact}-brief.html`
   c. Read `brief-common.css` from templates dir
   d. Inline CSS into template (replace marker)
   e. Write assembled HTML to `{artifact_base}/briefs/{artifact}-brief.html`
4. Generate hub.json manifest (scan all artifacts, extract status + stat counts from JSON)
5. Copy + assemble hub.html template to `{artifact_base}/briefs/hub.html`
6. Update checksums — unchanged
7. Report — unchanged

Remove all doc-builder agent delegation. Remove all LLM skill references.
Update the intent.yaml constraints (C3, C8) and add C10, C11.
**Blocked by:** T12, T14

### T16: Verify Recipe Pipeline
**Agent:** quality-auditor
**Description:** Run the updated briefs recipe against a test product directory and verify:
- VS-16: No LLM invocation
- VS-17: Completes in <5 seconds
- VS-18: Deterministic output (run twice, diff)
- VS-19: Checksums still work (modify one YAML, re-run)
- VS-25: All expected files produced
**Blocked by:** T15

### T17: Verify UX Preservation
**Agent:** quality-auditor
**Description:** Open generated briefs and verify:
- VS-21: Phoenix Design System CSS inlined and functional
- VS-22: Inline comment system works (select text, add comment, reload, export)
- VS-23: Theme switching (dark/light/vibrant) and active-on-scroll nav work
- VS-24: Self-contained HTML
**Blocked by:** T16

### T18: Archive Removed Skills
**Agent:** code-builder
**Description:** Remove the 3 LLM brief generation skills:
- `core/components/skills/generate-implementation-brief/` — delete directory
- `core/components/skills/generate-product-brief/` — delete directory
- `core/components/skills/draft-roadmap-brief/` — delete directory

Update any references to these skills in other files (doc-builder agent, briefs recipe if not already updated).
**Blocked by:** T17

### T19: Update doc-builder Agent
**Agent:** code-builder
**Description:** Update `core/components/agents/doc-builder.md` to remove brief generation responsibilities. The agent may still be needed for other purposes — check if any other recipes/skills reference it. If doc-builder is only used for briefs, archive it. If used elsewhere, remove only the brief-related sections.
**Blocked by:** T17

### T20: Final Integration Verification
**Agent:** quality-auditor
**Description:** End-to-end verification:
- Run `/briefs` from a feature branch with epic context → verify scoped regeneration
- Run `/briefs` from main → verify full scan
- Verify all 25 verification scenarios pass
- Confirm no references to removed skills remain in codebase
- Confirm `/sync-claude` deploys updated templates correctly
**Blocked by:** T18, T19
