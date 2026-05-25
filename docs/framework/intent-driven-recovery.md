# Intent-Driven Recovery

**Recovery is one concept: how to continue, directionally, toward the intent's end state when something blocks the way.** Intent declares the constrained end state; recovery is the directional answer to "how do we keep going to reach it." It applies at every level — an agent that can't complete a step, an output that fails its evals, a constraint that's been hit — but the core question is always the same: *how does an agent recover to meet the intent?*

Recovery is one of the two parts of the **Expectation** layer (the other is success scenarios). For every failure condition in the Intent, recovery says how to get back to a good state. Recovery conditions are **generated** from Intent + Context and **vetted at a human checkpoint** alongside the rest of Expectation — they are not hand-authored into Intent, and they are not invented from scratch at runtime.

At runtime, recovery is the **validator's** instrument. When the evals surface a failure, the validator reads the matching recovery condition and the eval results and produces a *recovery handoff plan*: directional guidance toward a better state — not an implementation. "Unit tests are at 50%; here are the failing ones; raise them to green." The plan also carries the routing call the recovery condition declared: loop the fix back to the builder autonomously, or escalate to a human for manual review.

## What is declared vs. derived

| Declared (generated into Expectation, vetted) | Derived at runtime (by the validator) |
|-----------------------------------------------|----------------------------------------|
| Per failure condition: the recovery policy — the direction to push toward, and the handoff target (autonomous fix vs. human review) | The concrete recovery handoff plan for this run — which evals failed, the specific directional guidance, whether this instance loops or escalates |
| Whether a path is `derivable_at_l4` (safe for autonomous execution) | The actual plan `intent-resolver` executes at Level 4 |

Goal, constraints, and failure conditions still come from Intent. What changed from the earlier model: recovery is no longer purely derived ad hoc — its policy is authored (generated + vetted) up front, so the validator's runtime plan is bounded by a reviewed contract.

## The recovery loop

```
Eval fails (a failure condition is observable in the output)
    │
    ├── Validator reads the matching recovery condition + eval results
    ├── Validator builds a recovery handoff plan (directional, not code)
    │
    ├── handoff = autonomous → plan goes back to the BUILDER as direction;
    │                          builder fixes; re-run evals; loop until success
    │
    └── handoff = human → plan goes to a human for manual review / decision
```

At **Level 4 autonomy**, the autonomous branch runs without a human in the loop — `intent-resolver` consumes the recovery conditions and drives the fix loop directly. At lower autonomy, even the autonomous branch may pause at a checkpoint.

### The autonomous-fix branch (execution mechanics)

When a recovery condition routes to `autonomous`, the fix loop runs on the mechanism that already exists:
- The blocked agent returns a **structured failure** (`what_failed`, `why`, `domain_assessment.responsible_domain`, `suggested_fix`) — see `structured-failure-protocol.md`.
- The play routes the recovery handoff to the **responsible domain agent** named in that failure.
- Retry is bounded: **max 2 attempts** per obstacle. Recovery calls are exempt from a play's agent-count limit. If still failing after 2, the branch escalates to `human`.

This is the same loop the older "Recovery Protocol" described — it is now the execution arm of recovery's autonomous branch, not a separate concept.

## Principles

| Principle | Rule |
|-----------|------|
| **Intent-first** | Recovery serves the declared intent, not a prescribed procedure |
| **Constraint-respecting** | Recovery must satisfy ALL constraints — never bypass them |
| **Generated then vetted** | Recovery conditions are generated into Expectation and approved at a human checkpoint before they govern anything |
| **Validator-built** | The runtime recovery handoff plan is built by the validator from recovery conditions + eval results — directional, not implementation |
| **Routed** | Each recovery condition declares its handoff: autonomous fix back to the builder, or human manual review |
| **Skill-delegated** | Recovery actions delegate to existing skills and agents |

## Recovery handoff plan format

When the validator emits a recovery handoff plan, it carries:

```markdown
## Recovery handoff — {failure, in symptom terms}

**Symptom:** {what the output does wrong — e.g. "unit tests at 50%, 12 failing"}
**Direction:** {how to get to a better state — not the implementation}
**Detail:** {the specifics — e.g. the failing-test list}
**Handoff:** autonomous (back to builder) | human (manual review)

---

(autonomous) → builder fixes and re-runs; loop until success scenarios pass.
(human) → Type Tether to take the manual path, or Vanish to halt.
```

The plan describes symptoms and direction, never failure-condition IDs or eval internals — preserving the barrier (P4) when it is on.
