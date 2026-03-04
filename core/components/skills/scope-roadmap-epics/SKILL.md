---
name: scope-roadmap-epics
description: Extract epics from a locked product vision and scope them into roadmap time buckets with priorities and dependencies
user-invocable: false
model: sonnet
allowed-tools: Read
category: strategy
version: 1.0.0
---

# scope-roadmap-epics

Model-invocable skill for extracting and scoping epics from a locked product vision.

## Purpose

Read a locked vision.md and derive 3–6 epics linked to Strategic Goals. Assign each epic a roadmap time bucket, priority, effort estimate, and dependency relationships. Returns a structured epics list ready for roadmap planning.

You DO derive and scope the epics. You do NOT create GitHub issues, make implementation decisions, or choose technical approaches.

## Input

Receive from agent:
- `vision_path` — (required) Full path to vision.md
- `time_horizon` — (optional, default: "12 months") Planning window for bucket assignment

## Pre-conditions

1. **Read vision.md** at `vision_path`. If not found, return structured failure: artifact not found.
2. **Verify LOCKED status:** If status is not LOCKED, return structured failure:
   ```json
   { "error": "vision_not_locked", "message": "Vision is not LOCKED — run /discover-product --phase lock first" }
   ```

## Process

1. **Extract Strategic Goals** from the vision.md Strategic Goals section.

2. **Derive epics:** Identify 3–6 epics, each explicitly linked to one named Strategic Goal. If fewer than 3 epics are identifiable, return structured failure: `{ "error": "insufficient_epics", "message": "Fewer than 3 distinct epics identifiable from vision — vision may need more detail" }`.

3. **Assign time bucket** relative to `time_horizon`:
   - `near` — 0–3 months (foundational, unblocked work)
   - `mid` — 3–6 months (builds on near-bucket epics)
   - `long` — 6–12 months (dependent on mid-bucket completion or lower-priority)

4. **Derive priority:**
   - `P1` — product cannot function without this epic
   - `P2` — delivers significant user or business value
   - `P3` — nice-to-have; adds polish or reach

5. **Estimate effort:**
   - `S` — less than 1 month
   - `M` — 1–2 months
   - `L` — 2–4 months
   - `XL` — more than 4 months

6. **Identify hard dependencies:** For each epic, list the IDs of epics that must complete before it can start. Use `[]` if none.

7. **Flag foundation investment:** Mark `foundation_investment: true` for epics that are shared infrastructure enabling multiple other epics. These are platform bets that unlock downstream work.

## Output

```yaml
scoped_epics:
  slug: "{product slug from vision}"
  vision_path: "{path}"
  time_horizon: "12 months"
  epics:
    - id: "E1"
      name: "{epic name}"
      strategic_goal: "{linked goal text}"
      description: "{2–3 sentences — what this epic delivers}"
      bucket: "near|mid|long"
      priority: "P1|P2|P3"
      effort: "S|M|L|XL"
      depends_on: ["{epic id or null}"]
      foundation_investment: true|false
      github_issue_ref: "TBD"
```

**IMPORTANT**: This skill produces a scoped epics artifact and returns structured data. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER create GitHub issues
- NEVER include implementation details — no code, architecture choices, or technical stack decisions
- NEVER include NFR targets unless they generate a distinct sequenceable epic
- ALWAYS link each epic to a named strategic goal from the vision
- ALWAYS include `foundation_investment` boolean on every epic — used by draft-roadmap-brief to flag platform bets
- ALWAYS include `effort` and `depends_on` fields on every epic — both are required
- ALWAYS return structured failure if vision is not LOCKED
- ALWAYS return structured failure if fewer than 3 epics are identifiable
- Minimum 3 epics, maximum 6 epics

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
