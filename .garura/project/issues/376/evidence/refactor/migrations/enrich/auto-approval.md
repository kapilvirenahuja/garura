# Auto-approval — enrich expectation (ICE migration, #376)

**Play:** enrich
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All six success scenarios (S1, S2, S3 Repository
   maintainer; S4 Architecture reviewer; S5 Repository maintainer; S6 Learning pipeline
   auditor) are carried forward verbatim from the legacy `scenarios:` block in
   intent.yaml; only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9. Nine failure
   conditions, nine recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"). enrich is the LTM write boundary — its writes are
   outward-facing, so unwinding a bad LTM/ADR write or supplying a missing authority routes
   to a human; the mechanical STM/archival and promotion failures route to autonomous:
   - REC5 (approved Tier 1 ADR draft never produced its ADR file) → **autonomous**: the
     approval already exists; promoting the draft to the next sequential ADR is a
     deterministic mechanical step (`promote-adr-draft`).
   - REC6 (issue STM lingers in active area after success) → **autonomous**: archiving a
     processed issue is a mechanical move into the archived subtree.
   - REC7 (archived while entries unresolved) → **autonomous**: restoring the directory to
     active and resolving outstanding entries is mechanical re-staging the builder controls.
   - REC9 (sweep touched archived/pending) → **autonomous**: re-running enumeration with
     the archived and pending subtrees excluded is a deterministic filter correction.
   - REC1 (taxonomy-incomplete content reached LTM), REC2 (write outside the LTM/ADR
     roots), REC3 (same proposal applied twice), REC8 (malformed proposal left a partial
     LTM write) → **human**: each is an outward-facing product-LTM write that already
     landed; unwinding it cleanly is a judgment call the builder cannot make on its own.
   - REC4 (Tier 1 content without a recorded approval) → **human**: the missing approval is
     an authority the builder does not hold.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build enrich`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
