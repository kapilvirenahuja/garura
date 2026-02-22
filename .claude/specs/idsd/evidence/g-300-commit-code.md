# G-300: commit-code — Verification Evidence

**Date:** 2026-02-22
**Verifier:** tech-designer (independent — not the builder)
**Recipe Version:** 1.0.0 (from version table in SKILL.md)
**Recipe File:** `core/components/recipes/commit-code/SKILL.md`

---

## G-300 Verification Steps

| # | Criterion | Pass/Fail | Evidence |
|---|-----------|-----------|----------|
| 1 | File exists at `core/components/recipes/commit-code/SKILL.md` | PASS | File read successfully; 104 lines confirmed |
| 2 | Recipe declares `Level: L1` and `Agent Calls: 2` | PASS | Version table declares `Level: L1` and `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| 3 | Recipe declares `Agents: repo-orchestrator, project-orchestrator` | PASS | Agent Routing section lists both agents; version table confirms `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| 4 | Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields | PASS | YAML front matter contains all three fields: `intent`, `constraints` (6 items), `failure_conditions` (5 items) |
| 5 | Recipe intent states: "Stage and commit code changes with conventional commit messages" | FAIL | Actual intent is: "Safely persist completed work as conventional commits with full traceability to a tracked issue." Does not match gate-expected phrasing. The semantics overlap but the gate criterion specifies an exact or near-exact phrase that is not present. |
| 6 | Recipe constraints include: "Must group changes by concern" | PASS | Constraint present: "Changes must be analyzed and grouped by concern before commits are created" |
| 7 | Recipe constraints include: "Must use conventional commit format" | PASS | Constraint present: "Commits must use conventional commit format (type(scope): subject), one type per commit" |
| 8 | Recipe constraints include: "Must run pre-commit hooks" | FAIL | No constraint explicitly states "Must run pre-commit hooks." The concept is absent from the constraints list. Pre-commit hooks are referenced only implicitly through the repo-orchestrator delegation. |
| 9 | Recipe failure_conditions include: "No changes to commit" | WARN | Not listed as a formal failure_condition in the YAML block. Only mentioned in recipe body: "If no uncommitted changes exist, report 'nothing to commit' and exit." The gate expects this in the `failure_conditions` field. |
| 10 | Recipe failure_conditions include: "Pre-commit hooks fail after retry" | FAIL | This failure condition is absent from the `failure_conditions` YAML list. The Recovery section addresses retries for agent failures but does not name pre-commit hook failure as a named failure_condition. |
| 11 | Recipe groups changes by concern (feature, fix, refactor) — not bulk add | PASS | Constraint enforces grouping: "Changes must be analyzed and grouped by concern before commits are created" |
| 12 | Recipe uses conventional commit format | PASS | Constraint: "Commits must use conventional commit format (type(scope): subject), one type per commit" |
| 13 | Recipe runs pre-commit hooks via repo-orchestrator | WARN | No explicit mention of pre-commit hooks anywhere in the recipe. Delegating to repo-orchestrator covers it implicitly only if repo-orchestrator's contract includes pre-commit hook execution. Cannot confirm from this recipe file alone. |
| 14 | Recipe propagates intent to agent invocations | PASS | Recipe context block template provided: `intent: "Safely persist completed work as conventional commits with traceability"` — passed to each agent invocation |
| 15 | Structured failure handling verified | PASS | Recovery section loads `intent-driven-recovery.md` and `structured-failure-protocol.md`; structured failure routing logic described with max 2 retry cycles |

---

## Template Files Verification

All three referenced templates exist under `core/components/recipes/commit-code/templates/`.

| Template | Path | Status | Notes |
|----------|------|--------|-------|
| Checkpoint | `templates/checkpoint.md` | PASS | Exists; includes issue number, branch, status, proposed commits with conventional format, auto-approve decision |
| Approval Prompt | `templates/approval-prompt.md` | PASS | Exists; renders Tether/Vanish checkpoint correctly: "Type **Tether** to proceed or **Vanish** to cancel." |
| Commit Summary | `templates/commit-summary.md` | PASS | Exists; includes metrics, commit hash + message, validation table (conventional format, no sensitive files) |

---

## Cross-Cutting Gates

### G-003: Tether/Vanish Checkpoint Pattern

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| commit-code has Tether/Vanish checkpoint (conditional — when checkpoint triggered) | PASS | `approval-prompt.md` template ends with: "Type **Tether** to proceed or **Vanish** to cancel." Auto-approve policy documented; checkpoint triggered when: multiple groups, sensitive files, breaking changes, ambiguous types, or hotfix branch. |
| No use of `AskUserQuestion` tool | PASS | `allowed-tools` list: `Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet` — `AskUserQuestion` is absent. Recipe body explicitly uses output-and-wait pattern via template. |
| Tether → proceed; Vanish → cancel; other → clarify | PASS | Template states the Tether/Vanish pattern. The "clarify on other" behavior is an implied system behavior; not explicitly restated in the recipe — consistent with other recipes. |

### G-008: Agent-First Pattern

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| No direct git operations in recipe | PASS | Recipe body explicitly states: "**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands." |
| No direct issue tracking in recipe | PASS | project-orchestrator handles issue resolution; not done inline |
| All domain work delegated to agents via Task tool | PASS | `Task` is in `allowed-tools`; agent routing table clearly maps all domain tasks to repo-orchestrator or project-orchestrator |
| No recipe performs analysis or commit creation directly | PASS | Agent Routing table: "Change analysis, commit creation → repo-orchestrator"; "Issue resolution (NWWI) → project-orchestrator" |

### G-009: L1 and L2 Recipe Level Constraints

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Recipe declares ≤2 agent calls (L1 constraint) | PASS | Version table: `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| Recipe is invocable by Human AND Model (L1 requirement) | PASS | Front matter: `user-invocable: true`; L1 designation means model-invocable too |
| Recipe file explicitly declares its Level (L1 or L2) | PASS | Version table: `Level: L1` |
| Recipe file explicitly declares its agent call count | WARN | Declared as `Distinct Agents: 2` rather than `Agent Calls: 2`. The gate criterion uses the phrase "agent call count." Semantically equivalent but the field name differs from what the gate criterion specifies. Recovery agent calls are noted as exempt. |

---

## Summary

- **Total G-300 criteria checked:** 15
- **Passed:** 9
- **Failed:** 3
- **Warnings:** 3

### Failures (Blockers)

| # | Criterion | Severity | Detail |
|---|-----------|----------|--------|
| 5 | Intent statement does not match gate-expected phrasing | HIGH | Gate expects: "Stage and commit code changes with conventional commit messages". Actual: "Safely persist completed work as conventional commits with full traceability to a tracked issue." Either the gate criterion needs updating to match the implemented intent, or the recipe intent needs to be restated to match the gate. |
| 8 | "Must run pre-commit hooks" constraint absent | MEDIUM | Pre-commit hooks are not listed as a constraint. This is an observable gap — if pre-commit hooks fail, the recipe has no declared constraint governing that behavior. |
| 10 | "Pre-commit hooks fail after retry" failure_condition absent | MEDIUM | This named failure condition is missing from the `failure_conditions` YAML block. The recovery section handles agent retries but does not surface pre-commit hook failure as a named termination condition. |

### Warnings (Non-Blocking)

| # | Criterion | Detail |
|---|-----------|--------|
| 9 | "No changes to commit" in body not in failure_conditions YAML | Listed in recipe body prose but not in the formal `failure_conditions` YAML field. Functionally handled; structurally incomplete. |
| 13 | Pre-commit hook execution via repo-orchestrator | Cannot confirm from this recipe file alone whether repo-orchestrator's contract includes pre-commit hook execution. This is a dependency gap. |
| G-009 | `Distinct Agents` vs `Agent Calls` field naming | Minor naming discrepancy from gate criterion wording; functionally equivalent. |

### Cross-Cutting Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G-003 | PASS | Tether/Vanish pattern in approval-prompt.md; no AskUserQuestion in allowed-tools |
| G-008 | PASS | Forbidden direct tool use declared; all domain work routed through agents |
| G-009 | PASS with WARN | Level and agent count declared; field naming is `Distinct Agents` vs `Agent Calls` |
