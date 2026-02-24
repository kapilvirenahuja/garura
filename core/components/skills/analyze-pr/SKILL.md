---
name: analyze-pr
description: Analyze branch and generate context-aware quality checklist
user-invocable: false
model: sonnet
allowed-tools: Bash, Read
---

# analyze-pr

Model-invocable skill for analyzing PR readiness with dynamic quality checklists.

## Purpose

Analyze the current branch against base and produce a context-aware quality checklist.

You DO the analysis work. You do NOT make decisions about what to do with the results.

## Input

Receive from agent:
- Base branch (defaults to `main`)
- Optional: specific commit range

## Process

### 1. Read Branch State

```bash
git diff --stat main..HEAD
git diff --name-only main..HEAD
git log --oneline main..HEAD
git branch --show-current
```

### 2. Analyze Context

Determine which file patterns are affected:
- Code files (`*.ts`, `*.js`, `*.py`, `*.java`, `*.go`)
- API files (`**/api/**`, `**/routes/**`, `**/controllers/**`)
- Security files (`**/auth/**`, `**/security/**`, `*.pem`, `*.key`)
- Database files (`**/migrations/**`, `*.sql`, `**/schema/**`)
- UI components (`**/components/**`, `*.tsx`, `*.vue`)
- Test files (`**/*.test.*`, `**/*.spec.*`, `**/test/**`)
- Documentation (`*.md`, `**/docs/**`)

Determine branch pattern using: `reference/branch-patterns.md`

Determine commit types from commit messages using: `~/.meridian/core/memory/standards/commits/categories.md`

### 3. Load Rules

Load quality rules from: `reference/quality-rules.md`
- Contains all quality rules including project-specific disabled rules
- Rules in the "Disabled Rules" section should be skipped

### 4. Evaluate Triggered Rules

For each rule in the loaded ruleset:
1. Check if trigger conditions match the analyzed context
2. If matched, add to the applicable checklist
3. Apply branch-based overrides (hotfix demotes, release promotes)

### 5. Run Automated Verifications

For items with automated verification:
- **No merge conflicts**: Run `git merge-tree --write-tree main HEAD`
- **No secrets committed**: Scan changed files for secret patterns
- **Tests pass**: Check CI status or run test command
- **Build succeeds**: Check CI status or run build command

Mark manual items as `REVIEW` status requiring human sign-off.

### 6. Produce Checklist

Generate the context-specific checklist with:
- Items grouped by priority (must-have vs nice-to-have)
- Each item showing its trigger (why it applies)
- Automated items with evidence
- Blocking issues summary
- Overall readiness assessment

## Output

Produce output using template: `templates/analysis-output.md`

**IMPORTANT**: This skill produces analysis data. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER create the PR — only analyze
- NEVER modify any files — read-only analysis
- ALWAYS show trigger reason for each checklist item
- ALWAYS provide evidence for automated checks

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis |
