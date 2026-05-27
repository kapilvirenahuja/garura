# GitLab Verb Translations

Normative reference for the `platform-adapter` skill when `platform=gitlab`. One section per verb — each section contains the exact `glab` command with parameter substitution tokens. The adapter reads this file to resolve the CLI command for the requested verb.

Note on field name differences from GitHub: GitLab uses `source_branch` where GitHub uses `headRefName`, and `target_branch` where GitHub uses `baseRefName`. Callers must access the platform-appropriate field from the raw output.

Note on project encoding: GitLab API paths require the project path encoded as `{owner}%2F{name}` (URL-encoded slash). For nested groups, encode the full path (e.g., `group%2Fsubgroup%2Fproject`).

## view-pr

Fetch MR metadata (JSON):

```bash
glab mr view {pr_number} --output json
```

Note: field `target_branch` contains the target branch name (equivalent to GitHub's `baseRefName`). Field `source_branch` is the head branch.

## diff-pr

Fetch MR unified diff:

```bash
glab mr diff {pr_number}
```

## comment-pr

Post a comment (note) on an MR:

```bash
glab mr note {pr_number} --message "{body}"
```

## request-changes

Request changes on an MR (GitLab has no direct "request changes" state).

**Gap behaviour:** GitLab does not have a first-class "request changes" review state. The adapter uses TWO commands in sequence: first set the MR to draft (WIP) to signal it is not ready to merge, then post a structured note.

**Step 1 — Set MR to draft:**

```bash
glab mr update {pr_number} --draft
```

**Step 2 — Post a structured note:**

```bash
glab mr note {pr_number} --message "{structured_comment}"
```

Both commands must be executed. The draft state signals the blocked status; the note carries the review feedback. Callers should populate `{structured_comment}` with the full review body.

## add-reviewer

Add a reviewer to an MR:

```bash
glab mr update {pr_number} --reviewer {reviewer}
```

## create-pr

Create a merge request:

```bash
glab mr create \
  --title "{title}" \
  --description "{body}" \
  --target-branch "{base}" \
  [--draft] \
  [--label "{label}"] \
  [--assignee "{assignee}"]
```

## merge-pr

Merge a merge request (uses repository default strategy):

```bash
glab mr merge {pr_number}
```

## view-issue

Fetch issue details (JSON):

```bash
glab issue view {issue_number} --output json
```

Note: close date is in the `closed_at` field (snake_case, unlike GitHub's `closedAt`). Callers should use `jq '.closedAt // .closed_at'` to handle both platforms.

## create-issue

Create a new issue:

```bash
glab issue create \
  --title "{title}" \
  --description "{body}" \
  --label "{labels}" \
  --assignee "{assignee}"
```

## list-issues

List open issues matching a search query:

```bash
glab issue list \
  --state {state} \
  --search "{query}" \
  --output json
```

## close-issue

Close an issue:

```bash
glab issue close {issue_number}
```

Note: GitLab's `glab issue close` does not support a `--reason` flag. The close reason is silently omitted on GitLab.

## comment-issue

Post a comment (note) on an issue:

```bash
glab issue note {issue_number} --message "{body}"
```

## add-label

Add labels to an issue or MR:

```bash
glab issue edit {number} --label "{labels}"
```

For an MR:

```bash
glab mr update {pr_number} --label "{labels}"
```

## attach-sub-issue

Attach a child issue as a related issue (GitLab does not support parent/child sub-issue hierarchy).

**Gap behaviour:** GitLab has no parent/child sub-issue concept equivalent to GitHub's sub-issues. The adapter falls back to the related-issues API, which creates a bidirectional "related" link only. **Parent/child hierarchy is NOT established — only a related-link is created. Callers must be aware that GitLab loses the hierarchical relationship.**

```bash
glab api projects/{encoded_owner%2Fname}/issues/{issue_number}/links \
  -X POST \
  -f target_project_id="{project_id}" \
  -f target_issue_iid="{related_issue_number}" \
  -f link_type="relates_to"
```

Resolve `{encoded_owner%2Fname}` by URL-encoding the project path (e.g., `mygroup/myproject` → `mygroup%2Fmyproject`). Resolve `{project_id}` via the view-user or project API as needed.

## view-user

Get the current authenticated user's username:

```bash
glab api user | jq '.username'
```

## update-comment

Update an existing comment (note) in place.

**Gap behaviour:** GitLab uses a numeric project ID (not `owner/repo`) in its notes API path. The project ID must be resolved first, then used for the update call.

**Step 1 — Resolve project numeric ID (cache for the duration of this call):**

```bash
PROJECT_ID=$(glab api projects/{encoded_owner%2Fname} | jq '.id')
```

Where `{encoded_owner%2Fname}` is the URL-encoded project path (e.g., `mygroup%2Fmyproject`).

**Step 2 — Update the note:**

```bash
glab api projects/{PROJECT_ID}/notes/{note_id} \
  -X PUT \
  -f body="{body}"
```

Note: on GitLab, issue comments and MR notes use different API endpoints (`issues/{iid}/notes` vs `merge_requests/{iid}/notes`). The `notes/{note_id}` path above applies to issue notes; for MR notes use `merge_requests/{iid}/notes/{note_id}`.
