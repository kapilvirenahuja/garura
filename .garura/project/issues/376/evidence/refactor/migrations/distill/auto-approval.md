# Auto-approval — distill expectation (ICE migration, #376)

**Play:** distill
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** Both success scenarios (S1 Developer non-trivial PR,
   S2 Developer trivial PR) are carried forward verbatim from the legacy `scenarios:` block
   in intent.yaml — persona/given/then are unchanged; only the `measure` field was added
   (observable + binary), per the generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2. Two failure conditions, two recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC1 (distill halted/delayed ship) → **autonomous**. The fix is mechanical and fully
     within the builder's control: wrap the run in a catch, log, and return
     `{ status: "skipped", reason }` so the failure never escapes to ship. No external
     judgment or authority needed.
   - REC2 (proposals written to product LTM) → **autonomous**. The output path is something
     the builder controls; re-staging the write under `{stm_base}/{issue}/evidence/distill/`
     and removing the stray `{product_base}` artifact is a deterministic correction.
4. **No new routing policy authored** — only the canonical expectation-generation rules
   were applied.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (added `## Recovery` section, dual intent+expectation hash guard,
SCE entries sourced from `expectation.success_scenarios`), and the component linter shows
no new errors over the 65-error pre-existing baseline AND the two prior distill warnings
resolved to zero.
