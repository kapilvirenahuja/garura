# Understanding — Issue #305: /design play evolution

## 1. Current /design Shape

**Phases (10 steps, Workflow A):**

| Step | Phase | Owner | Skill dispatched |
|------|-------|-------|-----------------|
| 1 | Persona synthesis | designer | synthesize-personas |
| 1a | Decision surfacing (personas) | play | — |
| 2 | Checkpoint 1 — persona review | play | — |
| 3 | Screen inventory | designer | generate-screen-inventory |
| 3a | Decision surfacing (screens) | play | — |
| 4 | Validate screen coverage (pre-flow) | designer | validate-screen-coverage |
| 5 | Checkpoint 2 — screen review | play | — |
| 6 | Map user flows | designer | map-user-flows |
| 6a | Decision surfacing (flows) | play | — |
| 7 | Validate flow coverage (post-flow) | designer | validate-screen-coverage |
| 8 | Generate wireframes | designer | generate-wireframes |
| 8a | Decision surfacing (wireframes) | play | — |
| 9 | Compile design spec | designer | compile-design-spec |
| 9a | Decision surfacing (design spec) | play | — |
| 10 | Checkpoint 3 — final design review | play | — |
| 11 | Evidence + self-commit | play + repo-orchestrator | — |

**Agents:** designer (domain), judge (validation), scriber (evidence/checkpoint/status), repo-orchestrator (commit)

**Current scope:** product-wide only. Reads locked specify output from `{product_base}scope/`. Writes to `{product_base}experience/`.

**Visual scope:** C13 explicitly forbids visual design (colors, typography, spacing). This is the constraint the enhancement corrects.

---

## 2. Four Changes Required (Issue #305)

### Change 1 — Multi-scope input boundary

**What:** /design gains `--epic <epic-id>` and `--feature <feature-id>` args. Without args = product-wide (existing behaviour preserved).

**Touch points in intent.yaml:**
- Add new constraint: C19 — scope resolution. Defines the three modes (product-wide / epic / feature) and how each narrows the input set.
- Pre-flight update: resolve scope mode from invocation args before reading artifacts. Epic/feature modes narrow `epics_dir` to a single epic file; feature mode further narrows to the capabilities within that feature's epic.
- All five skills receive the same `epics_dir` they always did, but the directory (or filtered file list) is narrowed before dispatch.
- F1 update: "zero personas / zero screens / zero flows" failure must tolerate single-epic or single-feature scope — the count minimum drops to 1 per scoped unit (already the case, no wording change needed).

**Skills affected:** None need contract changes. The play pre-flight narrows the input dir/file list and passes it as the same `epics_dir` param.

### Change 2 — Brownfield + gap analysis

**What:** On entry, /design checks `{product_base}experience/` for existing artifacts. If populated → gap-only mode (deltas). If absent or empty → greenfield (existing behaviour).

**Touch points in intent.yaml:**
- New constraint: C20 — brownfield detection. Scoped strictly to `.garura/product/experience/` — no source code scan.
- Detection logic: check whether `{product_base}experience/personas.md`, `{product_base}experience/screens/`, or `{product_base}experience/design-spec.md` exist and are non-empty.
- New pre-flight step (before Stage 1): run brownfield check, set mode flag (`greenfield` | `gap-only`).
- Gap-only mode: skip stages whose artifacts already exist and are LOCKED. Re-run only stages whose artifacts are absent, DRAFT, or whose source inputs changed since last run.
- New failure condition: F18 — gap-only mode runs a stage that produces output conflicting with existing LOCKED artifacts without user Tether at the delta checkpoint.

**Skills affected:** None. Gap logic lives in the orchestration layer (play), not in the skills.

### Change 3 — Design System authoring

**What:** Design System (tokens, fonts, colors, palette, inspirations) becomes first-class. Screens stay structural wireframes. DS is the visual surface; wireframes are the structural surface.

**Touch points in intent.yaml:**
- Remove (or invert) the blanket visual-design prohibition in C13. New wording: "Screens are LOW-FIDELITY structural wireframes. The Design System (tokens, fonts, palette, color, inspirations) is in scope and is produced by the DS-authoring phase before wireframe generation. The DS does NOT flow into the wireframe ASCII — wireframes remain structural. The DS is a separate artifact consumed by downstream visual-design and implementation."
- F12 stays but narrows: "The play generates visual design elements inside wireframe blocks" is the failure, not "the play generates visual design at all."
- New constraint: C21 — DS authoring. The DS phase runs a user interview for inspirations (color mood, reference products, brand adjectives). Outputs `{product_base}experience/design-system.md` with token stubs, font recommendations, palette, and inspiration references. The DS is written before wireframes but is NOT fed into wireframe generation.
- New failure condition: F19 — DS artifact is absent when the design spec is compiled, OR the DS includes pixel-level or implementation-level specs (rem values, CSS variable names, specific hex codes that aren't inspiration references — only palette palette ranges are allowed).

**New phase insertion:** DS authoring slots between Checkpoint 2 (screen review, Step 5) and Step 6 (map user flows). Rationale: screens are locked by Checkpoint 2, providing the surface list the DS interview needs. Flows and wireframes follow DS. Wireframes read the DS for structural cues (layout pattern names) but not visual tokens.

**New skill needed:** `draft-design-system` — a new skill. Existing skills do not cover DS authoring.

**Draft-design-system skill contract:**
```
Input:
  screens_dir (path) — to know what screens exist
  personas_path (path) — to contextualise the user audience
  scope_path (path) — for product slug + capability labels
  mvp_recommendation_path (path) — for primary use-case context
  user_provided_path (path, optional) — {product_base}user-provided/ for any PM/PO inspirations
  design_system_path (string) — output path, typically {product_base}experience/design-system.md
  decision_manifest_path (path)
Output:
  design_system_path
  decision_manifest_path
```

**User interview:** the skill presents a structured Q&A (color mood, brand adjectives, reference products, font character) before authoring. Responses drive the inspiration section of the DS. This is a MID/LOW surfacing flow by default (no KB grounding for aesthetics).

**User-provided content:** `.garura/product/user-provided/` exists and contains `grounding-questions.md` and `project-brief.md`. The `draft-design-system` skill should read these as inspiration seeds before opening the interview, so answers the PM already gave do not get re-asked.

**compile-design-spec contract extension:** add `design_system_path` as a required input. Section 7 (Handoff Notes) gains a DS reference.

### Change 4 — Terminal LOCKED gate

**What:** Keep existing mechanism. Checkpoint 3 (Step 10) already gates on Tether before finalising. The enhance needs only to ensure the DS artifact is included in the LOCKED artifact set.

**Touch points in intent.yaml:**
- C10 extension: add `{product_base}experience/design-system.md` to the ADR 017 whitelist.
- Step 11 (evidence + self-commit): add `{product_base}experience/design-system.md` to the committed file list.
- No new constraint needed; C10 covers this.

---

## 3. Files to Modify

| File | Change |
|------|--------|
| `core/components/plays/design/reference/intent.yaml` | Primary. Add C19, C20, C21; update C13; update F12; add F18, F19; update C10; add DS to Step 11 commit list; new scenarios for scoped invocation (S8) and brownfield mode (S9) |
| `core/components/plays/design/SKILL.md` | Regenerated via `/create-play --rebuild design`. Do NOT edit manually. |

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `core/components/skills/draft-design-system/SKILL.md` | New skill — DS authoring with user interview |

---

## 5. Skill Dispatch Touch Points for Per-Unit Scoping

All five existing skills operate on file paths. They do not embed scope-mode logic — the orchestration layer (play) narrows the input before dispatch. Summary of what each skill receives and whether it is product-wide or per-unit:

| Skill | Input operand | Scope-narrowable? |
|-------|--------------|-------------------|
| synthesize-personas | `epics_dir` (glob of YAML files) | Yes — orchestrator passes filtered list or single-file dir |
| generate-screen-inventory | `epics_dir`, `enriched_capabilities_path`, `scope_path` | Yes — same narrowing |
| map-user-flows | `epics_dir`, `screens_dir` | Yes — screens_dir may be a filtered set |
| generate-wireframes | `screens_dir` | Yes — same filtered set |
| compile-design-spec | `screens_dir`, `flows_dir`, `personas_path`, `scope_path` | Yes — pulls only what exists |
| draft-design-system (new) | `screens_dir`, `scope_path`, `mvp_recommendation_path` | Yes — same filtered set |

No skill contract changes are needed for multi-scope support. Narrowing is orchestration-only.

---

## 6. Brownfield Detection Logic

Scoped strictly to `.garura/product/experience/`:

```
Check 1 — personas exist?    test -f {product_base}experience/personas.md && non-empty
Check 2 — screens exist?     test -d {product_base}experience/screens/ && contains *.md
Check 3 — spec exists?       test -f {product_base}experience/design-spec.md

If ANY of the above → gap-only mode.
If NONE → greenfield mode.
```

Gap-only behaviour:
- Read each existing artifact's status (LOCKED / DRAFT / absent).
- LOCKED artifacts → skip the stage that produces them unless the user explicitly passes `--force-stage <stage-name>`.
- DRAFT or absent → re-run the corresponding stage.
- Delta checkpoint: before writing any artifact that would overwrite a LOCKED one, present the diff and require explicit Tether.

---

## 7. DS Authoring Phase — Slot in Workflow

```
Step 5  — Checkpoint 2: screen inventory review (Tether)
Step 5b — Draft design system (NEW)           ← INSERT HERE
  5b-i  — User interview (color, fonts, brand adjectives, reference products)
  5b-ii — draft-design-system skill dispatch
  5b-iii— Decision surfacing (DS manifest)
Step 6  — Map user flows (unchanged)
Step 8  — Generate wireframes (unchanged — structural only, no DS tokens)
```

Rationale: screens are locked at Checkpoint 2. The DS interview can reference the specific screens ("your login screen, dashboard screen...") to ground inspiration questions in concrete surfaces. Flows and wireframes follow and are unaffected by DS tokens.

---

## 8. Process Note — /create-play --rebuild Ownership

Per discovery.md clarification (line 19):

> When the implementation step reaches `/create-play --rebuild design`, sub-agents cannot invoke the Skill tool for create-play. The sub-agent MUST signal back to the orchestrating play (the enhance play) so the play invokes `/create-play --rebuild design` via the Skill tool directly.

The execution plan for this enhancement must include a task explicitly owned by the orchestrator (enhance play), not by code-builder:

- **code-builder task:** Edit `core/components/plays/design/reference/intent.yaml` with the new constraints, failure conditions, and scenario additions. Signal completion.
- **code-builder task:** Create `core/components/skills/draft-design-system/SKILL.md`.
- **orchestrator task (enhance play):** After code-builder signals, invoke `/create-play --rebuild design` via the Skill tool. This regenerates `core/components/plays/design/SKILL.md`.

---

## 9. Constraints from intent.yaml That Stay Unchanged

C1, C2, C3, C4, C5, C6, C7, C8, C9, C11, C12, C14, C15, C16, C17, C18 — all preserved verbatim. F1-F11, F13-F17 — all preserved. S1-S7 — all preserved. Two new scenarios needed: S8 (scoped invocation — epic/feature mode) and S9 (brownfield gap detection).

---

## 10. Scope Estimate

| Dimension | Count |
|-----------|-------|
| Constraints modified | C13 (rework) |
| Constraints added | C19, C20, C21 |
| Failure conditions modified | F12 (narrowed) |
| Failure conditions added | F18, F19 |
| Constraint C10 updated | +1 artifact to whitelist |
| Scenarios added | S8, S9 |
| Skills created | 1 (draft-design-system) |
| Skills modified (contract) | 1 (compile-design-spec — add design_system_path input) |
| Files touched | 2 (intent.yaml, compile-design-spec/SKILL.md) |
| Files created | 1 (draft-design-system/SKILL.md) |
| SKILL.md regenerated | 1 (design/SKILL.md — via /create-play --rebuild) |
| Complexity | Medium — orchestration additions, no contract-surface removal |
