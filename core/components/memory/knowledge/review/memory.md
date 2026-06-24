---
id: review/memory
title: "Reviewing memory / knowledge base"
conditions:
  recognises: "the PR changes the long-term knowledge the agents read"
  signals: ["core/components/memory/**", "memory/knowledge/**", "memory/standards/**", "knowledge shelves, standards rules, schemas, templates"]
provenance: "seeded:#443"
---

# Reviewing memory / knowledge base

## Topic
How to review the long-term knowledge the agents read — knowledge shelves, standards rules,
schemas, and templates under `memory/`.

## Recognise
The diff changes a knowledge shelf (`knowledge/**`), a standards rule (`standards/rules/**`),
a schema, or a template. These shape what every downstream agent believes, so they get the
same depth as harness code.

## Treatment
- **Reviewer:** human (the design) + tool (conformance).
- **Layers:** Layer 1 **and** Layer 2.
- **Linter (Layer 1):** path / cross-reference / structure integrity — does each shelf file
  follow `_TEMPLATE.md` (Topic, Conditions, Recommendation, Rationale, Evolve when,
  Provenance); do `evolve_when` and `[[...]]` cross-references resolve to real files; is the
  frontmatter `id` consistent with the path; is it listed in the shelf `_index`. **Gap:** a
  dedicated memory-integrity linter is partial (`lint-components` covers some shape); the
  cross-reference resolution check is to be built. Until then the tool runs these checks and
  cites each.
- **Design-grounding (Layer 2):** **yes.** Reconstruct what the knowledge base is *for* and
  how a shelf is meant to be shaped from **committed** sources — `knowledge/_DESIGN.md`,
  `knowledge/_index.md`, `knowledge/_TEMPLATE.md`, and the relevant standards — never from the
  branch's new shelf text. Then check the changed memory for conformance (is a learning truly
  conditional, does it earn its shelf, does it duplicate an existing learning, does the
  severity taxonomy stay mechanical).
- **Rubric:** does the change fit the shelf's purpose, follow the template, resolve its
  cross-references, and avoid duplicating or contradicting existing knowledge.

## Rationale
Memory is read by every agent; a wrong or self-justifying entry propagates silently. Grounding
the "what good knowledge looks like" rules from the committed design — not from the new entry —
is what stops a bad shelf from rationalising itself.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category D).
