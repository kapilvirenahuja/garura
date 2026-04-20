# Play Analysis — implement (rebake for #257)

**Source of truth:** `core/components/plays/implement/reference/intent.yaml`
**Intent hash (new):** `3d0fa5ab34299d8c2ab6c3557e46d6d026ece4cef97bd3d020ed9e35a77f13b8`
**Old intent_hash placeholder in SKILL.md:** `{sha256 of reference/intent.yaml}` — was never filled in prior bake
**Compiled at (old):** 2026-04-15
**Compiled at (new):** 2026-04-20

## What changed in this rebake

Intent deltas driving this recompile (per #257):

- **C33 (NEW):** Every dispatch to code-builder (Steps 6b, 6d, 10) and test-writer (Steps 6a, 10b) MUST include four labeled sections: Description, Preconditions, Expected Behavior, Verification Steps. Any section missing or unlabeled triggers F26.
- **F26 (NEW):** Failure condition mirroring C33 — partial or unstructured builder/test-writer dispatches.
- **C5 (REFINED):** Carves out a narrow exception — Verification Steps MAY include a bare scope-directory path (e.g., `tests/unit/{scope_item}/`) as a procedural run directive. Test source content, assertion text, and eval content are still forbidden.
- **C29 (REFINED):** Pre-invocation check is now content-vs-path aware. It rejects test source code / assertion text / mock data patterns / eval IDs / eval text / pass criteria. It does NOT reject a bare scope-directory path in Verification Steps.
- **F5 (REFINED):** Same carve-out on the failure side — "A bare test scope-directory path in the Verification Steps section is NOT a violation; the pre-invocation check must distinguish content-bearing paths from procedural run directives."

## Agent boundary (unchanged — no agents added or removed)

| Agent | Role | Phases |
|-------|------|--------|
| `tech-designer` | Build CONTEXT.md | Step 1 |
| `evals-engineer` | Generate encrypted unit-test coverage evals | Step 4, Step 12 |
| `code-builder` (test-writer sub-role) | Author behavioral tests | Step 6a, 10b |
| `code-builder` | Implement contracts | Step 6b, 6d, 10 |
| `judge` (EVAL-REVIEW) | Developer self-review | Step 8, 13 |
| `judge` (ARBITER) | Fault attribution when same contract fails twice | Step 6e |
| `quality-auditor` | Quality + QP certification | Step 7, 11 |
| `repo-orchestrator` | Evidence self-commit | Step 17 |

## Skills referenced (by step contracts)

Steps in this play do not directly invoke skills — every contract is JSON-to-agent. Skills are consumed by the agents themselves (`generate-encrypted-evals`, etc.). Rebake confirms no new skill references are required; C33 concerns dispatch-prompt structure, not skill invocation.

## Step → constraint/failure coverage map (pre-rebake)

| Step | Covers |
|------|--------|
| Pre-flight | C1, C2, C3, C12, C15, C23, C28, F8, F9, F24 |
| Step 1 CONTEXT.md | C13, C27 |
| Step 3 quality gates | C15, C19, C27 |
| Step 3b TEST-CONTEXT | C17, F14 |
| Step 3c mocks | C24, F20 |
| Step 4 evals-engineer | C4, C7, C8, F4, F7 |
| Step 6a test-writer | C16, C17, F14 |
| Step 6b code-builder | C5, C29, F5 |
| Step 6c status report | C18, F15 |
| Step 6d fix loop | C5, C10, C29 |
| Step 6e arbiter | C30, F25 |
| Step 6f integration | C25, F21 |
| Step 7 quality-auditor | C14, C20, C26, F1, F12, F13, F17, F22 |
| Step 8 judge EVAL-REVIEW | C6, F6, F2 |
| Step 9 remediation | C21, F18 |
| Step 10 builder fix | C5, C10, C29, F5 |
| Step 12b audit | C22, F19 |
| Step 13 fresh judge | C9, C11, F3, F10 |

## New coverage targets for this rebake

- **C33:** covered by new SE-C33 on Steps 6a, 6b, 6d, 10, 10b (any builder/test-writer dispatch). The check is structural on dispatch prompt text: four labeled sections present and ordered.
- **F26:** covered by new SE-F26 on the same steps — halt if any section missing or unlabeled.
- **C5/C29/F5 refinement:** SE-10, SE-19 reworded to reflect content-vs-path distinction. Bare scope-directory path in Verification Steps is permitted.

## Workflow update points (Step 6c)

Every builder and test-writer JSON contract's `config.instructions` block must be restructured to include the four labeled sections inline within the instructions array — explicitly labeled "Description:", "Preconditions:", "Expected Behavior:", "Verification Steps:" so the recipient (and SE-C33) can verify the sections are present and ordered.

The Verification Steps block is procedural only: scope-directory path + exit criterion (all tests PASS) + red-path action (abort and enter fix loop). It carries WHERE/HOW, not test content.
