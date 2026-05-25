# Auto-approval — review-pr expectation (ICE migration, #376)

**Play:** review-pr
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All four success scenarios (S1 Reviewer, S2 PR
   Author, S3 Ship Pipeline, S4 QA / Determinism Auditor) are carried forward verbatim
   from the legacy `scenarios:` block in intent.yaml; only the `measure` field was added
   (observable + binary), per the generate-before-strip rule. No authored intent was
   discarded and no new scenario was invented.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9.
   Nine failure conditions, nine recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC1 (uncited finding), REC2 (read outside diff / full-repo), REC4 (author in
     reviewer list), REC5 (P1 not blocked), REC6 (sub-threshold but no reviewers),
     REC7 (non-deterministic severity), REC9 (over agent budget) → **autonomous**. Each
     is a mechanical transform of output the builder already controls: re-tag/drop a
     finding, re-scope to the diff, remove the author and re-select, recompute routing
     from its own findings, add reviewers per the escalate rule, re-source severity
     verbatim from the taxonomy, collapse dispatches back within budget.
   - REC3 (short pool with empty fallback) and REC8 (missing taxonomy file / missing
     config keys) → **human**. Naming reviewers when the fallback list is empty, and
     supplying a missing taxonomy file or missing config keys, are authority/inputs the
     builder does not hold.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build review-pr`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
