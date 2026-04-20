# Understanding — Issue #307

## Issue
[ENH] judge agent — escalate contract-mismatch + downstream-break concerns as blockers, not follow-ups.
During /enhance #305 the judge rated 0.74 and labeled three contract/pipeline-break concerns as "follow-ups" when they were blockers. User's core ask: judge must correctly frame severity when contract mismatches or downstream-break gaps are present.

## Codebase surface (relevant)
- `core/components/agents/judge.md` — declares 4 modes (1 Implementation Eval, 2 Artifact Validation, 3 Epic Scoring, 4 Input-Output Coverage). Only Mode 1 is actively dispatched (by implement, validate). Modes 2/3/4 have no callers in core/ or docs/.
- `core/components/plays/enhance/reference/intent.yaml` + compiled SKILL.md — Step 10 dispatches judge with `approach + project_root`, matching no declared mode. Judge free-forms.
- `core/components/plays/implement/SKILL.md` L577–604 — passes `eval_path + manifest_path + project_root + config.instructions + config.decryption_key`.
- `core/components/plays/validate/SKILL.md` L365–392 — passes `eval_path + deploy_url + credentials + config.instructions`.

## Agreed redesign
Judge becomes single-operation generic eval executor. Contract superset accepts today's implement/validate shapes unchanged. Enhance gains a new static eval file and passes it to judge. Mode 4 extracts to a new `diff-artifacts` skill (non-user-invocable). Modes 2/3 deleted (no callers).

## #305 bad-judgment examples (to encode as rules)
- C-01: /design Step 9 passed `design_system_path`; compile-design-spec skill Input didn't declare it. → contract mismatch at delivered handoff.
- C-01b: draft-design-system wrote design-system.md; compile-design-spec had no hook to read it. → intent-propagation break.
- C-02: designer.md NEVER list said "never add visual design"; revised C13 permits the DS. → stale boundary contradicting new rule.
All three were labeled follow-up, overall 0.74 — above the C15 0.6 gate. Should have been blockers, overall ≤0.55.

## Conventions
- Edit intent.yaml, rebuild via `/create-play --rebuild enhance` — never hand-edit SKILL.md.
- Non-user-invocable skills do not require `reference/intent.yaml`.
- Static eval files live in play's `reference/evals/` directory.
