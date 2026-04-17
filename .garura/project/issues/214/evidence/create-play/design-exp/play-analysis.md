# Play Analysis — design-exp (Visual-First Rebake — C16 + F15)

**Mode:** `/create-play --rebake design-exp`
**Trigger:** Visual-first screen-file shape — intent.yaml gained C16 (required body section order with `## Wireframe` first and `## Layout Spec` last, including ASCII box-drawing per state) and F15 (any violation of that order, missing wireframe block, or visual-design element inside a wireframe is a structural failure).
**Scope:** Pure SHAPE change to the screen-file artifact produced by Stage 3 and rewritten by Stage 8. **Zero new stages. Zero new agents. Zero contract-level path changes.** This **supersedes** the prior D15/D16 (Pull-to-Product + MVP Focus) rebake — D15/D16 work (C14/C15/F13/F14, all path/MVP narrowing) is preserved intact.
**New intent hash:** `sha256:1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2` (verified on disk via `shasum -a 256`).

## What changed in intent.yaml (versus the D15/D16 bake)

| ID | Status | Nature of change |
|----|--------|------------------|
| C1-C15 | Unchanged | All prior constraints preserved verbatim (paths, MVP gate, agent boundaries, low-fidelity discipline, Pull-to-Product, MVP Focus). |
| **C16** | **NEW** | Every screen file under `{product_base}experience/screens/` is **visual-first**. Required body section order after the H1: (1) `## Wireframe` containing one Unicode/ASCII box-drawing block per state declared in `## States`; (2) `## Purpose`; (3) `## Personas`; (4) `## States`; (5) `## Navigation`; (6) `## Accessibility`; (7) `## Layout Spec` with the detailed machine-spec. `## Wireframe` is the FIRST body section (human glance-value surface); `## Layout Spec` is the LAST (machine contract for downstream skills). generate-screen-inventory emits the skeleton with a `## Wireframe` placeholder; generate-wireframes replaces the placeholder with real ASCII per state AND appends `## Layout Spec` at the bottom. Wireframes use ASCII-safe Unicode box-drawing, stay under 80 columns, and carry no visual-design elements (hex, px/rem, font-family). |
| F1-F14 | Unchanged | All prior failure conditions preserved. |
| **F15** | **NEW** | Any screen file that violates the visual-first section order (Wireframe not first, Layout Spec missing or not last, any declared state lacks a wireframe block, or any wireframe block contains visual-design elements) is a structural failure. Direct violation of C16. |
| S1-S7 | Unchanged | All scenarios preserved. |

**Implication:** This is a **SHAPE-ONLY** rebake. Workflow Structure A preserved. 10 workflow steps preserved. 3 human checkpoints preserved. Agent boundary table preserved (designer + judge domain; scriber + repo-orchestrator utility). Constraint classifications grow by exactly one new artifact-verifiable constraint (C16). The compiled SKILL.md rewrite touches (a) the Stage 3 narrative description (placeholder emission), (b) the Stage 8 narrative description (two-block rewrite — visual top + spec bottom), (c) embedded eval list (new SEs for C16 and F15 from evals-creator), (d) Compilation Metadata (intent_hash, compiled_at, artifact_verifiable_constraints list, eval counts), and (e) the drift notice. **No JSON contract changes.** The contract surface is identical to the D15/D16 bake — Stages 3 and 8 still take and return the same paths.

## What changed in the skills (already on disk before this rebake)

The visual-first shape was authored into the source skill files in a parallel pass. The compiled SKILL.md must reflect the new behavior in its narrative descriptions of Stages 3 and 8.

| Skill | File | Visual-first change |
|-------|------|---------------------|
| `generate-screen-inventory` | `core/components/skills/generate-screen-inventory/SKILL.md` | Output Format step now emits the skeleton with `## Wireframe` as the FIRST body section after the H1, populated only with an HTML comment placeholder explaining that Stage 4 (generate-wireframes) will replace it with one Unicode/ASCII box-drawing block per state. The existing `## Purpose`, `## Personas`, `## States`, `## Navigation`, `## Accessibility` order is preserved AFTER the placeholder. The skill explicitly does NOT author wireframe ASCII (that's Stage 8's job) and explicitly does NOT emit `## Layout Spec` (also Stage 8's job). |
| `generate-wireframes` | `core/components/skills/generate-wireframes/SKILL.md` | Process is now split into Step 2a (compose visual wireframe block — one Unicode/ASCII box-drawing per state, ASCII-safe characters, ≤80 columns, no visual-design elements) and Step 2b (compose layout spec block — the machine-parseable detailed spec). Step 3 of the skill **rewrites the screen file** to the new visual-first section order: replaces the `## Wireframe` placeholder at the top with the visual block and appends `## Layout Spec` at the bottom. Includes explicit box-drawing rules. |
| `core/components/memory/standards/schemas/screen-inventory.yaml` | (schema doc) | Documents the required visual-first section order with a full example showing the `## Wireframe` block at the top and `## Layout Spec` at the bottom. |

The skills are the writers; the schema is the contract. The play's compiled SKILL.md is the orchestrator and must (a) call the skills with the right inputs (unchanged), (b) embed the new evals (new SEs for C16/F15 from evals-creator), and (c) add narrative notes to Stages 3 and 8 explaining the new shape so a reader of the play file understands what each stage produces.

## What changed in the JSON contracts

**Nothing.** This is the critical insight. The contract surface is path-level, and no new paths are required to enforce visual-first shape. Stage 3 still takes `screens_dir` as output and writes one MD file per screen. Stage 8 still takes `screens_dir` as input and rewrites those same MD files. The shape difference is internal to the file body — the play orchestrator does not need to know about the section order at the contract level. The skills enforce it; the evals verify it after the fact.

Compare to the D15/D16 bake which DID change contracts (added `product_research_path` to 5 stages, added `mvp_recommendation_path` to Stage 1, added explicit `mode: "strict"` to Steps 4 + 7). The C16/F15 rebake adds **zero** contract changes.

## Semantic map

```
design-exp (play, orchestrator in Claude Code)
├── Pre-flight
│   ├── C1 — specify-product artifacts exist + LOCKED
│   │   ├── {product_base}scope/scope.yaml
│   │   ├── {product_base}scope/enriched-capabilities.yaml
│   │   ├── {product_base}scope/epics/*.yaml
│   │   └── {product_base}specification/quality-profile.yaml
│   ├── C2 — KB catalog consistency (validate-kb-extension)
│   ├── C10, C11 — writable {product_base}experience/ + scriber reachable
│   └── C15 — {product_base}scope/mvp-recommendation.md exists + non-empty
│
├── Phase: Preparation — Persona Synthesis
│   └── Step 1 — designer → synthesize-personas
│       Input: epics_dir, scope_path, product_research_path, mvp_recommendation_path, personas_path
│       Output: {product_base}experience/personas.md (narrowed to primary use cases per C15)
│       Evals: F1, F2, F3, F14, C3, C4
│
├── Phase: Checkpoint 1 — Persona Review (human gate)
│
├── Phase: Execution — Screen Inventory
│   ├── Step 3 — designer → generate-screen-inventory
│   │   Input: scope_path, enriched_capabilities_path, epics_dir, personas_path,
│   │          product_research_path, ltm_screen_inventory_schema_path, screens_dir
│   │   Output: {product_base}experience/screens/*.md
│   │     ↳ NEW: each file is a visual-first skeleton — `## Wireframe` placeholder
│   │       at the TOP (between H1 and `## Purpose`), no `## Layout Spec` yet (C16)
│   └── Step 4 — designer → validate-screen-coverage (pre-flow pass, mode=strict)
│       Evals: F1, F4, F5, F14, C5, C6
│
├── Phase: Checkpoint 2 — Screen Inventory Review (human gate)
│
├── Phase: Execution — User Flows
│   ├── Step 6 — designer → map-user-flows
│   │   Input: personas_path, screens_dir, epics_dir, flows_dir
│   │   Output: {product_base}experience/flows/*.md
│   └── Step 7 — designer → validate-screen-coverage (post-flow pass, mode=strict)
│       Evals: F1, F6, F7, F14, C7
│
├── Phase: Execution — Wireframe Generation
│   └── Step 8 — designer → generate-wireframes
│       Input: screens_dir, product_research_path
│       Output: in-place rewrite of every screen MD file:
│         ↳ replace `## Wireframe` placeholder at TOP with one Unicode/ASCII
│           box-drawing block per state declared in `## States` (C16)
│         ↳ append `## Layout Spec` at BOTTOM with detailed machine-parseable
│           layout pattern, component inventory, per-state spec, interaction
│           patterns, data binding, accessibility wireframe notes (C16)
│       Evals: F8, F9, F15, C8, C9, C16 (new — visual-first shape verified
│       against the rewritten screen files)
│
├── Phase: Execution — Design Spec Compilation
│   └── Step 9 — designer → compile-design-spec
│       Input: personas_path, screens_dir, flows_dir, scope_path, quality_profile_path, design_spec_path
│       Output: {product_base}experience/design-spec.md
│       Evals: F10, F11, F12, F13, C12
│
├── Phase: Checkpoint 3 — Final Design Review (human gate)
│
├── Phase: Scenario Validation
│   └── SCE-1..SCE-7 (S1..S7)
│
└── Phase: Evidence & Close
    └── Step 11 — scriber writes evidence + repo-orchestrator self-commits product artifacts
```

## Intent constraint coverage (updated for C16)

- **Pre-flight:** C1, C2, C10, C11, C15 → Pre-flight table rows + resume check + bash block (UNCHANGED)
- **Structural:** C10, C11, C13, C14 → Agent boundary table, compilation rules, low-fidelity discipline, Pull-to-Product rule (UNCHANGED)
- **Artifact-verifiable:** C3, C4, C5, C6, C7, C8, C9, C12, **C16 (NEW)** → Step evals (SE-n) + scenario evals (SCE-n)

C16 is **artifact-verifiable** because it's an output-shape constraint on the screen MD files. The shape is checkable AFTER Stage 3 emits the skeleton AND AFTER Stage 8 rewrites with visual content, by inspection of the file's section headings, the wireframe block contents, and the absence of forbidden visual-design tokens (hex, px/rem, font-family). It is NOT a pre-flight constraint because the artifact does not exist before domain work begins. The evals-creator will generate one or more SEs for C16 and one or more SEs for F15, embedded immediately after Stage 8 (the stage that completes the visual-first shape).

Every failure condition (F1-F15) maps to ≥1 SE. Every scenario (S1-S7) maps to ≥1 SCE. Every pre-flight constraint appears in the pre-flight table. Every structural constraint has a visible enforcement mechanism in the compiled play.

## Skill inventory (all existing, modified — Phase 2 + visual-first updates)

| Skill | Role in play | Prior status | This-bake update | Contract path |
|-------|--------------|---|---|---|
| `synthesize-personas` | Step 1 (persona synthesis) | existing modified (D11/D12/D21) | unchanged in this bake | core/components/skills/synthesize-personas/SKILL.md |
| `generate-screen-inventory` | Step 3 (screen inventory) | existing modified (D11/D12/D19/D21) | **modified** — emits visual-first skeleton with `## Wireframe` placeholder as first body section after H1 (C16) | core/components/skills/generate-screen-inventory/SKILL.md |
| `validate-screen-coverage` | Steps 4 + 7 (blocking validators) | existing modified (D11/D12/D19/D20/D21) | unchanged in this bake | core/components/skills/validate-screen-coverage/SKILL.md |
| `map-user-flows` | Step 6 (user flow diagrams) | existing modified (D11/D12/D21) | unchanged in this bake | core/components/skills/map-user-flows/SKILL.md |
| `generate-wireframes` | Step 8 (per-screen wireframe rewrite) | existing modified (D11/D21) | **modified** — Step 2a/2b two-block compose; Step 3 rewrites screen file with visual-first ordering (visual top + Layout Spec bottom) per C16 | core/components/skills/generate-wireframes/SKILL.md |
| `compile-design-spec` | Step 9 (final consolidated spec) | existing modified (D11/D12/D21) | unchanged in this bake | core/components/skills/compile-design-spec/SKILL.md |
| `validate-kb-extension` | Pre-flight gate only | existing unchanged | unchanged | core/components/skills/validate-kb-extension/SKILL.md |

7 skills total. 6 step-producing (all existing modified — 2 of them touched in THIS bake for visual-first; the other 4 carry forward unchanged from the D15/D16 bake). 1 pre-flight-only (unchanged).

`validate-kb-extension` remains intentionally excluded from the evals-creator `skill_contracts` list. It is a pre-flight gate check that runs before any step produces a domain artifact.

## Intent-crafter (rebake-mode) decision

**Skipped.** The intent.yaml was hand-edited to add C16 + F15 by the user before this rebake started. The briefing explicitly hands the compiler the new sha256 (`1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2`), which I verified against the on-disk intent.yaml. The new constraint and failure condition are well-formed: C16 names the required section order, the placeholder/rewrite division of labor between Stages 3 and 8, the box-drawing rules, and the forbidden visual-design tokens. F15 enumerates the four violation modes (wrong order, missing Layout Spec, missing per-state wireframe, visual-design tokens). There is no gap the crafter needs to fill. Running intent-crafter would risk churning the hash by whitespace reformatting. **Documented decision: no crafter invocation for this rebake.**

## Agent audit (designer)

- `core/components/agents/designer.md` exists at the same version used in the D15/D16 bake. Designer agent unchanged.
- Domain: ux. Role: designer. Model: opus. Tools: Task, Read, Write, Glob, Grep, Skill.
- Declares all 6 design-exp skills in its skill inventory.
- C16/F15 are SHAPE constraints on the produced screen files. The designer agent does not need a new principle, a new skill, or a new tool to honor them — it invokes generate-screen-inventory and generate-wireframes via the Skill tool, and those skills enforce the shape. The play's evals verify the shape post-hoc.
- P1-P11 principle compliance unchanged. **No re-audit required.** (P10 WARN preserved from prior bake — not runtime-breaking.)
- Known out-of-scope drift: designer.md line 88 still references `.meridian/product/ux/` in narrative prose. The play's JSON contracts are authoritative over agent narrative. A separate agent-file rebake will correct it.

## Workflow selection

**Structure A — Full checkpoint flow with 3 human review gates.** Unchanged.

| Agent category | Count | Members |
|---------------|-------|---------|
| Domain agents | 2 | designer, judge (judge invoked via `validate-screen-coverage` on Steps 4 + 7) |
| Utility agents (exempt) | 2 | scriber (all evidence / checkpoint / status writes), repo-orchestrator (self-commit) |

Domain agent count = 2, well within the ≤5 budget.

## Constraint classification (updated for C16)

| Category | Constraint IDs |
|----------|---------------|
| pre-flight | C1, C2, C10, C11, C15 |
| structural | C10, C11, C13, C14 |
| artifact-verifiable | C3, C4, C5, C6, C7, C8, C9, C12, **C16** |

- **C16 is artifact-verifiable** because it is a property of the produced screen MD files. It is checked by inspecting (a) the section heading order, (b) the presence of one fenced wireframe block per declared state, and (c) the absence of forbidden visual-design tokens inside any wireframe block. The check runs against the rewritten files after Stage 8 — the shape is not complete until generate-wireframes has both replaced the placeholder and appended `## Layout Spec`. Pre-Stage-8, only the placeholder shape from Stage 3 is observable, which is checked separately (the Stage 3 skeleton must already have `## Wireframe` as the FIRST body section, even if its content is just an HTML comment placeholder).

## Pipeline steps followed for this rebake

1. **R1 deep read:** intent.yaml (current — C16/F15 added), SKILL.md (current D15/D16 bake — superseded by this rewrite), designer.md, all 6 design skill contracts, validate-kb-extension skill, screen-inventory.yaml schema (with visual-first example), create-play SKILL, compiled-example. Complete.
2. **play-analysis.md:** This document (OVERWRITES the D15/D16 analysis).
3. **intent-crafter:** Skipped (decision documented above).
4. **skill-manifest.yaml:** OVERWRITTEN — 6 step-producing skills + 1 pre-flight-only skill, with this-bake change notes for generate-screen-inventory and generate-wireframes.
5. **Agent audit:** No re-audit — designer unchanged.
6. **Workflow selection:** Structure A confirmed; no change.
7. **Step 6a constraint classifications:** Updated above (C16 → artifact-verifiable).
8. **Step 6b evals-creator invocation:** Pending. Must cover C16 (new artifact-verifiable constraint) and F15 (new failure condition). Both will get fresh SEs. The skill should also re-emit the existing 26 SEs for C1-C15 / F1-F14 since the intent.yaml is the source of truth and is regenerated as a whole.
9. **Step 6c SKILL.md recompile:** Pending. Full rewrite. Touches Stage 3 narrative (placeholder emission), Stage 8 narrative (two-block rewrite — visual top + spec bottom), embedded evals (new SEs for C16/F15 from evals-creator), Compilation Metadata (intent_hash, compiled_at 2026-04-15, artifact_verifiable_constraints adds C16, eval counts), and drift notice.
10. **Step 6d coverage-matrix.md:** Pending. Maps C1-C16, F1-F15, S1-S7.
11. **Path audit:** Pending. Verify `ltm_domain_taxonomy_path` hits 0 in contract blocks, `product_research_path` hits ≥5, `mvp_recommendation_path` hits ≥1, `/ux/` in JSON contracts hits 0, `{product_base}experience/` hits ≥10.

## Path correction map (versus the D15/D16 bake)

The D15/D16 bake already fixed the `product/product/` doubled-folder drift, the `/ux/` → `/experience/` rename, the `output_path`/`output_dir` → domain-named parameter renames, the `ltm_domain_taxonomy_path` → `product_research_path` swap, and added `mvp_recommendation_path` + explicit `mode: "strict"`. **This bake adds zero contract-surface changes.** Every JSON contract block is preserved verbatim from the D15/D16 bake. Only narrative text in Stages 3 and 8 is updated to describe the visual-first shape produced by the underlying skills.

## Success criteria for this rebake

1. SKILL.md regenerated top-to-bottom. Full rewrite. No in-place edits.
2. intent_hash updated to `sha256:1c49d46736c0f9c7d4320b11603a75fb1ee4e115d3ce6eb5d2de5111745bebe2`.
3. compiled_by = `/create-play --rebake design-exp`.
4. compiled_at = `2026-04-15`.
5. Zero occurrences of `ltm_domain_taxonomy_path` in any JSON contract input block (preserved from D15/D16 bake).
6. At least 5 occurrences of `product_research_path` in JSON contract input blocks (Stages 1, 3, 4, 7, 8) (preserved from D15/D16 bake).
7. At least 1 occurrence of `mvp_recommendation_path` in Stage 1 input block (preserved from D15/D16 bake).
8. At least 10 occurrences of `{product_base}experience/` (preserved + likely more given the visual-first narrative).
9. Zero occurrences of `/ux/` in JSON contract blocks.
10. Stage 3 narrative explicitly notes that generate-screen-inventory emits the visual-first skeleton with `## Wireframe` as the FIRST body section after the H1 (a placeholder filled by Stage 8) — per C16.
11. Stage 8 narrative explicitly notes that generate-wireframes performs a TWO-BLOCK rewrite — replacing the `## Wireframe` placeholder at the top with one Unicode/ASCII box-drawing per state, AND appending `## Layout Spec` at the bottom — per C16.
12. evals-creator invoked; eval language copied verbatim (no hand-authored evals). New SEs for C16 and F15 must appear in the embedded eval list.
13. Compilation Metadata `artifact_verifiable_constraints` lists C16 in addition to C3-C9, C12.
14. Compilation Metadata `step_evals` count updated from 26 to whatever evals-creator emits (expected: 26 + new SEs for C16 and F15, so >= 28).
15. coverage-matrix.md confirms every intent item (C1-C16, F1-F15, S1-S7) has ≥1 covering element.
16. New drift notice at the bottom explaining this is the visual-first rebake landing C16 + F15, superseding the D15/D16 rebake.
