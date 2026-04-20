# Technical Context — Issue #265
# /specify must emit scope/features.yaml just before epic generation
# Assembled: 2026-04-19

---

## Summary

Insert a new `manage-features` skill step into `/specify` between Step 8 (`enrich-capabilities`) and Step 9 (`generate-intent-epics`). The skill authors `.meridian/product/scope/features.yaml` using a 5-point status vocabulary (`planned → development → rollout → released → cleanup`). Retire `implementation-inventory.yaml` (zero current references). Migrate `.garura/product/scope/features.yaml` from the 3-value vocabulary to 5-point.

---

## 1. Insertion Point in `specify`

Source: `core/components/plays/specify/SKILL.md` and `core/components/plays/specify/reference/intent.yaml`.

| Step | task_id | Owner |
|------|---------|-------|
| **Step 8** | `specify-stage-4-enrich` | `enrich-capabilities` — writes `enriched-capabilities.yaml` |
| **→ NEW Step 8b** | `specify-stage-4b-features` | **`manage-features`** — writes `features.yaml` |
| **Step 8c (was Step 8a)** | (decision surfacing — enrich) | play-owned |
| **Step 9** | `specify-stage-5-generate` | `generate-intent-epics` — reads `enriched-capabilities.yaml` + (new) `features_path` |

The new step runs after Step 8 completes and BEFORE Step 8a (decision surfacing), because:
1. `enrich-capabilities` produces the enriched record the `manage-features` skill reads.
2. Decision surfacing for enrichment can happen simultaneously with or after `manage-features` — neither consumes the other's output.
3. `generate-intent-epics` (Step 9) must wait for `features.yaml` to be locked.

Practical sequencing in `intent.yaml`: insert `manage-features` dispatch between `specify-stage-4-enrich` and `specify-stage-4a-surface-enrich` (if that's the surfacing sub-step). If the surfacing sub-step is un-numbered, insert between Step 8 and Step 9, renumber the decision-surfacing sub-step accordingly.

---

## 2. Skill Input/Output Contracts — Adjacent Skills

### `enrich-capabilities` (Step 8)
**Output contract** (`core/components/skills/enrich-capabilities/SKILL.md` lines 134–142):
```yaml
enriched:
  path: <written path>        # .meridian/product/scope/enriched-capabilities.yaml
  enriched_count: <int>
  missing_kb_sources: <int>   # must be 0
decision_manifest:
  path: <written path>
  decisions_recorded: <int>
```
No current output declares `features.yaml` — this is the gap.

### `generate-intent-epics` (Step 9)
**Current input contract** (`core/components/skills/generate-intent-epics/SKILL.md` lines 23–33):
- `enriched_capabilities_path` (required)
- `project_profile_path` (required)
- `market_brief_path` (required)
- `ltm_intent_epic_schema_path` (required)
- `ltm_rules_epics_path` (required)
- `ltm_rules_features_path` (required)
- `ltm_rules_scenarios_path` (required)
- `epics_output_dir` (required)
- `decision_manifest_path` (required)

**Required addition:** `features_path` (path, required) — `.meridian/product/scope/features.yaml`, produced by `manage-features`. The skill should use it as its feature catalog reference so epic KB IDs can be cross-checked against declared product features.

---

## 3. Schema Contract

### Canonical Shape — `.garura/product/scope/features.yaml`

Source: `core/components/plays/specify/reference/intent.yaml` constraint C13 (3-tier: Domain → Capability → Intent Epic), and the Garura features.yaml header (lines 1–17).

**Top-level fields** (derived from `.garura/product/scope/features.yaml`):
```yaml
summary:
  domains: <int>
  capabilities: <int>
  features_total: <int>
  features_live: <int>      # will rename to features_released after migration
  features_partial: <int>   # will rename to features_rollout after migration
  features_planned: <int>

domains:
  - slug: <domain-slug>
    status: <domain-level status — not 5-point, freeform>
    rollup_notes: >
      <prose>
    capabilities:
      - slug: <capability-slug>
        status: <5-point vocab>     # NEW
        rollup_notes: >
          <prose>
        features:
          - id: <PREFIX-Fnnn>
            name: <short noun phrase>
            status: <5-point vocab>  # per-feature status
            notes: >
              <prose>
            # optional fields present in Garura file:
            evidence: <list of evidence artifacts>
            gap_items: <list>
            target_milestone: <version string>
```

**5-point status enum** (from discovery.md Q3):
- `planned` — not started
- `development` — actively being built
- `rollout` — built but not fully deployed / partial coverage
- `released` — fully live
- `cleanup` — shipped, now winding down / deprecating

**Migration mapping** for `.garura/product/scope/features.yaml`:
- `live` → `released`
- `partial` → `rollout`
- `planned` → `planned` (unchanged)
- `development` and `cleanup` are new — no existing entries use them.

The `summary` fields `features_live` and `features_partial` should be renamed `features_released` and `features_rollout` to match the vocabulary. `features_planned` is unchanged.

---

## 4. Naming Overlap Risk — `draft-product-spec` Features

**`core/components/skills/draft-product-spec/schemas/features.yaml`** is a schema definition artifact, not a data file. Its structure (lines 1–82) is semantically different:
- It is produced by the `/prepare` play's `draft-product-spec` skill.
- It defines feature-level fields for a product spec context: `identity`, `invariants`, `scope`, `features[]` with `blast_radius`, `intent`, `constraints`, `success_scenarios`, `failure_conditions`, `behaviors`.
- It does NOT use a 3-tier domain/capability/feature hierarchy.
- Its top-level `status` is a lifecycle state (`DRAFT|VALIDATED|LOCKED`), not a deployment state.

**Risk:** both are called `features.yaml` and both live under `scope/` at their respective product roots. This will cause confusion when:
- Searching the repo for `features.yaml` — two structurally different files appear.
- Onboarding new agents — they may load the wrong schema.

**Mitigation options (present in approach design):**
1. Rename the `manage-features` output to `feature-catalog.yaml` — clear separation, no rename of the existing `draft-product-spec` schema.
2. Keep `features.yaml` as the output name but place it under `scope/` only (it already is) and enforce path-based discrimination: `draft-product-spec` schema lives only at `{prepare_stm}/features.yaml`; the `manage-features` output lives at `.meridian/product/scope/features.yaml`.

Option 2 is lower friction (the garura file is already named `features.yaml`). Option 1 is cleaner for long-term disambiguation. Surface this decision in approach design.

---

## 5. `manage-features` Skill — Does Not Exist

Confirmed: `Glob('core/components/skills/manage-features/**')` returned no results. The skill must be created from scratch.

Required files to create:
- `core/components/skills/manage-features/reference/intent.yaml` (drive `/create-play --build` from this)
- `core/components/skills/manage-features/SKILL.md` (produced by build — do NOT edit directly)

The skill is NOT user-invocable. It is model-invocable, called by `product-keeper` during `specify`.

**Skill responsibilities:**
1. Read `enriched-capabilities.yaml` (from Step 8).
2. For each enriched capability/feature, map its selected depth and KB feature ID to a `features[]` entry.
3. Accept initial status from the project profile or user context (GF default: `planned`; BF: user-provided).
4. Write `.meridian/product/scope/features.yaml` using the canonical 3-tier schema.
5. Emit a decision-manifest (required by C19) for any status assignment or taxonomy inference.
6. Return output contract: `features_path`, `features_count`, `decision_manifest_path`.

---

## 6. `implementation-inventory.yaml` — Clean Bill

**Grep result:** zero matches for `implementation-inventory` across all `.yaml`, `.yml`, `.md`, `.json`, `.txt` files in the repo.

The file was hand-moved to `scope/features.yaml` on 2026-04-18 (per `features.yaml` line 2). No emitters, consumers, or doc references remain. Retirement requires no cleanup — the retirement is already accomplished. The issue description was accurate; context assembly confirms.

One note for completeness: `domain-selection.yaml` at `.garura/product/specification/domain-selection.yaml` (line 19) references the 2026-04-18 move in a comment — that comment is benign and documents history, not a dependency.

---

## 7. Status Value Consumers — 3-Value Vocabulary

The 3-value status (`live`, `partial`, `planned`) is used ONLY in `.garura/product/scope/features.yaml` itself. No templates, validators, or briefs consume it:

- `brief-render.js` (`badgeClass` function, lines 38–47): handles `draft`, `validated`, `locked`, `approved` only — the 3-value feature status is not passed to this function.
- `features-brief.html`: renders `meta-status` and `brief-status` from `data.status`, which is the top-level artifact lifecycle state (`DRAFT|VALIDATED|LOCKED`), not per-feature status.
- `briefs` play SKILL.md: no reference to `live/partial/planned`.
- No skill or play under `core/components/` reads per-feature status values.

**Conclusion:** the 3→5 migration in `.garura/product/scope/features.yaml` is safe. No downstream consumer will break.

---

## 8. Files to Create

| File | Reason |
|------|--------|
| `core/components/skills/manage-features/reference/intent.yaml` | Skill intent — edit this, then run `/create-play --build` |
| `core/components/skills/manage-features/SKILL.md` | Compiled output from build — do NOT edit directly |

---

## 9. Files to Modify

| File | Reason | Key Change |
|------|--------|------------|
| `core/components/plays/specify/reference/intent.yaml` | Insert `manage-features` step + update `generate-intent-epics` step | Add new step between Stage 4 enrich and Stage 5 generate; add `features_path` to Stage 5 input contract |
| `core/components/plays/specify/SKILL.md` | Compiled output — rebuilt via `/create-play --rebuild specify` after intent.yaml edit | Step 8b JSON contract block added; Step 9 input contract updated with `features_path` |
| `core/components/skills/generate-intent-epics/reference/intent.yaml` | Declare `features_path` as required input | Input contract addition |
| `core/components/skills/generate-intent-epics/SKILL.md` | Rebuilt via `/create-play --rebuild generate-intent-epics` | Step 2 now loads `features.yaml` for cross-reference |
| `.garura/product/scope/features.yaml` | Migrate existing Garura product file to 5-point vocabulary | Rename `live→released`, `partial→rollout` in every feature's `status` field; update `summary.features_live→features_released`, `summary.features_partial→features_rollout` (103 status entries per grep count) |

---

## 10. Files to Delete / References to Clean Up

None. `implementation-inventory.yaml` no longer exists and has zero references in the codebase. No deletion or reference cleanup is required.

---

## 11. Rebake Requirements

Every SKILL.md under `core/components/` is a compiled artifact. The rule is: edit `reference/intent.yaml`, then run `/create-play --build` (new skill) or `/create-play --rebuild` (existing skill). Never edit SKILL.md directly.

| Component | Command | Trigger |
|-----------|---------|---------|
| New `manage-features` skill | `/create-play --build manage-features` | After authoring `core/components/skills/manage-features/reference/intent.yaml` |
| `specify` play | `/create-play --rebuild specify` | After editing `core/components/plays/specify/reference/intent.yaml` to insert Step 8b and update Step 9 contract |
| `generate-intent-epics` skill | `/create-play --rebuild generate-intent-epics` | After editing `core/components/skills/generate-intent-epics/reference/intent.yaml` to add `features_path` input |

**Note:** editing `specify/reference/intent.yaml` is the insertion mechanism — add the new step's JSON contract block and task_id there, NOT in SKILL.md directly.

---

## 12. Open Risks and Ambiguities

| Risk | Severity | Note |
|------|----------|------|
| **Naming overlap: two `features.yaml` files** | Medium | `draft-product-spec/schemas/features.yaml` (prepare-context schema) vs `scope/features.yaml` (manage-features output). Structurally different files, same name. Approach design must decide: rename output to `feature-catalog.yaml` or rely on path discrimination. |
| **`generate-intent-epics` input contract expansion** | Low | Adding `features_path` as required breaks any existing caller that doesn't pass it. Since `specify` is the only caller and it will be rebuilt, this is contained — but the skill's SKILL.md must mark the field required, not optional, or the constraint is toothless. |
| **Migration scope for `.garura/product/scope/features.yaml`** | Low | 103 `status:` entries need updating. The mapping is mechanical (`live→released`, `partial→rollout`). The `summary` field counters need renaming too. Risk is cosmetic (typo in a feature entry) not structural. |
| **Decision manifest requirement for `manage-features`** | Medium | C19 / F15 in `specify/intent.yaml` requires every inference-producing skill to emit a `decision-manifest.yaml`. `manage-features` will make status inferences on GF projects (default all to `planned`). This manifest must be emitted and surfaced before Step 9. A new decision-surfacing sub-step (Step 8c or similar) is needed. |
| **`domain-level` status field** | Low | Garura's features.yaml uses freeform domain-level status (`applied-and-evolving`) separate from the per-feature 5-point vocab. The new skill schema must accommodate this distinction — domain-level status is NOT subject to the 5-point enum. |
