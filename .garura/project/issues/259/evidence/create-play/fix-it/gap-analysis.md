# Gap Analysis — fix-it play (rebuild against intent v1.2.0)

## Inputs

- New intent: `core/components/plays/fix-it/reference/intent.yaml` (v1.2.0, SHA-256 `9c6df454426df9770fd1d82ac9cde2848f7ae8d61066a34832e69b83832ad89e`)
- Current artifact: `core/components/plays/fix-it/SKILL.md` (compiled from intent v1.1.0, intent_hash `2fe89d69…`)

## Gap Checks

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | GAP | C5 present in SKILL.md (SE-4, risks). Must be removed. C14-C19 absent from SKILL.md — must be added as artifact-verifiable / structural coverage. |
| G2 FC Coverage | GAP | F4 (risks SE-4) present in current SKILL.md; it was removed from intent v1.2.0 (intent now has F1–F3, F5–F10, no F4). Old SE-4 must be removed. |
| G3 Scenario Coverage | GAP | S2 "then" no longer mentions risk table — Step 5 checkpoint template must drop the `### Risk Assessment` section; SCE-2 must drop the risk-row clause. |
| G4 Skill Existence | PASS | `manage-issue` and `setup-branch` exist at `core/components/skills/`. `ship` is a play at `core/components/plays/ship/`, invoked via Skill tool — unchanged. |
| G5 Agent Existence | PASS | project-orchestrator, tech-designer, code-builder, quality-auditor, repo-orchestrator all exist in `core/components/agents/`. |
| G6 Skill-Agent Alignment | OBSERVATION | quality-auditor contract (see `core/components/agents/quality-auditor.md`) currently declares `quality_gates_path` + `project_root` as inputs. The new Step 6b delivers `regression_test_path` + `source_files` + `project_root` and expects a `regression_test_verdict` output. Flagged — quality-auditor's declared skill inventory does not cover executing a regression-test YAML spec. Per rebake instructions: flag only, do not modify agent. The Step 6b contract still fits the agent's tool palette (Bash/Read/Grep/Glob) and its quality-gate role — it can execute grep/yq/shasum assertions mechanically, and the play documents this usage. |
| G7 Contract Schema | GAP | Step 3 missing `stm.output.regression_test_path`. Step 6 missing `read_only_files`. New Step 6b does not exist. |
| G8 Template References | PASS | Only `issue-comment-rca-approved.md` referenced — unchanged. |
| G9 Intent Hash Drift | GAP | Hash `2fe89d69…` in current SKILL.md ≠ current `9c6df454…`. Will be re-embedded. |
| G10 Required Sections | GAP | Status/fix-it.json schema in Pause/Resume section missing `task_list` array per C18. Agent-boundary table lists 3 domain agents; must list 4 (add quality-auditor). Checkpoint template in Step 5 must drop Risk Assessment block. Compilation Metadata needs new values (4 domain agents, updated eval counts, new evals_source path for issue 259). |
| G11 Skill LTM Input Coverage | PASS | tech-designer ltm_context block retained; no new skill LTM inputs introduced. |

**Summary:** 11 checks — 4 PASS, 1 OBSERVATION (flagged-only), 6 GAP. All GAPs are addressed by the rebuild plan below.

## Rebuild Plan (addresses GAPs)

1. Remove SE-4 (risks) and all C5/F4 references; drop `### Risk Assessment` from Step 5 inline checkpoint; drop risks row from SCE-2.
2. Add `stm.output.regression_test_path` to Step 3 contract; note tech-designer authors failing regression-test artifact (C14).
3. Add a Task DAG section (missing in current SKILL.md) — required by compiled-example + create-play rules.
4. Insert new Step 6b (verify-fix) between implement-fix and ship; quality-auditor owner, contract carries `regression_test_path`, `source_files`, `project_root`; writes `regression_test_verdict`.
5. Add `read_only_files: [regression_test_path]` to Step 6 contract (C17). The contract MUST NOT carry test content.
6. Add retry loop (cap=2 per C19) around Step 6 + Step 6b. On verification failure after retry exhaustion, invoke tech-designer re-plan. Warn-and-continue only when re-plan grows task_list beyond 6 or inserts more than 3 new tasks.
7. Extend status/fix-it.json schema in Pause/Resume with a `task_list` array (id, description, status, retry_count, regression_test_path) — play is sole writer (C18).
8. Agent boundary table: 4 domain agents (add quality-auditor).
9. Update Compilation Metadata: new intent_hash, domain_agents=4, eval counts from evals-creator, evals_source path = `.garura/project/issues/259/evidence/create-play/fix-it/evals.yaml`.
