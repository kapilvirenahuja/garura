# G-103 Evidence: start-planned-feature IDD Compliance

**Gate:** G-103
**Play:** start-planned-feature v3.0.0
**Verified:** 2026-02-22
**Status:** PASS (20/20 criteria)

---

## Verification Summary

| # | Criterion | Status |
|---|-----------|--------|
| 1 | File exists | PASS |
| 2 | Level L2, ≤5 agent calls | PASS — 4 distinct agents, L2 declared |
| 3 | Agents: project-orchestrator, Plan, code-builder, repo-orchestrator | PASS |
| 4 | IDD intent header (intent/constraints/failure_conditions) | PASS — 11 constraints, 7 failure conditions |
| 5 | Intent: quick idea-to-PR with lightweight IDD-aware planning | PASS |
| 6 | Constraints: embeds start-feature, IDD-aware planning, CODE only | PASS |
| 7 | Failure conditions: vague intent, tests fail, Vanish | PASS |
| 8 | Embeds start-feature flow (issue + branch + STM) | PASS — Step 1 resolves issue, creates STM |
| 9 | Plan sub-agent IDD intent headers on artifacts | PASS — SPEC/VERIFY/TASKS each have IDD header |
| 10 | Lightweight artifacts (no gates, no bundles, no audience separation) | PASS |
| 11 | Artifacts at `.meridian/{issue}/planning/` | PASS |
| 12 | code-builder scoped to CODE only | PASS — routing table + workflow both explicit |
| 13 | Builds working code with tests | PASS — failure condition "Implementation fails tests" |
| 14 | Commits via repo-orchestrator (agent-first) | PASS |
| 15 | Single Tether/Vanish checkpoint | PASS — after plan, before execution |
| 16 | Agent Routing Table (Domain/Agent/Intent Slice) | PASS |
| 17 | Templates externalized (checkpoint, approval-prompt, final-report) | PASS |
| 18 | Recovery section (structured-failure-protocol + intent-driven-recovery) | PASS |
| 19 | No AskUserQuestion | PASS |
| 20 | Granular tasks with dependency graph in Plan prompt | PASS |

## Key Changes from v2.0.0

| Aspect | v2.0.0 | v3.0.0 |
|--------|--------|--------|
| Intent | "Deliver a complete feature or bug fix" | "Quick idea-to-PR with IDD-aware planning" |
| Agents | 3 (project-orch, repo-orch, code-builder) + Plan | 4 distinct (project-orch, Plan, code-builder, repo-orch) |
| Agent Routing | Tasks table format | Domain/Agent/Intent Slice format |
| Templates | Inline (535 lines) | Externalized to templates/ (291 lines) |
| Recovery | Prose escape hatches | Structured-failure-protocol + intent-driven-recovery |
| Plan artifacts | Freetext sections | IDD intent headers on each artifact |
| Tasks output | Sequential steps | Granular tasks with dependency graph |
| code-builder | Unscoped | CODE ONLY — no docs, no markdown, no config |

## Concurrent Agent Scope Fixes

- `code-builder.md`: NEVER section expanded — no docs, markdown, config, non-code artifacts
- `tech-designer.md`: NEVER section expanded — TECHNICAL design only, not product/UX/docs
