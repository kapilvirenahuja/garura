# Intent Propagation Template

## Standard Pattern

When a recipe invokes an agent, append this block to the invocation prompt:

```
---
Recipe context:
  intent: "{recipe's declared intent}"
  constraints: ["{relevant constraints for this agent's task}"]
```

## Retry Pattern

When retrying an agent after a cross-domain fix, append:

```
---
Recipe context:
  intent: "{recipe's declared intent}"
  constraints: ["{relevant constraints}"]
  retry:
    previous_failure: "{what_failed from the structured failure}"
    fix_applied: "{what Agent B did to fix the prerequisite}"
    attempt: {2|3}
```

## Rules

- Keep it concise — only include constraints relevant to the agent's current task
- Do NOT dump the entire recipe's constraint list
- For retries, always include what was tried before so the agent doesn't repeat it
- The agent reads this context to make better decisions and to construct meaningful structured failures if it needs to escalate

## Example: commit-code → repo-orchestrator

```
Analyze all uncommitted changes in the repository.

---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  constraints: ["MUST NOT commit on protected branches", "Conventional commit format required"]
```

## Example: commit-code → project-orchestrator (retry)

```
Search for a matching GitHub issue for these changes: {change summary}

---
Recipe context:
  intent: "Safely persist completed work as conventional commits with traceability"
  constraints: ["All commits MUST reference a valid GitHub issue"]
  retry:
    previous_failure: "No issue found matching keywords 'auth refactor'"
    fix_applied: "Broadened search to include closed issues"
    attempt: 2
```
