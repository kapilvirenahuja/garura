# ADR 013: Play Maturity Model — From Compiled Intents to Dark Factories

**Status:** Accepted
**Date:** 2026-03-06
**Supersedes:** None
**Related:** ADR 001 (Three-Layer Hierarchy), ADR 012 (Evidence Self-Commit)

## Context

### The Problem

Spec-driven development is not scaling.

The signal from the ground: the cognitive load that specifications add to developers is not reducing overall cycle time. Running every step through validation, keeping humans in the loop at every stage, generating artifacts that require human review — all of this ceremony is slowing things down. Small tasks may complete faster with AI assistance, but the overall process throughput is going down, not up.

The core tension: **intent-driven design is the right architecture** (constraints, failure conditions, scenarios give structure and traceability), but **runtime resolution of intent is the wrong execution model** (generating DAGs on every run, caching, managing state across three artifacts — intent.yaml, DAG JSON, SKILL.md — creates overhead that drowns the value).

Meridian experienced this directly:

1. **Linear stage model** (original): Plays defined fixed stages (1-5) with direct execution. Fast, readable, deterministic. But brittle — no formal intent contract, no eval framework, no crash recovery.

2. **Intent-driven dynamic model** (attempted): Plays read `intent.yaml` at runtime, generate a DAG via intent-resolver, cache and execute. Architecturally correct but operationally painful — every invocation paid for resolution, caching, and DAG management. Plays became unreadable. Three sources of truth competed and drifted. Execution slowed significantly.

The answer is not to abandon intent. The answer is to **compile intent out of the runtime path** — keep it as the source of truth for design, but bake it into static plays that execute without resolution overhead.

### The Maturity Framework

Dan Shapiro's "Five Levels: from Spicy Autocomplete to the Dark Factory" provides a useful framework for mapping play maturity. His model draws from the NHTSA driving automation scale and defines five levels of AI autonomy in software development. We adopt his level definitions as the maturity framework for Meridian's Intent-Driven Software Development (IDSD) plays:

| Level | Shapiro's Analogy | Human Role |
|-------|-------------------|------------|
| 1 | Lane-keeping | Writing and reviewing steps |
| 2 | Autopilot on highway | Reviews briefs when confidence is low; otherwise hands-off |
| 3 | Waymo with safety driver | Defines composition, reviews cross-play handoffs |
| 4 | Robotaxi — PM writes spec, leaves for 12 hours | Writes intent, reviews outcomes (not process) |
| 5 | Fanuc's lights-out factory | System designer. Validates outcomes. May not review code at all. |

This ADR maps these levels to Meridian's play architecture and establishes the maturity model that governs how plays are built and executed.

## Decision

### The Core Principle

**Intent-Driven Design (IDD) is the constant across all five levels.** Every level uses intent. What changes is how intent is consumed:

| Level | Intent Scope | When Consumed | Runtime Behavior |
|-------|-------------|---------------|-----------------|
| L1 | Input/output contract only | Build-time | Non-deterministic internally, structured at boundaries |
| L2 | Domain knowledge (constraints, failures, scenarios) | Build-time, hash-locked | Deterministic, compiled, workflow from play framework |
| L3 | Domain knowledge + workflow structure (pre-flights, checkpoints, evidence) | Build-time, hash-locked | Deterministic, compiled, workflow from intent |
| L4 | Everything — full runtime control plane | Every invocation | Adaptive, DAG generated at runtime, cacheable |
| L5 | The only human artifact | Continuously | Fully autonomous, system self-assembles |

At L1-L3, we have a **compiler** (`/create-play`) that reads intent.yaml and produces a static play. At L4-L5, the system interprets intent directly at runtime.

The progression: **intent scope expands** as levels increase. At L1, intent barely exists. At L2, intent defines what (domain knowledge). At L3, intent defines what AND how (workflow structure). At L4, intent drives everything at runtime. At L5, intent is all that exists.

We are building at **Level 2** today. Level 3 is the near-term target. Level 4-5 are architectural north stars that inform design decisions but are not being built yet.

### Level 1 — Lane-Keeping (Structured, Non-Deterministic)

**What it is:** Plays with structure — they have a defined input contract and a defined output contract. But the internal execution is not deterministic. There are no checkpoints, no audits, no evals, no human-in-the-loop gates. The system takes the input, does what it needs to do, and produces the output. What happens in between is up to the LLM.

**Human role:** Defines what goes in and what comes out. Trusts the system to figure out the middle.

**Intent:** May exist as a formal `intent.yaml` or as a description in the play. Compiled into the play at build-time to define the input/output contract. Internal execution is not intent-governed.

**Play structure:** Input → (black box) → Output. The play defines the boundaries, not the path.

**Characteristics:**
- Defined input contract (what the play receives)
- Defined output contract (what the play produces)
- Internal steps are non-deterministic — the LLM decides the path
- No checkpoints, no audits, no human-in-the-loop
- May or may not call agents/skills — not enforced
- Fast to build, fast to run
- Reliable at the boundary level (correct inputs → correct outputs), unpredictable internally

**Example:** `setup-branch` — receives a branch name, produces a branch pushed to origin. How it handles dirty trees, worktree decisions, or edge cases is up to the system.

**Industry examples:** Most spec-driven development today. Spec-kit from GitHub, basic Agent OS commands. Straightforward A → B → C with artifact sharing, but no formal orchestration or checkpoint contract.

### Level 2 — Autopilot on Highway (Compiled, Intent-Driven)

**What it is:** Plays are intent-driven and deterministic. They are composed from user intents combined with a deterministic workflow structure. All knowledge is baked into SKILL.md at build-time using the intent files the user provides. The play is compiled — same input, same execution path, every time.

**Human role:** Reviews briefs when confidence is low; otherwise hands-off. The system runs autonomously within its compiled boundaries.

**Intent:** Formally structured as `intent.yaml` with constraints (C1-Cn), failure conditions (F1-Fn), and acceptance scenarios (S1-Sn). Read at build-time by `/create-play`. Hash-locked in play frontmatter. **Not referenced at runtime** — the compiled play contains everything it needs.

**Play structures:** Plays can adopt multiple workflow structures depending on complexity. The play provides the workflow structure; the intent provides the domain knowledge.

**Structure A — Full checkpoint flow:**
```
Pre-flight     → Verify environmental preconditions
Preparation    → Analyze, scope, gather context (agents write to STM)
Checkpoint     → Human reviews brief when confidence is low (skippable)
Execution      → Generate deliverables from STM artifacts (agents read STM)
Evidence       → Document what happened, self-commit artifacts
```

**Structure B — Fast execution flow (higher confidence actions):**
```
Pre-flight     → Verify preconditions
Execution      → Do the work
Approval       → Final human approval and done
```

**Structure C — Higher-order L2 (chained plays):**
```
Pre-flight     → Verify preconditions
Execute L2-A   → Run first compiled play
Feed output    → Pass STM artifacts to next play
Execute L2-B   → Run second compiled play
Execute L2-C   → Run third compiled play
Checkpoint     → Human reviews combined outcome
Done
```

Higher-order plays chain multiple compiled plays together. The concepts are the same — each sub-play is compiled, deterministic, intent-driven. The chain just sequences them, feeding STM outputs from one into the next.

**Characteristics:**
- Fixed workflow structure with deterministic execution
- Up to 2 domain agents per play with clear domain boundaries
- Step evals after each phase, scenario evals at end
- Human checkpoint is confidence-gated (skipped when all high)
- All task dependencies are static and known at build-time
- Crash recovery via per-task status updates to STM
- Workflows, agent boundaries, eval criteria — all baked into the play
- Deterministic: same changes → same commits, same PR, same result

**The compiler:**

```
intent.yaml (source) → /create-play (compiler) → SKILL.md (compiled artifact)
```

`/create-play` reads intent.yaml, interviews for skills, audits agents, resolves the task graph, and bakes everything into a single SKILL.md file. The intent-resolver is a **build-time tool**, not a runtime agent.

**Guard:** Play frontmatter stores `intent_hash: sha256(intent.yaml)`. At runtime, if the hash doesn't match the current intent.yaml, warn that re-baking is needed. Intent changes require re-compilation.

```yaml
---
name: commit-code
intent_hash: "sha256:abc123..."
---
```

**What the play contains (compiled artifacts):**
- Baked task list with dependencies (what was previously the DAG JSON)
- Pre-flight checks referencing constraint IDs (C1, C2, etc.)
- Agent dispatch patterns with JSON contract templates
- Eval criteria derived from failure conditions and scenarios
- Evidence and checkpoint procedures (ADR 012)
- Workflow structure (which phases are skippable, which flow to use)

**Current examples:** `commit-code` (Structure A), `create-pr` (Structure A), `capture-learning` (Structure B), `ship` (Structure C — chains commit-code → create-pr → merge-pr)

### Level 3 — Waymo with Safety Driver (Compiled, Intent-Rich)

**What it is:** Still compiled, still deterministic. The execution model is identical to L2. The difference: **the workflow structure itself moves into intent**. At L2, the play provides the workflow structure (pre-flight, preparation, checkpoint, execution, evidence) and the intent provides the domain knowledge. At L3, the user defines both — the intent specifies not just what to do, but how the workflow should be structured: what pre-flights to run, where checkpoints go, how evidence is captured, what confidence thresholds gate human review.

**Human role:** Intent crafting becomes the critical skill. The user must define the complete orchestration contract — domain knowledge AND workflow structure — in intent.yaml. If the intent is wrong, the compiled play is wrong. Garbage in, garbage out.

**Intent:** The brain of the orchestration. Defines not just constraints and scenarios, but also:
- Pre-flight conditions and halt behavior
- Workflow phase structure and ordering
- Confidence thresholds for human checkpoints
- Evidence format and capture rules
- Agent selection criteria
- Cross-play handoff contracts (for compositions)

**Play structure:** Same compiled SKILL.md output as L2. Same deterministic execution. But the compilation is driven entirely by the intent. No external workflow template needed — the intent IS the workflow specification.

**Characteristics:**
- Everything from L2 applies — compiled, deterministic, hash-locked
- Intent crafting is the primary skill — the intent is self-contained
- `/create-play` compiler reads a richer intent schema
- No dependency on workflow templates or LTM for structure — intent provides it all
- Can compose plays as sub-units with defined interfaces
- The shift is in **what the user provides**, not in how the system executes

**The shift from L2:** At L2, the compiler combines intent + workflow templates + agent definitions + LTM to produce the play. At L3, the compiler reads a self-contained intent that encodes all of this. The compilation and execution remain identical — what changes is the **input to the compiler**.

### Level 4 — Robotaxi (Runtime Resolution)

**What it is:** No compilation. Plays become orchestrators. They read intent at runtime, resolve it into a DAG, and execute. A change to the intent changes what the play does — no re-compilation needed.

**Human role:** Writes intent specifications, reviews outcomes (not process). Leaves for 12 hours, comes back to check if tests pass.

**Intent:** Used at runtime as the control plane. The orchestrator reads intent.yaml, calls the intent-resolver, receives a DAG, and executes it. The intent defines everything — workflow structure, checkpoints, confidence levels, agent selection, eval criteria.

**Play structure:** Plays bring no workflow structure. Everything comes from the intent-resolver:

```
Read intent
→ Resolve DAG (intent-resolver at runtime)
→ Cache DAG (optional, for repeat runs)
→ Execute DAG (dispatch tasks by owner and dependency)
→ Human reviews outcomes
```

**Characteristics:**
- Plays are generic orchestrators — not domain-specific
- Intent-resolver is a runtime agent (not build-time)
- DAG shape adapts to the specific intent — no two runs are necessarily identical
- DAGs can be cached for repeat runs with the same intent
- A change to intent at runtime changes the play's behavior
- No determinism — resolver may pick different agents, skills, or task orderings
- Higher token cost — pays for resolution on every invocation
- Intent quality is paramount — poor intent → poor DAG → poor execution

**Key patterns (from Infralovers' L4 architecture research):**
- **NLSpec:** intent.yaml IS the control instrument, not documentation
- **Directed Graph Phases:** DAG with explicit phase transitions, encoded in the intent
- **Scenarios as Holdout-Set:** Scenario evals hidden from agents during work, evaluated after (prevents specification gaming)
- **Digital Twin Universe:** Agents develop against mocked services

**Not being built yet.** This level requires significant maturity in intent-resolver capabilities, agent self-discovery, and cost reduction in token economics.

### Level 5 — Dark Factory (Fully Autonomous)

**What it is:** The system is fully autonomous. There are no plays. There is no compilation. There is no orchestrator to configure. The user writes an intent — that's it — and the system produces tested, deployable software.

**Human role:** System designer. Validates outcomes, not process. May not review code at all. All time goes into crafting the intent and reviewing final deliverables against behavioral scenarios.

**Intent:** The only human artifact. Everything else — agent selection, task decomposition, skill discovery, confidence assessment, checkpoint placement — is derived by the system. Skills are auto-discovered. Agents self-assemble.

**Play structure:** There is no play. The system IS the play.

**Characteristics:**
- Single entry point: "here is an intent, produce software"
- Skills are auto-discovered from available capabilities
- No fixed agent boundaries — system assembles teams dynamically
- Behavioral scenarios are the acceptance criteria (not human review of process)
- Continuous operation — may run for hours or days
- Token cost is the primary resource constraint (replacing human time)
- Clear code evals check the final output — the system validates itself
- We don't know if this is fully achievable today. Not building it. Not trying.

**Industry example:** StrongDM's three-person team running "Attractor" — three Markdown specification files producing CXDB with 16,000 lines of Rust, 9,500 lines of Go, and 6,700 lines of TypeScript. No human writes code. No human reviews code.

## Where We Are Today

**Meridian is at Level 2.**

We attempted to jump to Level 4 (runtime DAG resolution) prematurely. The result:
- Plays became unreadable
- Execution slowed significantly (resolution overhead on every run)
- Three sources of truth competed (intent.yaml, DAG JSON, SKILL.md)
- State drift between artifacts was a constant maintenance burden

We are stepping back to Level 2 with a clear path forward:

1. **Today (L2):** Compile intent into static plays. `/create-play` is the compiler. Plays are fast, deterministic, readable. Intent.yaml is the design spec, SKILL.md is the compiled binary.

2. **Next (L3):** Enrich intent.yaml to carry more of the orchestration knowledge. Compose plays into chains with defined interfaces. Intent crafting becomes the primary skill.

3. **Future (L4):** When models are cheaper and more capable, move resolution back to runtime. Single orchestrator, dynamic DAG, adaptive execution.

4. **North star (L5):** Fully autonomous. Intent in, software out. Architectural aspiration, not a current goal.

## What This Changes (Immediate — L2)

1. **SKILL.md is the single runtime artifact.** No separate DAG JSON at runtime. The task list is baked into the play.
2. **Intent.yaml is build-time only.** Referenced by `/create-play`, not by the running play.
3. **Intent-resolver is a build-time tool.** Invoked inside `/create-play` during compilation, not at play runtime.
4. **Task status tracking in STM.** On each task completion, write status to `{stm_base}/{issue}/status/{play-name}.json` for crash recovery. This is a status log, not the task definition.
5. **Plays are readable again.** One file, sequential logic, no indirection through DAG JSON + intent.yaml + cache.
6. **`/create-play` becomes the critical tool.** Quality of compilation directly impacts play quality. The compiler must produce correct, complete, readable plays.

## Example: `commit-code` Across All Five Levels

### Level 1 — commit-code (Boundary-Defined)

The play defines: **input** = uncommitted changes in a repo, **output** = well-formed commits pushed to remote. What happens inside is up to the system.

```
Input:  Uncommitted changes exist in the repository
Output: Conventional commits with issue references, pushed to remote
Middle: System decides — may group by concern, may not. May check for
        sensitive files, may not. No checkpoints, no evals, no evidence.
```

It has structure at the edges — you know what goes in and what comes out. But the path is non-deterministic. Fast to build, works for simple cases, unreliable for complex ones.

### Level 2 — commit-code (Compiled, Current Target)

Intent.yaml defines: C1 (branch guard), C2 (changes exist), C3 (issue mapping), C4 (sensitive files), C5 (conventional format), C6 (issue reference), C7 (push to remote). Failure conditions F1-F4. Scenarios S1-S2.

`/create-play` compiles this into SKILL.md using Structure A (full checkpoint flow):

```
Pre-flight:
  - Check C1: branch is not main/master
  - Check C2: changed files exist
  - Check C4: no sensitive files
  - Check C3: open issues exist

Preparation:
  - repo-orchestrator: analyze changes → writes analysis to STM
  - project-orchestrator: fetch issues, map changes to issues → writes mappings to STM
  - Eval: verify groupings (F1), verify mappings (C3, F4)

Checkpoint (skippable when all high confidence):
  - repo-orchestrator: draft brief from STM
  - Present brief → Tether/Vanish

Execution:
  - repo-orchestrator: create commits from STM data (not brief)
  - Eval: verify commit quality (F1, F2, F3, F4, C5, C6)
  - repo-orchestrator: push branch
  - Eval: verify push (C7, non-blocking)

Scenario evals:
  - S1: Code reviewer can understand each commit
  - S2: Team lead can report progress per issue

Evidence:
  - Write evidence to STM
  - Self-commit via repo-orchestrator (ADR 012)
```

Deterministic. Same changes → same commits every time. The play never reads intent.yaml at runtime — everything is baked in. The workflow structure (pre-flight → preparation → checkpoint → execution → evidence) comes from the play framework. The domain knowledge (C1-C7, F1-F4, S1-S2) comes from intent.

As a higher-order L2, `ship` chains this: pre-flight → execute commit-code → feed STM into create-pr → execute create-pr → feed into merge-pr → execute merge-pr → checkpoint → done.

### Level 3 — commit-code (Intent-Rich, Compiled)

Same compiled output. Same deterministic execution. But the intent.yaml is richer — it defines the workflow structure, not just the domain knowledge:

```yaml
intent: >
  Commit all changed files grouped by concern with issue references...

pre_flight:
  - check: branch_not_protected
    on_fail: halt
  - check: changes_exist
    on_fail: graceful_exit
  - check: no_sensitive_files
    on_fail: halt

workflow:
  - phase: preparation
    agents: [repo-orchestrator, project-orchestrator]
    evals: [grouping_quality, mapping_completeness]
  - phase: checkpoint
    skip_when: all_confidence_above(0.85)
  - phase: execution
    agents: [repo-orchestrator]
    evals: [commit_quality, push_verification]

evidence:
  format: markdown
  self_commit: true
  includes: [commit_record, eval_results, scenario_outcomes]

constraints: [C1, C2, C3, C4, C5, C6, C7]
failure_conditions: [F1, F2, F3, F4]
scenarios: [S1, S2]
```

The compiler still produces SKILL.md. The execution is still deterministic. But no workflow template was consulted — the intent is self-contained. The user had to know to define pre-flights, checkpoint skip conditions, evidence format. Intent crafting is the skill. If they forget a pre-flight or misconfigure the confidence threshold, the compiled play will be wrong.

### Level 4 — commit-code (Runtime Resolution)

There is no `commit-code` play. The user invokes the universal orchestrator:

```
User: /orchestrate intent=commit-code/intent.yaml
```

The orchestrator:
1. Reads intent.yaml
2. Calls intent-resolver at runtime → gets a DAG
3. Executes the DAG — dispatching to whatever agents the resolver selected
4. DAG can be cached for repeat runs with the same intent
5. Runs evals, collects evidence, reports

The DAG might look different than L2's baked version — the resolver might pick different agents, add or remove steps based on context (e.g., skip push if no remote configured, add extra validation if sensitive file patterns detected). Non-deterministic. Higher token cost. But a change to intent.yaml immediately changes behavior — no re-compilation needed.

### Level 5 — commit-code (Dark Factory)

There is no `commit-code` anything. The user writes an intent:

```
"I have changes in my repo. Commit them properly."
```

The system:
- Discovers what "properly" means from organizational knowledge (LTM)
- Auto-discovers available skills (analyze-changes, create-commit, etc.)
- Analyzes the changes, determines grouping, maps to issues
- Creates commits, pushes, documents evidence
- Runs code evals against the final output
- Returns the result

The user checks the git log. If it looks right, they move on. If not, they refine the intent. No plays, no compilation, no orchestrator configuration. All time goes into the intent. Just intent → outcome.

## Consequences

**Positive:**
- Plays execute faster (no resolution step at L2)
- Plays are self-contained, readable, debuggable
- Intent remains the architectural source of truth at every level
- Clear upgrade path: L2 → L3 → L4 → L5 as models improve and costs drop
- Each level builds on the previous — plays work unchanged inside L3 compositions
- `/create-play` as compiler is a well-understood pattern (source → compile → binary)

**Negative:**
- Intent changes require manual re-baking at L2-L3 (mitigated by hash guard)
- Plays can't adapt to novel situations (by design — that's L4)
- The compiler (`/create-play`) is a critical path component — bad compilation → bad plays
- Risk of premature optimization: building L4 infrastructure before plays are stable (the mistake we just made)

**Neutral:**
- Different plays can sit at different levels based on complexity and change frequency
- The maturity model is a progression, not a mandate — some plays may never need to go beyond L2

## References

- Shapiro, Dan. "The Five Levels: from Spicy Autocomplete to the Dark Factory." January 2026.
- Haselwanter, Edmund. "Dark Factory Architecture: How Level 4 Actually Works." Infralovers, February 2026.
- StrongDM's Attractor: open-source dark factory agent producing CXDB (16K Rust, 9.5K Go, 6.7K TypeScript from three Markdown specs).
- NHTSA SAE J3016: Levels of Driving Automation (conceptual inspiration for Shapiro's model).
