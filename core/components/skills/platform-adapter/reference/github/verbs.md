# GitHub Verb Translations

Normative reference for the `platform-adapter` skill when `platform=github`. One section per verb — each section contains the exact `gh` command with parameter substitution tokens. The adapter reads this file to resolve the CLI command for the requested verb.

## view-pr

Fetch PR metadata (JSON):

```bash
gh pr view {pr_number} --json number,title,body,state,author,headRefName,baseRefName,files,commits,mergeable,url
```

Note: field `baseRefName` contains the target branch name.

## diff-pr

Fetch PR unified diff:

```bash
gh pr diff {pr_number}
```

## comment-pr

Post a comment on a PR:

```bash
gh pr comment {pr_number} --body "{body}"
```

## request-changes

Request changes on a PR (blocks merge):

```bash
gh pr review {pr_number} --request-changes --body "{body}"
```

## add-reviewer

Add a reviewer to a PR:

```bash
gh pr edit {pr_number} --add-reviewer {reviewer}
```

## create-pr

Create a pull request:

```bash
gh pr create \
  --title "{title}" \
  --body "{body}" \
  --base "{base}" \
  [--draft] \
  [--label "{label}"] \
  [--assignee "{assignee}"]
```

## merge-pr

Merge a pull request (uses repository default strategy):

```bash
gh pr merge {pr_number}
```

## view-issue

Fetch issue details (JSON):

```bash
gh issue view {issue_number} --json number,title,labels,state,body,url,closedAt
```

Note: close date is in the `closedAt` field.

## create-issue

Create a new issue:

```bash
gh issue create \
  --title "{title}" \
  --body "{body}" \
  --label "{labels}" \
  --assignee "@me"
```

## list-issues

List open issues matching a search query:

```bash
gh issue list \
  --state {state} \
  --search "{query}" \
  --json number,title,updatedAt,labels,state \
  --limit {limit}
```

## close-issue

Close an issue:

```bash
gh issue close {issue_number} --reason {reason}
```

With optional comment:

```bash
gh issue close {issue_number} --reason {reason} --comment "{comment}"
```

## comment-issue

Post a comment on an issue:

```bash
gh issue comment {issue_number} --body "{body}"
```

## add-label

Add labels to an issue or PR:

```bash
gh issue edit {number} --add-label "{labels}"
```

For a PR:

```bash
gh pr edit {pr_number} --add-label "{labels}"
```

## attach-sub-issue

Attach a child issue as a sub-issue of a parent (GitHub-specific feature):

```bash
# Step 1: Get child issue's internal numeric ID (NOT the issue number)
CHILD_ID=$(gh api /repos/{owner}/{repo}/issues/{child_number} --jq '.id')

# Step 2: Attach as sub-issue
gh api /repos/{owner}/{repo}/issues/{parent_number}/sub_issues \
  -X POST -F sub_issue_id="$CHILD_ID"
```

Derive `{owner}/{repo}` from:

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

## view-user

Get the current authenticated user's login:

```bash
gh api user --jq '.login'
```

## update-comment

Update an existing comment in place (e.g., to update a review-pr marker comment):

```bash
gh api repos/{owner}/{repo}/issues/comments/{comment_id} \
  -X PATCH \
  -f body="{body}"
```

Derive `{owner}/{repo}` from:

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```
