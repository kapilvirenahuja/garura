# Spec: /ship L2 Recipe

**Intent:** Deliver the current branch's work to main with zero friction — commit, PR, review, merge, return.
**Level:** L2 (first L2 recipe in the codebase)
**Type:** New Recipe

---

## Context

There is no existing L2 recipe in the Meridian codebase. All five existing recipes (`commit-code`, `create-pr`, `start-feature`, `start-feature-planning`, `discover-product`) are L1. The `/ship` recipe will be the first L2, establishing the pattern for chaining L1 recipes with guardian-gated checkpoints.

The recipe chains two existing L1 recipes (`commit-code`, `create-pr`) with three direct agent delegations (`review-pr`, `merge-pr`, `return-to-main`) to deliver a branch end-to-end. Steps without existing L1 recipes are handled as inline agent delegations within the L2 orchestrator — not as new L1 recipes. This avoids creating L1 shells that have no standalone utility.

## Intent (Three Elements)

**Intent:** "Deliver the current branch's completed work to the main branch — commit, create PR, review, merge, and return to main — with zero-friction autonomous execution."

**Constraints:**

Pre-flight:
- C1: Current branch is NOT main, master, or develop (cannot ship from a protected branch)
- C2: Git repository exists and has a remote configured
- C3: Issue number is extractable from branch name (NWWI)

Behavioral:
- C4: Orchestrator MUST delegate domain tasks to agents — never execute git/gh commands directly
- C5: Maximum 3 distinct agents (repo-orchestrator, project-orchestrator, and one quality pass via repo-orchestrator); recovery calls exempt
- C6: Guardian logic is INLINE in the L2 SKILL.md — no dependency on unimplemented workflow-guardian agent
- C7: Self-resolution MUST NOT change code or documentation. CAN: retry operations, create issues, adjust PR metadata, force-push (only on feature branches, never protected), delete/recreate branches, rebase
- C8: Evidence MUST be written to `.meridian/{issue}/evidence/ship/{timestamp}.md` at each stage
- C9: Auto-approve is the DEFAULT. Halt ONLY on genuine blockers: merge conflicts, CI failures, protected branch violations, PR review with blocker-severity findings
- C10: Each L1 checkpoint is evaluated by inline guardian before proceeding — guardian does NOT ask the user unless a blocker is detected
- C11: If uncommitted changes do not exist AND a PR already exists, skip the corresponding steps — do not halt on empty pre-conditions that can be safely skipped

**Failure Conditions:**
- F1: Current branch is a protected branch (main, master, develop) — hard halt
- F2: No git remote configured — hard halt
- F3: No issue number extractable from branch name — hard halt
- F4: Merge conflicts that cannot be auto-resolved — halt, create issue
- F5: PR review finds blocker-severity quality issues — halt with evidence
- F6: Merge fails after 2 retry attempts — halt, create issue
- F7: User explicitly cancels at a guardian-halted checkpoint (Vanish)

---

## Execution Flow

### Phase Summary

```
PRE-FLIGHT → COMMIT → GUARDIAN → CREATE-PR → GUARDIAN → REVIEW-PR → GUARDIAN → MERGE-PR → RETURN-TO-MAIN → REPORT
```

### Phase Detail

| Phase | Step | Name | Agent | L1 Used | Guardian After |
|-------|------|------|-------|---------|---------------|
| PRE-FLIGHT | Step 0 | Pre-flight checks | repo-orchestrator | — | — |
| COMMIT | Step 1 | Commit uncommitted work | repo-orchestrator + project-orchestrator | commit-code (L1) | Yes |
| CREATE-PR | Step 2 | Create pull request | repo-orchestrator | create-pr (L1) | Yes |
| REVIEW-PR | Step 3 | Review PR quality | repo-orchestrator | — (inline) | Yes |
| MERGE-PR | Step 4 | Merge PR to target | repo-orchestrator | — (inline) | — |
| RETURN | Step 5 | Checkout main, pull latest | repo-orchestrator | — (inline) | — |
| REPORT | Step 6 | Write evidence, present summary | orchestrator | — | — |

### Distinct Agent Count: 2

| Agent | Used In | Purpose |
|-------|---------|---------|
| repo-orchestrator | Steps 0-5 | All git/PR operations |
| project-orchestrator | Step 1 (via commit-code) | Issue resolution for NWWI |

---

## Workflow Detail

### Step 0 — Pre-flight

Invoke `repo-orchestrator` to validate environmental preconditions.

**Recipe context:**
```yaml
intent: "Verify preconditions before shipping"
task: "Read reference/intent.yaml. Run every check in constraints.pre_flight. Additionally: check if uncommitted changes exist (for skip-logic), check if a PR already exists for this branch (for skip-logic). Return pass/fail for each constraint plus state flags."
```

**Expected output:**
```yaml
pre_flight:
  branch: {current_branch_name}
  target: {base_branch from config or 'main'}
  issue_number: {integer | null}
  has_remote: true|false
  results: [{id: C1, status: PASS|FAIL}, {id: C2, status: PASS|FAIL}, {id: C3, status: PASS|FAIL}]
  state:
    uncommitted_changes: true|false
    unpushed_commits: true|false
    existing_pr: {number | null}
    existing_pr_url: {url | null}
    merge_conflicts: true|false
```

**Validation:** Any C1/C2/C3 FAIL triggers hard halt.

**Skip-logic derivation:**
- `uncommitted_changes: false` → skip Step 1 (commit)
- `existing_pr != null` → skip Step 2 (create-pr), use existing PR number for Steps 3-4
- `unpushed_commits: false AND existing_pr != null` → skip Steps 1-2, proceed to review
- `merge_conflicts: true` → guardian halt before any execution (cannot auto-resolve without code changes)

### Step 1 — Commit (L1: commit-code)

**Skip condition:** `state.uncommitted_changes == false` → skip, record in evidence.

Invoke `commit-code` L1 recipe via Skill tool.

**Ship context passed:**
```yaml
ship_context:
  orchestrated_by: "ship"
  auto_approve: true
  issue_number: {from pre-flight}
```

**Expected output from L1:**
```yaml
commit_result:
  success: true|false
  commits: [{hash, message, files}]
  issue_number: {integer}
```

**Guardian evaluation:**
- `success: true` → auto-approve, continue
- `success: false` → assess: is the failure within self-resolution scope? Retry once. If still failing → HALT with evidence

### Step 2 — Create PR (L1: create-pr)

**Skip condition:** `state.existing_pr != null` → skip, record in evidence.

Invoke `create-pr` L1 recipe via Skill tool.

**Ship context passed:**
```yaml
ship_context:
  orchestrated_by: "ship"
  auto_approve: true
  issue_number: {from pre-flight or Step 1}
  target: {target_branch}
```

**Expected output from L1:**
```yaml
pr_result:
  success: true|false
  pr:
    number: {integer}
    url: {string}
    state: {open|draft}
    title: {string}
  checklist:
    required_count: {integer}
    optional_count: {integer}
```

**Guardian evaluation:**
- `success: true` AND no blocking checklist items → auto-approve, continue
- `success: false` → self-resolution: retry once. If still failing → HALT
- Blocking checklist items with FAIL status → HALT with evidence (PR quality issue)

### Step 3 — Review PR (Inline Agent Delegation)

No existing L1 recipe. Handled as a direct `repo-orchestrator` invocation using the existing `analyze-pr` skill.

**Recipe context:**
```yaml
intent: "Independently review the PR for quality before merge"
task: "Analyze the PR for merge readiness. Use the analyze-pr skill. Focus on: merge conflicts, blocking quality items, sensitive file changes. Return structured review."
pr_number: {from Step 2 or pre-flight}
branch: {current_branch}
target: {target_branch}
behavioral_constraints:
  - "Review MUST be independent — do not assume prior analysis is sufficient"
  - "Focus on merge-blocking issues, not style suggestions"
```

**Expected output:**
```yaml
review:
  pr_number: {integer}
  merge_ready: true|false
  blockers: [{description, severity: blocker|warning}]
  warnings: [{description}]
  conflicts: true|false
  checklist_summary:
    must_have_pass: {count}
    must_have_fail: {count}
    must_have_review: {count}
```

**Guardian evaluation:**
- `merge_ready: true` AND `conflicts: false` AND `must_have_fail == 0` → auto-approve, continue to merge
- `conflicts: true` → HALT. Create GitHub issue documenting the conflict.
- `must_have_fail > 0` → HALT. Present blocker details. User can Tether to override or Vanish to abort.
- `merge_ready: false` for other reasons → assess warnings. If all are severity=warning (not blocker) → auto-approve with warnings noted in evidence. If any are blocker → HALT.

### Step 4 — Merge PR (Inline Agent Delegation)

No existing L1 recipe. Direct `repo-orchestrator` invocation.

**Recipe context:**
```yaml
intent: "Merge the approved PR to the target branch"
task: "Merge PR #{number} to {target} using gh pr merge. Use squash merge by default. Delete source branch after successful merge. Return merge result."
pr_number: {from earlier steps}
merge_strategy: "squash"
behavioral_constraints:
  - "MUST use gh pr merge, not git merge"
  - "MUST NOT force merge if checks are failing"
  - "Delete source branch after successful merge"
```

**Expected output:**
```yaml
merge_result:
  success: true|false
  merge_commit: {sha | null}
  strategy: {squash|merge|rebase}
  source_branch_deleted: true|false
  error: {message | null}
```

**Self-resolution on failure:**
- `error` contains "merge conflict" → HALT, create issue
- `error` contains "required status checks" → HALT, record in evidence
- `error` contains "not mergeable" → retry once after 5s wait. If still failing → HALT
- `source_branch_deleted: false` → attempt deletion separately. If that fails, record but do not halt — branch cleanup is non-critical.

### Step 5 — Return to Main (Inline Agent Delegation)

Direct `repo-orchestrator` invocation.

**Recipe context:**
```yaml
intent: "Return to the main branch with latest state"
task: "Checkout {target_branch}. Pull latest. Verify working tree is clean. Return status."
target: {target_branch}
```

**Expected output:**
```yaml
return_result:
  success: true|false
  branch: {current_branch after checkout}
  up_to_date: true|false
  error: {message | null}
```

**Self-resolution on failure:**
- Checkout fails (dirty tree) → stash, checkout, pop stash. If still failing → HALT
- Pull fails (network) → retry once. If still failing → record warning but do not halt

### Step 6 — Report

**Orchestrator owns this step entirely. Do not delegate.**

Write consolidated evidence to `.meridian/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md` using `templates/final-report.md`.

Present final summary to user.

---

## Guardian Behavior

The guardian is inline logic in the L2 orchestrator (per C6). It evaluates after each L1 checkpoint and after each inline step.

### Decision Matrix

| Condition | Decision | Action |
|-----------|----------|--------|
| Step succeeded, no blockers | AUTO-APPROVE | Continue to next step |
| Step succeeded with warnings (not blockers) | AUTO-APPROVE | Log warnings in evidence, continue |
| Step failed, within self-resolution scope | SELF-RESOLVE | Attempt resolution, then re-evaluate |
| Step failed, outside self-resolution scope | HALT | Present blocker to user with Tether/Vanish |
| Merge conflicts detected | HALT | Cannot resolve without code changes |
| CI/status checks failing | HALT | Cannot force-merge |
| Blocker-severity review findings | HALT | Present findings, user decides |
| Network/transient error | SELF-RESOLVE | Retry once |

### Halt Presentation

When the guardian halts, present to user:

```markdown
## Ship Halted: {step_name}

**Blocker:** {description}
**Intent preserved:** Deliver current branch work to main
**What was completed:** Steps 1-{N} succeeded
**What failed:** Step {N+1}: {details}

### Options
- **Tether** — Override and continue
- **Vanish** — Abort ship. Evidence is preserved at {evidence_path}

### Self-Resolution Attempted
{what was tried, if anything}
```

---

## Self-Resolution Strategies

| Blocker | Resolution Strategy | Max Attempts |
|---------|---------------------|--------------|
| Push rejected (remote ahead) | Pull with rebase, retry push | 2 |
| PR creation fails (duplicate) | Find existing PR, use it | 1 |
| Merge fails (transient) | Wait 5s, retry | 1 |
| Branch deletion fails | Retry with `git push origin --delete` | 1 |
| Checkout fails (dirty tree) | Stash changes, checkout, pop stash | 1 |
| Network timeout | Retry the operation | 1 |

**Cannot self-resolve (must HALT):**
- Merge conflicts (requires code changes)
- Failing CI checks (requires code/config changes)
- Blocker-severity quality issues (requires code changes)
- Protected branch rule violations (infrastructure constraint)

When self-resolution fails, create a GitHub issue via `project-orchestrator` with the `manage-issue` skill.

---

## Agent Allocation

| Agent | Calls | Purpose |
|-------|-------|---------|
| repo-orchestrator | Up to 6 (pre-flight, commit-code internal, create-pr internal, review, merge, return) | All git/PR domain operations |
| project-orchestrator | Up to 2 (issue resolution in commit-code, issue creation for blockers) | Issue domain operations |

**Total distinct agents: 2** (well within L2 limit of 5).

---

## Dependencies

### Existing (no changes needed):
- `commit-code` L1 recipe
- `create-pr` L1 recipe
- `repo-orchestrator` agent
- `project-orchestrator` agent
- `analyze-pr` skill
- `submit-pr` skill
- `manage-issue` skill

### New (must be created):
- `core/components/recipes/ship/SKILL.md`
- `core/components/recipes/ship/reference/intent.yaml`
- `core/components/recipes/ship/templates/checkpoint.md`
- `core/components/recipes/ship/templates/guardian-decision.md`
- `core/components/recipes/ship/templates/final-report.md`

### Deliberate exclusions:
- No `review-pr` L1 recipe — review is an inline agent delegation (analyze-pr skill exists)
- No `merge-pr` L1 recipe — merge is a single gh command via agent
- No `return-to-main` L1 recipe — trivially simple
- No `workflow-guardian` agent — guardian logic is inline per C6

## Out of Scope

- Creating a `quality-validator` agent
- Creating a `workflow-guardian` agent
- CI integration (reads CI status but does not run CI)
- Configurable merge strategies (squash default; configurability deferred)
- Multi-PR support
- Dry-run mode
