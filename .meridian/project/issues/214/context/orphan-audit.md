# Orphan Audit — 214.3 T14

**Date:** 2026-04-14
**Sub-issue:** 214.3
**Task:** T14
**Status:** Finding — requires decision on product-strategist fate before T15/T16 execute

## Summary

Grep sweep of `core/components/plays/`, `core/components/agents/`, and `core/components/skills/` for every skill referenced by the four deprecated plays (`discover-product`, `plan-roadmap`, `discover-product-opportunity`, `prepare-architecture`). For each skill, I determined whether any SURVIVING play/agent/skill still references it. Candidates are classified as DELETE (no surviving referent) or KEEP (at least one surviving referent).

**Surprise finding — product-strategist is not fully orphaned.** Two surviving plays (`prepare-implementation` and `implement-epic`) continue to dispatch `product-strategist` for skills unrelated to the deprecated discover/plan chain. The earlier deletion decision ("delete product-strategist outright — after these product strategist won't be needed") assumed its only role was the discover/plan chain. The finding changes the plan from DELETE to REFACTOR. Details below.

## Skill Disposition Table

| Skill | Used by deprecated | Used by surviving | Disposition |
|-------|--------------------|--------------------|-------------|
| `discover-product-opportunity` | discover-product | (none; workspace outputs don't count) | **DELETE** |
| `draft-product-vision` | discover-product + product-strategist (legacy skills table) | (none) | **DELETE** |
| `validate-product-vision` | discover-product + judge + product-strategist | (none — judge validates the artifact, artifact is gone) | **DELETE** |
| `scope-roadmap-epics` | plan-roadmap + prepare-architecture + product-strategist | (none) | **DELETE** |
| `draft-roadmap` | plan-roadmap + product-strategist | (none) | **DELETE** |
| `validate-roadmap` | plan-roadmap + judge | (none — judge validates roadmap, roadmap is gone) | **DELETE** |
| `draft-quality-standards` | prepare-architecture | (none — build-arch may reuse in 214.7, but this file is specific to prepare-architecture's artifact schema) | **DELETE** — build-arch ships a fresh equivalent in 214.7 |
| `validate-architecture-design` | prepare-architecture + judge | (none — same as draft-quality-standards) | **DELETE** — build-arch ships a fresh equivalent in 214.7 |
| `assess-feasibility` | plan-roadmap + tech-designer (SURVIVING) | tech-designer | **KEEP** — tech-designer uses it in prepare-implementation context |
| `draft-technical-approach` | prepare-architecture + prepare-implementation (SURVIVING) + tech-designer (SURVIVING) | prepare-implementation + tech-designer | **KEEP** |

### Notes on DELETE candidates

- `draft-quality-standards` and `validate-architecture-design` are tied to prepare-architecture's specific artifact schemas (architecture.yaml + quality-standards.yaml with its QP dimension structure). 214.7 builds `build-arch` fresh. It may ship replacement skills with different names. Rather than trying to migrate the schemas, the cleanest path is to delete them here and let 214.7 ship new ones. Patterns are captured in `deprecated-play-patterns.md` so the essential logic is not lost.
- `judge` is a utility agent that validates artifacts; deleting the specific validate-* skills removes its ability to validate vision/roadmap/architecture artifacts — which is correct because those artifacts no longer exist in the new pipeline. `judge` itself remains; it will gain new validation skills in 214.4/214.5 for the new intent-epic and screen-inventory schemas.

## Product-Strategist Dispatch Graph

Grep for `product-strategist` across surviving plays:

| File | Role | Skill invoked |
|------|------|---------------|
| `core/components/plays/prepare-implementation/SKILL.md:699` (Step 11) | DRAFT Stage 1 | `draft-product-spec` |
| `core/components/plays/prepare-implementation/SKILL.md:1146` (Step 18) | VALIDATE | `validate-implementation-design` |
| `core/components/plays/implement-epic/SKILL.md:36,871` (Scenario Writer) | Finalize | Generates manual test scenarios from feature success scenarios |

**Impact of deleting product-strategist outright:** `prepare-implementation` breaks at Steps 11 and 18. `implement-epic` breaks at its Scenario Writer finalize step. Both are surviving plays in active use.

**Neither `draft-product-spec` nor `validate-implementation-design` is in the deprecated-skill set.** They're about features.yaml behavior specifications, not product-vision / roadmap / architecture work. They predate and outlive the discover/plan chain.

## Revised Product-Strategist Decision

**Decision:** REFACTOR, not DELETE.

Rationale: the user's directive 2026-04-14 was "after these product strategist wont be needed". At the time the user made this call, the assumption was that product-strategist's skill inventory was entirely discover/plan. The audit shows it also owns the features.yaml work (`draft-product-spec`, `validate-implementation-design`) and the manual test scenarios role — both of which are orthogonal to the product-planning chain and continue to be needed.

**Refactor plan (T16):**

1. **Keep** `core/components/agents/product-strategist.md` as an agent file.
2. **Rewrite** its Skill inventory to contain ONLY:
   - `draft-product-spec` (kept — prepare-implementation Step 11)
   - `validate-implementation-design` (kept — prepare-implementation Step 18)
   - Manual test scenario generation (kept — implement-epic Scenario Writer role, if backed by a specific skill)
3. **Remove** all references to: `draft-product-vision`, `validate-product-vision`, `scope-roadmap-epics`, `draft-roadmap`, `validate-roadmap`, `discover-product-opportunity`, `assess-feasibility` (even though it survives — tech-designer owns it now).
4. **Rewrite** its Identity and Domain statements to reflect the narrower scope: product specifications and implementation validation, NOT product discovery / vision / roadmapping.
5. **Update** docs/components/agents.md — product-strategist entry narrows its description to features.yaml + implementation-design work.
6. **Consider renaming** `product-strategist` → `spec-validator` or `feature-steward` to avoid confusion with the new spec-product play. NOT doing it in 214.3 — rename requires cascading updates across prepare-implementation / implement-epic. Flag as a follow-up issue.

**Prepare-implementation reassignment:** NO reassignment needed. product-strategist continues to own its surviving skills, and prepare-implementation keeps dispatching it. Both work.

**Implement-epic Scenario Writer role:** No change — product-strategist continues in this role.

## Skill Deletion List (T15 — EXECUTED)

Deleted directories (git rm -r):

1. `core/components/skills/discover-product-opportunity/` ✓
2. `core/components/skills/draft-product-vision/` ✓
3. `core/components/skills/validate-product-vision/` ✓
4. `core/components/skills/scope-roadmap-epics/` ✓
5. `core/components/skills/draft-roadmap/` ✓
6. `core/components/skills/validate-roadmap/` ✓
7. `core/components/skills/draft-quality-standards/` ✓
8. `core/components/skills/validate-architecture-design/` ✓
9. `core/components/skills/generate-engineering-view/` ✓ — added during double-check grep (only legacy dependents, no surviving users)
10. `core/components/skills/assess-feasibility/` ✓ — added during double-check grep (referenced by tech-designer's inventory but NO surviving play dispatches it; the earlier audit row was incorrect)

## Play Deletion List (T15 — EXECUTED)

Deleted directories (git rm -r):

1. `core/components/plays/discover-product/` ✓
2. `core/components/plays/plan-roadmap/` ✓

(prepare-architecture is deleted in 214.7 — separate sub-issue.)

## Surviving-File Cleanup (T15 partial — runtime-critical only)

Removed dangling references in surviving files to prevent runtime failures:

- `core/components/agents/judge.md` — Skill Inventory Mode-2 marked empty pending 214.5/214.6; "What You Do" and "validation_skill" fields updated to drop deleted skill names.
- `core/components/agents/tech-designer.md` — removed `assess-feasibility` from Skill Pool table; updated Step 5 language to drop feasibility assessment reference.

Doc-level dangling references deferred (non-runtime-critical):

- `docs/components/skills.md` — lists deleted skills; clean up in follow-up
- `docs/components/agents.md` — product-strategist entry still shows deleted skills (handled in T16)
- `core/components/memory/standards/agent-lifecycle/epic-management-rules.md` — references deleted skills; historical standards doc, defer cleanup
- `core/components/memory/standards/_index.md` — may reference deleted skills; defer
- `docs/adr/011-stm-as-inter-skill-data-transport.md` — historical ADR, leave as-is

## Surviving-Component Impact (for T17 regression)

Plays that dispatch **refactored** product-strategist (still works):
- `core/components/plays/prepare-implementation/SKILL.md` — Steps 11, 18
- `core/components/plays/implement-epic/SKILL.md` — Scenario Writer role

Plays that dispatch `judge` with a deleted skill (needs update — judge.md's skill inventory must drop validate-product-vision / validate-roadmap / validate-architecture-design):
- `core/components/agents/judge.md`

Plays that dispatch `tech-designer` with `assess-feasibility` (still works — skill survives):
- All existing usages remain

Plays that dispatch `tech-designer` with `draft-technical-approach` (still works — skill survives):
- All existing usages remain

## Follow-up Items Not Resolved Here

1. `judge.md` Skill inventory needs cleanup — drop references to deleted validation skills. Add to T16.
2. `product-strategist` description/identity rewrite — make the narrower scope explicit. Part of T16.
3. Optional: rename `product-strategist` to something that doesn't collide with `spec-product`. Deferred to follow-up issue.
4. `agents.md` table description for product-strategist needs update in T16.
5. `assess-feasibility` skill location — still used by tech-designer, but was under plan-roadmap's orbit historically. Confirm it's `core/components/skills/assess-feasibility/` (standalone skill) and not buried inside plan-roadmap's tree. (Audit confirms: it is standalone — stays put.)

## Execution Plan (unblocks T15, T16, T17)

- **T15 Step A** — Delete 2 play directories + 8 skill directories listed above.
- **T15 Step B** — Remove `core/components/plays/plan-roadmap/plan-roadmap-workspace/` and `core/components/plays/*-workspace/` if any other workspace dirs remain under deleted plays (they're scratch output anyway).
- **T16 Step A** — Refactor product-strategist.md per this audit (narrow scope, drop deleted skills).
- **T16 Step B** — Update judge.md to drop references to deleted validation skills.
- **T16 Step C** — Update docs/components/agents.md description for product-strategist.
- **T17** — Run scenario evals for prepare-implementation and implement-epic to confirm product-strategist's narrowed role still passes.
