# Auto-approval — arch expectation (ICE migration, #376)

**Play:** arch
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All seven success scenarios (S1 Technical Architect,
   S2 Engineering Manager, S3 Implementation Lead, S4 Security Architect, S5 Product
   Manager, S6 DevOps / Platform Engineer, S7 Senior Developer onboarding) are carried
   forward verbatim from the legacy `scenarios:` block in intent.yaml (persona / given /
   then); only the `measure` field was added (observable + binary), per the
   generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1 … F19→REC19. Nineteen failure conditions, nineteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **Autonomous (14):** REC1 (missing/empty artifact → re-run derive), REC2 (category
     term → name a product), REC3 (logical implementation token → strip), REC4 (missing
     cited driver → add citation from upstream the builder holds), REC5 (orphan capability
     → map to a component), REC6 (NFR no mechanism → name one), REC7 (incomplete ISO 25010
     entry → fill it), REC8 (vague language → name concrete tooling), REC9 (missing pattern
     layer → add entry), REC10 (missing ADR → write it), REC12 (write outside whitelist →
     re-route via scriber), REC13 (code/tests produced → remove), REC16 (conflicts with a
     grounded_tools pin → use the pin, which the builder already has), REC19 (missing/
     malformed manifest → re-run the skill). Each is a deterministic transform of output
     the builder controls.
   - **Human (5):** REC11 (missing checkpoint → human gate cannot be self-granted),
     REC14 (multi-candidate committed without asking → the pick among legitimate candidates
     is the user's), REC15 (agent_default_unilateral → legitimizing a unilateral default
     needs a pin or user approval), REC17 (single-candidate tag but KB had several → the
     real choice is a user pick), REC18 (decision committed without surfacing → surfacing
     needs a human Tether/Orbit/Vanish). Each needs judgment or authority the builder
     lacks.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to the ICE form (added `## Recovery` section + dual intent+expectation hash
guard; scenario evals re-sourced from `expectation.success_scenarios`), and the component
linter shows no new errors over the 65-error pre-existing baseline.
