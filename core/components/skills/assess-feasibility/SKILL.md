---
name: assess-feasibility
description: Assess technical feasibility of scoped epics — risk levels, blockers, sequencing constraints, architecture impact
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Bash, Grep, Glob
category: design
version: 1.0.0
---

# assess-feasibility

Model-invocable skill for assessing technical feasibility of scoped roadmap epics.

## Purpose

Read scoped epics from STM and assess each for technical feasibility: risk level, technical risks with severity, blockers, sequencing constraints, architecture impact, and open questions. Write the assessment to STM as `feasibility.yaml`. Downstream skills (`draft-roadmap-brief`, `draft-roadmap`, `generate-engineering-view`) consume this artifact.

You DO assess technical feasibility. You do NOT make product decisions, change epic scope, or implement anything.

## Input

Receive from agent:
- `epics_path` — (required) Path to the STM epics file written by scope-roadmap-epics, e.g. `.meridian/project/product/{slug}/epics.yaml`
- `artifact_base` — (required) Base path for STM artifacts, e.g. `.meridian/project/product/`
- `slug` — (required) Product slug derived from vision

## Pre-conditions

1. **Read epics** at `epics_path`. If not found, return structured failure: artifact not found.
2. **Verify epic count:** If fewer than 3 epics, return structured failure:
   ```json
   { "error": "insufficient_epics", "message": "Fewer than 3 epics in epics file — cannot assess feasibility" }
   ```

## Process

1. **Read epics from STM** — read the file at `epics_path` using the Read tool. Extract all epics with their fields: id, name, description, bucket, priority, effort, depends_on, foundation_investment, intent, constraints.

2. **Explore the codebase** — use Glob, Grep, and Bash (read-only git commands) to understand the current technical landscape relevant to each epic. Look for:
   - Existing code that relates to epic goals
   - Infrastructure, libraries, or patterns already in place
   - Technical debt or gaps that would affect implementation
   - Dependency chains between components

3. **Assess each epic** — for each epic, determine:
   - `risk_level`: `low` | `medium` | `high` — overall technical risk
   - `technical_risks`: list of specific risks, each with `risk` (description), `severity` (`low` | `medium` | `high`), `affected_systems` (what's impacted), and `mitigation` (how to address)
   - `blockers`: hard blockers that must be resolved before implementation (empty list if none)
   - `sequencing_constraints`: technical reasons this epic must come before/after others (beyond product dependencies)
   - `architecture_impact`: systems, patterns, or infrastructure affected by this epic
   - `foundation_investment`: boolean — does this epic require foundational work that benefits later epics?

4. **Identify cross-cutting concerns** — look for:
   - Open technical questions that affect multiple epics
   - Shared infrastructure needs
   - Common risk patterns

5. **Validate (silently)** — verify before writing:
   - Every epic from the input has a feasibility entry
   - Every entry has all required fields (risk_level, technical_risks, blockers, sequencing_constraints, architecture_impact, foundation_investment)
   - risk_level values are valid (`low` | `medium` | `high`)
   - technical_risks severity values are valid (`low` | `medium` | `high`)
   Do NOT output validation results — validate internally and fix issues.

6. **Write to STM** — write the feasibility assessment to `{artifact_base}/{slug}/feasibility.yaml` using the Write tool. The file must be valid YAML — no placeholders, all fields filled.

### Feasibility YAML Structure

```yaml
feasibility:
  slug: "{slug}"
  assessed_at: "{ISO-8601 datetime}"
  epics:
    - epic_id: "{id}"
      epic_name: "{name}"
      risk_level: "low|medium|high"
      technical_risks:
        - risk: "{description of risk}"
          severity: "low|medium|high"
          affected_systems: "{systems impacted}"
          mitigation: "{how to mitigate}"
      blockers: ["{blocker description, or empty list}"]
      sequencing_constraints: "{technical sequencing rationale}"
      architecture_impact: "{systems and patterns affected}"
      foundation_investment: true|false
  open_questions:
    - question: "{unresolved technical question}"
      affected_epics: ["{epic_id}", "{epic_id}"]
  summary:
    total_epics: {integer}
    high_risk_count: {integer}
    medium_risk_count: {integer}
    blocker_count: {integer}
    foundation_epics: ["{epic_id}"]
```

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after. The YAML block below is your entire response:

```yaml
feasibility:
  feasibility_path: "{artifact_base}/{slug}/feasibility.yaml"
  slug: "{slug}"
  epic_count: {integer}
  high_risk_count: {integer}
  blocker_count: {integer}
  open_questions_count: {integer}
```

The full feasibility data is written to `feasibility_path`. Downstream skills and agents MUST read from that file — do NOT pass the full assessment through memory.

## Bash Usage

Bash is available for **read-only operations only**:

| Allowed | Example | Why |
|---------|---------|-----|
| Git history | `git log --oneline -20` | Understand recent changes |
| Git blame | `git blame {file}` | Trace code authorship/history |
| Directory listing | `ls -la {path}` | Understand project structure |
| Dependency check | `cat package.json` | Identify existing infrastructure |

| Forbidden | Why |
|-----------|-----|
| Any write command | Analysis is read-only |
| `git add`, `git commit` | Not implementation |
| `rm`, `mv`, `cp` | Not file operations |

## Constraints

- NEVER make product decisions — risk level and blockers are technical assessments only
- NEVER change epic scope, priority, or bucket — report findings, don't prescribe changes
- NEVER implement anything — analysis only
- NEVER include business value assessments — your domain is technical feasibility
- NEVER pass full feasibility data through memory — ALWAYS write to STM and return the path
- ALWAYS read epics from `epics_path` using the Read tool — do NOT rely on memory
- ALWAYS assess every epic in the input — no omissions
- ALWAYS include at least one technical risk per epic (even low-risk epics have considerations)
- ALWAYS fill the open_questions section — minimum 1 question if any exist, empty list only if genuinely none
- ALWAYS validate all fields are present before writing (silently)
- ALWAYS return structured failure if epics file is missing or has fewer than 3 epics

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | design |
