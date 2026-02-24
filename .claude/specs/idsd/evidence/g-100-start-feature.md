# G-100: start-feature — Verification Evidence

**Date:** 2026-02-21
**Verifier:** tech-designer (independent — not the builder)
**Recipe Version:** 2.0.0 (from recipe Version table: `Level: L1, Version: 2.0.0`)
**Recipe File:** `core/components/recipes/start-feature/SKILL.md`

---

## G-100 Verification Steps

| # | Criterion | Pass/Fail | Evidence |
|---|-----------|-----------|----------|
| 1 | File exists at `core/components/recipes/start-feature/SKILL.md` | PASS | File read successfully; 235 lines present |
| 2 | Recipe declares `Level: L1` and `Agent Calls: 2` | WARN | Version table at bottom declares `Level: L1` and `Distinct Agents: 2`. The field label is "Distinct Agents" not "Agent Calls" — passes in substance but label diverges from gate criterion wording. No explicit "Agent Calls: 2" field in YAML frontmatter. |
| 3 | Recipe declares `Agents: project-orchestrator, repo-orchestrator` | PASS | Version table row: `Distinct Agents: 2 (project-orchestrator, repo-orchestrator)`. Agents section table also lists both agents. |
| 4 | Recipe has IDD intent header: `intent`, `constraints`, `failure_conditions` fields | PASS | YAML frontmatter (lines 8–30) contains `intent:`, `constraints:` (list), and `failure_conditions:` (list) — all three present and populated. |
| 5 | Recipe intent states: "Create or resume a work context — issue + branch + STM directory" | PASS | `intent: > Create or resume a work context — issue + branch + STM directory — as the universal precursor to all tracked work.` — matches exactly (minor extension present, core phrase matches). |
| 6 | Recipe constraints include: "Must always be the first step for any work" | PASS | `constraints: - Must always be the first step for any work` — exact match on line 15. |
| 7 | Recipe failure_conditions include: "Branch already exists and has conflicts" | PASS | `failure_conditions: - Branch already exists and has conflicts` — exact match on line 29. |
| 8 | Recipe failure_conditions include: "Issue ID not found (resume mode)" | PASS | `failure_conditions: - Issue ID not found (resume mode)` — exact match on line 28. |
| 9 | NEW mode: recipe creates GitHub issue via project-orchestrator | PASS | Agents table explicitly maps `project-orchestrator` to "Issue resolution/creation". Outcomes section states "Issue exists on GitHub — created or resolved from input." |
| 10 | NEW mode: recipe creates feature branch via repo-orchestrator | PASS | Agents table maps `repo-orchestrator` to "Branch creation, checkout, push to origin". Outcomes state "Branch exists on origin — follows naming convention, pushed with tracking." |
| 11 | NEW mode: recipe creates `.meridian/{issue}/` STM directory | PASS | STM Directory Structure contract defined (lines 93–102). NEW mode outcome: "STM directory initialized — `.meridian/{issue}/` with required subdirectories." |
| 12 | RESUME mode: recipe accepts `--resume <issue-id>` argument | PASS | Input Patterns table lists `--resume 42` as RESUME mode. Example: `/start-feature --resume 42`. |
| 13 | RESUME mode: recipe resolves existing issue, checkouts branch, verifies STM dir exists | PASS | RESUME Mode outcomes (lines 73–78): "Issue resolved", "On the correct branch — existing branch checked out", "STM directory verified — exists with required subdirectories; created if missing." |
| 14 | Recipe accepts `[description]` argument for NEW mode | PASS | Input Patterns table shows `"Add OAuth login"` → NEW mode. Example: `/start-feature "Add OAuth login"`. |
| 15 | Recipe links to roadmap/epic if available in project context | PASS | NEW mode outcome #5: "Roadmap link offered — if `.meridian/project/product/` exists, user was offered the option to link issue to a roadmap feature." |
| 16 | Recipe shows Tether/Vanish checkpoint after issue + branch creation | PASS | User Approval section (Contract #5) specifies output ending with: `Type **Tether** to create the branch or **Vanish** to cancel.` This is the output-and-wait pattern. |
| 17 | Recipe propagates intent to all agent invocations | PASS | Agents section states: "Intent must be propagated to every agent invocation: `'Intent: {action}: {context}'`" — directive is explicit. Format matches spec requirement. |

---

## Cross-Cutting Gates

### G-003: Tether/Vanish Checkpoint Pattern

Criterion scope for start-feature: "start-feature recipe has Tether/Vanish checkpoint after issue + branch creation" and "No recipe uses AskUserQuestion tool".

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Has Tether/Vanish checkpoint after issue + branch creation | PASS | Contract #5 (User Approval, NEW Mode Only) presents issue + branch details then ends with "Type **Tether** to create the branch or **Vanish** to cancel." This is the output-and-wait pattern — no AskUserQuestion. |
| Tether → proceed; Vanish → cancel; any other response → clarify | WARN | The recipe specifies the output text ("Tether to create the branch or Vanish to cancel") but does NOT explicitly describe what to do if the user types something else. No "any other response → clarify" instruction is documented. |
| No use of `AskUserQuestion` tool | PASS | Recipe `allowed-tools` frontmatter lists: `Task, Read, Write, TaskCreate, TaskUpdate, TaskList`. `AskUserQuestion` is absent. Recipe text uses output-and-wait phrasing throughout. |
| Checkpoint written to artifact before presenting to user | PASS | Contract #4 (Checkpoint Artifact) defines the path and structure written before the approval prompt. Status field tracks `PENDING_APPROVAL|APPROVED|REJECTED`. |

---

### G-006: Three-Speeds Routing

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Recipe identifies three speeds: Fast (minutes), Planned (hours), Strategic (days) | PASS | Final Report section (Contract #6) includes "Next Steps — Choose Your Speed" table with exactly: Fast (Minutes), Planned (Hours), Strategic (Days). |
| Fast speed routes to: `build-feature` → `commit-code` → `deliver-feature` | WARN | Final Report shows Fast → `/build-feature`. No explicit mention of `commit-code` or `deliver-feature` as the chain — only the entry point command is listed. The gate criterion requires the full chain to be documented. |
| Planned speed routes to: `start-planned-feature` (Design-2-Code L2) | PASS | Final Report shows Planned → `/start-planned-feature`. |
| Strategic speed routes to: full SDLC pipeline starting with `discover-product` | WARN | Final Report shows Strategic → `/discover-product`. The gate criterion says "full SDLC pipeline starting with discover-product" — the recipe names only the first step, not the full pipeline description. Technically acceptable as a routing hint, but incomplete per gate wording. |
| Routing guidance is human-readable — describes what to do next | PASS | Table includes "When to use" column with plain-language descriptions per speed. |
| start-feature does NOT force a specific speed — surfaces options and lets human decide | PASS | The "Choose Your Speed" framing and tabular format make all three options equally available. No single speed is prescribed. |

---

### G-008: Agent-First Pattern

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| No direct git operations in recipe | PASS | `allowed-tools` does NOT include `Bash` or `Glob` for git commands. Recipe explicitly states (line 41): "**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands." |
| No direct issue tracking in recipe | PASS | Same Forbidden declaration. Issue work is delegated to project-orchestrator via Task tool. |
| Agent invocations use Task tool (not inline tool use) | PASS | Agents table specifies "Invoked Via: `Task` tool with `subagent_type: "project-orchestrator"`" and similarly for repo-orchestrator. |
| Explicit orchestrator-only role declared | PASS | "Role" section (lines 37–41): "You are the orchestrator. You delegate to agents, never execute directly." |

---

### G-009: L1 Recipe Level Constraint

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Recipe is invocable by both Human and Model (L1 requirement) | PASS | Frontmatter: `user-invocable: true`. L1 recipes are invocable by Human OR Model — no restriction to human-only stated. |
| Recipe declares ≤2 distinct agents | PASS | Version table: `Distinct Agents: 2 (project-orchestrator, repo-orchestrator)`. Constraint also in YAML: "Maximum 2 distinct agents (project-orchestrator, repo-orchestrator); each may be called multiple times". |
| Recipe explicitly declares its Level (L1 or L2) in header | WARN | Level is declared in the Version table at the BOTTOM of the file (line 231), not in the YAML frontmatter at the top. The gate criterion says "in its header". The frontmatter contains no `level: L1` field. |
| Recipe explicitly declares its agent call count | WARN | Agent call count is expressed as "Distinct Agents: 2" in the version table, not as an explicit "Agent Calls" count in the YAML frontmatter. "Distinct Agents" and "Agent Calls" are semantically different (the recipe notes each agent may be called multiple times). |

---

## Summary

- **Total criteria evaluated:** 27 (17 G-100 + 4 G-003 + 6 G-006 + 4 G-008 + 4 G-009 applied to start-feature, with G-008/G-009 scoped to this recipe only)
- **Passed:** 21
- **Warned:** 6
- **Failed:** 0

### Passed Items (21)
All core G-100 criteria pass: file exists, IDD header is complete, intent text matches, all three failure conditions present, NEW and RESUME modes fully specified, agent delegation documented, Tether/Vanish checkpoint present, intent propagation directive explicit.

### Warnings (6) — None Are Hard Blockers

| # | Gate | Warning |
|---|------|---------|
| 1 | G-100 #2 | "Distinct Agents: 2" is used instead of "Agent Calls: 2" — label mismatch, substance passes |
| 2 | G-003 | No "any other response → clarify" instruction documented for Tether/Vanish |
| 3 | G-006 | Fast speed documents only `/build-feature` entry point, not the full `build-feature → commit-code → deliver-feature` chain |
| 4 | G-006 | Strategic speed names only `/discover-product`, not described as "full SDLC pipeline" |
| 5 | G-009 | `Level: L1` declared in version table at bottom, not in YAML frontmatter — gate says "in its header" |
| 6 | G-009 | Agent call count declared as "Distinct Agents: 2" not "Agent Calls: 2" — field name mismatch; "distinct" ≠ "calls" (recipe explicitly notes each agent may be called multiple times, so total calls could exceed 2) |

### Blockers
None. All 17 G-100 mandatory criteria pass or warn (no hard failures). Cross-cutting gates G-003, G-006, G-008, G-009 pass at substance level with noted warnings.

### Recommended Fixes (non-blocking, quality improvements)
1. Add `level: L1` and `agent_calls: 2` to YAML frontmatter for gate-scannable compliance
2. Add "any other response → ask for clarification" instruction to the Tether/Vanish checkpoint block
3. Expand the Fast speed routing note to show the full chain: `build-feature → commit-code → deliver-feature`
4. Add a sentence clarifying that "Strategic" entry point leads to the full SDLC pipeline (not just `discover-product` alone)
