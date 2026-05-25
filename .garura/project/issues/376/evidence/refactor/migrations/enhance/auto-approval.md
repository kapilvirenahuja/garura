# Auto-approval — enhance expectation (ICE migration, #376)

**Play:** enhance
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All nine success scenarios (S1–S9) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml (persona/given/then
   unchanged); only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded and no scenario invented.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1 … F15→REC15. Fifteen failure conditions, fifteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (9):** REC4 (out-of-range scope → mechanical halt + present
     recommendation), REC5 (context assembly skipped → re-run assembly), REC7 (PR without
     quality gates → run the gates), REC9 (missing alternatives/evals → regenerate the
     field), REC10 (judge contaminated → strip + re-dispatch), REC12 (implementer
     contaminated → strip + re-dispatch), REC13 (tester contaminated → strip +
     re-dispatch), REC14 (gated on wrong artifact → read verification-report.yaml), REC15
     (zero candidates → hard halt with no artifacts). All mechanical transforms of output
     the builder controls.
   - **human (6):** REC1 (PR checkpoint Tether absent → merge authorization), REC2 (judge
     < 0.6 → go/no-go on low-confidence work), REC3 (fix loop exhausted → redesign/narrow/
     abandon decision), REC6 (Q&A discovery skipped → needs user-supplied answers), REC8
     (mid-checkpoint ON but skipped → approval gate), REC11 (approval-required risk
     checkpoint skipped → approval gate). Each needs judgment, authority, or user content
     the builder lacks.
4. **F6 routing — the close call.** Q&A discovery skipped resembles F5 (context assembly
   skipped, autonomous): both are "step skipped, re-run it." The discriminator is whether
   the re-run needs user content. The F6 direction reads "ask the user the targeted
   questions" — it needs answers the builder cannot synthesize — so it routes **human**.
   F5's direction reads "do the assembly step" — mechanical — so it routes autonomous.
5. **No new routing policy authored** — the canonical expectation-generation rules were
   applied only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (`## Recovery` section + dual intent+expectation hash guard;
scenario evals re-sourced from expectation.success_scenarios), and the component linter
shows no new errors over the 65-error pre-existing baseline.
