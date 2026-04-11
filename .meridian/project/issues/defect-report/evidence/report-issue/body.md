| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Affected Component** | `prepare-implementation`, `implement-epic` |
| **Reported From** | Phoenix project |
| **Date** | 2026-04-11 |

### Problem

`prepare-implementation` places all implementation context (scope items, design decisions, exit gates) under the product epics folder. When `/start-feature` later creates an STM for an issue, there is no mechanism to bring that epic context into the STM. As a result, when `implement-epic` runs, it may not have access to all the context it needs because the knowledge about what needs to be built is stranded in the product epics folder rather than being co-located with the working issue's STM.

`prepare-implementation` should function as the "ultra god mode" of `/start-feature-planning` — it should:
- Check which issue it is tied to
- Set up a GitHub issue (if not already created)
- Create a feature branch
- Set up the STM directory
- Copy/link all relevant context into the STM itself

### Root Cause

The current `prepare-implementation` recipe treats artifact production (plan.yaml, tech.yaml, etc.) as a product-level concern, placing outputs under the product epics directory. But these artifacts are consumed at the issue/implementation level by `implement-epic`. There is no bridging step that relocates or links the epic context into the issue's STM, creating a disconnect between where context is produced and where it is consumed.

### Expected Behavior

1. `prepare-implementation` should set up the full working context: resolve/create issue, create branch, initialize STM — same as `/start-feature` but with deeper planning
2. All implementation context (scope items, design artifacts, exit gates) should reside within the STM (`{stm_base}/{issue}/`) rather than product epics
3. `implement-epic` should receive all context from the STM path, not from the product epics folder
4. The STM should be the single source of truth for everything an implementation agent needs

### Impact

`implement-epic` operates with incomplete context because its input paths point to STM but the actual design artifacts live under product epics. This causes the implementation agent to miss scope items, design constraints, and cross-epic data contracts — leading to implementations that pass evals but fail at integration time. This is the first-mile problem: if context doesn't flow correctly from planning to implementation, every downstream step inherits the gap.
