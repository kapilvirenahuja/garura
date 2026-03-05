# Bitbucket PR Commands

Platform-specific commands for Bitbucket pull requests.

## push

Push current branch to remote:

```bash
git push -u origin HEAD
```

## create

Create a pull request (requires Bitbucket CLI or API):

```bash
bb pr create \
  --title "{title}" \
  --body "{body}" \
  --destination "{base}" \
  [--draft] \
  [--reviewer "{reviewer}"]
```

## view

Get PR details:

```bash
bb pr view --output json
```

## list

List open PRs:

```bash
bb pr list --output json
```

## status

Check PR status:

```bash
bb pr status
```

## checks

View build status:

```bash
bb pipeline status
```
