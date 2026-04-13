# Play Analysis: commit-code (Rebake)

## Play Identity

- **Name:** commit-code
- **Maturity:** L2
- **Workflow structure:** A (readiness-brief-generation)
- **Purpose:** Commit changes grouped by concern with conventional messages and issue references

## Intent Summary

Source: `core/components/plays/commit-code/reference/intent.yaml`

- **Constraints:** C1 (no default branch), C2 (graceful exit if no changes), C3 (every commit references issue), C4 (no sensitive files), C5 (conventional format from LTM), C6 (issue number in message), C7 (push branch, non-blocking)
- **Failure conditions:** F1 (unrelated concerns in one commit), F2 (vague messages), F3 (uncommitted files with no reason), F4 (wrong issue reference)
- **Scenarios:** S1 (code reviewer understands scope from log), S2 (team lead reports progress per issue)

## Agent-Skill Mapping

### repo-orchestrator (domain: repo)

**Phases used:** Preparation, Checkpoint, Execution
**Contract mode:** JSON (P1 PASS)
**STM handoff:** Yes (P2 PASS)
**Intent awareness:** Reads intent_path from contract (P3 PASS)

**Skills invoked by this agent (for commit-code domain):**

| Skill | Phase | Purpose |
|-------|-------|---------|
| `analyze-changes` | Preparation | Analyze uncommitted changes, detect risks, suggest groupings |
| `create-commit` | Execution | Stage files and create conventional commit |

**Other skills available to this agent (not used by commit-code):**
- `analyze-pr`, `submit-pr`, `setup-branch`, `merge-pr`

**Bash usage:** Read-only git queries for context (allowed). Direct git commands for commits/analysis (forbidden — skills handle it).

### project-orchestrator (domain: project)

**Phases used:** Preparation
**Contract mode:** JSON (P1 PASS)
**STM handoff:** Yes (P2 PASS)
**Intent awareness:** Reads intent_path from contract (P3 PASS)

**Skills invoked by this agent (for commit-code domain):**

| Skill | Phase | Purpose |
|-------|-------|---------|
| `manage-issue` | Preparation | Fetch open issues |
| `resolve-issues` | Preparation | Map change groups to issues with confidence scoring |

## Data Flow (STM Wiring)

```
Pre-flight
  → resolve stm_base from core/config.yaml
  → extract issue number from branch name
  → check C1, C2, C4, C3

Preparation
  Step 1: repo-orchestrator (analyze-changes)
    input:  {}
    output: {stm_base}/{issue}/evidence/commit-code/analysis.yaml

  Step 2: project-orchestrator (resolve-issues)
    input:  { analysis: ...analysis.yaml }
    output: {stm_base}/{issue}/evidence/commit-code/issue-mappings.yaml

  Step evals: F1 (grouping quality), F4 (mapping correctness)

Checkpoint (skippable when all high confidence)
  Step 3: repo-orchestrator (draft brief from STM)
  Step 4: Human review → Tether/Vanish

Execution
  Step 5: repo-orchestrator (create-commit)
    input:  { analysis: ...analysis.yaml, issue_mappings: ...issue-mappings.yaml }
    output: {stm_base}/{issue}/evidence/commit-code/commits.yaml

  Step 6: repo-orchestrator (push branch)

  Step evals: F1, F2, F3, F4, C5, C6, C7

Scenario validation
  S1, S2

Evidence & Close
  Write evidence, self-commit (ADR 012)
```

## Current Play Issues (vs ADR 013 L2)

1. **Stage numbering:** Play uses abstract stage numbers (0-7) instead of named phases per ADR 013
2. **Intent-resolver reference:** Play references intent-resolver as infrastructure agent — L2 has no runtime intent resolution
3. **DAG references:** Sections on DAG caching and DAG resumption are L4 concepts, not L2
4. **Runtime intent.yaml reading:** Play says "read reference/intent.yaml" at startup — High-order plays are compiled, intent is baked in
5. **Workflow template reference:** Points to old template with Stage 1 (Intent Resolution) — templates have been updated
6. **Eval ownership:** Play says "Step evals: Play (inline)" but compiled-example.md shows evals baked into each step
7. **Agent budget claim:** Says "L1 budget = max 2 agents" but commit-code is L2 (max 2 domain agents, ≤5 calls)

## Skill Contracts Summary

### analyze-changes
- Input: git state (read via bash)
- Output: groups (type, scope, subject, files), risks (sensitive, breaking, ambiguous, hotfix)
- Categories from LTM: `~/.meridian/core/memory/standards/commits/categories.md`
- Risk patterns from: `reference/risks.md`

### create-commit
- Input: files list, type, scope, subject, body, issue
- Output: success, commit hash, validation (clean tree, conventional format)
- Constraint: ONLY stage explicit files, NEVER git add -A

### manage-issue
- Input: action (read|create|close|resolve_or_create), issue_number, description
- Output: issue details (number, title, labels, state, url, type_hint)

### resolve-issues
- Input: change_groups, open_issues, branch_name
- Output: mapping per group with confidence (high|medium|low|none), conflicts
- Constraint: NEVER drop a group, NEVER assign high without 2+ signals
