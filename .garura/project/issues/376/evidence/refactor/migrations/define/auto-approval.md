# Auto-approval — define expectation (ICE migration, #376)

**Play:** define
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All six success scenarios (S1–S6) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml — persona, given,
   and then are unchanged; only the `measure` field was added (observable + binary), per
   the generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9,
   F10→REC10, F11→REC11. Eleven failure conditions, eleven recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **Autonomous (5):** REC3 (re-classify into the five-bucket enum), REC5 (write the
     known issue number into the feature row), REC7 (relocate the misplaced artifact to
     the known STM path), REC8 (call manage-issue close on the known issue number),
     REC10 (rewire a surface to its declared template) — all mechanical from information
     the builder already controls.
   - **Human (6):** REC1 (open GH issue is an external tracker state), REC2 (the user's
     feature content cannot be authored by the builder), REC4 (ISO 25010 regression
     go/no-go is user judgment), REC6 (missing epic content after one gap loop needs user
     input), REC9 (repairing malformed LTM needs judgment about intended content),
     REC11 (the missing user_response is the user's to give) — each needs judgment or
     authority the builder lacks.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build define`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
