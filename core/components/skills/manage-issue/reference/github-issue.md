# GitHub Issue CLI & API Reference

Commands and endpoints used by the `manage-issue` skill.

## gh CLI Commands

### View Issue

```bash
gh issue view {number} --json number,title,labels,state,body,url
```

Returns JSON with issue details. Labels are returned as objects with `name` field.

### List / Search Issues

```bash
gh issue list --search "{query}" --json number,title,labels,state,url --limit 5
```

Search uses GitHub's issue search syntax. Matches against title and body.

### Create Issue

```bash
gh issue create \
  --title "{title}" \
  --body "{body}" \
  --label "{label1},{label2}" \
  --assignee "@me"
```

Returns the issue URL on success. Parse issue number from URL.

### Get Repo Info

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

Returns `{owner}/{repo}` format needed for API calls.

## REST API Endpoints (Sub-Issues)

Sub-issues require the REST API — they are not available via `gh issue` CLI.

### Add Sub-Issue

```
POST /repos/{owner}/{repo}/issues/{parent_number}/sub_issues
```

**Body:**
```json
{
  "sub_issue_id": {child_internal_id}
}
```

**Important:** `sub_issue_id` is the issue's internal numeric `id` (from the API response), NOT the issue number. Get it via:

```bash
gh api /repos/{owner}/{repo}/issues/{child_number} --jq '.id'
```

### List Sub-Issues

```
GET /repos/{owner}/{repo}/issues/{parent_number}/sub_issues
```

Returns array of sub-issue objects.

### Get Parent Issue

```
GET /repos/{owner}/{repo}/issues/{child_number}/parent
```

Returns the parent issue object, or 404 if no parent.

## Example Workflows

### Create Issue and Attach as Sub-Issue

```bash
# 1. Create the issue
URL=$(gh issue create --title "Add login validation" --body "..." --label "enhancement" --assignee "@me")
CHILD_NUMBER=$(echo "$URL" | grep -oE '[0-9]+$')

# 2. Get repo info
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')

# 3. Get child internal ID
CHILD_ID=$(gh api "/repos/$REPO/issues/$CHILD_NUMBER" --jq '.id')

# 4. Attach as sub-issue
gh api "/repos/$REPO/issues/{parent_number}/sub_issues" \
  -X POST -F sub_issue_id="$CHILD_ID"
```
