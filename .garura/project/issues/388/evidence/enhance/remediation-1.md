# Remediation 1 — #388

## Failing eval

**E5 — Connections doctrine appears at most once and only as a pointer.**

Tester evidence (iteration 2): `core/components/memory/standards/rules/builder-isolation.md` contains the word "Connections" three times — at lines 23, 82, and 84. The eval requires at most one appearance across doctrine surfaces.

## What to fix

Reduce the three mentions to one. The principle: Connections must appear in the new rule file as a single one-line pointer to a future issue, and not be named anywhere else in the same file.

Concrete edits in `core/components/memory/standards/rules/builder-isolation.md`:

1. **Line 23** — currently contains a one-clause aside that names Connections (e.g., "Recovery entries belong to the Expectation artifact. Connections are on a different..."). Rewrite that sentence to drop the word "Connections" entirely. The surrounding doctrine ("Recovery entries belong to the Expectation artifact. Nothing else lives in Intent.") is enough — naming Connections at this point is gratuitous given the dedicated section 5 pointer.

2. **Lines 82–84** — currently a numbered/headed section "## Connections — pointer only" followed by a separate sentence that uses the word again. Collapse the section heading and the sentence into a single line that uses "Connections" exactly once. Two acceptable shapes:

   - Keep the heading but make it not contain the word — e.g., `## A note on linkage` followed by `Connections is conceptually part of Intent but lives on a different surface; its design is the subject of a future issue (TBD).` (one occurrence)
   - OR: remove the dedicated section entirely, and place the one-line pointer at the end of section 1 (the three-element Intent model section) as a closing sentence. The pointer line uses "Connections" once.

The second shape is cleaner — it keeps all the Intent-shape rules in one section and prevents a future contributor from being tempted to expand the pointer into a sub-doctrine. Prefer it unless there's a layout reason not to.

## What NOT to change

- Do not touch `core/components/agents/intent-resolver.md` or `core/components/agents/intent-crafter.md`. Their See-also lines do not mention Connections; they are correct as-is.
- Do not change the other five sections of `builder-isolation.md` (three-element model, compartmentation contract, HITL governor, decision rule + examples, provenance footer).
- Do not change the worked examples in the decision-rule section.

## Verification expectation

After the edit, `grep -c "Connections" core/components/memory/standards/rules/builder-isolation.md` should return `1`.
