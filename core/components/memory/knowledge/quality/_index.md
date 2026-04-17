# Quality Standards

Assessment criteria for evaluating project quality across 11 dimensions. Used by the `quality-check` skill to drive parallel subagent assessments calibrated by the project's Quality Profile (QP levels 1-5).

**Three-layer search:** Subagents search Project LTM first (`{project}/.garura/core/memory/knowledge/quality/`) for project-specific overrides, then KB (`~/.garura/core/memory/knowledge/quality/`) for framework defaults.

## Checklist Convention

Each knowledge file contains an **Assessment Checklist** table:

| Column | Description |
|--------|-------------|
| ID | Category prefix + number (e.g., CODE-01, SEC-15) |
| Check Item | Specific, actionable assessment criterion |
| QP Level | Minimum QP level at which this check is relevant (L1-L5) |
| Measurement | How to verify — grep pattern, file presence, tool output |
| Tool Reference | Specific tool name for automated checking |

QP Level Scale: L1=None/Minimal, L2=Basic tooling, L3=Enforced in CI, L4=Architecture-level, L5=Formal verification.

## Contents

| # | Path | Domain | QP Dimension | Files | IDs |
|---|------|--------|-------------|-------|-----|
| 1 | `code/` | Code Quality | QP-2 (Code Quality Standards) | 4 | CODE-01 to CODE-30 |
| 2 | `testing/` | Testing | QP-1 (Testing Depth) | 3 | TEST-01 to TEST-26 |
| 3 | `security/` | Security | QP-7 (Security Testing) | 3 | SEC-01 to SEC-26 |
| 4 | `architecture/` | Architecture | Universal | 3 | ARCH-01 to ARCH-24 |
| 5 | `documentation/` | Documentation | QP-3 (Documentation Level) | 2 | DOC-01 to DOC-16 |
| 6 | `operations/` | Operations | QP-4 (CI/CD), QP-5 (Observability) | 3 | OPS-01 to OPS-24 |
| 7 | `frontend/` | Frontend | QP-6 (Accessibility) | 3 | FE-01 to FE-26 |
| 8 | `backend/` | Backend | Universal | 3 | BE-01 to BE-24 |
| 9 | `data/` | Data & Privacy | Universal | 3 | DATA-01 to DATA-24 |
| 10 | `performance/` | Performance & Reliability | Universal | 3 | PERF-01 to PERF-24 |
| 11 | `tech-debt/` | Technical Debt Governance | Universal | 3 | DEBT-01 to DEBT-24 |

**Total:** 33 knowledge files across 11 subdirectories, ~268 check items.

## When to Add Here

A file belongs in `quality/` if:
- It defines assessment criteria for evaluating project quality
- It has checklist items with QP-level thresholds
- It answers "how good is this project at X?" not "what tool should I use for X?"
- It is used by the `quality-check` skill's explore subagents
