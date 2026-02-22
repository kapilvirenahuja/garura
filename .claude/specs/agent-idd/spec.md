# Agent IDD Awareness

## Problem

Agents (repo-orchestrator, project-orchestrator, code-builder, tech-designer) have no awareness of:
- The Three Elements of Intent (intent, constraints, failure_conditions)
- The LTM system (`~/.phoenix-os/core/memory/`)
- Intent-driven recovery reasoning

Currently, recovery is handled entirely at the recipe/orchestrator level. If an agent encounters an obstacle during its own execution, it either fails, returns an error, or asks the caller for clarification. It cannot reason about the intent behind its invocation to find alternate paths.

More critically, there is no protocol for recovery conversations between agents and recipes. When an agent fails due to a cross-domain issue (e.g., tests fail because code is broken), the agent can't fix it — but neither does the recipe know how to orchestrate the fix without a structured failure return.

## Desired Outcome

A two-level recovery model where:
1. Agents recover autonomously when the obstacle is within their domain
2. Agents return structured failures when the obstacle is outside their domain
3. Recipes orchestrate cross-domain recovery by routing failures to the right agent
4. The retry loop continues until intent is achieved or deemed unreachable

## Scope

### In Scope
- Agent awareness of the IDD model (intent, constraints, failure_conditions)
- Agent ability to load and apply LTM practices
- Two-level recovery model (agent-level + recipe-level)
- Structured failure return protocol
- Recipe-agent recovery conversation loop
- Defining recovery behavior per agent role

### Out of Scope
- Changing the recipe-level recovery framework (already implemented in LTM)
- Adding new agents
- Changing agent tool permissions

## Architecture: Two-Level Recovery

### Level 1: Agent Self-Recovery (Within Domain)

When an agent encounters an obstacle within its own domain, it recovers autonomously without escalating to the recipe.

```
Agent invokes skill → skill fails
    │
    ├── Is this within my domain?
    │
    ├── YES → Reason about alternate approach
    │         ├── Alternate skill available → retry with different skill
    │         ├── Missing prerequisite I can provide → provide it, retry
    │         └── No alternate path → escalate to Level 2
    │
    └── NO → escalate to Level 2
```

**Examples:**
```
repo-orchestrator: create-commit fails (nothing staged)
  → Within domain. Stage the files first, retry.
  → Self-recovered.

project-orchestrator: issue read fails (not found)
  → Within domain. Search by title instead.
  → Self-recovered.

tech-designer: grep finds no matches
  → Within domain. Broaden search pattern, try alternate keywords.
  → Self-recovered.
```

### Level 2: Recipe-Orchestrated Recovery (Cross-Domain)

When an agent encounters an obstacle outside its domain, it returns a structured failure to the recipe. The recipe reasons about which agent can fix the prerequisite, invokes it, then retries the original agent.

```
Recipe → Agent A (fails, outside domain)
    │
    ├── Agent A returns structured failure:
    │     - what_failed: "unit tests"
    │     - why: "function X returns null instead of expected value"
    │     - domain: "implementation"  ← not my domain
    │     - suggested_fix: "code-builder needs to fix function X"
    │
    ├── Recipe reasons: this is code-builder's domain
    │
    ├── Recipe → Agent B (code-builder) with fix context
    │     - Fixes function X
    │     - Returns success
    │
    └── Recipe → Agent A (retry)
          - Tests pass
          - Returns success
```

**Examples:**
```
quality-validator: tests fail because code has a bug
  → Outside domain (can't fix code). Returns structured failure.
  → Recipe invokes code-builder to fix → retries quality-validator.

code-builder: implementation blocked because design is ambiguous
  → Outside domain (can't redesign). Returns structured failure.
  → Recipe invokes tech-designer to clarify → retries code-builder.

repo-orchestrator: push fails because PR checks require passing tests
  → Outside domain (can't fix tests). Returns structured failure.
  → Recipe invokes quality-validator to investigate → code-builder to fix → retries repo-orchestrator.
```

### The Recovery Conversation

Cross-domain recovery is a conversation, not a one-shot mechanism:

```
┌─────────────────────────────────────────────────────┐
│ Recipe (orchestrator)                                │
│                                                      │
│  1. Invoke Agent A with intent context               │
│  2. Agent A fails → returns structured failure       │
│  3. Recipe reads failure → identifies responsible     │
│     agent (Agent B)                                  │
│  4. Recipe invokes Agent B with fix context           │
│  5. Agent B fixes → returns success                  │
│  6. Recipe retries Agent A with updated context       │
│  7. Agent A succeeds → workflow continues            │
│                                                      │
│  If retry fails again → assess: is intent still      │
│  achievable? If no → HALT.                           │
└─────────────────────────────────────────────────────┘
```

**Retry limits:** Maximum 2 retry cycles per agent per recipe execution. After 2 failures on the same agent for the same obstacle, escalate to HALT with full context.

## Structured Failure Protocol

When an agent cannot recover within its domain, it MUST return a structured failure:

```yaml
failure:
  what_failed: "{operation that failed}"
  why: "{root cause or best assessment}"
  domain_assessment:
    within_my_domain: false
    responsible_domain: "{which domain can fix this}"
    suggested_agent: "{agent name, if known}"
  context:
    intent_received: "{the intent passed by the recipe}"
    constraint_violated: "{if applicable}"
    self_recovery_attempted: true|false
    self_recovery_details: "{what was tried, if any}"
  suggested_fix: "{what the agent thinks would resolve this}"
```

This gives the recipe everything it needs to route the fix to the right agent.

## Design Considerations

### 1. What Does IDD Awareness Mean for an Agent?

Agents are invoked with a prompt from the recipe. Currently, that prompt contains task-specific instructions. IDD awareness means the agent also receives (or can derive) the intent context:

| Element | How Agent Gets It |
|---------|-------------------|
| **Intent** | Passed in the invocation prompt by the recipe |
| **Constraints** | Passed in the invocation prompt by the recipe |
| **Failure conditions** | Agent reasons about its own domain-level failures |

### 2. Agent Role Determines Recovery Behavior

| Role | Self-Recovery | Escalation | Reasoning |
|------|--------------|------------|-----------|
| **Orchestrator** (repo, project) | Full — alternate skills, retry with different params | Structured failure when outside domain | Autonomous decision-makers, multiple skills available |
| **Builder** (code-builder) | Limited — retry with adjusted approach if plan allows | Structured failure for design issues, missing deps, blocked prerequisites | Executor — can adapt within plan boundaries, but can't redesign |
| **Designer** (tech-designer) | Moderate — alternate analysis paths, broader searches | Structured failure when codebase state doesn't match assumptions | Analyst — can explore differently, but can't change reality |

### 3. LTM Access Pattern

Agents need a standard way to load LTM:

```
# In agent definition
## Memory

Load practices from `~/.phoenix-os/core/memory/practices/` as needed.

Available practices:
- `intent-driven-recovery.md` — Recovery reasoning loop
- `git/branching.md` — Branch naming conventions
```

### 4. Intent Propagation

Recipes must propagate intent context when invoking agents:

```
Current pattern (no intent):
  "Analyze uncommitted changes in the repository"

Proposed pattern (with intent):
  "Analyze uncommitted changes in the repository.
   Recipe intent: Safely persist completed work as conventional commits.
   Constraints: MUST NOT commit on protected branches."
```

The agent uses this context to:
- Make better decisions during normal execution
- Reason about recovery when obstacles arise
- Construct meaningful structured failures when escalating

### 5. Changes Per Agent

#### repo-orchestrator
- Add `## Memory` section (LTM loading)
- Add `## Recovery` section: full self-recovery within repo domain
- Add structured failure return when outside domain
- Examples: branch exists → checkout; commit fails → stash first; push rejected → return failure (outside domain)

#### project-orchestrator
- Add `## Memory` section (LTM loading)
- Add `## Recovery` section: full self-recovery within project domain
- Add structured failure return when outside domain
- Examples: issue not found → search broader; creation fails → retry with different params

#### code-builder
- Add `## Memory` section (read-only awareness)
- Add `## Recovery` section: limited self-recovery within plan boundaries
- Add structured failure return for design issues, blocked prerequisites
- Examples: test fails → retry once with adjustment; design gap → escalate to tech-designer

#### tech-designer
- Add `## Memory` section (read-only awareness)
- Add `## Recovery` section: alternate analysis paths
- Add structured failure return when codebase state is unexpected
- Examples: no matches → broaden search; dependency chain breaks → escalate with findings

## Open Questions

1. Should intent propagation be standardized in a template, or left to each recipe's prompt?
2. Should the structured failure protocol be an LTM practice (so agents load it at runtime) or baked into agent definitions?
3. Should there be a max retry budget at the recipe level (e.g., total 4 retries across all agents)?
4. How should agents handle cascading failures (Agent B's fix introduces a new failure for Agent A)?
