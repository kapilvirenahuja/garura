# Agent Audit: repo-orchestrator

**Context:** create-play rebake Step 4 — regression audit for issue #370.
**#370 change:** define's `intent.yaml` adds C17 (Decision Surfacing Discipline at the Phase 5 and Phase 9 human-review gates) and F11 (carrying a `surfaced_for_review` manifest entry past a gate without `user_response` is a structural violation). Both gates are play-owned. No `repo-orchestrator` definition change is part of #370.

**How define uses repo-orchestrator:** Phase 1 (self-commit `brief.md` + `grounding-questions.md` once intake produces content, non-blocking) and Phase 10 (commit product-LTM updates + STM evidence per ADR 012, non-blocking on failure). It is a **utility agent** — explicitly exempt from the domain-agent budget per the audit checklist and define's own agent-boundary table — but per the checklist it "must still pass all applicable principles." It touches no decision manifest and runs after both checkpoint gates.

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | "Contract Mode" with full Input Contract / Output Contract JSON, field table, and a "Contract Processing Flow." define's Phase 1 and Phase 10 invocations use JSON contracts (Phase 10 also passes a `config` block). |
| P2 STM Path Handoff | PASS | Reads `stm.input` paths, writes `stm.output` paths; "ALWAYS — Write detailed artifacts to STM paths, not inline." define passes `commit_record` / `commit_record_path` output paths and a `files[]` list to commit. |
| P3 Intent Awareness | PASS | "Contract Processing Flow" step 2 "Read intent — Load intent.yaml from intent_path. Extract constraints, failure conditions, scenarios"; "Intent Recognition" extracts constraints from intent.yaml "not from prose in the prompt." define passes `intent_path` in both invocations. |
| P4 Structured Failure | PASS | "Escalation (Outside Domain)" writes a structured failure YAML to `stm.output` per `structured-failure-protocol.md` and returns the contract with `status:"failed"`; "Do NOT return raw errors." `error` field documented as structured failure object. |
| P5 No Direct User Interaction | PASS | "NEVER — Ask user questions directly … Use AskUserQuestion tool — callers handle user interaction." No AskUserQuestion usage. |
| P6 Output Contract Discipline | PASS | "The agent returns ONLY the enriched JSON contract. All detailed artifacts, analysis, and evidence are written to STM paths. No prose, tables, or explanation in the return value." Reinforced in NEVER list. |
| P7 Skill Delegation | PASS | Delegates to `analyze-changes`, `create-commit`, `analyze-pr`, `submit-pr`, `setup-branch`, `merge-pr`; "ALWAYS — Use skills for operations (not raw git commands)"; Forbidden table maps `git add/commit/push` to skills. define's use (`create-commit` for STM/LTM evidence commit) is the declared "Commit STM evidence files" intent → `create-commit` mapping. |
| P8 Recovery and Escalation | PASS | "Self-Recovery (Within Domain) — Attempt fix (max 2 attempts per obstacle) … If still failing after 2 attempts, escalate" with examples; "Escalation (Outside Domain)" writes structured failure and returns failed contract. |
| P9 Domain Boundaries | PASS | Domain is repository management (commits/branches/PRs/git state). "NEVER — Execute git commands directly when a skill exists." Escalation table routes issue concerns to `project → project-orchestrator` — does not manage issues itself. define keeps issue ops with project-orchestrator and catalog/epic work with product-keeper; repo-orchestrator only commits. No crossing. |
| P10 Task Graph Participation | PASS | Dedicated "Task Graph" section: On Entry `TaskUpdate task_id → "in_progress"`, On Completion `→ "completed"`, On Failure `→ "failed"`, plus "Discovering New Work — TaskCreate … TaskUpdate addBlockedBy". Decision Framework steps 2 and 12 reiterate. define assigns T11 (Phase 10) and the Phase-1 intake-commit step to this agent. |
| P11 Context Sufficiency | EXEMPT | Operates on JSON-contract + STM data plus git/GitHub via skills and read-only git Bash queries — commit/branch/PR operations need no external domain-knowledge discovery. Has a "Context Loading" section (config load, Project Convention Check against `ltm_context`, resolution trace). Falls under P11's stated exemption for agents that operate on contract-provided data; absence of WebSearch/WebFetch is correct for the repo domain, not a fail. |

## Overall: PASS

All eleven principles PASS (P11 EXEMPT per the explicit P11 exemption clause). No non-PASS findings. Utility-agent status exempts it from the domain-agent budget only; all applicable behavioural principles are met.

### Regression verdict for #370

repo-orchestrator is unaffected by the #370 C17/F11 change. It runs only in Phase 1 (intake self-commit) and Phase 10 (evidence commit) — both non-blocking and downstream of the Phase 5 / Phase 9 gates. It produces no decision manifest and is never called by the C17 surfacing logic, which is orchestrator-owned. Its contract, STM handoff, and task-graph behaviour as used by define remain fully conformant. No #370-introduced or #370-worsened defect; no pre-existing drift either.
