# Auto-approval — codify expectation (ICE migration, #376)

**Play:** codify
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All eight success scenarios (S1 single-service
   brownfield, S2 multi-repo monolith, S3 headless service, S4 alignment check, S5
   extreme codebase, S6 new domain, S7 partial LOCKED + missing scope, S8 target filter)
   are carried forward verbatim from the legacy `scenarios:` block in intent.yaml
   (persona/given/then); only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F0→REC1, F1→REC2, F2→REC3, F3→REC4, F4→REC5, F5→REC6, F6→REC7, F7→REC8, F8→REC9,
   F9→REC10, F10→REC11, F11→REC12, F12→REC13, F13→REC14, F14→REC15. Fifteen failure
   conditions, fifteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (12):** REC1 (anchor issue before work), REC2 (re-route write to STM),
     REC3 (re-run scan), REC4 (fill source_type/evidence/confidence), REC5 (re-derive to
     pass validator), REC6 (re-align designer dispatch to the deterministic scan-index
     flag), REC7 (stage the missing ADR draft + impact block — the absence is mechanical to
     fix), REC8 (skip LOCKED, record skipped_locked), REC9 (fill taxonomy from canonical
     tree), REC10 (re-run agent to emit resolution-trace), REC13 (re-bound reads to
     scan-index), REC15 (re-run aggregation). Each is a deterministic transform of output
     the builder already controls.
   - **human (3):** REC11 (missing checkpoint summary — the Tether/Vanish gate is a human
     response the builder cannot self-grant), REC12 (proceeding on a budget-exhausted
     partial scan needs a human go/no-go), REC14 (silent acceptance of low-confidence /
     Tier-1-conflict proposals — each needs an explicit per-proposal user accept/reject/
     defer the builder lacks the authority to make).
4. **No new routing policy authored** — the canonical expectation-generation rules were
   applied only. Routing mirrors the arch precedent (write-outside-whitelist and
   missing-ADR → autonomous; human-checkpoint-bypass → human).

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to the ICE form (added `## Recovery` section + dual intent+expectation hash
guard; scenario evals re-sourced from `expectation.success_scenarios`), and the component
linter shows no new errors over the 65-error pre-existing baseline.
