---
name: analyze-changes
description: Analyze uncommitted changes for categorization and risk assessment
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

   Load categories from: `skills/memory/commit-categories.md`

3. **Detect Risks**

   Load patterns from: `risks.md`

4. **Group Logically**

   Files that belong together:
   - Same feature/component
   - Same issue type
   - Related by import/dependency

## Output

Produce output using template: `analysis-output.md`

**IMPORTANT**: This skill produces analysis data. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop — the agent continues its workflow after receiving this analysis.
