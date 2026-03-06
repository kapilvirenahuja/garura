# Bitbucket PR Merge Commands

Platform-specific commands for merging Bitbucket pull requests.

## find

Find PR for current branch:

```bash
bb pr view --output json
```

## view

Get PR merge status:

```bash
bb pr view {pr_number} --output json
```

## merge

Merge a pull request (uses repository default strategy):

```bash
bb pr merge {pr_number}
```

## delete-branch

Delete remote branch:

```bash
git push origin --delete {branch}
```
