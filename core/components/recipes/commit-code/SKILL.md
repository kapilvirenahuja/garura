---
name: commit-code
description: Commit code changes grouped by issue type with conventional messages
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# commit-code

## Intent

```yaml
intent: "Safely persist completed work as conventional commits with full traceability to a tracked issue"

constraints:
  pre_flight:
    - id: C1
      check: current branch NOT IN [main, master, develop]
      halt_message: "Protected branch — commits are not allowed on this branch"
    - id: C2
      check: uncommitted changes exist
      halt_message: "Nothing to commit — working tree is clean"

  behavioral:
    - id: C3
      rule: "Analyze and group changes by concern before creating commits"
    - id: C4
      rule: "Every commit must trace to a valid GitHub issue (NWWI)"
    - id: C5
      rule: "Conventional commit format: type(scope): subject — one type per commit"
    - id: C6
      rule: "Sensitive files (credentials, secrets, env) require explicit human approval before staging"
    - id: C7
      rule: "Orchestrator MUST delegate to agents — never execute git commands directly"
    - id: C8
      rule: "Maximum 2 distinct agents (repo-orchestrator, project-orchestrator); recovery calls exempt"

failure_conditions:
  - Current branch is a protected branch (main, master, develop)
  - No valid issue ID resolvable from branch name or user input
  - User rejects proposed commits at checkpoint (Vanish)
  - Working tree is not clean after commit execution
  - Commit does not pass conventional format validation
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands.

**Agent boundaries:**
- `repo-orchestrator` — git domain only: reads state, analyzes changes, creates commits
- `project-orchestrator` — issue domain only: resolves issue IDs
- Everything else (checkpoint writes, approval logic, artifact writes, reporting) — orchestrator owns it

## Phases

| Phase | Step | Agent |
|-------|------|-------|
| PRE-FLIGHT | Step 0 | repo-orchestrator |
| PRE-EXECUTION: Analyze | Step 1 | repo-orchestrator |
| PRE-EXECUTION: Resolve Issue | Step 2 | project-orchestrator |
| CHECKPOINT | Step 3 | orchestrator |
| EXECUTE | Step 4 | repo-orchestrator |
| REPORT | Step 5 | orchestrator |

## Workflow

### Step 0 — PRE-FLIGHT

Invoke `repo-orchestrator` to check current branch name and whether uncommitted changes exist.

**C1:** Halt if branch is `main`, `master`, or `develop` — output halt_message, exit.
**C2:** Halt if working tree is clean — output halt_message, exit.

Pass pre-flight results forward:
```
pre_flight:
  C1: PASS | FAIL
  C2: PASS | FAIL
```

### Step 1 — PRE-EXECUTION: Analyze

Invoke `repo-orchestrator` to run the `analyze-changes` skill.

Provide recipe context:
```
---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  pre_flight:
    C1: PASS
    C2: PASS
  task: "Analyze uncommitted changes. Group by concern. Identify risks. Return structured output only — do NOT create commits."
  behavioral_constraints:
    - C3: "Analyze and group changes by concern before creating commits"
    - C5: "Conventional commit format: type(scope): subject — one type per commit"
    - C6: "Sensitive files require explicit human approval before staging"
```

**Expected output from agent:**
```yaml
analysis:
  branch: {branch_name}
  issue_number: {number_from_branch_or_null}
  checkpoint_needed: true|false
  checkpoint_reason: "{reason}"
  groups:
    - type: {feat|fix|refactor|docs|test|chore}
      scope: {component}
      subject: {description}
      files: [list]
  risks:
    sensitive_files: [list]
    breaking_changes: [list]
    ambiguous_types: [list]
```

### Step 2 — PRE-EXECUTION: Resolve Issue (NWWI)

If `analysis.issue_number` is null, invoke `project-orchestrator` to resolve a valid issue ID from the branch name or halt.

Provide recipe context:
```
---
Recipe context:
  intent: "Resolve issue ID for commit traceability (NWWI)"
  task: "Extract or resolve a GitHub issue number from the current branch name. Return issue number only."
  branch: {branch_name}
```

**Expected output:**
```yaml
issue:
  number: {integer}
  title: {string}
```

If no issue is resolvable → halt with: "No valid issue ID resolvable — commits require traceability to a GitHub issue."

### Step 3 — CHECKPOINT

**The orchestrator owns this step entirely. Do not delegate.**

#### Write STM artifact

Write to `.phoenix-os/{issue}/checkpoint/commit-code/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md`.
Status: `PENDING_APPROVAL`.

#### Auto-approve decision

**Auto-approve when ALL:**
- Single logical group
- No sensitive files
- No breaking changes
- Clear, unambiguous commit type
- NOT a `hotfix/*` branch

**Require user approval when ANY:**
- Multiple logical groups
- Sensitive files present
- Breaking changes detected
- Ambiguous or mixed commit types
- Branch is `hotfix/*` or `hotfix-*`

#### If approval required

Present approval prompt using `templates/approval-prompt.md`.

Parse response: `Tether`/`tether` → proceed to Step 4. `Vanish`/`vanish` → update artifact Status to REJECTED, halt. Anything else → clarify.

Update STM artifact Status to `APPROVED` before proceeding.

### Step 4 — EXECUTE

Invoke `repo-orchestrator` once per approved commit group — sequentially, in dependency order.

Provide recipe context per invocation:
```
---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  pre_flight:
    C1: PASS
    C2: PASS
  task: "Create a single commit for the specified group only. Stage only the listed files."
  issue_number: {number}
  commit:
    type: {type}
    scope: {scope}
    subject: {subject}
    files: [list]
  behavioral_constraints:
    - C5: "Conventional commit format: type(scope): subject — one type per commit"
    - C6: "Sensitive files require explicit human approval before staging"
```

**Expected output per commit:**
```yaml
result:
  success: true|false
  commit:
    hash: {sha}
    message: {full conventional message}
  validation:
    clean_tree: true|false
    conventional_format: true|false
```

If `success: false` → invoke recovery (see Recovery section). Max 2 retries per commit.

### Step 5 — REPORT

**The orchestrator owns this step entirely. Do not delegate.**

Verify working tree is clean (invoke `repo-orchestrator` for final status check).

Write final summary to `.phoenix-os/{issue}/checkpoint/commit-code/{same-timestamp}.md` — append commits section.

Present commit summary to user using `templates/commit-summary.md`.

## Recovery

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + the original intent
- Max 2 retry cycles per agent. After that, HALT with full failure context.

For retries, add to recipe context:
```
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

## References

| Template | Path | Used For |
|----------|------|----------|
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/commit-code/{YYYYMMDD-HHMMSS}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation |
| Commit Summary | `templates/commit-summary.md` | Final report after execution |

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 2 (repo-orchestrator, project-orchestrator) |
| Checkpoint | Conditional |
