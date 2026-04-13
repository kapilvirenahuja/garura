# Three Elements of Intent: Play Front-Matter Enforcement

## Problem

The IDD philosophy mandates every well-formed intent has exactly three elements: **Intent**, **Constraints**, **Failure Conditions**. All 4 plays violate this — they use a flat `description` field and scatter constraints/failure conditions through workflow steps.

## Decision: Schema Design

### Keep `description`, add `intent` alongside it

`description` is Claude Code's platform contract (short, for skill discovery). `intent` is the IDD contract (outcome-oriented, for agent decision-making). Different audiences, different purposes.

### Flat lists for constraints and failure_conditions

IDD values conciseness. Severity is expressed through natural language (MUST vs SHOULD). No nested objects.

### `intent` is a single string

One play = one intent. Multiple intents means split the play.

## New Front-Matter Schema

```yaml
---
name: string
description: string             # Kept: short summary for CLI/tooling discovery
user-invocable: boolean
model: string
allowed-tools: string

# === Three Elements of Intent (IDD) ===
intent: string                  # The positive space: what outcome this play achieves
                                # Business language, not technical. Self-evidently testable.

constraints:                    # The boundaries the solution must respect
  - string                      # Ordered by severity (hardest first)

failure_conditions:             # Halt signals — when to abort execution
  - string                      # Agents check these continuously
---
```

## Proposed Content Per Play

### commit-code (L1)

```yaml
intent: >
  Safely persist completed work as conventional commits with full traceability
  to a tracked issue.

constraints:
  - All commits MUST reference a valid GitHub issue (NWWI principle)
  - Commits MUST use conventional commit format (type(scope): subject)
  - One logical change type per commit
  - Sensitive files (credentials, secrets, env) require explicit human approval
  - Orchestrator MUST delegate to agents — never execute git commands directly
  - Maximum 2 agent calls per execution

failure_conditions:
  - No valid issue ID resolvable from branch name or user input
  - User rejects proposed commits at checkpoint (Vanish)
  - Working tree is not clean after commit execution
  - Commit does not pass conventional format validation
```

### create-pr (L1)

```yaml
intent: >
  Submit work for peer review via a pull request with dynamically generated,
  evidence-based quality assurance.

constraints:
  - MUST be associated with a GitHub issue extracted from branch name (NWWI)
  - Always checkpoint before PR creation — PRs are externally visible
  - Quality checklist MUST distinguish must-have (blocking) from nice-to-have items
  - Orchestrator MUST delegate to agents — never execute gh commands directly
  - Maximum 2 agent calls per execution

failure_conditions:
  - No issue number extractable from the current branch name
  - User rejects proposed PR at checkpoint (Vanish)
  - Blocking quality checklist items have FAIL status
  - PR creation fails on the remote
```

### start-feature (L1)

```yaml
intent: >
  Begin tracked, governed work on a defined goal by establishing an issue
  and a type-aware branch pushed to origin.

constraints:
  - Branch name MUST follow convention: {type}/{issue_number}-{slug}
  - Slug max 40 characters, lowercase, hyphenated, derived from issue title
  - Always checkpoint before branch creation — branches are externally visible
  - If type_hint is null, user MUST select type before proceeding
  - Two-phase STM write when issue does not yet exist (ADR 008)
  - Orchestrator MUST delegate to agents — never execute git/gh commands directly
  - Maximum 2 agent calls per execution

failure_conditions:
  - User rejects proposed branch at checkpoint (Vanish)
  - Branch creation fails on origin
  - Issue cannot be resolved or created on GitHub
  - type_hint is null and user does not provide a selection
```

### start-planned-feature (L2)

```yaml
intent: >
  Deliver a complete feature or bug fix — from analysis through implementation
  to pull request — with a structured plan approved by the user before any
  code changes.

constraints:
  - MUST NOT call EnterPlanMode or ExitPlanMode — all planning via Plan sub-agent
  - Single approval gate only (Tether/Vanish at plan review) — execution is autonomous after
  - Planning phase is read-only — no code changes until plan is approved
  - Plan output MUST be persisted as three artifacts (spec.md, verify.md, tasks.md)
  - Orchestrator MUST delegate to agents — never execute tools directly
  - Maximum 5 agent calls (L2 limit)
  - Null type_hint defaults to feature/ prefix

failure_conditions:
  - User rejects plan at approval gate (Vanish)
  - Code-builder reports success: false with unresolvable issues
  - Branch creation fails on origin
  - PR creation fails after commits are made
  - Plan sub-agent fails to produce all three required sections (SPEC, VERIFY, TASKS)
```

## Agent Consumption Model

Agents use the Three Elements as their decision space (per IDD lines 124-128):

| Check | Action |
|-------|--------|
| Am I moving toward the intent? | Continue |
| Am I within constraints? | Continue |
| Have I hit a failure condition? | Halt |
| Have I achieved the intent? | Done |

The front-matter is parsed by Claude Code at load time and included in the model's context. No programmatic API — the structure is for **model consumption** and **human documentation**.

## Impact

| Area | Impact |
|------|--------|
| Claude Code skill loading | None — unknown YAML fields are passed through |
| `description` consumers | None — field preserved unchanged |
| Workflow behavior | None — Three Elements formalize what's already implicit |
| `sync-claude` deployment | None — file copy, format-agnostic |
| Play documentation (`mrd-plays.md`) | Update required — templates need new fields |

## Scope

- 4 play SKILL.md files (front-matter only, no workflow body changes)
- 1 documentation file (`docs/components/mrd-plays.md`)
- Optional: 1 new ADR (`docs/adr/009-play-three-elements.md`)
