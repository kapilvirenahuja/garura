---
name: analyze-changes
description: Analyze uncommitted changes for categorization and risk assessment
user-invocable: false
model: sonnet
allowed-tools: Bash, Read
---

# analyze-changes

Model-invocable skill for analyzing uncommitted changes.

## Purpose

Analyze uncommitted changes and produce structured analysis for the calling agent.

You DO the analysis work. You do NOT make decisions about what to do with it.

## Input

Receive from agent:
- Request to analyze current uncommitted changes

## Process

1. **Read State**
   ```bash
   git status --porcelain
   git diff --name-only
   git diff --stat
   git diff
   git branch --show-current
   ```

2. **Categorize Each File**

   Load categories from: `~/.meridian/core/memory/standards/commits/categories.md`

3. **Detect Risks**

   Load patterns from: `reference/risks.md`

4. **Group by Issue**

   The primary grouping dimension is ISSUE, not component or file location.

   **Grouping rules (in priority order):**
   1. **Branch signal first** — extract issue number from branch name (e.g., `feature/95-foo` → #95). All changes on a single-issue branch default to ONE group for that issue.
   2. **Split only when multiple issues are present** — if the working tree contains changes for different issues (e.g., a hotfix mixed with feature work), split into one group per issue.
   3. **Within an issue group, pick the dominant commit type** — if an issue group has mostly `feat` files with a few `docs` files, the type is `feat`. Only split by type within an issue if the types are genuinely unrelated (e.g., a `fix` for issue #78 and a `feat` for issue #95).
   4. **Never split a single issue into multiple groups by component** — agents, skills, recipes, and memory changes for the same issue are ONE commit, not separate commits per directory.

   **When to split within a single issue (rare):**
   - Changes include a genuinely unrelated `chore` (e.g., dependency bump) alongside feature work
   - STM/evidence artifacts that are operational, not part of the feature itself

## Output

Produce output using template: `templates/analysis-output.md`

**IMPORTANT**: This skill produces analysis data. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop — the agent continues its workflow after receiving this analysis.

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
