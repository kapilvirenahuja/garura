# PR Review Comment Template

Canonical shape for the structured review comment posted to a PR by the `review-pr` play. Every `review-pr` run instantiates this template. The `<!-- review-pr:marker -->` sentinel is required — it enables in-place updates when the play runs again on the same PR.

Consumers: `review-pr`.

## Shape

```markdown
## review-pr — PR #{pr_number}

**Confidence:** {value} (threshold {threshold}) — routing **{block|escalate|pass}**

### P1 — Blockers ({n})
- `{file}:{line}` — `{standard_id}` — {evidence}

### P2 — Major ({n})
- ...

### P3 — Minor ({n})
- ...

### P4 — Advisory ({n})
- ...

### Reviewers requested
- {selected_reviewers list}

<!-- review-pr:marker -->
```

## Field Rules

| Field | Required | Rule |
|-------|----------|------|
| `pr_number` | yes | The PR number from GitHub. |
| `confidence.value` | yes | Numeric value (0.0–1.0). Computed by `quality-check-scoped`. |
| `confidence.threshold` | yes | The threshold configured for the project. |
| `routing` | yes | Exactly one of: `block`, `escalate`, `pass`. |
| `P1 section` | yes | Always include header with count, even if `({n})` is 0. |
| `P2 section` | yes | Always include header with count. |
| `P3 section` | yes | Always include header with count. |
| `P4 section` | no | Include only when P4 findings exist. |
| `reviewers` | yes | At least one reviewer if routing is `block` or `escalate`. May be empty list for `pass`. |
| `<!-- review-pr:marker -->` | yes | REQUIRED. Must appear at the end of the comment. Enables in-place updates — the agent searches for this sentinel to identify an existing review-pr comment and update it rather than posting a duplicate. |

## Update Behavior

The `review-pr` play searches PR comments for the `<!-- review-pr:marker -->` sentinel:
- Found → update in place via `platform-adapter update-comment` (verb: `update-comment`, args: `{comment_id, body}`)
- Not found → post new comment via `platform-adapter comment-pr` (verb: `comment-pr`, args: `{pr_number, body}`)

## Related

- `schemas/pr-findings.yaml` — schema for the `findings.yaml` artifact that feeds this template
- `rules/pr.md` — PR severity taxonomy defining P1–P4 categories
- `templates/pr-body.md` — PR body shape (created before this comment is posted)
