# Branch Patterns

Standard branch naming patterns and their classifications.

## Patterns

| Pattern | Classification | Description |
|---------|---------------|-------------|
| `hotfix/*`, `hotfix-*`, `hot-fix/*`, `emergency/*` | hotfix | Urgent production fixes |
| `release/*`, `release-*` | release | Release preparation branches |
| `feature/*`, `feature-*`, `feat/*` | feature | New feature development |
| `experiment/*`, `spike/*`, `poc/*` | experiment | Experimental/proof-of-concept work |
| `bugfix/*`, `fix/*` | bugfix | Non-urgent bug fixes |
| `chore/*`, `maintenance/*` | chore | Maintenance and cleanup |
| `docs/*`, `documentation/*` | docs | Documentation updates |
| `refactor/*` | refactor | Code refactoring |

## Priority Implications

Branch classification affects quality rule priorities:

- **hotfix**: Demotes non-critical rules to nice-to-have (speed over ceremony)
- **release**: Promotes documentation and test rules to must-have (stability focus)
- **experiment**: Demotes all rules except security to nice-to-have (exploration mode)
- **feature**: Standard priorities apply
