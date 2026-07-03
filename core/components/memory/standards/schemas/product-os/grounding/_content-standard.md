# Grounding Content Standard — v1

The product model is two layers. The **spine** (a structured schema) holds the
skeleton machines navigate: ids, slugs, types, parent, status, refs, the profile,
and a one-line descriptor + pointer to each node's grounding doc. The **grounding**
layer is a set of Markdown docs a human reads to *understand* a node. This file is
the locked quality bar for that grounding layer.

Two guards enforce it, and they are different jobs:

- **The linter** enforces *shape*: every required heading present, in order, no
  invented headings, no empty required section, no bullet below a minimum substance
  floor. Mechanical, deterministic, fast. It cannot judge meaning.
- **The content-quality eval** enforces *understandability*: an LLM judge scores
  each doc against the rubric below and gates the play. This is the guard that keeps
  the writing from being a well-shaped pile of labels.

## The bar — what every section must clear

1. **Self-explaining.** Each item names the thing AND explains it — what it means,
   and why it matters or what it implies. A reader with no prior context understands
   it on its own. A label ("Local fixtures only") fails; the explained version
   ("The MVP runs from local fixtures because at this stage we are proving the
   collection model works on a laptop, not integrating live accounts — anything
   needing a credential is out") passes.

2. **Discrete, not narrative.** We do not write flowing story-prose. Each point is a
   complete, standalone thought — typically one to four sentences. Agile forms:
   acceptance criteria as Given / When / Then; a functionality describes the
   function's behavior, not an "as a user I want" story.

3. **Depth increases with tree depth.** A theme is broad; a capability is more
   specific; a functionality is the most concrete and detailed level — never leaner
   than its parent. If a functionality reads thinner than its capability, it fails.

4. **Links are real.** Every cross-reference (an epic's delivered functionalities, a
   capability's functionality list) names a node that exists in the spine. A dangling
   link fails.

5. **The stranger test (the overall gate).** Someone joining in three months reads
   the doc and can explain what the node is, why it exists, and where its edges are —
   without asking anyone. If they can't, the doc is not done.

## Eval rubric (the judge scores each, all must pass)

- **Completeness** — every required section is substantive, not placeholder.
- **Self-explanation** — each item carries the *why* / implication, not just the *what*.
- **Discreteness & form** — discrete points; Agile forms where required; no story-prose.
- **Depth gradient** — detail increases theme → capability → functionality.
- **Link integrity** — every reference resolves to a real spine node.
- **Stranger test** — a cold reader can explain the node's what, why, and edges.

A doc that clears shape (linter) but fails any rubric line is rejected by the eval —
the play does not proceed until it is rewritten to the bar.
