# Agent Audit: judge

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Mode 1 (Implementation Evaluation) and Mode 2 (Product Artifact Validation) both use JSON contracts per ADR 016. |
| P2 STM Path Handoff | PASS | Reads `encrypted_eval_path`, `manifest_path`, `project_root`; writes `judge_report` — all path-based. |
| P3 Intent Awareness | PASS | Mode 2 input contract includes `intent_path` indirectly via the calling play. |
| P4 Structured Failure | PASS | Returns `{status: "failed"}` with structured error. |
| P5 No Direct User Interaction | PASS | No `AskUserQuestion`. Context-isolated by design. |
| P6 Output Contract Discipline | PASS | Returns `judge_report` as a file path in the contract; no prose in responses. |
| P7 Skill Delegation | PASS | Mode 2 invokes validation skills supplied per-call via the `validation_skill` field of the input contract. Empty inventory in the agent file is intentional — skills are caller-supplied, not inventoried on the agent. |
| P8 Recovery and Escalation | PASS | Retry logic + structured failure on unrecoverable blocks. |
| P9 Domain Boundaries | PASS | Explicit context isolation rules: "What You MUST NOT Receive" list is exhaustive. |
| P10 Task Graph Participation | WARN | Same follow-up as other agents — no explicit TaskUpdate mention in the agent file, though the play that invokes judge handles task state. |
| P11 Context Sufficiency | EXEMPT | Judge operates ONLY on data fully provided in the JSON contract (eval files, source code, deployed URLs at supplied paths). It does not discover knowledge; exemption per P11 final paragraph. |

**Summary:** 10/11 PASS, 1 WARN (P10), 1 EXEMPT (P11).
