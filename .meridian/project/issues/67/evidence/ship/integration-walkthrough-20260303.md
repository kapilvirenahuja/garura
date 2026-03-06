# Integration Walkthrough Verification: /ship L2 Recipe
<!-- T13 evidence | 2026-03-03 -->

## Summary

| TP | Name | Status |
|----|------|--------|
| T1 | Pre-flight constraint IDs match | **PASS** |
| T2 | ship_context structure matches L1 checks | **PASS** |
| T3 | analyze-pr output contract alignment | **FAIL** |
| T4 | Step 4 merge command matches named exception | **PASS** |
| T5 | Step 5 checkout command matches named exception | **PASS** |
| T6 | Evidence path matches STM structure | **PASS** |
| T7 | Skip-logic scenarios trace correctly | **PASS** |
| T8 | Guardian halt presentation complete | **PASS** |

**Result: 7/8 PASS. 1 FAIL → T15 created to resolve.**

## T3 Failure Detail

**Contract Mismatch:** repo-orchestrator's analyze-pr returns structured checklist items; ship Step 3 task specification expects pre-computed scalar fields.

| Field | Defined in repo-orchestrator | Expected by ship Step 3 |
|-------|------------------------------|-------------------------|
| Success flag | `ready: true/false` | `merge_ready: boolean` |
| Blocking item count | `checklist.must_have[].status` (enumerated) | `must_have_fail: integer` |
| Summary | `checklist.must_have[]` detailed list | `checklist_summary: {counts}` |

**Fix:** Update ship SKILL.md Step 3 task specification to align with the analyze-pr output contract. Ship orchestrator should:
- Use `analysis.ready` (not `merge_ready`) to determine overall readiness
- Count `must_have_fail` by filtering `checklist.must_have[]` for `status == FAIL`
- Evaluate guardian condition using `checklist.must_have` list, not a pre-computed scalar
