---
id: review/adrs
title: "Reviewing decision records (ADRs)"
conditions:
  recognises: "the PR adds or changes an architecture decision record"
  signals: ["docs/**/adr/*.md", "docs/adr/**", "**/decisions/*.md", "files titled 'ADR-' or with Status/Context/Decision/Consequences sections"]
provenance: "seeded:#443"
---

# Reviewing decision records (ADRs)

## Topic
How to review an architectural decision record — a human-signed record of a choice and its
consequences.

## Recognise
The diff adds or edits a markdown file that records a decision: it has the decision-record
shape (a status, the context, the decision, the consequences) or sits under an `adr/` or
`decisions/` path. Path is a hint, not proof — judge the content.

## Treatment
- **Reviewer:** human, line by line. The human judges whether the decision is *right*.
- **Layers:** Layer 1 only.
- **Linter:** a *true* structural linter — are the required sections present, is the status
  field one of the allowed values, is the markdown well-formed, is the ADR numbered and
  linked from the index. It checks the template, never the merit. **Gap:** no ADR linter
  exists in-repo yet; until built, the structural check is a manual checklist the tool
  surfaces for the human.
- **Design-grounding:** no. The decision *is* the design; there is no prior principle to
  conform to. The human owns the judgement.

## Rationale
A linter that tried to judge "is this a good decision" would be guessing. The only objective
thing about an ADR is its shape, so that is all the linter touches; the substance is a human
call. This keeps the tool honest and the authority where it belongs.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category A).
