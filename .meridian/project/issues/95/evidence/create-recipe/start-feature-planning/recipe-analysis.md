# Recipe Analysis: start-feature-planning

## Current State

| Field | Value |
|-------|-------|
| Declared Level | L1 |
| Actual Maturity | Pre-L2 (has intent.yaml but with gaps: no scenarios, no FC IDs) |
| Workflow | Custom steps (0, 1, 1b, 2, 3, 4, 5) with approval checkpoint |
| Domain Agents | 2 (project-orchestrator, repo-orchestrator) |
| Built-in Tool | Plan sub-agent (exempt from agent limits per C9) |
| Step Evals | 0 |
| Scenario Evals | 0 |

## Semantic Map

```
Recipe: start-feature-planning
  Step 0 — Pre-flight
    Owner: repo-orchestrator (C1), recipe (C2)
    Checks: clean working tree (C1), actionable intent (C2)

  Step 1 — Resolve Issue
    Owner: project-orchestrator
    Skills: manage-issue (resolve_or_create)
    Output: issue number, title, body, type_hint

  Step 1b — Create Branch
    Owner: repo-orchestrator
    Skills: setup-branch
    Output: branch name, push status
    Note: Branch created BEFORE planning artifacts — Vanish cleanup deletes it

  Step 2 — Deep Analysis + Plan
    Owner: Plan sub-agent (Claude built-in, subagent_type: "Plan")
    Output: Three sections: SPEC, VERIFY, TASKS (text, not files)
    Note: NOT a Meridian agent — exempt from P1-P10 audit

  Step 3 — Write Planning Artifacts
    Owner: recipe (orchestrator)
    Writes: spec.md, verify.md, tasks.md to STM planning/

  Step 4 — Checkpoint (Approval Gate)
    Owner: recipe (orchestrator)
    Gate: Tether → proceed, Vanish → delete remote branch, halt
    Note: ONLY approval gate in recipe

  Step 5 — Report + Evidence
    Owner: recipe (orchestrator)
    Writes: evidence, checkpoint artifacts
    Invokes: repo-orchestrator for evidence self-commit (non-blocking)
```

## Intent.yaml Gaps

### Critical

1. **No scenarios defined** — intent.yaml has zero acceptance scenarios (S1, S2, etc.)
2. **Failure conditions lack IDs** — Listed as prose bullets, not structured with F1, F2 IDs
3. **Constraint structure non-standard** — Uses `pre_flight` and `behavioral` sub-categories instead of flat list

### Non-Critical

4. **No formal step evals** — Recipe has no step-level eval criteria
5. **Templates reference `feature-started.md`** but file is named `final-report.md` — naming mismatch
6. **Extra frontmatter fields** — `model: sonnet`, `allowed-tools:` are skill fields, not recipe

## Recommended Workflow

**Structure A — Full checkpoint flow** — Recipe has preparation work (resolve issue, create branch, deep analysis), a confidence-gated checkpoint (plan approval), and post-checkpoint execution (write evidence, report). Checkpoint is the approval gate where user Tethers or Vanishes.

```
Pre-flight → Preparation (resolve, branch, plan) → Checkpoint (approval) → Evidence
```

## Agent-Skill Map

| Agent | Skills Used | Phase |
|-------|-------------|-------|
| project-orchestrator | manage-issue (resolve_or_create) | Preparation — Resolve Issue |
| repo-orchestrator | setup-branch | Preparation — Create Branch |
| Plan sub-agent | (Claude built-in — no Meridian skill) | Preparation — Deep Analysis |
| repo-orchestrator | create-commit (evidence self-commit) | Evidence — non-blocking |
