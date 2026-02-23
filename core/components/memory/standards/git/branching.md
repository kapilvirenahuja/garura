# Branch Naming Conventions

Standard patterns for branch names and their implications.

## Branch Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `feature/*` | New functionality | `feature/user-auth` |
| `fix/*` | Bug fixes | `fix/login-redirect` |
| `hotfix/*` | Urgent production fixes | `hotfix/security-patch` |
| `release/*` | Release preparation | `release/v2.1.0` |
| `experiment/*` | Exploration/POC | `experiment/new-cache` |
| `spike/*` | Technical investigation | `spike/graphql-perf` |
| `refactor/*` | Code improvements | `refactor/auth-module` |
| `docs/*` | Documentation only | `docs/api-reference` |
| `chore/*` | Maintenance tasks | `chore/upgrade-deps` |

## Quality Gate Implications

Branch patterns affect quality gate priorities:

### Standard Branches (`feature/*`, `fix/*`)
- All quality gates apply normally

### Hotfix Branches (`hotfix/*`, `emergency/*`)
- Some quality gates demoted to nice-to-have
- Focus on critical checks only

### Release Branches (`release/*`)
- Quality gates elevated to must-have
- Stricter review requirements

### Experiment Branches (`experiment/*`, `spike/*`, `poc/*`)
- Most quality gates are nice-to-have
- Only essential checks (no conflicts, no secrets) enforced

## Naming Best Practices

1. **Use lowercase** with hyphens: `feature/user-auth` not `Feature/UserAuth`
2. **Keep it short** but descriptive: `fix/null-pointer` not `fix/fixing-the-null-pointer-exception-in-payment-service`
3. **Include ticket ID** when applicable: `feature/ABC-123-user-auth`
4. **Avoid special characters**: stick to alphanumeric and hyphens
