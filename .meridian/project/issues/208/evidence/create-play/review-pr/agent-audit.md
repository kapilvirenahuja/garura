# Agent Audit — review-pr

| Agent | Role | Audit Status | Source |
|---|---|---|---|
| tech-designer | Domain — Steps 1 (Context Load) and 3 (Confidence & Routing) | PASS (precedent) | Audited in prepare-implementation, fix-it; P1–P11 |
| quality-auditor | Domain — Step 2 (Scoped Quality Eval via quality-check-scoped) | PASS (precedent) | Audited in quality-check, ship; P1–P11 |
| repo-orchestrator | Domain — Step 4 (Reviewer Ranking); Utility — Pre-flight, Steps 5/6 (PR comment, evidence) | PASS (precedent) | Audited in commit-code, ship, start-feature-planning |

**Domain agent unique count:** 3 (tech-designer, quality-auditor, repo-orchestrator-as-ranker)
**L2 budget (≤5 domain):** PASS — 3/5
**Utility agents (exempt):** repo-orchestrator (when used for git/PR ops)
