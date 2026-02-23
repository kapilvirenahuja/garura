---
name: commit-code
description: Commit code changes grouped by issue type with conventional messages
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# commit-code

Commit code changes grouped by issue type with conventional commit messages.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C2), behavioral constraints (C3–C8), and failure conditions. All constraint IDs referenced in this recipe map to that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

**Agent boundaries:**
- `repo-orchestrator` — git domain only: reads state, analyzes changes, creates commits
- `project-orchestrator` — issue domain only: resolves issue IDs
- Everything else (checkpoint writes, approval logic, artifact writes, reporting) — orchestrator owns it

## Phases

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | repo-orchestrator |
| Step 1 | Analyze | repo-orchestrator |
| Step 2 | Resolve Issue | project-orchestrator |
| Step 3 | Checkpoint | orchestrator |
| Step 4 | Execute | repo-orchestrator |
| Step 5 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

Invoke `repo-orchestrator` to check commit preconditions.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Verify preconditions before committing code"
  task: "Read `reference/intent.yaml`. Run every check in `constraints.pre_flight`. Return pass/fail for each. Do NOT halt — just return results."
```

**Expected output:**
```yaml
pre_flight:
  branch: {current_branch_name}
  results: [{id: C1, status: PASS|FAIL}, {id: C2, status: PASS|FAIL}]
```

**Orchestrator validates results:** for any result with `status: FAIL`, halt immediately with that constraint's `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts** — these are environmental conditions the agent cannot fix.

### Step 1 — Analyze

Invoke `repo-orchestrator` to run the `analyze-changes` skill.

Provide recipe context:
```yaml
---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  pre_flight:
    C1: PASS
    C2: PASS
  task: "Analyze uncommitted changes. Group by concern. Identify risks. Return structured output only — do NOT create commits."
  behavioral_constraints: {behavioral constraints C3, C5, C6 from reference/intent.yaml}
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

### Step 2 — Resolve Issue (NWWI)

If `analysis.issue_number` is null, invoke `project-orchestrator` to resolve a valid issue ID from the branch name or halt.

Provide recipe context:
```yaml
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

### Step 3 — Checkpoint

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

### Step 4 — Execute

Invoke `repo-orchestrator` once per approved commit group — sequentially, in dependency order.

Provide recipe context per invocation:
```yaml
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
  behavioral_constraints: {behavioral constraints C5, C6 from reference/intent.yaml}
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

### Step 5 — Report

**The orchestrator owns this step entirely. Do not delegate.**

Verify working tree is clean (invoke `repo-orchestrator` for final status check).

Update checkpoint artifact `.phoenix-os/{issue}/checkpoint/commit-code/{same-timestamp}.md` — append commits created with hashes and status.

Write evidence to `.phoenix-os/{issue}/evidence/commit-code/{YYYYMMDD-HHMMSS}.md`:
- Issue number and branch
- Each commit: hash, message, files
- Validation: clean tree, conventional format

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

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
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
