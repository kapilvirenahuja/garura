# GitLab Platform Adapter Reference

KB narrative for agents and contributors. Describes how the `platform-adapter` skill's verb surface maps to GitLab CLI (`glab`) operations, including three documented behavioural gaps. This document is descriptive — it explains verb semantics and caveats. The executable command translations live in `core/components/skills/platform-adapter/reference/gitlab/verbs.md`.

## Overview

When `platform=gitlab` in `.garura/core/config.yaml`, the adapter routes all verbs through the `glab` CLI. The adapter pre-flights `which glab` before any operation — if `glab` is not installed, the play halts with an install hint.

GitLab calls pull requests "merge requests" (MRs). Verb names in the adapter are platform-neutral (`view-pr`, `diff-pr`, etc.) but the backing commands use `glab mr ...` terminology.

## Field Name Differences

GitLab field names differ from GitHub in several places:

| Concept | GitHub field | GitLab field |
|---------|-------------|-------------|
| Source branch | `headRefName` | `source_branch` |
| Target branch | `baseRefName` | `target_branch` |
| Close date | `closedAt` | `closed_at` |

Callers accessing the raw adapter output must use the platform-appropriate field name. When writing code that runs on both platforms, use `jq '.closedAt // .closed_at'` style coercion.

## Verb Reference

### view-pr

Fetches MR metadata as JSON. Returns fields including `iid` (MR number), `title`, `state`, `author`, `source_branch`, `target_branch`, and `web_url`.

Backed by: `glab mr view {pr_number} --output json`

### diff-pr

Fetches the unified diff of an MR. Returns raw diff output (patch format).

Backed by: `glab mr diff {pr_number}`

### comment-pr

Posts a new comment (note) on an MR. GitLab calls PR comments "notes".

Backed by: `glab mr note {pr_number} --message "{body}"`

### request-changes

**Gap behaviour — two commands required.** GitLab has no first-class "request changes" review state equivalent to GitHub's `gh pr review --request-changes`. The adapter uses two commands in sequence:

1. Set the MR to draft (WIP) state: `glab mr update {pr_number} --draft` — signals the MR is not ready to merge.
2. Post a structured note with the review feedback: `glab mr note {pr_number} --message "{structured_comment}"`.

Both commands must execute. Agents setting expectations for reviewers should understand that the GitLab "request changes" signal is softer — it relies on the draft state plus the note, not a formal review state change.

### add-reviewer

Adds a reviewer to an MR.

Backed by: `glab mr update {pr_number} --reviewer {reviewer}`

### create-pr

Creates a new merge request. Uses `--description` instead of `--body` (GitHub convention).

Backed by: `glab mr create --title ... --description ... --target-branch ...`

### merge-pr

Merges a merge request using the repository's default strategy.

Backed by: `glab mr merge {pr_number}`

### view-issue

Fetches issue details as JSON. The close date is in the `closed_at` field (snake_case, not camelCase as in GitHub's `closedAt`).

Backed by: `glab issue view {issue_number} --output json`

### create-issue

Creates a new issue. Uses `--description` instead of `--body`.

Backed by: `glab issue create --title ... --description ... --label ... --assignee ...`

### list-issues

Lists issues matching a search query.

Backed by: `glab issue list --state ... --search ... --output json`

### close-issue

Closes an issue. The `--reason` flag is not supported by `glab` — close reason is silently omitted on GitLab.

Backed by: `glab issue close {issue_number}`

### comment-issue

Posts a comment (note) on an issue. GitLab calls issue comments "notes".

Backed by: `glab issue note {issue_number} --message "{body}"`

### add-label

Adds labels to an issue or MR.

For issues: `glab issue edit {number} --label "{labels}"`
For MRs: `glab mr update {pr_number} --label "{labels}"`

### attach-sub-issue

**Gap behaviour — related-link fallback only.** GitLab does not support a parent/child sub-issue hierarchy equivalent to GitHub's sub-issues feature. The adapter falls back to GitLab's related-issues API, which creates a bidirectional "relates to" link between two issues.

**Parent/child hierarchy is NOT established.** Only a peer-level related-link is created. Agents must document this limitation when operating on GitLab — task trees that rely on sub-issue hierarchy for project management will need an alternative organisational approach on GitLab.

Backed by: `glab api projects/{encoded_owner%2Fname}/issues/{issue_number}/links -X POST -f target_project_id=... -f target_issue_iid=... -f link_type="relates_to"`

### view-user

Returns the current authenticated user's GitLab username.

Backed by: `glab api user | jq '.username'`

### update-comment

**Gap behaviour — project ID resolution required.** GitLab's notes API uses a numeric project ID (not `owner/repo` slug) in the path. The adapter must resolve this ID before updating the comment.

Step 1 — Resolve project numeric ID (cached for the duration of the call):

```
glab api projects/{encoded_owner%2Fname} | jq '.id'
```

Step 2 — Update the note:

```
glab api projects/{PROJECT_ID}/notes/{note_id} -X PUT -f body="{body}"
```

The `{encoded_owner%2Fname}` is the URL-encoded project path. For example, `mygroup/myproject` becomes `mygroup%2Fmyproject`. For nested groups (e.g., `dx_innovations/phoenix/my-app`), encode all slashes.

Note: issue notes and MR notes use different API sub-paths on GitLab (`issues/{iid}/notes` vs `merge_requests/{iid}/notes`). The adapter handles this routing based on whether the target is an issue or MR.
