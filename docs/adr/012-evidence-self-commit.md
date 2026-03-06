# ADR 012: Evidence Self-Commit in Recipes

## Status

Accepted

## Date

2026-03-06

## Context

Every recipe that produces STM artifacts (evidence files, checkpoint files, analysis YAML, issue maps) during execution faces a structural problem: **the artifacts it generates are not part of the changeset it commits**.

A recipe like `commit-code` analyzes changes, creates commits, writes evidence — but the evidence files themselves remain as uncommitted changes in the working tree. This creates a cascading problem:

1. Recipe completes Stage 5 (Generation) — feature commits created
2. Recipe runs Stage 6 (Scenario Validation) and Stage 7 (Evidence & Close) — writes evidence/checkpoint to STM
3. Recipe exits — working tree now has dirty STM files
4. Next recipe invocation picks up those files as part of its changeset, misattributing them

This was first observed in the `ship` recipe: ship would commit, create PR, merge to main, delete the branch — but evidence artifacts from the recipe's own execution remained uncommitted on main, polluting the next workflow.

### Failed approach: "next run picks them up"

Relying on the next `commit-code` invocation to commit the previous run's evidence creates:
- **Misattribution** — evidence from run N is committed by run N+1, grouped with unrelated changes
- **Accumulation** — if no commit-code runs soon, evidence files pile up
- **Confusion** — `git status` shows dirty state that users didn't create

### Why not recursive

This is NOT a recursive problem. The evidence self-commit is a flat `git add` + `git commit` of known file paths with a fixed message. It does not re-invoke the recipe, does not run analysis, and does not produce new evidence about itself. It is infrastructure, not domain work.

## Decision

### Every recipe MUST self-commit its STM artifacts in Stage 7

After scenario validation passes (Stage 6), the recipe:

1. Writes evidence and checkpoint artifacts to STM
2. Presents the summary to the user
3. Invokes `repo-orchestrator` with a targeted commit contract:
   - Explicit file list (only the files this recipe produced)
   - Fixed commit message: `chore(stm): record {recipe-name} evidence for #{issue_number} (#{issue_number})`
   - No analysis, no grouping, no issue resolution — just stage and commit

### Rules

**1. Targeted, not broad**

The self-commit stages ONLY the files the recipe wrote. Never `git add .` or `git add -A`. The file list is known at write time — pass it explicitly.

**2. Non-blocking**

If the self-commit fails (e.g., pre-commit hook, permissions), the recipe logs a warning and exits successfully. The feature commits already landed — a missing evidence commit is not fatal.

**3. No recursion**

The self-commit does NOT invoke commit-code or any recipe. It delegates a single targeted commit to `repo-orchestrator`. No analysis, no evals, no STM data flow — just `git add <files> && git commit -m <message>`.

**4. Applies to all recipes that write STM artifacts**

This is not specific to `commit-code`. Every recipe with a Stage 7 (Evidence & Close) that writes files to STM must self-commit them. This includes: `commit-code`, `create-pr`, `ship`, `start-feature-planning`, and any future recipe that produces evidence.

### Pattern

```yaml
Recipe context:
  intent: "Commit STM evidence files for issue #{issue_number}"
  task: "Stage and commit only the listed files. Do not stage any other files."
  files:
    - "{stm_base}/{issue}/evidence/{recipe-name}/{timestamp}.md"
    - "{stm_base}/{issue}/checkpoint/{recipe-name}/{timestamp}.md"
  commit_message: "chore(stm): record {recipe-name} evidence for #{issue_number} (#{issue_number})"
```

## Consequences

### Positive

- **Clean working tree** — recipe exits with no uncommitted STM artifacts
- **Correct attribution** — evidence is committed by the recipe that produced it, not a future unrelated run
- **No accumulation** — each recipe cleans up after itself
- **Traceable** — `chore(stm)` commits in the log clearly show which recipe produced which evidence

### Negative

- **Extra commit per recipe run** — adds a `chore(stm)` commit after every recipe execution. This is noise in the git log.
- **Agent call in Stage 7** — uses one `repo-orchestrator` call for infrastructure. This does NOT count toward the domain agent budget (Stage 7 is infrastructure).

### Mitigations

- The `chore(stm)` prefix makes evidence commits filterable (`git log --invert-grep --grep="chore(stm)"`)
- When ship chains L1s, each L1's self-commit is a separate commit on the feature branch — they get squash-merged with the PR, so main stays clean

## Related ADRs

- [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md) — STM directory structure
- [ADR 011: STM as Inter-Skill Data Transport](./011-stm-as-inter-skill-data-transport.md) — Skills write to STM, downstream reads from STM
- [ADR 010: STM Archival](./010-stm-archival.md) — Retention and archival of STM artifacts after issue close
