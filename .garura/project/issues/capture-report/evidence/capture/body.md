| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Date** | 2026-05-30 |

### Problem

`/prepare` currently slices an epic into more milestones than the work warrants. Each milestone is a human-acceptance stop in the downstream flow — `/implement` halts at every milestone and `/validate` runs a human-gated acceptance pass per milestone. So every extra milestone buys an extra human checkpoint, whether or not a person actually needs to look at that point.

The user wants `/prepare` to produce just enough milestones for the epic: a milestone should exist only where there is a true need for human validation. Internal sequencing of the work does not, on its own, justify a milestone.

The guiding principle: a milestone is a human-validation checkpoint, not a unit of work breakdown. Cut milestones at the points where a human genuinely must accept something before the work continues — nowhere else.

### Expected Behavior

When `/prepare` builds the plan for an epic, it produces the minimal set of milestones — ideally one for a straightforward epic — adding more only at points that genuinely require human validation. The plan should not manufacture a milestone per feature phase or per internal step by default.

### Impact

This is an intent-level change to the prepare play and how it authors the plan / milestone breakdown. It must go through `prepare/reference/intent.yaml` and a `/create-play --build prepare` rebuild, not a hand-edit of the compiled SKILL.md.

Related: the companion request that `/validate` should verify an entire epic in one pass rather than milestone by milestone. Together these reframe milestones as rare human-validation checkpoints — `/prepare` should stop over-producing them and `/validate` should stop being forced to run per-milestone.
