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

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C4), behavioral constraints (C5–C9), and failure conditions. All constraint IDs referenced in this recipe map to that file.

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
  task: "Read `reference/intent.yaml`. Run every check in `constraints.pre_flight`. Return pass/fail for each. Do NOT halt — just return results."
```

**Expected output:**
```yaml
pre_flight:
  branch: {current_branch_name}
  target: {target_branch_name}
  issue_number: {integer | null}
  results: [{id: C1, status: PASS|FAIL}, ...]  # one entry per constraint in intent.yaml
```

**Orchestrator validates results:** for any result with `status: FAIL`, halt immediately with that constraint's `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts** — these are environmental conditions the agent cannot fix. See Recovery for all other failures.

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
  pre_flight: {all results from Step 0}
  behavioral_constraints: {all behavioral constraints from reference/intent.yaml}
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

Extract issue number from `pre_flight.issue_number` (already validated in Step 0).

**If recipe context includes `ship_context.auto_approve: true` AND all `checklist.must_have` items have `status` of `PASS` or `REVIEW` (none are `FAIL`) AND `analysis.blocking_issues` is empty:** Write checkpoint artifact with Status: `AUTO_APPROVED`. Proceed directly to Step 3 without presenting the approval prompt to the user.

**If `ship_context.auto_approve: true` is set but quality conditions do NOT hold** (any `must_have.status == FAIL` or `blocking_issues` non-empty): fall through to C5 enforcement — present approval prompt as normal. The auto-approve bypass does not override blocker-grade findings.

Write checkpoint artifact to STM: `.meridian/{issue-number}/checkpoint/create-pr/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

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

If `result.success: false` → see Recovery section. Max 2 retries.

### Step 4 — Report

**The orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.meridian/{issue-number}/evidence/create-pr/{YYYYMMDD-HHMMSS}.md`:
- Issue number and branch
- PR number, URL, title, and state
- Quality checklist summary (must-have count, nice-to-have count, any FAIL items)
- Base and head branches

Present the final report using `templates/final-report.md`.

**After reporting**, update the checkpoint artifact:
1. Mark all remaining tasks (`Create pull request`, `Report`) as `completed`
2. Set `Step` to `4 of 4`

**After updating checkpoint**, invoke `repo-orchestrator` to commit the evidence and checkpoint files:

```yaml
---
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files with message 'chore(stm): record evidence for #{issue_number}'. Do not stage any other files."
  files:
    - ".meridian/{issue-number}/evidence/create-pr/{same-timestamp}.md"
    - ".meridian/{issue-number}/checkpoint/create-pr/{same-timestamp}.md"
  commit_message: "chore(stm): record evidence for #{issue_number}"
```

**Non-blocking:** if `repo-orchestrator` returns failure or `committed: false`, log as warning — do NOT halt.

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + original intent
- Max 2 retries per step. After that, halt with full failure context.

For retries, add to recipe context:
```yaml
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

**Pre-flight failures (C1–C4) are not recoverable** — hard halt with the constraint's `halt_message`.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.meridian/{issue}/checkpoint/create-pr/{ts}.md` |
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
| Version | 1.1.0 |
| Distinct Agents | 1 (repo-orchestrator) |
| Checkpoint | Always (C5) — overrideable by L2 orchestration context when quality is clean (no must_have FAIL, no blocking issues) |
