# Product State

{domain-slug}
  {capability-slug}
    {feature-id} : [#{issue}] {short-description} [{status}]
    {feature-id} {short-description} [{status}]
  {capability-slug}
    (no features yet)
{domain-slug}
  (no capabilities yet)

## Slot rules

- `{domain-slug}` — render `domain.slug` verbatim. No prefix, no decoration.
- `{capability-slug}` — render `capability.slug` verbatim, indented 2 spaces.
- `{feature-id}` — render `feature.id` verbatim, indented 4 spaces.
- `: [#{issue}]` — include this exact substring (with leading space and colon) **only when** `feature.issue` is present. Otherwise omit the substring entirely — including the leading space and colon. The feature row then reads `{feature-id} {short-description} [{status}]`.
- `{short-description}` — first sentence of `feature.notes`, stripped. Fallback to `feature.name`. A sentence ends at the first `.`, `!`, or `?` followed by whitespace or end-of-string.
- `{status}` — `feature.status` verbatim. If missing, render `unknown`. The surrounding brackets are always present.

## Empty-branch rules

- A capability with no features emits one child line `(no features yet)` at 4-space indent.
- A domain with no capabilities emits one child line `(no capabilities yet)` at 2-space indent.

## Order

Preserve document order from YAML. Do not sort.
