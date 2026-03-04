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
- `epics_path` — (required) Path to the STM epics file written by scope-roadmap-epics, e.g. `.meridian/project/product/{slug}/epics.yaml`
- `feasibility_path` — (required) Path to the STM feasibility file written by tech-designer, e.g. `.meridian/project/product/{slug}/feasibility.yaml`
- `vision_path` — (required) Path to locked vision.md

## Process

1. **Read vision.md** at `vision_path` for product context (product name, slug, strategic goals, assumptions).

2. **Read `templates/brief.html`** from this skill's base directory. Your execution context contains a line "Base directory for this skill: {path}" — read the template at `{base_directory}/templates/brief.html` using the Read tool. This file is the literal output container — not a reference, not inspiration. Its full content becomes the starting point for the artifact. Do NOT generate new HTML or CSS from scratch. You MUST execute this Read tool call before generating any output.

3. **Read epics from STM** — using the Read tool, read the file at `epics_path`. This YAML file contains all scoped epics. You MUST read this file to know what epics to include — do NOT rely on memory.

4. **Read feasibility from STM** — using the Read tool, read the file at `feasibility_path`. This YAML file contains feasibility flags per epic. Cross-reference with epics to determine which epics have blockers, foundation investment requirements, or sequencing risks.

5. **Plan all content before writing** — for each epic in the epics file, draft all six card fields in memory: Intent (2–3 paragraphs), Constraints (in/out/must-not-break), Success Scenarios (min 2 given/when/then), Failure Conditions (2–4 items), Why Now, Dependencies. Do this for ALL epics before writing any HTML.

6. **Build the artifact** using the template HTML loaded in Step 2 as the base. Replace `{...}` placeholders with real content. For the Decisions section, emit **one `<tr>` per epic** in the summary table and **one `.epic-card` div per epic** — using the `.epic-card` div structure exactly as defined in the template. Emit this block once per epic. Do not collapse epics into prose. Do not invent new HTML elements or classes.

7. **Run C-BRIEF-1 self-check:** Every element must be actionable by a reviewer within 30 minutes. Record pass/fail and violations.

8. **Run C-BRIEF-2 self-check:** Technical elements only if they change a roadmap decision (sequencing, priority, or timing). Record pass/fail and violations.

9. **Determine artifact path:** `.meridian/project/product/{slug}/brief-{timestamp}.html` where `slug` is from vision.md and `timestamp` is ISO-8601 date-time.

10. **Write artifact** at the determined path using the Write tool.

11. **Return output contract.**

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
- NEVER generate custom HTML or CSS — the template HTML skeleton is the output container; only placeholder `{}` content is replaced
- NEVER collapse epic content into narrative prose only — every epic MUST have its own `.epic-card` div in the Decisions section
- ALWAYS run C-BRIEF-1 and C-BRIEF-2 self-checks before returning output
- ALWAYS include The Asks section — minimum 3 specific, decision-forcing questions
- ALWAYS produce one `.epic-card` per epic — no exceptions, no omissions
- MAX 8 rows in the Decisions summary table
- Decisions per-epic subsections MUST cover all six fields in order: Intent (2–3 paragraphs: problem today / outcome after / strategic connection), Constraints (in scope / out of scope / must not break), Success Scenarios (minimum 2, given/when/then, binary testable), Failure Conditions (observable results that signal the epic failed, 2–4 items), Why Now (sequencing rationale), Dependencies & what it unlocks
- Brief MUST be reviewable within 30 minutes — this is a ceiling, not a target to minimize. Depth is expected.
- templates/brief.html is the contract — preserve its structure exactly

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
