# GitHub PR Commands

Platform-specific commands for GitHub pull requests.

## push

Push current branch to remote:

```bash
git push -u origin HEAD
```

## create

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

## view

Get PR details:

```bash
gh pr view --json number,url,state,title
```

## list

List open PRs:

```bash
gh pr list --json number,title,headRefName,state
```

## status

Check PR status:

```bash
gh pr status
```

## checks

View CI/CD check status:

```bash
gh pr checks
```
