# Auto-approval — reap expectation (ICE migration, #376)

**Play:** reap
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
   forward verbatim (persona/given/then) from the legacy `scenarios:` block in
   intent.yaml; only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9,
   F10→REC10. Ten failure conditions, ten recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC1 (proposals.yaml absent), REC2 (missing learning_category), REC4 (wrong target
     path), REC5 (Tier 1 missing ADR/impact), REC6 (re-derived drift findings),
     REC7 (sub_category on flat parent), REC8 (missing sub_category on hierarchical
     parent) → **autonomous**. Each is a mechanical transform of output the builder
     already controls — re-write the file, fill/classify a field, re-target a path,
     consume the existing manifest, null or assign a sub_category from the canonical tree.
   - REC3 (proposed-new value without justification) → **human**. Deciding whether to
     invent a new taxonomy category versus remap to a canonical value, and authoring the
     why-no-canonical-fits reasoning, is reviewer judgment the builder cannot supply.
   - REC9 (prior-play STM artifacts altered) → **human**. Restoring read-only prior-play
     artifacts depends on a source of truth outside what the builder controls; an
     irreversible-damage recovery needs a human call.
   - REC10 (checkpoint skipped) → **human**. The Tether/Vanish decision is an authority
     the builder does not hold — the human checkpoint is precisely what is missing.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build reap`, and the component linter shows no new errors
over the 65-error pre-existing baseline.
