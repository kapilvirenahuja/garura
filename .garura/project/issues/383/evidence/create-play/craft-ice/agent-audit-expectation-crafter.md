## Agent Audit: expectation-crafter (modified for the feature case)

Role in craft-ice: **Expectation layer** — generates success_scenarios + recovery for the feature from its intent + Context bundle, via the new `generate-feature-expectation` skill. Modified in this build to handle both the play case (draft-play-expectation) and the feature case (generate-feature-expectation), selected by the presence of a Context bundle in the contract.

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | "Input (JSON contract, ADR 016)" table + "Output" contract (`expectation_crafted`). |
| P2 STM Path Handoff | PASS | Reads `intent_path`, `stm.input.context`, `rules_path`; writes only `stm.output.expectation`; returns the path. |
| P3 Intent Awareness | PASS | Reads the intent triple at `intent_path` and derives the expectation from its constraints + failure conditions. |
| P4 Structured Failure | PASS | "Structured Failure" section returns `failure` with `domain_assessment` (e.g., responsible_domain: intent). |
| P5 No Direct User Interaction | PASS | Boundaries NEVER: "Interview the user"; generation-only, no AskUserQuestion. |
| P6 Output Contract Discipline | PASS | Returns the output contract only; "Do NOT forward the skill's YAML as your own response." |
| P7 Skill Delegation | PASS | Skill Pool delegates to `draft-play-expectation` / `generate-feature-expectation`; "never write expectation.yaml inline." |
| P8 Recovery and Escalation | PASS | Recovery section escalates a structured failure (e.g., intent has no failure_conditions). Generation is deterministic — no retry loop is meaningful; structured escalation is the correct recovery shape. |
| P9 Domain Boundaries | PASS | Expectation generation only; NEVER modifies intent, compiles SKILL.md, or authors rules; added NEVER "cross cases." |
| P10 Task Graph Participation | PASS (with note) | Does not call TaskUpdate on play-level tasks — correct under the current Task DAG ownership rule ("the play is the SOLE owner of the task DAG; agents MUST NOT call TaskUpdate on play-level tasks"). The audit checklist's literal P10 predates that rule; abstaining is the compliant behavior. |
| P11 Context Sufficiency | EXEMPT | Operates only on data provided via contract paths (intent_path, context_path, rules_path). Per P11 exemption: "Agents that ONLY operate on data fully provided in the JSON contract may pass without a research fallback." Context grounding is gathered upstream by tech-designer and handed in. |

**Verdict: PASS (10 PASS + 1 EXEMPT).** Modification (dual-case support) preserves all principles.
