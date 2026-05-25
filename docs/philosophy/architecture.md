# Garura Architecture

This document describes the core architecture philosophy of Garura.

## Overview

Garura implements Intent-Driven Software Development through a **three-layer hierarchy** that separates workflow orchestration from activity execution and learned capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                        PLAYS                              │
│  Defined workflows, human invocable                         │
│  NEVER FORKED — steps/order to follow                       │
├─────────────────────────────────────────────────────────────┤
│  L1: ≤2 agent calls, human OR model invocable               │
│  L2: ≤5 agent calls (ideal 3), human only, with gates       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invoke
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        AGENTS                               │
│  Autonomous decision-makers                                 │
│  Read LTM for config/context                                │
│  Invoke skills to do work                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invoke
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SKILLS                               │
│  Model invocable only (via agents)                          │
│  Self-contained with local references                       │
│  Stable — don't change over time                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ produce
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MEMORY                               │
│  LTM: Practices, config (core/memory/, .garura/core/config.yaml)    │
│  STM: Artifacts per issue (.garura/project/issues/{N}/)     │
└─────────────────────────────────────────────────────────────┘
```

**Flow:** `Plays → Agents → Skills → Artifacts`

## Three-Layer Hierarchy

### High-Order Plays

High-order plays represent **user intent** and chain multiple atomic plays together.

**Properties:**
- Human invocable only
- Chain ≤5 plays (ideal 3)
- Include guardian agent for approval decisions
- Enable non-stop work mode

**Examples:** `fix-bug`, `code-microservice`, `create-feature`

**Flow:**
```
L2: fix-bug
    │
    ├── L1: analyze-bug → [Guardian: skip?] →
    ├── L1: design-fix → [Guardian: skip?] →
    ├── L1: implement-fix → [Guardian: skip?] →
    ├── L1: validate-fix → [Guardian: skip?] →
    └── L1: create-pr
```

### Atomic Plays

Atomic plays are **atomic units** that produce artifacts and stop at conditional checkpoints.

**Properties:**
- Human OR model invocable
- Invoke ≤2 agents
- Always produce exactly one artifact
- Conditional checkpoint: auto-approve when risk is low; require human approval when risk warrants it

**Examples:** `analyze-bug`, `design-fix`, `commit-code`

**Flow:**
```
Play: analyze-bug
    │
    └── Invokes agent: tech-designer
              │
              └── Agent uses skills: do-rca-analysis
              │
              └── Agent produces: .garura/project/issues/{N}/evidence/rca.md
    │
    └── CHECKPOINT: Present RCA for approval
```

#### Auto-Approval Logic

Plays evaluate risk criteria before presenting a checkpoint. When all criteria for low risk are met, the play auto-approves and proceeds without halting for user input. When any high-risk signal is present, the play requires explicit user approval (Tether/Vanish).

**Auto-approve when ALL of:**
- Single logical group or concern
- No sensitive files (credentials, secrets, env vars)
- No breaking changes
- Clear, unambiguous operation type
- Not a hotfix branch or high-risk context

**Require user approval when ANY of:**
- Multiple logical groups requiring separate decisions
- Sensitive files present
- Breaking changes detected
- Ambiguous or mixed operation types
- Hotfix branch or high-risk context

**RESUME mode:** When a play is resuming existing work rather than starting new work, the checkpoint is skipped entirely — the prior approval remains valid.

This model keeps low-risk, routine operations frictionless while surfacing human judgment exactly where it is needed.

### Skills (Learned Capabilities)

Skills are **technology/methodology-specific knowledge** that agents possess.

**Properties:**
- Model invocable only (via agents)
- NOT forked — share agent context
- Reusable across workflows
- Stable over time
- **Self-contained** — embed their own references locally

**Examples:** `write-java-code`, `create-jest-tests`, `do-rca-analysis`

### Skill-Memory Relationship

**ADR 009 supersedes ADR 007 for play-driven workflows.**

ADR 007 described a deploy-time sync model where skills embedded their own local references. ADR 009 introduces the JSON Contract pattern (see below), which changes how skills receive LTM paths at runtime.

**Current behavior (ADR 009 — JSON Contract workflows):**

Skills receive template and LTM paths from agents via the JSON contract — they do NOT search LTM themselves and do NOT embed local copies of templates. The agent performs Context Crafting (assembles LTM paths, reads STM artifacts) and passes relevant paths to the skill as skill inputs.

```
┌─────────────────────────────────────────────────────────────┐
│                      RUNTIME (ADR 009)                      │
│                                                             │
│   Play ──► JSON Contract ──► Agent                        │
│                                   │                         │
│                         Context Crafting:                   │
│                         discover LTM paths,                 │
│                         read STM artifacts                  │
│                                   │                         │
│                                   ▼                         │
│                         Skill invocation:                   │
│                         receives LTM paths                  │
│                         + STM artifact paths                │
│                         reads templates from LTM            │
│                         writes artifacts to STM             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key principles (ADR 009):**

1. **Agents craft context** — Agents discover which LTM paths are relevant and pass them to skills
2. **Skills read LTM at runtime via passed paths** — Skills do not search LTM themselves
3. **Contract carries paths** — The JSON contract (`stm.*` fields) tracks artifact paths through the workflow
4. **Skills write to STM** — Skills produce artifacts at the paths specified by agents

**ADR 009 knowledge boundary (applies to all invocation modes):**

Skill *behavior* (process steps, output format, constraints) stays embedded in the skill definition. *Organizational standards* (commit categories, templates, quality rules) come from LTM at runtime via stable paths under `~/.garura/core/memory/`. This distinction applies regardless of whether the skill is invoked via JSON contract or directly.

See [ADR 009: Skill LTM Reads](../adr/009-skill-ltm-organizational-knowledge.md) for details.

## JSON Contract Pattern

The JSON Contract pattern governs how information flows through the play → agent → skill → agent → play pipeline in play-driven workflows.

### What It Is

A single JSON object that the play creates at the start of execution and passes to each agent invocation. Agents enrich it with artifact paths they produce; skills read from it to find input paths and write artifact paths back into it.

### Contract Structure

```json
{
  "intent_path": "<path to reference/intent.yaml>",
  "stm_base": "<base STM directory for this workflow>",
  "stm": {
    "input": {
      "feature_intent_path": "<input artifact — set by play>"
    },
    "output": {
      "features_path": null,
      "technical_approach_path": null,
      "tech_path": null,
      "scenarios_path": null,
      "plan_path": null
    }
  },
  "checkpoints": [
    { "name": "design_review", "status": "pending" }
  ],
  "evidence": [
    { "name": "<play-name>", "location": null }
  ],
  "notes": [],
  "step_failure": null
}
```

### Contract Fields

| Field | Owner | Purpose |
|-------|-------|---------|
| `intent_path` | Play | Path to `reference/intent.yaml` — the user contract |
| `stm_base` | Play | Base directory for all STM artifacts in this workflow |
| `stm.input` | Play | Paths to input artifacts — set by play at initialization, read by agents |
| `stm.output` | Agents | Artifact paths — agents populate null fields with paths they produce |
| `checkpoints` | Play | Checkpoint status — play updates after human review |
| `evidence` | Play | Evidence file paths — play updates at report step |
| `notes` | Agents | Short observations (max 3 items, 1 sentence each) for downstream agents |
| `step_failure` | Agents | Non-null only when agent cannot recover — play reads to decide retry/halt |

### How It Flows

```
Play creates initial contract (stm.input set, all stm.output null)
    │
    ▼
Agent 1 receives contract as entire prompt
    │  reads intent.yaml
    │  reads STM artifacts at stm.input paths
    │  calls skill — skill produces artifact, returns path
    │  populates stm.output.features_path = produced path
    │  returns enriched contract
    ▼
Play validates stm.output.features_path non-null, step_failure null
    │
    ▼
Agent 2 receives enriched contract (has features_path now)
    │  ... same pattern ...
    ▼
Play continues until all capabilities complete
```

**Critical rule:** The JSON contract is the ENTIRE agent prompt. Plays pass ONLY the JSON object — no instructions, field definitions, or examples appended. Agents read their own definition files and `intent.yaml` to know what to do.

## Four Crafts Architecture

The Four Crafts Architecture describes the four distinct authoring concerns that Garura separates to achieve deterministic, intent-driven execution.

### The Four Crafts

| Craft | Owner | Artifact | Purpose |
|-------|-------|----------|---------|
| **Intent Crafting** | User / Framework Author | `reference/intent.yaml` | Defines the goal, constraints, and failure conditions (the Intent triple; scenarios/success/recovery are generated into Expectation) |
| **Prompt Crafting** | Play | JSON contract | Play passes ONLY the JSON contract to agents — no inline instructions |
| **Context Crafting** | Agent | Skill inputs | Agent discovers LTM paths, reads STM artifacts, assembles what the skill needs |
| **Spec Crafting** | Skill | STM artifacts | Skill reads templates from LTM, fills them, writes output artifacts to STM |

### Intent Crafting

Intent Crafting produces `reference/intent.yaml` — the user-facing contract for the play. It contains:

```yaml
goal: "<what success looks like for the user>"
constraints:
  - id: C-<ID>
    description: "<what must be true>"
    halt_message: "<what to tell the user if violated>"
failure_conditions:
  - id: FC-<ID>
    description: "<what constitutes failure>"
# Intent is the clean triple. Success scenarios and recovery are NOT authored
# here — they are generated into the separate Expectation artifact (see ICE)
# and vetted at a checkpoint.
```

Intent Crafting is done once per play by the framework author. The `intent.yaml` file is stable — agents read it; they never modify it.

### Prompt Crafting

Prompt Crafting is how the play communicates with agents. The rule: the JSON contract IS the entire agent prompt.

```
WRONG:
  "You are the feature-steward agent. Your task is to scope epics.
   Rules: [list of rules]
   {JSON contract here}"

RIGHT:
  {JSON contract — nothing else}
```

Agents have their own definition files and read `intent.yaml`. Adding instructions to the prompt overrides agent behavior with potentially wrong information.

### Context Crafting

Context Crafting is the agent's responsibility before invoking a skill. The agent:

1. Reads `intent.yaml` at `intent_path` from the contract
2. Reads existing STM artifacts at non-null `stm.input` and `stm.output` paths
3. Loads relevant LTM standards from `~/.garura/core/memory/`
4. Assembles the complete input the skill needs, including LTM template paths

Skills do not discover LTM themselves — the agent hands them the paths. This is the boundary: agents know what context is needed; skills know how to use context once provided.

### Spec Crafting

Spec Crafting is what skills do. A skill:

1. Receives explicit input paths (STM artifacts + LTM template paths) from the agent
2. Reads LTM templates to understand the required output shape
3. Fills the template with content derived from the input artifacts
4. Writes the completed artifact to STM at the path specified in the contract
5. Returns the artifact path to the agent

Skills are stable and narrow — they know one craft deeply. They do not make architectural decisions; they produce well-formed artifacts.

## Agents

Agents are **autonomous decision-makers** with domain expertise.

### Agent Naming: `{domain}-{role}`

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `code-builder` | implementation | builder | Write code, implement features, fix bugs |
| `tech-designer` | design | designer | Technical design, RCA, architecture |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |

For the complete agent roster (19 agents), see [Agents Component Guide](../components/agents.md).

### Agent Principles

1. **One agent = one domain** (not one task)
2. **Judges, not executors** — agents make decisions
3. **Context sharing** — agents build and share context
4. **Skill autonomy** — agents decide which skills to apply

### Orchestrator Tool Restrictions

Plays are orchestrators. They coordinate workflow by delegating to agents — they never execute domain work directly.

**Forbidden in plays:** `Bash`, `Grep`, `Glob`, direct git commands, direct gh commands, or any tool that executes domain operations.

**What plays own directly:** checkpoint writes, approval logic, STM initialization, artifact writes, evidence reports, and final user-facing output.

**What plays delegate to agents:**
- Git operations (branch, commit, push, status) → `repo-orchestrator`
- Issue operations (create, resolve, link) → `project-orchestrator`
- Code implementation → `code-builder`
- Technical design and RCA → `tech-designer`

This boundary is not a style preference — it is an architectural rule. If a play executes git commands directly, the agent layer is bypassed and the audit trail breaks.

## Play Orchestration Principles

### Short-Circuit Agent Dispatch on Deterministic Context

When an agent's sole purpose is to resolve a value that is already deterministically derivable from an environment signal (branch name, file path, config key, etc.), skip the agent invocation and synthesize the expected output artifact inline.

**Rule:** If the answer can be extracted with a regex or config lookup at the orchestrator level with high confidence, do not spawn the agent.

**Requirement:** The synthesized artifact must be contract-compatible with what the agent would have produced — downstream steps must not know or care whether resolution was real or synthetic.

**Example (commit-code, issue #343):**
- `project-orchestrator` is normally spawned to fetch open issues and semantically score issue-to-change-group mappings.
- When the branch name encodes the issue number (e.g. `feature/95-slug`), the issue is resolved via regex with `confidence: high`.
- The play writes a synthetic `issue-mappings.yaml` with `auto_resolved: true` and `source: branch-name` and skips the agent entirely.
- This eliminates one `gh` API call and one LLM semantic-scoring step from the hot path without any change to downstream contracts.

**Scope:** Applies to any agent whose primary output is a resolved scalar or simple mapping derivable from pre-execution context signals.

## Memory Architecture

Garura uses a **dual memory system**:

### Long-Term Memory (LTM)

**Location:** `core/memory/`

**Contains:**
- Practices and standards
- Templates for artifacts
- Tool-specific patterns
- Architecture guidelines

**Lifecycle:** Project setup → persists indefinitely

### Short-Term Memory (STM)

**Location:** `.garura/project/issues/{issue_number}/`

**Contains:**
- Documentation (specs, designs, RCA)
- Evidence (tests, validation)
- Checkpoints (play execution state for approval and resumption)

**Lifecycle:** Persists forever (version controlled audit trail)

**Principle:** NWWI (No Work Without an Issue) — all checkpoint-producing work must be associated with an issue. Enforcement point is `commit-code`: no commit without an issue ID.

### STM Folder Structure

```
.garura/project/issues/
├── _pending/                # Temporary, pre-issue (two-phase write)
│   └── {timestamp}/
└── {issue_number}/
    ├── specs/               # Plans and specifications
    ├── evidence/            # Per-play evidence
    │   └── {play-name}/
    │       └── {YYYYMMDD-HHMMSS}.md
    ├── checkpoint/          # Per-play checkpoints
    │   └── {play-name}/
    │       └── {YYYYMMDD-HHMMSS}.md
    ├── context/             # prepare / arch context artifacts
    └── review/              # Review artifacts
```

### Memory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LTM (Long-Term Memory)                   │
│  Created: At project setup                                  │
│  Contains: Practices, standards, templates                  │
│  Location: core/memory/                                     │
│  Role: Source of truth for organizational customizations    │
└─────────────────────────────────────────────────────────────┘
              │                               ▲
              │ Agents read via               │
              │ Context Crafting              │ capture-learning play
              ▼                               │ (promotes learnings to LTM)
┌─────────────────────────────────────────────────────────────┐
│                    STM (Short-Term Memory)                  │
│  Created: When play starts                                  │
│  Contains: Artifacts (specs, evidence, checkpoint) per issue│
│  Location: .garura/project/issues/{issue_number}/           │
│  Lifecycle: Persists forever (audit trail)                  │
└─────────────────────────────────────────────────────────────┘
```

## Recovery (Autonomous-Fix Branch)

Recovery is one concept — the Expectation layer's answer to "how do we continue toward the intent when blocked" (see ICE). This section describes its **autonomous-fix branch**: the runtime loop the validator's recovery handoff plan triggers when it routes a fix back to an agent. When an agent returns a structured failure, plays apply this loop rather than propagating the failure immediately.

**Recovery mechanics:**
1. Agent returns a failure with `domain_assessment.responsible_domain` indicating which agent can address it
2. Play invokes the responsible agent with fix context + original intent + retry metadata
3. Maximum 2 retry cycles per agent. After 2 failed retries, halt with full failure context for human intervention

**Retry context added to play context bundle:**
```yaml
retry:
  previous_failure: "{what_failed}"
  fix_applied: "{what was done to fix it}"
  attempt: {N}
```

**Recovery calls are exempt from the agent limit.** A play that normally invokes ≤2 agents may invoke additional recovery calls beyond that limit without violating the agent count rule. Recovery calls are not counted as new agent invocations for the purpose of the constraint.

Recovery reasoning is loaded from: `docs/framework/intent-driven-recovery.md`. This file defines the recovery reasoning loop. The structured-failure-protocol that agents use to format their failure responses is at `docs/framework/structured-failure-protocol.md`.

### Checkpoint Artifact Status Lifecycle

Every checkpoint artifact written to `.garura/project/issues/{N}/checkpoint/{play}/{timestamp}.md` follows a defined status lifecycle:

| Status | Meaning |
|--------|---------|
| `PENDING_APPROVAL` | Written; awaiting user decision |
| `APPROVED` | User responded Tether (or auto-approved) |
| `REJECTED` | User responded Vanish |

Plays update the artifact status before proceeding to the next step. This creates an auditable record of every approval decision.

## Critical Rules

| Rule | Applies To | Rationale |
|------|------------|-----------|
| **Produces artifact** | Atomic Plays | Clean checkpoint boundaries |
| **Conditional checkpoint** | Atomic Plays | Auto-approve when risk is low; require user approval when risk signals are present |
| **Chains atomic plays** | High-Order Plays | Workflow = sequence of atomic activities |
| **Guardian validates** | High-Order Plays | Decides if human approval can be skipped |
| **Agent produces** | Artifacts | Agent does work, play orchestrates |
| **Learned capabilities** | Skills | Technology/methodology specific knowledge |
| **Never forked** | Plays & Skills | Plays are steps; skills share context |
| **NWWI** | Plays | No Work Without an Issue — commit-code is the hard gate |

## Why This Architecture?

### Problem Solved

Traditional AI copilots are non-deterministic — same prompt, different results. This makes them unsuitable for enterprise use where:
- Consistency matters
- Quality must be predictable
- Human oversight is required
- Workflows must be auditable

### Garura Solution

1. **Deterministic workflows** — Plays define exact steps
2. **Checkpoint model** — Human review at defined points
3. **Guardian bypass** — Non-stop work when safe
4. **Clear boundaries** — Artifacts mark completion
5. **Audit trail** — STM captures all decisions

## Intent Primacy and Play Evolution

### The Core Principle

**Intent is primary. Plays are scaffolding.**

The objective of a play — what it achieves — is permanent. "Submit work for peer review with quality assurance" will always be a valid objective. But the workflow that fulfills that objective — pre-flight checks, analysis, checkpoint, execution, reporting — is not inherent to the objective. It is a prescribed sequence that exists because we cannot yet trust the system to derive it autonomously.

Plays exist today because they provide the determinism needed to build trust on the path to autonomy. They are how we teach the system to walk before it runs.

### The Constraint Migration

The key insight is that properties currently baked into play structure will migrate over time to declarative constraints in the intent:

```
TODAY (structural)
────────────────────────────────────────────────────
Play prescribes:
  Step 0: Pre-flight checks
  Step 1: Analyze
  Step 2: Checkpoint (always — PRs are externally visible)
  Step 3: Execute
  Step 4: Report with evidence

Auditability = enforced by play steps
Predictability = enforced by prescribed sequence
Human oversight = enforced by checkpoint placement

FUTURE (declarative)
────────────────────────────────────────────────────
Intent declares:
  goal: "Submit work for peer review with quality assurance"
  constraints:
    - "Produce auditable evidence of every decision"
    - "Halt for human approval before externally visible actions"
    - "Verify environmental preconditions before work begins"

Auditability = constraint the system satisfies however it chooses
Predictability = emergent from intent + constraints + memory
Human oversight = constraint, not a hardcoded step
```

The objective has not changed. The system still creates a PR with a quality checklist, still produces evidence, still stops for approval when actions are externally visible. What changes is **who decides the workflow**: today the play author prescribes it; tomorrow the system derives it from intent + constraints + accumulated memory.

### The Evolution Path

| Phase | Play Role | Intent Role | Trust Level |
|-------|-----------|-------------|-------------|
| **Current** | Plays prescribe every step and agent assignment | Intent defines the objective; plays define the how | Low — system proves reliability through prescribed execution |
| **Lighter plays** | Plays define checkpoints and boundaries; agents choose their own workflow within steps | Intent drives agent behavior; plays provide guardrails | Medium — system has demonstrated consistent execution |
| **Intent-driven** | Plays are generated at runtime from intent + constraints + memory | Intent is the primary input; workflow is emergent | High — auditability and predictability are satisfied as constraints, not as structure |

### What Makes This Possible

The migration from structural to declarative depends on three capabilities maturing together:

1. **Memory depth** — LTM must be rich enough that the system knows *how* to satisfy "produce auditable evidence" without being told the specific artifact format and location. Today, plays encode this knowledge. Tomorrow, memory carries it.

2. **Agent maturity** — Agents must reliably produce the same quality of output when given intent + constraints as when given prescribed steps. The current play structure is training data for this capability — every successful play execution demonstrates what "good" looks like for a given intent.

3. **Constraint expressiveness** — The intent schema must be expressive enough to capture properties like "halt for human approval before externally visible actions" as first-class constraints. The `reference/intent.yaml` externalization (see `create-pr` golden standard) is a step toward this — making constraints a first-class, extensible schema that can grow to encompass workflow-level properties.

### Why This Matters Now

The architectural decisions being made today — externalizing intent to `reference/intent.yaml`, making constraint references dynamic, keeping play structure declarative — are not just cleanup. They are **preparing the system for the point where plays become optional**. An intent file that fully describes the objective, constraints, and failure conditions is already 80% of what a system needs to derive its own execution plan. The remaining 20% is trust — and that is built through the deterministic play executions happening now.

The lighter plays can be tested first on mechanical operations (`commit-code`, `create-pr`) where the workflow is predictable and the failure modes are well-understood. Success there builds confidence for creative operations (`build-feature`, `design-feature`) where the workflow is more variable.

## Related Documentation

- [ADR 001: Three-Layer Hierarchy](../adr/001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](../adr/002-l1-checkpoint-model.md)
- [ADR 003: Guardian Approval](../adr/003-guardian-approval.md)
- [ADR 004: Agent Naming](../adr/004-agent-naming.md)
- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 007: Skill-Local References](../adr/SUPERSEDED-007-skill-local-references.md) (Superseded by ADR 009)
- [ADR 008: Issue-Centric STM and NWWI](../adr/008-issue-centric-stm-and-nwwi.md)
- [ADR 009: JSON Contract Pattern and Four Crafts Architecture](../adr/009-json-contract-four-crafts.md)
