# GitLab MR Commands

Platform-specific commands for GitLab merge requests.

## push

Push current branch to remote:

```bash
git push -u origin HEAD
```

## create

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

## view

Get MR details:

```bash
glab mr view --output json
```

## list

List open MRs:

```bash
glab mr list --output json
```

## status

Check MR status:

```bash
glab mr status
```

## checks

View CI pipeline status:

```bash
glab ci status
```
