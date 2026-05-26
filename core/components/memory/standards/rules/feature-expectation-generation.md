# Feature Expectation Generation Rules

How the harness generates a **feature's** Expectation (`success_scenarios` +
`recovery`) from its Intent triple **and its Context bundle**. Consumed by the
`generate-feature-expectation` skill. Output is always human-validated at the
craft-ice approval checkpoint (subject to the human-in-the-loop configuration) —
these rules exist to make the generation reviewable, not magic.

> Scope: this is the **feature** case (a feature's intent + codebase/domain context →
> that feature's expectation). The **play** case (a play's intent → that play's
> expectation) is a separate generator with separate rules in
> `expectation-generation.md`. The two are siblings, not substitutes.

## What makes the feature case different from the play case

1. **Context is a first-class input.** The play generator works from the intent
   triple alone. The feature generator additionally reads a Context bundle (project
   scout + domain research + codebase integration signals). Personas and measures are
   grounded in that Context — real actors who use the capability, real integration
   points the behavior touches — not invented from the goal.
2. **Personas are the feature's actors, not the artifact's consumers.** A play's
   personas read the play's output. A feature's personas USE the capability at runtime
   — end users in a named role, an API/integration consumer, an operator, a
   downstream system. Derive them from the Context, never as demographics.
3. **Measures are testable runtime behaviors.** A feature `measure` must be observable
   in the running system and binary — the kind of statement a Tier-A/B/C verification
   test can later assert. "Returns 200 with the created record" is a measure; "works
   well" is not.

## Input shapes

`generate-feature-expectation` accepts:
1. **Feature intent** — the clean triple (intent, constraints, failure_conditions).
2. **Context bundle** — the assembled grounding (a file or directory). When absent or
   thin, the generator still produces an expectation but flags
   `context_grounding: low` in provenance so the reviewer knows personas/measures were
   derived from the intent alone.

## Success scenarios

- Derive from the feature's intent goal AND the actors named/implied in the Context
  bundle. One per distinct actor-outcome pair — never split acceptance from the
  done-target; they are one bucket.
- Each entry: `persona` (a runtime actor grounded in Context), `given` (the runtime
  precondition / what the actor brings), `then` (the observable outcome they get — an
  outcome, not a process), `measure` (observable and binary, assertable by a test —
  the verification scenario is later compiled from this).
- The `measure` is the load-bearing addition: it must be checkable in the running
  system without human opinion. Prefer concrete, quantified statements drawn from the
  intent's constraints (limits, formats, thresholds) where they exist.
- Cover the primary success path for every distinct actor the Context surfaces. Do not
  enumerate edge cases here — edge/failure handling lives in `recovery`.

## Recovery — one entry per failure condition

For every failure condition `F` in the intent, emit exactly one recovery entry:

- `for_failure`: F's id.
- `trigger`: F restated as an observable runtime symptom (what a validator or the
  running system detects).
- `direction`: the **inverse of F** — the runtime state that must hold for F not to
  trip, phrased as directional guidance (graceful degradation, a guard, a safe
  fallback). Never implementation, never code.
- `handoff`: routed by the handoff rule below.
- `derivable_at_l4`: `true` for autonomous entries the runtime can execute without a
  human; `false` for human entries.

### The handoff rule (autonomous vs human)

Identical test to the play case — kept in sync deliberately:

- **`autonomous`** when recovering is **mechanical** — a deterministic transform the
  builder already controls: re-running, filling a missing field, correcting a format,
  applying a documented fallback. No new external judgment required.
- **`human`** when recovering needs **judgment or authority the builder does not
  hold** — choosing among genuinely ambiguous options, mapping to an external entity
  (an issue, an owner, a system of record), granting an approval, or any
  irreversible / outward-facing decision.

**The test:** "Can the builder fix this from information it already has,
deterministically?" Yes → `autonomous`. No → `human`.

## Provenance

Every generated feature expectation carries:
- `generated_from.intent` — the feature intent it was derived from.
- `generated_from.context` — the Context bundle it was grounded in (or `none` with
  `context_grounding: low` when absent).
- `vetted.status: pending` — set to `approved` only at the craft-ice approval
  checkpoint. When the human-in-the-loop configuration is ON, a human sets it; when
  OFF, the play may auto-approve per its configured policy. Nothing downstream
  consumes a `pending` expectation.
