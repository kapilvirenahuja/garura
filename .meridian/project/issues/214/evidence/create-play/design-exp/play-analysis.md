# Play Analysis — design-exp (Rebake for D15 Pull-to-Product + D16 MVP Focus)

**Mode:** `/create-play --rebake design-exp`
**Trigger:** Defects D15 + D16 — intent.yaml gained C14 (R15 Pull-to-Product) and C15 (R13 MVP Focus), plus F13 and F14. The 6 design skills were also rewritten in a parallel Phase 2 pass (D11/D12/D19/D20/D21) and the play's JSON contracts must now reflect those skill-contract changes as well.
**Scope:** Intent-level rebake (C14 + C15 + F13 + F14) combined with contract-surface propagation from Phase 2 skill updates. Zero workflow-structure changes. Zero new steps. Zero new agents. This **supersedes** the prior D10 path-correction analysis — D10's path fixes are subsumed into the Post-D1 folder layout this rebake preserves.

## What changed in intent.yaml (versus the D10 bake)

| ID | Status | Nature of change |
|----|--------|------------------|
| C1-C13 | Unchanged | All prior constraints preserved (C10 still points to `{product_base}experience/`, C1 still uses the two-subfolder Post-D1 layout from D10). |
| **C14** | **NEW** | R15 Pull-to-Product Principle. Domain library is read from `{product_base}research/` only. Every stage that needs domain content gets a `product_research_path` input. The play NEVER sends `ltm_domain_taxonomy_path` to downstream skills; doing so is a structural failure. Per rules/product.md Rule 15 / Defect 8, KB domain definitions are copied into product/research/ during specify-product Stage 2 with a provenance header, and design-exp consumes those frozen copies so a KB edit does not retroactively change an in-flight or historical design run. |
| **C15** | **NEW** | R13 MVP Focus. `{product_base}scope/mvp-recommendation.md` must exist and be non-empty before Stage 1 persona synthesis begins. Stage 1 reads primary_use_cases from that file and synthesizes one persona per primary use case (not one per every user-type implied by scope.selected_capabilities). Stage 3 screen inventory and Stage 6 user flows inherit the same narrowing: capabilities serving only deferred use cases either get skipped (user_surface AND deferred-only) or surface with a flagged note; flows for deferred-only scenarios are not authored. Missing or empty mvp-recommendation.md halts pre-flight. |
| F1-F12 | Unchanged | All prior failure conditions preserved. |
| **F13** | **NEW** | Any stage passing `ltm_domain_taxonomy_path` as a skill input, or any skill reading domain content directly from `core/components/memory/knowledge/domain/`, is a structural failure (C14 violation). |
| **F14** | **NEW** | Stage 1 generating a persona for a non-primary use case, OR Stage 3 generating a user-surface screen for a deferred-only capability, OR Stage 6 authoring a flow for a deferred-only scenario — any of these is a C15 violation (MVP Focus). |
| S1-S7 | Unchanged | All scenarios preserved. |

**Implication:** This is an INTENT + CONTRACT-SURFACE update rebake. Workflow Structure A preserved. 10 workflow steps preserved. 3 human checkpoints preserved. Agent boundary table preserved (designer + judge). Constraint classifications grow to include C14 (structural) and C15 (pre-flight). The compiled SKILL.md rewrite touches (a) the pre-flight table, (b) the pre-flight bash block, (c) every stage's JSON contract input block, and (d) the drift notice.

## What changed in the 6 design skills (Phase 2 — already shipped in the repo)

The following skill-contract changes were authored BEFORE this rebake executes. The compiled SKILL.md must propagate them into its JSON contract input blocks and its eval-embedding strategy.

| Defect | Scope | Impact on compiled SKILL.md |
|--------|-------|---|
| **D11** | Every skill's documentation uses `{product_base}experience/...` (not `/ux/...`). | No contract change — the compiled SKILL.md already uses `{product_base}experience/` from the D10 bake. Confirmed. |
| **D12** | Output parameter names renamed: `output_path` → `personas_path` (synthesize-personas); `output_dir` → `screens_dir` (generate-screen-inventory); `output_dir` → `flows_dir` (map-user-flows); `output_path` → `design_spec_path` (compile-design-spec); `output_path` → `validation_path` (validate-screen-coverage). | **Already propagated** in the D10 compiled SKILL.md (Steps 1, 3, 4, 6, 7, 9). Re-verify during rewrite. |
| **D19** | Screen frontmatter: `capability: <string>` → `capabilities: <list>` plus optional `capability_classification: user_surface\|substrate\|admin_only`. generate-screen-inventory emits the list shape; validate-screen-coverage computes coverage against the UNION of all screens' `capabilities` lists and carves out substrate/admin_only from the coverage rule. | Add a note to Step 3's step text explaining the new frontmatter list-shape. No contract input rename — `screens_dir` stays the same. The validate-screen-coverage evals remain the same check, the skill internally enforces the new shape. |
| **D20** | validate-screen-coverage accepts `mode: "strict" \| "partial"` (default strict). In partial mode, orphan scenarios are reported but do NOT flip status to failed. | Add explicit `mode: "strict"` to the Step 4 and Step 7 JSON contract input blocks so the play is never ambiguous about which mode it's in. The `partial` mode is intentionally not used — `strict` is the correct production default. |
| **D21** | Every skill declares `{product_base}` as a resolved placeholder and its paths are template-style (`{product_base}experience/personas.md`). Skills do not assume relative working directory. | The compiled SKILL.md already passes `product_base` and uses `{product_base}` placeholders throughout. Re-verify during rewrite. |

## What changed in the JSON contracts (authoritative for this rebake)

This is the contract delta between the D10 bake and this D15+D16 bake:

| Stage | Step | Change |
|-------|------|--------|
| 1 — Persona synthesis | Step 1 | Remove `ltm_domain_taxonomy_path` from input; add `product_research_path: "{product_base}research/"`; add `mvp_recommendation_path: "{product_base}scope/mvp-recommendation.md"` (new C15 input). |
| 2 — Screen inventory | Step 3 | Remove `ltm_domain_taxonomy_path`; add `product_research_path: "{product_base}research/"`. Narrative note: capability frontmatter is now a list (D19). |
| 2 — Screen validation (pre-flow) | Step 4 | Remove `ltm_domain_taxonomy_path`; add `product_research_path: "{product_base}research/"`; add explicit `mode: "strict"` (D20). |
| 3 — User flows | Step 6 | No change — map-user-flows never took `ltm_domain_taxonomy_path`. |
| 3 — Flow validation (post-flow) | Step 7 | Remove `ltm_domain_taxonomy_path`; add `product_research_path: "{product_base}research/"`; add explicit `mode: "strict"` (D20). |
| 4 — Wireframes | Step 8 | Remove `ltm_domain_taxonomy_path`; add `product_research_path: "{product_base}research/"`. |
| 6 — Design spec | Step 9 | No change — compile-design-spec never took `ltm_domain_taxonomy_path`. |

Total: **5 stages** gain `product_research_path`. **1 stage** (Stage 1) additionally gains `mvp_recommendation_path`. **2 stages** (Steps 4 + 7) gain explicit `mode: "strict"`.

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
│   └── C15 (NEW) — {product_base}scope/mvp-recommendation.md exists + non-empty
│
├── Phase: Preparation — Persona Synthesis
│   └── Step 1 — designer → synthesize-personas
│       Input: epics_dir, scope_path, product_research_path, mvp_recommendation_path, personas_path
│       Output: {product_base}experience/personas.md (narrowed to primary use cases per C15)
│       Evals: F1, F2, F3, C3, C4
│
├── Phase: Checkpoint 1 — Persona Review (human gate)
│
├── Phase: Execution — Screen Inventory
│   ├── Step 3 — designer → generate-screen-inventory
│   │   Input: scope_path, enriched_capabilities_path, epics_dir, personas_path,
│   │          product_research_path, ltm_screen_inventory_schema_path, screens_dir
│   │   Output: {product_base}experience/screens/*.md (capabilities: list frontmatter per D19)
│   └── Step 4 — designer → validate-screen-coverage (pre-flow pass, mode=strict)
│       Evals: F4, F5, C5, C6
│
├── Phase: Checkpoint 2 — Screen Inventory Review (human gate)
│
├── Phase: Execution — User Flows
│   ├── Step 6 — designer → map-user-flows
│   │   Input: personas_path, screens_dir, epics_dir, flows_dir
│   │   Output: {product_base}experience/flows/*.md (narrowed — deferred-only flows excluded per C15)
│   └── Step 7 — designer → validate-screen-coverage (post-flow pass, mode=strict)
│       Evals: F6, F7, C7
│
├── Phase: Execution — Wireframe Generation
│   └── Step 8 — designer → generate-wireframes
│       Input: screens_dir, product_research_path
│       Evals: F8, F9, C8, C9
│
├── Phase: Execution — Design Spec Compilation
│   └── Step 9 — designer → compile-design-spec
│       Input: personas_path, screens_dir, flows_dir, scope_path, quality_profile_path, design_spec_path
│       Output: {product_base}experience/design-spec.md
│       Evals: F10, F11, F12, C12
│
├── Phase: Checkpoint 3 — Final Design Review (human gate)
│
├── Phase: Scenario Validation
│   └── SCE-1..SCE-7 (S1..S7)
│
└── Phase: Evidence & Close
    └── Step 11 — scriber writes evidence + repo-orchestrator self-commits product artifacts
```

## Intent constraint coverage

- **Pre-flight:** C1, C2, C10, C11, **C15 (NEW)** → Pre-flight table rows + resume check + bash block
- **Structural:** C10, C11, C13, **C14 (NEW)** → Agent boundary table, compilation rules, play-level low-fidelity discipline, Pull-to-Product rule (play never sends ltm_domain_taxonomy_path)
- **Artifact-verifiable:** C3, C4, C5, C6, C7, C8, C9, C12 → Step evals (SE-n) + scenario evals (SCE-n)

Every failure condition (F1-F14) maps to ≥1 SE. Every scenario (S1-S7) maps to ≥1 SCE. Every pre-flight constraint appears in the pre-flight table. Every structural constraint has a visible enforcement mechanism in the compiled play.

## Skill inventory (all existing, modified in Phase 2)

| Skill | Role in play | Phase 2 status | Contract path |
|-------|--------------|---|---|
| `synthesize-personas` | Step 1 (persona synthesis) | modified (D11, D12, D21) | core/components/skills/synthesize-personas/SKILL.md |
| `generate-screen-inventory` | Step 3 (screen inventory) | modified (D11, D12, D19, D21) | core/components/skills/generate-screen-inventory/SKILL.md |
| `validate-screen-coverage` | Steps 4 + 7 (blocking validators) | modified (D11, D12, D19, D20, D21) | core/components/skills/validate-screen-coverage/SKILL.md |
| `map-user-flows` | Step 6 (user flow diagrams) | modified (D11, D12, D21) | core/components/skills/map-user-flows/SKILL.md |
| `generate-wireframes` | Step 8 (per-screen wireframe append) | modified (D11, D21) | core/components/skills/generate-wireframes/SKILL.md |
| `compile-design-spec` | Step 9 (final consolidated spec) | modified (D11, D12, D21) | core/components/skills/compile-design-spec/SKILL.md |
| `validate-kb-extension` | Pre-flight gate only — excluded from evals-creator input | unchanged | core/components/skills/validate-kb-extension/SKILL.md |

7 skills total. 6 step-producing (all modified in Phase 2). 1 pre-flight-only (unchanged).

`validate-kb-extension` is intentionally excluded from the evals-creator `skill_contracts` list. It is a pre-flight gate check that runs before any step. It does not produce step artifacts evaluated by SE-* evals.

## Intent-crafter (rebake-mode) decision

**Skipped.** The intent.yaml is well-formed and internally consistent — the D15/D16 update added C14, C15, F13, F14 and left everything else untouched. The briefing explicitly notes the intent is correct as-authored and hands the compiler a pre-computed sha256 (`dd91c5c3d44435c554947fc7956f5f68618827fb645c9a340145adf18c3228d7`), which I verified against the on-disk intent.yaml with `shasum -a 256`. There is no gap the crafter needs to fill. Running intent-crafter would return "no gaps found" without adding value, and would risk churning the hash by whitespace reformatting. **Documented decision: no crafter invocation for this rebake.**

## Agent audit (designer)

- `core/components/agents/designer.md` exists at the same version used in the D10 bake.
- Domain: ux. Role: designer. Model: opus. Tools: Task, Read, Write, Glob, Grep, Skill.
- Declares all 6 design-exp skills in its skill inventory.
- **Known drift in agent narrative (out of scope for this rebake):**
  - `designer.md` line 88 still says "paths populated with real artifact paths under `.meridian/product/ux/`" — this is a stale narrative reference from before D10. The compiled play's JSON contracts are authoritative over agent narrative; the agent's Skill-tool-driven invocations will use the play's `{product_base}experience/...` paths correctly at runtime. A dedicated agent-file rebake will correct the narrative in a separate pass.
  - The 6 design skills still declare `ltm_domain_taxonomy_path` as an Input parameter in their own SKILL.md Input sections (Phase 2 did NOT rename the skill-side parameter — only the skill Input *label* remains while the play-side surface uses the new name). C14 is a **play-level** structural constraint: "The play never sends `ltm_domain_taxonomy_path` to downstream skills." The designer agent is the context engineer that maps play-level inputs to skill-level parameters — it will route `product_research_path` from the play's contract into the skill call as whatever the skill expects at its edge. A separate skill-level rebake will align the skill input labels to `product_research_path`.
- P1-P11 principle compliance unchanged — this rebake is a contract-surface update, not an agent principle change. **No re-audit required.**

## Workflow selection

**Structure A — Full checkpoint flow with 3 human review gates.** Unchanged.

| Agent category | Count | Members |
|---------------|-------|---------|
| Domain agents | 2 | designer, judge (judge invoked via `validate-screen-coverage` on Steps 4 + 7) |
| Utility agents (exempt) | 2 | scriber (all evidence / checkpoint / status writes), repo-orchestrator (self-commit) |

Domain agent count = 2, well within the ≤5 budget.

## Constraint classification (updated for C14 + C15)

| Category | Constraint IDs |
|----------|---------------|
| pre-flight | C1, C2, C10, C11, **C15** |
| structural | C10, C11, C13, **C14** |
| artifact-verifiable | C3, C4, C5, C6, C7, C8, C9, C12 |

- **C15 is pre-flight** because it checks an environmental precondition (mvp-recommendation.md must exist and be non-empty) before domain work begins. Stage 1 narrowing is enforced by the synthesize-personas skill at runtime, but the gate is a pre-flight file check.
- **C14 is structural** because it is a play-structure rule about which contract input names the play passes to skills — enforceable by inspection of the compiled SKILL.md's JSON contract input blocks, not by runtime check.
- C10 and C11 still appear in both pre-flight and structural — pre-flight checks writability + agent reachability, structural enforces the delegation contract and folder discipline throughout the play.

## Pipeline steps followed for this rebake

1. **R1 deep read:** intent.yaml (current), SKILL.md (current, superseded by this rewrite), designer.md, all 6 design skill contracts (Phase 2 versions), validate-kb-extension skill, screen-inventory.yaml schema, create-play SKILL, compiled-example. Complete.
2. **play-analysis.md:** This document (OVERWRITES the D10 analysis).
3. **intent-crafter:** Skipped (decision documented above).
4. **skill-manifest.yaml:** To be written — 6 step-producing skills + 1 pre-flight-only skill.
5. **Agent audit:** No re-audit — designer unchanged. Drift in narrative noted out of scope.
6. **Workflow selection:** Structure A confirmed; no change.
7. **Step 6a constraint classifications:** Updated above (C14 → structural, C15 → pre-flight).
8. **Step 6b evals-creator invocation:** Pending. Must cover F13, F14 as new failure conditions and C14, C15 as new constraints (C14 is structural so no SE; C15 is pre-flight so also no artifact SE — but F14 is an artifact-verifiable failure and must get an SE).
9. **Step 6c SKILL.md recompile:** Pending. Full rewrite with C14/C15 contract propagation, D19 frontmatter note, D20 explicit strict mode, new pre-flight row + bash check for C15, drift notice rewritten.
10. **Step 6d coverage-matrix.md:** Pending.
11. **Path audit:** Pending — verify `ltm_domain_taxonomy_path` hits 0 in contract blocks, `product_research_path` hits ≥5, `mvp_recommendation_path` hits ≥1.

## Path correction map (versus the D10 bake)

The D10 bake already fixed `product/product/` and `/ux/` drift. This rebake adds ONLY these contract-surface renames:

| D10 bake | D15/D16 bake |
|---|---|
| `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (Stage 1) | `product_research_path: "{product_base}research/"` |
| `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (Stage 3) | `product_research_path: "{product_base}research/"` |
| `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (Stage 4) | `product_research_path: "{product_base}research/"` |
| `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (Stage 7) | `product_research_path: "{product_base}research/"` |
| `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (Stage 8) | `product_research_path: "{product_base}research/"` |
| (absent) | **NEW: `mvp_recommendation_path: "{product_base}scope/mvp-recommendation.md"` (Stage 1 only)** |
| (absent) | **NEW: `mode: "strict"` explicit in validate-screen-coverage calls (Steps 4 + 7)** |

The D10 path corrections (`{product_base}experience/`, `{product_base}_checkpoints/`, `{product_base}_evidence/`, `{product_base}_status/`) are preserved intact.

## Success criteria for this rebake

1. SKILL.md regenerated top-to-bottom. Full rewrite. No in-place edits.
2. intent_hash updated to `sha256:dd91c5c3d44435c554947fc7956f5f68618827fb645c9a340145adf18c3228d7`.
3. compiled_by = `/create-play --rebake design-exp`.
4. Zero occurrences of `ltm_domain_taxonomy_path` in any JSON contract input block.
5. At least 5 occurrences of `product_research_path` in JSON contract input blocks (Stages 1, 3, 4, 7, 8).
6. At least 1 occurrence of `mvp_recommendation_path` in Stage 1 input block.
7. Zero occurrences of `{product_base}product/` (pre-D1 doubled folder).
8. Zero occurrences of `/ux/` outside the drift notice narrative.
9. At least 10 occurrences of `{product_base}experience/`.
10. Zero occurrences of `output_path` in any JSON contract block (D12 rename — they should all be `personas_path`, `design_spec_path`, `validation_path`).
11. Zero occurrences of `output_dir` in any JSON contract block (D12 rename — they should all be `screens_dir`, `flows_dir`).
12. New pre-flight table row + new bash check for C15 (mvp-recommendation.md must exist and be non-empty).
13. Explicit `mode: "strict"` in Steps 4 + 7 JSON contracts (D20).
14. Narrative note in Step 3 text about the `capabilities: list` frontmatter shape (D19).
15. All 10 workflow steps preserved structurally.
16. All 3 human checkpoints preserved.
17. evals-creator invoked; eval language copied verbatim (no hand-authored evals).
18. coverage-matrix.md confirms every intent item (C1-C15, F1-F14, S1-S7) has ≥1 covering element.
19. New drift notice at the bottom explaining D15/D16 rebake supersedes the D10 path-correction rebake.
