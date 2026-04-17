# Play Analysis: start-feature

## Current State

| Field | Value |
|-------|-------|
| Declared Level | L1 |
| Actual Maturity | L2 (has full intent.yaml with C1-C10, F1-F8, S1-S5) |
| Workflow | "direct-generation" (numbered stages 0, 1, 2, 5, 6, 7) |
| Domain Agents | 2 (project-orchestrator, repo-orchestrator) |
| Infrastructure Agents | 1 (intent-resolver — runtime, L4 pattern) |
| Step Evals | 10 |
| Scenario Evals | 5 |

## Semantic Map

```
Play: start-feature
  Phase: Pre-flight (Stage 0)
    Owner: play
    Checks: stm_base resolution, git repo, platform config, git status snapshot
    Constraint mapping: C2 (preserve changes)

  Phase: Intent Resolution (Stage 1) — ANTI-PATTERN
    Owner: intent-resolver agent (RUNTIME — this is L4, not L2)
    Issues: L2 should have no runtime DAG resolution

  Phase: Readiness (Stage 2)
    Owner: project-orchestrator
    Skills: resolve-issues, manage-issue
    Contract: JSON with stm.input (changed_files, args) → stm.output (issue_resolution)
    Constraint mapping: C1, C4, C5, C6, C10
    Failure condition mapping: F1, F5, F6, F7, F8

  Phase: Generation (Stage 5)
    Owner: repo-orchestrator
    Skills: setup-branch
    Contract: JSON with stm.input (issue_resolution) → stm.output (branch_result)
    Constraint mapping: C2, C3, C7, C8
    Failure condition mapping: F2, F3, F4

  Phase: Scenario Validation (Stage 6)
    Owner: play
    Scenarios: S1-S5

  Phase: Evidence & Close (Stage 7)
    Owner: play
```

## Issues Found

### Critical (Must Fix for L2)

1. **Runtime intent-resolver (Stage 1)** — high-order plays compile everything into SKILL.md. No runtime DAG resolution. Remove intent-resolver entirely.
2. **DAG caching system** — Caches at `.meridian/cache/intent-resolution/start-feature.json`. L2 has no runtime DAG — task ordering is baked into SKILL.md. Remove.
3. **DAG resumption system** — DAG at `{stm_base}/{issue}/dag/start-feature.json`. Replace with per-step status file for pause/resume.
4. **Incorrect level declaration** — Declares L1 but has full L2 maturity (intent.yaml with constraints, failure conditions, scenarios, evals). Change to L2.
5. **Missing "Compiled From" notice** — Required section per compiled-example.md.
6. **Missing Compilation Metadata** — No intent_hash, compiled_by, compiled_at.
7. **Numbered stages instead of named phases** — L2 uses named phases per ADR 013.
8. **Extra frontmatter fields** — `model: sonnet` and `allowed-tools:` are skill fields, not play fields.

### Non-Critical (Improvements)

9. **Stages 3-4 declared as "inactive"** — Confusing. L2 Structure B simply doesn't have checkpoint phases. Don't mention inactive stages.
10. **Step eval numbering has gaps** — SE-1 through SE-6 then SE-9 through SE-12 (skips SE-7, SE-8). Renumber sequentially.

## Recommended Workflow

**Structure B — Fast execution flow** — This play has no checkpoint/brief/approval phase. The only human interaction is inline ambiguity resolution during issue resolution (C5). Structure B fits: Pre-flight → Execution → Evidence.

## Agent-Skill Map

| Agent | Skills Used | Phase |
|-------|-------------|-------|
| project-orchestrator | manage-issue (resolve_or_create), resolve-issues (for inference from changes) | Execution — Resolve Issue |
| repo-orchestrator | setup-branch | Execution — Create Branch |

## Constraint Coverage

| Constraint | Pre-flight | Step Eval | Scenario Eval |
|-----------|------------|-----------|---------------|
| C1 (single flow) | — | — | S1, S2, S3 |
| C2 (preserve changes) | snapshot | SE-10 (F4) | S1, S4 |
| C3 (existing branch switch) | — | SE-12 | S4 |
| C4 (open issues only) | — | SE-3 (F7) | — |
| C5 (ambiguity resolution) | — | SE-4 (F8) | — |
| C6 (confidence-gated) | — | SE-1 (F5) | — |
| C7 (branch naming) | — | SE-9 (F2) | S2 |
| C8 (STM directory) | — | SE-11 (F3) | S1, S2, S3 |
| C9 (agent delegation) | — | — | — (structural) |
| C10 (issue body ~40 words) | — | SE-6 | S3 |

## Failure Condition Coverage

| FC | Step Eval | Covered? |
|----|-----------|----------|
| F1 (no issue) | SE-5 | YES |
| F2 (branch naming) | SE-9 | YES |
| F3 (no STM dir) | SE-11 | YES |
| F4 (changes lost) | SE-10 | YES |
| F5 (low confidence) | SE-1 | YES |
| F6 (duplicate issue) | SE-2 | YES |
| F7 (closed issue) | SE-3 | YES |
| F8 (ambiguous) | SE-4 | YES |
