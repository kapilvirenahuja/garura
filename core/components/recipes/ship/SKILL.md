---
name: ship
description: Deliver current branch work to main — commit, PR, review, merge, return
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# ship

Deliver current branch work to main — commit, PR, review, merge, and return to main.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C3), behavioral constraints (C4–C11), and failure conditions. All constraint IDs referenced in this recipe map to that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct git/gh commands.

**Agent boundaries:**

| Domain Task | Agent |
|---|---|
| Git state, branch validation, PR operations | `repo-orchestrator` |
| Commit workflow | `commit-code` (L1 recipe via Skill tool) |
| PR creation workflow | `create-pr` (L1 recipe via Skill tool) |

## Phases

| Step | Name | Agent | L1 Invoked |
|------|------|-------|-----------|
| Step 0 | Pre-flight | repo-orchestrator | — |
| Step 1 | Commit | L1 (commit-code) | commit-code |
| Step 2 | Create PR | L1 (create-pr) | create-pr |
| Step 3 | Review PR | repo-orchestrator | — |
| Step 4 | Merge PR | repo-orchestrator | — |
| Step 5 | Return to Main | repo-orchestrator | — |
| Step 6 | Report | orchestrator | — |

**Recipe context pattern** — pass to agents at each step:

```yaml
---
Recipe context:
  intent: "{step intent}"
  task: "{step task description}"
  ship_context:
    issue: {issue_number}
    branch: {branch_name}
    base_branch: {base_branch}
```

## Workflow

### Step 0 — Pre-flight

Invoke `repo-orchestrator` with:

```yaml
---
Recipe context:
  intent: "Verify preconditions before executing the ship recipe"
  task: "Run pre-flight checks for the ship recipe. Read reference/intent.yaml. Check C1 (not on protected branch), C2 (remote configured), C3 (issue number in branch name). Also detect: has_uncommitted_changes (boolean), pr_exists (boolean), pr_number (integer or null if no PR). Return all results."
```

**Expected output:**

```yaml
pre_flight:
  branch: {branch_name}
  issue_number: {integer extracted from branch name}
  has_uncommitted_changes: true|false
  pr_exists: true|false
  pr_number: {integer or null}
  results:
    - {id: C1, status: PASS|FAIL}
    - {id: C2, status: PASS|FAIL}
    - {id: C3, status: PASS|FAIL}
```

**Orchestrator validates results:** for any result with `status: FAIL`, halt immediately with that constraint's `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts** — these are environmental conditions the agent cannot fix. See Recovery for all other failures.

**Orchestrator initializes STM checkpoint** at `.meridian/{issue_number}/checkpoint/ship/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING`.

### Step 1 — Commit (Conditional)

**Skip condition:** if `pre_flight.has_uncommitted_changes == false` → log "Step 1 skipped — no uncommitted changes" and proceed to Step 2.

**If not skipped:** Invoke `commit-code` L1 via Skill tool with recipe context:

```yaml
---
Recipe context:
  intent: "Commit uncommitted changes as part of the ship workflow"
  ship_context:
    auto_approve: true
    issue: {issue_number}
```

On failure signal from commit-code → guardian evaluates → HALT.

### Step 2 — Create PR (Conditional)

**Skip condition:** if `pre_flight.pr_exists == true` → log "Step 2 skipped — PR #{pr_number} already exists" and carry forward `pr_number`.

**If not skipped:** Invoke `create-pr` L1 via Skill tool with recipe context:

```yaml
---
Recipe context:
  intent: "Create a pull request as part of the ship workflow"
  ship_context:
    auto_approve: true
    issue: {issue_number}
```

Capture `pr_number` from create-pr output.

On failure signal from create-pr → guardian evaluates → HALT.

### Step 3 — Review PR

Invoke `repo-orchestrator` with:

```yaml
---
Recipe context:
  intent: "Review PR readiness before merging as part of the ship workflow"
  task: "Run analyze-pr skill on PR #{pr_number}. Return: ready (boolean), checklist.must_have (list with item, status PASS|FAIL|REVIEW, evidence), and blocking_issues (list or empty)."
  ship_context:
    issue: {issue_number}
    pr_number: {pr_number}
```

**Expected output:**

```yaml
result:
  ready: true|false
  checklist:
    must_have:
      - item: "{description}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{details}"
  blocking_issues: [{list or empty}]
```

**Guardian evaluates:**
- Orchestrator derives: `must_have_fail` = count of `checklist.must_have` items where `status == FAIL`
- If `must_have_fail > 0` OR `blocking_issues` non-empty → **HALT** (F5)
- Else → **AUTO-APPROVE**

Write guardian decision artifact to `.meridian/{issue}/checkpoint/ship/{same-timestamp}.md` → Guardian Decisions section.

### Step 4 — Merge PR

Invoke `repo-orchestrator` with:

```yaml
---
Recipe context:
  intent: "Merge the approved PR as part of the ship workflow"
  task: "Merge PR #{pr_number} using: gh pr merge --squash --delete-branch {pr_number}. Return: success (boolean), merge_commit (hash or null), branch_deleted (boolean), error (string or null)."
  ship_context:
    issue: {issue_number}
    pr_number: {pr_number}
```

**Guardian evaluates:**
- If merge conflict detected → **HALT** (F4). Self-resolution: attempt rebase once. If still conflicted: create tracking GitHub issue + HALT with Tether/Vanish.
- If CI failure → **HALT** (F4). Do NOT force merge.
- If `success: false` after max 2 retries → **HALT** (F6). Create tracking issue.
- Else → **AUTO-APPROVE**

### Step 5 — Return to Main

Invoke `repo-orchestrator` with:

```yaml
---
Recipe context:
  intent: "Return to the base branch after a successful merge"
  task: "Return to the base branch: git checkout {base_branch} && git pull. Return: success (boolean), current_branch (string), error (string or null)."
  ship_context:
    issue: {issue_number}
    base_branch: {base_branch}
```

**Non-blocking:** if this step fails, log as warning in evidence but DO NOT halt — merge already succeeded.

### Step 6 — Report

**Orchestrator owns this step entirely. Do not delegate.**

1. Update checkpoint artifact Status to `COMPLETED`
2. Write evidence to `.meridian/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md` containing:
   - Issue number and title
   - Branch delivered
   - PR number, URL, merge commit
   - Steps executed (completed/skipped) with step-by-step summary
   - Guardian decisions log
3. Present final report to user using `templates/final-report.md` format
4. Invoke `repo-orchestrator` to commit the evidence and checkpoint files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record evidence for #{issue_number}'. Do not stage any other files."
  files:
    - ".meridian/{issue}/evidence/ship/{same-timestamp}.md"
    - ".meridian/{issue}/checkpoint/ship/{same-timestamp}.md"
  commit_message: "chore(stm): record evidence for #{issue_number}"
```

**Note:** This commit lands on `main` after the squash merge — this is expected and correct. The evidence captures the delivery record; its natural home is on `main` alongside the merge commit.

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt. Delivery already succeeded.

## Guardian Behavior

**Decision Matrix:**

| Condition | Decision |
|-----------|----------|
| `must_have_fail == 0` AND `blocking_issues` empty | AUTO-APPROVE (Step 3) |
| `must_have_fail > 0` OR `blocking_issues` non-empty | HALT (F5) |
| Merge succeeded, branch deleted | AUTO-APPROVE (Step 4) |
| Merge conflict detected | HALT (F4) — attempt self-resolution |
| CI failure on merge | HALT (F4) |
| Merge fails after 2 retries | HALT (F6) — create tracking issue |
| `git checkout main && git pull` fails | WARNING only — non-blocking |
| commit-code or create-pr returns failure | HALT (F7) |

**Halt Presentation** (when guardian halts):

Write guardian decision artifact to `.meridian/{issue}/checkpoint/ship/{timestamp}.md` using `templates/guardian-decision.md`.

Present to user:

```
## Ship Halted

**Blocker:** {blocker description}
**Intent preserved** — no irreversible actions were taken beyond this point.

**Completed:** {list of steps completed before halt}
**Failed at:** Step {N} — {step_name}
**Self-resolution attempted:** {what was tried or "None"}

Type **Tether** to {retry action} or **Vanish** to cancel (branch preserved).
```

Parse: `Tether`/`tether` → retry from halted step. `Vanish`/`vanish` → halt permanently, write final evidence, DO NOT merge. Else → clarify.

## Self-Resolution Strategies

| Blocker | Strategy | Max Attempts | CANNOT |
|---------|----------|-------------|--------|
| Merge conflict | Attempt `git rebase {base_branch}` | 1 | Change code logic |
| Merge API failure | Retry `gh pr merge` after 5s | 2 | Force merge with --force |
| PR not found | Re-fetch PR list, derive pr_number from branch | 1 | Create a new PR |
| Branch deletion failed | Log as warning, proceed | 1 | Undo the merge |
| `git pull` after checkout fails | Attempt `git fetch origin {base_branch}` | 1 | Modify branch protection |
| CI failure | Record and HALT — do NOT retry | 0 | Override CI status |

**CANNOT (global):** change code files, change documentation, modify protected branch settings, force-push to main.

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

Pre-flight failures (C1, C2, C3) are **hard halts** — no recovery loop.

For runtime failures: follow structured-failure-protocol. Max 2 retry cycles per step. After that, HALT with full failure context.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.meridian/{issue}/checkpoint/ship/{ts}.md` |
| Guardian Decision | `templates/guardian-decision.md` | Guardian auto-approve/halt decision record |
| Final Report | `templates/final-report.md` | Final delivery report |

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 1.0.0 |
| Distinct Agents | 2 (repo-orchestrator, project-orchestrator via commit-code L1) |
| Checkpoint | Guardian-gated (auto-approve default; halt on blockers) |

> **ADR 003 Deviation:** ADR 003 references a `workflow-guardian` agent for L2 recipes. That agent does not exist in `core/components/agents/`. Guardian decision logic is implemented inline in this SKILL.md orchestrator. Recommend ADR 003 update as a follow-on task.
