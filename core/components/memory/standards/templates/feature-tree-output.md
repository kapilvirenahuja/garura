# Product State

{domain-slug}
  {capability-slug}
    {feature-id} : [#{issue}] {short-description} {status-emoji} [{status}]
    {feature-id} {short-description} {status-emoji} [{status}]
  {capability-slug}
    (no features yet)
────────────────────────────────────────────────────────────
{domain-slug}
  (no capabilities yet)

## Slot rules

- `{domain-slug}` — render `domain.slug` verbatim. No prefix, no decoration.
- `{capability-slug}` — render `capability.slug` verbatim, indented 2 spaces.
- `{feature-id}` — render `feature.id` verbatim, indented 4 spaces.
- `: [#{issue}]` — include this exact substring (with leading space and colon) **only when** `feature.issue` is present. Otherwise omit the substring entirely — including the leading space and colon. The feature row then reads `{feature-id} {short-description} {status-emoji} [{status}]`.
- `{short-description}` — first sentence of `feature.notes`, stripped. Fallback to `feature.name`. A sentence ends at the first `.`, `!`, or `?` followed by whitespace or end-of-string.
- `{status}` — `feature.status` verbatim. If missing, render `unknown`. The surrounding brackets are always present.
- `{status-emoji}` — the emoji for `feature.status` from the table below. Always present on feature rows; immediately precedes the `[{status}]` slot.

## Status emoji map

| Status        | Emoji |
|---------------|-------|
| `planned`     | 📋    |
| `development` | 🛠️    |
| `rollout`     | 🔄    |
| `released`    | ✅    |
| `cleanup`     | 🧹    |
| `unknown`     | ❓    |

If a feature carries a status string outside this map (shouldn't happen per feature-catalog.md Rule 4, but defensive), render `❓` and keep the verbatim `[{status}]`.

## Domain separator

After the last row of every domain **except the last**, emit one separator line of 60 em-dash/box-drawing characters at column 0:

```
────────────────────────────────────────────────────────────
```

Do not emit a separator before the first domain, and do not emit one after the final domain. The separator makes scanning the tree by domain easier when the catalog has many features.

## Empty-branch rules

- A capability with no features emits one child line `(no features yet)` at 4-space indent.
- A domain with no capabilities emits one child line `(no capabilities yet)` at 2-space indent.

## Order

Preserve document order from YAML. Do not sort.
