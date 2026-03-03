# Guardian Decision: {step_name}

## Decision

**{AUTO-APPROVE | HALT}**

## Step

{step_number} — {step_name}

## Reason

{One-sentence rationale for the decision.}

## Evidence Summary

| Factor | Value |
|--------|-------|
| must_have_fail | {count} |
| blocking_issues | {list or "none"} |
| ci_status | {passing\|failing\|pending\|n_a} |
| merge_conflicts | {yes\|no\|n_a} |
| pr_status | {open\|draft\|merged\|n_a} |

## Blockers
<!-- Only present when Decision is HALT -->

| Blocker | Severity |
|---------|----------|
| {description} | {blocker\|warning} |

## Self-Resolution Attempted

{What was tried, e.g. "Attempted rebase — still conflicted" or "None attempted"}

---
<!-- Only present when Decision is HALT -->

## Action Required

The `/ship` recipe has halted. Intent is preserved — no destructive actions were taken.

**Completed steps:** {list of completed steps}
**Failed at:** Step {N} — {step_name}
**Reason:** {blocker description}

Type **Tether** to {action, e.g. "retry merge after resolving conflicts manually"} or **Vanish** to cancel (branch preserved, no merge).
