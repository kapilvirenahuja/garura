# Auto-approval — validate expectation (ICE migration, #376)

**Play:** validate
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All nine success scenarios (S1 QA Engineer, S2 QA
   Engineer, S3 Security Auditor, S4 Engineering Lead, S5 Product Owner, S6 Testing
   Architect, S7 Developer, S8 QA Engineer, S9 Engineering Lead) are carried forward
   verbatim from the legacy `scenarios:` block in intent.yaml — persona, given, and then
   are unchanged. Only the `measure` field was added to each (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9, F10→REC10,
   F11→REC11, F12→REC12, F13→REC13, F14→REC14, F15→REC15, F16→REC16. Sixteen failure
   conditions, sixteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **human (4):** REC1 (implement not complete / quality FAIL) and REC14 (milestone
     implement INCOMPLETE) are upstream completion state the builder cannot grant; REC2
     (deployment env unreachable) is infrastructure the play does not provision; REC3 (3 fix
     iterations exhausted) is a restructure-vs-escalate judgment.
   - **autonomous (12):** REC4 (re-route through implement instead of code-builder), REC5
     (regenerate e2e on the right framework), REC6 (re-run judge against the deployed env),
     REC7/REC8 (rebuild agent contracts stripping forbidden inputs), REC9 (re-run with
     evidence capture), REC10 (enforce tier-halt), REC11 (re-run feature-steward), REC12
     (recompute verdict from evidence), REC13 (strip KB/LTM paths from contracts), REC15
     (re-scope scenario set), REC16 (withhold epic verdict, emit per-milestone) — each a
     mechanical transform of output the builder already controls.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build validate`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
