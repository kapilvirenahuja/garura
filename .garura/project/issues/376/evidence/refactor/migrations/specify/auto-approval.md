# Auto-approval — specify expectation (ICE migration, #376)

**Play:** specify
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All eight success scenarios (S1 Product Manager,
   S2 Technical Architect, S3 Product Owner, S4 Product Manager, S5 Engineering Lead,
   S6 Compliance Officer, S7 Stakeholder, S8 Product Manager) are carried forward verbatim
   from the legacy `scenarios:` block in intent.yaml (persona/given/then unchanged); only
   the `measure` field was added per scenario. Each measure was lifted from the play's
   existing SCE-1..SCE-8 checks (already encoded in the SKILL.md Scenario Validation
   section), so the recompiled scenario evals match what the play already enforced. No
   authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1, F2→REC2, F3→REC3, F4→REC4, F5→REC5, F6→REC6, F7→REC7, F8→REC8, F9→REC9,
   F10→REC10, F11→REC11, F12→REC12, F13→REC13, F14→REC14, F15→REC15. Fifteen failure
   conditions, fifteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (12)** — REC1–REC8, REC11, REC12, REC13, REC15. Each is a mechanical
     re-run or re-route of a producer skill from output the builder controls: regenerate
     epics with missing/unquantified/under-scenario'd fields (REC1–REC4), re-derive
     traceability (REC5), re-run capability configuration (REC6, REC7), re-derive the
     quality profile (REC8), re-route a write to a whitelisted path via scriber (REC11),
     surface a phasing recommendation in the close evidence (REC12), re-author an artifact
     with domain-level vocabulary (REC13), and re-run a decision-producing skill so a
     well-formed manifest is written (REC15).
   - **human (3)** — REC9, REC10, REC14. Each requires an authority the builder lacks:
     REC9 the missing checkpoint approval IS the human gate (Tether/Vanish/Orbit cannot be
     self-granted); REC10 the pre-lock resolution gate's RESOLVED-keyword interview is human
     judgment over each blocker/placeholder; REC14 a silently-committed decision must be run
     back through the decision-surfacing flow, which requires a human Tether/Orbit/Vanish.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only. F12's recovery stays anchored to the trigger
   (surface the phasing recommendation), not to the downstream user choice of phase.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build specify`, and the component linter shows no new
errors over the 65-error pre-existing baseline.
