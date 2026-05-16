# Agent Audit: project-orchestrator

**Context:** create-play rebake Step 4 — regression audit for issue #370.
**#370 change:** define's `intent.yaml` adds C17 (Decision Surfacing Discipline at the Phase 5 and Phase 9 human-review gates) and F11 (carrying a `surfaced_for_review` manifest entry past a gate without `user_response` is a structural violation). Both gates are play-owned. No `project-orchestrator` definition change is part of #370.

**How define uses project-orchestrator:** Phase 0 (resolve or create the anchoring GH issue via `manage-issue`) and Phase 5 on a Vanish outcome (close the Phase-0 issue via `manage-issue action=close`). It is a domain agent in define's boundary. It touches no decision manifest and participates in neither the Phase 5 surfacing logic nor Phase 9.

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | "Contract Mode" section with explicit Input Contract / Output Contract JSON, field table, and a "Rule: Never return prose, tables, or explanation to the play." define's Phase 0 and Phase-5-Vanish invocations use JSON contracts. |
| P2 STM Path Handoff | PASS | Reads `stm.input` paths, writes `stm.output` paths; "ALWAYS — Read input data from stm.input paths — never expect inline data" and "Write output artifacts to stm.output paths — never return artifacts inline." define Phase 0 passes `issue_resolution_path`; Phase-5-Vanish passes `close_record_path`. |
| P3 Intent Awareness | PASS | "Intent Loading — On entry, read intent.yaml from intent_path. Extract Constraints / Failure conditions / Scenarios"; explicitly "NOT passed as prose in the prompt and must NOT be assumed from context." define passes `intent_path` in both invocations. |
| P4 Structured Failure | PASS | "On Failure" writes structured failure to `stm.output.failure` per `structured-failure-protocol.md`; full failure YAML schema given; "Do NOT return raw errors." |
| P5 No Direct User Interaction | PASS | "NEVER — Ask user questions directly … Use AskUserQuestion tool — callers handle user interaction." No AskUserQuestion usage. |
| P6 Output Contract Discipline | PASS | "The agent returns ONLY the enriched JSON contract"; "Return prose, tables, or explanation to the play" is in the NEVER list. Enriched issue artifact (incl. agent value-add `type_hint`) goes to STM, not the return. |
| P7 Skill Delegation | PASS | Delegates to `manage-issue` and `resolve-issues` skills; "ALWAYS — Use skills for operations (not raw gh commands)"; explicit Forbidden table mapping every `gh issue` op to the `manage-issue` skill. Both skills define uses (read / resolve_or_create / close) are declared in the Available Skills table and Intent→Skill mapping. |
| P8 Recovery and Escalation | PASS | "Self-Recovery (Within Domain) — Attempt fix (max 2 attempts per obstacle) … If still failing after 2 attempts, escalate" with examples; "Escalation (Outside Domain)" writes structured failure and returns failed contract. |
| P9 Domain Boundaries | PASS | Domain is project management (issues/tracking/planning). "NEVER — Delete issues … Execute gh commands directly when a skill exists." define keeps catalog/epic work with product-keeper and commits with repo-orchestrator — project-orchestrator only does issue resolve/create/close. No crossing. |
| P10 Task Graph Participation | PASS | Dedicated "Task Graph" section: On Entry `TaskUpdate task_id → in_progress`, On Completion `→ completed`, On Failure `→ failed`, plus "On Discovering New Work — TaskCreate … addBlockedBy". Decision Framework steps 1 and 10 reiterate the transitions. define assigns T1 (and T6 on Vanish) to this agent. |
| P11 Context Sufficiency | EXEMPT | Operates entirely on JSON-contract + STM data and a GitHub API via the `manage-issue` skill — issue read/create/close need no external domain-knowledge discovery. Has a "Context Loading" section (reads `.garura/core/config.yaml`, injects platform). Falls squarely under P11's stated exemption: "Agents that ONLY operate on data fully provided in the JSON contract … may pass without a research fallback." Absence of WebSearch/WebFetch is correct for this domain, not a fail. |

## Overall: PASS

All eleven principles PASS (P11 EXEMPT per the explicit P11 exemption clause). No non-PASS findings.

### Regression verdict for #370

project-orchestrator is unaffected by the #370 C17/F11 change. It runs only in Phase 0 and on a Phase-5 Vanish; it produces no decision manifest, and the C17 surfacing logic at the Phase 5 / Phase 9 gates is orchestrator-owned and does not call this agent. Its contract, STM handoff, and task-graph behaviour as used by define remain fully conformant. No #370-introduced or #370-worsened defect; no pre-existing drift either.
