# Input Contract — quality-check-scoped

## Required fields

| Field | Type | Description |
|---|---|---|
| `diff_path` | string | Absolute or repo-relative path to a unified diff file |
| `changed_paths` | string[] | Repo-relative paths of files touched by the diff |
| `standards_set` | object | `{kb, ltm, stm}` paths resolved from `core/config.yaml` `standards_order` |
| `severity_taxonomy_path` | string | Resolved from `core/config.yaml` `standards.pr-severity-taxonomy` |
| `intent_summary` | string | 1–3 sentences from `spec/intent.yaml` or PR body |
| `output_path` | string | Where to write `findings.yaml` |

## Resolution

The caller (review-pr Step 2 via `quality-auditor`) MUST resolve all paths from `core/config.yaml` — never hardcode. Pre-flight in the recipe validates `severity_taxonomy_path` exists before invoking the skill.

## Optional fields

None. Any extra fields are ignored.

## Example

```yaml
diff_path: .meridian/project/issues/208/evidence/review-pr/diff.patch
changed_paths:
  - src/api/users.ts
  - src/db/migrations/0042_add_email.sql
  - .env.example
standards_set:
  kb: ~/.meridian/core/memory/knowledge/quality/
  ltm: .meridian/core/memory/knowledge/quality/
  stm: .meridian/project/issues/208/spec/quality/
severity_taxonomy_path: ./core/components/memory/standards/git/pr-severity-taxonomy.md
intent_summary: "Add email verification flow with token expiry."
output_path: .meridian/project/issues/208/evidence/review-pr/findings.yaml
```
