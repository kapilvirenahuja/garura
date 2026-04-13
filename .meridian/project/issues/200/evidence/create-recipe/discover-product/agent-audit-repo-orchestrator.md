# Agent Audit: repo-orchestrator

**Role in recipe:** Utility agent (C5-exempt). Step 8 — evidence self-commit per ADR 012.
**Source:** `core/components/agents/repo-orchestrator.md`

## P1-P11 Results

| # | Principle | Result | Evidence |
|---|-----------|--------|----------|
| P1 | JSON contract mode | PASS | Declares Contract Mode; accepts intent_path, stm, task_id, config |
| P2 | STM path discipline | PASS | Writes only to stm.output |
| P3 | Intent reading | PASS | Reads intent.yaml from intent_path |
| P4 | Structured failure on error | PASS | Escalates with structured failure when outside domain |
| P5 | No AskUserQuestion | PASS | Explicitly forbidden in Boundaries section |
| P6 | JSON-only response | PASS | "Return ONLY the enriched JSON contract" |
| P7 | Skill delegation | PASS | Uses create-commit skill for staging/commit; forbids raw git commands |
| P8 | Self-recovery bounded | PASS | Max 2 attempts per obstacle |
| P9 | Domain boundaries | PASS | Repo domain only |
| P10 | Task graph participation | PASS | TaskUpdate on entry/completion/failure |
| P11 | Context loading | PASS | Honors ltm_context when present; falls back to core standards |

**C5 exemption:** Utility agent (not a domain agent). Does not count against the
domain-agent budget per CLAUDE.md and memory/feedback_agent_budget_scope.md.

**Overall:** PASS. No upgrades required.
