---
name: merge-pr
description: Merge a pull request on the configured platform, switch to main, pull latest, and delete the feature branch (local and remote)
user-invocable: false
---

# merge-pr

Model-invocable skill for merging pull requests and completing the branch lifecycle.

## Purpose

Merge a PR using the platform's default merge strategy, switch to the base branch, pull latest, and delete the feature branch (local and remote). This skill executes — it does not orchestrate.

## Input

Receive from caller (agent):

| Field | Required | Description |
|-------|----------|-------------|
| `pr_number` | No | PR number to merge (auto-detected from current branch if omitted) |
| `delete_branch` | No | Delete feature branch after merge (default: true) |
| `base_branch` | No | Base branch to switch to after merge (default: auto-detect from PR) |

## Platform Dispatch

This skill supports multiple git platforms. The platform is determined from project configuration, never hardcoded.

### 1. Read Platform

```bash
# Read from project config
platform=$(grep '^platform:' core/config.yaml | awk '{print $2}')
# Fallback
platform=${platform:-github}
```

### 2. Load Platform Reference

Load the platform-specific commands from the reference file:

```
reference/{platform}/merge.md
```

Available references:
- `reference/github/merge.md` — GitHub via `gh` CLI
- `reference/gitlab/merge.md` — GitLab via `glab` CLI
- `reference/bitbucket/merge.md` — Bitbucket via `bb` CLI

If the reference file for the configured platform does not exist, halt with structured failure — do not fall back silently.

### 3. Use Platform Commands

All git platform commands (merge, view, delete-branch) come from the loaded reference. The skill never hardcodes platform-specific CLI invocations.

## Process

### 1. Identify PR

If `pr_number` is not provided, detect the PR for the current branch:

```bash
# Get current branch
branch=$(git branch --show-current)
```

Use the `find` command from the loaded platform reference to locate the PR for this branch.

### 2. Verify PR is Mergeable

Use the `view` command from the loaded platform reference to check PR state. The PR must be open and not have merge conflicts.

If the PR has merge conflicts, halt with structured failure (do not attempt resolution).

### 3. Merge PR

Use the `merge` command from the loaded platform reference. Use the repository's default merge strategy — do not override.

### 4. Switch to Base Branch

```bash
# Switch to base branch (detected from PR or provided)
git checkout {base_branch}
```

### 5. Pull Latest

```bash
# Ensure local base is up to date
git pull
```

### 6. Delete Feature Branch

If `delete_branch` is true (default):

```bash
# Delete local feature branch
git branch -d {branch}

# Delete remote feature branch (if not already deleted by platform)
git push origin --delete {branch} 2>/dev/null || true
```

The remote deletion is best-effort — some platforms auto-delete on merge.

## Output

Return structured result to caller:

| Field | Description |
|-------|-------------|
| `status` | `merged`, `conflict`, or `failed` |
| `pr_number` | PR that was merged |
| `merge_sha` | Merge commit SHA (if available) |
| `base_branch` | Branch switched to |
| `branch_deleted` | Whether feature branch was deleted |
| `error` | Error message (only on failure) |

**IMPORTANT**: This skill produces operation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER override merge strategy — always use repository default
- NEVER resolve merge conflicts — halt on conflict
- NEVER ask for user input — return result to caller
- NEVER hardcode platform-specific CLI commands — always load from reference
- ALWAYS read platform from project config
- ALWAYS verify PR is mergeable before attempting merge
- ALWAYS switch to base branch and pull after merge

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | operations |
