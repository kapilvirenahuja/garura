# Coverage Matrix — implement play (rebake for #257)

**Intent hash (new):** `3d0fa5ab34299d8c2ab6c3557e46d6d026ece4cef97bd3d020ed9e35a77f13b8`
**Compiled at:** 2026-04-20
**SKILL.md size before:** 40,062 bytes
**SKILL.md size after:** 50,622 bytes
**Intent totals:** 33 constraints, 26 failure conditions, 13 scenarios

## Constraints

| ID | Classification | Covering element | Notes |
|----|---------------|-------------------|-------|
| C1 | pre-flight | Pre-flight gate + SE-1 | milestone status LOCKED |
| C2 | pre-flight | Pre-flight gate + SE-3 | scenarios + FCs defined |
| C3 | pre-flight | Pre-flight gate + SE-2 | depends_on COMPLETE |
| C4 | artifact-verifiable | SE-8 | evals-engineer scope |
| C5 | artifact-verifiable | SE-10, SE-19 (reworded) | content-vs-path |
| C6 | artifact-verifiable | SE-16 | judge input isolation |
| C7 | artifact-verifiable | SE-8 | encryption at rest |
| C8 | artifact-verifiable | SE-8 | eval storage outside repo |
| C9 | structural | Step 12 (fresh evals) + SE-21 | fresh instance enforced by workflow |
| C10 | artifact-verifiable | SE-18, SE-19 | remediation is spec-referenced |
| C11 | structural | Step 13 + SE-21 | max 3 iterations |
| C12 | pre-flight | Pre-flight + SE-15 | build passes |
| C13 | artifact-verifiable | SE-4 | CONTEXT.md contents |
| C14 | artifact-verifiable | SE-14 | quality-auditor isolation |
| C15 | pre-flight | Pre-flight + SE-5 | quality-gates.yaml in STM |
| C16 | structural | Per-scope-item workflow + SE-9 | cycle ordering |
| C17 | artifact-verifiable | SE-6, SE-9 | test-writer / TEST-CONTEXT.md |
| C18 | artifact-verifiable | SE-11 | status report contents |
| C19 | artifact-verifiable | SE-5, SE-14 | QP translation |
| C20 | structural | Gate logic in SKILL.md + SE-14 | PASS+CERTIFIED before judge |
| C21 | artifact-verifiable | SE-18 | remediation both sources |
| C22 | artifact-verifiable | SE-20 | eval count audit |
| C23 | pre-flight | Pre-flight (stm_dir resolution) | STM path base |
| C24 | artifact-verifiable | SE-7 | mock infra |
| C25 | structural | Step 6f + SE-13 | integration test pass |
| C26 | artifact-verifiable | SE-14 | qp_certification present |
| C27 | artifact-verifiable | SE-4, SE-5 | zero KB/LTM refs |
| C28 | pre-flight | Pre-flight + SE-1 | milestone_id argument |
| C29 | artifact-verifiable | SE-10, SE-19 (reworded) | content-vs-path pre-invocation check |
| C30 | structural | Step 6e + SE-12 | arbiter preconditions |
| C31 | structural | Agent boundary table + SCE-9 | SPEC-derived independence |
| C32 | structural | Agent boundary table + SCE-4 | inter-agent channel shape |
| C33 | artifact-verifiable | SE-22 (NEW) on Steps 6a/6b/6d/10/10b | four labeled sections |

## Failure conditions

| ID | Covering SE/Scenario | Notes |
|----|----------------------|-------|
| F1 | SE-15, SE-14 | build/typecheck fail |
| F2 | SE-17 | judge first-run <= 50% |
| F3 | SE-21 | 3 iterations exhausted |
| F4 | SE-8 | plaintext on disk |
| F5 | SE-10, SE-19 (reworded) | prohibited builder content |
| F6 | SE-16 | judge sees builder/evals-engineer prompts |
| F7 | SE-8 | evals-engineer sees impl code |
| F8 | SE-1 | milestone not LOCKED |
| F9 | SE-3 | missing exit gate or scenarios |
| F10 | SE-21 | old evals reused |
| F11 | SE-15 (build/test fail coverage) + SCE-7 | unit tests absent — surfaced by judge coverage check (SCE-7) and quality-auditor (SE-15) |
| F12 | SE-14 | lint violations — quality-auditor report |
| F13 | SE-14 | QP thresholds not met — qp_certification BLOCKED |
| F14 | SE-6, SE-9 | test-writer / TEST-CONTEXT.md violations |
| F15 | SE-11 | status report contamination |
| F16 | SE-14 (qp_certification threshold check) | null thresholds at QP>=2 — caught by qp_certification dimension check |
| F17 | SE-14 | judge ran while FAIL |
| F18 | SE-18 | remediation omitted source |
| F19 | SE-20 | eval count decreased w/o rationale |
| F20 | SE-7 | mock setup failed |
| F21 | SE-13 | integration test failed |
| F22 | SE-14 | qp_certification missing when vision exists |
| F23 | SE-4, SE-5 | KB/LTM path in agent contract — checked via CONTEXT.md/quality-gates path scans |
| F24 | SE-2 | depends_on not COMPLETE |
| F25 | SE-12 | arbiter invoked after 1 failure |
| F26 | SE-23 (NEW) | missing/unlabeled section in dispatch |

## Scenarios

| ID | Covering SCE |
|----|--------------|
| S1 | SCE-1 |
| S2 | SCE-2 |
| S3 | SCE-3 |
| S4 | SCE-4 |
| S5 | SCE-5 |
| S6 | SCE-6 |
| S7 | SCE-7 |
| S8 | SCE-8 |
| S9 | SCE-9 |
| S10 | SCE-10 |
| S11 | SCE-11 |
| S12 | SCE-12 |
| S13 | SCE-13 |

## Gaps

None. Every artifact-verifiable constraint, every failure condition, and every scenario has at least one covering element. F11/F12/F13/F16/F22/F23 are covered indirectly via SE-14/SE-15/SE-4/SE-5/SCE-7 as noted above — no new SEs required because the underlying artifact checks already surface them; no additional coverage added to avoid eval bloat per evals-creator constraint "NEVER create evals that require subjective judgment".

## Summary

- **SKILL.md recompiled** — 40,062 → 50,622 bytes (+10,560 bytes; +26%). The growth is entirely in the four-section dispatch blocks (Steps 6a, 6b, 6d, 10, 10b), the new dispatch-prompt contract section, the C5/C29 content-vs-path language, and the two new SE entries.
- **intent_hash** — old placeholder `{sha256 of reference/intent.yaml}` (never filled) → new `3d0fa5ab34299d8c2ab6c3557e46d6d026ece4cef97bd3d020ed9e35a77f13b8`.
- **Evals regenerated** — 23 step evals (SE-1 through SE-23) + 13 scenario evals (SCE-1 through SCE-13). New SEs: SE-22 (C33, four-section dispatch) and SE-23 (F26, halt on missing/unlabeled section). Reworded SEs: SE-10 and SE-19 now prohibit test source / assertion text / mock data patterns / eval IDs / eval text / pass criteria / raw judge content, while permitting bare scope-directory paths in Verification Steps.
- **Coverage:** 33/33 constraints, 26/26 failure conditions, 13/13 scenarios — all covered.
- **Gaps for user attention:** none.
