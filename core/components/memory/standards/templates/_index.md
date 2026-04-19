# Templates

Canonical output-shape templates for artifacts the system produces — GitHub issues, approval prompts, checkpoint files, evidence files, knowledge files. Every skill that produces such an artifact instantiates the matching template instead of inlining its own prose.

Replaces the former `memory/formats/` directory (#209 + structural cleanup).

Agents and skills query this category when they need to know: **"What does the output artifact look like?"**

## Contents

| Path | Description | Consumers |
|------|-------------|-----------|
| `github-issue.md` | GitHub issue body template and field derivation rules | `manage-issue`, `project-orchestrator` |
| `approval-prompt.md` | Canonical Tether / Orbit / Vanish approval-prompt template. Every checkpoint-gated play instantiates this instead of inlining prompt text. | `specify-product`, `design-exp`, `build-arch`, `start-feature-planning`, `review-pr`, every checkpoint-gated play |
| `checkpoint.md` | Canonical checkpoint artifact format. Written by scriber alongside every approval prompt; retained as STM audit trail. | every checkpoint-gated play + `scriber` agent |
| `evidence-file.md` | Canonical evidence file format. Written by scriber at play close; contains step/scenario eval results, checkpoint decisions, recovery attempts, next consumers. | every play that closes with an evidence step + `scriber` agent |
| `knowledge-file.md` | Canonical knowledge-file template. Tier 1 (all files) and Tier 2 (core-scoped) metadata requirements, staleness rules, and index registration conventions. | `knowledge-extractor`, `capture-learning` |
| `issue-comment-rca-approved.md` | Canonical GitHub issue comment posted when a user approves an RCA + fix plan at the fix-it approval checkpoint; mirrors the decision from STM to the issue thread. | `fix-it`, future plays producing `rca.yaml` + `design.yaml` |

## Deferred follow-ups (#209)

These surfaces are named in issue #209 and need canonical templates, but are not yet authored. They should be created as the corresponding plays stabilize:

| Surface | Current location | Status |
|---------|------------------|--------|
| Commit message | `rules/commits.md` (rules, not template) | Not yet a canonical template |
| PR body / checklist | Inlined in `create-pr`, `submit-pr`, `analyze-pr` | Duplicated across plays |
| PR review structured comment | Inlined in `review-pr/SKILL.md` | Not extracted |
| PR severity findings | `findings.yaml` schema in `quality-check-scoped/reference/` | Exists as schema, not template |
| Final delivery report (ship) | Inlined per play | Not extracted |
| Issue list (gh issue list rendering) | Ad-hoc per skill | Not standardized |

## When to Add Here

A file belongs in `templates/` if:
- It defines the shape/structure of an output artifact
- It is instantiated by at least one skill or play
- It answers "what should this look like?" / "what fields go where?"

A file does NOT belong here if:
- It defines WHICH artifacts to produce (that's play / skill contract territory)
- It defines rules for artifact content (that's `rules/`)
- It is a YAML schema contract (that's `schemas/`)
