# Verification: /ship L2 Recipe

---

## Gates

### G-001: Recipe Directory Structure
**Mandatory:** Yes
**Check:** Recipe follows the canonical directory structure:
```
core/components/recipes/ship/
  SKILL.md
  reference/
    intent.yaml
  templates/
    checkpoint.md
    guardian-decision.md
    final-report.md
```
**Evidence:** Glob for all files under `core/components/recipes/ship/`. Verify each required file exists.

### G-002: SKILL.md Frontmatter Valid
**Mandatory:** Yes
**Check:** SKILL.md has valid frontmatter with: `name: ship`, `description` present, `user-invocable: true`, `model: sonnet`, `allowed-tools` includes Task/Read/Write/TaskCreate/TaskUpdate/TaskList/TaskGet.
**Evidence:** Read lines 1-7 of SKILL.md, confirm all fields present and correct.

### G-003: Level Declared as L2
**Mandatory:** Yes
**Check:** Version table in SKILL.md declares `Level: L2`.
**Evidence:** Read Version table, confirm `Level | L2`.

### G-004: Intent Externalized to intent.yaml
**Mandatory:** Yes
**Check:** `reference/intent.yaml` contains:
1. `intent` string (business language, not technical)
2. `constraints.pre_flight` with C1, C2, C3 (each with `check` and `halt_message`)
3. `constraints.behavioral` with C4-C11
4. `failure_conditions` list with F1-F7
**Evidence:** Read intent.yaml, confirm all elements present and IDs match spec.

### G-005: SKILL.md References intent.yaml
**Mandatory:** Yes
**Check:** SKILL.md `## Intent` section contains the standard load directive: "BEFORE executing any step, read `reference/intent.yaml`"
**Evidence:** Read Intent section, confirm directive present.

### G-006: Agent Limit Respected
**Mandatory:** Yes
**Check:** SKILL.md declares <=5 distinct agents in Version table. Actual workflow uses <=5 distinct agent types.
**Evidence:** Read Version table for declared count. Trace all agent invocations in Workflow section — count distinct agent names.

### G-007: Guardian Logic is Inline
**Mandatory:** Yes
**Check:** Guardian evaluation logic is defined within SKILL.md workflow steps. No reference to `workflow-guardian` agent. No dependency on unimplemented agents.
**Evidence:** Grep SKILL.md for "workflow-guardian" — zero matches. Confirm guardian decision matrix exists within the workflow section.

### G-008: L1 Invocations Correct
**Mandatory:** Yes
**Check:** Steps 1 and 2 invoke existing L1 recipes (`commit-code`, `create-pr`) via Skill tool. Steps 3-5 use inline agent delegations (not non-existent L1 recipes).
**Evidence:** Read Steps 1-5. Confirm Step 1 references commit-code, Step 2 references create-pr. Confirm Steps 3-5 directly invoke repo-orchestrator.

### G-009: Skip-Logic Defined
**Mandatory:** Yes
**Check:** Recipe handles these skip conditions:
1. No uncommitted changes → skip commit step
2. PR already exists → skip create-pr step
3. No unpushed commits AND PR exists → skip to review
**Evidence:** Read Step 0 output and Step 1/2 skip conditions. Confirm all three scenarios handled.

### G-010: Self-Resolution Boundaries Correct
**Mandatory:** Yes
**Check:** Self-resolution strategies:
1. NEVER change code or documentation
2. CAN retry operations, create issues, adjust PR metadata, rebase, delete/recreate branches
3. Each resolution has a max attempt count
4. Unresolvable blockers create GitHub issues
**Evidence:** Read self-resolution section. Confirm CAN/CANNOT lists. Verify max attempts specified.

### G-011: Evidence Path Correct
**Mandatory:** Yes
**Check:** Evidence is written to `.meridian/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md` (matching config.yaml STM pattern).
**Evidence:** Read Report step. Confirm evidence path matches pattern.

### G-012: Checkpoint Template Valid
**Mandatory:** Yes
**Check:** `templates/checkpoint.md` follows the mandatory checkpoint schema:
- Metadata (Issue, Recipe, Step, Created, Status)
- Task List table
- Completed Outputs
- Current Step
- Inputs Needed to Continue
**Evidence:** Read checkpoint.md, confirm all mandatory fields present.

### G-013: Guardian Decision Template Exists
**Mandatory:** Yes
**Check:** `templates/guardian-decision.md` captures: step name, decision (auto-approve/halt), reason, evidence summary, blockers (if any).
**Evidence:** Read guardian-decision.md, confirm structure.

### G-014: Final Report Template Valid
**Mandatory:** Yes
**Check:** `templates/final-report.md` includes: issue, branch, PR number/URL, merge commit, steps executed (with status), guardian decisions.
**Evidence:** Read final-report.md, confirm all fields present.

### G-015: Halt Presentation Format
**Mandatory:** Yes
**Check:** When guardian halts, the presentation includes: blocker description, intent preserved, completed steps, failed step details, Tether/Vanish options, self-resolution attempts.
**Evidence:** Read guardian halt section in SKILL.md. Confirm all elements present.

### G-016: Recovery Section Follows Framework
**Mandatory:** Yes
**Check:** Recovery section:
1. Pre-flight failures are hard halts
2. Runtime failures follow recovery reasoning loop
3. Max retry counts specified
**Evidence:** Read Recovery section. Confirm all patterns.

### G-017: No Forbidden Tool Usage
**Mandatory:** Yes
**Check:** SKILL.md Forbidden section prohibits direct Bash/Grep/Glob/git/gh commands by the orchestrator. All git/gh operations delegated to agents.
**Evidence:** Read Role section. Confirm Forbidden list.

### G-018: Orchestrator Owns Non-Agent Steps
**Mandatory:** Yes
**Check:** Checkpoint writes, guardian evaluation, evidence writes, and report presentation are explicitly marked as orchestrator-owned.
**Evidence:** Read Steps 0, 6 and guardian evaluation sections. Confirm "orchestrator owns" directives.

### G-019: NWWI Enforced
**Mandatory:** Yes
**Check:** Issue number is required (C3 pre-flight). Evidence paths use issue number. Commit traceability maintained through commit-code L1.
**Evidence:** Read C3 in intent.yaml. Read evidence path template. Confirm issue number is structural requirement.

### G-020: Sync Deploys Correctly
**Mandatory:** No (advisory)
**Check:** After recipe creation, `/sync-claude` deploys to `~/.claude/skills/ship/`.
**Evidence:** Verify recipe appears in `~/.claude/skills/ship/SKILL.md` after sync.

### G-021: Component Documentation Updated
**Mandatory:** No (advisory)
**Check:** `docs/components/recipes.md` updated to include `ship` in the recipe listing.
**Evidence:** Read recipes.md, confirm ship recipe mentioned.

---

## Verification Execution Order

```
Phase 1 (structural — independent, run in parallel):
  G-001, G-002, G-003, G-004, G-005

Phase 2 (behavioral — after recipe files exist):
  G-006, G-007, G-008, G-009, G-010, G-011, G-017, G-018, G-019

Phase 3 (template validation — after templates exist):
  G-012, G-013, G-014, G-015

Phase 4 (framework compliance):
  G-016

Phase 5 (integration — after sync):
  G-020, G-021
```
