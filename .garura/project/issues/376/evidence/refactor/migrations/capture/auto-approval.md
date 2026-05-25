# Auto-approval — capture expectation (ICE migration, #376)

**Play:** capture
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All six success scenarios (S1 Agent, S2 Human
   defect, S3 Human epic, S4 Agent async, S5 Human gh-failure, S6 Human ambiguous) are
   carried forward verbatim from the legacy `scenarios:` block in intent.yaml; only the
   `measure` field was added (observable + binary), per the generate-before-strip rule.
   No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8. Eight
   failure conditions, eight recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC4 (gh failure, no output), REC5 (gh failure, caller not told), REC6 (caller
     blocked), REC7 (malformed confirmation) → **autonomous** — each is a mechanical
     transform of output the builder controls (write the fallback, append the failure
     reason + path + sharing instructions, re-dispatch in background, reformat to the
     single canonical line).
   - REC1 (missing title/problem), REC2 (missing severity), REC3 (invalid/non-inferable
     type), REC8 (ambiguous type silently resolved) → **human** — each needs caller
     input or a human confirmation the builder cannot invent or choose.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build capture`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
