# GitHub Platform Adapter Reference

KB narrative for agents and contributors. Describes how the `platform-adapter` skill's verb surface maps to GitHub CLI (`gh`) operations. This document is descriptive — it explains verb semantics and caveats. The executable command translations live in `core/components/skills/platform-adapter/reference/github/verbs.md`.

## Overview

When `platform=github` in `.garura/core/config.yaml`, the adapter routes all verbs through the `gh` CLI. Agents call the adapter with a verb and arguments — the adapter handles the `gh` invocation.

## Verb Reference

### view-pr

Fetches PR metadata as JSON. Returns fields including `number`, `title`, `state`, `author`, `headRefName` (source branch), `baseRefName` (target branch), `files`, `commits`, `mergeable`, and `url`. Callers use `baseRefName` for target branch on GitHub.

Backed by: `gh pr view {pr_number} --json ...`

### diff-pr

Fetches the unified diff of a PR. Returns raw diff output (patch format). Used by `analyze-pr` skill in PR-scoped mode.

Backed by: `gh pr diff {pr_number}`

### comment-pr

Posts a new comment on a PR. The comment body is passed as the `body` argument. Used by `review-pr` play (via repo-orchestrator) when posting a review comment for the first time.

Backed by: `gh pr comment {pr_number} --body "{body}"`

### request-changes

Requests changes on a PR, setting it to a blocked (changes-requested) state. Passes a review body explaining what needs to change.

Backed by: `gh pr review {pr_number} --request-changes --body "{body}"`

### add-reviewer

Adds one or more reviewers to a PR. Accepts a GitHub username or team slug.

Backed by: `gh pr edit {pr_number} --add-reviewer {reviewer}`

### create-pr

Creates a new pull request. Accepts title, body, base branch, and optional draft/label/assignee flags. Returns the PR URL on success.

Backed by: `gh pr create --title ... --body ... --base ...`

### merge-pr

Merges a pull request using the repository's default merge strategy. Does not override merge strategy.

Backed by: `gh pr merge {pr_number}`

### view-issue

Fetches issue details as JSON. Returns `number`, `title`, `labels`, `state`, `body`, `url`, and `closedAt`. The `closedAt` field (camelCase) holds the close timestamp — use this for archive bucketing.

Backed by: `gh issue view {issue_number} --json ...`

### create-issue

Creates a new issue with title, body, labels, and assignee. Returns the issue URL.

Backed by: `gh issue create --title ... --body ... --label ... --assignee "@me"`

### list-issues

Lists open issues matching a search query. Returns JSON array sorted by `updatedAt`. Supports state, assignee, label, and limit filters.

Backed by: `gh issue list --state ... --search ... --json ... --limit ...`

### close-issue

Closes an issue. Accepts an optional close reason (`completed` or `not_planned`) and an optional comment to add before closing.

Backed by: `gh issue close {issue_number} --reason {reason}`

### comment-issue

Posts a comment on an issue. Used by manage-issue skill for the `comment` action.

Backed by: `gh issue comment {issue_number} --body "{body}"`

### add-label

Adds one or more labels to an issue or PR.

For issues: `gh issue edit {number} --add-label "{labels}"`
For PRs: `gh pr edit {pr_number} --add-label "{labels}"`

### attach-sub-issue

Attaches a child issue as a sub-issue of a parent. This is a GitHub-specific feature using the sub-issues REST API. The operation requires the child issue's internal numeric ID (from the API), not the visible issue number.

Steps: fetch child internal ID via `gh api /repos/{owner}/{repo}/issues/{n}`, then POST to `/repos/{owner}/{repo}/issues/{parent}/sub_issues`.

**Note:** This verb has no equivalent on GitLab (see GitLab adapter reference for the fallback behaviour).

### view-user

Returns the current authenticated user's GitHub login. Used in templates that need an `@mention` of the approving user.

Backed by: `gh api user --jq '.login'`

### update-comment

Updates an existing PR or issue comment in place. Used by `review-pr` play when a `<!-- review-pr:marker -->` comment already exists and needs to be refreshed rather than creating a new one.

Backed by: `gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH -f body="{body}"`

Derive `{owner}/{repo}` via `gh repo view --json nameWithOwner`.
