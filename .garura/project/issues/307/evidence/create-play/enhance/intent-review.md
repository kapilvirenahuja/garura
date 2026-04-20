# Intent Review — enhance (rebuild)

**Path:** `core/components/plays/enhance/reference/intent.yaml`
**Date:** 2026-04-20

## Schema Gate: PASS

- `intent` present, implementation-agnostic (describes workflow outcomes, no agent/skill names beyond role nouns).
- Constraints: 21 entries (C1–C21), each with `id` + `rule`.
- Failure conditions: 11 entries (F1–F11), each with `id` + `condition`.
- Scenarios: 8 entries (S1–S8), each with `id` + `persona` + `given` + `then`.

## Deliberate Additions for #307 — Confirmed Intact

- **C21** — judge dispatch must carry `eval_path` + `config.instructions` with ER-4 confidence rule. Present, unchanged.
- **F11** — approval-required risk bypassed C20 checkpoint. Present, orthogonal to F8 as written.
- **S8** — architectural risk with `action:approval-required` triggers focused checkpoint. Present, distinguished from S5.
- **C19 classification fields** — type taxonomy, action taxonomy, LTM grounding rule, eval propagation, backward-compat default. Present, unchanged.

## Gap Analysis vs play-analysis.md

Play-analysis flags G1, G7, G9, G10, G11 as gaps. All five are **compilation-side** (SKILL.md must be rebuilt to cover C21 via new SE-*, embed `eval_path`/`config.instructions` in Step 10 JSON contract, recompute `intent_hash`, add explicit Task DAG section). None indicate a missing clause in intent.yaml — C21 already mandates the dispatch shape the gaps reference.

G2 (FC coverage), G3 (scenario coverage), G4–G6, G8 all PASS against the current intent.

## Material Intent Gaps: NONE

No missing constraint, failure condition, or scenario. Intent is compilable as-is. Proceed to `/create-play --rebuild` to regenerate SKILL.md; all flagged gaps resolve on the compilation side.

## Recommendations

1. Run rebuild to recompute `intent_hash` (currently drifted: `8385c967…` → `f06ee871…`).
2. Ensure evals-creator emits a new SE covering C21 (replacing or amending SE-12 which contradicts it).
3. No edits to intent.yaml required.
