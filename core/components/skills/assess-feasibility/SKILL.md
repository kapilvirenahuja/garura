---
name: assess-feasibility
description: Assess technical feasibility of scoped features — risk levels, blockers, sequencing constraints, architecture impact — data folded into roadmap.yaml
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Bash, Grep, Glob
category: design
version: 2.0.0
---

# assess-feasibility

Model-invocable skill for assessing technical feasibility of scoped roadmap features.

## Purpose

Read scoped features from the product's STM artifacts and assess each for technical feasibility: risk level, technical risks with severity, blockers, sequencing constraints, and architecture impact. Write the assessment to STM as `feasibility.yaml`. This data is then consumed and folded into `roadmap.yaml` by the `draft-roadmap` skill — feasibility is not a standalone artifact in the final output.

You DO assess technical feasibility. You do NOT make product decisions, change feature scope, or implement anything.

## Input

Receive from agent:
- `product_yaml_path` — (required) Path to product.yaml, e.g. `.meridian/product/discovery/product.yaml`
- `artifact_base` — (required) Base path for STM artifacts, e.g. `.meridian/product/`
- `slug` — (required) Product slug

## Pre-conditions

1. **Read product.yaml** at `product_yaml_path`. If not found, return structured failure: artifact not found.
2. **Verify epics exist:** Epics are referenced by E-IDs (E1, E2...) derived from the product's strategic goals and scope. If no epics can be derived, return structured failure:
   ```json
   { "error": "insufficient_epics", "message": "Cannot derive epics from product.yaml — ensure strategic_goals are populated" }
   ```

## Process

1. **Read product.yaml from STM** — read the file at `product_yaml_path` using the Read tool. Extract: slug, strategic_goals (for feature derivation), out_of_scope (for boundary awareness), assumptions (for risk context).

2. **Read epics** — read epics from `{artifact_base}/roadmap/epics.yaml`. Epics use E-IDs (E1, E2, E3...) as defined by scope-roadmap-epics.

3. **Explore the codebase** — use Glob, Grep, and Bash (read-only git commands) to understand the current technical landscape relevant to each feature. Look for:
   - Existing code that relates to feature goals
   - Infrastructure, libraries, or patterns already in place
   - Technical debt or gaps that would affect implementation
   - Dependency chains between components

4. **Assess each epic** — for each epic (E1, E2, E3...), determine:
   - `epic_ref`: E-ID (E1, E2, E3...) — consistent with how epics are referenced in roadmap.yaml timeline
   - `risk_level`: `low` | `medium` | `high` — overall technical risk
   - `technical_risks`: list of specific risks, each with `risk` (description), `severity` (`low` | `medium` | `high`), `affected_systems` (what's impacted), and `mitigation` (how to address)
   - `blockers`: hard blockers that must be resolved before implementation (empty list if none)
   - `sequencing_constraints`: technical reasons this feature must come before/after others (beyond product dependencies)
   - `architecture_impact`: systems, patterns, or infrastructure affected by this feature

   When profiles are available in product.yaml, calibrate risk assessment. If profiles section is absent, proceed without profile-informed calibration (backward compatible):
   - NFR Profile levels set the bar for infrastructure risk — high NFR values that aren't addressed by the feature scope raise the risk level
   - QP Profile levels identify quality gaps — features lacking testing or observability provisions are higher risk when QP targets demand them
   - PP Profile values contextualize complexity — high persona complexity (PP-3) or integration density (PP-5) increases implementation risk

5. **Identify cross-cutting concerns** — look for:
   - Open technical questions that affect multiple features
   - Shared infrastructure needs
   - Common risk patterns
   - Foundation features (features whose work benefits later features)
   - Profile-architecture misalignment: features that require infrastructure beyond what the profiles suggest may indicate scope creep or profile miscalibration

6. **Compute risk summary** — aggregate across all features:
   - `total_features`: count
   - `high_risk_count`: count of features with risk_level = high
   - `medium_risk_count`: count of features with risk_level = medium
   - `blocker_count`: total distinct blockers across all features
   - `foundation_epics`: list of E-IDs for epics that are foundational investments

7. **Validate (silently)** — verify before writing:
   - Every epic has a feasibility entry with a consistent E-ID
   - Every entry has all required fields (epic_ref, risk_level, technical_risks, blockers, sequencing_constraints, architecture_impact)
   - risk_level values are valid (`low` | `medium` | `high`)
   - technical_risks severity values are valid (`low` | `medium` | `high`)
   Do NOT output validation results — validate internally and fix issues.

8. **Write to STM** — write the feasibility assessment to `{artifact_base}/roadmap/feasibility.yaml` using the Write tool. The file must be valid YAML — no placeholders, all fields filled.

### Feasibility YAML Structure

```yaml
feasibility:
  slug: "{slug}"
  assessed_at: "{ISO-8601 datetime}"
  epics:
    - epic_ref: "E1"
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
  open_questions:
    - question: "{unresolved technical question}"
      affected_epics: ["E1", "E2"]
  summary:
    total_epics: {integer}
    high_risk_count: {integer}
    medium_risk_count: {integer}
    blocker_count: {integer}
    foundation_epics: ["E1"]
```

**Note:** The `epics` key uses `epic_ref` with E-IDs (E1, E2...) — aligned with epics.yaml and roadmap.yaml schemas.

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no verification output, no commentary, no prose before or after. The YAML block below is your entire response:

```yaml
feasibility:
  feasibility_yaml_path: "{artifact_base}/roadmap/feasibility.yaml"
  slug: "{slug}"
  epic_count: {integer}
  high_risk_count: {integer}
  blocker_count: {integer}
  open_questions_count: {integer}
```

The full feasibility data is written to `feasibility_yaml_path`. The `draft-roadmap` skill reads this file and folds the data into `roadmap.yaml`. Do NOT pass the full assessment through memory.

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
- NEVER change feature scope, priority, or bucket — report findings, don't prescribe changes
- NEVER implement anything — analysis only
- NEVER include business value assessments — your domain is technical feasibility
- NEVER pass full feasibility data through memory — ALWAYS write to STM and return the path
- ALWAYS use E-IDs (E1, E2) for epics — NEVER F-IDs (F1, F2) which are reserved for features.yaml
- ALWAYS read product.yaml from `product_yaml_path` using the Read tool — do NOT rely on memory
- ALWAYS assess every feature derived from the input — no omissions
- ALWAYS include at least one technical risk per feature (even low-risk features have considerations)
- ALWAYS fill the open_questions section — minimum 1 question if any exist, empty list only if genuinely none
- ALWAYS validate all fields are present before writing (silently)
- WHEN profiles are available in product.yaml, USE them to calibrate risk levels and identify gaps — do not ignore profile data
- ALWAYS return structured failure if product.yaml is missing or has no derivable features

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | design |
