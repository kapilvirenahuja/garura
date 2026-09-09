**Harness verdict (gate off per `gates.plays.review-change`): APPROVE**

No P1 findings. 10 findings total — 4× P3, 6× P4, none blocking. Every finding cites its basis.

This is a machine verdict, not a human review. A reject here would have stood exactly as a human reject would.

## What was reviewed, and how

Six work categories were **derived from the diff**, not presumed:

| Category | Paths | Design-bearing | Playbook |
|---|---|---|---|
| harness | 7 | yes | `review/harness` |
| code | 8 | no | `review/code` |
| memory | 3 | yes | `review/memory` |
| config-maps | 1 | no | `review/config-maps` |
| docs | 1 | no | `review/docs` |
| issue-stm-context-artifacts | 10 | no | **none — playbook missing** |

All 30 changed paths are accounted for. Design-grounding ran as a concurrent read-only fan-out, one agent per design-bearing category, each reading its principles from `main` — never from what this branch adds.

## Findings

**P3 — memory-001** · `standards/rules/_index.md`
The new row lists `lint-components` as a consumer, but only `lint_play.py` enforces the rule. Verified read-only: `lint-components` contains no reference to it. *This is the rule overstating its own coverage — the exact failure the rule exists to prevent.*
Basis: `_index.md` row conventions as committed on main.

**P3 — memory-002** · `standards/rules/no-unbacked-recommendation.md`
The rule demands four pieces, including a step eval and a strip-not-replace recovery. The linter actually checks only: the rule is cited, a constraint mentions it, a failure condition exists, and the literal string "no recommendation" appears. The eval and the recovery are **not** checked. The Enforced claim is broader than the enforcement.
Basis: `evidence-recording.md`, `play-close.md` as committed on main.

**P3 — memory-004** · `standards/rules/no-unbacked-recommendation.md`
Scope is detected by regex over the frontmatter `description` prose, then negations are stripped so a play disclaiming recommendations isn't dragged in. Committed precedent (`pipeline-position.md`) uses a **declared field** instead. Prose-keyed enforcement can silently flip on a reword.
Basis: `pipeline-position.md` as committed on main.

**P3 — taxonomy-blindspot** · `standards/rules/pr.md` taxonomy · *pre-existing, outside this diff*
`quality-check-scoped` classifies everything under `core/components/**` as prose before checking extension, so all 8 Python scripts here were never code-scanned. Its 0 findings means "not examined", not "clean". The orchestrator ran `ruff`, `py_compile` and a dangerous-call grep instead: 4× E741 (style), all compile, no `eval`/`exec`/`pickle.load`/`shell=True`, and the three new `/focus` scripts contain no `subprocess`/`git`/`gh` — the layer rule holds.

**P4 ×6** — a stale-prone date in the index row; `/focus`'s SKILL.md restating the "≤5 agent budget" that ADR 017 retired (inherited convention, not new here); 2× E741 introduced in `select_focus.py`; 2× E741 in verbatim canonical copies, confirmed pre-existing on main; and the missing review-shelf playbook for STM run artifacts.

## Verified, not assumed

- `/focus` passes `main`'s own linter: 13 checks, 0 gaps.
- Its fingerprint was **recomputed** from `reference/ice.md` on disk and matches.
- The `platform-adapter` verb change is genuinely additive — the default field list is preserved.
- `/next` and `/review-change` fail the new check, exactly as #530 and the rule's own state table say.
- The `play-creator` / `play-editor` lint gaps found are pre-existing on `main`, not introduced here.

## Caveat on this review

The change under review was authored by the same assistant that ran this review. The grounding-from-committed-sources rule is the structural guard against a change being its own standard, and it held. Read this as a machine check, not an independent human review.
