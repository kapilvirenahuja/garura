# Standards

Rules, conventions, and quality criteria that define "how we do things."

Agents and skills query this category when they need to know: **"What are the rules?"**

## Contents

| Path | Description | Consumers |
|------|-------------|-----------|
| `intent-resolution.md` | How agents resolve intent and constraints from `intent_path` files | All agents receiving `intent_path` from recipes |
| `commits/categories.md` | Commit type categorization (feat, fix, refactor, etc.) | analyze-changes, analyze-pr, create-commit |
| `commits/quality-rules.md` | Commit format and quality validation rules | analyze-pr, create-commit |
| `git/branching.md` | Branch naming conventions and quality gate implications | repo-orchestrator, setup-branch |

## When to Add Here

A file belongs in `standards/` if:
- It defines rules that agents must follow
- It would be customized by an adopter to match their team conventions
- It answers "what's allowed?" or "what's the format?"
