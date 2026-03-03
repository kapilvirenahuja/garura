# Ship Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Recipe:** ship
- **Step:** {current} of 7
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|AUTO_APPROVED|HALTED|COMPLETED}
- **Branch:** {branch_name}
- **Target:** {base_branch}

## Task List

| Step | Name                | Status                          | Agent              |
|------|---------------------|---------------------------------|--------------------|
| 0    | Pre-flight          | {pending\|completed\|skipped}   | repo-orchestrator  |
| 1    | Commit              | {pending\|completed\|skipped}   | commit-code (L1)   |
| 2    | Create PR           | {pending\|completed\|skipped}   | create-pr (L1)     |
| 3    | Review PR           | {pending\|completed\|skipped}   | repo-orchestrator  |
| 4    | Merge PR            | {pending\|completed\|skipped}   | repo-orchestrator  |
| 5    | Return to Main      | {pending\|completed\|skipped}   | repo-orchestrator  |
| 6    | Report              | {pending\|completed}            | orchestrator       |

## Completed Outputs

| Step | Output          | Value                                          |
|------|-----------------|------------------------------------------------|
| 1    | Commit Hash     | {hash or N/A if skipped}                       |
| 2    | PR Number       | {number or N/A if skipped}                     |
| 2    | PR URL          | {url or N/A if skipped}                        |
| 3    | Review Result   | {merge_ready: true/false, must_have_fail: N}   |
| 4    | Merge Commit    | {hash or N/A}                                  |
| 4    | Branch Deleted  | {yes/no}                                       |

## Guardian Decisions

| After Step | Decision                  | Reason                  |
|------------|---------------------------|-------------------------|
| {step}     | {AUTO-APPROVE\|HALT}      | {one-sentence reason}   |

## Current Step

{What the recipe was doing when it checkpointed. Use "COMPLETED" when all steps are done.}

## Inputs Needed to Continue

{Use "None — continuing autonomously" for AUTO_APPROVED state.}
{Use the following for HALTED state:}
{Blocker: {description}}
{Type **Tether** to retry or **Vanish** to cancel.}
