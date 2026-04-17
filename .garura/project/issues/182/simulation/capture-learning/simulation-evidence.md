# Simulation Evidence — capture-learning for Issue #182

**Date:** 2026-03-31
**Mode:** Simulation (non-revertable actions skipped)
**Issue:** 182 (LTM Resolution Protocol)

## Steps Executed

| Step | Action | Status | Notes |
|------|--------|--------|-------|
| Pre-flight | Resolve config, check STM exists | PASS | stm_base=.meridian/project/issues/, issue=182 |
| Step 1 — Verify Issue Closed | Mock issue state | SIMULATED | Issue is OPEN — simulated as CLOSED |
| Step 2 — Archive STM | Move directory | **SKIPPED** | Non-revertable (directory move) |
| Step 3 — Locate Traces | Find resolution-trace.yaml | PASS | Found 1 trace at evidence/prepare-implementation/resolution-trace.yaml |
| Step 4 — Extract Candidates | knowledge-extractor EXTRACT | PASS | 13 LLM fallbacks → 4 synthesized patterns |
| Step 5 — Human Review | Present candidates | EXECUTED | 4 candidates presented for review |
| Step 6 — Write to LTM | knowledge-extractor WRITE | **SKIPPED** | Non-revertable (LTM mutation) |
| Step 7 — Scenario Evals | Validation checks | PARTIAL | See below |
| Step 8 — Write Evidence | This file | EXECUTED | Written to simulation/ folder |
| Step 9 — Self-Commit | Git commit | **SKIPPED** | Non-revertable (git commit) |

## Extraction Summary

- Traces scanned: 1
- Total entries: 15 (13 llm, 2 core)
- LLM fallbacks extracted: 13
- Synthesized into: 4 patterns (within C13 target of 3-5)
- Near-duplicates: 1 (KC-001 vs resolution-protocol.md)
- Unique: 3 (KC-002, KC-003, KC-004)

## Step Eval Results (Simulation)

| Eval | Status | Notes |
|------|--------|-------|
| SE-5 (F5) | SIMULATED | Issue state mocked as CLOSED |
| SE-1 (F1/C2) | SKIPPED | Archive not performed |
| SE-2 (F2/C3) | SKIPPED | Archive not performed |
| SE-3 (F3/C4) | SKIPPED | Archive not performed |
| SE-4 (F4) | SKIPPED | Archive not performed |
| SE-7 (F7/C6) | PASS | All candidates have dedup_status set; KC-001 near-duplicate with conflict path |
| SE-10 (F10/C10) | PASS | All candidates have proposed_scope and proposed_scope_rationale |
| SE-11 (F11/C13) | PASS | 4 synthesized patterns (not individual records); each has When to Choose structure; ≤7 total |
| SE-12 (C15) | N/A | Non-zero candidates — zero-candidate path not triggered |
| SE-6 (F6) | SKIPPED | Write phase not executed |
| SE-8 (F8/C7) | SKIPPED | Write phase not executed |
| SE-9 (F9/C14) | SKIPPED | Write phase not executed |

## Scenario Eval Results (Simulation)

| Eval | Status | Notes |
|------|--------|-------|
| SCE-1 (S1) | SKIPPED | Archive not performed |
| SCE-2 (S2) | SKIPPED | Archive not performed |
| SCE-3 (S3) | PASS | Candidates staged with classification and reasoning |
| SCE-4 (S4) | PASS | KC-001 detected as near-duplicate with conflict path to resolution-protocol.md |
| SCE-5 (S5) | N/A | Non-zero candidates — zero-candidate scenario not triggered |
| SCE-6 (S6) | SKIPPED | Write phase not executed |

## Simulation Artifacts

- `simulation/capture-learning/issue-state.yaml` — Mocked issue state
- `simulation/capture-learning/candidates.yaml` — Extracted knowledge candidates
- `simulation/capture-learning/simulation-evidence.md` — This file
