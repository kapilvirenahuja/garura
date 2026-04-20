# Agent Audit: judge

Audited against `core/components/plays/create-play/reference/audit-checklist.md` (P1-P11). Only `judge` was modified in this issue (#307) — other enhance agents (project-orchestrator, tech-designer, code-builder, quality-auditor, repo-orchestrator) are unchanged and assumed PASS per prior compilation.

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | judge.md declares Input Contract and Output Contract as JSON (lines 78-123). Superset contract with `eval_path`, `config.instructions`, `config.decryption_key` is explicit. |
| P2 STM Path Handoff | PASS | Reads from `eval_path`, `project_root`, artifact paths; writes to `stm.output.judge_report`. All I/O via paths. |
| P3 Intent Awareness | PASS | `intent_path` declared optional in contract; operating procedure references reading context. For pure eval execution intent may be omitted — acceptable. |
| P4 Structured Failure | PASS | Failure Protocol section defines `status: failed` + `domain_assessment.responsible_domain` + error types. |
| P5 No Direct User Interaction | PASS | No `AskUserQuestion` usage; operating procedure returns report to orchestrator. |
| P6 Output Contract Discipline | PASS | Returns JSON contract only; artifacts go to `judge-report.yaml` in STM. |
| P7 Skill Delegation | PASS | Declares `diff-artifacts` skill in Available Skills table; dispatches via Skill tool when `config.instructions` signals coverage check. |
| P8 Recovery and Escalation | PASS | Recovery section: max 1 internal retry, 2 attempts total, then structured failure. |
| P9 Domain Boundaries | PASS | Domain: Context-isolated evaluation. "MUST NOT Do" section enforces boundaries (no builder prompts, no CONTEXT.md, no evals-engineer reasoning). Compatible with C14/F10/C21. |
| P10 Task Graph Participation | PASS | Task Tracking section: marks task_id in_progress/completed/failed; creates sub-tasks via TaskCreate when needed. |
| P11 Context Sufficiency | EXEMPT | Agent operates entirely on contract-supplied paths (eval file, project_root, artifacts). No domain knowledge discovery required — eval-driven execution. |

**Verdict:** judge PASSES all applicable principles. Ready for use in compiled enhance play.
