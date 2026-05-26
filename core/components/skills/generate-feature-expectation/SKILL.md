---
name: generate-feature-expectation
description: Generate a FEATURE's Expectation artifact (success_scenarios + recovery) at runtime from the feature's Intent triple PLUS its Context bundle, following the feature-expectation-generation rules. Produces expectation.yaml with vetted.status pending — approved at the craft-ice checkpoint subject to the human-in-the-loop configuration. This is the runtime FEATURE case, NOT the play case (use draft-play-expectation for plays). Used by the expectation-crafter agent inside the craft-ice play whenever a feature/epic intent needs its Expectation layer generated.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# generate-feature-expectation

Generates the Expectation layer for a **feature** from its Intent triple and its
Context bundle. The runtime sibling of `draft-play-expectation` on the Expectation
side of ICE. Owns no judgment of its own — it applies the rules in
`core/components/memory/standards/rules/feature-expectation-generation.md`.

This is the **feature** generator (a feature's intent + codebase/domain context → that
feature's expectation). The **play** generator (a play's intent → that play's
expectation) is the separate `draft-play-expectation` skill. They are siblings, not
substitutes — the difference is real: a feature's personas are runtime actors and its
measures are testable system behaviors, grounded in Context the play case never reads.

## Purpose

Take a feature's `intent.yaml` (the clean triple) and its assembled Context bundle and
produce an `expectation.yaml` with two parts — `success_scenarios` and `recovery` — so
the feature's Intent stays the clean triple while the testable and recoverable parts
live one layer down. The output is a draft: `vetted.status: pending` until it is
approved at the craft-ice checkpoint (a human approves when the human-in-the-loop
configuration is ON).

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `intent_path` | yes | Path to the feature's `intent.yaml` (the clean triple) |
| `context_path` | no | Path to the assembled Context bundle (a file or a directory). When absent or empty, still generate, but flag `context_grounding: low` in provenance so the reviewer knows personas/measures were derived from the intent alone |
| `output_path` | yes | Where to write `expectation.yaml` |
| `rules_path` | no | Override for the generation rules (default `core/components/memory/standards/rules/feature-expectation-generation.md`) |

## Process

1. **Read the rules** at `rules_path`. They govern every decision below — do not
   improvise beyond them.

2. **Read the intent** at `intent_path`. Confirm it is the clean triple (intent,
   constraints, failure_conditions). If it has no `failure_conditions`, stop —
   recovery cannot be generated (see Failure Modes).

3. **Read the Context bundle** at `context_path` if provided. When it is a directory,
   read the files within it (project scout summary, domain research, codebase
   integration notes). Extract the runtime ACTORS the capability serves and the
   integration points the behavior touches — these ground the personas and measures.
   When `context_path` is absent or yields nothing usable, record
   `context_grounding: low`.

4. **Generate `success_scenarios`** per the rules: one per distinct actor-outcome pair
   the intent goal and Context surface. Each carries `persona` (a runtime actor
   grounded in Context, never a demographic), `given` (the runtime precondition), `then`
   (the observable outcome — an outcome, not a process), and `measure` (observable,
   binary, assertable by a test). Pull quantified limits/formats/thresholds from the
   intent's constraints into the measures where they exist.

5. **Generate `recovery`** per the rules: exactly one entry per failure condition in
   the intent. For each, set `for_failure`, `trigger` (F as an observable runtime
   symptom), `direction` (the inverse of F as directional guidance — graceful
   degradation/guard/fallback, never implementation), `handoff` (apply the
   autonomous-vs-human test from the rules), and `derivable_at_l4` (true for
   autonomous, false for human).

6. **Stamp provenance.** Set `generated_from.intent` to the intent path,
   `generated_from.context` to the context path (or `none`), `context_grounding`
   (`high`/`medium`/`low`), and `vetted.status: pending`. Never emit `approved` — only
   the craft-ice checkpoint sets that.

7. **Write** `expectation.yaml` to `output_path`.

## Output

```yaml
name: <feature name or id>
generated_from:
  intent: <intent_path>
  context: <context_path | none>
context_grounding: high | medium | low
vetted:
  status: pending
success_scenarios:
  - id: S1
    persona: <runtime actor grounded in context>
    given: <runtime precondition>
    then: <observable outcome>
    measure: <observable, binary, test-assertable>
recovery:
  - id: REC1
    for_failure: <F-id>
    trigger: <runtime symptom>
    direction: <directional guidance, not code>
    handoff: autonomous | human
    derivable_at_l4: <bool>
```

Return: `expectation_path`, counts (`success_scenarios`, `recovery`),
`context_grounding`, and `status: written`.

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| intent.yaml missing/unreadable | I/O | `status: failed, reason: missing_intent` |
| intent has no failure_conditions | malformed intent | `status: failed, reason: no_failure_conditions` (recovery cannot be generated) |
| rules file missing | I/O | `status: failed, reason: missing_rules` |
| output path unwritable | I/O | `status: failed, reason: output_write_error` |

A missing or thin Context bundle is NOT a failure — it downgrades `context_grounding`
to `low` and the generation proceeds from the intent alone.

## Boundaries

- Reads `intent_path`, `context_path`, and `rules_path`; writes ONLY `output_path`.
- Never edits the feature intent, never compiles anything, never sets
  `vetted.status: approved`.
- Applies the generation rules verbatim — it does not author new routing policy.
- One recovery entry per failure condition — no more, no fewer.
- Personas are runtime actors grounded in Context, never demographics, never plays or
  agents.
