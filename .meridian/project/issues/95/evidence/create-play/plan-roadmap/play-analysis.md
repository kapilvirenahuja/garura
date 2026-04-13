# Play Analysis: plan-roadmap (Rebake #2)

**Date:** 2026-03-06
**Trigger:** User feedback from test run against Chronos vision

## User-Requested Changes

1. **Tab-based layout** — Replace scrollable sections with tabs: Exec Summary, Decisions, Epics (sub-tabs per epic), Assumptions, Timeline
2. **New section: Timeline** — MVP, MVP-beyond phases. Currently epics have bucket (near/mid/long) but no explicit phase-based timeline view
3. **Remove: "What We're Not Doing"** — Epic constraints already define scope boundaries; standalone section is redundant
4. **Rename: "The Asks" → "Blockers"** — Decision-forcing items reframed as blockers that must be resolved before proceeding
5. **Feedback mechanism** — Brief opens in browser but user has no way to provide inline feedback; must switch to terminal. Need interactive feedback capability in the HTML brief itself
6. **Update all templates** — HTML template, skill, intent constraints, and evals must all reflect new structure

## Impact Analysis

### Template (roadmap-brief.html)
- Complete restructure: sections → tabs with JS tab switching
- Remove: `#not-doing` section, `.not-doing-list` CSS
- Rename: `#asks` → `#blockers`, `.asks-list` → `.blockers-list`
- Add: `#timeline` section with MVP phase grouping
- Add: Tab navigation UI, CSS, and JavaScript
- Add: Feedback mechanism (textarea/comment fields per section or global feedback form)

### Intent (intent.yaml)
- C2: Update template structure description — tabs instead of linear sections
- C3: Reviewability constraint — eval criteria change: "Blockers >= 1" instead of "Asks >= 3"
- Potential new constraint: Interactive feedback mechanism in brief

### Skill (draft-roadmap-brief/SKILL.md)
- Update sections_present output: remove not_doing, rename asks→blockers, add timeline
- Update process steps: remove not_doing_items, rename asks_items→blocker_items, add timeline building
- Update constraints: "ALWAYS include Blockers" instead of "ALWAYS include The Asks"
- Add: Timeline section building logic (group epics by MVP phase)
- Add: Feedback form/textarea rendering

### Play (plan-roadmap/SKILL.md)
- SE-11: Update section list — remove not_doing/asks, add blockers/timeline
- SCE-4: Update stakeholder scenario — "Blockers" instead of "Asks"

### Evals (evals.yaml)
- SE-11: sections check changes
- SCE-4: Blockers section validation

## Previous Rebake Status (for reference)

The first rebake (earlier in this session) resolved:
- Intent upgraded from 4 sparse constraints to 9 (C1-C9), 4 bare strings → 7 FCs (F1-F7), 4 → 5 scenarios (S1-S5)
- SKILL.md fully recompiled with all required sections
- 11 step evals + 5 scenario evals
- All 3 agents pass P1-P10 audit
- Intent hash: sha256:c5831514aea17b1a1f676202e2060f9fde2a10f7ddc5519236af54f4f9be32e5

This rebake #2 is targeted: brief template structure changes only. Core play workflow, agents, and most evals are unchanged.
