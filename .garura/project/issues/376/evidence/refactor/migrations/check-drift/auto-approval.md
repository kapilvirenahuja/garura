# Auto-approval — check-drift expectation (ICE migration, #376)

**Play:** check-drift
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All seven success scenarios (S1 Developer, S2 Tech
   Lead, S3 Tech Lead, S4 Product Manager, S5 Developer, S6 Engineering Lead, S7 Developer)
   are carried forward verbatim from the legacy `scenarios:` block in intent.yaml; only the
   `measure` field was added (observable + binary), per the generate-before-strip rule. No
   authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition:
   F1→REC1 … F13→REC13. Thirteen failure conditions, thirteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (10):** REC1 (empty artifact → re-run / fill justification), REC2 (add
     examined-evidence to a "no items" claim), REC3 (loop contradictions back per C6),
     REC4 (re-apply the ID/category scheme), REC6 (re-run a contaminated domain in
     isolation), REC8 (rewrite vague recs into executable units), REC9 (regenerate the
     derived brief from its data), REC11 (re-run consuming locked design artifacts that
     are present), REC12 (write the missing manifest, empty-with-justification if needed),
     REC13 (re-run consuming arbiter verdicts and translate spec_ambiguous). Each is a
     mechanical transform of output the builder already controls.
   - **human (3):** REC5 (files outside the output area were modified — an outward-facing
     change needing a user go/no-go to revert), REC7 (no resolved scope — the
     issue/epic/branch pick is an ambiguous user decision), REC10 (defects already filed in
     an external tracker — closing/keeping them is authority the builder lacks).
4. **No new routing policy authored** — only the canonical expectation-generation rules
   were applied.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled via `/create-play --build check-drift`, and the component linter shows no new
errors over the 65-error pre-existing baseline.

## Deviation flagged for human attention (structural)

Unlike the other eleven migrated plays, the check-drift **play** has never had a compiled
`SKILL.md`. The play directory `core/components/plays/check-drift/` contains only
`reference/intent.yaml`; there is no Role / Pre-flight / Workflow / task-DAG / step-eval
surface to surgically edit (the prior migrations all *modified* an existing compiled play
SKILL.md). A separate `core/components/skills/check-drift/SKILL.md` exists, but that is the
process **skill**, not the compiled play. The ICE-content half of the migration
(expectation.yaml, intent triple, evals, this evidence) is complete and clean; the compiled
play SKILL.md was NOT fabricated, because inventing the full play surface from scratch is a
`/create-play` interview/compile job (explicitly out of scope for this migration run), and
every fabricated line would be unsourced. A real `/create-play --build check-drift` is
required to first compile the play; this migration has prepared the ICE inputs for it.
