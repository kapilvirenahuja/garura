---
name: draft-play-expectation
description: Generate a play's Expectation artifact (success_scenarios + recovery) from its Intent triple, following the expectation-generation rules. Produces expectation.yaml with vetted.status pending — a human approves it at the create-play checkpoint. This is the PLAY case, not the runtime feature case. Used by the expectation-crafter agent inside create-play.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# draft-play-expectation

Generates the Expectation layer for a **play** from its Intent triple. The
companion to `author-intent-yaml` on the Expectation side of ICE. Owns no judgment
of its own — it applies the rules in
`core/components/memory/standards/rules/expectation-generation.md`.

This is the **play** generator (a play's intent → that play's expectation). The
runtime **feature** generator (a feature's intent + codebase → its expectation) is a
separate skill.

## Purpose

Take a play's `reference/intent.yaml` and produce `reference/expectation.yaml` with
two parts — `success_scenarios` and `recovery` — so the Intent stays the clean triple
while the testable and recoverable parts live one layer down. The output is a draft:
`vetted.status: pending` until a human approves it.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `intent_path` | yes | Path to the play's `reference/intent.yaml` |
| `output_path` | yes | Where to write `expectation.yaml` (typically the play's `reference/expectation.yaml`) |
| `rules_path` | no | Override for the generation rules (default `core/components/memory/standards/rules/expectation-generation.md`) |

## Process

1. **Read the rules** at `rules_path`. They govern every decision below — do not
   improvise beyond them.

2. **Read the intent.** Detect the input shape:
   - *Migrated* — triple only (intent, constraints, failure_conditions).
   - *Legacy* — also carries a `scenarios:` block. Lift those scenarios as the basis
     for success scenarios; never discard authored intent.

3. **Generate `success_scenarios`** per the rules: one per distinct consumer/outcome,
   each with persona / given / then / measure. For legacy intent, carry each existing
   scenario forward and add the missing `measure`. The `measure` must be observable
   and binary — the scenario eval is compiled from it.

4. **Generate `recovery`** per the rules: exactly one entry per failure condition in
   the intent. For each, set `for_failure`, `trigger` (F as an observable symptom),
   `direction` (the inverse of F, as directional guidance — never implementation),
   `handoff` (apply the autonomous-vs-human test from the rules), and
   `derivable_at_l4` (true for autonomous, false for human).

5. **Stamp provenance.** Set `generated_from.intent` to the intent path and
   `vetted.status: pending`. Never emit `approved` — only a human sets that at the
   checkpoint.

6. **Write** `expectation.yaml` to `output_path`.

## Output

```yaml
name: <play name>
generated_from:
  intent: <intent_path>
vetted:
  status: pending
success_scenarios:
  - id: S1
    persona: <consumer role>
    given: <artifact received>
    then: <outcome>
    measure: <observable, binary>
recovery:
  - id: REC1
    for_failure: <F-id>
    trigger: <symptom>
    direction: <directional guidance, not code>
    handoff: autonomous | human
    derivable_at_l4: <bool>
```

Return: `expectation_path`, counts (`success_scenarios`, `recovery`), the input shape
detected (migrated | legacy), and `status: written`.

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| intent.yaml missing/unreadable | I/O | `status: failed, reason: missing_intent` |
| intent has no failure_conditions | malformed intent | `status: failed, reason: no_failure_conditions` (recovery cannot be generated) |
| rules file missing | I/O | `status: failed, reason: missing_rules` |
| output path unwritable | I/O | `status: failed, reason: output_write_error` |

## Boundaries

- Reads `intent_path` and `rules_path`; writes ONLY `output_path`.
- Never edits intent.yaml, never compiles SKILL.md, never sets `vetted.status: approved`.
- Applies the generation rules verbatim — it does not author new routing policy.
- One recovery entry per failure condition — no more, no fewer.
