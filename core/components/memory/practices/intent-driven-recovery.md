# Intent-Driven Recovery

When a failure condition is triggered during recipe execution, DO NOT halt immediately. Follow the recovery reasoning loop.

## Recovery Reasoning Loop

```
Failure condition triggered
    │
    ├── Read intent: "What am I trying to achieve?"
    ├── Read constraint violated: "What boundary was hit?"
    ├── Assess: "Can I satisfy this constraint through another path?"
    │
    ├── YES → Propose recovery (with checkpoint approval)
    │         User approves (Tether) → Execute recovery → Continue workflow
    │         User rejects (Vanish) → HALT
    │
    └── NO → HALT (intent is unreachable)
```

## Principles

| Principle | Rule |
|-----------|------|
| **Intent-first** | Recovery serves the declared intent, not a prescribed procedure |
| **Constraint-respecting** | Recovery must satisfy ALL constraints — never bypass them |
| **Agent-reasoned** | Recovery paths are derived at runtime, not hardcoded in recipes |
| **Checkpoint-gated** | Recovery always requires user approval before execution |
| **Skill-delegated** | Recovery actions delegate to existing skills and agents |

## How to Reason

The Three Elements of Intent are your inputs:

- **Intent** → WHAT to achieve. The goal doesn't change because of an obstacle.
- **Constraints** → WHERE the boundaries are. Recovery must find a path within them.
- **Failure conditions** → WHEN to start recovery reasoning. They are triggers, not stop signs.

## What You Declare vs. What You Derive

| Recipe declares (static) | You derive (dynamic) |
|--------------------------|----------------------|
| Intent — the outcome | Whether the intent is still achievable |
| Constraints — the boundaries | Which constraint is blocking and how to satisfy it |
| Failure conditions — the triggers | Whether recovery is possible and what it looks like |

## Recovery Checkpoint Format

When proposing recovery, present it as:

```markdown
## Recovery: {what you're doing}

**Failure detected:** {which failure condition triggered}
**Intent preserved:** {the declared intent}
**Recovery path:** {what you propose to do}

| Attribute | Value |
|-----------|-------|
| {relevant context} | {value} |

---

Type **Tether** to proceed with recovery or **Vanish** to cancel.
```
