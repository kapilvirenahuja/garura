---
name: create-commit
description: Stage files and create a commit
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

## Output

Return using template: `commit-output.md`

## Constraints

- ONLY stage files explicitly provided
- NEVER use `git add .` or `git add -A`
- ALWAYS use conventional commit format
