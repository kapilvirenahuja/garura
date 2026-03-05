# Ship Complete

## Delivery Summary

| Field            | Value                                          |
|------------------|------------------------------------------------|
| Issue            | #{issue-number} — {issue-title}                |
| Branch           | `{branch_name}`                                |
| PR               | #{pr-number}                                   |
| PR URL           | {pr-url}                                       |
| Merge Commit     | `{merge-commit-hash}`                          |
| Strategy         | squash                                         |
| Base Branch      | {base_branch}                                  |

## Steps Executed

| Step | Name           | Status                    | Notes                                             |
|------|----------------|---------------------------|---------------------------------------------------|
| 0    | Pre-flight     | completed                 | C1/C2/C3 passed                                   |
| 1    | Commit         | {completed\|skipped}      | {commit hash or "no uncommitted changes"}         |
| 2    | Create PR      | {completed\|skipped}      | {PR number or "PR already existed"}               |
| 3    | Review PR      | {completed}               | {must_have_fail: N}                               |
| 4    | Merge PR       | {completed}               | squash merge                                      |
| 5    | Return to Main | {completed\|warning}      | {current branch or warning if failed}             |
| 6    | Report         | completed                 | evidence written                                  |

## Guardian Decisions

| Step   | Decision                | Reason   |
|--------|-------------------------|----------|
| {step} | {AUTO-APPROVE\|HALT}    | {reason} |

## Evidence

`{stm_base}/{issue}/evidence/ship/{timestamp}.md`

## Issues Created

{List of GitHub issues created by self-resolution during this run, or "None"}
