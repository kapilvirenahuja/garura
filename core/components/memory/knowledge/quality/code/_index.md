# Code Quality Standards

Code quality checks covering linting, structural complexity, naming conventions, and error handling. These are the baseline checks applied when assessing or enforcing code quality in any production codebase.

## Files

- [Linting and Formatting Standards](linting-formatting.md) — Linter config, formatter enforcement, pre-commit hooks, editor consistency | Patterns: lint, eslint, prettier, black, gofmt, husky, pre-commit
- [Complexity and Structure Standards](complexity-structure.md) — Cyclomatic complexity, function length, nesting depth, SOLID, module size | Patterns: cyclomatic complexity, function length, nesting, SonarQube, SOLID
- [Naming Conventions](naming-conventions.md) — Variable/function/class naming, file naming, constants, boolean prefixes | Patterns: naming, camelCase, snake_case, PascalCase, constants, enums
- [Error Handling Patterns](error-handling-patterns.md) — Custom error types, silent failures, logging, user-facing messages, error boundaries | Patterns: error handling, try-catch, custom errors, error boundary, Result type
