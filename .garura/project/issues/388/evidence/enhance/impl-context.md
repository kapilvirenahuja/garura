# Implementer Context — #388

Issue: #388 — Update Intent doctrine: 5 elements → 3, move Success Scenarios to Expectations.

This file is the implementer's authoritative spec. The implementer also reads `context/understanding.md` (which symlinks to the project's Context bundle for this work).

The implementer MUST NOT read evals, risks, alternatives_considered, the test-context, or any verification artifact. Verification is a separate dispatch.

## Solution summary

Update the framework's runtime intent resolver and two agent prompts so the three-element Intent doctrine is consistently carried at the agent layer, and introduce a single canonical KB rule file that codifies the builder-isolation contract. The work is doctrine-layer only — no compiled play SKILL.md is rebuilt and no `reference/intent.yaml` fixture is modified.

## Files to create

### `core/components/memory/standards/rules/builder-isolation.md`

A new rule file with these six required sections, in this order:

1. **The three-element Intent model.** State plainly: Intent is `goal` (one sentence, passes the two-implementations test), `constraints` (qualities of the outcome, business language, NFR-shaped, never implementation patterns), and `failure_conditions` (binary, observable, post-output checks). Nothing else lives in Intent.

2. **The compartmentation contract.** Describe the routing in one table:

   | Audience | Receives | Source |
   |---|---|---|
   | Builder agent | goal + constraints + Context bundle | `intent.yaml` + assembled Context |
   | Validator agent | failure_conditions + vetted `success_scenarios` | `intent.yaml` + approved `expectation.yaml` |

   State explicitly: the builder never receives success_scenarios under any circumstance. The rule is "the builder cannot teach to a test it cannot see."

3. **HITL configuration governs Expectation vetting.** State that per-play `hitl` config in `.garura/core/config.yaml` decides whether a human approves the generated Expectation or the system auto-approves and records it. There is no global "human must approve" rule. Reference `craft-ice.hitl` and `create-play.hitl` as the two current concrete instances.

4. **Constraint-vs-failure-condition decision rule.** State the rule verbatim: *"Would knowing this change how the builder writes code?"* — Yes → constraint, No → failure condition. Include at least one worked example. Suggested example: *"Unit test coverage must stay above 90%"* — would the builder write different code if it knew this? Only by gaming coverage — so it's a failure condition, not a constraint. Validator catches it post-output.

5. **Connections — pointer only.** Exactly one line: "Connections is conceptually part of Intent but lives on a different surface; its design is the subject of a future issue (TBD)." No further description.

6. **Provenance footer.** Two lines: a link to the originating StormCaller article (`~/cto/StormCaller/Content/articles/standalone/an-intent-is-three-things-the-goal.md`) and a link to issue #388.

Tone: plain language, machine-greppable rule, the way other files in `core/components/memory/standards/rules/` are written. Look at `feature-expectation-generation.md` and `expectation-generation.md` in that directory for the house style.

## Files to modify

### `core/components/agents/intent-resolver.md`

Make the following changes in order. Do not change anything else.

(a) **Frontmatter `description`** (line 5):
- Currently: *"Read intent.yaml, workflow template, and available agents to produce a JSON task DAG for play execution."*
- Update to mention that scenarios are now read from the Expectation artifact, not intent.yaml. Suggested wording: *"Read intent.yaml (clean triple), the play's Expectation artifact, the workflow template, and available agents to produce a JSON task DAG for play execution."*

(b) **Core Principle bullets** (lines 27–30): the current text says *"DECOMPOSE intent constraints, failure conditions, and scenarios into discrete tasks"*. Update so that the bullet decomposes intent's `constraints` and `failure_conditions`, and add a separate bullet that decomposes the Expectation's `success_scenarios` (when an `expectation_path` is provided). Keep the surrounding bullets unchanged.

(c) **Input Contract** (lines 33–47): add a new field `expectation_path` to the JSON shape, between `intent_path` and `workflow_path`. Type: string, optional. Update the prose numbered list (1, 2, 3, 4) to a 5-item list, adding the new field's description at the correct ordinal. Example wording for the new entry: *"`expectation_path` — Optional. Path to the play's Expectation artifact (`expectation.yaml`). When provided, read `success_scenarios` from this file to derive Stage 6 tasks. When absent, the resolver emits zero Stage 6 tasks rather than fabricating any from a missing intent block."*

(d) **Step 1 "Read Inputs"** (lines 115–121):
- Change point 1 from *"Extract: goal, constraints, failure conditions, and scenarios."* to *"Extract: goal, constraints, failure conditions."*
- Insert a new numbered point (renumber subsequent points) that says: *"Read expectation.yaml at `expectation_path` if provided. Extract `success_scenarios` for Stage 6 task generation. If `expectation_path` is absent, treat success_scenarios as empty."*

(e) **Step 2 "Classify Intent Elements"** (lines 124–132): the current `**Scenarios**` block sources scenarios from intent. Rewrite it to source from the Expectation artifact. Suggested wording: *"`**Success scenarios** (from the Expectation artifact when `expectation_path` is provided) become Stage 6 (Scenario Validation) tasks owned by `play`. Each success scenario maps to one task with the scenario's `measure` text in the description. When no `expectation_path` was passed, produce zero Stage 6 tasks."*

(f) **Boundaries — NEVER** (lines 200–207): add one bullet: *"Read scenarios from intent.yaml. Success scenarios live in the Expectation artifact at `expectation_path`."*

(g) **See also**, near the top of the file (after the Identity section, before Core Principle): add a one-line cross-reference: *"See also: `core/components/memory/standards/rules/builder-isolation.md` for the canonical three-element Intent model and compartmentation contract."*

Important: keep everything else in this file unchanged, including the deterministic output guarantee, the agent-assignment behavior, the dependency-graph ordering rules, and the structured-failure recovery section.

### `core/components/agents/intent-crafter.md`

Add a single one-line cross-reference: *"See also: `core/components/memory/standards/rules/builder-isolation.md` for the canonical three-element Intent model and compartmentation contract."*

Place it where the agent's authoring guidance describes what Intent contains — near the top of the agent's identity/principle section. Do not touch the deny-list, the Q&A protocol, the output schema, or anything else.

## Tasks (execution order)

1. Author `core/components/memory/standards/rules/builder-isolation.md` with all six sections in the order specified above.
2. Modify `core/components/agents/intent-resolver.md` with the seven changes (a)-(g) in order.
3. Modify `core/components/agents/intent-crafter.md` with the single cross-reference.

## Connections

`intent-resolver` is consumed by every play that resolves an intent.yaml into a task DAG. The `expectation_path` field is a NON-BREAKING addition — when absent, the resolver emits zero Stage 6 tasks rather than fabricating any. Existing callers continue to work.

The new rule file is referenced from two agent prompts but is not yet referenced from compiled play SKILL.md files. Rebuilding compiled plays is explicitly out of scope for this work.
