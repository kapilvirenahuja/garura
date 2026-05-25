# Auto-approval — implement expectation (ICE migration, #376)

**Play:** implement
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All thirteen success scenarios (S1–S13) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml — persona, given,
   when (where present, on S8/S9/S10/S11/S13), and then preserved exactly. Only the
   `measure` field was added (observable + binary), per the generate-before-strip rule. No
   authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, … F16→REC16, F17→REC17, … F26→REC26. Twenty-six failure conditions, twenty-six
   recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (20):** REC1 (build errors → fix code), REC4 (plaintext evals → re-encrypt/
     relocate), REC5/REC6/REC7/REC14/REC23 (contaminated agent contracts → rebuild contract),
     REC10 (reused evals → regenerate fresh), REC11 (missing/failing unit tests → author/fix
     tests), REC12 (lint → fix code), REC13 (quality threshold → fix loop), REC15 (status
     report has test code → regenerate report), REC16 (null QP thresholds → re-derive via
     translation table), REC17 (gate not enforced → enforce single gate), REC18 (source
     omitted from remediation → include it), REC19 (eval count down → require rationale /
     re-invoke), REC21 (integration fail → fix loop), REC22 (qp_certification missing →
     re-invoke auditor), REC25 (arbiter on first failure → enforce 2-cycle gate), REC26
     (dispatch missing a section → rebuild dispatch). All are mechanical transforms of output
     the orchestrator/builder already controls.
   - **human (6):** REC2 (>50% first-run eval failure → restructuring judgment), REC3 (3
     iterations exhausted → restructure-vs-escalate judgment), REC8 (milestone not LOCKED →
     upstream lock state), REC9 (no exit gate / no scenarios → upstream spec gap), REC20 (mock
     setup failed → tech.yaml mock_strategy correction), REC24 (depends_on not COMPLETE →
     upstream completion state). Each needs judgment or authority the builder lacks.
4. **No new routing policy authored** — the migration applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (added `## Recovery` section + dual intent+expectation hash guard;
scenario evals re-sourced from `expectation.success_scenarios`), and the component linter
shows no new errors over the 65-error pre-existing baseline.
