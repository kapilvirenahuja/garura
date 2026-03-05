# Agent Audit: project-orchestrator

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | FAIL | Receives recipe context as prompt text, not JSON contract with `intent_path` and `stm` paths. Returns YAML inline. |
| P2 STM Path Handoff | FAIL | No STM path handling. Data passed inline in prompts and returned inline. |
| P3 Intent Awareness | FAIL | Reads intent from recipe prompt text, not from `intent.yaml` file at `intent_path`. |
| P4 Structured Failure | PASS | References `structured-failure-protocol.md`, returns structured failures with domain assessment. |
| P5 No Direct User Interaction | PASS | Explicitly forbidden in NEVER section. |
| P6 Output Contract Discipline | FAIL | Returns enriched YAML inline. Artifacts not written to STM files. |
| P7 Skill Delegation | PASS | Delegates to `manage-issue` skill. Agent adds `type_hint` enrichment — clear agent vs skill separation. |
| P8 Recovery and Escalation | PASS | Self-recovery max 2 attempts (search by keywords, broaden terms), structured escalation. |
| P9 Domain Boundaries | PASS | Stays within project domain. Escalates infrastructure/design concerns. |
| P10 Task Graph Participation | FAIL | No mention of TaskUpdate or TaskCreate for marking tasks in_progress/completed. |

## Summary

- **Passing:** P4, P5, P7, P8, P9 (5/10)
- **Failing:** P1, P2, P3, P6, P10 (5/10)
- **Pattern:** Pre-Four Crafts agent — identical failure pattern as repo-orchestrator
