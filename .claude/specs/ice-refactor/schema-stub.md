# ICE Schema Stub — reality check (DRAFT, not the real schema yet)

Purpose: prove the ICE model survives contact with a concrete contract before
cascading the refactor. If this fits, Phase 1b/1c and Phase 2 proceed with
confidence. This is a stub — Phase 2 (T9) promotes it to the real schema files.

## Intent schema — trimmed to the triple

```yaml
# METADATA
name: <string>
description: <string>
version: <string>
checksum: <string>          # sha256 of content zone

# CONTENT — three fields only (scenarios REMOVED, now in Expectation)
intent: <string>            # goal — the outcome we want
constraints:
  - id: <C1...>
    rule: <string>
failure_conditions:
  - id: <F1...>
    condition: <string>
```

Change from today: the `scenarios` block leaves intent.yaml entirely.

## Expectation schema — new

```yaml
# METADATA
name: <string>              # matches the intent / play name
version: <string>
checksum: <string>
generated_from:
  intent_checksum: <string>   # the Intent this was generated against
  context_digest: <string>    # what Context was in scope at generation
vetted:
  status: pending | approved  # never governs anything while pending
  approved_by: <string>
  approved_at: <ISO-8601>

# CONTENT — the three E buckets
success_scenarios:          # acceptance AND the checkable definition of done — one bucket
  - id: <S1...>
    persona: <string>
    given: <string>
    then: <string>          # what the consumer can do = the done-target
    measure: <string>       # how "met" is decided — the eval is built from this

recovery:                   # per failure condition, the validator's recovery policy
  - id: <REC1...>
    for_failure: <F-id>     # the Intent failure condition this recovers from
    trigger: <string>       # the failure state the validator observes in eval results
    direction: <string>     # directional handoff toward a better state — NOT implementation
                            #   e.g. "UTs at 50%; failing list attached; raise to green"
    handoff: autonomous | human  # validator routes: auto-fix back to builder, or human review
    derivable_at_l4: <bool> # may intent-resolver execute the autonomous path without a human
```

## Does the model hold?

- **Success scenarios carry a `measure`** → that is exactly what the eval author
  compiles the encrypted eval from. The builder sees the scenario (the target) but,
  when the barrier is on, never the eval. Acceptance and done-target are one bucket —
  no scenarios/success split. ✓
- **Recovery is the validator's instrument:** it maps to a failure condition via
  `for_failure`; the validator consumes it (with eval results) to emit a *recovery
  handoff plan* — directional, not code — and `handoff` routes each case to an
  autonomous fix (back to the builder) or a human manual review. `derivable_at_l4`
  flags which autonomous paths `intent-resolver` can execute without a human. The
  builder sees only the resulting plan, never the recovery conditions. ✓
- **`generated_from` + `vetted`** capture "generated from Intent + Context, then
  human-vetted at a checkpoint." ✓

Locked: scenarios and success are **one bucket** (`success_scenarios`) — no split,
ever. The barrier (encrypted evals, builder-blind) is **optional** — applied for
the heavy lifting of coding, skipped for mechanical single-output work, which runs
the validator as a plain regression check.

Verdict: model fits a concrete schema. Safe to cascade Phase 1b/1c.
