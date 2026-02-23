---
name: create-pr
description: Create pull request with dynamic, context-aware quality checklist
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# create-pr

Create a pull request with a context-aware quality checklist based on what changed.

## Intent

```yaml
intent: "Submit work for peer review via a pull request with dynamically generated, evidence-based quality assurance"

constraints:
  pre_flight:
    - id: C1
      check: current branch NOT IN [main, master, develop]
      halt_message: "Protected branch — PRs cannot be created from a protected branch"
    - id: C2
      check: branch has unpushed commits vs target
      halt_message: "No commits to push — create commits before creating a PR"
    - id: C3
      check: no merge conflicts between branch and target
      halt_message: "Branch conflicts with target — resolve conflicts before creating a PR"
    - id: C4
      check: issue number extractable from branch name (NWWI)
      halt_message: "No issue number extractable from branch name — PRs require traceability to a GitHub issue"

  behavioral:
    - id: C5
      rule: "Always checkpoint before PR creation — PRs are externally visible"
    - id: C6
      rule: "Quality checklist MUST distinguish must-have (blocking) from nice-to-have items"
    - id: C7
      rule: "Orchestrator MUST delegate to agents — never execute gh commands directly"
    - id: C8
      rule: "Maximum 1 distinct agent (repo-orchestrator); may be called multiple times"
    - id: C9
      rule: "Recovery agent calls are exempt from the agent limit"

failure_conditions:
  - No issue number extractable from the current branch name
  - No commits to push (branch has no unpushed commits vs target)
  - Branch conflicts with target branch (merge conflicts detected)
  - User rejects proposed PR at checkpoint (Vanish)
  - Blocking quality checklist items have FAIL status
  - PR creation fails on the remote
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

**Agent boundaries:**
- `repo-orchestrator` — git domain only: analyzes PR readiness, creates pull requests
- Everything else (checkpoint writes, approval logic, artifact writes, reporting) — orchestrator owns it

## Phases

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | repo-orchestrator |
| Step 1 | Analyze | repo-orchestrator |
| Step 2 | Checkpoint | orchestrator |
| Step 3 | Execute | repo-orchestrator |
| Step 4 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

Invoke `repo-orchestrator` to check PR preconditions.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Verify preconditions before creating a pull request"
  task: "Check all of the following and return pass/fail for each. Do NOT halt — just return results."
  checks:
    C1: "Is the current branch NOT main, master, or develop?"
    C2: "Does the current branch have unpushed commits vs the target branch?"
    C3: "Are there no merge conflicts between the current branch and the target branch?"
    C4: "Is there an issue number extractable from the current branch name?"
```

**Expected output:**
```yaml
pre_flight:
  branch: {current_branch_name}
  target: {target_branch_name}
  issue_number: {integer | null}
  C1: PASS | FAIL
  C2: PASS | FAIL
  C3: PASS | FAIL
  C4: PASS | FAIL
```

Pre-flight failures are **hard halts** — these are environmental conditions the agent cannot fix. See Recovery for all other failures.

### Step 1 — Analyze

Invoke `repo-orchestrator` to run the `analyze-pr` skill.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Analyze PR readiness with evidence-based quality checklist distinguishing blocking from optional items"
  task: "Analyze the current branch vs target. Generate quality checklist distinguishing blocking (must-have) from optional (nice-to-have) items. Return structured output only — do NOT create the PR."
  branch: {current_branch_name}
  target: {target_branch_name}
  pre_flight:
    C1: PASS
    C2: PASS
    C3: PASS
    C4: PASS
  behavioral_constraints:
    - C5: "Always checkpoint before PR creation — PRs are externally visible"
    - C6: "Quality checklist MUST distinguish must-have (blocking) from nice-to-have items"
```

**Expected output:**
```yaml
analysis:
  branch: {branch_name}
  base: {base_branch}
  suggested_title: "{conventional commit title}"
  context:
    file_patterns_matched: [list]
    commit_types: [list]
  checklist:
    must_have:
      - item: "{description}"
        trigger: "{why}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{details}"
    nice_to_have:
      - item: "{description}"
        trigger: "{why}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{details}"
  blocking_issues: [list]
  ready: true/false
```

If agent returns structured failure → see Recovery section.

### Step 2 — Checkpoint

**The orchestrator owns this step entirely. Do not delegate.**

Extract issue number from `pre_flight.issue_number` (already validated Step 0 C4: PASS).

Write checkpoint artifact to STM: `.phoenix-os/{issue-number}/checkpoint/create-pr/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

Present the approval prompt using `templates/approval-prompt.md`. Checklist blocking items with `status: FAIL` are visible to the user here — they can Vanish to abort or Tether to proceed knowing the risks.

Parse: `Tether`/`tether` → proceed to Step 3. `Vanish`/`vanish` → halt. Else → clarify.

**After user responds**, update the checkpoint artifact:
1. Set `Status` to `APPROVED` or `REJECTED`
2. Mark `Checkpoint approval` task as `completed`
3. Advance `Step` to `3 of 4`

### Step 3 — Execute

Invoke `repo-orchestrator` to run the `submit-pr` skill.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Create pull request with quality checklist and issue link"
  task: "Create a PR from the current branch to the target branch. Include quality checklist from analysis in the PR body. Include issue link. Return PR details."
  issue_number: {issue-number}
  branch: {current_branch_name}
  target: {target_branch_name}
  checklist: {analysis.checklist}
  checkpoint_approved: true
```

**Expected output:**
```yaml
result:
  success: true/false
  error: "{error message if success is false}"
  pr:
    number: {number}
    url: "{url}"
    state: "{open|draft}"
    title: "{title}"
  checklist:
    required_count: {count}
    optional_count: {count}
```

If `result.success: false` → see Recovery section. Max 1 retry.

### Step 4 — Report

**The orchestrator owns this step entirely. Do not delegate.**

Present the final report using `templates/final-report.md`.

**After reporting**, update the checkpoint artifact:
1. Mark all remaining tasks (`Create pull request`, `Report`) as `completed`
2. Set `Step` to `4 of 4`

## Recovery

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + original intent
- Max 1 retry per step. After that, halt with full failure context.

For retries, add to recipe context:
```yaml
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

**Pre-flight failures (C1–C4) are not recoverable** — hard halt with the constraint's `halt_message`.

## References

| Template | Path | Used For |
|----------|------|----------|
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/create-pr/{ts}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation |
| Final Report | `templates/final-report.md` | Post-PR creation summary |

### Status Emoji Mapping

| Status | Emoji |
|--------|-------|
| PASS | ✅ |
| FAIL | ❌ |
| REVIEW | ⏳ |

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 1 (repo-orchestrator) |
| Checkpoint | Always |
