# Commit Quality Rules

Quality rules for commit validation.

## Always Apply (Universal)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `conventional-format` | must-have | Follows conventional commit format | Automated: regex match |
| `no-secrets` | must-have | No secrets in commit | Automated: pattern scan |
| `no-large-files` | must-have | No large binary files | Automated: file size check |

## Format Rules

### Conventional Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type Validation

Valid types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `ci`, `build`, `revert`

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

## Scope Validation

Scope should match project structure:
- Directory names (`auth`, `api`, `ui`)
- Feature names (`login`, `checkout`)
- Component names (`button`, `modal`)

## Mixed Changes

When a commit contains multiple types of changes:

| ID | Priority | Item | Description |
|----|----------|------|-------------|
| `single-concern` | nice-to-have | Single concern per commit | Atomic commits |
| `split-recommendation` | nice-to-have | Recommend splitting | When mixed types detected |

## Secret Detection

Same patterns as PR quality gates - see `skills/analyze-changes/risks.md`.

## Large File Thresholds

| Type | Max Size |
|------|----------|
| Binary files | 1 MB |
| Text files | 5 MB |
| Media files | 10 MB |

---

## Disabled Rules

Rules disabled for this project.

| Rule ID | Reason |
|---------|--------|
| (none currently) | |
