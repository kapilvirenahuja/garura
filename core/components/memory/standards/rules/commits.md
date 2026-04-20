# Commit Rules

Canonical rules for commit categorization and commit-quality validation. Every skill that creates, analyzes, or validates commits loads this file.

Consumers: `analyze-changes`, `analyze-pr`, `create-commit`, `commit-code`, `repo-orchestrator`.

## Part 1 — Commit Categorization

### Categories

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
| `ci` | CI/CD config | GitHub Actions, CircleCI, pipelines |
| `build` | Build system | Webpack, Vite, Rollup config |
| `revert` | Revert | Reverting a prior commit |

### Scope Detection

Scope is the component / area affected:
- Directory name (e.g., `auth`, `api`, `ui`)
- Feature name (e.g., `login`, `checkout`)
- Layer name (e.g., `controller`, `service`, `model`)

### Mixed Type Resolution

When files span multiple types:
- Split into separate commits
- Each commit = one type
- Trigger checkpoint for user confirmation

## Part 2 — Commit Message Format

See `templates/commit-message.md` for the canonical shape. The examples below remain for quick reference.

### Examples

```
feat(auth): add OAuth2 login flow
fix(api): handle null response from payment service
refactor(ui): extract button component from form
docs(readme): add installation instructions
chore(deps): upgrade lodash to 4.17.21
```

## Part 3 — Quality Rules (enforced)

### Always Apply (Universal)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `conventional-format` | must-have | Follows conventional commit format | Automated: regex match |
| `no-secrets` | must-have | No secrets in commit | Automated: pattern scan |
| `no-large-files` | must-have | No large binary files | Automated: file size check |

### Type Validation

Valid types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `ci`, `build`, `revert`. Any other type fails `conventional-format`.

### Subject Rules

| ID | Priority | Item | Description |
|----|----------|------|-------------|
| `subject-length` | must-have | Subject ≤ 72 characters | Fits in git log |
| `subject-case` | nice-to-have | Subject starts lowercase | Consistency |
| `subject-no-period` | nice-to-have | No trailing period | Convention |
| `subject-imperative` | nice-to-have | Imperative mood | "add" not "added" |

### Body Rules

| ID | Priority | Item | Description |
|----|----------|------|-------------|
| `body-line-length` | nice-to-have | Body lines ≤ 100 characters | Readability |
| `body-blank-line` | must-have | Blank line before body | Git convention |

### Scope Validation

Scope should match project structure:
- Directory names (`auth`, `api`, `ui`)
- Feature names (`login`, `checkout`)
- Component names (`button`, `modal`)

### Mixed Changes

When a commit contains multiple types of changes:

| ID | Priority | Item | Description |
|----|----------|------|-------------|
| `single-concern` | nice-to-have | Single concern per commit | Atomic commits |
| `split-recommendation` | nice-to-have | Recommend splitting | When mixed types detected |

### Secret Detection

Same patterns as PR quality gates — see `rules/pr.md`.

### Large File Thresholds

| Type | Max Size |
|------|----------|
| Binary files | 1 MB |
| Text files | 5 MB |
| Media files | 10 MB |

## Disabled Rules

Rules disabled for this project.

| Rule ID | Reason |
|---------|--------|
| (none currently) | |

## Related

- `rules/git.md` — branching conventions (paired domain)
- `rules/pr.md` — PR severity taxonomy (downstream of commits)
- `templates/github-issue.md` — issue body shape (referenced in commit messages)
