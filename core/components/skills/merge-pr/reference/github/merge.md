# GitHub PR Merge Commands

Platform-specific commands for merging GitHub pull requests.

## find

Find PR for current branch:

```bash
gh pr view --json number,url,state,title,baseRefName,mergeable
```

## view

Get PR merge status:

```bash
gh pr view {pr_number} --json number,state,title,baseRefName,mergeable,mergeStateStatus
```

## merge

Merge a pull request (uses repository default strategy):

```bash
gh pr merge {pr_number}
```

## delete-branch

Delete remote branch (GitHub auto-deletes if repo setting is enabled):

```bash
git push origin --delete {branch}
```
