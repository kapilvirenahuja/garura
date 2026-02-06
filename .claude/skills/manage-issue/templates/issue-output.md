# Issue Output Template

Structured output for `manage-issue` skill.

## Format

```yaml
issue:
  number: {int}
  title: "{title}"
  labels: [{label_names}]
  state: "{open|closed}"
  body_summary: "{first 200 chars of body}"
  url: "{html_url}"
  created: {true|false}
  closed: {true|false}
  parent_issue: {parent_number or null}
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| `number` | GitHub issue number |
| `title` | Issue title |
| `labels` | List of label name strings |
| `state` | Current issue state (`open` or `closed`) |
| `body_summary` | First 200 characters of the issue body |
| `url` | Full HTML URL to the issue |
| `created` | `true` if this skill created the issue, `false` if it already existed |
| `closed` | `true` if this skill closed the issue, `false` otherwise |
| `parent_issue` | Parent issue number if attached as sub-issue, `null` otherwise |
