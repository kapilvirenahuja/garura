# Workflow Selection — craft-ice

## Chosen: Structure A (Full checkpoint flow)

**Why A over B/C/readiness-only:**
- craft-ice is **multi-agent** (intent-crafter, tech-designer, expectation-crafter) — B is for single-agent/low-risk work.
- Its output (the ICE spec) is **consequential** — it drives the big build plays (prepare/implement, enhance), not a low-risk artifact.
- It has a **skippable human checkpoint** — Structure A's defining feature. craft-ice's checkpoint is gated by the human-in-the-loop **configuration** (C6): when HITL is ON a human approves; when OFF the checkpoint is skipped (auto-approve per policy). This is exactly A's "Checkpoint (skippable)" with config as the gate instead of confidence.
- It is a **generation** play (produces artifacts), so readiness-only (analysis-only) does not apply; it composes agents/skills rather than chaining whole plays, so C does not apply.

## Phase mapping

| Phase | craft-ice content |
|-------|-------------------|
| Pre-flight | Resolve `stm_base`; resolve/create the tracking issue (C4); **scope guard** (C5) — assess scope and redirect fix-it-scale work before any generation. |
| Preparation | Build the three ICE layers: (a) play-led discovery Q&A → digest; (b) Intent triple via intent-crafter→author-intent-yaml; (c) Context bundle via tech-designer; (d) Expectation via expectation-crafter→generate-feature-expectation. |
| Checkpoint (skippable per HITL config) | Present the complete ICE spec; when `craft-ice.hitl` is ON a human approves (flip vetted.status→approved); when OFF, auto-approve per policy. Terminal approval — gates downstream play selection (S1/S2). |
| Evidence & Close | Standard Play Close — evidence file + delivery report. |

## Pre-flight checks derived from constraints

| Check | Constraint | Action on failure |
|-------|-----------|-------------------|
| PF1 — tracking issue resolved/created and STM anchored under `{stm_base}/{issue}/` | C4 | Hard block — no issue, no spec (anchor is mandatory for traceability). |
| PF2 — scope guard: work is substantial (not fix-it-scale) | C5 | Graceful redirect — do NOT produce a spec; point the user to fix-it for quick fixes. |
| PF3 — read `craft-ice.hitl` from `.garura/core/config.yaml` | C6 | Default to HITL ON if unreadable/absent (fail safe toward human approval). |

C1 (all three layers), C2 (intent agnostic), C3 (approval marker + provenance) are artifact-verifiable (step evals). C6 is structural (config-driven, not hardcoded) with an artifact angle covered by F6.
