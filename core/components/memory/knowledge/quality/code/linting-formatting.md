# Linting and Formatting Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any codebase with automated quality enforcement needs
**When this does NOT apply:** Prototypes, throwaway scripts, or one-off automation tools
**Search patterns:** lint, eslint, pylint, prettier, black, gofmt, formatter, pre-commit, husky, editorconfig
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Linting and formatting enforce a consistent code style across a team. Without tooling enforcement, style diverges, reviews debate whitespace, and CI cannot catch stylistic regressions. These checks are the lowest-cost quality lever available.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| CODE-01 | Linter is configured with a rule set (not defaults) | L2 | Config file exists: `.eslintrc`, `pyproject.toml [pylint]`, `.golangci.yml` | ESLint, Pylint, golangci-lint |
| CODE-02 | Formatter is configured and matches team convention | L2 | Config file exists: `.prettierrc`, `pyproject.toml [black]` | Prettier, Black, gofmt |
| CODE-03 | Linter runs without warnings on the main branch | L3 | `npm run lint` / `pylint src/` exits 0 in CI | ESLint, Pylint |
| CODE-04 | Formatter produces zero diff on committed code | L3 | `prettier --check` / `black --check` exits 0 in CI | Prettier, Black |
| CODE-05 | Pre-commit hooks block unformatted commits locally | L3 | `.husky/pre-commit` or `.pre-commit-config.yaml` exists and runs linter/formatter | husky, pre-commit |
| CODE-06 | `.editorconfig` is present and consistent with formatter config | L3 | File exists; `indent_style`, `end_of_line`, `charset` align with formatter settings | EditorConfig |
| CODE-07 | Linter rules are pinned (not floating `latest`) | L4 | `package.json` / `requirements.txt` shows exact version for linter packages | npm, pip |
| CODE-08 | Custom lint rules enforce project-specific patterns | L5 | Custom ESLint plugin / Pylint checker exists in `tools/` or `scripts/` | ESLint custom rules |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Lint-ignore sprawl | `// eslint-disable` / `# noqa` used without per-line justification comments | Silently accumulates; real issues get masked |
| Formatter and linter conflict | Prettier formatting rules contradict ESLint style rules | Auto-fix loops; CI fails after auto-format |
| No CI enforcement | Linting runs locally only via README instruction | Inconsistency guaranteed; onboarding friction |
| Floating rule versions | `"eslint": "*"` in dependencies | Rule changes break CI unexpectedly on dep update |
| Missing editor integration | Formatter only runs in CI, not on save | Developers submit unformatted code constantly |

## Why It Matters

Linting catches real bugs (unused variables, type coercions, unreachable code). Formatting eliminates non-semantic diffs in PRs. Both together mean code reviews focus on logic, not style.

## Applicability Boundaries

**In scope:** JS/TS (ESLint + Prettier), Python (Pylint/flake8 + Black), Go (golangci-lint + gofmt), any language with a mature linter
**Out of scope:** Auto-generated files, build artifacts, vendored third-party code

## Rationale

Linting and formatting standards are organizational memory — they encode team conventions in machine-enforceable rules. Without them, conventions live only in human memory and erode.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
