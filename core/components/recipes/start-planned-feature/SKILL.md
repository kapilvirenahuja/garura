---
name: start-planned-feature
description: "NEVER call EnterPlanMode. Quick idea-to-PR: plan with IDD principles, build, deliver."
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# CRITICAL: DO NOT ENTER PLAN MODE

**You MUST NOT call `EnterPlanMode` or `ExitPlanMode`. Zero exceptions.**

All planning is via the Plan sub-agent (Task tool). You are the orchestrator.

---

# start-planned-feature

## Intent

```yaml
intent: "Quick idea-to-PR: resolve or create issue, produce lightweight IDD-aware planning artifacts, build working code, and deliver via pull request — all in one flow without full spec ceremony"

constraints:
  pre_flight:
    - id: C1
      check: current branch NOT IN [main, master, develop] OR no branch yet (new issue flow)
      halt_message: "Protected branch — start-planned-feature must run from a feature branch, not a protected branch"
    - id: C2
      check: intent is not empty and contains enough context for Plan sub-agent to derive a design
      halt_message: "Intent too vague — provide a description or issue number to proceed"

  behavioral:
    - id: C3
      rule: "MUST NOT call EnterPlanMode or ExitPlanMode — all planning via Plan sub-agent"
    - id: C4
      rule: "Embeds start-feature flow (issue + branch + STM) — does not call it separately"
    - id: C5
      rule: "Plan sub-agent produces IDD-aware artifacts (each carries intent/constraints/failure_conditions forward)"
    - id: C6
      rule: "Planning artifacts are lightweight — no formal gates, no bundles, no audience separation"
    - id: C7
      rule: "Tasks must be granular enough for direct implementation with a dependency graph"
    - id: C8
      rule: "code-builder is scoped to CODE only — no documentation, no markdown, no config"
    - id: C9
      rule: "Single approval gate (Tether/Vanish at plan review) — execution is autonomous after"
    - id: C10
      rule: "Orchestrator MUST delegate to agents — never execute tools directly"
    - id: C11
      rule: "Maximum 4 distinct agents (project-orchestrator, Plan, code-builder, repo-orchestrator); recovery calls exempt"
    - id: C12
      rule: "Null type_hint defaults to feature/ prefix"

failure_conditions:
  - Intent too vague for Plan sub-agent to derive a meaningful design
  - User rejects plan at approval gate (Vanish)
  - Plan sub-agent fails to produce all three sections (SPEC, VERIFY, TASKS)
  - Implementation fails tests
  - Code-builder reports success: false with unresolvable issues
  - Branch creation fails on origin
  - PR creation fails after commits are made
```

Quick idea-to-PR: resolve issue, plan with IDD principles, build, and deliver via PR.

## Role

You are the orchestrator. You delegate to agents, never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct git/gh commands.

## Agent Routing

| Domain | Agent | Intent Slice |
|--------|-------|--------------|
| Issue resolution/creation, epic linking | project-orchestrator | Resolve or create GitHub issue for tracking |
| Codebase analysis, RCA, technical planning | Plan sub-agent (`subagent_type: "Plan"`) | Explore codebase, produce IDD-aware spec + verify + tasks |
| Branch creation, commits, PR | repo-orchestrator | Create branch; commit changes; create pull request |
| Code implementation (CODE ONLY) | code-builder (`subagent_type: "general-purpose"`) | Implement code changes per execution plan — no docs, no markdown, no config |

When invoking agents, provide recipe context:

```
---
Recipe context:
  intent: "Quick idea-to-PR with IDD-aware planning"
  pre_flight:
    C1: {PASS|FAIL}
    C2: {PASS|FAIL}
  behavioral_constraints:
    - "{relevant C-id rules for this agent's task}"
```

## Step 0: Pre-flight Evaluation

Before invoking any agent, evaluate all `pre_flight` constraints:

- **C1**: If resuming an existing branch, check it is not `main`, `master`, or `develop` — halt immediately if so
- **C2**: Verify intent is actionable — if empty or fewer than 3 meaningful words with no issue reference, halt

If any pre-flight check fails: output the `halt_message` and exit. **Do not proceed to issue resolution or planning.**

Pass pre-flight results to all subsequent agent invocations:

```
pre_flight:
  C1: PASS | FAIL
  C2: PASS | FAIL
```

## Input Patterns

| Pattern | Example |
|---------|---------|
| `"Add OAuth login"` | Create issue, plan, build, PR |
| `42` or `#42` | Resolve existing issue, plan, build, PR |
| `--parent 10` | (modifier) Attach as sub-issue to parent |

## Workflow

Two phases separated by a single approval gate.

### Phase 1: PLANNING (read-only, user approval required)

#### 1. Resolve Issue

Invoke `project-orchestrator` — resolve or create issue. Derive branch name: `{type}/{issue_number}-{slug}`. Initialize STM directory at `.phoenix-os/{issue}/` with subdirectories: `spec/`, `design/`, `evidence/`, `delivery/`, `checkpoint/`.

Type mapping: feature, fix, hotfix, refactor, docs, chore. Null defaults to `feature/`.

Slug: lowercase, hyphens, max 40 chars. Reference: `~/.phoenix-os/core/memory/practices/git/branching.md`

#### 2. Deep Analysis + Plan (IDD-Aware)

Invoke **Plan sub-agent** via Task tool (`subagent_type: "Plan"`).

The prompt MUST instruct the Plan sub-agent to produce three sections, each beginning with an **IDD intent header** derived from the user's original intent. The TASKS section MUST produce granular, implementable tasks with a dependency graph.

Plan sub-agent prompt structure:

```
You are performing deep technical analysis for issue #{number} — {title}.

Issue body: {body}
Type: {type_hint}
Repository: {cwd}

## IDD Context
Intent: {user's original intent}
Constraints: {any constraints from issue or user input}
Failure conditions: {what would make this work fail}

## Instructions
1. Explore the codebase — find relevant files, understand patterns, trace dependencies
2. For bugs: identify root cause (what's broken, why, where)
3. For features: map architectural impact (what exists, what's needed, risks)
4. Design a technical approach with alternatives considered
5. Break the approach into granular, self-sufficient tasks with a dependency graph

Return THREE sections with exact headers:

---

## SPEC

**Intent:** {restate what this change aims to achieve}
**Constraints:** {boundaries that must be respected}
**Failure Conditions:** {when this work should be considered failed}

### Summary
{1-2 paragraphs}

### Root Cause (if bug)
{Omit if not a bug}

### Affected Files
| File | Role | Change Needed |
|------|------|---------------|

### Technical Approach
**Strategy:** {chosen approach}
**Alternatives Considered:** {approach → reason rejected}
**Risks:** {risk → mitigation → severity}

---

## VERIFY

**Intent:** {verify that the implementation satisfies the spec intent}

### Acceptance Criteria
- [ ] {criterion directly traceable to the intent}

### Verification Steps
| Step | Method | Expected Outcome |
|------|--------|-----------------|

### Edge Cases
| Scenario | Expected Behavior |
|----------|------------------|

---

## TASKS

**Intent:** {implement the spec through granular, dependency-ordered tasks}

### Dependency Graph
{Show task dependencies — which tasks block which. Simple notation:}
T1 → T2 → T4
T1 → T3 → T4

### Task Breakdown

#### T1: {description}
- **Files:** {paths with actions: create/modify/delete}
- **Details:** {specific changes — enough for code-builder to implement without guessing}
- **Depends on:** none
- **Expected Outcome:** {what success looks like}
- **Verification:** {how to confirm this step worked}

#### T2: {description}
- **Depends on:** T1
...
```

The Plan sub-agent returns text. It cannot write files.

#### 3. Write Planning Artifacts

Parse Plan sub-agent output. Write three files to STM:

1. `.phoenix-os/{issue}/planning/spec.md` — from `## SPEC`
2. `.phoenix-os/{issue}/planning/verify.md` — from `## VERIFY`
3. `.phoenix-os/{issue}/planning/tasks.md` — from `## TASKS`

Each file header:
```markdown
# {Section}: #{issue} — {title}
<!-- Generated by start-planned-feature | Plan sub-agent output -->
```

#### 4. APPROVAL GATE (Tether / Vanish)

Present plan summary using `templates/approval-prompt.md`. Do NOT use EnterPlanMode or AskUserQuestion.

Parse: `Tether`/`tether` → Phase 2. `Vanish`/`vanish` → halt, checkpoint REJECTED. Else → clarify.

**This is the ONLY approval gate in the entire recipe.**

### Phase 2: EXECUTION (autonomous, no further approvals)

#### 5. Persist Checkpoint + Create Branch

Write checkpoint to `.phoenix-os/{issue}/checkpoint/start-planned-feature/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: APPROVED.

Invoke `repo-orchestrator` — create and push branch `{type}/{issue_number}-{slug}`.

#### 6. Generate Execution Task Graph

Read `.phoenix-os/{issue}/planning/tasks.md`. Create Claude Tasks from the task breakdown:

- One task per `T{N}` entry from the dependency graph
- Each task description contains ALL context: files, changes, expected outcome, verification
- Set `addBlockedBy` per the dependency graph from tasks.md
- **code-builder tasks are CODE ONLY** — if a task involves documentation or markdown, the orchestrator handles it directly

#### 7. Implement Changes

Invoke `code-builder` (`subagent_type: "general-purpose"`) with the execution plan.

**Scope boundary:** code-builder implements CODE changes only. No documentation, no markdown files, no config design. If the plan includes non-code artifacts, the orchestrator writes them.

If code-builder reports `success: false` with unresolvable issues → halt recipe, save evidence.

#### 8. Commit + Create PR

Invoke `repo-orchestrator` — commit (grouped by type) + create PR with plan references in body.

#### 9. Report

Save evidence to `.phoenix-os/{issue}/evidence/implementation.md`. Present final report using `templates/final-report.md`.

## References

### Templates

| Template | Path | Used For |
|----------|------|----------|
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.phoenix-os/{issue}/checkpoint/start-planned-feature/{ts}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation |
| Final Report | `templates/final-report.md` | Completion summary |

### Contracts

**STM Directory Structure** (created in Step 1, same as start-feature):

```
.phoenix-os/{issue}/
├── spec/          # define-feature, start-planned-feature write here
├── design/        # design-feature, tech-designer write here
├── evidence/      # verify-feature, validator write here
├── delivery/      # deliver-feature, create-pr write here
├── checkpoint/    # all recipes write checkpoint artifacts here
└── planning/      # start-planned-feature planning output (lightweight)
```

**Branch Naming Convention:** `{type}/{issue_number}-{slug}`

Reference: `~/.phoenix-os/core/memory/practices/git/branching.md`

## Recovery

Load recovery reasoning from: `~/.phoenix-os/core/memory/practices/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + the original intent
- Max 2 retry cycles per agent. After that, HALT with full failure context.

---

## Version

| Field | Value |
|-------|-------|
| Level | L2 |
| Version | 3.0.0 |
| Distinct Agents | 4 (project-orchestrator, Plan, code-builder, repo-orchestrator) |
| Checkpoint | Single (plan approval via Tether/Vanish) |
