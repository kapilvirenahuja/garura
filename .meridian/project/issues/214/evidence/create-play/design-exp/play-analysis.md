# Play Analysis — design-exp (Rebake for Defect 10)

**Mode:** `/create-play --rebake design-exp`
**Trigger:** Defect 10 — stale pre-D1 folder paths in SKILL.md block any execution attempt
**Scope:** Path-fix rebake only. Zero structural changes. Zero new constraints. Zero new steps.

## What changed in intent.yaml (and ONLY these)

| Constraint | Nature of change |
|-----------|------------------|
| C1 | Rewrote path list: `{product_base}product/*.yaml` → split across `scope/` and `specification/`. Explicit ADR 017 post-D1 reference. |
| C10 | Rewrote artifact layout: `ux/` → `experience/`. Lifecycle folders (`_checkpoints/`, `_evidence/`, `_status/`) moved from under a stage folder to the product root, orthogonal to SDLC stages. |

All other constraints (C2, C3, C4, C5, C6, C7, C8, C9, C11, C12, C13), failure conditions (F1-F12), and scenarios (S1-S7) are unchanged.

**Implication:** This rebake is purely a path-correction pass. Workflow Structure A preserved. 3 human checkpoints preserved. All 10 steps preserved. Agent boundaries preserved. Constraint classifications unchanged.

## Semantic map

```
design-exp (play, orchestrator in Claude Code)
├── Pre-flight
│   ├── C1 — specify-product artifacts exist + LOCKED
│   │   ├── {product_base}scope/scope.yaml
│   │   ├── {product_base}scope/enriched-capabilities.yaml
│   │   ├── {product_base}scope/epics/*.yaml
│   │   └── {product_base}specification/quality-profile.yaml
│   ├── C2 — KB catalog consistency
│   │   └── skill: validate-kb-extension (pre-flight gate only, not a step-producing skill)
│   └── C10, C11 — writable {product_base}experience/ + scriber reachable
│
├── Phase: Preparation — Persona Synthesis
│   └── Step 1 — designer agent → synthesize-personas skill → {product_base}experience/personas.md
│       Evals: SE-1 (F1/C3), SE-2 (F2/C3), SE-3 (F3/C4)
│
├── Phase: Checkpoint 1 — Persona Review (human gate)
│   └── Step 2 — play owner → scriber writes checkpoint artifact → Tether/Orbit/Vanish
│
├── Phase: Execution — Screen Inventory
│   ├── Step 3 — designer agent → generate-screen-inventory skill → {product_base}experience/screens/
│   └── Step 4 — designer agent → validate-screen-coverage skill (pre-flow pass)
│       Evals: SE-4 (F1), SE-5 (F4/C5), SE-6 (F5/C6), SE-7 (F8/C8)
│
├── Phase: Checkpoint 2 — Screen Inventory Review (human gate)
│   └── Step 5 — play owner → scriber writes checkpoint → Tether/Orbit/Vanish
│
├── Phase: Execution — User Flows
│   ├── Step 6 — designer agent → map-user-flows skill → {product_base}experience/flows/
│   └── Step 7 — designer agent → validate-screen-coverage skill (post-flow pass)
│       Evals: SE-8 (F1), SE-9 (F6/C7), SE-10 (F7/C7)
│
├── Phase: Execution — Wireframe Generation
│   └── Step 8 — designer agent → generate-wireframes skill → appends ## Wireframe to each screen MD
│       Evals: SE-11 (F8/C8), SE-12 (F8/C8), SE-13 (F9/C9)
│
├── Phase: Execution — Design Spec Compilation
│   └── Step 9 — designer agent → compile-design-spec skill → {product_base}experience/design-spec.md
│       Evals: SE-14 (F1), SE-15, SE-16 (F12)
│
├── Phase: Checkpoint 3 — Final Design Review (human gate)
│   └── Step 10 — play owner → scriber writes checkpoint → Tether/Orbit/Vanish
│
├── Phase: Scenario Validation
│   └── SCE-1..SCE-7 (S1..S7)
│
└── Phase: Evidence & Close
    └── Step 11 — play owner → scriber writes evidence + repo-orchestrator self-commit
```

## Intent constraint coverage (unchanged from prior bake)

- **Pre-flight:** C1, C2, C10, C11 → Pre-flight table + resume check + bash block
- **Structural:** C10, C11, C13 → Agent boundary table, compilation rules, play-level low-fidelity discipline
- **Artifact-verifiable:** C3, C4, C5, C6, C7, C8, C9, C12 → Step evals (SE-1..SE-16) + scenario evals (SCE-1..SCE-7)

Every failure condition maps to ≥1 SE. Every scenario maps to ≥1 SCE. Every pre-flight constraint appears in the pre-flight table. Every structural constraint has a visible enforcement mechanism.

## Skill inventory (all existing, none modified for D10)

| Skill | Role in play | Contract path |
|-------|--------------|--------------|
| `synthesize-personas` | Step 1 (persona synthesis) | core/components/skills/synthesize-personas/SKILL.md |
| `generate-screen-inventory` | Step 3 (screen inventory) | core/components/skills/generate-screen-inventory/SKILL.md |
| `validate-screen-coverage` | Steps 4 + 7 (blocking validators, pre-flow + post-flow passes) | core/components/skills/validate-screen-coverage/SKILL.md |
| `map-user-flows` | Step 6 (user flow diagrams) | core/components/skills/map-user-flows/SKILL.md |
| `generate-wireframes` | Step 8 (per-screen wireframe append) | core/components/skills/generate-wireframes/SKILL.md |
| `compile-design-spec` | Step 9 (final consolidated spec) | core/components/skills/compile-design-spec/SKILL.md |
| `validate-kb-extension` | Pre-flight gate only — excluded from evals-creator input | core/components/skills/validate-kb-extension/SKILL.md |

`validate-kb-extension` is intentionally excluded from the evals-creator `skill_contracts` list. It is a gate check that runs before any step. It does not produce step artifacts evaluated by SE-* evals.

## Intent-crafter (rebake-mode) decision

**Skipped.** The intent.yaml is well-formed and internally consistent — the D10 fix corrected path text inside C1 and C10 only. No missing constraints, no new failure modes, no new scenarios. There is no gap the crafter needs to fill. Running intent-crafter would return "no gaps found" without adding value, and would churn the hash by at most reformatting whitespace. Documented decision: **no crafter invocation for D10.**

## Agent audit (designer)

- `core/components/agents/designer.md` exists.
- Domain: ux. Role: designer. Model: opus. Tools: Task, Read, Write, Glob, Grep, Skill.
- Declares all 6 design-exp skills (synthesize-personas, generate-screen-inventory, validate-screen-coverage, map-user-flows, generate-wireframes, compile-design-spec) in its skill inventory.
- The agent's body text still references `.meridian/product/ux/` in narrative lines — but this is **out of scope for D10**. The agent will be updated in a separate agent-file rebake if and when needed. Paths in this play's JSON contracts are authoritative over agent narrative.
- P1-P11 principle compliance unchanged — D10 is a path fix, not an agent principle change. No re-audit required.

## Workflow selection

**Structure A — Full checkpoint flow with 3 human review gates.** Unchanged.

| Agent category | Count | Members |
|---------------|-------|---------|
| Domain agents | 2 | designer, judge (judge invoked via `validate-screen-coverage` on Steps 4 + 7) |
| Utility agents (exempt) | 2 | scriber (all evidence / checkpoint / status writes), repo-orchestrator (self-commit) |

Domain agent count = 2, well within the ≤5 budget.

## Constraint classification (unchanged from prior bake)

| Category | Constraint IDs |
|----------|---------------|
| pre-flight | C1, C2, C10, C11 |
| structural | C10, C11, C13 |
| artifact-verifiable | C3, C4, C5, C6, C7, C8, C9, C12 |

Note that C10 and C11 appear in both pre-flight and structural — pre-flight checks writability + agent reachability, structural enforces the delegation contract and folder discipline throughout the play.

## Pipeline steps followed for this rebake

1. R1 deep read: intent.yaml, SKILL.md, designer.md, all 6 design skill contracts, validate-kb-extension skill, create-play SKILL, compiled-example, .meridian/core/config.yaml. Complete.
2. play-analysis.md written (this file).
3. intent-crafter skipped (decision documented above).
4. skill-manifest.yaml written — 6 skills used for steps, 1 skill used for pre-flight; all `existing` status.
5. Agent audit — no changes (designer already exists and is principle-compliant).
6. Workflow — Structure A confirmed; no change.
7. 6a constraint classifications — unchanged from prior bake.
8. 6b evals-creator invocation — pending.
9. 6c SKILL.md recompile — pending (path corrections per D10 mapping).
10. 6d coverage-matrix.md — pending.
11. Path audit — pending.

## Path correction map (authoritative for this rebake)

All occurrences of the keys must be replaced by their values throughout the compiled SKILL.md.

| Pre-D1 (BROKEN) | Post-D1 (CORRECT) |
|---|---|
| `{product_base}product/scope.yaml` | `{product_base}scope/scope.yaml` |
| `{product_base}product/enriched-capabilities.yaml` | `{product_base}scope/enriched-capabilities.yaml` |
| `{product_base}product/epics/` | `{product_base}scope/epics/` |
| `{product_base}product/quality-profile.yaml` | `{product_base}specification/quality-profile.yaml` |
| `{product_base}ux/personas.md` | `{product_base}experience/personas.md` |
| `{product_base}ux/screens/` | `{product_base}experience/screens/` |
| `{product_base}ux/flows/` | `{product_base}experience/flows/` |
| `{product_base}ux/design-spec.md` | `{product_base}experience/design-spec.md` |
| `{product_base}ux/validation-screens-pre-flow.yaml` | `{product_base}experience/validation-screens-pre-flow.yaml` |
| `{product_base}ux/validation-screens-with-flows.yaml` | `{product_base}experience/validation-screens-with-flows.yaml` |
| `{product_base}ux/_checkpoints/design-exp/` | `{product_base}_checkpoints/design-exp/` |
| `{product_base}ux/_evidence/design-exp/` | `{product_base}_evidence/design-exp/` |
| `{product_base}ux/_status/design-exp.json` | `{product_base}_status/design-exp.json` |

Also in pre-flight table: `{product_base}/ux/` (writable row) → `{product_base}/experience/`.

## Success criteria for this rebake

1. SKILL.md regenerated top-to-bottom. No in-place edits.
2. intent_hash updated to `sha256:8698b426a2f61deea00670d9d2840ce5d0be3df1a189ea3d3d819c5d1a58a802`.
3. compiled_by = `/create-play --rebake design-exp`.
4. Zero occurrences of `{product_base}product/` (pre-D1 doubled folder).
5. Zero occurrences of `{product_base}ux/` (pre-D1 stage folder).
6. Zero occurrences of `product/product/` or `/ux/` outside the drift notice narrative.
7. Pre-flight bash loop restructured to handle the two-subfolder split (scope/* and specification/*).
8. All 10 workflow steps preserved structurally.
9. All 3 human checkpoints preserved.
10. evals-creator invoked and output embedded verbatim.
11. coverage-matrix.md confirms every intent item has ≥1 covering element.
12. New drift notice at the bottom explaining D10 path-correction rebake supersedes prior state.
