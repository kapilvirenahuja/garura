# Structural & Behavioral Verification: /ship L2 Recipe
<!-- T9 evidence | 2026-03-03 -->

## Summary

| Gate | Check | Status |
|------|-------|--------|
| G-001 | Directory structure | **PASS** |
| G-002 | SKILL.md frontmatter | **PASS** |
| G-003 | Level L2 declaration | **PASS** |
| G-004 | intent.yaml completeness | **PASS** |
| G-005 | Intent load directive | **PASS** |
| G-006 | Agent limit | **PASS** |
| G-007 | Inline guardian | **PASS** |
| G-008 | L1 invocations | **PASS** |
| G-009 | Skip-logic | **PASS** |
| G-010 | Self-resolution scope | **PASS** |
| G-011 | Evidence path | **PASS** |
| G-016 | Recovery section | **PASS** |
| G-017 | Forbidden tools | **PASS** |
| G-018 | Orchestrator-owned steps | **PASS** |
| G-019 | NWWI enforcement | **PASS** |
| G-020 | commit-code modification | **PASS** |
| G-021 | create-pr modification | **PASS** |
| G-022 | repo-orchestrator scope | **PASS** |

**Result: 18/18 gates PASS. No mandatory failures.**

## Detail

- G-001: All 5 required files present in `core/components/recipes/ship/`
- G-002: Frontmatter lines 1-6 — name, user-invocable, model, allowed-tools all correct
- G-003: Version table lines 265-267 — Level L2, Distinct Agents 2
- G-004: intent.yaml — 3 pre_flight (C1-C3), 8 behavioral (C4-C11), 7 failure_conditions (F1-F7)
- G-005: Intent load directive line 15 — references reference/intent.yaml; no inline duplication
- G-006: 1 direct agent (repo-orchestrator); commit-code/create-pr are L1 Skill tool calls
- G-007: No `workflow-guardian` reference; decision matrix at lines 195-206
- G-008: Step 1 lines 92-101 commit-code + ship_context; Step 2 lines 109-118 create-pr + ship_context
- G-009: Step 1 skip line 90; Step 2 skip line 107; both-skip handled implicitly
- G-010: Self-resolution table lines 231-240; CANNOT column present; max attempts 0-2
- G-011: Step 6 line 185 — `.meridian/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md`
- G-016: Recovery section lines 242-248; pre-flight hard halt; references intent-driven-recovery.md; max 2 retries
- G-017: Role section line 21 — Bash, Grep, Glob, Edit, EnterPlanMode, ExitPlanMode, git/gh forbidden
- G-018: Step 6 line 182 — "Orchestrator owns this step entirely. Do not delegate."
- G-019: C3 intent.yaml line 12; {issue} used at lines 86, 142, 185, 210, 255
- G-020: commit-code Step 3 lines 122-124 — ship_context.auto_approve FIRST; AUTO_APPROVED status; audit trail preserved
- G-021: create-pr Step 2 lines 110-112 — quality conditions before C5; blockers override auto-approve
- G-022: repo-orchestrator lines 279-280 — both named write exceptions with Used By and Rationale
