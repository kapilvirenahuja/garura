# Auto-approval — algorithm expectation (ICE migration, #376)

**Play:** algorithm
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All four success scenarios (S1–S4, all "Lead
   developer") are carried forward verbatim from the legacy `scenarios:` block in
   intent.yaml; only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7. Seven failure
   conditions, seven recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC4 (no complexity → graceful skip), REC6 (artifact not written → re-dispatch),
     and REC7 (incomplete context → warn and continue) → **autonomous**. Each is a
     mechanical transform of output the builder controls: emit the skip notice and exit
     0, re-run the skill from inputs already held, or warn-and-proceed on tech.yaml
     alone. REC4 specifically preserves the OPTIONAL-play graceful-exit behavior.
   - REC1 (stm_base unresolvable), REC2 (tech.yaml missing), REC3 (tech.yaml empty/
     unparseable), and REC5 (skill errors after 2 attempts) → **human**. The first
     three require an upstream artifact or project config the builder cannot author or
     repair (config fix, run prepare, repair prepare output); REC5 exhausts mechanical
     retry and needs a human to diagnose the failing interface_ids.
4. **No new routing policy authored** — only the canonical expectation-generation rules
   were applied.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build algorithm`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
