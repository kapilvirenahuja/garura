# Coverage Matrix — fix-it SKILL.md (intent v1.2.0)

Maps every constraint (C*), failure condition (F*), and scenario (S*) from `core/components/plays/fix-it/reference/intent.yaml` to its coverage location in the compiled `core/components/plays/fix-it/SKILL.md`.

## Constraints

| ID | Category | Coverage Location |
|----|----------|-------------------|
| C1 | pre-flight | Pre-flight table rows "Issue number resolvable" + "Issue exists and is open"; bash block extracts `issue` and halts if unresolvable |
| C2 | pre-flight | Pre-flight table row "Current branch guard"; Step 2 creates `fix/{issue}-{slug}` via repo-orchestrator |
| C3 | artifact-verifiable | SE-2 at Step 3 |
| C4 | artifact-verifiable | SE-3 at Step 3 |
| C6 | structural | Step 5 labeled "This checkpoint is never skippable (C6)" and "ONLY approval gate in the play (C6)" |
| C7 | structural | Step 7 "Approval override (C7, C9)" — no further approval gates after Step 5 |
| C8 | artifact-verifiable | SE-9 at Step 6 |
| C9 | structural | Step 7 invokes ship with `approval_override: "auto-proceed"` (C9) |
| C10 | structural | Role section — "Forbidden: Direct git/gh/codebase-analysis" (C10); agent boundary table |
| C11 | artifact-verifiable | SE-4 at Step 3; ltm_context block in Step 3 contract |
| C12 | artifact-verifiable | SE-5 at Step 4 |
| C13 | artifact-verifiable | SE-7 at Step 5 |
| C14 | artifact-verifiable | SE-10 at Step 3; Step 3 "Play post-verify (C14)" paragraph |
| C15 | structural | Step 6b exists as a distinct step owned by quality-auditor; Step 6 contract note forbids builder self-verification |
| C16 | artifact-verifiable | SE-11 at Step 6b |
| C17 | artifact-verifiable | SE-12 at Step 6; Step 6 contract `read_only_files` note |
| C18 | artifact-verifiable | SE-13 at Step 3; Pause/Resume `task_list` schema + ownership paragraph |
| C19 | structural | "Phase: Execution — Implement and Verify (retry loop, cap=2 per C19)" wrapper; Step 6b Retry semantics block; warn-and-continue policy |

## Failure Conditions

| ID | Coverage Location |
|----|-------------------|
| F1 | SE-6 at Step 5 |
| F2 | SE-2 at Step 3 |
| F3 | SE-3 at Step 3 |
| F5 | SE-1 at Step 1; Pre-flight "Issue exists and is open" row |
| F6 | SE-8 at Step 6 |
| F7 | SE-9 at Step 6 |
| F8 | SE-4 at Step 3 |
| F9 | SE-5 at Step 4 |
| F10 | SE-7 at Step 5 |
| F4 (intent retains in scenario_evals? No — intent v1.2.0 lists F1-F3, F5-F10; F4 intentionally absent) — covered by SE-14 at Step 7 against the ship delivery-record contract (partial-ship guard) | SE-14 at Step 7 |

Note: intent v1.2.0 `failure_conditions` enumerates F1, F2, F3, F5, F6, F7, F8, F9, F10. F4 appears in evals.yaml (SE-14) to guard partial ship — retained because ship composition still requires the guard even though F4 is not in the intent FC list. All intent FCs (F1-F3, F5-F10) have explicit SE coverage above.

## Scenarios

| ID | Persona | Coverage Location |
|----|---------|-------------------|
| S1 | Developer | SCE-1 at Step 8 |
| S2 | Tech Lead | SCE-2 at Step 8 |
| S3 | QA Engineer | SCE-3 at Step 8 |
| S4 | QA Engineer reviewing audit trail | SCE-4 at Step 8 |

## Structural Elements

| Element | Location |
|---------|----------|
| Agent boundary table (4 domain + 2 utility) | Role section |
| Task DAG (T1..T10) | Task DAG section |
| Single checkpoint | Step 5 |
| Retry loop around implement+verify | Phase header + Step 6b Retry semantics |
| Play-owned task_list | Pause and Resume section + Step 3 initialization note |
| Compilation Metadata | Final section (intent_hash, compiled_at, 14 step_evals, 4 scenario_evals, evals_source, constraint_classifications) |

## Summary

- All 18 intent constraints (C1-C4, C6-C19) covered.
- All 9 intent failure conditions (F1-F3, F5-F10) covered via SE mapping.
- All 4 scenarios (S1-S4) covered via SCE-1..SCE-4.
- 14 step evals placed at their bound steps per evals.yaml `step` field.
- 4 scenario evals copied verbatim from evals.yaml.
