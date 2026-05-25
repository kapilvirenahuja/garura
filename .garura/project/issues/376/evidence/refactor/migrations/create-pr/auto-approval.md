# Auto-approval — create-pr expectation (ICE migration, #376)

**Play:** create-pr
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** Both success scenarios (S1 Code Reviewer, S2 Author)
   are carried forward verbatim from the legacy `scenarios:` block in intent.yaml
   (persona/given/then preserved); only the `measure` field was added (observable + binary),
   per the generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, F3→REC3, F4→REC4, F5→REC5. Five failure conditions, five recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC2 (generic checklist items), REC3 (missing evidence backing), REC4 (eval results not
     embedded) → **autonomous**. Each is a mechanical transform of output the builder already
     controls: regenerate the checklist from the diff, derive evidence from the diff, embed
     the already-recorded eval results into the PR body. No external judgment required.
   - REC1 (no linked issue) → **human**. Mapping the work to the correct originating issue is
     an external-entity mapping the builder cannot resolve on its own.
   - REC5 (low-confidence target branch, user not asked) → **human**. Approving a
     less-than-high-confidence target before an outward-facing PR is created is an authority
     the builder lacks; this is exactly the C7 confidence gate.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (here, by acting as the create-play compiler on SKILL.md), and the
component linter shows no new errors over the 65-error / 2-warning pre-existing baseline.
