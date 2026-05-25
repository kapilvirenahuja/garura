# Auto-approval — design expectation (ICE migration, #376)

**Play:** design
**Date:** 2026-05-25
**Decision:** expectation.yaml `vetted.status` set to `approved` without a human Tether.

## Why this was self-approved

The user invoked the ICE migration with an explicit standing instruction: run NON-STOP,
one play at a time, and "when you find yourself seeking a user's approach, self-approve it
and record the evidence on why it was approved." This file is that recorded evidence. The
per-play expectation checkpoint (create-play Step 2.5 Tether) is the approval being
self-granted here.

## Integrity checks that back the approval

1. **Scenarios lifted, not invented.** All nine success scenarios (S1 Developer, S2
   External Designer, S3 Product Manager, S4 Technical Architect, S5 Accessibility Lead,
   S6 Developer, S7 Product Manager at final review, S8 single-epic scope, S9 brownfield
   re-entry) are carried forward verbatim (persona / given / then) from the legacy
   `scenarios:` block in intent.yaml; only the `measure` field was added (observable +
   binary), per the generate-before-strip rule. No authored intent was discarded.
2. **Recovery completeness.** Exactly one recovery entry per failure condition: F1→REC1
   through F19→REC19. Nineteen failure conditions, nineteen recovery entries.
3. **Handoff routing checked against the rule** ("can the builder fix this from info it
   already has, deterministically?"):
   - **autonomous (16):** REC1–REC9, REC11, REC12, REC13, REC14, REC15, REC17, REC19.
     Each is a mechanical transform of artifacts the builder already controls —
     regenerate an empty stage, rewrite a persona into JTBD shape, attach a missing
     capability mapping, generate a missing screen/state/flow, name components in a
     wireframe, add an accessibility section, re-route a misplaced write through scriber,
     strip visual tokens from wireframe ASCII, repoint a domain-content input to the
     research path, re-narrow generation to primary use cases, re-emit a screen in the
     visual-first shape, re-emit a complete decision-manifest, or strip
     implementation-level specs out of design-system.md.
   - **human (3):** REC10, REC16, REC18.
     - REC10 (checkpoint missing / skipped without a recorded response) — the missing
       artifact is a human Tether/Vanish/Orbit; the builder cannot manufacture a human
       review decision.
     - REC16 (silent commit of an inferred decision) — the fix requires the user's
       accept/override/orbit on the un-surfaced decision; that is authority the builder
       lacks.
     - REC18 (gap-only overwrite of a LOCKED artifact) — re-writing a LOCKED artifact
       needs an explicit human delta-Tether (or --force-stage); approving the overwrite
       is a human authority call.
   - **REC17 routing note.** F17 covers a manifest that is missing, malformed, OR whose
     `user_response` was not written back after the surfacing flow ran. Even the
     writeback sub-clause is mechanical — the human response already exists; only the
     manifest emission failed — so all three sub-cases reduce to "re-emit the manifest."
     Routed **autonomous**.
4. **No new routing policy authored** — the canonical expectation-generation rules were
   applied only.

## What still gates this

The expectation only takes effect once intent scenarios are stripped and the play is
recompiled to ICE form, and the component linter shows no new errors over the 65-error
pre-existing baseline.
