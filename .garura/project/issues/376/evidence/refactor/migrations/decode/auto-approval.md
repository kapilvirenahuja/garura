# Auto-approval — decode expectation (ICE migration, #376)

**Play:** decode
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All eleven success scenarios (S1–S11) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml — persona, given,
   then preserved exactly; only the `measure` field was added (observable + binary), per
   the generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F0→REC1, F1→REC2, F2→REC3, F3→REC4, F4→REC5, F5→REC6, F6→REC7, F7→REC8, F8→REC9,
   F9→REC10, F10→REC11, F11→REC12, F12→REC13, F13→REC14, F14→REC15, F15→REC16,
   F16→REC17, F17→REC18, F18→REC19, F19→REC20, F20→REC21, F21→REC22, F22→REC23,
   F23→REC24, F24→REC25. Twenty-five failure conditions, twenty-five recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **human (6):**
     - REC3 (F2 features.yaml unresolvable) — needs /codify + /garura:enrich run first or a
       valid --features-from; the builder cannot conjure the catalog.
     - REC4 (F3 no selector) — the user must pick scope; /decode refuses unbounded scope.
     - REC16 (F15 missing playbook) — the user must author the playbook file; not derivable.
     - REC19 (F18 harness not detectable) — the user must install deps or supply --workspace;
       the builder cannot provision the environment.
     - REC22 (F21 checkpoint skipped) — the human gate cannot be self-granted.
     - REC23 (F22 flagged units batched) — Decision Surfacing requires a per-unit human call.
   - **autonomous (19):** REC1, REC2, REC5–REC15, REC17, REC18, REC20, REC21, REC24, REC25
     — each a mechanical re-derivation, re-route, re-cite, drop-and-recite, re-run, or
     status-revert from output the builder already controls.
   Ratio: 19 autonomous / 6 human.
4. **No new routing policy authored** — the canonical expectation-generation rules were the
   only basis; no scenario was invented and no implementation/code leaked into directions.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form (Compiled From + dual hash guard + `## Recovery` section + scenario
evals sourced from expectation.success_scenarios), and the component linter shows no new
errors over the 65-error pre-existing baseline.
