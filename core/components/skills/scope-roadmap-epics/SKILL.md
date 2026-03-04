---
name: scope-roadmap-epics
description: Extract epics from a locked product vision and scope them into roadmap time buckets with priorities and dependencies
user-invocable: false
model: sonnet
allowed-tools: Read, Write
category: strategy
version: 1.1.0
---

# scope-roadmap-epics

Model-invocable skill for extracting and scoping epics from a locked product vision.

## Purpose

Read a locked vision.md and derive 3–6 epics linked to Strategic Goals. Assign each epic a roadmap time bucket, priority, effort estimate, and dependency relationships. Returns a structured epics list ready for roadmap planning.

You DO derive and scope the epics. You do NOT create GitHub issues, make implementation decisions, or choose technical approaches.

## Input

Receive from agent:
- `vision_path` — (required) Full path to vision.md
- `artifact_base` — (required) Base path for STM artifacts, e.g. `.meridian/project/product/`
- `time_horizon` — (optional, default: "12 months") Planning window for bucket assignment

## Pre-conditions

1. **Read vision.md** at `vision_path`. If not found, return structured failure: artifact not found.
2. **Verify LOCKED status:** If status is not LOCKED, return structured failure:
   ```json
   { "error": "vision_not_locked", "message": "Vision is not LOCKED — run /discover-product --phase lock first" }
   ```

## Process

1. **Read vision.md** at `vision_path`.

2. **Read the epics template** from this skill's base directory. Your execution context contains a line "Base directory for this skill: {path}" — read the template at `{base_directory}/templates/epics.yaml` using the Read tool. This gives you the canonical structure for the epics artifact.

3. **Extract Strategic Goals** from the vision.md Strategic Goals section.

4. **Derive epics:** Identify 3–6 epics, each explicitly linked to one named Strategic Goal. If fewer than 3 epics are identifiable, return structured failure: `{ "error": "insufficient_epics", "message": "Fewer than 3 distinct epics identifiable from vision — vision may need more detail" }`.

5. **Assign time bucket** relative to `time_horizon`:
   - `near` — 0–3 months (foundational, unblocked work)
   - `mid` — 3–6 months (builds on near-bucket epics)
   - `long` — 6–12 months (dependent on mid-bucket completion or lower-priority)

6. **Derive priority:**
   - `P1` — product cannot function without this epic
   - `P2` — delivers significant user or business value
   - `P3` — nice-to-have; adds polish or reach

7. **Estimate effort:**
   - `S` — less than 1 month
   - `M` — 1–2 months
   - `L` — 2–4 months
   - `XL` — more than 4 months

8. **Identify hard dependencies:** For each epic, list the IDs of epics that must complete before it can start. Use `[]` if none.

9. **Flag foundation investment:** Mark `foundation_investment: true` for epics that are shared infrastructure enabling multiple other epics. These are platform bets that unlock downstream work.

10. **Write to STM:** Using the template structure from Step 2, write the scoped epics to `{artifact_base}/{slug}/epics.yaml` using the Write tool. Derive `slug` from the vision frontmatter. The file must be a valid YAML document — no placeholders, all fields filled.

## Output

```yaml
scoped_epics:
  epics_path: "{artifact_base}/{slug}/epics.yaml"
  slug: "{product slug from vision}"
  epic_count: {integer}
```

The full epics data is written to `epics_path`. Downstream skills and agents MUST read from that file — do NOT pass the full epic list through memory.

**IMPORTANT**: This skill produces a scoped epics artifact written to STM and returns the path. The calling agent receives this output and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

- NEVER create GitHub issues
- NEVER include implementation details — no code, architecture choices, or technical stack decisions
- NEVER include NFR targets unless they generate a distinct sequenceable epic
- NEVER pass full epic data through memory — ALWAYS write to STM and return the path
- ALWAYS link each epic to a named strategic goal from the vision
- ALWAYS include `foundation_investment` boolean on every epic — used by draft-roadmap-brief to flag platform bets
- ALWAYS include `effort` and `depends_on` fields on every epic — both are required
- ALWAYS return structured failure if vision is not LOCKED
- ALWAYS return structured failure if fewer than 3 epics are identifiable
- ALWAYS write the epics file to `{artifact_base}/{slug}/epics.yaml` before returning output
- Minimum 3 epics, maximum 6 epics

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | strategy |
