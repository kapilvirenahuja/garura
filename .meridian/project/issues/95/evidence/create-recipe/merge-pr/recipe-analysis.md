# Recipe Analysis: merge-pr (Rebake)

## Current State

The existing SKILL.md is an L4-era recipe with runtime DAG resolution, runtime intent reading, numbered stages, and intent-resolver as a runtime agent. It needs full recompilation to L2.

## Semantic Map

### Recipe Structure
- **Workflow:** Direct-generation (no checkpoint) — maps to Structure B
- **Stages:** 0 (pre-flight), 1 (intent resolution), 2 (readiness), 5 (generation), 6 (scenario validation), 7 (evidence)
- **Agent budget:** 1 domain agent (repo-orchestrator), 2 calls (Stages 2, 5)

### Agent Dispatches
| Agent | Stage | Purpose | Skills Used |
|-------|-------|---------|-------------|
| intent-resolver | 1 | Runtime DAG resolution | N/A (infrastructure) |
| repo-orchestrator | 2 | Verify PR, check mergeable, clean tree | merge-pr (readiness phase) |
| repo-orchestrator | 5 | Merge PR, switch branch, pull, delete branch | merge-pr (execution phase) |

### Skill Invocations
| Skill | Agent | Purpose |
|-------|-------|---------|
| merge-pr | repo-orchestrator | Merge PR, switch base, pull, delete branch |

### Intent Constraint Mappings
| Constraint | Pre-flight | Step Eval | Scenario Eval |
|------------|-----------|-----------|---------------|
| C1 (branch guard) | Yes | - | - |
| C2 (PR exists) | Yes | - | - |
| C3 (clean tree) | Yes | readiness-eval-3 | - |
| C4 (no conflicts) | - | readiness-eval-2 | - |
| C5 (default merge strategy) | - | gen-eval-1 | S2 |
| C6 (remote delete tolerance) | - | gen-eval-4 | - |

### Failure Condition Coverage
| Failure | Step Eval | Scenario Eval |
|---------|-----------|---------------|
| F1 (merge with conflicts) | readiness-eval-2 | - |
| F2 (branch still exists) | gen-eval-4 | S1 |
| F3 (not on base branch / behind remote) | gen-eval-2, gen-eval-3 | S1, S2 |
| F4 (merge with dirty tree) | readiness-eval-3 | - |
| F5 (merge without PR) | readiness-eval-1 | - |

### Scenario Coverage
| Scenario | Eval | Constraints/Failures Covered |
|----------|------|------------------------------|
| S1 (Developer) | scenario-1 | F2, F3 |
| S2 (Code Reviewer) | scenario-2 | C5, F3 |

## L4 Violations (Against ADR 013 L2)

1. **Runtime intent-resolver (Stage 1)** — L2 says intent-resolver is build-time only
2. **Runtime DAG loading/caching** — L2 bakes task ordering into SKILL.md
3. **Numbered stages** — L2 uses named phases with sequential steps
4. **Workflow template reference** — `~/.meridian/core/memory/workflows/direct-generation.yaml` — L2 is self-contained
5. **Runtime intent reading** — "BEFORE executing any step, read reference/intent.yaml" is L4
6. **Missing Compiled From section**
7. **Missing L2 Pause and Resume section** (has DAG Resumption instead)
8. **Missing Compilation Metadata section** (intent_hash, compiled_by, etc.)

## Rebake Plan

- **Workflow:** Structure B (fast execution — pre-flight, execution, approval)
- **Remove:** intent-resolver, DAG loading, caching, numbered stages
- **Add:** Compiled From, Pause and Resume, Compilation Metadata
- **Restructure:** Named phases with sequential steps, baked task ordering
- **Agent:** repo-orchestrator only (2 dispatches — readiness + execution)
- **Evals:** Keep existing step evals and scenario evals (coverage is good)
- **Intent:** Review for gaps via intent-crafter
