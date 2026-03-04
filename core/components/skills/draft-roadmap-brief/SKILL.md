---
name: draft-roadmap-brief
description: Generate the human review brief — the gate artifact before full agentic roadmap generation
user-invocable: false
model: sonnet
allowed-tools: Read, Write
---

# draft-roadmap-brief

Model-invocable skill for generating the human review brief that gates full roadmap generation.

## Purpose

Compose a structured brief artifact for human review before agentic roadmap generation begins. This is NOT the roadmap — it is the gate artifact. A reviewer must be able to read and act on it in 30 minutes.

You DO produce the brief document. You do NOT generate the roadmap, validate epic feasibility, or decide what happens next.

## Input

Receive from agent:
- `scoped_epics` — (required) Output of scope-roadmap-epics skill
- `feasibility_flags` — (required) From tech-designer feasibility assessment
- `vision_path` — (required) Path to locked vision.md

## Process

1. **Read vision.md** at `vision_path` for product context (product name, slug, strategic goals, assumptions).

2. **Compose brief** using `templates/brief.html`. Populate all six sections:
   - **The Bet** — 1 paragraph core strategic thesis derived from vision strategic goals and epic set
   - **The Story** — 3–4 paragraphs of narrative causality explaining sequencing order
   - **Decisions** — two-part: (a) summary table of all epics, then (b) per-epic subsection with description, sequencing rationale, dependencies and what they unlock, and business-level risks
   - **What We're Not Doing** — 4–6 items deferred or excluded with one-line reasons
   - **The Asks** — minimum 3 specific, decision-forcing questions requiring reviewer judgment
   - **Key Assumptions** — 3–5 assumptions the roadmap depends on being true

3. **Run C-BRIEF-1 self-check:** Every element in the brief must be actionable by a reviewer within a 30-minute session. For each element, trace it to one of the six sections. Any element that cannot be acted on within that session is dropped. Record pass/fail and list violations.

4. **Run C-BRIEF-2 self-check:** Technical elements are only permitted if they change a roadmap decision (sequencing, priority, or timing). Permitted technical content: hard dependency between epics, foundation investment (multi-epic shared infrastructure), significant migration or breaking-change cost. Excluded: NFR targets, implementation details, specific technical choices, code quality concerns. Record pass/fail and list violations.

5. **Determine artifact path:** `.meridian/project/product/{slug}/brief-{timestamp}.html` where `slug` is derived from vision.md and `timestamp` is ISO-8601 date-time.

6. **Write artifact** at the determined path.

7. **Return output contract.**

## C-BRIEF-1 Constraint

Roadmap brief MUST be reviewable in 30 minutes. No element is included unless a reviewer can act on it within that session. Anything untraceable to one of the six sections is dropped.

## C-BRIEF-2 Constraint

Technical elements MUST only appear if they change a roadmap decision (sequencing, priority, or timing).

Permitted:
- Hard dependency between epics
- Foundation investment (multi-epic shared infrastructure)
- Significant migration or breaking-change cost

Excluded:
- NFR targets
- Implementation details
- Work packages
- Specific technical choices (language, framework, database)
- Code quality concerns

## Output

```yaml
brief:
  path: ".meridian/project/product/{slug}/brief-{timestamp}.html"
  epic_count: {integer}
  sections_present: [bet, story, decisions, not_doing, asks, assumptions]
  c_brief_1_pass: true|false
  c_brief_1_violations: ["{description of violation if any}"]
  c_brief_2_pass: true|false
  c_brief_2_violations: ["{description of violation if any}"]
```

**IMPORTANT**: This skill produces an artifact and returns metadata. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Reference

Load template from: `templates/brief.html`

## Constraints

- NEVER include NFR targets
- NEVER include implementation details
- NEVER include work packages
- NEVER include specific technical choices (language, framework, database)
- ALWAYS run C-BRIEF-1 and C-BRIEF-2 self-checks before returning output
- ALWAYS include The Asks section — minimum 3 specific, decision-forcing questions
- MAX 8 rows in the Decisions summary table
- Decisions per-epic subsections MUST cover: description (2–3 sentences, business language), why now (sequencing rationale), dependencies and what they unlock, business-level risks (C-BRIEF-2 compliant)
- Brief MUST be reviewable within 30 minutes — this is a ceiling, not a target to minimize. Depth is expected.

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
