---
name: start-feature
description: Create or resume a work context — issue + branch + STM directory
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet

intent: >
  Create or resume a work context — issue + branch + STM directory —
  as the universal precursor to all tracked work.

constraints:
  - Must always be the first step for any work
  - Issue must be resolved or created on GitHub before any branch work
  - Branch name MUST follow convention: {type}/{issue_number}-{slug}
  - Slug max 40 characters, lowercase, hyphenated, derived from issue title
  - User must approve before branch creation — branches are externally visible
  - STM directory must be initialized with required subdirectories
  - If type_hint is null, user MUST select type before proceeding
  - Two-phase STM write when issue does not yet exist (ADR 008)
  - Orchestrator MUST delegate to agents — never execute git/gh commands directly
  - Maximum 2 distinct agents (project-orchestrator, repo-orchestrator); each may be called multiple times
  - Recovery agent calls are exempt from the agent limit

failure_conditions:
  - User rejects proposed branch at checkpoint (Vanish)
  - Branch creation fails on origin
  - Issue cannot be resolved or created on GitHub
  - Issue ID not found (resume mode)
  - Branch already exists and has conflicts
  - type_hint is null and user does not provide a selection
---

# start-feature

Universal precursor to all tracked work. Creates or resumes a work context: GitHub issue, type-aware branch, and STM directory.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, or any direct git/gh commands.

## Input Patterns

| Pattern | Mode | Example |
|---------|------|---------|
| `"Add OAuth login"` | NEW | Create issue, create branch, initialize STM |
| `42` or `#42` | NEW | Resolve existing issue, create branch, initialize STM |
| `--resume 42` | RESUME | Resolve issue, checkout existing branch, verify STM |
| `--parent 10` | (modifier) | Attach as sub-issue to parent |

```
/start-feature "Add OAuth login"                    → NEW mode
/start-feature 42                                   → NEW mode (existing issue)
/start-feature --resume 42                          → RESUME mode
/start-feature "Login validation" --parent 42       → NEW mode with parent
```

## Agent Routing

| Domain | Agent | Intent Slice |
|--------|-------|--------------|
| Issue resolution/creation, epic linking | project-orchestrator | Resolve or create GitHub issue for tracking |
| Branch creation, checkout, push to origin | repo-orchestrator | Create and push type-aware branch; or checkout existing branch (resume) |
| Checkpoint, STM initialization, failure condition verification | orchestrator (this recipe) | Approve branch creation; initialize STM directory; check post-execution state |

When invoking agents, provide recipe context:

```
---
Recipe context:
  intent: "Create or resume a work context — issue + branch + STM directory"
  constraints: ["{relevant constraints for this agent's task}"]
```

## References

### Templates

| Template | Path | Used For |
|----------|------|----------|
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/start-feature/{YYYYMMDD-HHMMSS}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation (NEW mode only) |
| Feature Started | `templates/feature-started.md` | Final report with three-speeds routing |

### Contracts

These are interfaces that downstream recipes depend on.

**STM Directory Structure:**

```
.phoenix-os/{issue}/
├── spec/          # define-feature, start-planned-feature write here
├── design/        # design-feature, tech-designer write here
├── evidence/      # verify-feature, validator write here
├── delivery/      # deliver-feature, create-pr write here
└── checkpoint/    # all recipes write checkpoint artifacts here
```

**Branch Naming Convention:**

```
{type}/{issue_number}-{slug}
```

| type_hint | Branch Prefix |
|-----------|---------------|
| `feature` | `feature/` |
| `fix` | `fix/` |
| `hotfix` | `hotfix/` |
| `refactor` | `refactor/` |
| `docs` | `docs/` |
| `chore` | `chore/` |
| `null` | User selects during checkpoint |

Slug: lowercase issue title, spaces/special chars → hyphens, no consecutive hyphens, max 40 chars, no trailing hyphens.

Reference: `~/.phoenix-os/core/memory/practices/git/branching.md`

**Two-Phase STM Write (ADR 008):**

When issue number is not yet known (description-only input):
- **Phase 1:** Write to `.phoenix-os/_pending/{YYYYMMDD-HHMMSS}/` (temporary)
- **Phase 2:** After issue is created, move to `.phoenix-os/{issue}/` and delete `_pending/` entry

When issue number is known upfront: write directly to `.phoenix-os/{issue}/`.

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 2 (project-orchestrator, repo-orchestrator) |
| Checkpoint | NEW mode: always. RESUME mode: only if STM created. |
