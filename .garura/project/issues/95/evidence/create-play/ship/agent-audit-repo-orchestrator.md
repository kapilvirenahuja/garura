## Agent Audit: repo-orchestrator

**Date:** 2026-03-06
**Play:** merge-pr, ship
**Status:** PASS (after upgrade)

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Full input/output contract documented |
| P2 STM Path Handoff | PASS | Reads from `stm.input`, writes to `stm.output` |
| P3 Intent Awareness | PASS | Reads `intent.yaml` from `intent_path` |
| P4 Structured Failure | PASS | Returns structured failure per protocol |
| P5 No Direct User Interaction | PASS | Returns to caller, never uses AskUserQuestion |
| P6 Output Contract Discipline | PASS | Returns only enriched JSON contract |
| P7 Skill Delegation | PASS | `merge-pr` skill added. Named Bash exceptions for merge/checkout/pull removed. |
| P8 Recovery and Escalation | PASS | Self-recovery max 2 attempts, then escalation |
| P9 Domain Boundaries | PASS | Stays within repo domain |
| P10 Task Graph Participation | PASS | TaskUpdate on entry/completion/failure |

### Upgrade Applied

1. Added `merge-pr` to Available Skills table
2. Added intent mapping: `"Merge PR", "merge and cleanup" → merge-pr`
3. Added skill output contract for `merge-pr` invocations
4. Removed named Bash exceptions for `gh pr merge` and `git checkout + git pull` — now covered by `merge-pr` skill
5. Added `merge-pr` to Forbidden Bash table

**Backward compatibility:** Existing plays (`commit-code`, `create-pr`) unaffected — they don't use merge operations.
