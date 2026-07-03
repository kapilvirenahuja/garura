# Agents

Agents are autonomous decision-makers in Garura with domain-specific expertise.

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

Garura avoids both extremes:

| Too Narrow | Too Granular | Right Level |
|------------|--------------|-------------|
| Generic role only | Task-specific specialist | Domain + role |
| `builder` | `bug-analyzer` | `{domain}-builder` |
| `designer` | `feature-implementer` | `{domain}-designer` |

**Principle:** 1 agent = 1 domain expertise, not 1 task.

**Note on play-scoped sub-roles:** Some plays define scoped sub-roles that are not standalone agents. For example, the implement play builds with spec separation — its implementer sub-role never sees tests or evals — a context-isolated role that only exists within that play's execution. Play-scoped sub-roles follow ADR 004's granularity principle — they are too granular for standalone agents but serve a specific isolation purpose within a play.

## Available Agents

| Agent | Domain | Role | Model | Description |
|-------|--------|------|-------|-------------|
| `change-reviewer` | review | reviewer | sonnet | Categorizes a PR diff agentically and design-grounds the design-bearing categories against committed/external sources — the branch under review is never its own standard |
| `code-builder` | implementation | builder | sonnet | Executes structured execution plans for software implementation — requires a formal plan as input. ONLY for source code files. |
| `env-operator` | environments | operator | sonnet | Owns live environments for the delivery pipeline — local for `/launch`, cloud for `/deploy` — proves reachability, captures deploy records, tears down on request |
| `epic-expectation-crafter` | expectation | epic-crafter | opus | Generates the Expectations block (success_scenario + recovery) for product-layer intent epics via `draft-epic-expectation` |
| `evals-engineer` | evaluation | engineer | sonnet | Engineers verification evals from specifications, compartmentalized from the implementer — steelman refutation evals for `/implement`, legacy encrypted flows via `generate-encrypted-evals` |
| `feature-steward` | feature-spec | steward | opus | Autonomous owner of feature specification (features.yaml), implementation-design cross-validation, and manual test scenario generation |
| `intent-resolver` | intent | resolver | sonnet | Reads a play's intent, Expectation artifact, workflow template, and available agents to produce a JSON task DAG for play execution |
| `market-analyst` | market-research | analyst | sonnet | Market intelligence — produces a quantified market brief with TAM/SAM/SOM, competitive landscape, and market gaps |
| `product-keeper` | product-capability | keeper | opus | KB-driven capability configuration, intent epic generation, and aggregated quality profile derivation |
| `product-os-keeper` | product-os | keeper | opus | Autonomous owner of the ProductOS model (Domain → Capability → Functionality, ICE, profile, decisions) — used by the strategic plays, the lens plays, and `/grill` |
| `project-orchestrator` | project | orchestrator | sonnet | Autonomous decision-maker for project management operations (issues, tracking, planning) |
| `quality-auditor` | quality | auditor | sonnet | Independently verifies code quality standards (linting, unit tests, type checking, build, quality gates) — context-isolated from evals and builder output |
| `repo-orchestrator` | repo | orchestrator | sonnet | Autonomous decision-maker for repository operations (commits, branches, PRs, git state) |
| `scriber` | infra | evidence-writer | haiku | DEPRECATED (#434) — evidence/checkpoint/status writer, superseded by the command model; retained for reference, not installed |
| `tech-architect` | architecture | architect | opus | Deep codebase architecture analysis, pattern recognition, LLD production, dependency graphs, and implementation planning |
| `tech-designer` | design | designer | sonnet | Technical analysis, RCA, and solution design for features and bugs |
| `test-engineer` | testing | engineer | opus | Authors `/implement`'s test pieces spec-separated; test surface analysis, blast radius computation, verification scenario authoring |
| `test-runner` | test-execution | runner | opus | Context-isolated test executor — runs tests and reports pass/fail with stderr capture; never interprets failures |

### Scriber dispatch pattern (Utility agent, 214.1)

**Status (#434):** `scriber` is deprecated — superseded by the ProductOS command model. Its definition is retained for reference (marked `deprecated: true`) and is not installed. The pattern below describes how it worked.

`scriber` is a utility agent — it performs no domain reasoning and owns no decisions about content. Plays dispatch it via the Agent tool with `run_in_background: true` for every write that lands in the `.garura/` folder whitelist (evidence, checkpoint, status artifacts). The scriber invokes the `write-evidence` skill, which is the single chokepoint that validates paths against the 9 whitelist patterns before calling `Write`.

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

## Agent Behavior

### Four Crafts: Where Agents Fit

Agents are the primary practitioners of **Context Crafting** — one of the Four Crafts in Garura's architecture. When an agent receives a JSON contract, its most important work before invoking any skill is assembling complete, accurate context: discovering LTM paths (schemas, templates, standards), reading STM artifacts, and combining them with the slug and base paths into structured skill inputs. This context assembly is the agent's primary value in the play workflow — skills are only as effective as the context the agent gives them.

For the full Four Crafts explanation (Context Crafting, Intent Crafting, Execution Crafting, Verification Crafting), see `docs/philosophy/architecture.md`.

### JSON Contract Mode

When a play orchestrates multiple agents, it passes a **JSON contract** as the agent's prompt. This is the primary invocation mode within plays.

**When an agent receives a JSON contract:**

1. **Read intent.yaml** at `intent_path` from the contract — understand the goal, constraints, failure conditions, and scenarios.
2. **Identify what to handle** — look at `stm` paths in the contract. Null paths indicate missing artifacts. Based on the goal, the agent's domain, and what is missing, determine what to produce.
3. **Update task graph** — mark the agent's task as `in_progress` via TaskUpdate. Add new tasks via TaskCreate if additional work is discovered.
4. **Collect context from LTM** — search `~/.garura/core/memory/` for domain-relevant standards, templates, and schemas. Pass discovered LTM paths to skills as input. Skills do NOT search LTM themselves.
5. **Read existing STM artifacts** — read non-null `stm` paths. Write context to STM if downstream agents need it.
6. **Call skills** from the agent's skill pool. The agent assembles skill inputs by combining: (1) STM artifact paths from the contract, (2) LTM paths discovered during context loading (schemas, templates, standards), and (3) the product slug and base STM path. The agent is responsible for giving the skill everything it needs — skills do NOT search or load LTM themselves. Skills read from the provided paths, write artifacts, and return a YAML output contract with the artifact path. Do NOT forward skill output as the response — extract only the artifact path.
7. **Validate outcomes** against failure conditions and scenarios from intent.yaml. Validation is silent — do NOT include validation results in the response. If validation fails, attempt self-recovery (max 2 attempts). If still failing, set `step_failure` in the contract.
8. **Mark task complete** — update task graph via TaskUpdate.
9. **Build and return the enriched JSON contract** — take the received contract as a base, update `stm` paths with artifact paths from skill output, add up to 3 short notes (1 sentence each), set `step_failure` if needed. Return ONLY this JSON object. Nothing else.

### Response Format (JSON Contract Mode)

The agent's entire response is ONE JSON object. No prose, no YAML blocks, no validation checklists before or after.

```json
{
  "intent_path": "core/components/plays/prepare/reference/intent.yaml",
  "stm_base": ".garura/project/issues/",
  "stm": {
    "input": {
      "features_yaml_path": ".garura/project/issues/42/specs/features.yaml"
    },
    "output": {
      "technical_approach_path": ".garura/project/issues/42/specs/technical-approach.md",
      "tech_yaml_path": ".garura/project/issues/42/specs/tech.yaml"
    }
  },
  "task_id": "draft-tech-context",
  "notes": [
    "Two competing framework options surfaced — chose the one matching existing LTM conventions",
    "Blast radius limited to two modules — documented in features.blast_radius"
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

### feature-steward Skill Pool

| Skill | Purpose |
|-------|---------|
| `draft-product-spec` | Create `features.yaml` defining product behaviors, invariants, scope boundaries, and acceptance criteria (implementation-agnostic) |
| `draft-verification-scenarios` | Create verification scenarios with pass/fail criteria and automation classification |
| `validate-implementation-design` | Cross-validate design artifacts for coverage, compartmentalization, audience separation |

### tech-designer Skill Pool

| Skill | Purpose |
|-------|---------|
| `draft-technical-approach` | Draft technical approach document from features specification |
| `draft-lld` | Draft low-level design from features + technical approach |
| `research-domain-context` | Research vertical domain knowledge via web when LTM is insufficient |
| `draft-implementation-plan` | Produce execution plan with scope items, file paths, and exit gates |
| `refine-quality-profile` | Refine the quality profile against architectural reality, with a delta_log per adjustment |
| `draft-rca` | fix-bug — trace symptom to specific root cause; writes rca.yaml (+ resolution-trace.yaml when `ltm_context` is provided) |
| `draft-fix-design` | fix-bug — design the fix with at least one alternative considered; writes design.yaml |
| `author-regression-test` | fix-bug — author a failing YAML eval-spec regression test, verified red before returning |
| `author-build-plan` | implement — break one ready epic into the test-first build plan (stories/tasks/tests/docs as a grounded DAG) |
| `detect-test-harness` | implement — capture the project's runnable test/lint/build commands for the harness file |

If no matching skill exists for an artifact the agent is asked to produce, it returns a structured failure requesting skill creation — it never authors artifacts inline.

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
| `merge-pr` | Merge PR, switch to base branch, pull latest, delete feature branch |

### project-orchestrator Skill Pool

| Skill | Purpose |
|-------|---------|
| `manage-issue` | Read, create, close, resolve, or list GitHub issues with optional sub-issue attachment |
| `resolve-issues` | Map change groups to existing open issues with confidence scoring |

### evals-engineer Skill Pool

| Skill | Purpose |
|-------|---------|
| `author-steelman-evals` | implement — author steelman refutation evals from spec-side inputs; no encryption, isolation by sub-agent |
| `generate-encrypted-evals` | Legacy flow — generate YAML evals from configured spec sources, encrypt with AES-256-CBC+PBKDF2, delete plaintext, write manifest.json |

### intent-resolver Skill Pool

intent-resolver has no skill pool — it reads the play's intent (clean triple), Expectation artifact, workflow template, and available agents, and returns a JSON task DAG directly (tools: Read, Write).

### market-analyst Skill Pool

| Skill | Purpose |
|-------|---------|
| `research-market-opportunity` | Parse a product idea, query web + LTM, structure findings into a market brief with TAM/SAM/SOM, competitors, gaps, risks |
| `research-domain-context` | Deep-dive on vertical domain knowledge when LTM is insufficient |

### product-keeper Skill Pool

| Skill | Purpose |
|-------|---------|
| `configure-capabilities` | Load the capability catalog, walk cross-tree constraints, produce scope.yaml with selected/rejected capabilities and constraint trace |
| `enrich-capabilities` | Merge profile-specific overrides onto KB values per selected capability; produce enriched-capabilities.yaml |
| `manage-features` | Author features.yaml (3-tier domain → capability → feature with 5-point status vocabulary) |
| `generate-intent-epics` | Instantiate the intent-epic template per enriched capability; one epic file per capability |
| `validate-intent-epics` | Blocking validator against the intent-epic schema (four-section ICE shape) |
| `derive-quality-profile-from-epics` | Aggregate epic constraints into ISO 25010 buckets; produce quality-profile.yaml |
| `research-domain-context` | Web research grounding pack when LTM coverage is thin |
| `infer-*-from-code` family | Brownfield inference — propose project profile, domain selection, market brief, MVP recommendation, scope, enriched capabilities, features, epics, and research from a codebase scan |

### product-os-keeper Skill Pool

| Skill | Purpose |
|-------|---------|
| `search-kb` | Route a piece of work to its place in the KB tree (domain → capability → functionality) |
| `propose-kb-node` | The nothing-fits path — research the gap and draft a new KB node as a proposal for human review |
| `kb-search` | Search the empirical KB shelves for condition-matched learnings — the grounding engine for KB-grounded lenses |
| `author-vision-seed` | Draft the `/vision` seed — domain node, candidate capabilities, goals-only ICE, directional profile |
| `enrich-capability-ice` | `/understand` — deepen one capability's seed ICE into a rich ICE grounded in its KB shelf |
| `author-shape-bundle` | `/shape` — draft one domain's selection bundle (capabilities, functionalities, ICE, personas, decisions) |
| `author-roadmap` | `/roadmap` — draft the slice plan (effort, dependencies, value order) |
| `author-quality-lens` / `author-ux-lens` / `author-agentic-lens` / `author-architecture-lens` / `author-run-lens` / `author-measure-lens` / `author-marketing-lens` | Draft the per-slice lens grounding docs for the lens plays |
| `author-epics` | `/grill` — draft the epic cut for one realized slice |
| `check-cut-tensions` | `/grill` — per-round tension check of the drafted cut against everything the slice declared |
| `author-hitl-scenarios` | `/launch` — build HITL testing scenarios for one validated epic |
| `rank-recommendations` | `/next` — rank the candidate set into one next-best-action plus a ranked list |

### quality-auditor Skill Pool

| Skill | Purpose |
|-------|---------|
| `plan-validation-checks` | Produce the check manifest (checks.yaml) — stacks detected, tooling resolved, gates and benchmarks mapped |
| `judge-validation-results` | Compose findings.yaml only from captured results, every finding citing captured output with a location |

### change-reviewer Skill Pool

change-reviewer has no skill pool — it categorizes the diff and design-grounds findings directly using its tools (Bash, Read, Grep, Glob).

### env-operator Skill Pool

| Skill | Purpose |
|-------|---------|
| `stand-up-launch-env` | Bring up the live LOCAL environment for `/launch` with its deploy record; teardown after sign-off or abort |
| `deploy-to-cloud-env` | Deploy the increment to a CLOUD environment for `/deploy` with deploy record and health proof |

### epic-expectation-crafter Skill Pool

| Skill | Purpose |
|-------|---------|
| `draft-epic-expectation` | Populate `expectations.success_scenario[]` and `expectations.recovery[]` per epic file; write the decision manifest |

### test-runner Skill Pool

| Skill | Purpose |
|-------|---------|
| `run-generated-tests-isolated` | Run the given test files against the codebase in isolation; write test-run-report.yaml with per-test pass/fail and stderr |

### tech-architect Skill Pool

| Skill | Purpose |
|-------|---------|
| `research-domain-context` | Research domain knowledge via web when LTM is insufficient |
| `derive-systems-inventory` | arch Stage 1 — one inventory file per system from selected capabilities, supporting sub_systems nesting |
| `derive-logical-architecture` | arch Stage 3 — layered tech-agnostic structure with cycle detection and capability traceability |
| `derive-physical-architecture` | arch Stage 4 — runtime shape with deployment targets, comms, and per-QP-characteristic `nfr_delivery[]` |
| `derive-tech-stack` | arch Stage 5 — per-box picks of languages/runtimes/frameworks/libraries/tools/patterns |
| `validate-architecture-spec` | arch post-generation — single 22-check pass across all arch artifacts and decision manifests |
| `infer-architecture` | brownfield — scan codebase, produce architecture-inference.yaml |
| `build-dependency-graph` | any stage — enumerate import/call edges, detect cycles and hubs; writes dependency-graph.yaml + .md |
| `draft-tech-spec` | Author tech.yaml with concrete library picks, build tooling, test frameworks |
| `draft-implementation-plan` | Author plan.yaml (execution order, scope items, exit gates) |
| `draft-reference-algorithms` | Language-agnostic pseudocode for qualifying internal interfaces from tech.yaml |
| `infer-*-from-code` family | Brownfield inference — propose logical/physical architecture, NFR spec, and quality vision from a codebase scan |

If no matching skill exists for an artifact the agent is asked to produce, it returns a structured failure requesting skill creation — it never authors artifacts inline.

### test-engineer Skill Pool

| Skill | Purpose |
|-------|---------|
| `map-test-surface` | Phase 1B — inventory existing tests; writes test-surface.yaml |
| `compute-blast-radius` | Phase 2B — given change surface + dependency graph, compute affected and at-risk tests; writes blast-radius.yaml |
| `specify-baseline-tests` | Phase 2C — specify tests for coverage gaps that capture CURRENT behavior; writes baseline-tests.yaml |
| `draft-verification-scenarios` | Phase 3 — author three-tier scenarios (baseline, new, regression); writes scenarios.yaml |

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
1. Reading `.garura/core/config.yaml` for platform paths and settings
2. Reading intent.yaml from the JSON contract (when in contract mode)
3. Searching LTM (`~/.garura/core/memory/`) selectively — by domain keywords, not bulk loading
4. Reading existing STM artifacts at non-null `stm` paths
5. Passing discovered LTM paths and STM paths to skills — skills do NOT search LTM themselves

## Constraint Validation

Constraints in the play context are not suggestions — they are pre-conditions.

Before invoking any skill, every agent validates all constraints against current state. If ANY constraint would be violated:
1. Do NOT invoke the skill
2. Return a structured failure per `docs/framework/structured-failure-protocol.md` with `constraint_violated` populated
3. The play decides how to handle (retry, escalate, or halt)

## Why Not Specialist Agents?

Garura deprecates specialist patterns (e.g., `bug-analyzer`, `test-writer`) because:

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
