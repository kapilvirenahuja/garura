# Auto-approval — prepare expectation (ICE migration, #376)

**Play:** prepare
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All thirteen success scenarios (S1 Product Owner,
   S2/S5/S12 Technical Architect, S3/S6 Engineering Lead, S4/S11 Quality Lead,
   S7/S10 Implementation Agent, S8 Technical Architect, S9 Engineer, S13 Developer) are
   carried forward verbatim from the legacy `scenarios:` block in intent.yaml; only the
   `measure` field was added (observable + binary), per the generate-before-strip rule.
   No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1
   through F29→REC29. Twenty-nine failure conditions, twenty-nine recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **Human (8):** REC1 (F1 — locked epic carries tech names; an upstream artifact prepare
     cannot edit), REC2 (F2 — tech.yaml contradicts arch; which choice is right is an
     architectural decision), REC3 (F3 — re-slicing a layer-only slice into an end-to-end
     path is a planning judgment), REC9 (F9 — decomposing the epic into 2+ slices is a
     planning judgment), REC10 (F10 — skipped human checkpoints can only be obtained from a
     human), REC11 (F11 — naming what codebase understanding missed needs human system
     knowledge the builder lacks), REC14 (F14 — the missing item is the user's resolution),
     REC24 (F24 — missing upstream artifacts come from upstream plays prepare cannot author).
   - **Autonomous (21):** REC4–REC8, REC12, REC13, REC15–REC23, REC25–REC29 — all are
     mechanical fills, re-stagings, re-sequencings, or unions over data the builder already
     controls (fill file paths, rewrite an exit gate to an observable, add missing scenario
     fields, strip scenario content to IDs, replace implicit codebase references with known
     values, re-run LTM consultation, run blast radius before design, specify baseline tests
     per gap, fill depends_on/interfaces/mock_strategy/milestone fields, init STM, create the
     branch/issue, re-stage to STM, compute cumulative_scenarios unions).
   Final split: 21 autonomous / 8 human.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (added `## Recovery` section + dual intent+expectation hash guard,
scenario evals re-sourced from `expectation.success_scenarios`), and the component linter
shows no new errors over the 65-error pre-existing baseline.
