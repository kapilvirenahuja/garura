# Play Analysis: ship (Rebake)

## Current State

L4-era Structure C play that chains commit-code → create-pr → merge-pr. All three sub-plays are now L2 compiled. The parent play needs recompilation to L2.

## Semantic Map

### Play Structure
- **Workflow:** Structure C (higher-order L2 — chained plays)
- **Stages:** 0 (pre-flight), 1 (intent resolution), 2 (readiness via commit-code + create-pr), 5 (generation via merge-pr), 6 (scenario validation), 7 (evidence)
- **Sub-plays:** commit-code (L2), create-pr (L2), merge-pr (L2)
- **Direct agent calls:** 0 domain agents. Only repo-orchestrator for evidence self-commit (non-blocking).

### Chained Play Flow
| Step | Play | What It Does | STM Output |
|------|--------|--------------|------------|
| 1 | commit-code | Commit changes grouped by concern | commit records |
| 2 | create-pr | Create PR with quality checklist | PR number, URL |
| 3 | merge-pr | Merge PR, switch to main, delete branch | merge result |

### Cross-Play Data Flow
```
commit-code → STM commit records
                    ↓
create-pr reads commits → PR (number, URL) to STM
                    ↓
merge-pr reads PR number → merges, switches, pulls, deletes
```

### Intent Constraint Mappings
| Constraint | Pre-flight | Sub-play | Scenario Eval |
|------------|-----------|------------|---------------|
| C1 (branch guard) | Yes | commit-code pre-flight | - |
| C2 (no approvals) | - | Override flag to all sub-plays | - |
| C3 (default merge strategy) | - | merge-pr (C5) | - |
| C4 (main up to date) | - | merge-pr (pull latest) | S1 |
| C5 (delete feature branch) | - | merge-pr (F2) | S1 |
| C6 (no conflict auto-resolution) | - | merge-pr (C4) | - |

### Failure Condition Coverage
| Failure | Sub-play Coverage | Scenario Eval |
|---------|-------------------|---------------|
| F1 (branch still exists) | merge-pr SE-2 (F2) | S1 |
| F2 (merge conflicts) | merge-pr SE-1 (F1) | - |
| F3 (not on main / behind remote) | merge-pr SE-3 (F3) | S1 |
| F4 (wrong issue reference) | commit-code SE-6, SCE-2 | S2 |
| F5 (PR no linked issue / wrong branch) | create-pr step evals | S2 |
| F6 (uncommitted work at merge time) | commit-code covers all changes first | - |

### Scenario Coverage
| Scenario | Eval | What it validates |
|----------|------|-------------------|
| S1 (Developer) | SCE-1 | On main, up to date, feature branch gone, work in history |
| S2 (Code Reviewer) | SCE-2 | PR merged, issue traceable, checklist present, merge on main |

## L4 Violations

1. **Runtime intent-resolver (Stage 1)** — L2 has no runtime intent resolution
2. **Runtime DAG loading/caching** — L2 bakes task ordering into SKILL.md
3. **Numbered stages (0, 1, 2, 5, 6, 7)** — L2 uses named phases
4. **Workflow template reference** — `~/.meridian/core/memory/workflows/direct-generation.yaml`
5. **Runtime intent reading** — "BEFORE executing any step, read reference/intent.yaml"
6. **Missing Compiled From section**
7. **Missing L2 Pause and Resume section**
8. **Missing Compilation Metadata section**

## Rebake Plan

- **Workflow:** Structure C (chained high-order plays)
- **Remove:** intent-resolver, DAG loading/caching, numbered stages
- **Add:** Compiled From, Pause and Resume, Compilation Metadata
- **Preserve:** Approval override pattern (C2), cross-play STM data flow, evidence on main
- **No domain agents:** Ship invokes plays, not agents directly
- **Evals:** Step evals delegated to sub-plays. Ship owns scenario evals only.
