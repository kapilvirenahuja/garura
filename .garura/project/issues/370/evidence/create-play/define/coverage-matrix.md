# Coverage Matrix — define rebake (issue #370)

Intent: C1–C17, F1–F11, S1–S6. Evals source:
`.garura/project/issues/370/evidence/create-play/define/evals.yaml`
(13 step evals SE-1..SE-13, 6 scenario evals SCE-1..SCE-6).

## Constraints

| ID | Category | Covered by | Location |
|----|----------|------------|----------|
| C1 | pre-flight | Pre-flight check + SE-1 | Pre-flight table / Phase 0 |
| C2 | structural | Agent boundary / play structure | Role + Pre-flight |
| C3 | artifact-verifiable | SE-10 | Phase 1 evals |
| C4 | artifact-verifiable | SE-3 | Phase 2 evals |
| C5 | artifact-verifiable | SE-11 | Phase 3 evals |
| C6 | structural | Play structure (conditional grounding) | Phase 4 |
| C7 | structural | Play structure (Vanish closes issue) | Phase 5 |
| C8 | structural | Play structure (manifest emission) | Phases 2/6/7 |
| C9 | artifact-verifiable | SE-5 | Phase 6 evals |
| C10 | artifact-verifiable | SE-6 | Phase 7 evals |
| C11 | structural | Play structure (epic checkpoint always) | Phase 9 |
| C12 | structural | Play structure (STM vs LTM) | F7/SE-7 |
| C13 | structural | Play structure (non-blocking commit) | Phase 10 |
| C14 | structural | Play structure (auto-create missing) | multiple |
| C15 | pre-flight | Pre-flight check | Pre-flight table |
| C16 | structural | Play structure (template_map) + SE-12 | Phases 5/9/10 |
| **C17** | **artifact-verifiable** | **SE-13** | **Phase 5 Step 5.0 + Phase 9 Step 9.0 evals** |

## Failure conditions

| ID | Covered by | ID | Covered by |
|----|-----------|----|-----------|
| F1 | SE-1 | F7 | SE-7 |
| F2 | SE-2 | F8 | SE-8 |
| F3 | SE-3 | F9 | SE-9 |
| F4 | SE-4 | F10 | SE-12 |
| F5 | SE-5 | **F11** | **SE-13** |
| F6 | SE-6 | | |

## Scenarios

S1→SCE-1, S2→SCE-2, S3→SCE-3, S4→SCE-4, S5→SCE-5, S6→SCE-6.

## Verification rules

- Every artifact-verifiable constraint has ≥1 SE — PASS (C3,C4,C5,C9,C10,C17).
- Every failure condition has ≥1 SE — PASS (F1–F11).
- Every scenario has ≥1 SCE — PASS (S1–S6).
- Every pre-flight constraint in pre-flight table — PASS (C1, C15).
- Every structural constraint has a structural element — PASS.
- All required SKILL.md sections present — PASS.
- intent_hash recomputed and updated — PASS
  (sha256:a1398e860f0c6568269734b1f235dd8f9bd4623456d1b65d8514037c6b0f3e5d).

## Post-compile regression spot-check (9/9 GREEN)

A1 C17∈intent ✓ · A2 surfaced_for_review∈intent ✓ · A3 "Decision
Surfacing"∈intent ✓ · A4 F11∈intent ✓ · A5 "Decision Surfacing"∈SKILL ✓ ·
A6 surfaced_for_review∈SKILL ✓ · A7 catalog-match count=5 (≥2) ✓ ·
A8 "Decision Surfacing"∈SKILL ✓ · A9 "Decision Surfacing" count=2 (≥2) ✓.
intent.yaml valid YAML.

Coverage gate: **PASS** — no intent item has zero coverage.
