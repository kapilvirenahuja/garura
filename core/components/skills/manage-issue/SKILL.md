---
name: manage-issue
description: Read, create, close, comment, resolve, or list GitHub issues with optional sub-issue attachment
user-invocable: false
model: sonnet
allowed-tools: Bash, Read
---

# manage-issue

Model-invocable skill for managing GitHub issues.

## Purpose

Read existing issues, create new ones, close issues, post comments, or resolve an issue reference (find existing or create new). Supports attaching issues as sub-issues to a parent.

You DO the issue operations. You do NOT make decisions about what to do with the results.

## Input

Receive from agent:
- `action` — `read` | `create` | `close` | `comment` | `resolve_or_create` | `list`
- `issue_number` — (required for `read`, `close`, and `comment`, optional for `resolve_or_create`)
- `body` — (required for `comment`) The comment body to post to the issue
- `description` — (required for `create`, optional for `resolve_or_create`)
- `parent_issue_number` — (optional) If provided, attach created/resolved issue as sub-issue
- `platform` — `github` (from config)
- `labels` — (optional) Comma-separated labels to apply on create
- `reason` — (optional, `close` only) Close reason: `completed` (default) or `not_planned`
- `comment` — (optional, `close` only) Comment to add when closing the issue
- `filters` — (optional, `list` only) Object with optional fields:
  - `state` — default: `open`
  - `assignee` — default: `none` (unassigned issues only)
  - `labels` — default: `["enhancement", "no-label"]` (enhancement label OR no label)
  - `sort` — default: `updated_desc`
  - `limit` — default: `5` (maximum: 5)

## Process

### Action: `read`

Fetch issue details:

```bash
gh issue view {issue_number} --json number,title,labels,state,body,url
```

Parse and return structured output.

### Action: `create`

1. Load template from: `~/.garura/core/memory/standards/templates/github-issue.md`
2. Construct issue body from description using template format
3. Create the issue:

```bash
gh issue create \
  --title "{title}" \
  --body "{body}" \
  --label "{labels}" \
  --assignee "@me"
```

4. If `parent_issue_number` is provided, attach as sub-issue (see Sub-Issue Attachment below)

### Action: `list`

Return a filtered, sorted list of open issues for candidate selection. GitHub's CLI does not support `label:X OR no:label` in a single query, so this action runs two separate queries and merges the results.

**Step 1 — Query labeled candidates:**

```bash
gh issue list \
  --state open \
  --label "enhancement" \
  --search "no:assignee" \
  --json number,title,updatedAt,labels,state \
  --limit 10
```

**Step 2 — Query unlabeled candidates:**

```bash
gh issue list \
  --state open \
  --search "no:assignee no:label" \
  --json number,title,updatedAt,labels,state \
  --limit 10
```

**Step 3 — Merge and sort:**

1. Combine both result sets
2. Deduplicate by `number` (keep one entry per issue)
3. Sort by `updatedAt` descending
4. Take the top `limit` entries (default: 5, hard cap: 5)

Apply any caller-provided overrides to `state`, `assignee`, `labels`, `sort`, or `limit` before running the queries. When `limit` exceeds 5, cap it at 5 silently.

**Output** (written to the calling agent's designated STM path):

```yaml
candidates:
  - number: 42
    title: "Add OAuth login"
    updated_at: "2026-04-28T10:30:00Z"
    labels: ["enhancement"]
    state: "open"
  - number: 37
    title: "Improve error messages"
    updated_at: "2026-04-25T08:15:00Z"
    labels: []
    state: "open"
candidate_count: 2
query_filters:
  state: open
  assignee: none
  labels: [enhancement, no-label]
  sort: updated_desc
  limit: 5
```

If both queries return zero results, `candidate_count` is `0` and `candidates` is an empty list.

---

### Action: `resolve_or_create`

1. If `issue_number` is provided → perform `read` action
2. If only `description` is provided:
   a. Search for matching issues:
      ```bash
      gh issue list --search "{description}" --json number,title,labels,state,url --limit 5
      ```
   b. If a matching open issue is found → return it
   c. If no match → perform `create` action
3. If `parent_issue_number` is provided, attach as sub-issue after resolve/create

### Action: `comment`

1. Verify issue exists and is open:

```bash
gh issue view {issue_number} --json number,title,state,url
```

2. If issue does not exist or is closed → return output with `commented: false` and reason.
3. Post the comment:

```bash
gh issue comment {issue_number} --body "{body}"
```

4. Return output with `commented: true` and the comment URL.

### Action: `close`

1. Verify issue exists and is open:

```bash
gh issue view {issue_number} --json number,title,state,url
```

2. If issue is already closed → return output with `closed: false` (no action taken)
3. Close the issue:

```bash
gh issue close {issue_number} --reason {reason}
```

If `comment` is provided, add it:

```bash
gh issue close {issue_number} --reason {reason} --comment "{comment}"
```

4. Verify closure:

```bash
gh issue view {issue_number} --json number,title,state,url
```

5. Return output with `closed: true`

### Sub-Issue Attachment

When `parent_issue_number` is provided and an issue is created or resolved:

```bash
# Get the child issue's internal ID (NOT the issue number)
CHILD_ID=$(gh api /repos/{owner}/{repo}/issues/{child_number} --jq '.id')

# Attach as sub-issue to parent
gh api /repos/{owner}/{repo}/issues/{parent_number}/sub_issues \
  -X POST -F sub_issue_id="$CHILD_ID"
```

**Important:** The `sub_issue_id` field requires the issue's internal numeric `id` from the API, NOT the issue number visible in the URL.

Derive `{owner}/{repo}` from the remote:

```bash
gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

## Output

Produce output using template: `templates/issue-output.md`

**IMPORTANT**: This skill produces operation results. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load GitHub CLI and API reference from: `reference/github-issue.md`

## Constraints

- NEVER delete issues
- NEVER close issues unless action is explicitly `close`
- NEVER modify issue state unless explicitly requested in the action
- NEVER assign to anyone other than `@me` on create
- ALWAYS use `gh` CLI for issue operations, not raw API calls (except for sub-issues)
- ALWAYS verify issue exists after creation

## Version

| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Category | operations |
