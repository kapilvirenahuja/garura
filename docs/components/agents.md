# Agents

Agents are autonomous decision-makers in Meridian with domain-specific expertise.

## Philosophy

Agents are **truly agentic** — they make all decisions within their domain. They are judges, not executors.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **One domain** | Each agent owns exactly one domain of expertise |
| **Decision makers** | Agents judge and decide, not just execute instructions |
| **Context sharing** | Agents build context and share it with skills they invoke |
| **Skill autonomy** | Agents decide which skills to use based on the situation |
| **Knowledge-driven** | Agents read from Long-Term Memory (LTM) to apply standards |

## Naming Convention

### The `{domain}-{role}` Pattern

All agents follow the **`{domain}-{role}`** naming pattern:

- **Domain**: The area of expertise (code, quality, tech, project, repo, product)
- **Role**: The function performed (builder, validator, designer, orchestrator, strategist)

This pattern ensures:
1. Clear ownership — each agent owns one domain
2. Predictable naming — easy to identify what an agent does
3. Right granularity — not too broad, not too narrow

### Role Types

| Role | Responsibility |
|------|----------------|
| **builder** | Creates, implements, constructs |
| **validator** | Tests, reviews, validates, enforces quality |
| **designer** | Analyzes, designs, architects |
| **orchestrator** | Coordinates, manages, tracks |
| **strategist** | Interprets product intent, selects and invokes skills, returns structured output |
| **manager** | Certifies, enforces standards, gates quality |

### Granularity Principle

Meridian avoids both extremes:

| Too Narrow | Too Granular | Right Level |
|------------|--------------|-------------|
| Generic role only | Task-specific specialist | Domain + role |
| `builder` | `bug-analyzer` | `{domain}-builder` |
| `designer` | `feature-implementer` | `{domain}-designer` |

**Principle:** 1 agent = 1 domain expertise, not 1 task.

**Note on play-scoped sub-roles:** Some plays define scoped sub-roles that are not standalone agents. For example, `test-writer` in the implement-epic play is a context-isolated sub-role that only exists within that play's execution. Play-scoped sub-roles follow ADR 004's granularity principle — they are too granular for standalone agents but serve a specific isolation purpose within a play.

## Available Agents

| Agent | Domain | Role | Model | Description |
|-------|--------|------|-------|-------------|
| `product-strategist` | product | strategist | opus | Autonomous decision-maker for product discovery, vision, roadmapping, and backlog management |
| `tech-designer` | design | designer | sonnet | Technical analysis, RCA, and solution design for features and bugs |
| `code-builder` | implementation | builder | sonnet | Executes structured execution plans for software implementation — requires a formal plan as input. ONLY for source code files. |
| `repo-orchestrator` | repo | orchestrator | sonnet | Autonomous decision-maker for repository operations (commits, branches, PRs, git state) |
| `project-orchestrator` | project | orchestrator | sonnet | Autonomous decision-maker for project management operations (issues, tracking, planning) |
| `engineering-manager` | engineering | manager | sonnet | QP compliance certifier — verifies implementation meets Quality Profile standards |
| `scriber` | infra | evidence-writer | haiku | Utility agent. Writes evidence, checkpoint, and status artifacts to disk for plays, enforcing the `.meridian/` folder whitelist at the write boundary. Runs in the background so orchestrators can continue domain work in parallel with evidence I/O. |

### Scriber dispatch pattern (Utility agent, 214.1)

`scriber` is a utility agent — it performs no domain reasoning and owns no decisions about content. Plays dispatch it via the Agent tool with `run_in_background: true` for every write that lands in the `.meridian/` folder whitelist (evidence, checkpoint, status artifacts). The scriber invokes the `write-evidence` skill, which is the single chokepoint that validates paths against the 9 whitelist patterns before calling `Write`.

**When to dispatch scriber instead of writing inline:**

| Artifact | Writer | Rationale |
|----------|--------|-----------|
| Plan output (spec.md, verify.md, tasks.md) | Play (inline) | User reads immediately — synchronous |
| Final report presented at play end | Play (inline) | User is waiting — synchronous |
| Checkpoint file at approval gate | `scriber` | Written before the gate; gate itself is user-blocked, so background write is fine |
| Checkpoint status updates after gate | `scriber` | Non-blocking status updates as the play progresses |
| Evidence files (step evals, scenario evals, traces) | `scriber` | Accumulated during play run; not user-facing until review |
| Status / resume-state files | `scriber` | Written continuously during play execution |
| Self-commit prep (files to stage) | Play (inline) | Orchestrator needs the paths in the same step |

**Rule of thumb:** if the orchestrator reads the file back in the same step, it writes inline. If the file is for later consumption (user review, resume, audit), it goes through scriber.

**Non-blocking guarantees:** scriber runs with `run_in_background: true`. Plays do NOT wait for scriber to finish before continuing. At play shutdown, the orchestrator briefly waits for any outstanding scriber tasks to complete (bounded wait) and then stages the scriber-written files for the self-commit step.

**Failure semantics:** scriber failure never halts a play. Evidence writes are non-critical by definition. On failure, the orchestrator logs a warning and continues. Exception: if a specific evidence write is required for a downstream step (e.g., self-commit), that specific write is blocking and scriber is awaited synchronously for that call.

**Reference adopter:** the `commit-code` play's `intent.yaml` carries constraint C8 that delegates evidence writes to scriber. This is the first play to adopt the pattern. Future plays (`spec-product`, `design-product`, `build-arch`) ship with scriber dispatch built in from the start.

## Agent Behavior

### Four Crafts: Where Agents Fit

Agents are the primary practitioners of **Context Crafting** — one of the Four Crafts in Meridian's architecture. When an agent receives a JSON contract, its most important work before invoking any skill is assembling complete, accurate context: discovering LTM paths (schemas, templates, standards), reading STM artifacts, and combining them with the slug and base paths into structured skill inputs. This context assembly is the agent's primary value in the play workflow — skills are only as effective as the context the agent gives them.

For the full Four Crafts explanation (Context Crafting, Intent Crafting, Execution Crafting, Verification Crafting), see `docs/philosophy/architecture.md`.

### JSON Contract Mode

When a play orchestrates multiple agents, it passes a **JSON contract** as the agent's prompt. This is the primary invocation mode within plays.

**When an agent receives a JSON contract:**

1. **Read intent.yaml** at `intent_path` from the contract — understand the goal, constraints, failure conditions, and scenarios.
2. **Identify what to handle** — look at `stm` paths in the contract. Null paths indicate missing artifacts. Based on the goal, the agent's domain, and what is missing, determine what to produce.
3. **Update task graph** — mark the agent's task as `in_progress` via TaskUpdate. Add new tasks via TaskCreate if additional work is discovered.
4. **Collect context from LTM** — search `~/.meridian/core/memory/` for domain-relevant standards, templates, and schemas. Pass discovered LTM paths to skills as input. Skills do NOT search LTM themselves.
5. **Read existing STM artifacts** — read non-null `stm` paths. Write context to STM if downstream agents need it.
6. **Call skills** from the agent's skill pool. The agent assembles skill inputs by combining: (1) STM artifact paths from the contract, (2) LTM paths discovered during context loading (schemas, templates, standards), and (3) the product slug and base STM path. The agent is responsible for giving the skill everything it needs — skills do NOT search or load LTM themselves. Skills read from the provided paths, write artifacts, and return a YAML output contract with the artifact path. Do NOT forward skill output as the response — extract only the artifact path.
7. **Validate outcomes** against failure conditions and scenarios from intent.yaml. Validation is silent — do NOT include validation results in the response. If validation fails, attempt self-recovery (max 2 attempts). If still failing, set `step_failure` in the contract.
8. **Mark task complete** — update task graph via TaskUpdate.
9. **Build and return the enriched JSON contract** — take the received contract as a base, update `stm` paths with artifact paths from skill output, add up to 3 short notes (1 sentence each), set `step_failure` if needed. Return ONLY this JSON object. Nothing else.

### Response Format (JSON Contract Mode)

The agent's entire response is ONE JSON object. No prose, no YAML blocks, no validation checklists before or after.

```json
{
  "intent_path": "reference/intent.yaml",
  "stm_base": ".meridian/project/product/",
  "slug": "chronos",
  "stm": {
    "vision_path": ".meridian/project/product/chronos/vision.md",
    "epics_path": ".meridian/project/product/chronos/epics.yaml",
    "feasibility_path": null,
    "brief_path": null,
    "approved_brief_path": null,
    "roadmap_path": null,
    "engineering_view_path": null
  },
  "checkpoints": [{ "name": "brief_review", "status": "pending" }],
  "evidence": [{ "name": "plan-roadmap", "location": null }],
  "notes": [
    "5 epics derived — all trace to distinct strategic goals",
    "E2 depends on E1 foundation investment — sequencing constraint"
  ],
  "step_failure": null
}
```

**Anti-patterns (NEVER do these in a JSON contract response):**
- "Epics written. Running final validation checklist:" — NO
- "Pre-return verification:" — NO
- Bullet lists of validation results — NO (put a 1-sentence summary in `notes` instead)
- YAML blocks like `scoped_epics:` or `feasibility:` or `brief:` — NO (that is skill output, not the agent's response)
- Any text before or after the JSON — NO

### Direct Invocation Mode

When an agent is invoked without a JSON contract (direct invocation, not via a play), it returns a structured YAML output contract specific to the skill invoked and the work done.

Each agent defines skill-specific return formats in its Output Contracts section. The agent identifies the intent, selects the matching skill, invokes it, and returns the skill-specific YAML result.

## Skill Pool Pattern

Each agent owns a set of skills. Agents invoke skills via the **Skill tool** provided by Claude Code. Agents are the only callers of those skills within their domain. The agent's skill pool table documents which skills it owns and when to use each.

### product-strategist Skill Pool

| Skill | Purpose |
|-------|---------|
| `discover-product-opportunity` | Parse problem/idea, extract market context |
| `draft-product-vision` | Create vision.md with Strategic Goals |
| `validate-product-vision` | Check vision completeness before lock |
| `generate-business-review` | PM-facing business review from any product artifact |
| `research-domain-context` | Research vertical domain knowledge via web when LTM is insufficient |
| `scope-roadmap-epics` | Extract epics from locked vision, scope into time buckets and priorities |
| `draft-roadmap-brief` | Generate lightweight review brief — bound by brief constraints |
| `draft-roadmap` | Generate full agentic roadmap.md post-Tether |
| `generate-engineering-view` | Engineering-facing roadmap view — no business content |

### tech-designer Skill Pool

| Skill | Purpose |
|-------|---------|
| `assess-feasibility` | Assess technical feasibility of scoped epics — invoked when `stm.feasibility_path` is null and `stm.epics_path` is non-null |

For direct invocations (no JSON contract), tech-designer performs RCA and feature analysis directly using its tools rather than via skills.

### code-builder Skill Pool

code-builder has no skills — it implements code directly using its tools (Bash, Read, Write, Edit, Grep, Glob) per the execution plan it receives.

### repo-orchestrator Skill Pool

| Skill | Purpose |
|-------|---------|
| `analyze-changes` | Analyze uncommitted changes, detect risks, suggest groupings |
| `create-commit` | Stage files and create conventional commit |
| `analyze-pr` | Analyze branch for PR readiness, generate quality checklist |
| `submit-pr` | Push branch and create pull request with checklist |
| `setup-branch` | Create branch, push to origin, optionally use worktree |

### project-orchestrator Skill Pool

| Skill | Purpose |
|-------|---------|
| `manage-issue` | Read, create, close, or resolve GitHub issues with optional sub-issue attachment |

## Agent Definition Structure

Agent definitions follow Claude Code's agent format:

Tool sets vary by role:

| Role | Typical Tools | Rationale |
|------|--------------|-----------|
| orchestrator | Task, Bash, Read, Write, Skill | Delegates work to skills |
| builder | Bash, Read, Write, Edit, Grep, Glob | Direct file manipulation |
| designer | Bash, Read, Grep, Glob, Write | Read-heavy exploration and plan output |
| strategist | Task, Read, Write, Glob, Grep, Skill, WebSearch, WebFetch | Product research and skill delegation |

**Note:** Some agents have explicit tool-specific constraints beyond the table above. For example, `tech-designer` restricts Bash to read-only operations (e.g., `git log`, `git blame`, `ls`) and explicitly forbids `git add`, `git commit`, `git checkout`, `rm`, `mv`, `cp`. These constraints are defined in each agent's definition file and take precedence.

```yaml
---
name: {domain}-{role}
domain: {domain}
role: {role}
description: {what this agent does}
model: sonnet|opus
tools:
  # Varies by role — see table above
---

# {domain}-{role}

## Identity

[Who this agent is and what domain it owns...]

## Capabilities

[Available skills and when to use each...]

## Intent Recognition

[JSON contract handling and direct invocation handling...]

## Context Loading

[How to read LTM (config, practices) and inject to skills...]

## Play Context

[Constraint validation before any skill invocation...]

## Output Contracts

[Expected return formats for each skill invocation...]

## Boundaries

[NEVER and ALWAYS rules...]

## Response Format (JSON Contract Mode)

[Final response rules for JSON contract invocations...]
```

## Invocation Model

Agents are invoked through plays:

```
Play → invokes → Agent → uses → Skills
                         |
                    Produces ARTIFACT (written to STM)
                         |
                    Returns ENRICHED JSON CONTRACT (or structured YAML for direct invocation)
```

**Critical Rule:** Agents are **never invoked directly** by users. Users invoke plays, plays invoke agents.

## Context Building

Agents build context by:
1. Reading `.meridian/core/config.yaml` for platform paths and settings
2. Reading intent.yaml from the JSON contract (when in contract mode)
3. Searching LTM (`~/.meridian/core/memory/`) selectively — by domain keywords, not bulk loading
4. Reading existing STM artifacts at non-null `stm` paths
5. Passing discovered LTM paths and STM paths to skills — skills do NOT search LTM themselves

## Constraint Validation

Constraints in the play context are not suggestions — they are pre-conditions.

Before invoking any skill, every agent validates all constraints against current state. If ANY constraint would be violated:
1. Do NOT invoke the skill
2. Return a structured failure per `docs/framework/structured-failure-protocol.md` with `constraint_violated` populated
3. The play decides how to handle (retry, escalate, or halt)

## Why Not Specialist Agents?

Meridian deprecates specialist patterns (e.g., `bug-analyzer`, `test-writer`) because:

| Problem | Solution |
|---------|----------|
| Proliferation | Too many single-purpose agents |
| Overlap | Unclear boundaries between specialists |
| Maintenance | Hard to keep consistent |
| Context loss | Each specialist starts fresh |

Instead, domain agents handle multiple related tasks with shared context.

## Agent Location

Agent definitions are stored in:

```
core/components/agents/
```

## Related Documentation

- [ADR 004: Agent Naming](../adr/004-agent-naming.md)
- [Plays Component Guide](./plays.md)
- [Skills Component Guide](./skills.md)
