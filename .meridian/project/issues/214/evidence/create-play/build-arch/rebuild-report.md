# build-arch — rebuild report (Defect 23)

**Mode:** `/create-play --rebuild build-arch`
**Compiled at:** 2026-04-15
**Compiled file:** `core/components/plays/build-arch/SKILL.md`

## Intent hash

| | |
|---|---|
| Previous (D11 Phase A) | `sha256:a831f1ed5276315fe9b65f2556c093f45c219083b580e110954c2b876fef54c1` |
| New (D23) | `sha256:fb5232355ba3750199056c7a5d1f6264c7872068663bf2d6caee89b00174ddb2` |

Hash changed as expected — intent.yaml now carries C17, C18, F16, F17.

## Constraint classification (D23 additions)

| ID | Category | Covered by |
|----|----------|------------|
| C17 | artifact-verifiable | SE-12 (architecture manifest) + SE-14 (quality-standards manifest) + structural Decision Surfacing phases |
| C18 | structural + artifact-verifiable | JSON contracts on Step 1 and Step 4 declare `decision_manifest_path` as required output; SE-13 + SE-15 verify manifest schema at runtime |
| F16 | — | SE-12 + SE-14 (`user_response != null` on every entry) |
| F17 | — | SE-13 + SE-15 (manifest schema + required fields + `alternatives_considered ≥ 1`) |

## Evals added

| Eval | Covers | Step | Artifact |
|------|--------|------|----------|
| SE-12 | F16 / C17 | Step 2 (post derive-architecture-spec) | `decision-manifest-derive-architecture-spec.yaml` |
| SE-13 | F17 / C18 | Step 2 | same |
| SE-14 | F16 / C17 | Step 5 (post derive-quality-standards) | `decision-manifest-derive-quality-standards.yaml` |
| SE-15 | F17 / C18 | Step 5 | same |

**Total:** 4 new step evals for C17/C18/F16/F17. Step eval count: 11 → 15.

## Agent contracts updated

Two JSON contracts now pass `decision_manifest_path`:

1. Step 1 — `derive-architecture-spec` — output.decision_manifest_path = `{product_base}architecture/decision-manifest-derive-architecture-spec.yaml`
2. Step 4 — `derive-quality-standards` — output.decision_manifest_path = `{product_base}architecture/decision-manifest-derive-quality-standards.yaml`

Both manifests are added to the repo-orchestrator commit file list.

## New orchestration phases

1. **Decision Surfacing — Architecture** (Step 2b, after Step 2 validation, before Checkpoint 1) — walks `decision-manifest-derive-architecture-spec.yaml`, batches entries by tier, drives HIGH batch-confirm / MID batch-with-questions / LOW 1-by-1 flows per C17, dispatches scriber to rewrite manifest with populated `user_response`. On `override`, reopens Step 1 with pinned overrides.
2. **Decision Surfacing — Quality Standards** (Step 5b, after Step 5 validation, before Checkpoint 2) — same three-tier flow applied to `decision-manifest-derive-quality-standards.yaml`. On `override`, reopens Step 4.

D-das-002 (single-KB-candidate selections) explicitly called out: always `tier: high`, MUST appear in manifest, silent commit is F16 blocking. This is the D11.A6 gap closure.

## D11 Phase A preservation

All D11 Phase A elements preserved:

- **C14 / C15 / C16** — retained verbatim in intent.yaml, retained in `artifact_verifiable_constraints` list
- **F12 / F13 / F14 / F15** — retained
- **SE-11** — retained verbatim with its full pass/fail language
- **grounding-questions.md halt logic** — retained in the narrative for Step 1 (derive-architecture-spec), unchanged
- **`project_profile_path` and `grounding_questions_path` inputs** — retained in Step 1 JSON contract
- **Pre-flight checks** — C14 (grounding-questions.md exists) and C16 (project-profile.yaml exists) retained in pre-flight table and bash logic
- **validate-architecture-spec rejection** of `agent_default_unilateral`, missing `source_type`, grounded_tools overrides, mis-tagged KB citations — retained in Step 2 narrative

## Drift notice

New Defect 23 entry added to the Compiled From section. Prior D11 Phase A and D22 notices retained.

## Coverage matrix — gaps surfaced

None. Every constraint C1..C18 is classified and covered:

- Pre-flight: C1, C2, C10 (write-access), C14, C16
- Structural: C10 (whitelist), C11, C13, C18
- Artifact-verifiable: C3, C4, C5, C6, C7, C8, C9, C12, C14, C15, C16, C17

Every failure condition F1..F17 covered by ≥ 1 SE-*. Every scenario S1..S6 covered by SCE-1..SCE-6 (unchanged).

## Files modified

- `core/components/plays/build-arch/SKILL.md` (compiled play — rebuilt)

## Files NOT touched (per task constraints)

- `core/components/plays/build-arch/reference/intent.yaml` — final, not touched
- Any `core/components/skills/*/SKILL.md` — final, not touched
- `core/components/plays/specify-product/*`, `core/components/plays/design-exp/*` — handled by parallel sub-agents
