# Commit Message Template

Canonical shape for a commit message. Every skill that creates or validates a commit message instantiates this shape.

Consumers: `create-commit`, `analyze-changes`, `commit-code`, `repo-orchestrator`.

## Shape

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Examples

```
feat(auth): add OAuth2 login flow
fix(api): handle null response from payment service
refactor(ui): extract button component from form
docs(readme): add installation instructions
chore(deps): upgrade lodash to 4.17.21
```

## Field Rules

| Field | Required | Rule |
|-------|----------|------|
| `type` | yes | One of: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `ci`, `build`, `revert` |
| `scope` | yes | Component, directory, or feature name in parentheses. See `rules/commits.md` Part 1 for scope detection rules. |
| `subject` | yes | ≤ 72 characters. Imperative mood. No trailing period. Starts lowercase. |
| `body` | no | Optional free-form explanation. Blank line before body. Lines ≤ 100 characters. |
| `footer` | no | Optional. Used for `Closes #N`, `Co-Authored-By:`, or breaking change notices. |

## Related

- `rules/commits.md` — commit categorization rules (type taxonomy, scope detection, mixed-type resolution) and quality enforcement rules (Part 3)
