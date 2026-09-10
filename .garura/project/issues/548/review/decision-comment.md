**Harness verdict (gate off per `gates.plays.review-change`): APPROVE**

This decision was computed by the harness, not typed by a human reviewer. It equals the computed recommendation verbatim: no P1 findings, so approve.

## What was reviewed

The work categories were assessed from the diff itself, not presumed. Four are present:

| Category | Treatment | Result |
|---|---|---|
| harness (4 paths) | design-grounded from committed sources | clean, 0 findings |
| code (11 paths) | standards linter + runnable checks executed | clean, 0 findings |
| memory (2 paths) | design-grounded from committed sources | 2×P2, 1×P3, 1×P4 |
| stm_run_artifacts (10 paths) | no playbook on the shelf — recorded as a gap | — |

## Harness — verified, not assumed

The PR claims this went through the intent pipeline (ICE edited, play recompiled) rather than a hand-patch of the compiled `SKILL.md`. That claim was tested independently:

- `shasum -a 256` over `reference/ice.md` matches the fingerprint recorded in `SKILL.md`.
- `lint_play.py` passes with 0 gaps — constraints, failures, scenarios and recovery stay 1:1 with no orphans.
- The element counts in the ICE (14 constraints / 15 failures / 7 scenarios / 15 recovery) match what the play's own recompile note claims changed.

Grounded against `CLAUDE.md`'s play-pipeline rule, the base-ref `SKILL.md`'s own no-hand-edit statement, and the agent-vs-skill boundary — all committed on `main`, none from this branch.

## Code — executed, not read

- Standards linter over the 11 code paths: exit 0, no rule fired.
- `python3 -m py_compile` on all 11 changed Python files: clean.
- The new `check_flows()` logic in `validate_ux.py` was run against a purpose-built good document and a broken one. It passed the good one and caught all four seeded problems in the bad one.
- The ten `lint_grounding.py` copies carry the identical one-line change; nothing else drifted.

## Memory — four cited findings, none blocking

**F1 (P2)** — `lens/ux.yaml` takes a structurally breaking change (`states` goes from a list of strings to a list of objects, plus new required fields) on a schema the product-os index calls permanent. That index says such changes belong to a dedicated schema-evolution process and imply migrating existing records. This PR does it as a direct edit with no migration note.
Basis: `P-SCHEMA-EVOLUTION-PARKED` — `core/components/memory/standards/schemas/product-os/_index.md` (main).

**F2 (P2)** — `lens/ux.yaml`'s header still reads "Accessibility is NOT restated here — it lives in the product profile", even though this PR rewrote the two adjacent lines in the same comment block. That now contradicts this PR's own `grounding/lens/ux.md` and the marketing lens contract on `main`, which owns accessibility and says so explicitly.
Basis: `P-TWO-ARTIFACTS-STAY-IN-STEP` (`grounding/lens/run.md`, main) and `P-ACCESSIBILITY-LIVES-IN-MARKETING` (`grounding/lens/marketing.md`, main).

**F3 (P3)** — `lens/_index.md` is untouched by this PR but is now stale: its lenses table still describes `ux.yaml` as having no flows and accessibility in the profile.
Basis: `P-LENS-INDEX-IS-THE-SHARED-MAP` — `lens/_index.md` (main).

**F4 (P4, informational)** — the gold example's Flows section covers one persona's goal, while Screens names a second opener with an arguably distinct goal. No contract line mandates more.

## On the `LOCKED #434` marker

The reviewer checked what that lock actually means rather than assuming. `LOCKED #<issue>` on a schema file is a provenance note shared verbatim by all five sibling lens schemas; the repo's only formally defined LOCKED/DRAFT mechanism (`resolution.md`) governs project LTM artifacts, not design-time schema templates. So editing the file is legitimate. The objection that stands is F1 — not that it was touched, but that a breaking schema change was made outside the process the repo says such changes need.

## Process notes for the record

- `context.yaml` resolved the review shelf to `./.garura/core/memory/knowledge/review/`, which does not exist in the repo. The reviewer fell back to the machine-global deployed copy and confirmed it is byte-identical to the committed source, so this run's answer is unaffected — but the path resolution is wrong and should be fixed.
- `stm_run_artifacts` has no playbook on the review shelf. Recorded as a gap; no follow-up issue was filed.

## Routing

Approve. `review-pr.bypass` is `true` for this repo, so the verdict does not hard-block the merge either way. The two P2 findings are cited above and are the natural follow-up — F2 in particular is a one-line contradiction introduced by this change.
