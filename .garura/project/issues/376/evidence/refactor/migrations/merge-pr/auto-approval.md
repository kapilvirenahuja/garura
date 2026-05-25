# Auto-approval — merge-pr expectation (ICE migration, #376)

**Play:** merge-pr
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** Both success scenarios (S1 Developer, S2 Code
   Reviewer) are carried forward verbatim from the legacy `scenarios:` block in
   intent.yaml; only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, F3→REC3, F4→REC4, F5→REC5. Five failure conditions, five recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC2 (lingering branch) and REC3 (wrong branch / behind) → **autonomous** (mechanical
     delete / checkout+fast-forward).
   - REC1 (conflicted merge), REC4 (merged on a dirty tree), REC5 (merge with no merged PR)
     → **human** (conflict resolution, go/no-go on uncommitted changes, and reconciling
     against the platform's record are judgment/authority the builder lacks).
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build merge-pr`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
