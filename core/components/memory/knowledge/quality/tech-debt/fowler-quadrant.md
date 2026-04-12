# Fowler Tech Debt Quadrant
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any codebase where debt decisions are being made, recorded, or reviewed
**When this does NOT apply:** Greenfield spikes or throwaway prototypes that will never enter production
**Search patterns:** tech debt, deliberate, inadvertent, reckless, prudent, debt quadrant, design shortcut, debt classification
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Martin Fowler's tech debt quadrant provides a classification framework that distinguishes acceptable debt from harmful debt. Not all debt is equal — the quadrant makes that distinction explicit and auditable.

### The Quadrant

|  | Reckless | Prudent |
|--|----------|---------|
| **Deliberate** | "We don't have time for design" — debt taken without acknowledgment; no record, no plan | "We must ship now and deal with consequences" — debt taken consciously, recorded with timeline and blast radius |
| **Inadvertent** | "What's layering?" — debt created through ignorance; team did not know better practice existed | "Now we know how we should have done it" — debt discovered retrospectively when better approach is learned |

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DEBT-01 | All debt decisions are explicitly recorded (not only as TODO comments in code) | L2 | Check for debt items in issue tracker, ADR, or debt register with context; TODOs alone fail this check | Issue tracker, ADR |
| DEBT-02 | Each recorded debt item can be classified into one of the four quadrant cells | L3 | For each debt item in register: deliberate or inadvertent? reckless or prudent? Both axes must be answerable | Debt register review |
| DEBT-03 | Deliberate-reckless debt proportion is tracked and trending down | L3 | Count debt items with no timeline, no owner, no blast radius — these are reckless; verify count is decreasing | Debt register metrics |
| DEBT-04 | Deliberate-prudent debt has a recorded repayment timeline at time of acceptance | L2 | Each deliberate-prudent debt item must have: target quarter or milestone for repayment | Debt register |
| DEBT-05 | Inadvertent debts discovered during development are captured immediately | L3 | Verify team practice: when "now we know better" is said, a debt item is created in same sprint | Team process, retro notes |
| DEBT-06 | Classification heuristic applied consistently: quadrant assignment reviewed in debt sessions | L4 | Verify debt triage meetings include quadrant classification step; at least quarterly | Meeting notes, retro |
| DEBT-07 | No deliberate-reckless debt older than 90 days exists without an escalation record | L4 | Query debt register for items classified reckless with creation date > 90 days and no escalation note | Debt register query |
| DEBT-08 | Team can articulate the quadrant for any top-5 debt item on request | L5 | In architecture review: select 5 debt items; team must state quadrant and rationale for each | Architecture review |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| All debt labelled "technical debt" with no quadrant | Classification never applied; all debt treated as equivalent | Reckless debt indistinguishable from prudent; no prioritization signal |
| Deliberate-reckless debt accepted silently | Shortcuts taken under pressure with no record, no owner, no timeline | Debt compounds invisibly; discovered only when system breaks |
| Inadvertent debt discovered but not captured | Team says "we should refactor this" verbally, no item created | Knowledge lives only in one engineer's head; lost on attrition |
| Quadrant assigned by gut feel with no criteria | No heuristic documented; classification inconsistent across reviewers | Debt register data unreliable; classification disputes slow reviews |

## Why It Matters

Undifferentiated "tech debt" is unactionable. The quadrant makes the difference between a team that knowingly traded design quality for speed (prudent) and one that simply didn't care (reckless). Only classified debt can be managed.

## Applicability Boundaries

**In scope:** All production codebases with ongoing feature development; any team making trade-off decisions under time pressure
**Out of scope:** One-time migration tools, scripts retired after use, experimental branches that are never merged

## Rationale

The Fowler quadrant is organizational knowledge because it defines how this team categorizes and communicates about debt. Without a shared framework, debt conversations are subjective and unresolvable.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
