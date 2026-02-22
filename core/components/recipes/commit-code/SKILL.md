---
name: commit-code
description: Commit code changes grouped by issue type with conventional messages
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet

intent: >
  Safely persist completed work as conventional commits with full traceability
  to a tracked issue.

constraints:
  - Changes must be analyzed and grouped by concern before commits are created
  - Every commit must trace to a valid GitHub issue (NWWI)
  - User must approve proposed commits before execution (unless auto-approve criteria met)
  - Commits must use conventional commit format (type(scope): subject), one type per commit
  - MUST NOT commit on protected branches (main, master, develop)
  - Sensitive files (credentials, secrets, env) require explicit human approval
  - Orchestrator MUST delegate to agents — never execute git commands directly
  - Maximum 2 distinct agents (repo-orchestrator, project-orchestrator); each may be called multiple times
  - Recovery agent calls are exempt from the agent limit

failure_conditions:
  - Current branch is a protected branch (main, master, develop)
  - No valid issue ID resolvable from branch name or user input
  - User rejects proposed commits at checkpoint (Vanish)
  - Working tree is not clean after commit execution
  - Commit does not pass conventional format validation
---

# commit-code

Safely persist completed work as conventional commits with full traceability.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands.

If no uncommitted changes exist, report "nothing to commit" and exit.

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
  constraints: ["{relevant constraints for this agent's task}"]
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
