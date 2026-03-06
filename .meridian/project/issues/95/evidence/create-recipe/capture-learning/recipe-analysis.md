# Recipe Analysis: capture-learning (Rebake)

## Semantic Map

### Recipe -> Phases -> Steps

**Current structure:** 8 numbered stages (0-7) — legacy linear stage model, NOT L2 compiled format.

| Stage | Name | Owner | Active? |
|-------|------|-------|---------|
| 0 | Workflow Pre-flight | recipe | Yes |
| 1 | Intent Resolution | intent-resolver | Yes (L4 pattern — should not exist in L2) |
| 2 | Readiness | project-orchestrator + recipe | Yes |
| 3 | Human-Readable Brief | — | Skipped (extraction bypassed) |
| 4 | Human Checkpoint | — | Skipped (extraction bypassed) |
| 5 | Generation | repo-orchestrator | Yes |
| 6 | Scenario Validation | recipe | Yes |
| 7 | Evidence & Close | recipe | Yes |

### Agent Dispatches

| Agent | Stage | Skill | Contract |
|-------|-------|-------|----------|
| `intent-resolver` | 1 | — (DAG resolution) | Runtime DAG generation — **L4 pattern, violates L2** |
| `project-orchestrator` | 2 | `manage-issue` | Verify issue is closed, fetch close date |
| `repo-orchestrator` | 5 | `archive-issue-stm` | Archive STM directory to `_archive/{YYYY-MM}/{issue}/` |

### Skill Invocations

| Skill | Agent | Purpose | Contract Path |
|-------|-------|---------|---------------|
| `manage-issue` | project-orchestrator | Read issue state (closed?), get closedAt | `{stm_base}/{issue}/evidence/capture-learning/issue-state.yaml` (implied) |
| `archive-issue-stm` | repo-orchestrator | Move STM dir to archive | `{stm_base}/{issue}/evidence/capture-learning/archive-result.yaml` (implied) |

### Intent Constraint Mappings

| Constraint | Where Enforced | How |
|------------|---------------|-----|
| C1 (extraction/archival independent) | Recipe structure | Two independent operations — but extraction is fully bypassed |
| C2 (STM read-only during extraction) | Extraction phase | Bypassed — no extraction exists |
| C3 (update existing knowledge, no duplicates) | Extraction phase | Bypassed — no extraction exists |
| C4 (knowledge metadata tiers) | Extraction phase | Bypassed — no extraction exists |
| C5 (no traceability links in knowledge) | Extraction phase | Bypassed — no extraction exists |
| C6 (holistic knowledge organization) | Extraction phase | Bypassed — no extraction exists |
| C7 (archive to `_archive/{YYYY-MM}/{issue}/`) | Stage 5 | repo-orchestrator + archive-issue-stm skill |

### Eval Coverage

**Step evals:**
| Eval | Active? | Constraints/Failures |
|------|---------|---------------------|
| step-eval-1 (extraction quality) | PLACEHOLDER | F1, F4, C4 |
| step-eval-2 (no duplicates) | PLACEHOLDER | C3, F2 |
| step-eval-3 (archive verification) | ACTIVE | C3(?), C7 |

**Scenario evals:**
| Eval | Scenario | Active? |
|------|----------|---------|
| scenario-1 (S1) | Agent discovers knowledge | Partial — validates bypass was clean |
| scenario-2 (S2) | Developer finds patterns | Partial — validates bypass was clean |
| scenario-3 (S3) | Lead reviews archived STM | ACTIVE |

## Critical Issues Found

### Issue 1: L4 Runtime Patterns in L2 Recipe
The recipe uses `intent-resolver` at runtime (Stage 1) with DAG caching. Per ADR 013, L2 recipes compile intent at build-time. The intent-resolver is a build-time tool, not a runtime agent. The entire "Load DAG" + "DAG Caching" + "DAG Resumption" infrastructure is L4 overhead.

**Fix:** Remove runtime intent resolution. Bake task ordering into SKILL.md as sequential steps with named phases.

### Issue 2: Numbered Stages Instead of Named Phases
The recipe uses stages 0-7. L2 compiled format uses named phases (Pre-flight, Preparation/Execution, Checkpoint, Evidence) with sequential numbered steps within each phase.

**Fix:** Restructure into named phases per compiled-example.md format.

### Issue 3: Runtime Intent Reference
The recipe says "BEFORE executing any step, read reference/intent.yaml". L2 recipes do NOT reference intent.yaml at runtime — everything is compiled in.

**Fix:** Remove runtime intent.yaml reference. All constraints, evals, and checks are baked into the compiled SKILL.md.

### Issue 4: Workflow Structure Mismatch
ADR 013 lists capture-learning as "Structure B" (fast execution flow), but the current recipe has 8 stages including brief + checkpoint. With extraction bypassed, the active flow is: pre-flight → verify issue → archive → validate → evidence. This maps to Structure B.

**Fix:** Compile as Structure B (Pre-flight → Execution → Approval).

### Issue 5: Missing Pause/Resume in L2 Format
The recipe has DAG-based resumption (L4 pattern). L2 uses per-step status file tracking.

**Fix:** Implement pause/resume with `{stm_base}/{issue}/status/capture-learning.json` per compiled example format.

### Issue 6: step-eval-3 References C3 Incorrectly
C3 is about knowledge deduplication. Step-eval-3 validates archival (C7). The C3 reference appears incorrect for the archive eval.

**Fix:** step-eval-3 should reference C7 only.

### Issue 7: No JSON Contract Templates
Agent dispatches lack explicit JSON contract templates per agent-contract.md schema. L2 compiled format requires the full contract template inline in each step.

**Fix:** Add full JSON contract templates for both agent dispatches.

## Workflow Structure Assessment

**Recommended:** Structure B (Fast execution flow)

Rationale:
- ADR 013 explicitly labels capture-learning as Structure B
- Only 2 domain agents (within L1 budget of max 2)
- Low complexity — verify issue closed, then archive
- No preparation phase needed (no analysis that feeds into execution)
- No checkpoint needed (archival is either correct or not — no confidence gradient)

```
Pre-flight     -> Verify preconditions (config, issue number, STM exists)
Execution      -> Step 1: Verify issue closed (project-orchestrator)
                  Step 2: Archive STM directory (repo-orchestrator)
Evidence       -> Step 3: Scenario validation + evidence write + self-commit
```
