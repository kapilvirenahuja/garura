---
name: memory
description: Consolidated repository knowledge - commit conventions, branching patterns, and quality standards
---

# memory

Model-invocable skill providing repository memory and standards.

## Purpose

Provide consolidated knowledge about repository conventions, patterns, and quality standards. This skill serves as the central reference for other skills and agents.

## Contents

This skill contains the following reference materials:

| File | Purpose |
|------|---------|
| `commit-categories.md` | Commit type definitions and categorization rules |
| `branching.md` | Branch naming conventions and quality gate implications |
| `commit-quality.md` | Commit format validation rules and quality standards |

## Usage

Other skills reference this skill's files for consistent standards:

- `analyze-changes` → `commit-categories.md` for categorizing files
- `analyze-pr` → `commit-categories.md` for commit type analysis
- `analyze-pr` → `branching.md` patterns (also in local `branch-patterns.md`)
- `create-commit` → `commit-categories.md` for type validation

## Input

This skill is typically not invoked directly. Its files are read by other skills as reference material.

## Output

Returns requested reference content or a summary of available standards.

## Constraints

- READ-ONLY — this skill provides information, not actions
- Other skills should reference these files for consistency
- Updates to standards should be made here, not in individual skills
