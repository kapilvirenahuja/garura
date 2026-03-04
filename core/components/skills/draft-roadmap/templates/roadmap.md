---
intent: "{The Bet from approved brief — the core strategic thesis}"
status: DRAFT
slug: "{product slug}"
horizon: "{time horizon}"
approved_brief: "{brief path}"
created: "{date}"
---

## Roadmap Summary
{The Story from the approved brief — preserved verbatim. 3–4 paragraphs of narrative causality.}

## What Is Not In This Roadmap
{What We're Not Doing list from the approved brief — preserved verbatim.}

## Assumptions
{Key Assumptions from the approved brief — preserved verbatim.}

## Epic Index
| ID | Name | Strategic Goal | P | Horizon | Depends On | Status |
|----|------|---------------|---|---------|------------|--------|
| E1 | {name} | {goal} | P1 | Near | none | planned |

---

## E{N} — {Epic Name}
**Strategic Goal:** {linked goal} | **{P1\|P2\|P3}** | **{Near\|Mid\|Long}**
<!-- epic-status: planned | in-progress | delivered | deferred -->
<!-- completeness: intent=filled, constraints=filled, scenarios=filled, failures=filled, technical=empty, blast-radius=empty -->

### Intent
{2–3 paragraphs. What the user gets that they don't have today. Outcome-focused, not a feature list. This IS the IDD intent for this epic — written as the change in the user's world, not the system's capabilities.}

### Constraints
- In scope: {specific deliverables this epic owns}
- Out of scope: {explicit deferrals — what is NOT this epic's problem}
- Must not break: {existing capabilities that must remain intact}

### Acceptance Scenarios
- Given {precondition}, when {action}, then {outcome} — binary testable
<!-- Each scenario must be definitively pass or fail — no vague outcomes like "works correctly" or "performs well" -->

### Failure Conditions
- {What observable result means this epic has failed to achieve its intent}

### Technical Context
<!-- status: empty | fill-with: /plan-architecture -->
- Systems touched: TBD
- Architectural direction: TBD
- Hard dependencies: TBD

### Blast Radius
<!-- status: empty | fill-with: /analyze-epic -->
- Scope: TBD (narrow | moderate | wide)
- Affected packages: TBD
- Interdependency surface: TBD
