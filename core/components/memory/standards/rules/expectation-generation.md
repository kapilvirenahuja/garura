# Expectation Generation Rules

How the harness generates a **play's** Expectation (`success_scenarios` + `recovery`)
from its Intent triple. Consumed by the `draft-play-expectation` skill. Output is
always human-validated at the create-play checkpoint — these rules exist to make the
generation reviewable, not magic.

> Scope: this is the **play** case (a play's intent → that play's expectation). The
> runtime **feature** case (a feature's intent + codebase context → its expectation)
> is a separate generator and a separate set of rules.

## Input shapes

`draft-play-expectation` must accept two shapes:
1. **Migrated intent** — the clean triple (intent, constraints, failure_conditions), no scenarios.
2. **Legacy intent** — still carries a `scenarios:` block (pre-migration).

For legacy intent, lift the existing scenarios as the basis for success scenarios
(do not discard authored intent) and add the missing `measure` to each.

## Success scenarios

- Derive from the intent goal and the personas implied by the play's consumers
  (who reads or acts on the output).
- One per distinct consumer/outcome. Acceptance and done-target are **one bucket** —
  never split them.
- Each entry: `persona`, `given` (an artifact they receive), `then` (what they can
  do — an outcome, not a process), `measure` (observable and binary — what makes
  `then` true; the scenario eval is compiled from this).
- The `measure` is the load-bearing addition over a plain scenario: it must be
  checkable without human opinion.

## Recovery — one entry per failure condition

For every failure condition `F` in the intent, emit exactly one recovery entry:

- `for_failure`: F's id.
- `trigger`: F restated as an observable symptom (what the validator detects).
- `direction`: the **inverse of F** — the state that must hold for F not to trip,
  phrased as directional guidance toward it. Never implementation, never code.
- `handoff`: routed by the handoff rule below.
- `derivable_at_l4`: `true` for autonomous entries the runtime can execute without a
  human; `false` for human entries.

### The handoff rule (autonomous vs human)

This is the core routing decision, and the seed of `intent-resolver`'s runtime
recovery routing and Level 4 autonomous recovery.

- **`autonomous`** when recovering is **mechanical** — a deterministic transform of
  output the builder already controls: regrouping, rewording, re-staging, re-running,
  filling a missing field, correcting a format. No new external judgment required.
- **`human`** when recovering needs **judgment or authority the builder does not
  hold** — choosing among genuinely ambiguous options, mapping to an external entity
  (an issue, an owner), granting an approval, or any irreversible / outward-facing
  decision.

**The test:** "Can the builder fix this from information it already has,
deterministically?" Yes → `autonomous`. No (needs a human pick, an approval, or a
source of truth it cannot see) → `human`.

Worked example (commit-code): "a commit mixes concerns" → autonomous (regroup is
mechanical); "a commit references the wrong issue" → human (issue mapping is external
judgment); "a below-confidence mapping was committed without approval" → human
(approval is an authority the builder lacks).

## Provenance

Every generated expectation carries:
- `generated_from.intent` — the intent it was derived from.
- `vetted.status: pending` — set to `approved` only by a human at the create-play
  checkpoint. Nothing downstream consumes a `pending` expectation.
