# Self-Review Rules (base)

The default scope-and-quality self-review a change runs before it is raised for
review. The `propose-change` play resolves this file through the standards
hierarchy (`standards_order`, most-specific wins) and hands it to the self-review
skill — so the review is driven by these rules, never by logic hardcoded in the play.

**Overrideable per project.** This is the generic base. A project that wants its own
checks drops a `self-review.md` at a more-specific standards level; the resolver
prefers that project copy over this base. Keep project overrides as the same shape
(Scope + Quality check lists) so the self-review skill consumes them uniformly. The
base stays generic on purpose — project-specific and stack-specific judgment is added
at runtime by the analyzing skill on top of these rules.

The output is an informational checklist that travels in the PR. It is **not** the
approve/reject gate — that is `review-change`'s job. The self-review surfaces problems
early; it does not block the raise on its own.

## Scope checks

- **Matches the issue.** The change implements the tracked issue and nothing beyond
  it — no unrelated edits riding along.
- **No scope creep.** Files touched map to the issue's intent; flag any that don't.
- **Reasonable size.** The change is small enough to review in one sitting, or its size
  is justified in the PR description.
- **No stray artifacts.** No commented-out blocks, debug prints, scratch files, or
  generated output committed by accident.

## Quality checks

- **Tests present.** Behavior changes carry tests, or the PR states why none are needed.
- **Commits are clean.** Conventional-commit format, each commit a coherent concern,
  each referencing the issue.
- **No secrets.** No credentials, tokens, keys, or other sensitive values in the diff.
- **Docs in step.** User-facing or interface changes update the docs/README they affect.
- **Nothing obviously broken.** No leftover TODOs blocking the change's own goal, no
  known-failing paths introduced.

## Resolution (how `propose-change` picks the file)

1. Resolve `standards_order` from `.garura/core/config.yaml`.
2. Take the most-specific level's `self-review.md` if it exists (the project override).
3. Otherwise fall back to this base file.

The resolved path is recorded in the run so the self-review's source is auditable.
