---
name: start-feature
description: Create or resume a work context — issue + branch + STM directory
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# start-feature

## Intent

```yaml
intent: "Create or resume a work context — issue + branch + STM directory — as the universal precursor to all tracked work"

constraints:
  pre_flight:
    - id: C1
      check: RESUME mode → current branch NOT IN [main, master, develop]
      halt_message: "Protected branch — cannot resume from a protected branch"
    - id: C2
      check: issue ID resolvable (NEW with existing issue or RESUME) OR description provided (NEW)
      halt_message: "No issue reference or description provided — cannot create work context"

  behavioral:
    - id: C3
      rule: "Issue must be resolved or created on GitHub before any branch work"
    - id: C4
      rule: "Branch name MUST follow convention: {type}/{issue_number}-{slug}"
    - id: C5
      rule: "If type_hint is null, user MUST select type before proceeding"
    - id: C6
      rule: "User must approve branch creation — branches are externally visible (NEW mode only)"
    - id: C7
      rule: "STM directory must be initialized with required subdirectories"
    - id: C8
      rule: "Two-phase STM write when issue does not yet exist (ADR 008)"
    - id: C9
      rule: "Orchestrator MUST delegate to agents — never execute git/gh commands directly"
    - id: C10
      rule: "Maximum 2 distinct agents (project-orchestrator, repo-orchestrator); recovery calls exempt"

failure_conditions:
  - User rejects proposed branch at checkpoint (Vanish)
  - Branch creation fails on origin
  - Issue cannot be resolved or created on GitHub
  - Issue ID not found (resume mode)
  - type_hint is null and user does not provide a selection
```

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

**Agent boundaries:**
- `project-orchestrator` — issue domain only: resolve or create GitHub issues
- `repo-orchestrator` — git domain only: create/push/checkout branches
- Everything else (STM initialization, checkpoint writes, evidence, reporting) — orchestrator owns it

## Input Patterns

| Pattern | Mode | Example |
|---------|------|---------|
| `"Add OAuth login"` | NEW | Create issue, create branch, initialize STM |
| `42` or `#42` | NEW | Resolve existing issue, create branch, initialize STM |
| `--resume 42` | RESUME | Resolve issue, checkout existing branch, verify STM |
| `--parent 10` | (modifier) | Attach as sub-issue to parent |

## Phases

| Step | Name | Agent |
|------|------|-------|
| Step 0 | Pre-flight | repo-orchestrator |
| Step 1 | Resolve Issue | project-orchestrator |
| Step 2 | Checkpoint | orchestrator |
| Step 3 | Branch + STM | repo-orchestrator + orchestrator |
| Step 4 | Report | orchestrator |

## Workflow

### Step 0 — Pre-flight

Evaluate pre-flight constraints before invoking any agent:

- **C1 (RESUME only):** If `--resume` flag present, verify current branch is not `main`, `master`, or `develop` — halt immediately if so
- **C2:** Verify input is actionable — issue number, `--resume N`, or a non-empty description. If none, halt.

If any check fails: output the `halt_message` and exit.

### Step 1 — Resolve Issue

Invoke `project-orchestrator`:

- **NEW (description):** Create GitHub issue. Return issue number, title, type_hint.
- **NEW (issue number):** Resolve existing issue. Return issue number, title, type_hint.
- **RESUME:** Resolve issue by number. Return issue number, title, existing branch name.
- **`--parent` modifier:** Attach new issue as sub-issue to parent after creation.

Provide recipe context:
```
---
Recipe context:
  intent: "Create or resume a work context — issue + branch + STM directory"
  task: "Resolve or create GitHub issue. Return issue number, title, type_hint, and existing branch name if resuming."
  mode: {NEW|RESUME}
  input: {description or issue number}
  parent: {parent_issue_number or null}
  behavioral_constraints:
    - C3: "Issue must be resolved or created on GitHub before any branch work"
```

**Expected output:**
```yaml
issue:
  number: {integer}
  title: {string}
  type_hint: {feature|fix|hotfix|refactor|docs|chore|null}
  existing_branch: {branch_name or null}  # RESUME only
```

If `type_hint` is null → present type selection to user before proceeding (C5).

Derive branch name: `{type}/{issue_number}-{slug}`
- Slug: lowercase, hyphens, max 40 chars, no consecutive or trailing hyphens

### Step 2 — Checkpoint

**The orchestrator owns this step entirely. Do not delegate.**

**RESUME mode:** Skip checkpoint. Proceed directly to Step 3.

**NEW mode:**

Write checkpoint artifact to `.phoenix-os/{issue}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md` with Status: `PENDING_APPROVAL`.

Present branch proposal using `templates/approval-prompt.md`:
- Issue title and number
- Proposed branch name
- Type

Parse response: `Tether`/`tether` → proceed to Step 3. `Vanish`/`vanish` → update artifact Status to REJECTED, halt. Anything else → clarify.

Update checkpoint artifact Status to `APPROVED`.

### Step 3 — Branch + STM

#### Branch

**NEW mode:** Invoke `repo-orchestrator` with task: "Create and push branch `{branch_name}` from main. Return branch name and push status."

**RESUME mode:** Invoke `repo-orchestrator` with task: "Checkout existing branch `{existing_branch}`. Return branch name and current status."

#### STM Directory

**Orchestrator initializes STM — do not delegate.**

**Two-phase write (C8):**
- If issue was just created (description-only NEW): first write to `.phoenix-os/_pending/{YYYYMMDD-HHMMSS}/`, then move to `.phoenix-os/{issue}/` after issue number is confirmed
- Otherwise: write directly to `.phoenix-os/{issue}/`

Create subdirectories:
```
.phoenix-os/{issue}/
├── spec/
├── design/
├── evidence/
├── delivery/
└── checkpoint/
```

**RESUME mode:** Verify STM directory exists. If missing, create it.

### Step 4 — Report

**The orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.phoenix-os/{issue}/evidence/start-feature/{YYYYMMDD-HHMMSS}.md`:
- Mode (NEW / RESUME)
- Issue number and title
- Branch created or checked out
- STM initialized or verified

Present final report to user using `templates/feature-started.md`.

## Recovery

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + the original intent
- Max 2 retry cycles per agent. After that, HALT with full failure context.

## References

### Templates

| Template | Path | Used For |
|----------|------|----------|
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation (NEW mode only) |
| Feature Started | `templates/feature-started.md` | Final report |

### Contracts

**STM Directory Structure:**

```
.phoenix-os/{issue}/
├── spec/          # define-feature, start-planned-feature write here
├── design/        # design-feature, tech-designer write here
├── evidence/      # verify-feature, validator write here
├── delivery/      # deliver-feature, create-pr write here
└── checkpoint/    # all recipes write checkpoint artifacts here
```

**Branch Naming Convention:** `{type}/{issue_number}-{slug}`

| type_hint | Branch Prefix |
|-----------|---------------|
| `feature` | `feature/` |
| `fix` | `fix/` |
| `hotfix` | `hotfix/` |
| `refactor` | `refactor/` |
| `docs` | `docs/` |
| `chore` | `chore/` |
| `null` | User selects during checkpoint |

Reference: `~/.phoenix-os/core/memory/practices/git/branching.md`

**Two-Phase STM Write (ADR 008):**

When issue number is not yet known (description-only input):
- **Phase 1:** Write to `.phoenix-os/_pending/{YYYYMMDD-HHMMSS}/`
- **Phase 2:** After issue is created, move to `.phoenix-os/{issue}/` and delete `_pending/` entry

When issue number is known upfront: write directly to `.phoenix-os/{issue}/`.

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) |
| Checkpoint | NEW mode: always. RESUME mode: skipped. |
