# ADR 012: Evidence Self-Commit in Plays

## Status

Accepted

## Date

2026-03-06

## Context

Every play that produces STM artifacts (evidence files, checkpoint files, analysis YAML, issue maps) during execution faces a structural problem: **the artifacts it generates are not part of the changeset it commits**.

A play like `commit-code` analyzes changes, creates commits, writes evidence — but the evidence files themselves remain as uncommitted changes in the working tree. This creates a cascading problem:

1. Play completes Stage 5 (Generation) — feature commits created
2. Play runs Stage 6 (Scenario Validation) and Stage 7 (Evidence & Close) — writes evidence/checkpoint to STM
3. Play exits — working tree now has dirty STM files
4. Next play invocation picks up those files as part of its changeset, misattributing them

This was first observed in the `ship` play: ship would commit, create PR, merge to main, delete the branch — but evidence artifacts from the play's own execution remained uncommitted on main, polluting the next workflow.

### Failed approach: "next run picks them up"

Relying on the next `commit-code` invocation to commit the previous run's evidence creates:
- **Misattribution** — evidence from run N is committed by run N+1, grouped with unrelated changes
- **Accumulation** — if no commit-code runs soon, evidence files pile up
- **Confusion** — `git status` shows dirty state that users didn't create

### Why not recursive

This is NOT a recursive problem. The evidence self-commit is a flat `git add` + `git commit` of known file paths with a fixed message. It does not re-invoke the play, does not run analysis, and does not produce new evidence about itself. It is infrastructure, not domain work.

## Decision

### Every play MUST self-commit its STM artifacts in Stage 7

After scenario validation passes (Stage 6), the play:

1. Writes evidence and checkpoint artifacts to STM
2. Presents the summary to the user
3. Invokes `repo-orchestrator` with a targeted commit contract:
   - Explicit file list (only the files this play produced)
   - Fixed commit message: `chore(stm): record {play-name} evidence for #{issue_number} (#{issue_number})`
   - No analysis, no grouping, no issue resolution — just stage and commit

### Rules

**1. Targeted, not broad**

The self-commit stages ONLY the files the play wrote. Never `git add .` or `git add -A`. The file list is known at write time — pass it explicitly.

**2. Non-blocking**

If the self-commit fails (e.g., pre-commit hook, permissions), the play logs a warning and exits successfully. The feature commits already landed — a missing evidence commit is not fatal.

**3. No recursion**

The self-commit does NOT invoke commit-code or any play. It delegates a single targeted commit to `repo-orchestrator`. No analysis, no evals, no STM data flow — just `git add <files> && git commit -m <message>`.

**4. Applies to all plays that write STM artifacts**

This is not specific to `commit-code`. Every play with a Stage 7 (Evidence & Close) that writes files to STM must self-commit them. This includes: `commit-code`, `create-pr`, `ship`, `start-feature-planning`, and any future play that produces evidence.

### Pattern

```yaml
Play context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/{play-name}/{timestamp}.md"
    - "{stm_base}/{issue}/checkpoint/{play-name}/{timestamp}.md"
  commit_message: "chore(stm): record {play-name} evidence for #{issue_number} (#{issue_number})"
```

## Consequences

### Positive

- **Clean working tree** — play exits with no uncommitted STM artifacts
- **Correct attribution** — evidence is committed by the play that produced it, not a future unrelated run
- **No accumulation** — each play cleans up after itself
- **Traceable** — `chore(stm)` commits in the log clearly show which play produced which evidence

### Negative

- **Extra commit per play run** — adds a `chore(stm)` commit after every play execution. This is noise in the git log.
- **Agent call in Stage 7** — uses one `repo-orchestrator` call for infrastructure. This does NOT count toward the domain agent budget (Stage 7 is infrastructure).

### Mitigations

- The `chore(stm)` prefix makes evidence commits filterable (`git log --invert-grep --grep="chore(stm)"`)
- When ship chains L1s, each L1's self-commit is a separate commit on the feature branch — they get squash-merged with the PR, so main stays clean

## Related ADRs

- [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md) — STM directory structure
- [ADR 011: STM as Inter-Skill Data Transport](./011-stm-as-inter-skill-data-transport.md) — Skills write to STM, downstream reads from STM
- [ADR 010: STM Archival](./010-stm-archival.md) — Retention and archival of STM artifacts after issue close
