---
name: draft-roadmap-brief
description: Render the human review brief from scoped IDD epics — pure template renderer, no content generation
user-invocable: false
model: sonnet
allowed-tools: Read, Write
version: 2.0.0
---

# draft-roadmap-brief

Model-invocable skill for rendering the human review brief that gates full roadmap generation.

## Purpose

Render a structured brief artifact from scoped epics that already contain full IDD content (intent, constraints, success scenarios, failure conditions). This skill does NOT generate epic content — it reads it from the STM file and places it into the HTML template.

You DO render the brief document. You do NOT generate epic content, invent IDD fields, validate epic feasibility, or decide what happens next.

## Input

Receive from agent:
- `epics_path` — (required) Path to the STM epics file written by scope-roadmap-epics, e.g. `.meridian/project/product/{slug}/epics.yaml`
- `feasibility_path` — (required) Path to the STM feasibility file written by tech-designer, e.g. `.meridian/project/product/{slug}/feasibility.yaml`
- `vision_path` — (required) Path to locked vision.md

## Process

1. **Read vision.md** at `vision_path` — extract product name, slug, strategic goals, and assumptions.

2. **Read the brief template from LTM** — the intent file at `intent_path` contains constraint `C2` with a `template_ref` field (e.g., `standards/templates/roadmap-brief.html`). Read the template from `~/.meridian/core/memory/{template_ref}` using the Read tool. This file contains all CSS and static structure. If the agent passes a specific `template_path`, use that instead.

3. **Read epics from STM** — read the file at `epics_path` using the Read tool. Each epic contains: id, name, strategic_goal, description, bucket, priority, effort, depends_on, foundation_investment, intent (p1/p2/p3), constraints (in_scope/out_of_scope/must_not_break), success_scenarios, failure_conditions. You MUST read this file — do NOT rely on memory or invent content.

4. **Read feasibility from STM** — read the file at `feasibility_path` using the Read tool. Use feasibility flags to inform the Why Now section of each epic card.

5. **Build `{EPIC_TABLE_ROWS}`** — for each epic, generate one `<tr>`:
   ```html
   <tr>
     <td><strong>{id}: {name}</strong></td>
     <td><span class="badge badge-{bucket}">{Bucket}</span></td>
     <td><span class="badge badge-{priority_lower}">{priority}</span></td>
     <td>{effort}</td>
     <td>{depends_on names or "None"}</td>
     <td>{one-line rationale from description}</td>
   </tr>
   ```

6. **Build `{EPIC_TABS}` and `{EPIC_TAB_PANELS}`** — for each epic:
   - **Tab button**: `<button data-epic="epic-{id}" class="{active if first}">{id}: {short name}</button>`
   - **Tab panel**: `<div class="epic-tab-panel {active if first}" id="epic-{id}">` containing one `.epic-card` div with 6 fields:
     - **Intent**: 3 `<p>` tags using `intent.p1`, `intent.p2`, `intent.p3` directly from the epic
     - **Constraints**: 3 `<li>` items using `constraints.in_scope`, `constraints.out_of_scope`, `constraints.must_not_break` directly from the epic
     - **Success scenarios**: `<li>` items using each `success_scenarios` entry directly from the epic
     - **Failure conditions**: `<li>` items using each `failure_conditions` entry directly from the epic
     - **Why now**: 1 `<p>` — sequencing rationale derived from `bucket`, `depends_on`, and feasibility data
     - **Dependencies & what it unlocks**: 2 `<li>` items — Requires (look up names from `depends_on`) / Unlocks (reverse lookup: which epics list this one in their `depends_on`)

   Include `<span class="foundation-flag">Foundation</span>` only when `foundation_investment == true`.

7. **Build `{timeline_content}`** — group epics by phase:
   - **MVP (Near horizon)**: epics with `bucket: near` — render as `.timeline-phase` with `.timeline-epic` items
   - **MVP-Beyond (Mid horizon)**: epics with `bucket: mid`
   - **Future (Long horizon)**: epics with `bucket: long`
   Each phase uses a `.timeline-phase` container with a `.timeline-phase-label` and `.timeline-epic` items showing epic name, priority badge, and effort.

8. **Build remaining sections** — replace all other `{...}` placeholders in the template:
   - `{bet_paragraph}`: one paragraph — the core strategic thesis
   - `{story_paragraphs}`: 3–4 `<p>` tags narrating the epic sequence
   - `{blocker_items}`: 1–4 `<li>` tags with items that must be resolved before proceeding
   - `{assumptions_items}`: 3–5 `<li>` tags with assumptions this roadmap depends on

9. **Verify before writing** — confirm:
   - `{EPIC_TABLE_ROWS}` has exactly one `<tr>` per epic
   - `{EPIC_TABS}` has exactly one button per epic, `{EPIC_TAB_PANELS}` has exactly one panel per epic with all 6 fields
   - `{timeline_content}` has one `.timeline-phase` per occupied horizon
   - Intent/Constraints/Scenarios/Failure conditions are taken from the epic data, not invented
   - No `{...}` placeholders remain in the output

10. **Run C-BRIEF-1 self-check:** Every element must be actionable by a reviewer within 30 minutes. Record pass/fail and violations.

11. **Run C-BRIEF-2 self-check:** Technical elements only if they change a roadmap decision (sequencing, priority, or timing). Record pass/fail and violations.

12. **Determine artifact path:** `.meridian/project/product/{slug}/brief-{timestamp}.html` where `slug` is from vision.md and `timestamp` is ISO-8601 date-time.

13. **Write artifact** at the determined path using the Write tool.

14. **Return output contract.**

## C-BRIEF-1 Constraint

Roadmap brief MUST be reviewable in 30 minutes. No element is included unless a reviewer can act on it within that session.

## C-BRIEF-2 Constraint

Technical elements MUST only appear if they change a roadmap decision (sequencing, priority, or timing).

Permitted: hard dependency between epics, foundation investment, significant migration cost.
Excluded: NFR targets, implementation details, work packages, specific technical choices, code quality concerns.

## Output

Your response MUST be ONLY this YAML block with values filled in. No validation checklists, no C-BRIEF self-check output, no verification prose, no commentary before or after. The YAML block below is your entire response:

```yaml
brief:
  path: ".meridian/project/product/{slug}/brief-{timestamp}.html"
  epic_count: {integer}
  sections_present: [exec_summary, decisions, epics, timeline, assumptions, blockers, feedback]
  c_brief_1_pass: true|false
  c_brief_1_violations: ["{description of violation if any}"]
  c_brief_2_pass: true|false
  c_brief_2_violations: ["{description of violation if any}"]
```

## Reference

Load template from LTM: `~/.meridian/core/memory/standards/templates/roadmap-brief.html` (default, overridable via intent constraint C2.template_ref)

## Constraints

- NEVER generate epic content — Intent, Constraints, Success Scenarios, and Failure Conditions come FROM the epics file, not from this skill
- NEVER include NFR targets, implementation details, work packages, or specific technical choices
- NEVER use custom CSS classes — use only the classes defined in `templates/brief.html`
- ALWAYS read the brief template from LTM (via intent constraint C2.template_ref) using the Read tool — do NOT generate HTML from scratch
- ALWAYS read epics from `epics_path` using the Read tool — do NOT rely on memory
- ALWAYS produce one `.epic-card` per epic — no exceptions, no omissions
- ALWAYS produce one `<tr>` per epic in the summary table — no exceptions, no omissions
- ALWAYS run C-BRIEF-1 and C-BRIEF-2 self-checks before returning output
- ALWAYS include Blockers section — minimum 1 blocker that must be resolved before proceeding
- Each `.epic-card` MUST have all six fields in order: Intent, Constraints, Success scenarios, Failure conditions, Why now, Dependencies & what it unlocks
- ALWAYS build timeline_content grouping epics by horizon phase (MVP/near, MVP-Beyond/mid, Future/long)
- ALWAYS build EPIC_TABS and EPIC_TAB_PANELS — one tab button and one panel per epic
- Brief MUST be reviewable within 30 minutes — this is a ceiling, not a target to minimize

## Version

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Category | strategy |
