# Commit Categorization

Standard categories for commits and changes.

## Categories

| Type | Description | Indicators |
|------|-------------|------------|
| `feat` | New feature | New files, new exports, new endpoints, new UI |
| `fix` | Bug fix | Error handling, edge cases, null checks, corrections |
| `refactor` | Code restructuring | Rename, reorganize, extract, no behavior change |
| `docs` | Documentation | .md files, comments, JSDoc, README |
| `chore` | Maintenance | Config, build, dependencies, CI/CD |
| `test` | Testing | Test files, test utilities, mocks |
| `perf` | Performance | Optimization, caching, lazy loading |
| `style` | Formatting | Whitespace, semicolons, linting |

## Scope Detection

Scope is the component/area affected:
- Directory name (e.g., `auth`, `api`, `ui`)
- Feature name (e.g., `login`, `checkout`)
- Layer name (e.g., `controller`, `service`, `model`)

## Mixed Type Resolution

When files span multiple types:
- Split into separate commits
- Each commit = one type
- Trigger checkpoint for user confirmation

## Commit Message Format

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
