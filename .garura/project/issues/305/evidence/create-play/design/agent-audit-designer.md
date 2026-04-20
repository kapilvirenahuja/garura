# Agent Audit — designer

**File:** `core/components/agents/designer.md` (133 lines)

| Principle | Check | Verdict |
|-----------|-------|---------|
| P1 Identity | Domain + role stated | PASS |
| P2 Core principle (autonomy) | Intent + constraints loop documented | PASS |
| P3 Skill pool enumerated | Table of skills | PARTIAL — `draft-design-system` not listed |
| P4 Intent→skill mapping | Present | PARTIAL — no pattern for "design system" / "design tokens" |
| P5 Input reading protocol | Present, per-stage | PASS |
| P6 JSON contract mode | Present | PASS |
| P7 Boundaries (NEVER/ALWAYS) | Present | PARTIAL — "no visual design" NEVER clause is stale vs revised C13 (DS is now in scope as a sibling artifact) |
| P8 Recovery / self-recovery | Present | PASS |
| P9 Escalation | Present | PARTIAL — "visual-design decisions demanded" escalation row contradicts revised C13 |
| P10 Constraint-surface tags | Implicit via skill table | PASS |
| P11 Context-isolation boundaries | No cross-domain bleed | PASS |

## Gaps flagged for parent

1. Add `draft-design-system` row to the skills table (P3).
2. Add intent pattern "design system", "design tokens", "brand inspirations" → `draft-design-system` (P4).
3. Revise the NEVER clause "Add visual design elements (colors, typography stacks, spacing scales). That's out of scope." to scope only to wireframe ASCII blocks; visual-identity tokens via `draft-design-system` are now in scope as a sibling artifact (P7).
4. Remove or refactor the "Visual-design decisions demanded by the caller" escalation row (P9).

**Verdict:** PARTIAL — usable for this rebuild at the orchestration layer because the play dispatches `draft-design-system` explicitly in the JSON contract. Parent should schedule a follow-up rebake of the designer agent to land the revised C13 surface.
