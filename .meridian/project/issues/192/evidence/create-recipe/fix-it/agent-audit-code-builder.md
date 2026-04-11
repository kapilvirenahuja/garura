## Agent Audit: code-builder

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Input contract documented with `stm.input` paths (`context_path`, `read_only_files`, `remediation_path`). Output contract documented as structured YAML implementation report. |
| P2 STM Path Handoff | PASS | Reads execution plan from `stm.input.context_path`. Reads read-only files from `stm.input.read_only_files`. Reports implementation results via contract. |
| P3 Intent Awareness | PASS | Recipe Context section: reads intent, constraints, retry context. Constraint Validation section validates every constraint before implementing. |
| P4 Structured Failure | PASS | Escalation section returns structured failure per `structured-failure-protocol.md` with `what_failed`, `why`, `domain_assessment`, `context`, `suggested_fix`. |
| P5 No Direct User Interaction | PASS | Explicit NEVER: "Ask user questions directly" and "Use AskUserQuestion tool". Returns to caller. |
| P6 Output Contract Discipline | PASS | Returns structured implementation report (YAML). Documents deviations and issues. All code changes in files, not inline. |
| P7 Skill Delegation | N-A | Code-builder IS the implementation executor. No lower-level "code writing" skills exist. Agent produces code directly — this is its core capability. |
| P8 Recovery and Escalation | PASS | Self-Recovery (Limited): max 1 attempt for own errors (syntax, imports). Escalation for design gaps, test failures in external code, missing deps. |
| P9 Domain Boundaries | PASS | Explicit NEVER for: commits, branches, PRs, issue management, documentation, config files (unless plan specifies). Only implements code per plan. |
| P10 Task Graph Participation | PASS | Task graph managed by recipe orchestrator. Agent focuses on execution. Note: Task tool not in frontmatter but recipe handles status tracking for this agent. |
| P11 Context Sufficiency | EXEMPT | Code-builder operates entirely on data provided in the contract — execution plan from STM path, read-only file list, remediation context. No external knowledge discovery needed. Pure executor. Optional `ltm_context` for coding standards is advisory only. |

**Result: 11/11 PASS (1 N-A, 1 EXEMPT)**
