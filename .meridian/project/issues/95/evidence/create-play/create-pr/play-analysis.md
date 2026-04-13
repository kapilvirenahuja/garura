# Play Analysis: create-pr

## Current State

- **Workflow:** Structure A (readiness-brief-generation)
- **Agents:** repo-orchestrator (Stages 2, 3, 5), project-orchestrator (Stage 2)
- **Skills:** analyze-pr, submit-pr, manage-issue
- **Intent:** 7 constraints (C1-C7), 5 failure conditions (F1-F5), 2 scenarios (S1-S2)
- **Maturity:** Partial L2 — has intent.yaml, agent delegation, evals, but not compiled

## Semantic Map

```
create-pr play
├── Stage 0: Pre-flight (play)
│   ├── Branch guard (implicit)
│   ├── Clean working tree (C3)
│   ├── Branch pushed (C3)
│   ├── Platform config (C1)
│   ├── Platform reference file (C1)
│   ├── Open issues exist (F1)
│   └── Commits ahead of base (implicit)
├── Stage 1: Intent Resolution (intent-resolver) ← L4 ARTIFACT, REMOVE
│   └── DAG generation + cache check
├── Stage 2: Readiness (repo-orchestrator + project-orchestrator)
│   ├── repo-orchestrator → analyze-pr skill
│   │   ├── Diff analysis
│   │   ├── Quality checklist generation
│   │   └── Evidence gathering
│   └── project-orchestrator → manage-issue skill
│       └── Issue linkage resolution
├── Stage 3: Human-Readable Brief (repo-orchestrator, skippable)
│   └── Brief from STM artifacts
├── Stage 4: Human Checkpoint (play, skippable)
│   └── Tether/Vanish
├── Stage 5: Generation (repo-orchestrator)
│   └── submit-pr skill → push branch + create PR
├── Stage 6: Scenario Validation (play)
│   ├── scenario-1 (S1): Code reviewer assessment
│   └── scenario-2 (S2): Author verification
└── Stage 7: Evidence & Close (play)
    └── Write evidence + self-commit (ADR 012)
```

## Gaps vs L2 Compiled Standard

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | **Runtime intent-resolver (Stage 1)** — L4 artifact. ADR 013 says intent-resolver is build-time only at L2. | Critical | Remove Stage 1 entirely. Bake task ordering into SKILL.md. |
| 2 | **DAG caching infrastructure** — `.meridian/cache/intent-resolution/create-pr.json` is L4 infrastructure. | Critical | Remove DAG caching. No cache layer at L2. |
| 3 | **DAG-based resumption** — Uses `{stm_base}/{issue}/dag/create-pr.json` for resume. | Critical | Switch to status file model: `{stm_base}/{issue}/status/create-pr.json` |
| 4 | **Numbered stages (0-7)** — Abstract stage numbers instead of named phases with steps. | Structural | Convert to named phases: Pre-flight, Preparation, Checkpoint, Execution, Scenario Validation, Evidence & Close |
| 5 | **Eval naming** — Uses `readiness-eval-*` and `gen-eval-*` instead of SE-*/SCE-*. | Naming | Rename to SE-1 through SE-n (step evals) and SCE-1 through SCE-n (scenario evals) |
| 6 | **Missing Compiled From section** | Required | Add "## Compiled From" with artifact notice |
| 7 | **Missing Compilation Metadata** | Required | Add intent_hash, compiled_by, compiled_at, maturity, workflow_structure |
| 8 | **Incomplete agent contracts** — Contracts don't follow agent-contract.md universal schema. | Structural | Add full JSON contracts with intent_path, stm_base, stm.input, stm.output, task_id |
| 9 | **No explicit STM path wiring** — Steps don't show data flow via STM paths. | Structural | Wire stm.output from each step as stm.input to dependent steps |

## Intent Coverage Assessment

### Constraints → Pre-flight/Step Eval Coverage

| Constraint | Pre-flight | Step Eval | Coverage |
|-----------|------------|-----------|----------|
| C1 (platform from config) | Platform config check, platform reference check | readiness-eval-5, gen-eval-1 | ✅ Full |
| C2 (read-only play) | — | readiness-eval-6 | ✅ Covered by eval |
| C3 (all committed and pushed) | Clean tree check, push check | — | ✅ Covered by pre-flight |
| C4 (change-specific checklist) | — | readiness-eval-3, gen-eval-3 | ✅ Full |
| C5 (evidence-backed checklist) | — | readiness-eval-4, gen-eval-4 | ✅ Full |
| C6 (eval results in PR) | — | gen-eval-5 | ✅ Covered |
| C7 (confidence-gated auto-submit) | — | readiness-eval-2, readiness-eval-7, gen-eval-6 | ✅ Full |

### Failure Conditions → Step Eval Coverage

| Failure Condition | Step Eval | Coverage |
|------------------|-----------|----------|
| F1 (no linked issue) | readiness-eval-1, gen-eval-2 | ✅ Full |
| F2 (generic checklist items) | readiness-eval-3, gen-eval-3 | ✅ Full |
| F3 (checklist items lack evidence) | readiness-eval-4, gen-eval-4 | ✅ Full |
| F4 (evals pass but not in PR) | gen-eval-5 | ✅ Covered |
| F5 (wrong target branch, no confirm) | readiness-eval-2, gen-eval-6 | ✅ Full |

### Scenarios → Scenario Eval Coverage

| Scenario | Scenario Eval | Coverage |
|----------|--------------|----------|
| S1 (Code reviewer) | scenario-1 | ✅ Full |
| S2 (Author) | scenario-2 | ✅ Full |

## Conclusion

**Intent is solid** — all constraints, failure conditions, and scenarios are well-covered by the existing evals. No gaps in intent coverage.

**The play structure needs full recompilation** to L2 compiled format. The 9 gaps identified are all structural (L4 artifacts, naming, missing sections) — not intent gaps. The domain logic, agent boundaries, and skill usage are correct and should be preserved during compilation.
