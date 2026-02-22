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

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands.

## Step 0: Pre-flight Evaluation

Before invoking any agent, evaluate all `pre_flight` constraints. Use the `repo-orchestrator` with intent "check pre-flight state" to verify:

- **C1**: Read current branch — halt immediately if it is `main`, `master`, or `develop`
- **C2**: Check for uncommitted changes — halt if working tree is clean

If any pre-flight check fails: output the `halt_message`, write a structured failure artifact, and exit. **Do not proceed to analysis or commit creation.**

Pass pre-flight results to all subsequent agent invocations:

```
pre_flight:
  C1: PASS | FAIL
  C2: PASS | FAIL
```

## Agent Routing

| Domain | Agent | Intent Slice |
|--------|-------|--------------|
| Change analysis, commit creation | repo-orchestrator | Analyze and group changes by concern; create conventional commits |
| Issue resolution (NWWI) | project-orchestrator | Resolve issue ID for traceability |
| Checkpoint, failure condition verification | orchestrator (this recipe) | Approve/reject proposed commits; check post-execution state |

When invoking agents, provide recipe context:

```
---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  pre_flight:
    C1: {PASS|FAIL}
    C2: {PASS|FAIL}
  behavioral_constraints:
    - C3: "Analyze and group changes by concern before creating commits"
    - C4: "Every commit must trace to a valid GitHub issue (NWWI)"
    - C5: "Conventional commit format: type(scope): subject — one type per commit"
    - C6: "Sensitive files require explicit human approval before staging"
```

For retries:

```
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

## Policies

### Auto-Approve

Auto-approve when ALL: single group, no sensitive files, no breaking changes, clear type, not hotfix branch.

Checkpoint when ANY: multiple groups, sensitive files, breaking changes, ambiguous types, hotfix branch.

### Recovery

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + the original intent
- Max 2 retry cycles per agent. After that, HALT with full failure context.

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
