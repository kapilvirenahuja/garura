---
name: scout-project
description: Scan a project's key documents and produce a concise planning summary — architecture, tech stack, constraints, scenarios, and implementation plan. Use when starting work on a new project, preparing for implementation planning, onboarding to a codebase, or when any agent needs project-level context before producing artifacts.
user-invocable: false
model: sonnet
allowed-tools: Read, Glob, Grep
---

# scout-project

Model-invocable skill that reads a project's key documents and produces a structured planning summary. The output is a concise, actionable overview that any agent or human can use to understand the project before starting domain work.

## Purpose

Projects accumulate context across many files — project instructions, product docs, architecture decisions, implementation plans, scenario lists. Before an agent can produce meaningful artifacts, it needs to understand the project landscape. This skill does that scan once and produces a reusable summary.

The summary is human-readable (useful for checkpoint briefs) and agent-consumable (useful as context injection). It captures what a planner needs to know, not everything that exists.

You DO scan and summarize. You do NOT modify any files, make recommendations, or decide what to build.

## Input

Receive from agent:
- `project_root` — (required) Absolute path to the project root directory
- `output_path` — (required) Path where the summary should be written (e.g., `{artifact_base}/project-scout.md`)
- `focus` — (optional) What the summary should emphasize. One of: `planning` (default), `architecture`, `implementation`. Shapes which sections get more detail.

## Process

1. **Discover project structure.** Glob the project root for key files. Not all projects have the same structure — adapt to what exists:

   | File Pattern | What It Tells You | Priority |
   |---|---|---|
   | `CLAUDE.md`, `.claude/CLAUDE.md` | Project-level instructions, constraints, coding rules | High — read fully |
   | `README.md` | Project overview, purpose, quick-start | High — read fully |
   | `.garura/product/discovery/product.yaml` | Product definition — problem, users, goals, status | High — read |
   | `.garura/product/roadmap/roadmap.yaml` | Roadmap thesis, horizon sequencing, feasibility | High — read |
   | `.garura/product/roadmap/features.yaml` | Features, invariants, scope, IDD fields | High — read |
   | `.garura/product/architecture/architecture.yaml` | System architecture, stack, platforms, agentic design | High — read |
   | `.garura/product/architecture/tech.yaml` | Low-level design, project structure, components, libraries | High — read |
   | `.garura/product/architecture/scenarios.yaml` | Verification scenarios, feature gates, coverage summary | High — read |
   | `.garura/product/roadmap/plan.yaml` | Execution order, scope items, exit gates, scenario gates | High — read |
   | `memory/`, `.garura/core/memory/` | LTM: standards, knowledge, formats | Medium — scan structure, read key files |
   | `agents.md`, `.claude/agents/*.md` | Agent definitions | Medium — list names and domains |
   | `docs/`, `docs/adr/` | Documentation, architecture decision records | Medium — scan titles |
   | `philosophy/`, `principles/` | Foundational principles | Low — note existence, read if relevant to focus |
   | `.garura/core/config.yaml`, `package.json`, `pyproject.toml` | Project config, dependencies | Medium — scan for tech stack signals |

2. **Read high-priority files.** Read CLAUDE.md and README.md in full. For artifact YAMLs:
   - `product.yaml`: problem statement, target_users count, strategic_goals, status
   - `roadmap.yaml`: thesis, timeline horizons, risk summary
   - `features.yaml`: feature count, invariant count, scope boundaries
   - `architecture.yaml`: topology, stack (tech names), platforms, agentic presence
   - `tech.yaml`: project structure, component count, library count
   - `scenarios.yaml`: coverage totals (total, automated, hybrid), uncovered gaps
   - `plan.yaml`: execution_order count, total scenarios in summary, prerequisites exit gate

3. **Scan medium-priority files.** For LTM, agents, docs — list what exists and note key themes. Don't read every file; structure and naming tell you most of what you need.

4. **Identify key planning signals.** Extract:
   - **Architecture pattern** — monolith, split, microservices, serverless, etc.
   - **Tech stack** — specific named technologies from `architecture.yaml.stack` and `tech.yaml.libraries`
   - **Critical constraints** — invariants from `features.yaml.invariants`, non-negotiable rules from CLAUDE.md
   - **Implementation structure** — execution order from `plan.yaml`, feature count, scenario gating
   - **Scenario coverage** — totals and split from `scenarios.yaml.coverage`
   - **Current state** — LOCKED vs DRAFT per artifact, what's approved vs still in progress

5. **Write the summary.** Produce a structured markdown document at `output_path` with the following sections. The summary must be **strictly under 500 words** (count the body text, excluding the frontmatter header). This is a planning aid, not a documentation mirror — brevity is the entire point. If you're approaching the limit:
   - Cut Planning Notes to 2 bullet points max
   - Reduce Implementation Structure to 3-4 key features, not every feature
   - Use terse descriptions in tables — 5 words per cell, not sentences
   - Omit sections that have nothing meaningful to report

   **Self-check before writing:** Count your words. If over 500, cut until under. Do not skip this step.

## Output Format

Write to `output_path`:

```markdown
# Project Scout: {project name}

**Scanned:** {timestamp}
**Project root:** {project_root}
**Focus:** {focus}

## Overview
{1-2 sentences: what this project is and its current state}

## Architecture
- **Pattern:** {architecture pattern}
- **Components:** {list of deployment units / major components}
- **Key invariant:** {the one rule that must never be violated}

## Tech Stack
| Layer | Technology |
|-------|-----------|
| {layer} | {specific technology} |

## Artifact Status
| Artifact | Status | Key Metric |
|----------|--------|------------|
| product.yaml | LOCKED/DRAFT/— | {strategic goals count} |
| roadmap.yaml | LOCKED/DRAFT/— | {feature refs count} |
| features.yaml | LOCKED/DRAFT/— | {features count} |
| architecture.yaml | LOCKED/DRAFT/— | {stack items count} |
| tech.yaml | LOCKED/DRAFT/— | {components count} |
| scenarios.yaml | LOCKED/DRAFT/— | {total: N automated, M hybrid} |
| plan.yaml | LOCKED/DRAFT/— | {execution order count} |

## Critical Constraints
- {constraint 1}
- {constraint 2}
- {constraint 3}

## Implementation Structure
| Sequence | Feature | Scenarios |
|----------|---------|-----------|
| {seq} | {feature name} | {count} |

**Gating rule:** {how features gate — e.g., "scenario_gate must pass before next feature begins"}

## Planning Notes
- {key insight 1 for planners}
- {key insight 2 for planners}
- {any gaps, missing artifacts, or areas needing attention}
```

6. **Return output contract:**

```yaml
scout:
  path: "{output_path}"
  project_name: "{detected project name}"
  artifacts_found:
    claude_md: true|false
    readme: true|false
    product_yaml: true|false
    roadmap_yaml: true|false
    features_yaml: true|false
    architecture_yaml: true|false
    tech_yaml: true|false
    scenarios_yaml: true|false
    plan_yaml: true|false
    ltm: true|false
    agents: {count}
    adrs: {count}
  summary_stats:
    tech_stack_items: {count}
    constraints: {count}
    features: {count}
    scenarios: {total}
    execution_order_items: {count}
  status: "DRAFT"
```

## Constraints

- **Read-only.** Never modify any project file. This skill scans and summarizes.
- **Strictly under 500 words.** Count body text before writing. If over 500, cut — Planning Notes first, then table rows. This is a planning aid, not a documentation copy. If a section has nothing meaningful, omit it rather than padding. Going over 500 words is a constraint violation.
- **Concrete.** Name specific technologies, not categories. "Neon Postgres with pgvector" not "a relational database."
- **Adaptive.** Not all projects have the full YAML artifact set. Work with what exists. A project with just a README and CLAUDE.md still gets a useful summary. If a YAML artifact is absent, show "—" in the Artifact Status table.
- **No recommendations.** Report what IS, not what SHOULD BE. The agents consuming this summary make the decisions.
- **Overwrite DRAFT, refuse LOCKED.** If output_path exists with Status: LOCKED, return structured failure. If DRAFT, overwrite.
- **New artifact names only.** Look for `product.yaml`, `roadmap.yaml`, `features.yaml`, `architecture.yaml`, `tech.yaml`, `scenarios.yaml`, `plan.yaml`. Do NOT look for the old names: `vision.md`, `product-spec.md`, `technical-approach.md`, `lld.md`, `scenarios.md`, `scenario-mapping.md`.

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | context-gathering |
