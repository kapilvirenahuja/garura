# Structured Failure Protocol

When you encounter an obstacle you cannot resolve within your domain, return a structured failure to the caller. DO NOT return raw errors or unstructured messages.

## When to Self-Recover vs. Escalate

```
Obstacle encountered
    │
    ├── Is this within my domain?
    │     ├── YES → Attempt self-recovery (max 2 attempts)
    │     │         ├── Success → Continue normally
    │     │         └── Failed → Escalate (structured failure)
    │     │
    │     └── NO → Escalate immediately (structured failure)
    │
    └── Return structured failure to caller
```

**Within your domain** means you have the skills, tools, and authority to fix it.
**Outside your domain** means another agent or the play must handle it.

## Structured Failure Format

```yaml
failure:
  what_failed: "{operation that failed}"
  why: "{root cause or best assessment}"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "{which domain can fix this}"
    suggested_agent: "{agent name, if known}"
  context:
    intent_received: "{the intent passed by the caller}"
    constraint_violated: "{if applicable}"
    self_recovery_attempted: true|false
    self_recovery_details: "{what was tried, if any}"
  suggested_fix: "{what you think would resolve this}"
```

## Field Guide

| Field | Required | Description |
|-------|----------|-------------|
| `what_failed` | Yes | The specific operation or skill that failed |
| `why` | Yes | Root cause. Be specific — "file not found" not "error occurred" |
| `domain_assessment.within_my_domain` | Yes | Did you try to fix it yourself? |
| `domain_assessment.responsible_domain` | Yes | Which domain owns the fix: `implementation`, `design`, `repository`, `project`, `infrastructure` |
| `domain_assessment.suggested_agent` | No | Agent name if you know who can fix it |
| `context.intent_received` | Yes | The intent from the play — helps the caller reason about recovery |
| `context.constraint_violated` | No | If the failure relates to a constraint |
| `context.self_recovery_attempted` | Yes | Whether you tried to fix it yourself first |
| `context.self_recovery_details` | No | What you tried, so the caller doesn't retry the same thing |
| `suggested_fix` | Yes | Your best guess at what would resolve this |

## Examples by Agent Role

### Orchestrator (repo-orchestrator, project-orchestrator)

```yaml
# Self-recovery succeeded — no failure returned
# repo-orchestrator: create-commit fails because nothing staged
# → Stages files, retries create-commit → succeeds

# Self-recovery failed — escalate
failure:
  what_failed: "git push to origin"
  why: "Remote branch has diverged — push rejected (non-fast-forward)"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "repository"
    suggested_agent: null
  context:
    intent_received: "Push feature branch to origin"
    constraint_violated: "NEVER force push"
    self_recovery_attempted: true
    self_recovery_details: "Checked remote state — remote has 2 commits not in local"
  suggested_fix: "Pull and rebase, or play should decide merge strategy"
```

### Builder (code-builder)

```yaml
# Escalate — design gap
failure:
  what_failed: "Implement step 3: add validation to form"
  why: "Execution plan says 'add validation per design spec' but no validation rules specified"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "design"
    suggested_agent: "tech-designer"
  context:
    intent_received: "Implement all changes per execution plan"
    self_recovery_attempted: false
    self_recovery_details: null
  suggested_fix: "tech-designer needs to specify validation rules before implementation can proceed"
```

### Designer (tech-designer)

```yaml
# Escalate — unexpected codebase state
failure:
  what_failed: "Analyze authentication module"
  why: "Expected auth module at src/auth/ per config — directory does not exist"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "project"
    suggested_agent: null
  context:
    intent_received: "Design approach for OAuth integration"
    self_recovery_attempted: true
    self_recovery_details: "Searched for auth patterns across codebase — found references in src/middleware/auth.js but no dedicated module"
  suggested_fix: "Clarify project structure — auth may live in middleware, not a standalone module"
```

## Retry Awareness

When you are invoked again after a previous failure (retry), the caller may include:
- The previous structured failure
- Additional context or fixes applied by another agent

Use this context to adjust your approach. Do NOT repeat the same failed approach.

## Limits

- **Max 2 self-recovery attempts** per obstacle before escalating
- If retried by the caller and you fail again on the same obstacle, escalate immediately — do not attempt self-recovery a third time
