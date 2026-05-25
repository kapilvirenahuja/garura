# Auto-approval — ship expectation (ICE migration, #376)

**Play:** ship
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All four success scenarios (S1 Developer, S2 Code
   Reviewer, S3 Code Reviewer — review-pr gate, S4 Developer — distill learning) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml; only the `measure`
   field was added (observable + binary) per the generate-before-strip rule. No authored
   intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8. Eight failure
   conditions, eight recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC1 (lingering feature branch), REC3 (wrong branch / behind remote), REC8 (untracked
     sub-play evidence) → **autonomous** — mechanical fixes the builder fully controls
     (delete branch, checkout+fast-forward, sweep+commit the C9 evidence paths).
   - REC2 (merge conflicts), REC4 (commit references wrong/no issue), REC5 (PR missing issue
     link / wrong target), REC6 (uncommitted work at merge), REC7 (merged past a blocking
     review-pr gate) → **human** — each needs judgment or authority the builder lacks:
     conflict resolution, external issue mapping, intended base/issue knowledge, a go/no-go
     on uncommitted state, and approval to override an outward-facing quality gate.
   ship is outward-facing (merge / PR / push), so the majority of entries are `human`, as
   expected.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only. The autonomous entries mirror the established
   merge-pr migration (branch delete, checkout+fast-forward); REC8 maps to ship's existing
   C9 evidence sweep, which is already a mechanical autonomous action.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build ship`, and the component linter shows no new errors
over the 65-error pre-existing baseline. The bespoke Evidence & Close (C9 sweep / Standard
Play Close) is left byte-identical — the migration touches only the ICE concerns.
