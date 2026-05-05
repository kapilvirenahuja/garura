# GitHub Issue Template

Standard template for creating GitHub issues via `gh issue create`.

## Body Format

```markdown
## Description

{description}

## Acceptance Criteria

- [ ] {criterion_1}
- [ ] {criterion_2}
- [ ] {criterion_3}

---

*Created via Garura `start-feature` workflow.*
```

## Field Derivation Rules

### Title

- Derived from user input (description text)
- Keep concise: max 80 characters
- Use imperative mood: "Add OAuth login" not "Adding OAuth login"

### Labels

Derived from `type` classification:

| Type | Title Prefix | Labels |
|------|--------------|--------|
| `feature` | `[FEAT]` | `enhancement` |
| `fix` | `[BUG]` | `bug` |
| `bug` | `[BUG]` | `bug` |
| `hotfix` | `[FIX]` | `bug`, `priority:critical` |
| `defect` | `[DEF][Severity]` | `defect` |
| `epic` | `[EPIC]` | `epic` |
| `enhancement` | `[ENH]` | `enhancement` |
| `docs` | `[DOCS]` | `documentation` |
| `refactor` | `[REFACTOR]` | `refactor` |
| `chore` | `[CHORE]` | `chore` |

### Acceptance Criteria

- Extract from description if bullet points or requirements are present
- Default to single criterion: "Implementation complete and verified" if none provided

## CLI Command

```bash
gh issue create \
  --title "{title}" \
  --body "{body}" \
  --label "{label1},{label2}" \
  --assignee "@me"
```
