# Auto-approval — fix-it expectation (ICE migration, #376)

**Play:** fix-it
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All four success scenarios (S1 Developer, S2 Tech
   Lead, S3 QA Engineer, S4 QA Engineer reviewing audit trail) are carried forward verbatim
   from the legacy `scenarios:` block in intent.yaml (persona/given/then unchanged); only
   the `measure` field was added (observable + binary), per the generate-before-strip rule.
   No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9,
   F10→REC10. Ten failure conditions, ten recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous** (mechanical re-derivation / re-run / format correction from output the
     builder controls): REC2 (re-run RCA to trace cause), REC3 (re-run design to add
     alternatives), REC4 (resume the ship pipeline to completion), REC6 (restrict to
     affected files or record the deviation), REC7 (rebuild the builder contract stripping
     brief content), REC8 (re-run RCA to emit the resolution trace), REC9 (delete the HTML
     artifact), REC10 (write the dispatched tracking stub).
   - **human** (judgment / authority the builder lacks): REC1 (the single approval Tether is
     an authority the builder cannot grant), REC5 (an existing open issue is external state
     the builder cannot create or reopen).
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build fix-it`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
