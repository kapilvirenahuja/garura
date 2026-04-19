---
name: create-commit
description: Stage files and create a commit
user-invocable: false
model: haiku
allowed-tools: Bash
---

# create-commit

Model-invocable skill for creating commits.

## Purpose

Stage specified files and create a commit. Fast execution, no decision-making.

## Input

Receive from agent:
- `files`: List of files to stage
- `type`: Category from LTM
- `scope`: Component/area
- `subject`: Imperative, present tense
- `body`: Optional description
- `issue`: Optional issue number

## Process

1. **Stage Files**
   ```bash
   git add "file1" "file2" "file3"
   ```

2. **Create Commit**
   ```bash
   git commit -m "type(scope): subject

   body

   Issue: #123"
   ```

3. **Get Hash**
   ```bash
   git rev-parse --short HEAD
   ```

4. **Check evidence flag**
   Read `evidence.record` from `.garura/core/config.yaml`:
   ```bash
   evidence_record=$(grep -A1 '^evidence:' .garura/core/config.yaml | grep 'record:' | awk '{print $2}')
   evidence_record=${evidence_record:-true}
   ```
   If `false`: include `skip_commits_yaml: true` in the returned output template response.
   The caller (repo-orchestrator) reads this signal and omits the write-evidence call for `commits.yaml`.
   If `true` (or key absent): proceed normally — caller writes `commits.yaml` to STM.

## Output

Return using template: `templates/commit-output.md`

When `evidence.record` is `false`, the template response includes `skip_commits_yaml: true`
as a caller signal to omit the `commits.yaml` write-evidence call.

## Constraints

- ONLY stage files explicitly provided
- NEVER use `git add .` or `git add -A`
- ALWAYS use conventional commit format

## Version

| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Category | operations |
