# Skills

Skills are learned capabilities that agents possess — technology or methodology-specific knowledge.

## Philosophy

**Skills = what agents LEARN**

Skills represent the "how" of execution. They are technology or methodology-specific knowledge that agents apply to accomplish tasks.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Learned** | Technology/methodology specific knowledge |
| **Stable** | Don't change frequently over time |
| **Reusable** | Used by multiple agents and plays |
| **Internal** | Not directly invocable by humans (see Meta-Utility exception) |
| **Context-sharing** | Share the agent's context (never forked) |

## Two Categories

Meridian has two categories of components that deploy as Claude Code skills:

| Category | What It Is | Invocability | Purpose |
|----------|-----------|--------------|---------|
| **Skills** | Learned capabilities (how to do it) | Model only (via agents) | Execute with expertise |
| **Plays** | Workflows (what to do and in what order) | Human OR Model | Orchestrate workflow |

Both deploy to `.claude/skills/` but serve fundamentally different roles. This document covers **Skills** and **Plays**. See [Plays](./plays.md) for full play documentation.

### Meta-Utility Skills (Exception)

Some skills exist to manage the Meridian framework itself. These are classified as **meta-utility skills** and may be `user-invocable: true` despite the general rule that skills are model-invocable only.

Example: `sync-claude` — synchronizes Meridian components to Claude Code directories. It is invoked directly by the user because it manages the deployment pipeline, not a domain task.

Meta-utility skills:
- Are user-invocable
- Serve framework operations, not domain work
- Are not invoked by agents or plays

## Available Skills

### Repository Operations Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `analyze-changes` | false | sonnet | Analyze uncommitted changes for categorization and risk assessment |
| `analyze-pr` | false | sonnet | Analyze branch and generate context-aware quality checklist |
| `create-commit` | false | haiku | Stage files and create a commit |
| `setup-branch` | false | haiku | Create branch, push to origin, optionally use worktree for dirty trees |
| `submit-pr` | false | haiku | Push branch and create pull request with formatted checklist |

### Project Management Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `archive-issue-stm` | false | haiku | Archive a closed issue's STM directory into year-month buckets |
| `capture-issue` | false | sonnet | Capture an issue (feature, bug, defect, epic, enhancement) as a labeled GitHub Issue |
| `manage-issue` | false | sonnet | Read, create, close, or resolve GitHub issues with optional sub-issue attachment |
| `read-issue` | false | sonnet | Read a GitHub issue and extract structured context |
| `write-evidence` | false | haiku | Write evidence, checkpoint, and status artifacts to the `.garura/` folder whitelist |

### Architecture Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `derive-nfr-spec` | false | sonnet | Derive NFR spec from quality profile and architecture inputs |
| `derive-quality-vision` | false | sonnet | Derive quality vision from product and NFR inputs |
| `draft-architecture` | false | sonnet | Draft architecture artifacts (logical, physical, NFR, quality) |
| `draft-technical-approach` | false | sonnet | Draft technical approach document from features specification |

### Feature / Implementation Design Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `draft-implementation-plan` | false | sonnet | Produce execution plan with scope items, file paths, and exit gates |
| `draft-lld` | false | sonnet | Draft low-level design from features and technical approach |
| `draft-product-spec` | false | sonnet | Create `features.yaml` defining product behaviors, invariants, scope boundaries, and acceptance criteria (implementation-agnostic) |
| `draft-verification-scenarios` | false | sonnet | Create verification scenarios with pass/fail criteria and automation classification |
| `research-domain-context` | false | sonnet | Research vertical domain knowledge via web when LTM is insufficient |
| `validate-implementation-design` | false | sonnet | Cross-validate prepare artifacts for coverage, compartmentalization, and audience separation |

### Product / Strategy Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `assess-market-opportunity` | false | sonnet | Assess the strategic opportunity for a product or feature |
| `check-brief-quality` | false | sonnet | Check the quality and completeness of a product brief |
| `configure-capabilities` | false | sonnet | Configure selected capabilities with feature flags and constraints |
| `derive-epics` | false | sonnet | Derive epics from a product brief and scope |
| `evaluate-scope` | false | sonnet | Evaluate scope fit against strategic goals |
| `generate-brief` | false | sonnet | Generate a product brief from strategic inputs |
| `generate-market-brief` | false | sonnet | Generate a market brief artifact |
| `generate-project-profile` | false | sonnet | Generate a project profile artifact |
| `generate-quality-profile` | false | sonnet | Generate a Quality Profile for a product feature |
| `plan-mvp` | false | sonnet | Plan MVP feature set from epics and scope |
| `refine-scope` | false | sonnet | Refine product scope based on constraints and priorities |
| `research-market` | false | sonnet | Research market landscape, competitors, and positioning |
| `resolve-domain` | false | sonnet | Resolve domain and capability context for a product intent |
| `scope-capabilities` | false | sonnet | Select capabilities from the domain taxonomy for a product |
| `validate-scope` | false | sonnet | Validate scope artifact against the canonical schema |

### UX / Design Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `plan-experience` | false | sonnet | Plan user experience artifacts — personas, screens, flows, wireframes |

### Quality Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `build-quality-gate` | false | sonnet | Evaluate implementation against the Quality Profile's acceptance criteria |
| `validate-epic-design` | false | sonnet | Cross-validate epic design artifacts for standards compliance |

### Testing Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `execute-test-suite` | false | sonnet | Execute a test suite and record results |
| `write-tests` | false | sonnet | Write test suites for feature verification |

### Knowledge Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `distill` | false | sonnet | Distill structured knowledge from artifacts into LTM |
| `resolve-ltm-context` | false | sonnet | Resolve the relevant LTM context for a given task |
| `validate-kb-extension` | false | sonnet | Validate a KB extension against the canonical nine-section schema |
| `wire-ltm-context` | false | sonnet | Wire LTM context paths for downstream agent consumption |

### Coding Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `write-implementation` | false | sonnet | Write implementation code per an execution plan scope item |

### Meta-Utility Skills

| Skill | User-Invocable | Model | Description |
|-------|----------------|-------|-------------|
| `sync-claude` | true | haiku | Sync Meridian components to .claude/ (project mode) or ~/.claude/ (global mode, default) |

For the complete play roster, see [Plays Component Guide](./plays.md).

## Skill Properties

### Model-Invocable Only

Skills are **never invoked directly by humans** (except meta-utility skills). The invocation chain is:

```
Human → Play → Agent → Skill
```

This ensures:
- Proper context is built
- Standards are applied
- Decisions are made by the agent

### LTM Template Pattern

Skills read templates from LTM (via paths passed by agents), not from local `templates/` directories. This is the pattern established by ADR 009.

When a skill needs an organizational template (e.g., an epic schema, a brief HTML template), the agent:
1. Searches `~/.garura/core/memory/` for the relevant template or schema
2. Passes the discovered LTM path to the skill as an input parameter

The skill reads from the provided path. It does NOT search LTM itself. This separation keeps organizational knowledge mutable by adopters while skill logic stays stable.

### Silent Validation

Skills validate their inputs and outputs internally. They do NOT output validation results, checklists, or summaries to their caller.

Validation happens in two layers:

1. **Schema validation** — the skill validates its output against its domain schema (e.g., `epic-schema.md` for epics). Required fields, types, and structural constraints are checked.
2. **Intent failure condition validation** — if `intent_path` is available in the skill's input, the skill also validates against the failure conditions defined in `intent.yaml`. These are the "what must NOT be true" conditions from the play's intent.

If either validation fails, the skill attempts self-correction before returning failure. Only after correction attempts fail does the skill return a structured failure contract. This keeps the caller's retry logic clean — a structured failure means the skill exhausted its self-correction options.

Agents validate outcomes against intent.yaml failure conditions after the skill completes — also silently. Validation summaries belong in the `notes` field of the JSON contract (1 sentence), not in prose responses.

### Output Contract Pattern

Skills return a YAML output contract with artifact paths. Full data is written to STM files — not returned in the contract itself.

```yaml
# Example skill output contract
scoped_epics:
  epics_path: ".garura/project/product/chronos/epics.yaml"
  slug: "chronos"
  epic_count: 5
```

The calling agent extracts the artifact path from this contract and updates the JSON contract's `stm` paths. The agent does NOT forward the skill's YAML output as its own response.

Each skill defines a different output contract structure. Key skills and their output shapes:

| Skill | Output Key | Key Fields |
|-------|-----------|------------|
| `draft-product-spec` | `features` | `features_path`, `feature_count`, `invariants_count` |
| `draft-technical-approach` | `technical_approach` | `technical_approach_path`, `decisions_count` |
| `draft-lld` | `tech` | `tech_path`, `components_count` |
| `draft-verification-scenarios` | `scenarios` | `scenarios_path`, `scenario_count`, `coverage.total_scenarios` |
| `draft-implementation-plan` | `plan` | `plan_path`, `execution_order_count` |
| `validate-implementation-design` | `validation` | `validation_path`, `pass`, `findings_count` |

Full output specifications are in each skill's `SKILL.md`. Skills write detailed data to STM files — the output contract carries only paths and summary metadata.

### Context Sharing

Skills share the agent's context because:
1. **Continuity** — Skills need context built by the agent
2. **Efficiency** — No redundant context building
3. **Coherence** — Skills work together toward the agent's goal

### Never Forked

Forking a skill would:
- Create a 1:1 limit (one skill per agent)
- Lose shared context
- Break the coherence principle

## Skill Categories

### By Purpose

| Category | Pattern | What It Does |
|----------|---------|--------------|
| **Operations** | `{action}-{object}` | Execute repository and project operations |
| **Analysis** | `analyze-{object}`, `assess-{object}` | Analyze and assess for structured output |
| **Product** | `{action}-product-{object}`, `{action}-{product-artifact}` | Product strategy and vision artifacts |
| **Strategy** | `{action}-roadmap-{object}`, `generate-{object}` | Roadmap and engineering planning artifacts |
| **Meta** | `sync-{object}` | Framework management |

## Naming Convention

Skills follow two naming patterns:

### Technology-Specific Skills: `{action}-{tech/method}`

For skills that embody technology or methodology expertise:

| Pattern | Examples |
|---------|----------|
| `write-{language}-code` | `write-java-code`, `write-typescript-code` |
| `create-{framework}-tests` | `create-jest-tests`, `create-pytest-tests` |
| `do-{type}-analysis` | `do-rca-analysis`, `do-impact-analysis` |

### Operation Skills: `{action}-{object}`

For skills that perform repository or project operations:

| Pattern | Examples |
|---------|----------|
| `analyze-{object}` | `analyze-changes`, `analyze-pr` |
| `create-{object}` | `create-commit` |
| `submit-{object}` | `submit-pr` |
| `manage-{object}` | `manage-issue` |
| `setup-{object}` | `setup-branch` |

## Skill Invocation

```
Agent: {domain}-{role}
    |
    ├── Reads config.yaml + LTM selectively (passes LTM paths to skills)
    |
    ├── Decides which skills to apply
    |
    └── Invokes skills with shared context + LTM paths + STM paths
              |
              ├── Skill A: reads from paths, writes artifact to STM, returns output contract
              |
              └── Skill B: reads from paths, writes artifact to STM, returns output contract
    |
    └── Extracts artifact paths from output contracts, updates JSON contract
```

### Agent Autonomy

Agents have **full autonomy** in skill selection:
- Agent decides which skills to invoke
- Agent decides the order of invocation
- Agent decides when to stop

## Skill Definition Structure

Skills are self-contained directories following Claude Code's skill format.

### Directory Structure

```
core/components/skills/{skill-name}/
├── SKILL.md              # Skill definition
├── reference/            # Skill-specific reference files (optional)
│   └── {domain-ref}.md
└── templates/            # Output format templates (optional — see LTM Template Pattern)
    └── {output}.md
```

### SKILL.md Frontmatter

Frontmatter contains only fields that Claude Code and tooling systems consume:

```yaml
---
name: {skill-name}
description: {what this skill does}
user-invocable: false
model: {sonnet|haiku}
allowed-tools: {Tool1, Tool2}
---
```

| Field | Description |
|-------|-------------|
| `name` | Skill identifier, matches directory name |
| `description` | Short summary for CLI/tooling discovery |
| `user-invocable` | `false` for skills, `true` only for meta-utility skills and plays |
| `model` | Model to use (see Model Selection below) |
| `allowed-tools` | Comma-separated list of tools the skill may use |

### SKILL.md Body Structure

```markdown
# {skill-name}

{One-line description of what the skill does.}

## Purpose

{What this skill does and its boundaries. What it DOES vs what it does NOT do.}

## Input

{What the skill receives from the calling agent.}

## Process

{Step-by-step execution — the skill's core logic.}
{References to local files or LTM paths passed by the agent.}

## Output

{Structured output contract — artifact paths, not full data.}

## Reference

{Optional — load directives for reference files.}

## Constraints

{NEVER/ALWAYS rules that bound the skill's behavior.}

## Version

| Field | Value |
|-------|-------|
| Version | {semver} |
| Category | {analysis|operations|coding|testing|patterns|quality|strategy|design} |
```

### Model Selection

| Model | When To Use | Examples |
|-------|-------------|----------|
| `haiku` | Execution-only skills — no analysis, no decision-making, fast operations | `create-commit`, `setup-branch`, `submit-pr`, `sync-claude`, `archive-issue-stm` |
| `sonnet` | Analysis skills — reasoning, categorization, pattern matching, complex logic | `analyze-changes`, `analyze-pr`, `manage-issue`, `draft-product-spec`, `draft-technical-approach` |

**Rule of thumb:** If the skill just runs commands and formats output, use `haiku`. If the skill needs to read, reason, and categorize, use `sonnet`.

## Skill References

Skills reference two types of knowledge (see [ADR 009](../adr/009-skill-ltm-organizational-knowledge.md)):

### Skill-Local References

Skill-specific knowledge that is NOT organizational — detection patterns, tool-specific API references, evaluation logic. These live in the skill's `reference/` directory.

```markdown
Load patterns from: `reference/risks.md`
```

### LTM References (Organizational Knowledge)

Organizational standards that adopters customize — commit categories, issue templates, quality gates, epic schemas. These live in LTM and are referenced by well-known paths. The agent discovers the path and passes it to the skill as an input parameter.

```markdown
Skill loads from its own bundled reference (e.g., `skills/{skill-name}/reference/{ref-file}.md`)
(Schemas tightly coupled to one skill belong with that skill, not in shared LTM.)
```

| Knowledge Type | Location | Mutable By Adopter |
|---------------|----------|-------------------|
| Skill behavior (process, constraints) | Skill-local (embedded) | No — edit skill source |
| Skill-specific references (risk patterns) | `reference/` directory | No — edit skill source |
| Organizational standards (categories, schemas) | LTM (`~/.garura/core/memory/`) | Yes — edit LTM |
| Output format templates | `templates/` directory or LTM | Depends on template type |

## Skill Qualifiers

Use qualifiers **only when multiple types exist**:

| Scenario | Naming |
|----------|--------|
| Single type exists | `design` |
| Multiple types exist | `design-tech`, `design-ux` |

This prevents unnecessary prefixes while maintaining clarity.

## Skill Location

Skill definitions are stored in:

```
core/components/skills/
```

Play definitions are stored in:

```
core/components/plays/
```

## Related Documentation

- [ADR 005: Skills as Capabilities](../adr/005-skills-as-capabilities.md)
- [ADR 006: Naming Conventions](../adr/006-naming-conventions.md)
- [ADR 007: Skill-Local References](../adr/007-skill-local-references.md) — Partially superseded by ADR 009
- [ADR 009: Skill LTM Organizational Knowledge](../adr/009-skill-ltm-organizational-knowledge.md)
- [Agents Component Guide](./agents.md)
- [Plays Component Guide](./plays.md)
