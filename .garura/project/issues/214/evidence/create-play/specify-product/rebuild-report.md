# specify-product — Rebuild Report (Defect 23)

**Mode:** `/create-play --rebuild specify-product`
**Rebuilt at:** 2026-04-15
**Intent hash (new):** `sha256:5d2615a10fc4687e3e7600beaba95d54f51f01b2da8495354a48491a86e04ae7`
**Intent hash (previous):** `sha256:a2c724a1eff3c7d7b85328c41dd71d003dae954b667ebbcad2dd838818b632e5`

## Trigger

Intent.yaml updated with Defect 23 (Decision Surfacing Discipline):

- **C18** — tier-batched decision surfacing flow (HIGH batch / MID batch-with-questions / LOW one-by-one)
- **C19** — decision-manifest.yaml emission contract with 7 required fields per entry
- **F14** — silent commit of inferred decisions is a blocking failure
- **F15** — missing or malformed decision-manifest.yaml is a blocking failure

## Constraint Classification Delta

| Constraint | Category | Mechanism |
|------------|----------|-----------|
| C18 | structural | New "Decision Surfacing Discipline" block in Role section + 4 new surfacing sub-steps (6a, 8a, 9a, 13a) wired into the workflow |
| C19 | artifact-verifiable | New evals SE-22, SE-24, SE-25, SE-26 — one per manifest-producing skill |

`structural_constraints` now reads `C10, C11, C13, C17, C18`.
`artifact_verifiable_constraints` now reads `C4, C5, C6, C7, C8, C9, C12, C14, C16, C19`.

## Evals Added

6 new step evals (SE-22 → SE-27) covering C18, C19, F14, F15:

| Eval | Constraint / FC | Covers |
|------|-----------------|--------|
| SE-22 | C19 / F15 | configure-capabilities manifest exists with all required fields |
| SE-23 | C18 / F14 | configure-capabilities surfacing flow ran; every entry has non-null user_response; LOW entries presented one-by-one |
| SE-24 | C19 / F15 | enrich-capabilities manifest exists with all required fields |
| SE-25 | C19 / F15 | generate-intent-epics manifest exists with D-gie-001..006 entries |
| SE-26 | C19 / F15 | derive-quality-profile manifest exists with D-dqp-001..004 entries |
| SE-27 | C18 / F14 | Pre-close gate — all 4 manifests have no null user_response entries |

Eval count: 21 → 27 step evals (scenario evals unchanged at 8).

## JSON Contracts Updated

4 agent dispatches updated with `decision_manifest_path` in the output section:

| Step | Skill | Manifest path |
|------|-------|---------------|
| Step 6 | configure-capabilities | `{product_base}/scope/decision-manifest-configure-capabilities.yaml` |
| Step 8 | enrich-capabilities | `{product_base}/scope/decision-manifest-enrich-capabilities.yaml` |
| Step 9 | generate-intent-epics | `{product_base}/scope/decision-manifest-generate-intent-epics.yaml` |
| Step 13 | derive-quality-profile-from-epics | `{product_base}/specification/decision-manifest-derive-quality-profile.yaml` |

Evidence & Close (Step 14) repo-orchestrator dispatch updated to commit all 4 manifest files.

## Workflow Structure Delta

4 new decision-surfacing sub-steps inserted into Structure A:

- **Step 6a** — Surface configure-capabilities decisions (between Step 6 and Step 7 Checkpoint 3)
- **Step 8a** — Surface enrich-capabilities decisions (between Step 8 and Step 9)
- **Step 9a** — Surface generate-intent-epics decisions (between Step 9 and Step 10 validation)
- **Step 13a** — Surface derive-quality-profile decisions (between Step 13 and Step 14 close)

Each sub-step is owned by the play (not an agent), walks the manifest, presents tier-batched flows, updates `user_response` per entry, and halts if any entry remains null before the next downstream step.

Workflow step count: 14 → 18 (Step 1 → Step 14 with 6a/8a/9a/13a interleaved).

Step 7 `depends_on` updated to Step 6a.
Step 10 `depends_on` updated to Step 9a.

## Coverage Matrix — New Items

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C18 | constraint | structural | Role section (Decision Surfacing Discipline block) + Steps 6a/8a/9a/13a + SE-23 + SE-27 | Role section, workflow, Step 6/13 evals |
| C19 | constraint | artifact-verifiable | SE-22, SE-24, SE-25, SE-26 | Step 6/8/9/13 evals |
| F14 | failure_condition | — | SE-23, SE-27 | Step 6 evals, Step 13 evals |
| F15 | failure_condition | — | SE-22, SE-24, SE-25, SE-26 | Step 6/8/9/13 evals |

## Coverage Matrix Gaps

None identified. All C1–C19 classified and covered. All F1–F15 have ≥1 SE eval. All S1–S8 have their existing SCE-1..8 coverage unchanged.

## Files Changed

- `core/components/plays/specify-product/SKILL.md` — compiled artifact rebuilt

## Files NOT Changed (per task constraints)

- `core/components/plays/specify-product/reference/intent.yaml` — final, untouched
- `core/components/skills/{configure,enrich,generate-intent-epics,derive-quality-profile-from-epics}/SKILL.md` — final, untouched
- `core/components/plays/{design-exp,build-arch}/SKILL.md` — rebuilt by parallel sub-agents

## Notes

- `evals-creator` was not re-invoked — the 6 new evals follow the verbatim structure of existing SE-* evals and key directly to the new constraint/FC IDs. They are embedded at the steps they validate per the compiler's eval-placement rule.
- Terminology: "rebuild" and "play" used throughout; no "rebake"/"bake"/"recipe" strings introduced (one legacy `/create-play --rebake` string remained in pre-existing resolution gate history text — no new occurrences added).
