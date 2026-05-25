# Auto-approval — start-feature-planning expectation (ICE migration, #376)

**Play:** start-feature-planning
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All four success scenarios (S1 Developer, S2 Tech
   Lead, S3 Developer, S4 Project Manager) are carried forward verbatim from the legacy
   `scenarios:` block in intent.yaml — same persona, given, and then text. Only the
   `measure` field was added (observable + binary), per the generate-before-strip rule. No
   authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1,
   F2→REC2, F3→REC3, F4→REC4. Four failure conditions, four recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - REC1 (empty / no actionable planning output) → **autonomous** — re-running the
     planning sub-agent with the full intent context is a mechanical re-run; the builder
     controls the planner invocation.
   - REC2 (remote branch lingers after Vanish) → **autonomous** — deleting the lingering
     remote branch is a mechanical re-stage (mirrors merge-pr REC2).
   - REC3 (a required section missing) → **autonomous** — re-running and re-parsing the
     planner until all three sections appear is mechanical; no external judgment needed.
   - REC4 (branch absent on origin after creation) → **autonomous** — re-creating and
     pushing the branch is a mechanical re-run of the branch-creation step.
   All four are mechanical fixes from output the builder already controls; none require a
   human pick, an approval, or a source of truth the builder cannot see.
4. **No new routing policy authored** — the skill applied the canonical
   expectation-generation rules only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build start-feature-planning`, and the component linter
shows no new errors over the 65-error pre-existing baseline.
