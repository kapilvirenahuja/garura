# Enhance Play — Analysis (Rebake)

Rebake of `core/components/plays/enhance/SKILL.md` against updated `reference/intent.yaml`.

## Delta since last compilation

| Item | Change |
|------|--------|
| intent_hash compiled | `8385c967…` |
| intent_hash current  | `f06ee871…` |
| Drift | YES |

Intent added `C21` (judge dispatch must pass `eval_path` to `core/components/plays/enhance/reference/evals/solution-rating.yaml` and `config.instructions` with a specific ask). A new bundled eval file `reference/evals/solution-rating.yaml` was authored with ER-1…ER-4. The `judge` agent was upgraded to accept `eval_path`, `config.instructions`, `config.decryption_key`, and can dispatch `diff-artifacts`. A new skill `diff-artifacts` was added.

## Agents declared by play

| Agent | Role | Phase | Definition exists |
|-------|------|-------|-------------------|
| project-orchestrator | issue validation | Pre-flight | yes |
| tech-designer        | context + approach | Preparation | yes |
| code-builder         | implementation | Execution | yes |
| judge                | solution rating (per ER-* evals) | Execution | yes (updated) |
| quality-auditor      | quality gates | Execution | yes |
| repo-orchestrator    | branch/commit/PR/ship/evidence | Pre-flight, Finalize, Evidence | yes |

## Skills referenced by play steps

| Step | Agent | Skill invoked | Exists |
|------|-------|---------------|--------|
| 1 | project-orchestrator | manage-issue (action: read) | yes |
| 2 | repo-orchestrator | setup-branch | yes |
| 4 | tech-designer | context assembly (inline; no discrete skill) | n/a |
| 6 | tech-designer | draft-technical-approach or inline | verify |
| 8 | code-builder | implement | yes |
| 10 | judge | evals via eval_path; may dispatch diff-artifacts | yes |
| 11 | quality-auditor | quality-check | yes |
| 12 | repo-orchestrator | commit-code + create-pr (or submit-pr) | yes |
| 13 | repo-orchestrator | analyze-pr | yes |
| 15 | repo-orchestrator | merge-pr | yes |

## Gap Analysis (G1–G11)

| Check | Status | Detail |
|-------|--------|--------|
| G1 Constraint Coverage | GAP | C21 not covered by any SE-*; SE-12 text directly contradicts C21 ("contract does not include any eval file paths"). Classify: C21 → artifact-verifiable (contract-shape check). |
| G2 FC Coverage | PASS | F1–F11 all covered. F11 → SE-17. |
| G3 Scenario Coverage | PASS | S1–S8 covered by SCE-1…SCE-8. Preserve IDs. |
| G4 Skill Existence | PASS | diff-artifacts present; others present. |
| G5 Agent Existence | PASS | All 6 present. |
| G6 Skill-Agent Alignment | PASS | judge now declares diff-artifacts in its skill inventory. |
| G7 Contract Schema | GAP | Step 10 contract missing `eval_path`, `config.instructions` (now mandated by C21). |
| G8 Template References | PASS | solution-rating.yaml exists at referenced path. |
| G9 Intent Hash Drift | GAP | Hash mismatch (see above). |
| G10 Required Sections | GAP | No explicit `## Task DAG` section with TaskCreate calls. Pause/Resume embeds task list but there is no TaskCreate dispatch section. |
| G11 Skill LTM Input Coverage | GAP | Step 10 play text does not instruct orchestrator to pass `eval_path` + `config.instructions` fields (only generic contract shown). Recompile must embed explicit C21 instruction. |

## Recompilation requirements

1. Replace SE-12 with a new eval aligned to C21: verifies the judge dispatch contract contains `eval_path` pointing to `core/components/plays/enhance/reference/evals/solution-rating.yaml` AND `config.instructions` matching the C21 ask. Preserve the context-isolation portion (no self-eval paths, no builder prompts) as a separate check or combined check.
2. Update Step 10 JSON contract to include `eval_path` and `config.instructions` per C21.
3. Add explicit `## Task DAG` section with TaskCreate calls for every step, blockedBy encoding dependency order; add `TaskUpdate [Tn]` lines in each step.
4. Recompute intent_hash in Compilation Metadata.
5. Keep SCE IDs stable where possible; emit updated eval count (+1 if a new SE covers C21).
6. Constraint classification:
   - pre-flight: C1, C2, C5
   - structural: C9 (flag), C10, C11 (isolation rule), C12 (budget), C17 (always), C18 (autonomous ship), C20 (auto-triggered gate), C21 (dispatch-shape enforced via contract + eval)
   - artifact-verifiable: C3, C4, C6, C7, C8, C13, C14, C15, C16, C19, C21
   Note: C21 sits across structural (contract schema rule) and artifact-verifiable (contract file verifiable post-dispatch). Category = artifact-verifiable so evals-creator emits a new SE-*.
