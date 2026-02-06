# Branch Output Template

Structured output for `setup-branch` skill.

## Format

```yaml
result:
  success: true/false
  branch:
    name: "{branch_name}"
    base_ref: "{base_branch_or_commit}"
    pushed: true/false
    tracking: "{origin/branch_name}"
  worktree:
    used: true/false
    path: "{absolute_path or null}"
    reason: "{reason or null}"
  error: "{message if failed, null if success}"
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `success` | Whether branch creation and push succeeded |
| `branch.name` | Full branch name created |
| `branch.base_ref` | Branch or commit the new branch was based on |
| `branch.pushed` | Whether branch was pushed to origin |
| `branch.tracking` | Remote tracking reference |
| `worktree.used` | Whether a worktree was created instead of checkout |
| `worktree.path` | Absolute path to worktree directory |
| `worktree.reason` | Why worktree was used (e.g., "dirty tree with >5 files changed") |
| `error` | Error message if operation failed |
