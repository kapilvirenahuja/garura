```yaml
archive:
  issue_number: {integer}
  archived: {true|false}
  source: ".meridian/{issue_number}/"
  target: ".meridian/_archive/{YYYY-MM}/{issue_number}/"
  bucket: "{YYYY-MM}"
  reason: "{success message or failure reason}"
```
