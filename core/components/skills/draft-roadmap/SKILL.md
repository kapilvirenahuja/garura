---
name: draft-roadmap
description: Generate the full agentic roadmap.md — produced ONLY after the brief is Tether-approved
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-roadmap

Model-invocable skill for generating the full agentic roadmap artifact after brief approval.

## Purpose

Generate the full agentic roadmap.md — produced ONLY after the brief is Tether-approved. This is the machine-readable artifact consumed by downstream recipes (manage-backlog, start-feature-planning, plan-architecture).

You DO produce the roadmap document. You do NOT approve the brief, validate feasibility, or decide what happens next.

## Input

Receive from agent:
- `scoped_epics` — (required) Output of scope-roadmap-epics skill
- `approved_brief_path` — (required) Path to the Tether-approved brief artifact
- `feasibility_flags` — (required) From tech-designer feasibility assessment
- `artifact_base` — (required) Base path for output, e.g., `.meridian/project/product/`

## Pre-conditions

Verify brief is approved — check for Tether record in checkpoint. If not approved, return structured failure:

```json
{ "error": "brief_not_approved", "message": "Roadmap brief has not been Tether-approved — run DRAFT phase feedback loop first" }
```

## Process

1. **Verify brief approval** — Confirm Tether record exists for the brief at `approved_brief_path`. Halt immediately with structured failure if not approved.

2. **Read approved_brief_path** to extract:
   - The Bet → roadmap intent
   - The Story → roadmap summary
   - What We're Not Doing → preserved verbatim
   - Key Assumptions → preserved verbatim
   - Decisions table → epic metadata (horizon, priority, effort, dependencies)

3. **Compose roadmap** using `templates/roadmap.md`. Populate:
   - Frontmatter: intent (from The Bet), slug, horizon, approved_brief path, created date
   - Roadmap Summary: The Story preserved verbatim
   - What Is Not In This Roadmap: What We're Not Doing preserved verbatim
   - Assumptions: Key Assumptions preserved verbatim
   - Epic Index table: one row per epic from Decisions table, Issue Ref = TBD
   - Per-epic sections: fill Intent, Constraints, Acceptance Scenarios, Failure Conditions from scoped_epics; write Technical Context and Blast Radius as EMPTY placeholders with `<!-- status: empty -->` markers

4. **Write to** `{artifact_base}{slug}/roadmap.md`.

5. **Return output contract.**

## Progressive Enrichment Model

This skill fills ONLY the IDD core per epic (intent, constraints, acceptance scenarios, failure conditions) plus metadata. Technical Context and Blast Radius sections are written as EMPTY placeholders with machine-readable status markers. Later recipes (`/plan-architecture`, `/analyze-epic`) fill those sections. This is intentional — roadmap planning is not architecture planning.

## Output

```yaml
roadmap:
  path: "{full path}"
  slug: "{slug}"
  epic_count: {integer}
  epics_completeness:
    - id: "E1"
      intent: filled
      constraints: filled
      scenarios: filled
      failures: filled
      technical: empty
      blast_radius: empty
  milestones:
    near: [{id, name, priority, effort}]
    mid: [{id, name, priority, effort}]
    long: [{id, name, priority, effort}]
  issue_refs: [{epic_id: "E1", ref: "TBD"}]
  status: "DRAFT"
  approved_brief: "{path}"
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load template from: `templates/roadmap.md`

## Constraints

- NEVER generate without a Tether-approved brief
- ALWAYS include `approved_brief` in roadmap.md frontmatter
- ALWAYS write Technical Context and Blast Radius sections as empty placeholders with `<!-- status: empty -->` markers — NEVER attempt to fill them at roadmap planning time
- Issue Ref column MUST exist in Epic Index table (TBD values permitted)
- Acceptance Scenarios MUST be given/when/then form — never vague criteria like "works correctly"
- `user-invocable: false`

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
