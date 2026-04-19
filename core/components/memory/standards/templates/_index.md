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
| `commit-message.md` | Canonical commit message shape — `<type>(<scope>): <subject>` format, field rules, and related pointer to `rules/commits.md` quality rules. | `create-commit`, `analyze-changes`, `commit-code`, `repo-orchestrator` |
| `pr-body.md` | Canonical PR body shape — Summary, Quality Checklist (Required/Optional), Verification Evidence table, Eval Results (conditional), generated-by footer. Includes Eval Results instantiation rules. | `submit-pr`, `analyze-pr` |
| `pr-review-comment.md` | Canonical PR review comment shape — `<!-- review-pr:marker -->` sentinel (required), Confidence line, P1–P4 sections with counts, Reviewers section. Supports in-place update detection via marker. | `review-pr` |
| `delivery-report.md` | Canonical human-readable delivery report — Run Summary (play, issue, status, timestamps), Pipeline Steps table, Artifacts Produced table, Next Steps (optional). Per-play field notes for ship, fix-it, implement-epic. | `ship`, `fix-it`, `implement-epic`, every play that closes with a delivery step |

## Scope Notes

- **`issue-list.md`** — Considered and deferred as of #209 closure. `templates/_index.md` requires a template to be "instantiated by at least one skill or play." No play currently renders a user-facing issue list (`gh issue list` is used only for existence checks). Deferred until a play is built that renders issue lists to users.
- **`pr-findings.yaml`** — Routed to `standards/schemas/` rather than `templates/`. It is a typed YAML schema contract with field-level constraints, rejection rules, and sort-order requirements — it belongs in `schemas/` per the category rule ("YAML schema contracts belong in `schemas/`"), not in `templates/`.

## When to Add Here

A file belongs in `templates/` if:
- It defines the shape/structure of an output artifact
- It is instantiated by at least one skill or play
- It answers "what should this look like?" / "what fields go where?"

A file does NOT belong here if:
- It defines WHICH artifacts to produce (that's play / skill contract territory)
- It defines rules for artifact content (that's `rules/`)
- It is a YAML schema contract (that's `schemas/`)
