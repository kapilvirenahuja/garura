**Harness verdict (gate off per `gates.plays.review-change`): APPROVE**

This decision was computed, not made by a person. No P1 finding was raised, so the recommendation from `compute_verdict.py` stands verbatim as the decision. A human has not reviewed this PR.

## What was reviewed, and against what

Three work categories were assessed from the diff itself, not from a presumed list:

| Category | Files | Design-bearing | How it was reviewed |
|---|---|---|---|
| harness | 4 | yes | `lint_play.py` + principles reconstructed from `main`, `docs/philosophy/**`, `docs/adr/**`, `standards/rules/**` |
| memory | 1 | yes | `lint-components` + the committed lens-schema conventions |
| code | 2 | no | `ruff` + manual evaluation against `review/code.md` and the `pr.md` severity buckets |

Nine further changed paths under `.garura/project/issues/552/context/` are this run's own record — the evidence of the review, not work under review. They were read and deliberately left uncategorised.

Design-grounding ran as a concurrent fan-out, one reviewer per design-bearing category, each grounded only in committed sources. The branch was never used as its own standard.

## Findings — 0 P1 · 2 P2 · 3 P3 · 5 P4

**P2 — worth fixing before merge, though they do not block**

- `render_wireframes.py` — a malformed but parseable record (a top-level list where a mapping belongs) raises an unhandled traceback instead of the documented clean exit 2. Reproduced.
- `validate_ux.py` — the same shape on its manifest and readiness inputs. Three crash paths reproduced.

**P3**

- `reference/ice.md` — F2, F9 and C12's Done-means prose still describe the old write scope after C2/C15 widened it. The guard allowlist is correct, so this is the intent text disagreeing with itself, not a functional hole.
- The lens schema's gold example never states the four tone names its own guidance requires.
- That same example uses a state word, `not-ready`, that its own States section never defines.

**P4** — a double-escape in the pin branch that fires only when a pin holds text instead of a number; nested markup silently mangled rather than rejected; a stale validator error message; an unused parameter; one `ruff` F541.

## One claim was raised and withdrawn under test

A P2 was raised saying the template now teaches a "none yet" design-system outcome that `validate_ux.py` would reject. It was tested rather than argued: the validator checks `source_type`, which stays `decision`, and never reads the decision's content. A "none yet" lens passes, exit 0. The finding was withdrawn and replaced by the P4 about the stale message text.

## Checks that passed

- `lint_play.py` on /ux — 0 gaps, all 13 checks
- `lint-components` — 0 errors, 0 warnings
- The lens schema's `##` heading contract is unchanged, so the ten duplicated `lint_grounding.py` copies need no sync — verified against `main`, not assumed
- The `SKILL.md` fingerprint matches the ICE source
- ADR 026 containment holds: the skill writes per-node files, the render script owns the page, the keyed persist owns the decisions, and the scoped-guard allowlist covers both new artifacts in `ice.md` and `SKILL.md` identically
- D4 in `stop-condition.yaml` matches D4 in the ICE Done-means

## A gap outside this PR

`quality-check-scoped`'s artifact-type table classifies everything under `core/components/**` as garura-prose before it can reach runtime-code. The mechanical scanner therefore returned zero findings for both Python files, and every code finding above came from manual evaluation. For a repo whose product is its own scripts, that is a real hole in the review taxonomy. It belongs in its own issue, not here.
