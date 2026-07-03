---
id: review/docs
title: "Reviewing documentation"
conditions:
  recognises: "the PR changes human-facing prose that is not a decision record"
  signals: ["docs/**", "README*", "CONTRIBUTING*", "CHANGELOG*", "**/*.md prose that is not a play/skill/agent/ADR/memory file"]
provenance: "seeded:#443"
---

# Reviewing documentation

## Topic
How to review human-facing prose — guides, READMEs, changelogs — that explains the system to
people.

## Recognise
The diff changes prose meant for a human reader, and it is **not** a decision record, a
harness file (play/skill/agent), or a memory file. If the markdown is the framework's own
"code" or knowledge, it belongs to the harness or memory category, not here.

## Treatment
- **Reviewer:** the tool. The human opts out unless they choose to read it.
- **Layers:** Layer 1 only.
- **Linter:** prose checks — spelling, grammar, dead/broken links, heading hierarchy,
  leftover TODOs, terminology consistency, completeness. **Gap:** no committed prose linter
  in-repo yet; reference a markdown linter + link checker, to be built. Until then the tool
  performs these checks directly and cites each as the basis.
- **Design-grounding:** no.

## Rationale
Documentation is fully owned by objective checks plus the tool's read. There is no external
design to conform to — correctness here means it is well-formed, consistent, and its links
resolve. Cheap to automate, low risk, so the human's attention is spent elsewhere.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category B).
