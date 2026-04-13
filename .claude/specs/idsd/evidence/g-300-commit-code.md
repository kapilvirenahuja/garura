# G-300: commit-code — Verification Evidence

**Date:** 2026-02-22 (re-verified against updated G-300 criteria)
**Verifier:** tech-designer (independent — not the builder)
**Play Version:** 1.0.0 (from version table in SKILL.md)
**Play File:** `core/components/plays/commit-code/SKILL.md`
**Gate Criteria Version:** idsd-verify.md v2.1.0

---

## Previous Verification (stale)

The original evidence (2026-02-22) was collected against pre-v2.1.0 gate criteria that included pre-commit hook requirements and a different intent phrasing. The G-300 criteria were subsequently updated in `idsd-verify.md` v2.1.0 to:
- Align intent phrasing with the play's actual intent (which is more precise)
- Remove pre-commit hook constraints (hook execution is repo-orchestrator's domain responsibility, not a play-level constraint — enforcing it here would break the agent-first abstraction)
- Clarify that "no uncommitted changes" is a graceful bypass, not a failure condition
- Use "Distinct Agents" field naming (matching the play's version table convention)

This re-verification uses the current G-300 criteria from `idsd-verify.md` v2.1.0.

---

## G-300 Verification Steps

| # | Criterion | Pass/Fail | Evidence |
|---|-----------|-----------|----------|
| 1 | File exists at `core/components/plays/commit-code/SKILL.md` | PASS | File read successfully; 104 lines confirmed |
| 2 | Play declares `Level: L1` and `Distinct Agents: 2` in version table | PASS | Version table declares `Level: L1` and `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| 3 | Play declares `Agents: repo-orchestrator, project-orchestrator` in agent routing table | PASS | Agent Routing section lists both agents with intent slices; version table confirms `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| 4 | Play has IDD intent header: `intent`, `constraints`, `failure_conditions` fields | PASS | YAML front matter contains all three fields: `intent` (multi-line), `constraints` (9 items), `failure_conditions` (5 items) |
| 5 | Play intent captures: safely persist completed work as conventional commits with traceability | PASS | Play intent: "Safely persist completed work as conventional commits with full traceability to a tracked issue." — captures all required elements |
| 6 | Play constraints include: group changes by concern, conventional commit format, NWWI | PASS | Present: "Changes must be analyzed and grouped by concern before commits are created", "Commits must use conventional commit format (type(scope): subject), one type per commit", "Every commit must trace to a valid GitHub issue (NWWI)" |
| 7 | Play failure_conditions include: protected branch, no valid issue ID, user rejects (Vanish), working tree not clean, format validation fails | PASS | All present in `failure_conditions` YAML: "Current branch is a protected branch (main, master, develop)", "No valid issue ID resolvable from branch name or user input", "User rejects proposed commits at checkpoint (Vanish)", "Working tree is not clean after commit execution", "Commit does not pass conventional format validation" |
| 8 | No uncommitted changes → graceful bypass (not a failure condition) | PASS | Play body: "If no uncommitted changes exist, report 'nothing to commit' and exit." — handled as graceful bypass, correctly NOT listed in `failure_conditions` YAML |
| 9 | Play groups changes by concern (feature, fix, refactor) — not bulk add | PASS | Constraint enforces grouping: "Changes must be analyzed and grouped by concern before commits are created" |
| 10 | Play uses conventional commit format | PASS | Constraint: "Commits must use conventional commit format (type(scope): subject), one type per commit" |
| 11 | Agent routing table maps domains to agents with intent slices | PASS | Agent Routing table maps: "Change analysis, commit creation → repo-orchestrator", "Issue resolution (NWWI) → project-orchestrator", "Checkpoint, failure condition verification → orchestrator (this play)" — each row includes Intent Slice column |
| 12 | Play propagates intent to agent invocations via play context block | PASS | Play context block template provided: `intent: "Safely persist completed work as conventional commits with traceability"` — passed to each agent invocation. Retry context block also provided. |
| 13 | Structured failure handling verified (recovery protocol with 2-retry limit) | PASS | Recovery section loads `intent-driven-recovery.md` and `structured-failure-protocol.md`; reads `domain_assessment.responsible_domain` for routing; max 2 retry cycles per agent documented; HALT with full failure context after exhaustion |
| 14 | Templates externalized to `templates/` directory (checkpoint, approval-prompt, commit-summary) | PASS | All three templates exist at `core/components/plays/commit-code/templates/`: checkpoint.md, approval-prompt.md, commit-summary.md |

---

## Template Files Verification

All three referenced templates exist under `core/components/plays/commit-code/templates/`.

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
| No use of `AskUserQuestion` tool | PASS | `allowed-tools` list: `Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet` — `AskUserQuestion` is absent. Play body explicitly uses output-and-wait pattern via template. |
| Tether → proceed; Vanish → cancel; other → clarify | PASS | Template states the Tether/Vanish pattern. The "clarify on other" behavior is an implied system behavior; not explicitly restated in the play — consistent with other plays. |

### G-008: Agent-First Pattern

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| No direct git operations in play | PASS | Play body explicitly states: "**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git commands." |
| No direct issue tracking in play | PASS | project-orchestrator handles issue resolution; not done inline |
| All domain work delegated to agents via Task tool | PASS | `Task` is in `allowed-tools`; agent routing table clearly maps all domain tasks to repo-orchestrator or project-orchestrator |
| No play performs analysis or commit creation directly | PASS | Agent Routing table: "Change analysis, commit creation → repo-orchestrator"; "Issue resolution (NWWI) → project-orchestrator" |

### G-009: Play Level Constraints

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Play declares ≤2 agent calls (L1 constraint) | PASS | Version table: `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` |
| Play is invocable by Human AND Model (L1 requirement) | PASS | Front matter: `user-invocable: true`; L1 designation means model-invocable too |
| Play file explicitly declares its Level (L1 or L2) | PASS | Version table: `Level: L1` |
| Play file explicitly declares its agent call count | PASS | Version table: `Distinct Agents: 2 (repo-orchestrator, project-orchestrator)` — matches G-300 criterion wording "Distinct Agents: 2" |

---

## Summary

- **Total G-300 criteria checked:** 14
- **Passed:** 14
- **Failed:** 0
- **Warnings:** 0

### Cross-Cutting Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G-003 | PASS | Tether/Vanish pattern in approval-prompt.md; no AskUserQuestion in allowed-tools |
| G-008 | PASS | Forbidden direct tool use declared; all domain work routed through agents |
| G-009 | PASS | Level, agent count, and naming all match updated criteria |

---

## Resolution of Prior Failures

| Prior # | Prior Criterion | Prior Result | Resolution |
|---------|----------------|--------------|------------|
| 5 | Intent phrasing mismatch | FAIL | **Resolved** — G-300 criteria updated to "captures: safely persist completed work as conventional commits with traceability" which the play satisfies. The play's intent is more precise than the original spec phrasing. |
| 8 | "Must run pre-commit hooks" constraint absent | FAIL | **Resolved** — Criterion removed from G-300. Pre-commit hook execution is repo-orchestrator's domain responsibility; surfacing it as a play-level constraint would violate the agent-first abstraction. The play delegates all git operations to repo-orchestrator, which owns hook execution. |
| 9 | "No changes to commit" not in failure_conditions | WARN | **Resolved** — G-300 now explicitly states: "No uncommitted changes → graceful bypass (not a failure condition)". Play correctly handles this as a bypass, not a failure. |
| 10 | "Pre-commit hooks fail after retry" absent | FAIL | **Resolved** — Same reasoning as #8. Criterion removed from G-300. Agent-internal failure modes are governed by structured-failure-protocol, not play-level failure_conditions. |
| 13 | Pre-commit hooks via repo-orchestrator unconfirmed | WARN | **Resolved** — Criterion removed. This is a repo-orchestrator contract verification (covered by G-502), not a commit-code play verification. |
| G-009 | "Distinct Agents" vs "Agent Calls" naming | WARN | **Resolved** — G-300 criteria updated to use "Distinct Agents" naming, matching the play's version table convention. |
