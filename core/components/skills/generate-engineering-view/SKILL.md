---
name: generate-engineering-view
description: Generate an engineering-facing roadmap view from an approved roadmap.md
user-invocable: false
version: 1.0.0
category: strategy
model: sonnet
allowed-tools: Read, Write
---

# generate-engineering-view

Model-invocable skill for generating an engineering-only roadmap view from an approved roadmap.

## Purpose

Transform an approved roadmap.md into an engineering-facing artifact. The output contains zero business context — only technical breakdown, complexity, risk, dependencies, and open questions. Audience is engineering only.

You DO produce the engineering view. You do NOT validate feasibility or make priority decisions.

## Input

Receive from agent:
- `roadmap_path` — (required) Path to the approved roadmap.md
- `scoped_epics` — (required) Output of scope-roadmap-epics skill
- `feasibility_flags` — (required) Feasibility assessment from tech-designer, including technical risks and open questions
- `output_base` — (required) Base path for output, e.g., `.meridian/project/product/`

## Process

1. **Read roadmap:** Read `roadmap_path` to extract the full epic list, inter-epic dependencies, and priorities.

2. **Read feasibility flags:** Read `feasibility_flags` to extract technical risks, severity levels, affected epics, and open technical questions.

3. **Determine output path:** `{output_base}{slug}/roadmap-engineering.md` where `slug` is derived from the roadmap artifact's slug.

4. **Compose engineering view:** Using `templates/engineering-view.md`. Populate each section:
   - Epic Breakdown: from `scoped_epics` — map work packages, complexity, risk per epic
   - Dependency Sequence: from roadmap dependency graph — describe blocked/blocking relationships
   - Architecture Impact: from `feasibility_flags` — list affected systems and patterns per epic
   - Technical Risks: from `feasibility_flags` — severity, affected epics, mitigation notes
   - Open Questions: from `feasibility_flags.open_questions` — all unresolved technical questions

5. **Write artifact:** Write roadmap-engineering.md to the output path.

6. **Return output.**

## Output

```yaml
engineering_view:
  path: "{full path to roadmap-engineering.md}"
  slug: "{slug}"
  epic_count: {integer}
  high_risk_count: {integer}
  open_questions_count: {integer}
  issue_traceability_complete: true|false
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load template from: `templates/engineering-view.md`

## Constraints

- NEVER include business value statements, revenue projections, market context, user personas, or customer problem descriptions
- NEVER duplicate product view content — this view contains only technical substance
- ALWAYS populate the Issue Ref column for every epic (use TBD if not yet assigned)
- ALWAYS include all five sections from the template (may be sparse but must be present)
- `user-invocable: false` — this skill is invoked by agents only
- Audience is engineering only — all language must be technical

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
