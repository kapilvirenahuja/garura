# Agent Recovery Section Templates

## Template: Orchestrator (Full Recovery)

Use for: repo-orchestrator, project-orchestrator

```markdown
## Memory

Load practices from `~/.meridian/core/memory/practices/` as needed:
- `intent-driven-recovery.md` — Recovery reasoning loop
- `structured-failure-protocol.md` — Structured failure return format
- {domain-specific practices}

## Recovery

### Intent Awareness

When invoked by a play, you may receive intent context:
- **Intent**: The play's goal — use this to make better decisions
- **Constraints**: Boundaries to respect — use this to avoid violations
- **Retry context**: If this is a retry, what failed before and what was fixed

### Self-Recovery (Within Domain)

When a skill invocation fails and the obstacle is within your domain:

1. Assess: Can I fix this with an alternate skill or approach?
2. Attempt fix (max 2 attempts per obstacle)
3. Retry the original operation
4. If still failing after 2 attempts, escalate

**Examples:**
{domain-specific examples}

### Escalation (Outside Domain)

When the obstacle is outside your domain, return a structured failure per `structured-failure-protocol.md`:

\```yaml
failure:
  what_failed: "{operation}"
  why: "{root cause}"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "{domain}"
    suggested_agent: "{agent, if known}"
  context:
    intent_received: "{from play context}"
    constraint_violated: "{if applicable}"
    self_recovery_attempted: true|false
    self_recovery_details: "{what was tried}"
  suggested_fix: "{recommendation}"
\```

Do NOT return raw errors. Always return structured failures so the play can route the fix.
```

## Template: Builder (Limited Recovery)

Use for: code-builder

```markdown
## Memory

Load practices from `~/.meridian/core/memory/practices/` when referenced:
- `structured-failure-protocol.md` — Structured failure return format

## Recovery

### Intent Awareness

When invoked by a play, you may receive intent context. Use it to:
- Understand WHY you're making these changes (not just what)
- Construct meaningful failure reports if you get stuck

### Self-Recovery (Limited)

You may attempt limited self-recovery ONLY within the boundaries of the execution plan:
- Fix syntax errors you introduced
- Adjust import paths if the target exists elsewhere
- Retry a failed test once after fixing obvious issues

You MUST NOT:
- Redesign the solution
- Change the approach
- Add unplanned work

Max 1 self-recovery attempt. If it doesn't work, escalate.

### Escalation

When blocked by something outside the plan's scope, return a structured failure per `structured-failure-protocol.md`. Common escalation scenarios:
- Design gap in the execution plan → `suggested_agent: "tech-designer"`
- Missing dependency or infrastructure → `responsible_domain: "infrastructure"`
- Test failures you can't diagnose → include full error output in `why`
```

## Template: Designer (Moderate Recovery)

Use for: tech-designer

```markdown
## Memory

Load practices from `~/.meridian/core/memory/practices/` when referenced:
- `structured-failure-protocol.md` — Structured failure return format

## Recovery

### Intent Awareness

When invoked by a play, you may receive intent context. Use it to:
- Focus analysis on what matters for the play's goal
- Explore alternate angles if the initial approach doesn't yield results

### Self-Recovery (Moderate)

You may adjust your analysis approach when initial exploration fails:
- Broaden search patterns if initial grep/glob finds nothing
- Try alternate entry points into the dependency chain
- Explore different code paths if the expected path doesn't exist
- Revisit assumptions if evidence contradicts them

Max 2 self-recovery attempts per analysis obstacle.

### Escalation

When the codebase state doesn't match expectations and you've exhausted alternate analysis paths, return a structured failure per `structured-failure-protocol.md`. Common scenarios:
- Expected module/file doesn't exist → include what you found instead
- Architecture doesn't match documentation → include evidence of actual structure
- Need runtime data you can't access (logs, metrics) → specify what data is needed
```
