## What this change does

The `/ux` play used to write a UX lens doc with four sections and **no flows** — its own
intent said "flows are the build's to derive". The result was a screen catalogue: a UX
researcher reading it could find neither the information architecture nor the task flows.

The lens is now **five sections** — `Intent / Screens / Flows / States / Visual core`.

- Each **screen** names the one object the user works with there. That line carries the
  information architecture, which is why there is deliberately no separate IA section.
- **Flows** are new: one block per persona + goal, in a fixed field order — Persona, Goal,
  Entry, Steps (each naming a real screen), Decisions (where each branch goes), Failure,
  Exit. It reads as a story for a researcher and parses as a graph for an agent.
- **States** now name the trigger that puts a screen in them, not just a label.

Boundary: these flows are the paths **inside this slice's screens**. The person's wider
journey across the product stays out — that is the proposed `/story` play (#528).

## How it was done

Intent change through the play pipeline: `core/components/plays/ux/reference/ice.md` edited,
play recompiled, fingerprint recomputed. Not a hand-patch of the compiled `SKILL.md`.

ICE changed: the intent paragraph, C3, C6, C11, F3, REC3, S1, S6.
ICE added: C14, F15, REC15, S7, plus evals SE-14 and SCE-7. Nothing removed.
Counts: constraints 13 → 14, failures 14 → 15, scenarios 6 → 7, recovery 14 → 15.

`lint_play.py`: **PASS, 0 gaps**.

## Propagation

| Target | Change |
|---|---|
| Lens contract + gold example | rewritten to five sections; example verified by the real linter |
| `lens/ux.yaml` typed schema | flows block, per-screen object, per-state trigger |
| `lint_grounding.py` × 10 | heading list now requires `Flows` |
| `validate_ux.py` | new optional `--lens` flag + mechanical flow cross-check |
| `author-ux-lens` skill | writes the Flows section; manifest gains a `flows:` block |
| `product-os-keeper` agent | skill catalogue no longer says "no flows" |

The flow cross-check proves: every flow step names a screen that exists, every screen is
reached by at least one flow, every fork names where both branches go, every flow names all
seven fields, and every flow traces to a persona or journey of the hub. Smoke-tested both
ways — a good doc passes, a broken one fails with a named reason.

## Two things a reviewer should know

1. `standards/schemas/product-os/lens/ux.yaml` carries a `LOCKED #434` marker. It was
   updated to match the new contract — leaving it stating the old one would be worse. Say so
   if that lock meant more than "do not drift".
2. The deployed copies under `.claude/` still carry the four-section contract. They pick this
   up on the next `install-garura`, which is deliberately not part of this change.

## Self-review

# Self-Review — Issue #548

Source: `core/components/memory/standards/rules/self-review.md` (base, `is_override: false`,
resolved path recorded in `resolved-rules.json`).

Diff reviewed: `main..HEAD`, 7 commits, 23 files changed (17 source files + 6 STM context
artifacts).

**Verdict: PASS — 0 blocking findings.**

## What the change is

`/ux` used to write a UX lens with four sections (Intent/Screens/States/Visual core) and no
flows — a screen catalogue, not something a UX researcher could actually review. This change
adds a fifth section, Flows, and a per-screen "one object" field: every screen now names the
one thing the user works with there, and every flow is a fixed-order block (Persona, Goal,
Entry, Steps, Decisions, Failure, Exit) tied to one persona and one goal. This is an intent
change — the play's ICE source was edited and recompiled, and the edit propagates through the
lens contract, ten copies of the structural linter's heading list, a new mechanical flow
cross-check script, the authoring skill, and the dispatching agent's routing table.

## Scope checks

- **Matches the issue.** Every one of the 17 source files touched is part of the stated
  propagation chain: ICE → compiled SKILL.md → lens contract (`ux.yaml` + grounding doc
  template) → 10 `lint_grounding.py` heading lists → `validate_ux.py` → `author-ux-lens` skill
  → `product-os-keeper` agent routing table. Nothing outside that chain was touched.
- **No scope creep.** Confirmed no unrelated files in `git diff --name-only main..HEAD`.
- **Reasonable size.** ~880 lines added across 7 commits, each commit a single coherent step
  (contract, linter, validator, authoring skill) — reviewable in one sitting.
- **No stray artifacts.** No commented-out code, debug prints, or scratch files. Grep for
  `TODO|FIXME|console.log|debugger|XXX` in the diff returned nothing.

## Quality checks

- **Tests present (mechanical).** The new flow cross-check is code, not prose: `validate_ux.py`
  gained a `check_flows()` function (parses `## Screens` / `## Flows`, verifies every flow
  names all 7 fields, every step resolves to a real screen, every screen is reached by ≥1 flow
  step, and every decision names both branches) plus a manifest-side grounding check
  (`C14/F15`: a flow's persona must trace to a real persona/journal source). Read the full
  ~250-line addition; the logic is internally consistent — field parsing, screen matching
  (exact + normalized substring), and unreachable-screen detection all tie back into the error
  list correctly, and it degrades to a warning (not silently skipped) when `--lens` is omitted.
- **Commits are clean.** All 7 commits are conventional-format, each a single concern, each
  referencing `#548` (`git log --format` verified).
- **No secrets.** Diff scanned for credential/key/token patterns — only match is a doc string
  describing the *absence* of secrets in an evidence template; no actual sensitive value in
  the diff.
- **Docs in step.** The interface-facing docs (agent routing table, ICE, SKILL.md, lens
  contract, grounding-doc template) were all updated in the same change; nothing was left
  describing the old four-section shape.
- **Nothing obviously broken.**
  - `shasum -a 256 core/components/plays/ux/reference/ice.md` → matches the fingerprint
    recorded in the compiled `SKILL.md` (`sha256:bb3f495716...`).
  - `python3 .claude/skills/play-editor/scripts/lint_play.py core/components/plays/ux/SKILL.md`
    → `VERDICT: PASS (0 gap(s))` — constraints/failures/scenarios/recovery are 1:1, no orphans
    (C1–C14, F1–F15, S1–S7, one recovery per failure, all confirmed by the linter itself, not
    just visual read).
  - The ten `lint_grounding.py` copies (agentic, arch, grill, learn, marketing, measure,
    quality, run, ux, vision) carry the exact same one-line diff — `"h2": [...States...]` →
    `"h2": [...Flows, States...]` — confirmed by diffing each file individually; no other
    drift in any copy.

## Project notes (recorded, not flagged)

- `standards/schemas/product-os/lens/ux.yaml` carries a `LOCKED #434` marker and was updated to
  match the new five-section contract — deliberate, per project note.
- Deployed copies under `.claude/` are intentionally stale until `install-garura` runs after
  merge — deliberate, per project note.

## Evidence

- `shasum -a 256 core/components/plays/ux/reference/ice.md` = fingerprint in `SKILL.md` line 536.
- `python3 .claude/skills/play-editor/scripts/lint_play.py core/components/plays/ux/SKILL.md` = PASS, 0 gaps.
- `git diff main..HEAD -- core/components/plays/*/scripts/lint_grounding.py` = identical one-line change across all 10 copies.
- `git diff main..HEAD -- core/components/plays/ux/scripts/validate_ux.py` = read in full; logic reviewed for correctness.
- `git log main..HEAD --format="%H%n%s%n%b%n---"` = 7 commits, all conventional, all reference #548.
- Secret/debug grep over the diff = no hits.

---

Closes #548
