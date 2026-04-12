# Debt Register and Governance Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any team managing ongoing feature development alongside accumulated technical debt
**When this does NOT apply:** Greenfield projects in their first sprint with no shipped production code
**Search patterns:** debt register, TODO, FIXME, HACK, WORKAROUND, TEMPORARY, debt tracking, sprint allocation, debt velocity, debt review
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

A debt register is the operational tool for managing tech debt. TODO comments are not a register. Good governance means each debt item is owned, time-bound, and reviewed.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DEBT-09 | Debt register exists as a structured tracking artifact (issue tracker, spreadsheet, ADR section) | L1 | Verify register exists outside codebase comments; minimum fields: title, owner, creation date | Issue tracker, ADR |
| DEBT-10 | Each debt item has an owner (team member or team name, not "TBD") | L2 | Audit register: flag items with no owner or "TBD" as ungoverned debt | Debt register audit |
| DEBT-11 | Each debt item has a repayment timeline (target quarter or milestone) | L2 | Flag items with no timeline or timeline > 12 months with no review note | Debt register audit |
| DEBT-12 | Each debt item has a blast radius assessment (what breaks if this is never fixed) | L3 | Verify blast radius field populated; "unknown" is acceptable only if investigation task exists | Debt register audit |
| DEBT-13 | Debt decay detection: items marked "temporary" or with initial timeline now > 6 months old are flagged | L3 | Query register for items created > 180 days ago with status still "open" and no extension note | Register query, script |
| DEBT-14 | Debt-to-feature ratio tracked per sprint or milestone | L4 | Check sprint planning records for explicit debt allocation (e.g., ≥10% capacity reserved for debt) | Jira/Linear reports |
| DEBT-15 | Repayment velocity tracked: debts resolved per quarter | L4 | Count items transitioned to "resolved" per quarter; verify trend visible in team dashboard | Issue tracker metrics |
| DEBT-16 | Debt review cadence: register reviewed at minimum quarterly | L4 | Check meeting notes or calendar for recurring debt review; all stale items triaged | Meeting notes, calendar |

### Grep Patterns for Debt Discovery

Use these patterns to find unregistered debt in the codebase. Each match should have a corresponding register entry:

```
grep -rn "TODO\|FIXME\|HACK\|WORKAROUND\|TEMPORARY\|TEMP:\|XXX" --include="*.{js,ts,py,go,rb,java}" .
```

Flag: any match older than 90 days (check `git log -p`) with no corresponding issue tracker reference in the comment.

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| TODO comments as the debt register | Hundreds of TODOs in code with no tracker entries; no owner, no date, no blast radius | Debt invisible in planning; items never addressed; age unknowable without git archaeology |
| Debt register with 0% velocity | Items created regularly but none resolved; register grows unbounded | Debt accumulates; register becomes a hall of shame with no decision power |
| No capacity allocation for debt | Sprint planning never allocates time for debt; debt slips every sprint | Feature velocity appears high; system brittleness compounds silently |
| Blast radius always marked "low" | Risk assessment filled in but all items trivially downgraded | Debt prioritization broken; high-blast items indistinguishable from cosmetic ones |

## Why It Matters

An unmanaged debt register is evidence that debt is being created faster than it is resolved. Teams without governance discover this when a "simple feature" takes 3x estimated time due to accumulated shortcuts.

## Applicability Boundaries

**In scope:** All production services with active feature development; any team planning work in sprints or milestones
**Out of scope:** Strictly maintenance-mode services with no planned changes; archived repositories

## Rationale

Governance converts debt from an invisible tax into a managed liability. Without register + velocity + review cadence, debt is unmeasurable and therefore unmanageable.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
