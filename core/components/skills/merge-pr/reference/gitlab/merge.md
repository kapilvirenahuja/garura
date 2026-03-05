# GitLab MR Merge Commands

Platform-specific commands for merging GitLab merge requests.

## find

Find MR for current branch:

```bash
glab mr view --output json
```

## view

Get MR merge status:

```bash
glab mr view {mr_number} --output json
```

## merge

Merge a merge request (uses repository default strategy):

```bash
glab mr merge {mr_number}
```

## delete-branch

Delete remote branch:

```bash
git push origin --delete {branch}
```
