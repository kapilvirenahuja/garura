# PR Output Template

Structured output for `submit-pr` skill.

## Format

```yaml
result:
  success: true/false
  pr:
    number: {number}
    url: "{url}"
    state: "{open|draft}"
    title: "{title}"
  checklist:
    required_count: {count}
    optional_count: {count}
  error: "{message if failed}"
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `success` | Whether PR creation succeeded |
| `pr.number` | GitHub PR number |
| `pr.url` | Full URL to the pull request |
| `pr.state` | PR state (`open` or `draft`) |
| `pr.title` | PR title as created |
| `checklist.required_count` | Number of must-have checklist items |
| `checklist.optional_count` | Number of nice-to-have checklist items |
| `error` | Error message if creation failed, null if success |
