# Functionality Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a functionality's `functionality.md`. A functionality is a
> **function, not a story** — describe what it does, never "as a user I want". It is
> the **most detailed** level: it must read richer than its capability, never leaner.
> The linter enforces the heading set; the eval scores depth, self-explanation, and
> the depth-gradient against `_content-standard.md`. Written by `/shape`, refined by
> `/understand`.

## Heading contract (required, in order)

```
# Functionality: <Functionality Name>
## What it does
## Inputs / Outputs
## Rules & behavior
## Acceptance criteria
## Out of scope
```

## Per-section guidance

- **What it does** — the function's behavior in concrete terms: when it runs, on
  what, and what it produces. Precise, not a one-liner.
- **Inputs / Outputs** — what it consumes and what it emits, named explicitly enough
  that a builder knows the shape without guessing.
- **Rules & behavior** — the logic, states, and edge cases: every meaningful branch
  and what happens at it. This is where the detail is densest.
- **Acceptance criteria** — Given / When / Then, concrete and testable. These are the
  conditions that say "done".
- **Out of scope** — what this function does *not* do, naming the neighbour that owns
  each excluded concern.

## Gold example

```markdown
# Functionality: Privacy & trust labeling

## What it does
Scans every collected record for private content and stamps each with its trust state
before the record is eligible for any shared view. It runs at collection time, on
every record, as a mandatory gate — nothing reaches a shared row unlabeled, so the
privacy guarantee is enforced once and cannot be skipped downstream.

## Inputs / Outputs
- In: a collected usage record — its source, burn fields, elapsed time, execution
  context, and references to the raw evidence it came from.
- Out: the same record stamped with privacy state (clean, or privacy-blocked with a
  reason), source fidelity, evidence state, and correction status; any unsafe field
  is masked in place. The record's shape is preserved; only its labels and masking change.

## Rules & behavior
- Blocked categories are: raw prompts, raw payload bodies, local paths, repo paths,
  client names, private project names, ticket ids, emails, account ids, secrets,
  cookies, API keys, and environment values.
- If any field matches a blocked category, the record is marked privacy-blocked with
  the reason and the offending field is masked — but the rest of the record still
  flows, so a single sensitive field does not discard otherwise useful usage data.
- A record with no blocked content is stamped privacy state = clean and keeps all
  its fields.
- Labeling never drops a record. Even a fully blocked record remains in the dataset
  as a labeled state, because a vanished record reads as "no usage" and lies about coverage.

## Acceptance criteria
- Given a record containing a raw prompt, path, secret, or client name, when it is
  labeled, then the offending field is masked and the record is marked privacy-blocked
  with a visible reason.
- Given a record with no private content, when it is labeled, then it carries privacy
  state = clean plus source fidelity, evidence state, and correction status.
- Given a fixture holding one example of every blocked category, when the scan runs,
  then every example is blocked and none passes through.

## Out of scope
- Rolling the labeled record into any view — Usage Rollups owns presentation.
- Deciding source-specific burn formulas — Source & usage ingest owns extraction.
```
