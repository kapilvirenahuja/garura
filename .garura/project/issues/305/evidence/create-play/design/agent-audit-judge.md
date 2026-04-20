# Agent Audit — judge

**File:** `core/components/agents/judge.md` (362 lines)

| Principle | Check | Verdict |
|-----------|-------|---------|
| P1 Identity | Domain + role stated | PASS |
| P2 Core principle (black-box evaluator) | Present | PASS |
| P3 Mode enumeration | 4 modes (Impl, Product Artifact, Epic Confidence, I/O Coverage) | PASS |
| P4 Context-isolation discipline | Explicit — no access to builder reasoning | PASS |
| P5 Input/Output contract | Mode-specific, documented | PASS |
| P6 Boundaries | Present | PASS |
| P7 Recovery / escalation | Present | PASS |

**Verdict:** PASS. Judge is invoked in this play only in Mode 2 (Product Artifact Validation) via `validate-screen-coverage` — which is a deterministic validator. No new capability required.
